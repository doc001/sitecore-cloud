import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'fs';
import notifier from 'node-notifier';
import dotenv from 'dotenv';
import { checkFeeGuard } from './fee-guard.mjs';
import { sendTeams, pingHeartbeat } from './notify.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BVC_APP = join(ROOT, 'src', 'bvc-app');
const VERCEL = join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'vercel.cmd' : 'vercel');

dotenv.config({ path: join(BVC_APP, '.env.local') });

// Fee guard — reports when a suspiciously large share of course sections change
// price in a single run (see fee-guard.mjs for the why).
//
// ADVISORY ONLY. It used to hold the deploy (exit 2) and leave the site on the
// previous data. That traded one failure for a worse one: Sitecore publishes
// hourly, so a held run drops that hour's *real* content changes too, not just
// the suspect prices — and while the upstream sync flips, roughly every second
// run was held, so the site silently fell hours behind. Detection and reporting
// are unchanged; only the veto is gone.
const FEE_BASELINE = join(ROOT, '.pipeline-state', 'fee-baseline.json');
const SKIP_FEE_GUARD = process.argv.includes('--skip-fee-guard') || process.env.SKIP_FEE_GUARD === '1';
const FEE_GUARD_THRESHOLD = Number(process.env.FEE_GUARD_THRESHOLD ?? 0.25);
const FEE_GUARD_MIN_CHANGED = Number(process.env.FEE_GUARD_MIN_CHANGED ?? 10);

// PROD deploys minify + strip console from the Webflow embed bundles
// (os-course.js / ee-course.js / checkout.js). UAT/DEV deploys leave them
// readable for debugging. `STRIP_DEBUG=true` is read by scripts/build-os-course.mjs
// (declared in turbo.json `env` so it reaches the build task in strict env mode).
const IS_PROD = process.argv.includes('--prod') || process.env.STRIP_DEBUG === 'true';
if (IS_PROD) process.env.STRIP_DEBUG = 'true';

const ts = () => new Date().toISOString();

function run(cmd, cwd = ROOT) {
  console.log(`\n[${ts()}] ▶ ${cmd}`);
  // windowsHide stops the shell PM2 spawns here from flashing up a console window
  // every few seconds during a run. It only covers the shells this line creates —
  // npm/turbo spawn their own nested `cmd /d /s /c` children we don't control, so
  // some windows may still appear. Harmless either way; stdio is still inherited,
  // so all output continues to reach logs/pipeline-out.log.
  execSync(cmd, { stdio: 'inherit', cwd, shell: true, windowsHide: true });
}

const warn = (msg) => console.warn(`[${ts()}] ${msg}`);

const heartbeat = (suffix = '') =>
  pingHeartbeat({ baseUrl: process.env.HEARTBEAT_URL, suffix, log: warn });

/**
 * `heartbeatSignal` is the suffix sent to the monitor: '/fail' for a genuine
 * breakage, '' for "this run completed as designed" (see the fee-guard branch).
 */
async function notify(title, message, isFailure = true, heartbeatSignal = '/fail') {
  console.error(`[${ts()}] ALERT: ${title} — ${message}`);
  notifier.notify({ title, message, sound: true });
  await sendTeams({ url: process.env.TEAMS_WEBHOOK_URL, title, message, isFailure, log: warn });
  // `null` means "report this, but do not touch the monitor": the run is still
  // going and its real outcome will ping at the end. Anything else pings now, so
  // the monitor alerts immediately instead of waiting for a ping to go missing.
  if (heartbeatSignal === null) return;
  await heartbeat(heartbeatSignal);
}

async function runWithRetry(cmd, cwd = ROOT, maxAttempts = 3, retryDelayMs = 60_000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      run(cmd, cwd);
      return;
    } catch (err) {
      if (attempt < maxAttempts) {
        console.log(`\n[${ts()}] Attempt ${attempt}/${maxAttempts} failed — retrying in ${retryDelayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  console.log(`\n[${ts()}] ===== BVC hourly pipeline started (${IS_PROD ? 'PROD: minified JS, logs stripped' : 'UAT/DEV: readable JS'}) =====`);
  await heartbeat('/start');

  // 0. Pre-build clean — wipe stale data so removed Sitecore sections don't persist across builds.
  //    Without this, a section deleted from Sitecore leaves behind its old JSON file and
  //    the stale sisID gets deployed, causing 404s from the availability API.
  const dataDirs = [
    join(BVC_APP, 'src', 'data', 'courses'),
    join(BVC_APP, 'src', 'data', 'oScourses'),
    join(BVC_APP, 'public', 'data', 'courses'),
    join(BVC_APP, 'public', 'data', 'oScourses'),
    join(BVC_APP, 'public', 'data', 'open-studies'),
  ];
  for (const dir of dataDirs) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true });
      mkdirSync(dir, { recursive: true });
      console.log(`[${ts()}] Cleaned: ${dir.replace(ROOT, '.')}`);
    }
  }

  // 1. Build — data scripts + breadcrumbs + next build → out/
  //    Retries up to 3 times (60 s apart) to survive transient network/DNS blips.
  //    Packaging happens separately in 1c, so the fee guard can reject a bad
  //    dataset before we spend time copying it.
  //
  //    --cache=local: (empty permissions) = no cache read, no cache write. We used to
  //    pass --force, but that is an alias for --cache=local:w,remote:w — it skips the
  //    cache on READ while still WRITING ~200 MB of build output to .turbo/cache every
  //    run. Turbo never prunes, so an hourly cron grew the cache to 35 GB and filled the
  //    disk; the build then "succeeded" but Turbo crashed writing its report (os error
  //    112), which this script saw as a build failure. Reading is pointless here anyway
  //    (source data changes every run), so disable both directions.
  try {
    await runWithRetry('npm run build:bvcapp -- --cache=local:', ROOT, 3, 60_000);
    console.log(`\n[${ts()}] Build succeeded`);
  } catch (err) {
    await notify(
      'BVC Build FAILED',
      `Build failed after 3 attempts at ${new Date().toLocaleTimeString()}. Deploy skipped — run pipeline.mjs manually.`
    );
    process.exit(1);
  }

  // 1b. Fee guard — compare freshly-extracted fees against the last set we
  //     deployed. The upstream SIS → Sitecore sync has been observed emitting
  //     two different datasets on alternating hourly runs; without this check
  //     the pipeline faithfully publishes whichever half it catches.
  const guard = checkFeeGuard({
    bvcAppDir: BVC_APP,
    statePath: FEE_BASELINE,
    threshold: FEE_GUARD_THRESHOLD,
    minChanged: FEE_GUARD_MIN_CHANGED,
    skip: SKIP_FEE_GUARD,
    log: (msg) => console.log(`[${ts()}] ${msg}`),
  });

  if (!guard.ok) {
    // Report and keep going. The heartbeat suffix is `null` on purpose: this run
    // has not finished, and its genuine outcome — deployed or failed — sends the
    // real ping further down. Pinging here would tell the monitor the run is
    // over while it is still working.
    //
    // isFailure stays true so the Teams card renders in the attention colour: an
    // anomaly is still something a human should look at, it just no longer stops
    // the release.
    await notify(
      'BVC fee anomaly — PUBLISHED anyway',
      `${guard.reason}. Possibly an upstream SIS→Sitecore sync fault rather than a real ` +
        `price change — but the deploy was NOT held, so these prices are going live. ` +
        `Verify in Sitecore; see fee-watch-history.jsonl for when upstream last wrote.`,
      true,
      null
    );
  }

  // 1c. Package out/ into .vercel/output/ (Vercel Build Output API v3 static
  //     format) so `vercel deploy --prebuilt` uploads without rebuilding.
  try {
    const outDir = join(BVC_APP, 'out');
    const vercelOutput = join(BVC_APP, '.vercel', 'output');
    if (existsSync(vercelOutput)) rmSync(vercelOutput, { recursive: true });
    mkdirSync(join(vercelOutput, 'static'), { recursive: true });
    writeFileSync(join(vercelOutput, 'config.json'), JSON.stringify({ version: 3 }));
    cpSync(outDir, join(vercelOutput, 'static'), { recursive: true });

    console.log(`\n[${ts()}] Package succeeded`);
  } catch (err) {
    await notify(
      'BVC Package FAILED',
      `Packaging out/ failed at ${new Date().toLocaleTimeString()}. Deploy skipped — run pipeline.mjs manually.`
    );
    process.exit(1);
  }

  // 2. Upload pre-built static output — Vercel is a host only, no rebuild triggered
  try {
    run(`"${VERCEL}" pull --yes --environment=production --scope=bvc-marketing-its --project=bvc-app-uat`, BVC_APP);
    run(`"${VERCEL}" deploy --prebuilt --prod --scope=bvc-marketing-its --project=bvc-app-uat`, BVC_APP);
    console.log(`\n[${ts()}] Deploy succeeded`);
    // Advance the fee baseline only now — a failed run must leave it pointing at
    // the last dataset that actually reached the site. Since the guard no longer
    // vetoes, this normally advances every run, which is what makes the anomaly
    // report mean "changed since last publish" rather than "since some older run".
    guard.commit();
  } catch (err) {
    await notify(
      'BVC Deploy FAILED',
      `Deploy failed at ${new Date().toLocaleTimeString()}. Data is built locally — re-run deploy manually.`
    );
    process.exit(1);
  }

  // 3. Clean up intermediate data files (courses, oScourses, sis-data, etc.)
  try {
    run('node scripts/cleanup-data.mjs', BVC_APP);
  } catch (err) {
    console.warn(`[${ts()}] Cleanup warning (non-fatal):`, err.message);
  }

  // 4. Tell the monitor we made it. Missing this ping is what raises the alarm
  //    when the pipeline stops running altogether.
  await heartbeat();

  console.log(`[${ts()}] ===== Pipeline complete =====\n`);
}

main();
