#!/usr/bin/env node
// scripts/buildOpenStudiesByArea.mjs
//
// Builds src/data/open-studies-by-area.json — the data source for the
// "Open Studies courses by school/area" accordion (code, course name,
// credits, course-outline PDF link, and the open-studies page link).
//
// Sources:
//   • src/data/cms/open-studies.json   — one entry per Open Studies course
//   • src/data/cms/program-areas.json  — area id -> display name (accordion header)
//   • public/data/course-outlines-pdf/ — resolves the current outline PDF per SIS id
//
// Only courses that map to a program-area are included.

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PDF_BASE = "https://bvc-app-uat.vercel.app/data/course-outlines-pdf";
const OUTPUT = path.resolve(ROOT, "src", "data", "open-studies-by-area.json");

const OS_SOURCE = path.resolve(ROOT, "src", "data", "cms", "open-studies.json");
const AREA_SOURCE = path.resolve(ROOT, "src", "data", "cms", "program-areas.json");

// Webflow's collection-items API returns the *staged* list, which still
// contains drafts and archived records — items an editor has already taken
// off the live site. Without this filter they ship as real courses.
// Same rule parsePrograms.mjs applies.
const isPublished = (item) => !item.isArchived && !item.isDraft && !!item.lastPublished;

const allOpenStudies = JSON.parse(fs.readFileSync(OS_SOURCE, "utf-8")).items;
const openStudies = allOpenStudies.filter(isPublished);
const skippedUnpublished = allOpenStudies.length - openStudies.length;

const programAreas = JSON.parse(fs.readFileSync(AREA_SOURCE, "utf-8")).items.filter(isPublished);

// The CMS snapshot is only as fresh as the last `npm run getWebflowData`.
// Report its age so a stale input can't hide behind a fresh generatedAt stamp.
const sourceFetchedAt = fs.statSync(OS_SOURCE).mtime;
const sourceAgeHours = Math.round((Date.now() - sourceFetchedAt.getTime()) / 36e5);

// SIS codes that actually have availability to purchase (backend offerings).
// Used to flag which courses should link out to their Open Studies page.
const validCodes = new Set(
  JSON.parse(fs.readFileSync(path.resolve(ROOT, "src", "data", "osValidCourses.json"), "utf-8"))
);

// area id -> { name, slug }
const areaById = Object.fromEntries(
  programAreas.map((a) => [a.id, { name: a.fieldData.name, slug: a.fieldData.slug }])
);

// ---- PDF resolution ---------------------------------------------------------
const pdfDir = path.resolve(ROOT, "public", "data", "course-outlines-pdf");
const pdfFiles = fs.existsSync(pdfDir)
  ? fs.readdirSync(pdfDir).filter((f) => /\.pdf$/i.test(f))
  : [];

// Pick the best outline PDF for a SIS id: prefer the "_Current)" outline,
// otherwise the latest by name. Files look like:
//   ACCT1103_Introduction to Financial Accounting_(Fall 2023_Current).pdf
function resolvePdf(code) {
  if (!code) return null;
  const prefix = code.toUpperCase() + "_";
  const matches = pdfFiles.filter((f) => f.toUpperCase().startsWith(prefix));
  if (!matches.length) return null;
  const current = matches.find((f) => /_current\)\.pdf$/i.test(f));
  return current || matches.sort().pop();
}

// Credits as shown in the table, e.g. "3" -> "3.0", "4.5" -> "4.5".
function formatCredits(credits) {
  if (credits === null || credits === undefined || credits === "") return "";
  const n = parseFloat(credits);
  return Number.isFinite(n) ? n.toFixed(1).replace(/\.0+$/, ".0") : String(credits);
}

// ---- Group courses by area --------------------------------------------------
const groups = new Map(); // area id -> { id, name, slug, courses: [] }
let skippedNoArea = 0;

for (const item of openStudies) {
  const fd = item.fieldData || {};
  const area = areaById[fd.areas];
  if (!area) {
    skippedNoArea++;
    continue;
  }

  const pdfFile = resolvePdf(fd.courseid);

  if (!groups.has(fd.areas)) {
    groups.set(fd.areas, { id: fd.areas, name: area.name, slug: area.slug, courses: [] });
  }

  groups.get(fd.areas).courses.push({
    code: fd.courseid || "",
    name: (fd.name || "").trim(),
    credits: formatCredits(fd.credits),
    slug: fd.slug || "",
    pageUrl: fd.slug ? `/open-studies/${fd.slug}` : "",
    available: validCodes.has(fd.courseid),
    pdf: pdfFile ? `${PDF_BASE}/${encodeURIComponent(pdfFile)}` : null,
    pdfFile: pdfFile || null,
  });
}

// De-duplicate by course code. Most of these were Webflow's staged copies of
// a draft — the slug of one carries a collision suffix like "-f1e3b" — and are
// now removed by the isPublished filter above. This stays as a safety net for
// genuine duplicate records. Keep the best single row.
const isHashedSlug = (slug) => /-[0-9a-f]{4,6}$/.test(slug || "");
function preferred(a, b) {
  const ah = isHashedSlug(a.slug);
  const bh = isHashedSlug(b.slug);
  if (ah !== bh) return ah ? b : a; // prefer the clean (non-suffixed) slug
  if (a.available !== b.available) return a.available ? a : b; // prefer purchasable
  if (!!a.pdf !== !!b.pdf) return a.pdf ? a : b; // prefer one with an outline PDF
  return a;
}

let duplicatesRemoved = 0;
for (const g of groups.values()) {
  const best = new Map();
  for (const c of g.courses) {
    const prev = best.get(c.code);
    if (prev) {
      duplicatesRemoved++;
      best.set(c.code, preferred(prev, c));
    } else {
      best.set(c.code, c);
    }
  }
  g.courses = [...best.values()];
}

// Sort areas by name, courses by code (matches the sample accordion).
const areas = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
for (const a of areas) {
  a.courses.sort((x, y) => x.code.localeCompare(y.code));
  a.courseCount = a.courses.length;
}

// Counted off the final rows, not the raw CMS items — duplicates resolving to
// the same course used to be tallied separately, so this could exceed
// totalCourses (e.g. 139/104).
const resolvedPdf = areas.reduce((sum, a) => sum + a.courses.filter((c) => c.pdf).length, 0);

const output = {
  metadata: {
    generatedAt: new Date().toISOString(),
    sourceFetchedAt: sourceFetchedAt.toISOString(),
    sourceAgeHours,
    source: "Webflow CMS (open-studies + program-areas) and course-outlines-pdf",
    totalAreas: areas.length,
    totalCourses: areas.reduce((sum, a) => sum + a.courses.length, 0),
    coursesWithoutArea: skippedNoArea,
    coursesUnpublished: skippedUnpublished,
    coursesWithResolvedPdf: resolvedPdf,
    coursesAvailable: areas.reduce((s, a) => s + a.courses.filter((c) => c.available).length, 0),
    duplicatesRemoved,
  },
  areas,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf-8");

console.log(`✅ Wrote ${path.relative(ROOT, OUTPUT)}`);
if (sourceAgeHours >= 24) {
  console.warn(
    `⚠️  CMS snapshot is ${sourceAgeHours}h old (${sourceFetchedAt.toISOString()}).` +
      ` Run "npm run getWebflowData" — this output is stale regardless of generatedAt.`
  );
}
console.log(`   Areas: ${output.metadata.totalAreas}`);
console.log(
  `   Courses: ${output.metadata.totalCourses} (skipped ${skippedNoArea} with no area,` +
    ` ${skippedUnpublished} draft/archived)`
);
console.log(`   PDFs resolved: ${resolvedPdf}/${output.metadata.totalCourses}`);
for (const a of areas) {
  console.log(`   • ${a.name}: ${a.courseCount}`);
}
