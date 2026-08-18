// /scripts/fetch-webflow-collections.mjs

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 1. Import and configure dotenv FIRST (absolute paths!)
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try .env.local first, then fallback to .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import fetch from 'node-fetch'; // node-fetch polyfill for Node 16+ compatibility

const API_KEY = process.env.WEBFLOW_API_KEY;
if (!API_KEY) throw new Error('WEBFLOW_API_KEY not set in environment');

const BASE_URL = 'https://api.webflow.com/v2';
const SITE_ID = '66a28fdfe76f2f849d7b00f3'; // Your Webflow site ID

const COLLECTIONS = [
  // ... (your collection objects here—copy from above)
    { name: 'Program types', id: '66e8483e5367131c8c1f157b' },
    { name: 'Program Statuses', id: '66e84b7f466a2e7548256e3f' },
    { name: 'Programs', id: '66e850bcbf766fccf5d09a24' },
    { name: 'Program Durations', id: '66e8515285e71591257e50e7' },
    { name: 'Course deliveries', id: '66e852a4f42d06efa20d814c' },
    { name: 'Program Availability Configs', id: '66e8607c8f4c0cd9dfcca131' },
    { name: 'Program areas', id: '66e88fcaccaaf351c8156d0f' },
    { name: 'Schools', id: '66e890cab0dd0249a4c7ad82' },
    { name: 'Type of students', id: '66e8adaefe12c30c6dca95e6' },
    { name: 'Program intakes', id: '66eae6dfc341b44c0a951b5b' },
    { name: 'Campus', id: '66f1cb8ef83c26d5b34af98e' },
    { name: 'Stories', id: '67225d976a61a68d0d0e854f' },
    { name: 'News Categories', id: '672293fb904c75aa96335bdf' },
    { name: 'Events', id: '6757269f57edc764774784c2' },
    { name: 'Event types', id: '675726c1bb3125627441bb99' },
    { name: 'Events Locations', id: '67572b02b022226963da679d' },
    { name: 'Videos', id: '6765bc6f2f11625e349abe7a' },
    { name: 'Programs Additional Fees', id: '677ef16e3d99788155da70d8' },
    { name: 'Program Courses And Tuitions Fees Per Terms', id: '677ef3666371605a8d79568a' },
    // 'Requirements' (678185f4…) and 'Requirement categories' (678189f1…) were
    // deleted from Webflow — both IDs 404. Their last successful fetch was
    // 2026-04-09 and nothing in the app reads them. Removed 2026-08-12.
    { name: 'Program Term Numbers', id: '678541ef844f17a7fce0ce02' },
    { name: 'Courses', id: '678557c6de5ecf01f3e67171' },
    { name: 'Members', id: '67897827e6895f9780f07a2f' },
    { name: 'Members Rols', id: '6789783f36e0c7bd37222809' },
    { name: 'Departments', id: '67897f34540641a435594d98' },
    { name: 'Course offerings', id: '67b8ea8feb02295cdaa6a09f' },
    { name: 'Course time blocks', id: '67b8ef2c0a226c19e547bf14' },
    { name: 'Course day of the weeks', id: '67b8ef6dc1d1ab190e08e34a' },
    { name: 'Programs and Courses categories', id: '67bcb184c582a29c9d1a90b8' },
    { name: 'Ar-categories', id: '67c62389e4a2b04fee5a9b06' },
    { name: 'Ar projects', id: '67c62bcd692042204d413ec6' },
    { name: 'Ar partners', id: '67c65b8f6cb8b28d80a365ab' },
    { name: 'Ar funders', id: '67c66701c2455cc33078d634' },
    { name: 'Extended Educations', id: '67d84b77a7c14e2dc1660666' },
    { name: 'Open Studies', id: '67e1d2cf8ff92fb037384df3' },
    { name: 'News Releases', id: '67f038358c7264210a1af77f' },
    { name: 'Course Delivery Modes', id: '684c49815fb58405337262cb' },
    { name: 'Extended Education Certifcates', id: '685c6f21298c5a6ec507ef85' },
    { name: 'News Release Authors', id: '688151625e3f7d9e59600a37' }
];

const dataDir = path.join(__dirname, '../src/data/cms');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function cleanFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function saveToFile(data, filename) {
  const filePath = path.join(dataDir, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Saved to ${filePath} (${fs.statSync(filePath).size} bytes)`);
}

async function fetchAllCollectionItems(siteId, collectionId) {
  let allItems = [];
  let offset = 0;
  const limit = 100;
  let total = Infinity;
  const url = `${BASE_URL}/sites/${siteId}/collections/${collectionId}/items`;

  do {
    const pageUrl = `${url}?offset=${offset}&limit=${limit}`;
    const resp = await fetch(pageUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Failed to fetch items: ${resp.status} ${resp.statusText} - ${errorText}`);
    }
    const data = await resp.json();
    allItems.push(...(data.items ?? []));
    offset += (data.items?.length ?? 0);
    total = data.pagination?.total ?? allItems.length;
    if ((data.items?.length ?? 0) === 0) break;
  } while (allItems.length < total);

  return { items: allItems };
}

function writeManifest(fetched, siteId, fetchedAt) {
  const manifest = {
    siteId,
    fetchedAt,
    collections: fetched.map(({ name, filename, data }) => ({
      name,
      file: `${filename}.json`,
      items: data.items.length,
    })),
  };
  const filePath = path.join(dataDir, '_fetch-manifest.json');
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
  console.log(`🧾 Wrote ${filePath}`);
}

async function fetchAllCollections(siteId = SITE_ID, collections = COLLECTIONS) {
  console.log(`🌐 Site ID: ${siteId}`);
  const fetched = [];
  const failed = [];

  for (const { name, id } of collections) {
    console.log(`\n🚀 Fetching collection: "${name}" (ID: ${id})`);
    try {
      const data = await fetchAllCollectionItems(siteId, id);
      fetched.push({ name, filename: cleanFilename(name), data });
      console.log(`🎉 Fetched: "${name}" (${data.items.length} items)`);
    } catch (err) {
      console.error(`❌ Failed: "${name}" —`, err.message);
      failed.push(name);
      continue; // Keep going so one run reports every broken collection.
    }
  }

  // All-or-nothing. Writing only the collections that succeeded leaves the data
  // dir at mixed vintages — some files current, others months old — and every
  // downstream build then reads stale JSON that looks perfectly valid.
  if (failed.length > 0) {
    console.error(
      `\n⛔ Nothing written. ${failed.length} of ${collections.length} collection(s) failed;` +
        ` the existing files in ${dataDir} are unchanged and now known-stale.`
    );
    return failed;
  }

  for (const { name, filename, data } of fetched) {
    saveToFile(data, filename);
    console.log(`   "${name}" → ${filename}.json`);
  }
  writeManifest(fetched, siteId, new Date().toISOString());
  console.log('✨ All collections processed.');
  return failed;
}

// Entrypoint: Only runs if executed, not imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      const failed = await fetchAllCollections();
      if (failed.length > 0) {
        console.error(`\n❌ ${failed.length} collection(s) failed to fetch: ${failed.join(', ')}`);
        console.error('No files were written. Exiting non-zero to prevent shipping stale CMS data.');
        process.exit(1);
      }
      process.exit(0);
    } catch (err) {
      console.error('💥 Script failed:', err);
      process.exit(1);
    }
  })();
}

export { fetchAllCollections, fetchAllCollectionItems };
