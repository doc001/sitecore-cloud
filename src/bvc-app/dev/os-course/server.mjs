// dev/os-course/server.mjs
// Local sandbox for the OS-Course cart script. Zero dependencies.
//
//   node dev/os-course/server.mjs            then open http://localhost:4321
//
// Serves:
//   /                       -> dev/os-course/index.html (mimics the Webflow page)
//   /js/os-course.js        -> ../../public/js/os-course.js (the built, minified file)
//   /data/*                 -> dev/os-course/mock/data/* (mock fixtures)
//   /api/mstoken     (POST)  -> mock Microsoft token
//   /api/bvcpayment  (GET)   -> mock availability + fee responses
//
// This whole folder lives OUTSIDE public/, so it is never deployed by the
// static export — it exists purely for local development.
import http from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '../..'); // src/bvc-app
const PORT = process.env.OS_COURSE_PORT || 4321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store', // always serve the freshest build while developing
    ...headers,
  });
  res.end(body);
}

async function serveFile(res, filePath) {
  if (!existsSync(filePath)) return send(res, 404, `Not found: ${filePath}`);
  const ext = path.extname(filePath);
  const data = await readFile(filePath);
  send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
}

// ---- Mock API responses -----------------------------------------------------
function mockBvcPayment(endpoint) {
  // Availability check: thesissitecorexm.api/courseofferings/<sku>
  if (endpoint.includes('courseofferings/')) {
    return { status: 200, body: { seatsAreAvailable: true, seatsAvailable: 12 } };
  }
  // Fee calc: thesissitecorexm.api/fee/<sku1,sku2,...>/<id>  (id required int, was `null`)
  if (endpoint.includes('fee/')) {
    const skus = (endpoint.split('fee/')[1] || '').split('/')[0].split(',').filter(Boolean);
    const fees = skus.map((sku) => ({
      courseSku: sku,
      description: 'Student Services Fee',
      amount: 75,
      tax: 0,
    }));
    return { status: 200, body: fees };
  }
  return { status: 404, body: { error: 'Unmocked endpoint: ' + endpoint } };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === 'OPTIONS') return send(res, 204, '');

  // --- Mock APIs ---
  if (pathname === '/api/mstoken' && req.method === 'POST') {
    return send(res, 200, JSON.stringify({ access_token: 'mock-token-' + Date.now(), token_type: 'Bearer', expires_in: 3600 }), {
      'Content-Type': 'application/json',
    });
  }
  if (pathname === '/api/bvcpayment' && req.method === 'GET') {
    const endpoint = url.searchParams.get('endpoint') || '';
    const { status, body } = mockBvcPayment(endpoint);
    return send(res, status, JSON.stringify(body), { 'Content-Type': 'application/json' });
  }

  // --- The built script + styles (served from public/) ---
  if (pathname === '/js/os-course.js') {
    return serveFile(res, path.join(appRoot, 'public/js/os-course.js'));
  }
  if (pathname === '/css/os-course.css') {
    return serveFile(res, path.join(appRoot, 'public/css/os-course.css'));
  }

  // --- Mock data fixtures ---
  if (pathname.startsWith('/data/')) {
    return serveFile(res, path.join(__dirname, 'mock', pathname));
  }

  // --- Harness page ---
  if (pathname === '/' || pathname === '/index.html') {
    return serveFile(res, path.join(__dirname, 'index.html'));
  }

  // --- Anything else under the sandbox folder (css, etc.) ---
  return serveFile(res, path.join(__dirname, pathname));
});

server.listen(PORT, () => {
  console.log(`\n🧪 OS-Course sandbox running:  http://localhost:${PORT}\n`);
  console.log('   Mock APIs : /api/mstoken (POST), /api/bvcpayment (GET)');
  console.log('   Mock data : dev/os-course/mock/data/*');
  console.log('   Script    : public/js/os-course.js (run "npm run js:watch" in another terminal)\n');
});
