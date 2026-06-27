import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'fs';
import notifier from 'node-notifier';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BVC_APP = join(ROOT, 'src', 'bvc-app');
const VERCEL = join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'vercel.cmd' : 'vercel');

const ts = () => new Date().toISOString();

function run(cmd, cwd = ROOT) {
  console.log(`\n[${ts()}] ▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd, shell: true });
}

function notify(title, message) {
  console.error(`[${ts()}] ALERT: ${title} — ${message}`);
  notifier.notify({ title, message, sound: true });
}

console.log(`\n[${ts()}] ===== BVC hourly pipeline started =====`);

// 1. Build — data scripts + breadcrumbs + next build → out/
//    Then package out/ into .vercel/output/ (Vercel Build Output API v3).
//    This lets vercel deploy --prebuilt upload static files directly — no Vercel rebuild.
try {
  run('npm run build:bvcapp -- --force');

  const outDir = join(BVC_APP, 'out');
  const vercelOutput = join(BVC_APP, '.vercel', 'output');
  if (existsSync(vercelOutput)) rmSync(vercelOutput, { recursive: true });
  mkdirSync(join(vercelOutput, 'static'), { recursive: true });
  writeFileSync(join(vercelOutput, 'config.json'), JSON.stringify({ version: 3 }));
  cpSync(outDir, join(vercelOutput, 'static'), { recursive: true });

  console.log(`\n[${ts()}] Build + package succeeded`);
} catch (err) {
  notify(
    'BVC Build FAILED',
    `Build failed at ${new Date().toLocaleTimeString()}. Deploy skipped — run pipeline.mjs manually.`
  );
  process.exit(1);
}

// 2. Upload pre-built static output — Vercel is a host only, no rebuild triggered
try {
  run(`"${VERCEL}" pull --yes --environment=production --scope=bvc-marketing-its --project=bvc-thesis`, BVC_APP);
  run(`"${VERCEL}" deploy --prebuilt --prod --scope=bvc-marketing-its --project=bvc-thesis`, BVC_APP);
  console.log(`\n[${ts()}] Deploy succeeded`);
} catch (err) {
  notify(
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
