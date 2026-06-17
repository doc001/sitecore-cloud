/**
 * generateOpenStudiesPublicJson.mjs
 *
 * Generates two types of static JSON files served from /data/open-studies/:
 *   - public/data/open-studies/index.json  — full course listing, grouped by category
 *   - public/data/open-studies/{sisId}.json — per-course data with resolved section details
 *
 * These are consumed by Webflow custom code embed snippets via fetch().
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Category mapping ─────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'Arts and Sciences',
  'Business',
  'Community Studies',
  'Extended Education',
  'Technology',
];

const CATEGORY_BY_PREFIX = {
  ANAT: 'Arts and Sciences',
  BIOL: 'Arts and Sciences',
  CHEM: 'Arts and Sciences',
  CNST: 'Arts and Sciences',
  COMM: 'Arts and Sciences',
  ENGL: 'Arts and Sciences',
  FIPR: 'Arts and Sciences',
  INDG: 'Arts and Sciences',
  MATH: 'Arts and Sciences',
  PHIL: 'Arts and Sciences',
  PHYS: 'Arts and Sciences',
  POSC: 'Arts and Sciences',
  PSYC: 'Arts and Sciences',
  SOCI: 'Arts and Sciences',
  WGST: 'Arts and Sciences',
  ACCT: 'Business',
  ADMN: 'Business',
  DESN: 'Business',
  ESPR: 'Business',
  FNSR: 'Business',
  HRES: 'Business',
  HUCL: 'Business',
  LEGL: 'Business',
  MGMT: 'Business',
  MKTG: 'Business',
  SCMT: 'Business',
  ADDC: 'Community Studies',
  DAST: 'Community Studies',
  EDAS: 'Community Studies',
  ELCC: 'Community Studies',
  FASD: 'Community Studies',
  HMSV: 'Community Studies',
  JUST: 'Community Studies',
  VOAS: 'Community Studies',
  DATA: 'Technology',
  SODV: 'Technology',
  TECH: 'Technology',
};

// PSYC1202 specifically belongs in Extended Education per the UAT site
const EXTENDED_EDUCATION_OVERRIDES = new Set(['PSYC1202']);

function getCategory(sisId) {
  if (EXTENDED_EDUCATION_OVERRIDES.has(sisId)) return 'Extended Education';
  const prefix = sisId.replace(/\d.*$/, '');
  return CATEGORY_BY_PREFIX[prefix] ?? 'Extended Education';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeGuid(raw) {
  return raw.replace(/[{}\-]/g, '').toUpperCase();
}

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const y = dateString.substring(0, 4);
    const m = dateString.substring(4, 6);
    const d = dateString.substring(6, 8);
    return new Date(`${y}-${m}-${d}`).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

const TERM_RANK = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };

function parseTerm(filename) {
  const match = filename.match(/_([A-Za-z]+)\s+(\d{4})_Current\.pdf$/);
  if (!match) return 0;
  const [, season, year] = match;
  return parseInt(year) * 10 + (TERM_RANK[season] ?? 0);
}

function findCurrentPdf(sisId, allPdfs) {
  const candidates = allPdfs.filter(
    (f) => f.startsWith(`${sisId}_`) && f.endsWith('_Current.pdf')
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => parseTerm(b) - parseTerm(a));
  return candidates[0];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // Load valid course list
  const validCoursesPath = join(ROOT, 'src', 'data', 'osValidCourses.json');
  const validCourses = JSON.parse(readFileSync(validCoursesPath, 'utf8'));

  // Load SIS lookup for delivery types and campuses
  const lookupPath = join(ROOT, 'src', 'data', 'sis-data-lookup.json');
  const lookup = JSON.parse(readFileSync(lookupPath, 'utf8'));
  const deliveryById = lookup.lookups?.deliveryTypes?.byId ?? {};
  const campusById = lookup.lookups?.campuses?.byId ?? {};

  function resolveDelivery(raw) {
    return deliveryById[normalizeGuid(raw)]?.displayName ?? 'On-campus';
  }
  function resolveCampus(raw) {
    return campusById[normalizeGuid(raw)]?.displayName ?? 'BVC Campus';
  }

  // Scan PDF directory
  const pdfDir = join(ROOT, 'public', 'data', 'course-outlines-pdf');
  const allPdfs = existsSync(pdfDir) ? readdirSync(pdfDir).filter((f) => f.endsWith('.pdf')) : [];

  // Ensure output directory exists
  const outDir = join(ROOT, 'public', 'data', 'open-studies');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Build course data
  const grouped = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]));
  const perCourseFiles = [];

  for (const sisId of validCourses) {
    const filePath = join(ROOT, 'src', 'data', 'oScourses', `course-${sisId}.json`);
    if (!existsSync(filePath)) {
      console.warn(`⚠️  Skipping ${sisId} — file not found`);
      continue;
    }

    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    const pdfFilename = findCurrentPdf(sisId, allPdfs);
    const category = getCategory(sisId);
    const slug = toSlug(raw.name);

    // Listing entry (minimal data for the accordion table)
    const listingEntry = {
      sisId: raw.sisId,
      slug,
      name: raw.name,
      description: raw.description ?? '',
      credits: raw.credits ?? 0,
      pdfFilename: pdfFilename ?? null,
    };

    grouped[category].push(listingEntry);

    // Per-course detail (full section data resolved for display)
    const sections = (raw.sections ?? []).map((s) => ({
      name: s.name,
      sisId: s.sisId,
      deliveryType: resolveDelivery(s.deliveryType),
      campus: resolveCampus(s.campus),
      startDate: formatDate(s.startDate),
      endDate: formatDate(s.endDate),
      registrationStart: s.registrationStart ? formatDate(s.registrationStart) : '',
      hours: s.hours ?? 0,
      seatsAvailable: s.seatsAvailable,
      schedule: (s.timeBlocks ?? []).map((tb) => tb.schedule).filter(Boolean),
      fees: {
        domestic: s.fees?.domestic?.amount ?? 0,
        international: s.fees?.international?.amount ?? 0,
      },
    }));

    const courseDetail = {
      sisId: raw.sisId,
      slug,
      name: raw.name,
      description: raw.description ?? '',
      credits: raw.credits ?? 0,
      pdfFilename: pdfFilename ?? null,
      sections,
    };

    perCourseFiles.push({ sisId, slug, data: courseDetail });
  }

  // Write index.json (course listing by category)
  const index = {
    generatedAt: new Date().toISOString(),
    categories: CATEGORY_ORDER
      .map((name) => ({ name, courses: grouped[name] }))
      .filter((cat) => cat.courses.length > 0),
  };

  const indexPath = join(outDir, 'index.json');
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`✅ Wrote ${indexPath}`);

  // Write per-course JSON files — keyed by both sisId and slug
  let courseCount = 0;
  for (const { sisId, slug, data } of perCourseFiles) {
    const content = JSON.stringify(data, null, 2);
    writeFileSync(join(outDir, `${sisId}.json`), content);
    writeFileSync(join(outDir, `${slug}.json`), content);
    courseCount++;
  }
  console.log(`✅ Wrote ${courseCount * 2} course JSON files (sisId + slug) to ${outDir}`);
}

main();
