import { execSync, spawnSync } from 'child_process';
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

// Single source for the deploy target. These were repeated inline on the pull
// and deploy lines; the verification step below has to inspect the SAME project,
// so a drift between them would silently check the wrong thing.
const VERCEL_SCOPE = 'bvc-marketing-its';
const VERCEL_PROJECT = 'bvc-app';
const PROD_ALIAS = `${VERCEL_PROJECT}.vercel.app`;

dotenv.config({ path: join(BVC_APP, '.env.local') });

// The Vercel CLI checks for a newer version on every invocation and, when stdout
// is a TTY, PROMPTS to upgrade — defaulting to YES. Under PM2 that prompt is
// auto-accepted, the CLI shells out to `npm i vercel@latest`, and npm is not on
// PM2's PATH, so it dies with `spawn npm ENOENT` and exit code -4058. That took
// down an otherwise successful deploy (2026-08-17). The CLI gates the whole
// check on this variable:
//   SHOULD_CHECK_FOR_UPDATES = !process.env.NO_UPDATE_NOTIFIER && !process.env.VERCEL
// (node_modules/vercel/dist/index.js). Setting it skips the check entirely, so no
// prompt, no npm spawn, no bogus exit code. Upgrade the CLI deliberately instead:
// npm i -D vercel@latest.
process.env.NO_UPDATE_NOTIFIER = '1';

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

// --deploy-only: skip the clean + build and upload whatever is already packaged
// in .vercel/output/. Vercel never builds — `deploy --prebuilt` only uploads —
// so when a build has already succeeded and just the upload failed, rebuilding
// for 4 minutes achieves nothing. Use it to retry a failed deploy, or to push
// the current output without re-fetching Webflow/Sitecore.
const DEPLOY_ONLY = process.argv.includes('--deploy-only');

// --data-only: the HOURLY job. Only Open Studies + Extended Education course
// data changes hourly — Sitecore syncs with Thesis in the backend and we pull it
// over GraphQL. Everything else on the site (programs, requirements, PDFs,
// navigation) is static by nature and only moves when the coursesDB cascade
// runs, which is what triggers a FULL build + deploy.
//
// So this mode refreshes the course JSON, overlays it onto the static output
// left by the last full build, and deploys. No Webflow fetch, no breadcrumbs, no
// program-requirements regeneration, no `next build`.
//
// Trade-off, deliberate: the prerendered /study/**/courses/[sisID] pages keep the
// data from the last full build. Nothing in the Webflow embeds or the published
// JSON links to those routes — the live course experience is a Webflow page
// fetching /data/*.json at runtime, which this mode DOES refresh.
//
// The fee guard still runs on --data-only (course fees are exactly what this mode
// refreshes) but is skipped on --deploy-only (no new data that run).
const DATA_ONLY = process.argv.includes('--data-only');

// The course-data directories the hourly job regenerates from scratch on every
// run. Named once because they have to be cleared in TWO places that must not
// drift: public/data (the build INPUT, cleared in step 0) and
// .vercel/output/static/data (the PACKAGE that actually ships, pruned in the
// --data-only overlay). Clearing only the first is what let five days of
// withdrawn courses keep shipping — see the prune for the full account.
//
// Split by product because the two halves of the hourly refresh now fail
// independently: Extended Education must keep publishing when Open Studies is
// broken upstream, and the prune has to follow whichever half actually ran.
const EE_DATA_DIRS = ['courses'];
const OS_DATA_DIRS = ['oScourses', 'open-studies'];
const COURSE_DATA_DIRS = [...EE_DATA_DIRS, ...OS_DATA_DIRS];

const ts = () => new Date().toISOString();

/**
 * rmSync that survives Windows file locks.
 *
 * Deleting thousands of small JSON files trips EBUSY/EPERM whenever an
 * antivirus scanner, the search indexer, or an open editor is holding a handle —
 * it is transient and clears in milliseconds. Node retries these exact codes for
 * us when asked; the default is zero retries, which is why an hourly run died on
 * a single course JSON. force:true also makes a missing path a no-op.
 */
function removeDir(dir) {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
}

/**
 * cpSync has no retry option of its own, and the overlay writes thousands of
 * small JSON files into the packaged output — same lock exposure as removeDir.
 * Re-running the copy is safe: it overwrites, so a partial pass costs nothing.
 */
async function copyWithRetry(from, to, options, attempts = 5) {
  for (let attempt = 1; ; attempt++) {
    try {
      cpSync(from, to, options);
      return;
    } catch (err) {
      const locked = err.code === 'EBUSY' || err.code === 'EPERM';
      if (!locked || attempt >= attempts) throw err;
      console.log(`[${ts()}] Copy hit ${err.code} (${err.path}) — attempt ${attempt}/${attempts}, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

function run(cmd, cwd = ROOT) {
  console.log(`\n[${ts()}] ▶ ${cmd}`);
  // windowsHide stops the shell PM2 spawns here from flashing up a console window
  // every few seconds during a run. It only covers the shells this line creates —
  // npm/turbo spawn their own nested `cmd /d /s /c` children we don't control, so
  // some windows may still appear. Harmless either way; stdio is still inherited,
  // so all output continues to reach logs/pipeline-out.log.
  execSync(cmd, { stdio: 'inherit', cwd, shell: true, windowsHide: true });
}

/**
 * Like `run`, but captures output instead of inheriting stdio, and returns the
 * exit code rather than throwing. Everything captured is echoed straight back
 * out — without that, piping would erase the deploy from logs/pipeline-out.log,
 * which is the log used to diagnose deploys in the first place.
 */
function runCapture(cmd, cwd = ROOT) {
  console.log(`\n[${ts()}] ▶ ${cmd}`);
  const r = spawnSync(cmd, {
    cwd,
    shell: true,
    windowsHide: true,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  if (out) process.stdout.write(out);
  return { code: r.status ?? 1, out };
}

const ANSI_RE = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*[A-Za-z]', 'g');
const stripAnsi = (s) => s.replace(ANSI_RE, '');

/**
 * Decide whether a deploy that exited non-zero actually published.
 *
 * The CLI has exited non-zero on deploys that reached production four times
 * between 2026-08-11 and 2026-08-14 — always `Not authorized`, always thrown
 * *after* the upload was accepted, on a post-deploy step. The deployment was
 * Ready and holding the production alias every time. Reporting those as
 * failures pages a human for a release that worked, and an alert that is wrong
 * most of the time is one nobody reads.
 *
 * So the exit code is treated as a hint, and the API as the authority: this asks
 * what the production alias is serving RIGHT NOW and requires it to be the exact
 * deployment this run created, and Ready. A genuinely failed deploy leaves the
 * alias on the previous deployment, so it still reports. Anything that cannot be
 * proven — no URL in the output, inspect erroring, alias serving something else —
 * counts as a failure.
 */
function verifyPublished(deployOut) {
  const text = stripAnsi(deployOut);
  // The CLI prints `Production   https://<project>-<hash>-<team>.vercel.app`.
  const line = text.match(/Production\s+(https:\/\/[a-z0-9.-]+\.vercel\.app)/i);
  const url =
    (line && line[1]) ||
    (text.match(/https:\/\/[a-z0-9-]+\.vercel\.app/gi) || []).find((u) => !u.endsWith(`//${PROD_ALIAS}`));
  if (!url) return { ok: false, reason: 'no deployment URL found in deploy output' };

  // Inspect the ALIAS, not our own deployment. Inspecting the deployment is not
  // sufficient: its Aliases block lists every alias it has ever been given, so a
  // superseded deployment still reports the production alias and would be waved
  // through (verified 2026-08-14 against a real superseded deployment).
  // Inspecting the alias instead resolves to whatever is serving it right now.
  const insp = runCapture(`"${VERCEL}" inspect ${PROD_ALIAS} --scope=${VERCEL_SCOPE}`, BVC_APP);
  if (insp.code !== 0) return { ok: false, url, reason: `vercel inspect exited ${insp.code}` };

  const i = stripAnsi(insp.out);
  const serving = (i.match(/^\s*url\s+(https:\/\/\S+)/im) || [])[1];
  const ready = /status\s+[^\S\n]*[●•]?\s*Ready/i.test(i);

  if (!serving) return { ok: false, url, reason: 'could not read the alias target from inspect' };
  if (serving !== url) return { ok: false, url, reason: `${PROD_ALIAS} serves ${serving}, not this run's deployment` };
  if (!ready) return { ok: false, url, reason: `${PROD_ALIAS} target is not Ready` };
  return { ok: true, url };
}

const warn = (msg) => console.warn(`[${ts()}] ${msg}`);

// notify.mjs only logs a FAILED send, so a delivered alert used to leave no
// trace at all — indistinguishable in the log from one that was never attempted.
// Log every outcome, including "not configured".
const heartbeat = async (suffix = '') => {
  if (!process.env.HEARTBEAT_URL) return false;
  const ok = await pingHeartbeat({ baseUrl: process.env.HEARTBEAT_URL, suffix, log: warn });
  if (ok) console.log(`[${ts()}] Heartbeat "${suffix || 'success'}" sent`);
  return ok;
};

/**
 * `heartbeatSignal` is the suffix sent to the monitor: '/fail' for a genuine
 * breakage, '' for "this run completed as designed" (see the fee-guard branch).
 */
async function notify(title, message, isFailure = true, heartbeatSignal = '/fail') {
  console.error(`[${ts()}] ALERT: ${title} — ${message}`);
  notifier.notify({ title, message, sound: true });
  if (!process.env.TEAMS_WEBHOOK_URL) {
    warn('Teams alert NOT sent: TEAMS_WEBHOOK_URL is not set');
  } else if (await sendTeams({ url: process.env.TEAMS_WEBHOOK_URL, title, message, isFailure, log: warn })) {
    // Accepted, not delivered: a Workflows webhook answers 202 before the flow
    // runs, so a broken flow shows up in Power Automate's run history, not here.
    console.log(`[${ts()}] Teams alert accepted by webhook`);
  }
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
  const mode = DEPLOY_ONLY
    ? 'DEPLOY ONLY: no clean, no build'
    : DATA_ONLY
      ? 'DATA ONLY: hourly course refresh, no full build'
      : (IS_PROD ? 'PROD: minified JS, logs stripped' : 'UAT/DEV: readable JS');
  console.log(`\n[${ts()}] ===== BVC pipeline started (${mode}) =====`);
  const on = (v) => (process.env[v] ? 'on' : 'OFF (unset)');
  console.log(`[${ts()}] Alerting: Teams ${on('TEAMS_WEBHOOK_URL')}, heartbeat ${on('HEARTBEAT_URL')}`);
  await heartbeat('/start');

  // Both light modes reuse the static output from the last full build.
  if (DEPLOY_ONLY || DATA_ONLY) {
    const packaged = join(BVC_APP, '.vercel', 'output', 'static');
    if (!existsSync(packaged)) {
      await notify(
        'BVC Deploy FAILED',
        `Nothing to build on: .vercel/output/static is missing. Run the full pipeline (node pipeline.mjs) first.`
      );
      process.exit(1);
    }
    console.log(`[${ts()}] ${DEPLOY_ONLY ? 'Uploading the output already packaged in' : 'Refreshing course data into'} .vercel/output/ — skipping the full build.`);
  }

  // 0. Pre-build clean — wipe stale data so removed Sitecore sections don't persist across builds.
  //    Without this, a section deleted from Sitecore leaves behind its old JSON file and
  //    the stale sisID gets deployed, causing 404s from the availability API.
  //    Skipped on --deploy-only: nothing is regenerated, so the on-disk data is left intact.
  const dataDirs = [
    join(BVC_APP, 'src', 'data', 'courses'),
    join(BVC_APP, 'src', 'data', 'oScourses'),
    ...COURSE_DATA_DIRS.map((d) => join(BVC_APP, 'public', 'data', d)),
  ];
  //
  //    Wrapped in try/catch: this runs OUTSIDE the build's error handling, so an
  //    unhandled throw here would crash the process with a stack trace and NO
  //    Teams/toast alert — a silent failure under PM2.
  try {
    for (const dir of DEPLOY_ONLY ? [] : dataDirs) {
      if (existsSync(dir)) {
        removeDir(dir);
        mkdirSync(dir, { recursive: true });
        console.log(`[${ts()}] Cleaned: ${dir.replace(ROOT, '.')}`);
      }
    }
  } catch (err) {
    await notify(
      'BVC Pre-clean FAILED',
      `Could not clear stale course data (${err.code || 'error'}: ${err.path || err.message}). ` +
        'Usually a Windows file lock — antivirus, an open editor, or a concurrent run. Nothing was deployed.'
    );
    process.exit(1);
  }

  // 1. Build — data scripts + breadcrumbs + next build → out/  (full build only)
  //    --data-only refreshes just the Sitecore course JSON and overlays it onto the
  //    last full build's package; --deploy-only builds nothing.
  //    Retries up to 3 times (60 s apart) to survive transient network/DNS blips.
  //    Packaging happens separately in 1c (full build only), so the fee guard can
  //    reject a bad dataset before we spend time copying it.
  //
  //    --cache=local: (empty permissions) = no cache read, no cache write. We used to
  //    pass --force, but that is an alias for --cache=local:w,remote:w — it skips the
  //    cache on READ while still WRITING ~200 MB of build output to .turbo/cache every
  //    run. Turbo never prunes, so an hourly cron grew the cache to 35 GB and filled the
  //    disk; the build then "succeeded" but Turbo crashed writing its report (os error
  //    112), which this script saw as a build failure. Reading is pointless here anyway
  //    (source data changes every run), so disable both directions.
  try {
    if (DATA_ONLY) {
      // The hourly refresh runs in two halves that fail INDEPENDENTLY.
      //
      // They used to be one && -chain with Open Studies at step 3, so the OS
      // empty-catalogue guard took Extended Education down with it — EE had been
      // refreshing perfectly throughout the five-day OS outage, and holding it
      // would have traded one stale product for two. Same lesson as the fee
      // guard losing its veto: a held run drops that hour's REAL changes too.
      //
      // Half 1 — Extended Education plus the shared SIS lookups. A failure here
      // is fatal: sis-data-lookup.json feeds both products, so there is nothing
      // worth publishing without it.
      await runWithRetry('npm run hourly-scripts:base', BVC_APP, 3, 60_000);

      // Half 2 — Open Studies. A failure here is ADVISORY. The deploy goes
      // ahead with freshly-built EE data and the Open Studies catalogue left
      // exactly as it was last published: stale, but coherent and still
      // registerable. That beats both alternatives — an empty OS catalogue
      // (what shipped for five days) and holding EE hostage to it. The cart
      // validates every section against the SiS on Add anyway, so a section
      // withdrawn since the last good refresh is refused at the point of sale
      // rather than sold — see "Cart availability checks" in CLAUDE.md.
      let osRefreshed = true;
      try {
        await runWithRetry('npm run hourly-scripts:os', BVC_APP, 3, 60_000);
      } catch (err) {
        osRefreshed = false;
        // heartbeat null: the run is still going and its real outcome pings a
        // few steps later. Same reasoning as the fee-anomaly alert.
        await notify(
          'BVC Open Studies refresh FAILED — deploying without it',
          'Open Studies data could not be refreshed after 3 attempts. Extended Education was ' +
            'refreshed and IS being deployed; the Open Studies catalogue keeps the data from its ' +
            'last good refresh and is going stale. Check the Credit Courses tree in Sitecore and ' +
            'the SIS sync. This repeats every hour until it is fixed.',
          true,
          null
        );
      }

      // Overlay the refreshed JSON onto the packaged output from the last full
      // build. course-outlines-pdf is excluded deliberately: 1.5 GB of files this
      // job never touches, already sitting in the package.
      const publicData = join(BVC_APP, 'public', 'data');
      const staticData = join(BVC_APP, '.vercel', 'output', 'static', 'data');

      // Prune the regenerated directories from the package BEFORE copying.
      //
      // cpSync only adds and overwrites — it has no concept of a file that
      // should no longer exist — so a course withdrawn upstream was never
      // removed from the package, and got re-uploaded every hour forever.
      // Step 0 empties public/data/<dir>, which left the package as the only
      // surviving copy: from 2026-09-09 to 2026-09-14 the site served 61
      // oScourses/*.json and 122 open-studies/*.json dated 09-09, while
      // index.json — the one file its generator rewrites unconditionally —
      // correctly reported an empty catalogue. Half the site stale, half
      // empty, and no single file disagreed with itself.
      //
      // Only regenerated directories are pruned, never staticData itself:
      // everything else under data/ has to survive — above all
      // course-outlines-pdf, 1.5 GB this job never touches and deliberately
      // excludes from the copy below.
      //
      // Ordering matters: this runs only AFTER a half has succeeded, so a
      // refusal upstream (an empty Sitecore catalogue, say) leaves that
      // product's last good files in the package, intact and still deployable.
      // Prune what a half REGENERATED, and only that. The distinction is not
      // "did we end up with data" — it is "did we get an answer".
      //
      // A half that succeeded is authoritative even when its answer is EMPTY.
      // Zero courses with sections is Sitecore saying there is no availability
      // right now, which the site is built to show (see the availability section
      // in CLAUDE.md), so its directories are pruned and republished empty. That
      // is the whole point: keeping the last non-empty catalogue is what left
      // withdrawn sections on sale behind a live Add to Cart for five days.
      //
      // A half that FAILED is a different thing entirely — the tree was
      // unreachable, or the query threw. We do not know what is available, and
      // publishing empty directories would assert "nothing is available" on no
      // evidence, taking the catalogue down over a network blip. So its
      // directories are left exactly as last published. The copy is additive, so
      // not pruning is all it takes to preserve them.
      const refreshedDirs = osRefreshed ? COURSE_DATA_DIRS : EE_DATA_DIRS;
      if (!osRefreshed) {
        console.log(`[${ts()}] Open Studies did not answer — leaving ${OS_DATA_DIRS.join(', ')} as last published rather than claiming no availability.`);
      }

      for (const dir of refreshedDirs) {
        const packaged = join(staticData, dir);
        if (existsSync(packaged)) {
          removeDir(packaged);
          console.log(`[${ts()}] Pruned from package: static/data/${dir}`);
        }
      }

      await copyWithRetry(publicData, staticData, {
        recursive: true,
        filter: (src) => !src.includes('course-outlines-pdf'),
      });

      console.log(`\n[${ts()}] Course data refreshed and overlaid into .vercel/output/`);
    } else if (!DEPLOY_ONLY) {
      await runWithRetry('npm run build:bvcapp -- --cache=local:', ROOT, 3, 60_000);
      console.log(`\n[${ts()}] Build succeeded`);
    }
  } catch (err) {
    await notify(
      DATA_ONLY ? 'BVC Course Data Refresh FAILED' : 'BVC Build FAILED',
      `${DATA_ONLY ? 'Course data refresh' : 'Build'} failed after 3 attempts at ${new Date().toLocaleTimeString()}. Deploy skipped — run pipeline.mjs manually.`
    );
    process.exit(1);
  }

  // 1b. Fee guard — compare freshly-extracted fees against the last set we
  //     deployed. The upstream SIS → Sitecore sync has been observed emitting
  //     two different datasets on alternating hourly runs; without this check
  //     the pipeline faithfully publishes whichever half it catches.
  //     Runs on a full build and on --data-only (both refresh fees); skipped on
  //     --deploy-only, which introduces no new data.
  let guard = null;
  if (!DEPLOY_ONLY) {
    guard = checkFeeGuard({
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
  }

  // 1c. Package out/ into .vercel/output/ (Vercel Build Output API v3 static
  //     format) so `vercel deploy --prebuilt` uploads without rebuilding.
  //     Full build only: --data-only already overlaid its JSON onto the existing
  //     package (above), and --deploy-only uploads the package untouched.
  if (!DATA_ONLY && !DEPLOY_ONLY) {
    try {
      const outDir = join(BVC_APP, 'out');
      const vercelOutput = join(BVC_APP, '.vercel', 'output');
      if (existsSync(vercelOutput)) removeDir(vercelOutput);
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
  }

  // 2. Upload pre-built static output — Vercel is a host only, no rebuild triggered
  try {
    run(`"${VERCEL}" pull --yes --environment=production --scope=${VERCEL_SCOPE} --project=${VERCEL_PROJECT}`, BVC_APP);

    const dep = runCapture(
      `"${VERCEL}" deploy --prebuilt --prod --scope=${VERCEL_SCOPE} --project=${VERCEL_PROJECT}`,
      BVC_APP
    );
    if (dep.code !== 0) {
      // Non-zero is not proof of failure here — see verifyPublished().
      const v = verifyPublished(dep.out);
      if (!v.ok) throw new Error(`deploy exited ${dep.code} and could not be verified (${v.reason})`);
      warn(
        `Deploy CLI exited ${dep.code}, but ${v.url} is Ready and holds ${PROD_ALIAS} — ` +
          `publishing succeeded. Treating as success.`
      );
      // Worth a human look (the CLI is erroring on a working deploy) but NOT a
      // failure, so the heartbeat is left to the real outcome below.
      await notify(
        'BVC deploy CLI errored — published anyway',
        `vercel deploy exited ${dep.code}, but ${v.url} is Ready and serving ${PROD_ALIAS}, ` +
          `so the release did reach the site. Known intermittent "Not authorized" thrown after ` +
          `the upload is accepted. No action needed unless this becomes constant.`,
        true,
        null
      );
    }
    console.log(`\n[${ts()}] Deploy succeeded`);
    // Advance the fee baseline only now — a failed run must leave it pointing at
    // the last dataset that actually reached the site. Since the guard no longer
    // vetoes, this normally advances every run, which is what makes the anomaly
    // report mean "changed since last publish" rather than "since some older run".
    // Skipped on --deploy-only, where the guard never ran.
    if (guard) guard.commit();
  } catch (err) {
    await notify(
      'BVC Deploy FAILED',
      `Deploy failed at ${new Date().toLocaleTimeString()}. Data is built locally — re-run deploy manually.`
    );
    process.exit(1);
  }

  // 3. Clean up intermediate data files (courses, oScourses, sis-data, etc.).
  //    Skipped on --deploy-only: nothing was generated this run, and the files
  //    on disk may be the inputs for a later manual build.
  if (!DEPLOY_ONLY) {
    try {
      run('node scripts/cleanup-data.mjs', BVC_APP);
    } catch (err) {
      console.warn(`[${ts()}] Cleanup warning (non-fatal):`, err.message);
    }
  }

  // 4. Tell the monitor we made it. Missing this ping is what raises the alarm
  //    when the pipeline stops running altogether.
  await heartbeat();

  console.log(`[${ts()}] ===== Pipeline complete =====\n`);
}

main();
