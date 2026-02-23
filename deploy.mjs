import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load .env file
dotenv.config({ path: join(__dirname, '.env') });
const app = process.argv[2]; // 'jamstack' or 'bvcapp'
if (!app || !['jamstack', 'bvcapp'].includes(app)) {
  console.error('Usage: node deploy.mjs [jamstack|bvcapp]');
  process.exit(1);
}
const appDir = app === 'jamstack' ? 'src/nextjs-jamstack' : 'src/bvc-app';
const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('VERCEL_TOKEN not found in .env file');
  process.exit(1);
}
console.log(`Deploying ${app}...`);
try {
  execSync(
    `vercel --scope=bvc-marketing-its --prod --token=${token}`,
    { cwd: join(__dirname, appDir), stdio: 'inherit' }
  );
  console.log(`✓ ${app} deployed successfully`);
} catch (error) {
  console.error(`✗ ${app} deployment failed`);
  process.exit(1);
}
