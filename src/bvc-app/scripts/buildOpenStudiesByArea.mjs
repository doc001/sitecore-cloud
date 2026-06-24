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
const PDF_BASE = "https://bvc-app.vercel.app/data/course-outlines-pdf";
const OUTPUT = path.resolve(ROOT, "src", "data", "open-studies-by-area.json");

const openStudies = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "src", "data", "cms", "open-studies.json"), "utf-8")
).items;

const programAreas = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "src", "data", "cms", "program-areas.json"), "utf-8")
).items;

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

// Rank terms chronologically within a year: Winter < Spring < Summer < Fall.
const SEASON_RANK = { winter: 0, spring: 1, summer: 2, fall: 3 };

// Parse the leading (start) term inside the parens, e.g.
//   "ACCT2103_..._(Fall 2026_Current).pdf" -> { year: 2026, season: 3 }
// Returns a sentinel that sorts first when no term can be parsed.
function termKey(filename) {
  const m = filename.match(/\(([A-Za-z]+)\s+(\d{4})/);
  if (!m) return { year: -1, season: -1 };
  return { year: parseInt(m[2], 10), season: SEASON_RANK[m[1].toLowerCase()] ?? -1 };
}

// Pick the best outline PDF for a SIS id. The PDFs are synced from SharePoint
// (C:\wamp64\www\coursesDB\sharepoint_course_outlines) and stale outlines are
// never removed, so a course can have several "_Current)" files for different
// years. Rank by start term (most recent wins); a "_Current)" file only breaks
// ties between equal terms. Files look like:
//   ACCT2103_Advanced Financial Accounting_(Fall 2026_Current).pdf
function resolvePdf(code) {
  if (!code) return null;
  const prefix = code.toUpperCase() + "_";
  const matches = pdfFiles.filter((f) => f.toUpperCase().startsWith(prefix));
  if (!matches.length) return null;

  return matches
    .slice()
    .sort((a, b) => {
      const ka = termKey(a);
      const kb = termKey(b);
      if (ka.year !== kb.year) return ka.year - kb.year;
      if (ka.season !== kb.season) return ka.season - kb.season;
      const ac = /_current\)\.pdf$/i.test(a) ? 1 : 0;
      const bc = /_current\)\.pdf$/i.test(b) ? 1 : 0;
      if (ac !== bc) return ac - bc; // "_Current)" wins the tie
      return a.localeCompare(b); // stable, deterministic final fallback
    })
    .pop(); // most recent is last
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
let resolvedPdf = 0;

for (const item of openStudies) {
  const fd = item.fieldData || {};
  const area = areaById[fd.areas];
  if (!area) {
    skippedNoArea++;
    continue;
  }

  const pdfFile = resolvePdf(fd.courseid);
  if (pdfFile) resolvedPdf++;

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

// De-duplicate by course code. Webflow sometimes holds two records for the
// same course: a canonical one (clean slug) and an accidental duplicate whose
// slug carries a collision suffix like "-f1e3b". Keep the best single row.
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

const output = {
  metadata: {
    generatedAt: new Date().toISOString(),
    source: "Webflow CMS (open-studies + program-areas) and course-outlines-pdf",
    totalAreas: areas.length,
    totalCourses: areas.reduce((sum, a) => sum + a.courses.length, 0),
    coursesWithoutArea: skippedNoArea,
    coursesWithResolvedPdf: resolvedPdf,
    coursesAvailable: areas.reduce((s, a) => s + a.courses.filter((c) => c.available).length, 0),
    duplicatesRemoved,
  },
  areas,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf-8");

console.log(`✅ Wrote ${path.relative(ROOT, OUTPUT)}`);
console.log(`   Areas: ${output.metadata.totalAreas}`);
console.log(`   Courses: ${output.metadata.totalCourses} (skipped ${skippedNoArea} with no area)`);
console.log(`   PDFs resolved: ${resolvedPdf}/${output.metadata.totalCourses}`);
for (const a of areas) {
  console.log(`   • ${a.name}: ${a.courseCount}`);
}
