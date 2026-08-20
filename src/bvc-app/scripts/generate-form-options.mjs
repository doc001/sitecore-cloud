// Emits public/data/form-options.json — the full Sitecore country and language
// lists, slimmed to [sisId, name] pairs for the checkout typeahead.
//
// The checkout form offers a curated shortlist inline (the ~49 countries and ~40
// languages the college actually sees) and falls back to "Other", which searches
// the complete set. Fetching sis-data-lookup.json for that would pull 3.1 MB —
// this file is ~17 KB because it drops rawFields, byName and bySlug.
//
// Run after generateMap; wired into `npm run bvcapp-scripts`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// generateMap writes to src/data; the hourly pipeline's cleanup step later removes
// that folder, so fall back to the published copy when running standalone.
const candidates = [join(root, 'src/data/sis-data-lookup.json'), join(root, 'public/data/sis-data-lookup.json')];
const source = candidates.find(existsSync);
if (!source) {
  console.error('❌ sis-data-lookup.json not found. Run `npm run generateMap` first.');
  process.exit(1);
}

const { lookups } = JSON.parse(readFileSync(source, 'utf8'));

/** [sisId, displayName] pairs, sorted by name, skipping anything without a code. */
function slim(key) {
  const bucket = lookups[key];
  if (!bucket) {
    console.warn(`⚠️  no "${key}" in the lookup — did PATHS_CONFIG change?`);
    return [];
  }
  return Object.values(bucket.byId)
    .map((item) => [String(item.fields?.sisId ?? ''), (item.fields?.name || item.name || '').trim()])
    .filter(([code, name]) => code && name)
    .sort((a, b) => a[1].localeCompare(b[1]));
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'sitecore:/sitecore/content/BVC/BVC/Data/SisData',
  countries: slim('countries'),
  languages: slim('languages'),
};

for (const dir of ['src/data', 'public/data']) {
  const target = join(root, dir, 'form-options.json');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(payload), 'utf8');
}

const bytes = JSON.stringify(payload).length;
console.log(`✅ form-options.json — ${payload.countries.length} countries, ${payload.languages.length} languages (${(bytes / 1024).toFixed(1)} KB)`);
