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
const DATA_ONLY = process.argv.includes('--data-only');

const ts = () => new Date().toISOString();

function run(cmd, cwd = ROOT) {
  console.log(`\n[${ts()}] ▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd, shell: true });
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
  const mode = DEPLOY_ONLY
    ? 'DEPLOY ONLY: no clean, no build'
    : DATA_ONLY
      ? 'DATA ONLY: hourly course refresh, no full build'
      : (IS_PROD ? 'PROD: minified JS, logs stripped' : 'UAT/DEV: readable JS');
  console.log(`\n[${ts()}] ===== BVC pipeline started (${mode}) =====`);

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
  const dataDirs = [
    join(BVC_APP, 'src', 'data', 'courses'),
    join(BVC_APP, 'src', 'data', 'oScourses'),
    join(BVC_APP, 'public', 'data', 'courses'),
    join(BVC_APP, 'public', 'data', 'oScourses'),
    join(BVC_APP, 'public', 'data', 'open-studies'),
  ];
  for (const dir of DEPLOY_ONLY ? [] : dataDirs) {
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
    if (DATA_ONLY) {
      // Sitecore/Thesis course data only, then mirror src/data → public/data.
      await runWithRetry('npm run hourly-scripts', BVC_APP, 3, 60_000);

      // Overlay the refreshed JSON onto the packaged output from the last full
      // build. course-outlines-pdf is excluded deliberately: 1.5 GB of files this
      // job never touches, already sitting in the package.
      const publicData = join(BVC_APP, 'public', 'data');
      const staticData = join(BVC_APP, '.vercel', 'output', 'static', 'data');
      cpSync(publicData, staticData, {
        recursive: true,
        filter: (src) => !src.includes('course-outlines-pdf'),
      });

      console.log(`\n[${ts()}] Course data refreshed and overlaid into .vercel/output/`);
    } else if (!DEPLOY_ONLY) {
      await runWithRetry('npm run build:bvcapp -- --cache=local:', ROOT, 3, 60_000);

      const outDir = join(BVC_APP, 'out');
      const vercelOutput = join(BVC_APP, '.vercel', 'output');
      if (existsSync(vercelOutput)) rmSync(vercelOutput, { recursive: true });
      mkdirSync(join(vercelOutput, 'static'), { recursive: true });
      writeFileSync(join(vercelOutput, 'config.json'), JSON.stringify({ version: 3 }));
      cpSync(outDir, join(vercelOutput, 'static'), { recursive: true });

      console.log(`\n[${ts()}] Build + package succeeded`);
    }
  } catch (err) {
    await notify(
      DATA_ONLY ? 'BVC Course Data Refresh FAILED' : 'BVC Build FAILED',
      `${DATA_ONLY ? 'Course data refresh' : 'Build'} failed after 3 attempts at ${new Date().toLocaleTimeString()}. Deploy skipped — run pipeline.mjs manually.`
    );
    process.exit(1);
  }

  // 2. Upload pre-built static output — Vercel is a host only, no rebuild triggered
  try {
    run(`"${VERCEL}" pull --yes --environment=production --scope=bvc-marketing-its --project=bvc-app`, BVC_APP);
    run(`"${VERCEL}" deploy --prebuilt --prod --scope=bvc-marketing-its --project=bvc-app`, BVC_APP);
    console.log(`\n[${ts()}] Deploy succeeded`);
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

  console.log(`[${ts()}] ===== Pipeline complete =====\n`);
}

main();
