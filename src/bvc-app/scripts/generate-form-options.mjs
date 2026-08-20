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

/**
 * ISO 3166-1 alpha-3 -> alpha-2, for the Sitecore countries whose SisId is three
 * characters. /thesissitecorexm.api/registration validates `country` and
 * `country_Citizenship` as "exactly 2 alphabetic characters" and 400s otherwise, so
 * CAN / USA / FRA cannot be submitted as-is.
 *
 * Only the entries ICU cannot resolve from the Sitecore display name are listed —
 * the other ~96 three-character codes are matched by name at build time. Anything
 * still unresolved is dropped from the submittable list and reported, rather than
 * shipped as a value the API would reject.
 */
const ALPHA3_TO_ALPHA2 = {
  ASM: 'AS', BES: 'BQ', BLM: 'BL', BRN: 'BN', COG: 'CG', CPV: 'CV', FLK: 'FK',
  FSM: 'FM', HMD: 'HM', KNA: 'KN', LAO: 'LA', LCA: 'LC', MAC: 'MO', MAF: 'MF',
  MMR: 'MM', PCN: 'PN', PRK: 'KP', PSE: 'PS', SGS: 'GS', SHN: 'SH', SJM: 'SJ',
  SPM: 'PM', STP: 'ST', SXM: 'SX', TCA: 'TC', UMI: 'UM', USA: 'US', VAT: 'VA',
  VCT: 'VC', VGB: 'VG', WLF: 'WF',
};

/** Sitecore entries that are not countries and have no submittable code. */
const NOT_A_COUNTRY = new Set([
  'XQ', 'XX', 'XS', 'XW', 'XU', 'XL', 'XC', 'XP', 'XR', 'XT', 'XV', // "not otherwise specified"
  'XZ', // Stateless
  'SUN', // Soviet Union — historical
]);

/** UK constituents Sitecore lists separately; the SiS wants the country. */
const UK_CONSTITUENTS = { XF: 'GB', XG: 'GB', XH: 'GB', XI: 'GB' };

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
/**
 * ICU resolves more than ISO 3166-1 officially assigns, and the extras win the name
 * lookup and quietly produce the wrong code — ICU maps RH to "Zimbabwe", UK to
 * "United Kingdom" and SU to "Russia", and each sorts after the canonical code.
 *
 * Deprecated codes are detected rather than listed: canonicalising `und-XX` returns a
 * different region for an alias (RH -> ZW, AN -> CW) and the same one for a live
 * code. Only the exceptionally-reserved and user-assigned codes, which are not
 * aliases of anything, still need naming.
 */
const RESERVED_NOT_ISO = new Set(['XK', 'QO', 'IC', 'EU', 'EZ', 'EA', 'DG', 'AC', 'TA', 'CP', 'XA', 'XB', 'ZZ']);

function isDeprecatedRegion(code) {
  try {
    return new Intl.Locale('und-' + code).maximize().region !== code;
  } catch {
    return true;
  }
}

const isoByName = (() => {
  const map = new Map();
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      if (RESERVED_NOT_ISO.has(code) || isDeprecatedRegion(code)) continue;
      let name;
      try { name = regionNames.of(code); } catch { continue; }
      if (!name || name === code) continue;
      const key = name.toLowerCase().replace(/[^a-z]/g, '');
      if (!map.has(key)) map.set(key, code);
    }
  }
  return map;
})();

/**
 * The ISO alpha-2 to submit for a Sitecore country.
 *
 * ISO wins over Sitecore here, by decision 2026-08-20. Sitecore's country codes are
 * its own table, not ISO: Poland is PO (ISO PL) and the United Kingdom is XK — and
 * XK is the trap, because ICU happily resolves it, to **Kosovo**. A code that is
 * merely well-formed is not enough; it has to mean the right country.
 *
 * So resolution starts from the country's NAME rather than its code, and only falls
 * back to the SisId when ICU does not recognise the Sitecore spelling ("Vietnam,
 * Republic Of", "People's Republic of China", "American Somoa").
 */
function submittableCode(sisId, name) {
  const code = String(sisId).trim();
  if (NOT_A_COUNTRY.has(code)) return null;
  if (UK_CONSTITUENTS[code]) return UK_CONSTITUENTS[code];

  // 1) by name — authoritative, and the only step that catches XK -> GB, PO -> PL
  const byName = isoByName.get(name.toLowerCase().replace(/[^a-z]/g, ''));
  if (byName) return byName;

  // 2) a two-character SisId that ICU recognises
  if (/^[A-Za-z]{2}$/.test(code)) {
    const upper = code.toUpperCase();
    if (!RESERVED_NOT_ISO.has(upper) && !isDeprecatedRegion(upper)) {
      try {
        const resolved = regionNames.of(upper);
        if (resolved && resolved !== upper) return upper;
      } catch { /* not a region code */ }
    }
  }

  // 3) three-character SisId -> ISO alpha-2
  return ALPHA3_TO_ALPHA2[code.toUpperCase()] || null;
}

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

// Countries carry three values: the code we submit, the Sitecore display name, and
// the original SisId so a mismatch can be traced back.
const rejected = [];
const countries = Object.values(lookups.countries?.byId ?? {})
  .map((item) => ({ sisId: String(item.fields?.sisId ?? ''), name: (item.fields?.name || item.name || '').trim() }))
  .filter((c) => c.sisId && c.name)
  .map((c) => {
    const code = submittableCode(c.sisId, c.name);
    if (!code) { rejected.push(`${c.sisId} ${c.name}`); return null; }
    return [code, c.name, c.sisId];
  })
  .filter(Boolean)
  .sort((a, b) => a[1].localeCompare(b[1]));

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'sitecore:/sitecore/content/BVC/BVC/Data/SisData',
  countries,
  languages: slim('languages'),
};

for (const dir of ['src/data', 'public/data']) {
  const target = join(root, dir, 'form-options.json');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(payload), 'utf8');
}

const bytes = JSON.stringify(payload).length;
console.log(`✅ form-options.json — ${payload.countries.length} countries, ${payload.languages.length} languages (${(bytes / 1024).toFixed(1)} KB)`);
const bad = payload.countries.filter(([code]) => !/^[A-Za-z]{2}$/.test(code));
if (bad.length) {
  console.error(`❌ ${bad.length} countries would be rejected by /registration:`, bad.slice(0, 10));
  process.exit(1);
}
if (rejected.length) console.log(`   excluded (no submittable code): ${rejected.join(', ')}`);
