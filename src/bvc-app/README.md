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

JSON data that must be fetched at runtime (e.g. `src/data/static/program-requirements/*.json`, `src/data/banners/`, `src/data/cms/`, `src/data/courses/`, `src/data/oScourses/`) is therefore mirrored from `src/data` into `public/data` by `scripts/copy-folders.mjs` before `next build` runs.

### How it's wired

- `prebuild` (`package.json`) runs `breadcrumbs:all && node scripts/copy-folders.mjs`. Because this is an npm lifecycle hook, it fires automatically before every `next build`, independent of the longer `bvcapp-scripts` chain — so the copy still happens even if a Webflow / SiS data-generation step fails downstream.
- `bvcapp-scripts` (the data-refresh chain that hits Webflow, parses programs, builds course data, etc.) also ends with `prelaunch:build` which re-runs `copy-folders.mjs`. This is intentional: the chain regenerates files under `src/data/`, then re-copies them.

### Gotchas

- **`npm run dev` does NOT run `copy-folders.mjs`**, only `predev` (which is `breadcrumbs:build`). If you add new files under `src/data/` and need them served from `/data/...` during dev, run `node scripts/copy-folders.mjs` manually, or restart with a full build.
- If the `bvcapp-scripts` chain dies (e.g. missing Webflow env vars on Vercel), the `prebuild`-level copy still runs — so the export will at least contain whatever was last committed under `src/data/`.
- `public/data/static/navigation-breadcrumbs.json` is written directly by `generateNavigationBreadcrumbs.mjs`; the rest of `public/data/` is produced exclusively by the copy script. Don't hand-edit files under `public/data/` — they will be overwritten on the next build.
