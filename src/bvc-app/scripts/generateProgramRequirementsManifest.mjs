#!/usr/bin/env node
/*
 * Builds src/data/static/program-requirements-manifest.json — a map from
 * URL slug (last segment of the BVC program page path) to the matching
 * JSON filename in src/data/static/program-requirements/.
 *
 * Slug derivation:
 *   AASD_-_Addiction_Studies_Diploma.json
 *     → strip code prefix up to first "_-_"
 *     → "Addiction_Studies_Diploma"
 *     → replace _-_ and _ with -
 *     → collapse repeated -, trim, lowercase
 *     → "addiction-studies-diploma"
 *
 * Run as part of bvcapp-scripts before copy-folders.mjs.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'src', 'data', 'static', 'program-requirements');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'static', 'program-requirements-manifest.json');

// Program-page URL slugs whose bare-slug + suffix variants do NOT match the
// requirements file's credential-name-derived slug. Each maps a real BVC URL
// slug -> the manifest slug it should also resolve to; an alias key pointing at
// the same file is added. KEEP IN SYNC with the identical SLUG_ALIASES in
// coursesDB/generate_bvc_app_data.py.
const SLUG_ALIASES = {
  'health-care-aide': 'government-of-alberta-health-care-aide-provincial-curriculum-2019-certificate',
  'kitchen-and-bath-design---post-diploma-certificate': 'kitchen-and-bath-design-post-diploma-certificate',
  'perioperative-nursing-for-licensed-practical-nurses-and-registered-nurses': 'perioperative-nursing',
};

function fileNameToSlug(filename) {
  let s = filename.replace(/\.json$/i, '');
  const idx = s.indexOf('_-_');
  if (idx >= 0) s = s.slice(idx + 3);
  s = s.replace(/_-_/g, '-').replace(/_/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return s.toLowerCase();
}

async function main() {
  const files = (await fs.readdir(SRC_DIR)).filter((f) => f.endsWith('.json')).sort();
  const manifest = {};
  const collisions = [];
  for (const f of files) {
    const slug = fileNameToSlug(f);
    if (manifest[slug]) collisions.push({ slug, existing: manifest[slug], conflict: f });
    else manifest[slug] = f;
  }
  // Add URL-slug aliases (appended after the filename-sorted base keys, sorted by key).
  let aliasCount = 0;
  for (const [urlSlug, target] of Object.entries(SLUG_ALIASES).sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (manifest[target] && !manifest[urlSlug]) {
      manifest[urlSlug] = manifest[target];
      aliasCount++;
    }
  }
  await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`Manifest written: ${OUT_FILE} (${Object.keys(manifest).length} entries, ${aliasCount} URL-slug aliases)`);
  if (collisions.length) {
    console.warn(`${collisions.length} slug collisions — first match wins:`);
    for (const c of collisions) console.warn(`  ${c.slug}\n    kept:     ${c.existing}\n    dropped:  ${c.conflict}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
