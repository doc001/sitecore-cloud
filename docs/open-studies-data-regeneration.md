# Open Studies — Data Regeneration & Listing Update

How to regenerate the Open Studies course listing data in `bvc-app`, resolve the
merge conflicts that typically arise in generated data files, and deploy so the
changes become visible in Webflow.

## Regeneration pipeline

Run from `src/bvc-app/`. Requires `.env.local` with the Sitecore + Webflow keys
(`SITECORE_GRAPHQL_ENDPOINT`, `SITECORE_API_KEY` / `SC_APIKEY`, `WEBFLOW_API_KEY`).

| # | Command | Output |
|---|---|---|
| 1 | `npm run generateOpenStudies` | Valid OS course list → `src/data/osValidCourses.json` |
| 2 | `npm run generateOpenStudiesData` | Fetch from Sitecore XMC → `src/data/oScourses/*.json` + indexes (~150s) |
| 3 | `npm run generateMap` | `src/data/sis-data.json` + `sis-data-lookup.json` |
| 4 | `npm run generateOpenStudiesJson` | Public `public/data/open-studies/index.json` + per-course public files |
| 5 | `npm run breadcrumbs:all` | Regenerate navigation breadcrumbs |
| 6 | `npm run prelaunch:build` | Copy `src/data` → `public/data` |

> **Gotcha:** step 4 (`generateOpenStudiesPublicJson.mjs`) reads
> `src/data/sis-data-lookup.json`. If it fails with `ENOENT` for that file, run
> `generateMap` (step 3) first.

The single command `npm run bvcapp-scripts` runs all of the above (plus the
Extended Ed equivalents) in the correct order.

## Resolving merge conflicts in generated data

A `git pull` on `vercel-uat` commonly conflicts in build-generated data files:

```
public/data/coursesIndex.json
public/data/extractedCoursesReport.json
public/data/extractionStats.json
public/data/oScoursesIndex.json
public/data/oSextractedCoursesReport.json
public/data/oSextractionStats.json
public/data/open-studies/index.json
public/data/sis-data-lookup.json
public/data/sis-data.json
public/data/static/navigation-breadcrumbs.json
src/data/static/navigation-breadcrumbs.json
src/types/sis-data.ts
```

These conflicts are almost always **only regeneration timestamps and counts** —
not real content divergence. Resolution strategy:

1. Identify which side is the **superset** (higher `totalCourses` / has the newer
   course). Keep that side:
   ```bash
   git checkout --ours -- <files>   # or --theirs, whichever is the superset
   git add <files>
   ```
2. Then **regenerate** the data (pipeline above) so timestamps/counts are
   consistent and current, and commit everything together.

> Resolving a generated file to a side that equals `HEAD` produces no staged diff —
> that's expected; the merge simply keeps that version.

## Deploying so changes show in Webflow

Regenerated data is only live once deployed to Vercel. Per the project setup:

- `bvc-uat` (https://bvc-uat.vercel.app) — UAT / testing.
- `bvc-app` (https://bvc-app.vercel.app) — **production; the Open Studies
  listing embed fetches `index.json` from here.** Deploying to `bvc-uat` alone
  does **not** update what Webflow serves.

```bash
vercel deploy --prod --scope=bvc-marketing-its --project=bvc-app
```

## Session note (2026-06-19)

Resolved a `vercel-uat` pull merge (local "New course added by Thesis Team" vs
incoming EE-CSS commits) by keeping local data (superset), regenerated the full OS
dataset (86 courses, 348 sections, 388 timeBlocks; 172 public files; 84 breadcrumb
routes), and committed as merge `af3e2ed1`. **Not pushed and not deployed** as of
that session — remaining steps were `git push` and a `bvc-app` deploy.
