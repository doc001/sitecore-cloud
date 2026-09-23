#!/usr/bin/env node
// scripts/buildExtendedEducationCourses.mjs
//
// Builds src/data/extended-education-courses.json — the data source for the
// course cards on /study/extended-education (rendered by src/js/ee-listing).
//
// Sources:
//   • src/data/cms/extended-educations.json — one entry per Extended Ed course
//   • src/data/cms/program-areas.json       — area id -> display name (the card's
//                                             eyebrow label, and what the page's
//                                             "Area" checkboxes filter on)
//   • src/data/coursesIndex.json            — SIS courses that have sections,
//                                             written by generateExtendedEducation.mjs
//
// Sibling of buildOpenStudiesByArea.mjs. That one groups Open Studies into
// accordion areas; this one is a flat card list, because that is the shape the
// Extended Education page already uses.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// The page's Courses grid is a Webflow collection list, so a card appears when
// an editor publishes a CMS record — which says nothing about whether the SIS
// has anything to sell. 24 of the 60 published records currently have no
// purchasable section, so a quarter of the grid leads to a course you cannot
// register for. Availability lives in Sitecore/SIS, not Webflow, so it has to
// be joined in here.
//
// ── WHAT COUNTS AS AVAILABLE ────────────────────────────────────────────────
//   "sis"      — the course code has at least one section in coursesIndex.json.
//   "external" — no-cart-ext-ed-course is set and there is an apply-now-link.
//                PSKN and the two PMI courses are registered on a third-party
//                site and deliberately have no SIS offering; they are available,
//                just not through our cart. Dropping them because the SIS has
//                never heard of them would remove three live courses.
//   otherwise  — unavailable. Still emitted, with available:false, so the file
//                records what was withheld and why rather than silently
//                shrinking. The runtime filters them out.
//
// Codes are compared with whitespace stripped and upper-cased: Webflow holds
// "TECH 9400" where the SIS has "TECH9400".

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUTPUT = path.resolve(ROOT, "src", "data", "extended-education-courses.json");

const EE_SOURCE = path.resolve(ROOT, "src", "data", "cms", "extended-educations.json");
const AREA_SOURCE = path.resolve(ROOT, "src", "data", "cms", "program-areas.json");
const INDEX_SOURCE = path.resolve(ROOT, "src", "data", "coursesIndex.json");
const FALLBACK_INDEX_SOURCE = path.resolve(ROOT, "src", "data", "coursesToBuild.json");

// Where the Webflow course detail pages live, site-relative. Kept relative so
// the links follow whichever host serves the page — production, UAT, or a
// webflow.io preview.
const COURSE_PAGE_BASE = "/extended-education";

// Webflow's collection-items API returns the *staged* list, which still holds
// drafts and archived records — items an editor has already taken off the live
// site. Without this filter they ship as real courses. Same rule
// buildOpenStudiesByArea.mjs and parsePrograms.mjs apply.
const isPublished = (item) => !item.isArchived && !item.isDraft && !!item.lastPublished;

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf-8"));

// "TECH 9400" (Webflow) and "TECH9400" (SIS) are the same course.
const normalizeCode = (value) => String(value ?? "").replace(/\s+/g, "").toUpperCase();

const allExtendedEd = readJson(EE_SOURCE).items;
const extendedEd = allExtendedEd.filter(isPublished);
const skippedUnpublished = allExtendedEd.length - extendedEd.length;

const programAreas = readJson(AREA_SOURCE).items.filter(isPublished);

// The CMS snapshot is only as fresh as the last `npm run getWebflowData`.
// Report its age so a stale input can't hide behind a fresh generatedAt stamp.
const sourceFetchedAt = fs.statSync(EE_SOURCE).mtime;
const sourceAgeHours = Math.round((Date.now() - sourceFetchedAt.getTime()) / 36e5);

// area id -> { name, slug }
const areaById = Object.fromEntries(
  programAreas.map((a) => [a.id, { name: a.fieldData.name, slug: a.fieldData.slug }])
);

// ---- SIS availability -------------------------------------------------------
// coursesIndex.json carries sectionCount and credits as well as the code, so it
// is preferred. coursesToBuild.json is the same allow-list without the extras,
// and is the fallback for a tree where extraction has not run yet.
function readSisCourses() {
  if (fs.existsSync(INDEX_SOURCE)) {
    const courses = readJson(INDEX_SOURCE).courses || [];
    return {
      from: path.relative(ROOT, INDEX_SOURCE),
      byCode: new Map(courses.map((c) => [normalizeCode(c.sisId), c])),
    };
  }
  if (fs.existsSync(FALLBACK_INDEX_SOURCE)) {
    const codes = readJson(FALLBACK_INDEX_SOURCE);
    return {
      from: path.relative(ROOT, FALLBACK_INDEX_SOURCE),
      byCode: new Map(codes.map((c) => [normalizeCode(c), { sisId: c }])),
    };
  }
  throw new Error(
    `Neither ${path.relative(ROOT, INDEX_SOURCE)} nor ${path.relative(ROOT, FALLBACK_INDEX_SOURCE)} exists. ` +
      `Run "npm run generateCourseData" (or at least "npm run generateCourses") first — without an ` +
      `availability list every course would be marked unavailable and the page would render empty.`
  );
}

const sis = readSisCourses();

// An empty availability list means the upstream extraction failed, not that the
// college stopped offering Extended Education. Publishing that would blank the
// page, so refuse to write instead.
if (sis.byCode.size === 0) {
  throw new Error(
    `${sis.from} lists no courses. Refusing to write ${path.relative(ROOT, OUTPUT)} — ` +
      `every course would be hidden. Re-run the Sitecore extraction and try again.`
  );
}

// ---- Build the card rows ----------------------------------------------------
const courses = extendedEd.map((item) => {
  const fd = item.fieldData || {};
  const code = String(fd.courseid ?? "").trim();
  const area = areaById[fd.areas] || null;

  // Registration happens on a third party's site; there is no SIS offering to
  // find, and Webflow already hides the cart glyph on these cards.
  const externallyRegistered = !!fd["no-cart-ext-ed-course"] && !!fd["apply-now-link"];
  const section = sis.byCode.get(normalizeCode(code));

  let availability = null;
  if (section) availability = "sis";
  else if (externallyRegistered) availability = "external";

  return {
    code,
    name: String(fd.name ?? "").trim(),
    slug: fd.slug || "",
    pageUrl: fd.slug ? `${COURSE_PAGE_BASE}/${fd.slug}` : "",
    // The card's eyebrow label. Also the value the page's "Area" checkboxes
    // match on, so it has to be the area's display name verbatim.
    area: area ? area.name : "",
    areaSlug: area ? area.slug : "",
    description: String(fd["course-description"] ?? "").trim(),
    available: availability !== null,
    availability,
    // Webflow renders the cart glyph with .w-condition-invisible on these.
    showCartIcon: !externallyRegistered,
    applyNowLink: fd["apply-now-link"] || null,
    sectionCount: section && section.sectionCount != null ? section.sectionCount : null,
    credits: section && section.credits != null ? section.credits : null,
  };
});

// De-duplicate by course code — a safety net for genuine duplicate CMS records,
// mirroring buildOpenStudiesByArea.mjs. Records with no code (the externally
// registered ones) are keyed by slug instead, which is unique in Webflow, so
// they cannot collapse into each other.
const isHashedSlug = (slug) => /-[0-9a-f]{4,6}$/.test(slug || "");
function preferred(a, b) {
  const ah = isHashedSlug(a.slug);
  const bh = isHashedSlug(b.slug);
  if (ah !== bh) return ah ? b : a; // prefer the clean (non-suffixed) slug
  if (a.available !== b.available) return a.available ? a : b; // prefer purchasable
  if (!!a.description !== !!b.description) return a.description ? a : b;
  return a;
}

let duplicatesRemoved = 0;
const best = new Map();
for (const course of courses) {
  const key = course.code ? normalizeCode(course.code) : `slug:${course.slug}`;
  const prev = best.get(key);
  if (prev) {
    duplicatesRemoved++;
    best.set(key, preferred(prev, course));
  } else {
    best.set(key, course);
  }
}

// Alphabetical by name — the order the page shows before anyone touches the
// sort dropdown, and what its "Name (A-Z)" option re-applies.
const rows = [...best.values()].sort((a, b) => a.name.localeCompare(b.name));

const available = rows.filter((c) => c.available);
const hidden = rows.filter((c) => !c.available);

// A course the SIS can sell but Webflow has no page for cannot be rendered —
// the name, description and URL all come from the CMS. Worth naming, because
// the fix is a Webflow edit, not a code change.
const cmsCodes = new Set(rows.map((c) => normalizeCode(c.code)).filter(Boolean));
const sellableWithoutPage = [...sis.byCode.keys()].filter((code) => !cmsCodes.has(code));

const output = {
  metadata: {
    generatedAt: new Date().toISOString(),
    sourceFetchedAt: sourceFetchedAt.toISOString(),
    sourceAgeHours,
    source: `Webflow CMS (extended-educations + program-areas) joined with ${sis.from}`,
    coursePageBase: COURSE_PAGE_BASE,
    totalCourses: rows.length,
    coursesAvailable: available.length,
    coursesHidden: hidden.length,
    availableViaSis: rows.filter((c) => c.availability === "sis").length,
    availableExternally: rows.filter((c) => c.availability === "external").length,
    coursesUnpublished: skippedUnpublished,
    coursesWithoutArea: rows.filter((c) => !c.area).length,
    coursesWithoutDescription: rows.filter((c) => !c.description).length,
    sellableWithoutCmsPage: sellableWithoutPage,
    duplicatesRemoved,
  },
  courses: rows,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf-8");

console.log(`✅ Wrote ${path.relative(ROOT, OUTPUT)}`);
if (sourceAgeHours >= 24) {
  console.warn(
    `⚠️  CMS snapshot is ${sourceAgeHours}h old (${sourceFetchedAt.toISOString()}).` +
      ` Run "npm run getWebflowData" — this output is stale regardless of generatedAt.`
  );
}
console.log(
  `   Courses: ${rows.length} published (${skippedUnpublished} draft/archived skipped,` +
    ` ${duplicatesRemoved} duplicates merged)`
);
console.log(
  `   Shown:   ${available.length} (${output.metadata.availableViaSis} with SIS sections,` +
    ` ${output.metadata.availableExternally} registered externally)`
);
console.log(`   Hidden:  ${hidden.length} with no purchasable section`);
for (const c of hidden) {
  console.log(`     • ${(c.code || "(no code)").padEnd(10)} ${c.name}`);
}
if (sellableWithoutPage.length) {
  console.warn(
    `⚠️  ${sellableWithoutPage.length} SIS course(s) have sections but no published Webflow page,` +
      ` so they cannot be shown: ${sellableWithoutPage.join(", ")}`
  );
}
