# CLAUDE.md — `bvc-app`

Guidance for Claude Code when working in `src/bvc-app/`.

## Site type

Next.js **static export** (SSG):

- `next.config.ts`: `output: "export"`, `distDir: "out"`, `trailingSlash: true`, `images.unoptimized: true`.
- Deployed via Vercel; `vercel.json` sets `buildCommand: "npm run build"`, `outputDirectory: "out"`.
- No server runtime — anything fetched at request time must resolve to a static file under `out/`.

## Data pipeline: `src/data` → `public/data` → `out/data`

Next.js only copies `public/` into `out/`. Files under `src/` are bundled into JS modules and never emitted as static assets. To serve JSON at URLs like `/data/foo.json`, the file must live in `public/data/`.

The repo mirrors `src/data` → `public/data` via `scripts/copy-folders.mjs`. It's wired in two places:

1. **`prebuild`** (`package.json`): `breadcrumbs:all && node scripts/copy-folders.mjs`. This npm lifecycle hook fires automatically before every `next build`, independent of the `bvcapp-scripts` chain. It guarantees the copy runs even if downstream Webflow/SiS scripts fail.
2. **`prelaunch:build`** (end of `bvcapp-scripts`): re-runs `copy-folders.mjs` after the data-generation chain has refreshed files under `src/data/`.

### Rules of thumb

- **Never hand-edit files under `public/data/`** — they are overwritten by the copy script on every build. Edit the source under `src/data/` instead.
- `public/data/static/navigation-breadcrumbs.json` is the one exception: it is also written directly by `scripts/generateNavigationBreadcrumbs.mjs`. The source of truth still lives under `src/data/static/`.
- **`npm run dev` does NOT run `copy-folders.mjs`** (only `predev` → `breadcrumbs:build` runs). If a dev session needs new files under `src/data/` served from `/data/...`, run `node scripts/copy-folders.mjs` manually.
- If a fetch to `/data/<something>.json` 404s in production, first check whether the file exists under `src/data/` but is missing from `public/data/` — that means the last build's copy step didn't run for it.

## Build chain (`npm run build`)

```
prebuild:        breadcrumbs:all && copy-folders.mjs       ← always runs
build:           bvcapp-scripts && next build
  bvcapp-scripts:
    generateCourses           (Webflow API)
    generateOpenStudies       (Webflow API)
    generateMap
    generateCourseData
    generateOpenStudiesData
    generateNavigationBreadcrumbs
    prelaunch:build           (createCourses && copy-folders.mjs)
```

The Webflow-dependent scripts are brittle (require env vars, network). The `prebuild` hook is the safety net that ensures `public/data/` is at least as fresh as the committed `src/data/` even if the chain breaks.

## Tech stack quick reference

- Next.js 15.3, React 19, TypeScript (with `ignoreBuildErrors: true`).
- Tailwind 4, Flowbite React, Framer Motion.
- Data sources: Webflow CMS, Sitecore (parent repo `src/bvcrendering/` is the Sitecore JSS app — this `bvc-app/` is a separate standalone static export).
