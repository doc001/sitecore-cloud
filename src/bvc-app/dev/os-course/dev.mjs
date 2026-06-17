// dev/os-course/dev.mjs
// One command to develop the cart script locally:
//   - runs esbuild in watch mode (rebuilds minified public/js/os-course.js on save)
//   - runs the mock sandbox server
// Zero dependencies; just spawns the two existing node scripts.
//
//   npm run os-course:dev   ->  http://localhost:4321
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '../..');
const node = process.execPath;

function run(label, scriptRelToAppRoot, args = []) {
  const child = spawn(node, [path.join(appRoot, scriptRelToAppRoot), ...args], {
    cwd: appRoot,
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    console.log(`[${label}] exited with code ${code}`);
    process.exit(code ?? 0);
  });
  return child;
}

const watcher = run('watch', 'scripts/build-os-course.mjs', ['--watch']);
const server = run('server', 'dev/os-course/server.mjs');

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    watcher.kill();
    server.kill();
    process.exit(0);
  });
}
