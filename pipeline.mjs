import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'fs';
import notifier from 'node-notifier';
import dotenv from 'dotenv';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BVC_APP = join(ROOT, 'src', 'bvc-app');
const VERCEL = join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'vercel.cmd' : 'vercel');

dotenv.config({ path: join(BVC_APP, '.env.local') });

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

async function notifyTeams(title, message, isFailure = true) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        themeColor: isFailure ? 'FF0000' : '00C853',
        summary: title,
        title,
        text: message,
      }),
    });
  } catch (err) {
    console.warn(`[${ts()}] Teams notification failed: ${err.message}`);
  }
}

async function notify(title, message, isFailure = true) {
  console.error(`[${ts()}] ALERT: ${title} — ${message}`);
  notifier.notify({ title, message, sound: true });
  await notifyTeams(title, message, isFailure);
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
  //    Then package out/ into .vercel/output/ (Vercel Build Output API v3 static format).
  //    This lets vercel deploy --prebuilt upload static files directly — no Vercel rebuild.
  //    Retries up to 3 times (60 s apart) to survive transient network/DNS blips.
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

    const outDir = join(BVC_APP, 'out');
    const vercelOutput = join(BVC_APP, '.vercel', 'output');
    if (existsSync(vercelOutput)) rmSync(vercelOutput, { recursive: true });
    mkdirSync(join(vercelOutput, 'static'), { recursive: true });
    writeFileSync(join(vercelOutput, 'config.json'), JSON.stringify({ version: 3 }));
    cpSync(outDir, join(vercelOutput, 'static'), { recursive: true });

    console.log(`\n[${ts()}] Build + package succeeded`);
  } catch (err) {
    await notify(
      'BVC Build FAILED',
      `Build failed after 3 attempts at ${new Date().toLocaleTimeString()}. Deploy skipped — run pipeline.mjs manually.`
    );
    process.exit(1);
  }

  // 2. Upload pre-built static output — Vercel is a host only, no rebuild triggered
  try {
    run(`"${VERCEL}" pull --yes --environment=production --scope=bvc-marketing-its --project=bvc-app-uat`, BVC_APP);
    run(`"${VERCEL}" deploy --prebuilt --prod --scope=bvc-marketing-its --project=bvc-app-uat`, BVC_APP);
    console.log(`\n[${ts()}] Deploy succeeded`);
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

  console.log(`[${ts()}] ===== Pipeline complete =====\n`);
}

main();
