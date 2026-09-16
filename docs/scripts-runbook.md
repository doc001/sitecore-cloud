# bvc-app Scripts — Sustainment Runbook

Every script in `src/bvc-app/scripts/`: what it does, what it needs, what breaks
it, and whether it is still alive. Written for whoever inherits this and has to
keep the site fed.

**Run everything from `src/bvc-app/`.** Some scripts resolve paths from their own
location and some from the working directory, and the ones that use the working
directory silently misfile their output when run from the repo root.

Companion runbooks: [`open-studies-data-regeneration.md`](open-studies-data-regeneration.md),
[`program-tuition-refresh.md`](program-tuition-refresh.md). Design rationale for
most of this lives in `CLAUDE.md`.

---

## 1. Which scripts run when

| Chain | Scripts, in order | Runs |
|---|---|---|
| `hourly-scripts:base` | sanitizeOutlines → generateCourses → generateMap → generateCourseData → generateExtendedEducationJson → prelaunch:build | every hour via PM2; failure is **fatal** |
| `hourly-scripts:os` | generateOpenStudies → generateOpenStudiesData → generateOpenStudiesJson → generateOpenStudiesByArea → prelaunch:build | every hour; failure is **advisory** |
| `bvcapp-scripts` | sanitizeOutlines → getWebflowData → parsePrograms → generateCourses → generateOpenStudies → generateMap → generateCourseData → generateOpenStudiesData → generateOpenStudiesJson → generateOpenStudiesByArea → generateExtendedEducationJson → generateNavigationBreadcrumbs → generateProgramRequirements → prelaunch:build | full build only (`npm run build`) |
| `build` | js:build → bvcapp-scripts → next build | full build / deploy |

**Never run in any chain — you must run these by hand:**
`generateProgramTuition`, `checkout-cart:html`, `fetchCourseOutlines`,
`js:build:prod`, `generateProgramRequirements:gate`, `cleanup`.

The hourly chain deliberately does **not** refresh Webflow CMS data, breadcrumbs,
program requirements, or the JS/CSS bundles. Those move only on a full build.

## 2. Credentials

`src/bvc-app/.env.local`, git-ignored, values in the team OneNote.

| Var | Used by |
|---|---|
| `SITECORE_GRAPHQL_ENDPOINT` | every Sitecore script |
| `SC_APIKEY` | generateCourses, generateCourseData, generateOpenStudies, generateOpenStudiesData |
| `SITECORE_API_KEY` | **generateMap only** — a different name for the same thing |
| `WEBFLOW_API_KEY` | getWebflowData |
| `PROGRAM_TUITION_XLSX` | generateProgramTuition (optional override) |
| `STRIP_DEBUG=true` | js:build — makes it behave like `js:build:prod` |

> **Trap:** `generateMap` reads `SITECORE_API_KEY` while its four siblings read
> `SC_APIKEY`. Both are set today. Rotate one without the other and `generateMap`
> keeps exiting 0 while writing **empty lookup files** — it warns, it does not fail.

## 3. The scripts

Timings are from the 2026-09-16 09:15 hourly run.

### Extended Education chain

**`generateCourses`** → `scripts/generate-courses-to-build.mjs` · ~3 s
Walks Sitecore `SisData/Courses`, writes `src/data/coursesToBuild.json` — the list of
SIS IDs that have at least one section. Exits 1 on a missing key or a thrown query.
**No empty guard:** if the tree resolves to nothing it writes `[]` and exits 0, and
an unresolvable root looks the same. Compare `generateOpenStudies`, which does
distinguish the two.
*(CLAUDE.md and the README call the output `validCourses.json`. It is
`coursesToBuild.json`; `validCourses.json` is a legacy fallback the app still reads
if the new file is absent, and nothing writes it any more.)*

**`generateMap`** → `scripts/generateSiSData.mjs` · ~4 s
Dumps the delivery-type, campus, fee-type and time-block lookups to
`src/data/sis-data.json` + `sis-data-lookup.json`, and **writes into the tracked
source tree** at `src/types/sis-data.ts`, so every run dirties git. Feeds both
products, which is why it sits in the base half. Per-tree failures are swallowed —
a category is written as empty with an `error` field and the run still succeeds.
`MAX_ITEMS = 1000` truncates silently; time blocks are at 543 today.

**`generateCourseData`** → `scripts/generateExtendedEducation.mjs` · **~44 s, the slowest hourly step**
Reads `coursesToBuild.json`, fetches each course, its sections, fees and time blocks
serially, writes `src/data/courses/course-{sisID}.json` + `coursesIndex.json` +
two report files. Exits 1 only on a missing key or a missing allow-list.
**Every query failure degrades to a warning and a skipped course**, so a partial
Sitecore outage produces a smaller catalogue and a green run — the only evidence is
warn lines and the counts in `extractionStats.json`.

**`generateExtendedEducationJson`** → `scripts/buildExtendedEducationCourses.mjs` · ~2 s
Joins the Webflow CMS snapshot with `coursesIndex.json` into
`src/data/extended-education-courses.json`, the file that decides which cards the
Extended Education grid keeps. **Refuses to write when the availability list is
empty** — the one script in the chain with that guard, because an empty list would
hide every card. Warns when the CMS snapshot is ≥24 h old, which it always is during
hourly runs (the hourly chain never refreshes CMS data).

### Open Studies chain

**`generateOpenStudies`** → `scripts/generate-os-valid-courses.mjs` · light
Writes `src/data/osValidCourses.json`. **This is the script that gets the
empty-catalogue distinction right**, and the rest of the site's behaviour depends on
it: *tree resolved but zero courses* → writes `[]`, exits 0, because "nothing
available" is a real answer; *tree never resolved* → exits 1 without writing, so the
previous file survives rather than asserting nothing is on sale.

**`generateOpenStudiesData`** → `scripts/extract-os-course-data.mjs` · **~150 s**
The heaviest script in the repo. Same fetch-everything-serially shape as the EE
equivalent, same swallow-and-continue behaviour, writing `src/data/oScourses/*.json`
plus `oS`-prefixed index and report files.

**`generateOpenStudiesJson`** → `scripts/generateOpenStudiesPublicJson.mjs`
Writes what the embeds actually fetch: `public/data/open-studies/index.json` and two
files per course (by SIS id and by slug). **Needs `generateMap` to have run** —
without `sis-data-lookup.json` it dies with `ENOENT`, the trap documented in the Open
Studies runbook. Resolves outline PDFs with **no fallback**, so a course whose outline
was retired gets no link.

**`generateOpenStudiesByArea`** → `scripts/buildOpenStudiesByArea.mjs`
Builds `src/data/open-studies-by-area.json` for the area accordion. Resolves outlines
**with** fallback, deliberately differing from the script above. Matches CMS course
codes to SIS codes **without normalising whitespace or case**, so a CMS `ANAT 1101`
silently never matches SIS `ANAT1101`. `PDF_BASE` is hardcoded to production.

### Programs, navigation and static data

**`getWebflowData`** → `scripts/fetch-webflow-collections.mjs` · slowest network step
Fetches 38 hardcoded Webflow collection IDs serially into `src/data/cms/*.json`.
**All-or-nothing:** if any collection fails, nothing is written and it exits 1, so the
snapshot can never be a mix of vintages. Deleting a collection in Webflow therefore
breaks the whole run until its ID is removed from the list. Full build only.

**`generateProgramRequirements`** (+`:check`, `:gate`) · local, fast
Re-keys the hand-maintained requirement datasets onto the Webflow `code` field →
`program-requirements-by-code/{CODE}.json` + an index. Its source datasets come from
the coursesDB cascade **outside this repo**. Problems are printed but **exit 0 unless
`--strict`**, and `bvcapp-scripts` runs it without `--strict`, so a blocking issue
never fails a build. Run `npm run generateProgramRequirements:gate` when you want it
to actually fail.

**`generateProgramTuition`** (+`:check`) · manual only
Program tuition from Finance's OneDrive workbook →
`public/data/static/program-tuition.json` (tracked, commit it).
See [`program-tuition-refresh.md`](program-tuition-refresh.md).

**`parsePrograms`** → `scripts/parsePrograms.mjs` · instant
Flattens `src/data/cms/programs.json` into `programs.parsed.json`, which is where
**every `/programs/[slug]` route comes from**. Runs in `bvcapp-scripts` right after
`getWebflowData`. Refuses to write an empty result. See §4.2 for the filter that had
to be fixed before it could be wired in.

**`breadcrumbs:all`** → `scripts/generateNavigationBreadcrumbs.mjs`
Writes `src/data/static/navigation-breadcrumbs.json` from the hand-maintained
`src/data/navigation-data.json`. Missing navigation data → exit 1; an unexpected shape
is logged and the **partial map is written anyway**.
> The five npm entries (`build`, `validate`, `types`, `manifest`, `all`) are
> identical — the script never reads `process.argv`. There is no validator, no type
> emitter and no manifest writer. Use `breadcrumbs:all` and ignore the rest.

**`prelaunch:build`** → `scripts/copy-folders.mjs`
Copies `src/data` → `public/data`. **Purely additive — it never deletes**, which is
why `pipeline.mjs` prunes the package separately. A mid-copy error is logged and
swallowed, so a partial copy still exits 0. It publishes everything under `src/data`,
including the SIS lookups.

**`cleanup`** → `scripts/cleanup-data.mjs`
Post-deploy deletion of intermediates from `src/data/` only; the `public/data/` copies
survive, which is what the site serves. No `--dry-run`. It does **not** delete
`coursesIndex.json` or `coursesToBuild.json`, so a later run can quietly reuse a stale
index.

### Browser bundles and embeds

**`js:build`** / **`js:build:prod`** / **`js:watch`** → `scripts/build-os-course.mjs`
esbuild → `public/js/*.js` (7 bundles) and `public/css/*.css` (4). Adding a bundle
means adding a `targets` entry; nothing else discovers it.
> **`npm run build` runs the non-prod variant**, so production ships readable bundles
> with `console.log` intact unless `STRIP_DEBUG=true` is set in the environment.
> That is the current state on `bvc-app.vercel.app`. Harmless, but not what
> `js:build:prod` implies.

**`checkout-cart:html`** → `scripts/build-checkout-cart-html.mjs` · manual only
Regenerates `src/webflow/checkout-cart.html` from `src/js/checkout-cart/content.js`.
Hand edits to that HTML are destroyed on the next run, and **regenerating changes
nothing live until someone re-pastes it into Webflow**.

### Course outline PDFs

**`sanitizeOutlines`** (+`:check`) → `scripts/sanitize-outline-filenames.mjs` · **pipeline-critical**
Runs **first** in both chains. Renames any outline PDF whose name contains a
non-ASCII byte (Vercel's static host 404s those, no matter how the URL is encoded)
and rewrites the outline URLs inside all four mirrors of the program-requirements
datasets. Only non-ASCII names are touched and an existing target is never
overwritten. It has no try/catch: a locked file throws and, as step 1 of the fatal
half, stops the hourly deploy.
> **Renames reach production only on a full `node pipeline.mjs`** — the hourly
> `--data-only` overlay deliberately excludes the 1.5 GB PDF directory.

Its line in `logs/pipeline-out.log` tells you the catalogue is clean:
`6051 outline PDFs, 0 need renaming.` A non-zero count means the DB export has
re-emitted smart punctuation and those outlines are 404ing until the next full build.

The 6,051 served PDFs in `public/data/course-outlines-pdf/` are **git-tracked and
arrive by an external SharePoint sync**. No script in this repo downloads them.

**`fetchCourseOutlines`** → `scripts/fetchCourseOutlines.mjs` · orphaned
Has an npm entry, is in no chain, and nothing live reads its output
(`src/data/course-outlines/courseOutlines.json` — a directory that does not exist
here). Its only consumers are the dead downloaders below. Keep it only if you want a
manual Sitecore-inspection tool; it is not part of any flow.

### Legacy PDF downloaders — DELETED 2026-09-16

Ten scripts from a 2025 attempt to pull outline PDFs out of Sitecore directly, all
bypassed by the SharePoint sync and untouched through the entire 2026 outline rework.
Recorded here so nobody resurrects them expecting a working downloader; recover from
git history if ever needed.

| Script | What it did | Why it was dead |
|---|---|---|
| `course_outlines_pdf.mjs` | GraphQL walk of outline items | no caller |
| `downloadCoursePDFs.mjs` | download PDFs via media API | no caller, input file absent |
| `generate-course-pdfs.mjs` | fuller variant of the above | loads `.env.uat.local`, **which does not exist** |
| `pdf-scraper.py` | Selenium/Chrome download automation | needs Python + Selenium; **no Python toolchain in this repo** |
| `pdfUrlHelper.mjs` | media path → URL probe | nothing imports it |
| `simpleBrowserDownloader.mjs` | download using pasted browser cookies | **hardcoded July-2025 session cookies**, long expired |
| `simplePDFDownloader.mjs` | download by URL + api key | no caller, input file absent |
| `singleURLTest.mjs` | fetch one hardcoded dev URL | hardcoded expired cookies + dev host |
| `sitecoreAuthDownloader.mjs` | CM login, download with session | **the only script using `SITECORE_USERNAME`/`PASSWORD`** |
| `testAshxUrls.mjs` | probe `/-/media/{id}.ashx` patterns | throwaway probe, no caller |

Evidence, not impression: no npm entry, import, chain step or doc mentions any of
them; they all read `src/data/course-outlines/courseOutlines.json`, **which does not
exist**; and they write to `public/data/course-outlines/pdf/`, which holds **0 files**
while the site serves `public/data/course-outlines-pdf/` with 6,051 — a different
directory that the live resolver reads and none of them touch.

> Two carried expired Sitecore session cookies in source and one used CM login
> credentials, which is why they were deleted rather than left lying around. **Git
> history still contains those cookies** — they expired in 2025, but treat them as
> burned. Four stale JSON files in `public/data/course-outlines/` are read by no live
> code either; they were **left in place** in case they are a deliberate metadata
> archive. `generateOSCourses.mjs` is also dead (superseded by
> `extract-os-course-data.mjs`, zero references, single 2026-06 commit) and was left
> alone — it is not a downloader, and deleting it was not part of this pass.

---

## 4. Known problems

Findings from this audit, each verified against the repo. None are introduced by it.

### 4.1 A pipeline-critical script is not in git

`scripts/buildExtendedEducationCourses.mjs` runs inside `hourly-scripts:base` — the
half where failure stops the deploy — and inside `bvcapp-scripts`, but it is
**untracked**. So are `public/js/ee-listing.js` (the bundle Webflow loads) and
`src/webflow/extended-education-listing-cards.html`. A fresh clone cannot run the
hourly pipeline, and if this laptop dies the script is gone. Commit all three.

### 4.2 `/programs/[slug]` routes were built from a frozen snapshot — FIXED 2026-09-16

`src/app/programs/[slug]/page.tsx` imports `src/data/cms/programs.parsed.json`, which
is written **only** by `scripts/parsePrograms.mjs` — and nothing runs that script: no
npm entry, no chain, no import. Meanwhile `programs.json` refreshes on every full
build. The parsed file was last committed 2026-05-11 and last written 2026-07-31.

Measured today: 62 routes are built from it, **8 published programs have no route**
(confirmed live — `bvc-app.vercel.app/programs/health-data-analytics` returns 404
while `/administrative-professional` returns 200), and **21 parsed entries point at
slugs the CMS no longer has**.

**Fixed:** `parsePrograms` now runs in `bvcapp-scripts`, immediately after
`getWebflowData` (which writes the `programs.json` it reads). It also refuses to write
an empty result, since that would remove every program route from the build.

**Its publication filter was wrong and had to be fixed first.** It filtered on
`!isDraft`, and the Webflow API returns the **staged** list where `isDraft` marks any
item with unpublished edits — not only items that never went live. 32 program records
carry `isDraft` alongside a `lastPublished` date, including Practical Nurse,
Administrative Professional, Human Resources and Software Development, all live on
bowvalleycollege.ca. Running it as written produced **31 routes instead of 62 and
deleted live pages**. The filter is now `!isArchived && !!lastPublished`, which yields
63 routes: the 8 published programs that had none, plus 14 renamed slugs, while
dropping 21 dead ones (spot-checked: `veterinary-office-assistant` and
`justice-studies---general` are 301s on the live site, `university-transfer` and
`cloud-computing` are 404s).

> **The same trap is latent in two hourly scripts.** `buildExtendedEducationCourses.mjs`
> and `buildOpenStudiesByArea.mjs` both use
> `!isArchived && !isDraft && !!lastPublished`. Measured today it drops **nothing** —
> no live Extended Ed (52), Open Studies (159) or program-area (8) record carries
> `isDraft` — so they were left alone. The day an editor saves a draft edit to a live
> course, that course silently vanishes from the listing. Check that first if a course
> disappears for no reason.

### 4.3 Most scripts publish a partial result as a success

Only `generateExtendedEducationJson` (empty availability), `generateOpenStudies`
(unresolved tree) and `getWebflowData` (any collection failed) refuse to write.
Everywhere else — `generateCourses`, `generateMap`, `generateCourseData`,
`generateOpenStudiesData` — a failed query is a warning, the run exits 0, and a
half-populated catalogue is indistinguishable from a healthy one except in the warn
lines and the stats files. This is the failure mode behind the five-day Open Studies
outage; the package prune fixed the *stale-file* half of it, not this half.

### 4.4 Generated files land in tracked source

`generateMap` writes `src/types/sis-data.ts` and `getWebflowData` rewrites
`src/data/cms/*.json`, all tracked. Every build leaves a dirty working tree, which is
why `git status` here is permanently noisy and real changes are easy to miss.

### 4.5 Documentation drift

- `generateCourses` writes `coursesToBuild.json`, not `validCourses.json` as CLAUDE.md
  and the README say.
- The root README gives the hourly cron as `:55` in one place and `:50` in another;
  `ecosystem.config.js` says `:15`.
- The README says `pm2 stop` pauses the schedule. It does not — `cron_restart` fires
  on stopped apps. Use `pm2 delete` then `pm2 save --force`.

---

## 5. Recovery: rebuilding all data from scratch

On a new machine, or when the data looks wrong and you want a clean slate:

```bash
cd src/bvc-app
# 1. .env.local from OneNote (see §2)
npm install                      # from the REPO ROOT — this is a workspaces monorepo
npm run bvcapp-scripts           # full data refresh, ~4-5 min
npm run generateProgramTuition   # tuition is not in any chain
cd ../.. && npm run deploy:bvcapp
```

Sanity checks afterwards: `src/data/coursesToBuild.json` is a non-empty array,
`src/data/courses/` has one file per course, `public/data/open-studies/index.json`
lists categories, and `extractionStats.json` / `oSextractionStats.json` show no
unexpected failure counts.

## 6. Is it healthy right now?

```bash
pm2 status                                   # bvc-hourly-deploy scheduled?
tail -50 logs/pipeline-out.log               # last run's outcome
grep "need renaming" logs/pipeline-out.log | tail -1   # want "0 need renaming"
grep -c "FAILED\|❌" logs/pipeline-out.log   # should be 0 for today
```

Then confirm the site is being fed — these are what the Webflow embeds fetch:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://bvc-app.vercel.app/data/coursesIndex.json
curl -s -o /dev/null -w "%{http_code}\n" https://bvc-app.vercel.app/data/open-studies/index.json
curl -s -o /dev/null -w "%{http_code}\n" https://bvc-app.vercel.app/data/static/program-tuition.json
```

A 200 with an empty catalogue inside is a legitimate answer for Open Studies — see
CLAUDE.md, *Availability is what osValidCourses.json / validCourses.json mean*. It is
not automatically a fault.
