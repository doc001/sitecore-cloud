This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Static data pipeline (`src/data` → `public/data` → `out/data`)

This is a **static export** site (`output: "export"`, `distDir: "out"` in `next.config.ts`). Next.js only copies the `public/` folder into `out/` — anything under `src/` is bundled into JS modules and is *never* emitted as a static asset.

JSON data that must be fetched at runtime (e.g. `src/data/static/program-requirements/*.json`, `src/data/banners/`, `src/data/cms/`, `src/data/courses/`, `src/data/oScourses/`) is mirrored from `src/data` → `public/data` by `scripts/copy-folders.mjs`.

### Split build: local vs Vercel

The build runs in two different places. Each does part of the job:

| Step | Local (`npm run build:bvcapp`) | Vercel (`npx next build`) |
|------|-------------------------------|---------------------------|
| Webflow / SiS data fetch + regenerate `src/data/` | ✅ runs | ❌ skipped |
| Copy `src/data` → `public/data` (`copy-folders.mjs`) | ✅ runs (prebuild + prelaunch:build) | ❌ skipped |
| `next build` → emit `out/` from `public/` | ✅ (for local verification) | ✅ (this is what's actually served) |

This is **by design**:

- `src/bvc-app/src/data/` is gitignored. The Webflow generators write there locally, but those files are never uploaded to Vercel.
- `src/bvc-app/public/` is *not* gitignored — it's the contract between local builds and the Vercel deploy. Whatever is in `public/` on your disk at deploy time is what gets uploaded.
- `vercel.json` sets `"buildCommand": "npx next build"` — *not* `npm run build`. Using `npx` deliberately bypasses npm lifecycle hooks (including `prebuild`), so Vercel never tries to re-run the data pipeline against an empty `src/data/`.

### Deploy flow (no git involved)

Deployment is **not** git-triggered. From the monorepo root:

1. `npm run build:bvcapp` — turbo runs the full local build: prebuild → bvcapp-scripts → next build. This regenerates `src/data/` from Webflow and copies into `public/data/`.
2. `npm run deploy:bvcapp` — runs `node deploy.mjs bvcapp`, which `cd`s into `src/bvc-app/` and runs `vercel --scope=bvc-marketing-its --prod --token=$VERCEL_TOKEN`.
3. The Vercel CLI uploads the local filesystem of `src/bvc-app/`, **filtered by `.gitignore`** (so `src/`, `out/`, `node_modules/`, etc. are excluded). `public/` is included.
4. Vercel runs `vercel.json` buildCommand (`npx next build`), which reads the uploaded `public/` and emits `out/` — the deployed output.

Production state = whatever was in your local `public/` at the moment you ran `deploy:bvcapp`. There is no remote git checkout involved.

### Gotchas

- **Forgetting to rebuild locally before deploying → stale data in production.** Always run `build:bvcapp` before `deploy:bvcapp`. The deploy script does not chain a build.
- **`npm run dev` does NOT run `copy-folders.mjs`** (only `predev` → `breadcrumbs:build` runs). If a dev session needs new files under `src/data/` served from `/data/...`, run `node scripts/copy-folders.mjs` manually.
- **Never hand-edit files under `public/data/`** — the next local build overwrites them. Edit the source under `src/data/` instead.
- `public/data/static/navigation-breadcrumbs.json` is also written directly by `scripts/generateNavigationBreadcrumbs.mjs`; the rest of `public/data/` comes exclusively from the copy script.
- `.gitignore` ignores `/src/data` only (the generated-data folder). The Vercel CLI also uses `.gitignore` to filter uploads (no `.vercelignore` exists), so `src/data/`, `out/`, `node_modules/`, `.next/`, and `.env*` are excluded from the upload — Vercel reproduces `out/` from `public/` during its own `next build`.
