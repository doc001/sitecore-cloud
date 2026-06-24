# CLAUDE.md — `bvc-app`

Guidance for Claude Code when working in `src/bvc-app/`.

## Site type

Next.js **static export** (SSG):

- `next.config.ts`: `output: "export"`, `distDir: "out"`, `trailingSlash: true`, `images.unoptimized: true`.
- Deployed via Vercel; `vercel.json` sets `buildCommand: "npx next build"`, `outputDirectory: "out"`.
- No server runtime — anything fetched at request time must resolve to a static file under `out/`.

## Deployment model — read this before changing anything build-related

Deployment is **CLI-driven, not git-driven**. The build is split across two environments:

| Step | Where it runs | How |
|------|---------------|-----|
| Webflow / SiS data fetch, parse, regenerate `src/data/*` | **Local only** | `npm run build:bvcapp` (turbo → `npm run build`) |
| Copy `src/data` → `public/data` | **Local only** | `prebuild` (`copy-folders.mjs`) + `prelaunch:build` |
| Upload local filesystem to Vercel | **Local CLI** | `npm run deploy:bvcapp` → `node deploy.mjs bvcapp` → `vercel --prod` |
| `next build` (SSG export to `out/`) | **Both local and Vercel** | local: end of `npm run build`. Vercel: `npx next build` |

Why this split:

- `src/data/` is **gitignored** (per `src/bvc-app/.gitignore:24` rule `/src`). The Webflow generators write into it locally, but those files are excluded from Vercel CLI uploads (which filter by `.gitignore`).
- `public/` is **not** gitignored — it's the contract between local builds and Vercel. Whatever's in `public/` on disk at deploy time is what gets uploaded.
- `vercel.json` sets `"buildCommand": "npx next build"` — NOT `npm run build`. Using `npx` deliberately bypasses npm lifecycle hooks. If this were `npm run build`, Vercel would trigger `prebuild` → `copy-folders.mjs` against the empty `src/data/` it received, then `bvcapp-scripts` → Webflow calls that may or may not be configured on Vercel. Skipping all of that is intentional.
- **No git push is involved.** Production state = whatever the user's local filesystem looked like when they ran `deploy:bvcapp`.

### The actual deploy commands (monorepo root `package.json`)

```
"build:bvcapp":  "turbo run build --filter=bvc-app"
"deploy:bvcapp": "node ./deploy.mjs bvcapp"
```

`deploy.mjs bvcapp` runs `vercel --scope=bvc-marketing-its --prod --token=$VERCEL_TOKEN` from inside `src/bvc-app/`. The token comes from the monorepo root `.env`.

### Critical rule

Always run `npm run build:bvcapp` **before** `npm run deploy:bvcapp`. The deploy script does NOT chain a build — it just uploads. If you deploy without rebuilding first, production gets whatever stale `public/` was on your disk from the last local build.

## Data pipeline: `src/data` → `public/data` → `out/data`

Next.js only copies `public/` into `out/`. Files under `src/` are bundled into JS modules and never emitted as static assets. To serve JSON at URLs like `/data/foo.json`, the file must live in `public/data/`.

The repo mirrors `src/data` → `public/data` via `scripts/copy-folders.mjs`, wired in two places (both local-only since Vercel runs `npx next build`):

1. **`prebuild`** (`package.json`): `breadcrumbs:all && node scripts/copy-folders.mjs`. Fires automatically before `npm run build`'s `next build`, independent of `bvcapp-scripts`. Ensures the copy runs even if the Webflow chain fails midway.
2. **`prelaunch:build`** (end of `bvcapp-scripts`): re-runs `copy-folders.mjs` after the data-generation chain has refreshed files under `src/data/`.

### Rules of thumb

- **Never hand-edit files under `public/data/`** — they are overwritten by the copy script on every local build. Edit the source under `src/data/` instead, then run `npm run build:bvcapp` (or just `node scripts/copy-folders.mjs`) to propagate.
- **Always rebuild before deploying.** Production = local `public/` at deploy time. If you forget to run `build:bvcapp` after a Webflow refresh, the next deploy will ship stale `public/`.
- `public/data/static/navigation-breadcrumbs.json` is also written directly by `scripts/generateNavigationBreadcrumbs.mjs`. The source of truth still lives under `src/data/static/`.
- **`npm run dev` does NOT run `copy-folders.mjs`** (only `predev` → `breadcrumbs:build` runs). If a dev session needs new files under `src/data/` served from `/data/...`, run `node scripts/copy-folders.mjs` manually.
- If a fetch to `/data/<something>.json` 404s in production: (a) check the file is under `public/data/` locally, (b) check the `.gitignore` doesn't exclude it (Vercel CLI uses `.gitignore` to filter the upload — `src/data/` is gitignored, `public/data/` is not), and (c) confirm `build:bvcapp` was run before the last `deploy:bvcapp`.

## Build chains

### Local — `npm run build` (full, with data refresh)

```
prebuild:        breadcrumbs:all && copy-folders.mjs       ← always runs
build:           bvcapp-scripts && next build
  bvcapp-scripts:
    createCourses             (getWebflowData + parsePrograms — runs FIRST, see note)
    generateCourses           (Sitecore: Courses)
    generateOpenStudies       (Sitecore: Credit Courses)
    generateMap               (Sitecore: Delivery Types / Campuses / Fee Types / Time Blocks)
    generateCourseData        (validCourses + sis-data-lookup)
    generateOpenStudiesData   (osValidCourses + sis-data-lookup)
    generateNavigationBreadcrumbs          (needs cms/programs.json — hence createCourses first)
    generateProgramRequirementsManifest    (URL slug → JSON filename map for the Webflow embed)
    prelaunch:build           (generateOpenStudiesByArea && copy-folders.mjs)
```

> **Why `createCourses` runs first:** `generateNavigationBreadcrumbs` and `generateOpenStudiesByArea` consume Webflow data (`cms/programs.json`, `cms/open-studies.json`, `cms/program-areas.json`). The fetch used to run *last* (inside `prelaunch:build`), so those generators read the *previous* run's data. Moving `createCourses` to the front guarantees fresh data. `createCourses` was correspondingly removed from `prelaunch:build`, so running `npm run prelaunch:build` **standalone** no longer fetches — it assumes `src/data/cms/*` is already populated.

### Vercel — `npx next build` (SSG only)

```
next build       ← consumes committed public/, writes out/
```

No prebuild hook, no Webflow calls, no copy. The whole pipeline above is bypassed.

## Build dependency graph (data flow)

Traced from the actual file I/O of each script. **`build:bvcapp` runs the complete flow** (`turbo run build --filter=bvc-app` → npm runs the package's `build`, which fires the `prebuild` hook, then `bvcapp-scripts`, then `next build`). ⚠️ The `build` task is turbo-**cached** (`turbo.json`: `cache:true`); Webflow/Sitecore responses are *external* and not part of turbo's input hash, so a no-source-change re-run can be a **cache hit that skips the fetch entirely**. Use `turbo run build --filter=bvc-app --force` to guarantee a fresh data pull.

**External sources**
- **Sitecore GraphQL** (`SITECORE_GRAPHQL_ENDPOINT` + `SC_APIKEY` / `SITECORE_API_KEY`) → SIS / course data
- **Webflow API v2** (`WEBFLOW_API_KEY`, site `66a28fdf…`) → CMS / programs / open-studies / areas (40 collections)
- **SharePoint sync** (`C:\wamp64\www\coursesDB\sharepoint_course_outlines`) → `public/data/course-outlines-pdf/*.pdf`. **Not part of this build** — an external process drops PDFs there and never deletes stale ones, so a course can have several `(<term>_Current).pdf` files. `buildOpenStudiesByArea.mjs` only *reads* them; `resolvePdf()` picks the newest by start term (year, then Winter→Spring→Summer→Fall), using `_Current)` only as a tiebreaker.

**Order, inputs → outputs** (all writes land in gitignored `src/data/`, then `copy-folders.mjs` mirrors to `public/data/`)

```
1. createCourses
   a. getWebflowData   Webflow API ─────────────▶ src/data/cms/*.json (programs, open-studies, program-areas, courses, …)
   b. parsePrograms    cms/programs.json ────────▶ src/data/cms/programs.parsed.json
2. generateCourses     Sitecore(Courses) ────────▶ src/data/validCourses.json
3. generateOpenStudies Sitecore(Credit Courses) ─▶ src/data/osValidCourses.json
4. generateMap         Sitecore(lookups) ────────▶ src/data/sis-data.json, sis-data-lookup.json, src/types/sis-data.ts
5. generateCourseData  validCourses.json + sis-data-lookup.json (+Sitecore per-course)
                                          ────────▶ src/data/courses/course-*.json, course-index.json,
                                                     coursesData.json, summary-stats.json
6. generateOpenStudiesData  osValidCourses.json + sis-data-lookup.json (+Sitecore per-course)
                                          ────────▶ src/data/oScourses/course-*.json, course-index.json,
                                                     coursesData.os.json, summary-stats.os.json   ◀ NOTE the .os suffix
7. generateNavigationBreadcrumbs  navigation-data.json + cms/programs.json
                                          ────────▶ src/data/static/navigation-breadcrumbs.json
8. generateProgramRequirementsManifest  src/data/static/program-requirements/*.json
                                          ────────▶ src/data/static/program-requirements-manifest.json
9. prelaunch:build
   a. generateOpenStudiesByArea  cms/open-studies.json + cms/program-areas.json + osValidCourses.json
                                 + public/data/course-outlines-pdf/ (SharePoint sync)
                                          ────────▶ src/data/open-studies-by-area.json
   b. copy-folders.mjs           src/data/** ─────▶ public/data/**
→ next build  public/data → out/data
```

**Cross-script edges (consumer ⟵ producer)**
| Consumer | Requires |
|---|---|
| `buildCoursesComplete` (#5) | `validCourses.json` (#2) + `sis-data-lookup.json` (#4) |
| `buildCoursesOpenStudiesComplete` (#6) | `osValidCourses.json` (#3) + `sis-data-lookup.json` (#4) |
| `parsePrograms` (#1b) | `cms/programs.json` (#1a) |
| `generateNavigationBreadcrumbs` (#7) | `cms/programs.json` (#1a) |
| `buildOpenStudiesByArea` (#9a) | `cms/open-studies.json` + `cms/program-areas.json` (#1a) + `osValidCourses.json` (#3) + `course-outlines-pdf/` (SharePoint) |

**Output-collision note:** `buildCoursesComplete` (#5) and `buildCoursesOpenStudiesComplete` (#6) both ran into `src/data/`. They used to *both* write `coursesData.json` + `summary-stats.json`, so #6 silently clobbered #5 (the combined file ended up Open-Studies-only). #6 now writes **`coursesData.os.json`** + **`summary-stats.os.json`** so both datasets survive. Neither file currently has any runtime consumer in `src/` (the app reads per-course files under `courses/` / `oScourses/`, plus `validCourses.json`, `cms/programs.json`, `cms/programs.parsed.json`, and `static/*`); they're kept as generated artifacts. If you wire one up, import the `.os` variant for Open Studies.

## Webflow embeds (`src/webflow/`)

Vanilla-JS snippets pasted into Webflow **Embed** widgets on bowvalleycollege.ca. They run in the browser on the live BVC site, fetch JSON from `https://bvc-app.vercel.app/data/...`, and render UI into a mount point on the page. **The scripts themselves live in Webflow, not on Vercel** — editing the JS file here only matters when someone re-pastes it into the embed widget.

### `program-requirements.js`

Renders a courses-per-term accordion on each program detail page using `src/data/static/program-requirements/<PROGRAM>.json`.

- **Slug resolution**: takes the last segment of `window.location.pathname`, lowercased, then looks it up in `program-requirements-manifest.json`. If no exact match, tries appending `-diploma`, `-certificate`, `-post-diploma-certificate`, `-post-diploma`, `-bridging` in order. This handles BVC's marketing URLs that strip the program-type suffix (e.g. `/programs/cybersecurity-solutions` → manifest key `cybersecurity-solutions-diploma`).
- **Manifest**: built by `scripts/generateProgramRequirementsManifest.mjs` from the filenames in `src/data/static/program-requirements/`. Runs as part of `bvcapp-scripts`, gets copied to `public/data/static/` by `copy-folders.mjs`, and ships with the next `deploy:bvcapp`.
- **Mount target priority**: `[data-bvc-program-requirements]` → `#Courses .w-richtext` → `#Courses`.
- **Styling**: scoped under `.bvc-accordion` so the accordion CSS (table styling, zebra stripes, header colors) doesn't leak onto other tables on the BVC page.
- **Errors**: when something fails, the embed shows an inline error block with `Slug:` and `Detail:` lines, and logs `[bvc-program-requirements]` to the console with the full error.

### When to do what

| Change you want to make | What to deploy |
|--|--|
| Tweak the embed script (visual, fallback rules, rendering) | Re-paste into the Webflow Embed widget; publish Webflow. **No bvc-app deploy.** |
| Add/edit a program's JSON, or rename a file (changes the manifest) | `npm run build:bvcapp` + `npm run deploy:bvcapp` |

See `src/webflow/README.md` for installation, slug rules, the suffix-fallback table, and live-page debugging steps.

## Tech stack quick reference

- Next.js 15.3, React 19, TypeScript (with `ignoreBuildErrors: true`).
- Tailwind 4, Flowbite React, Framer Motion.
- Data sources: Webflow CMS, Sitecore (parent repo `src/bvcrendering/` is the Sitecore JSS app — this `bvc-app/` is a separate standalone static export).

## Gitignore notes

`src/bvc-app/.gitignore` ignores `/src/data` — generated data written by the Webflow / SiS / breadcrumbs scripts. The actual app source under `src/app/`, `src/components/`, etc. is **not** ignored and reaches Vercel normally.

The Vercel CLI filters uploads by `.gitignore` (no `.vercelignore` exists). So anything matching `.gitignore` — including `src/data/`, `out/`, `node_modules/`, `.next/`, `.env*` — is excluded from the upload. The Vercel build then regenerates `out/` from the uploaded `public/`. If you ever need to add Vercel-only exclusions without affecting git, create a `.vercelignore`; without one, `.gitignore` is the single source of truth.

Historical note: the rule used to be a bare `/src`, which silently excluded the entire app source tree from Vercel uploads. New files under `src/bvc-app/src/` would 404 in production while working locally. Fixed to `/src/data`.
