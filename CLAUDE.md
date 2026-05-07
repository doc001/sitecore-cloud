# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is `bvc-monorepo`, a Turborepo monorepo for **Bow Valley College (BVC)** web properties. It contains two Next.js apps and Sitecore XM Cloud content modules.

```
src/
  nextjs-jamstack/   # Next.js 14 / React 18 – Sitecore-backed school/program site
  bvc-app/           # Next.js 15 / React 19 – primary BVC app (active development)
  *.module.json      # Sitecore XM Cloud content module manifests
```

Both apps deploy to Vercel under the `bvc-marketing-its` scope.

## Commands

### Root (Turborepo)
```bash
npm run build              # Build all workspaces
npm run build:jamstack     # Build nextjs-jamstack only
npm run build:bvcapp       # Build bvc-app only
npm run deploy:jamstack    # Deploy nextjs-jamstack to Vercel prod
npm run deploy:bvcapp      # Deploy bvc-app to Vercel prod
```

### bvc-app (active development)
Run from `src/bvc-app/` or use `--filter`:

```bash
npm run dev                # Start dev server (auto-runs breadcrumb generation first)
npm run build              # Full pipeline: data scripts → breadcrumbs → next build
npm run lint               # ESLint
```

**Data pipeline scripts** (run before building when data changes):

```bash
npm run getWebflowData          # Fetch Webflow CMS → src/data/cms/*.json
npm run generateCourses         # Export valid Extended Ed course list → src/data/validCourses.json
npm run generateOpenStudies     # Export valid Open Studies course list → src/data/osValidCourses.json
npm run generateMap             # Generate SIS data mapping → src/data/sis-data*.json
npm run generateCourseData      # Fetch Ext Ed courses from Sitecore XMC → src/data/courses/*.json
npm run generateOpenStudiesData # Fetch Open Studies from Sitecore XMC → src/data/oScourses/*.json
npm run breadcrumbs:all         # Regenerate navigation breadcrumbs

# Run the full pipeline (data + copy) in one command:
npm run bvcapp-scripts
```

### nextjs-jamstack
Run from `src/nextjs-jamstack/`:
```bash
npm run dev
npm run build
npm run lint
```

## Architecture

### bvc-app — Static Site Generator Pattern

**Everything is statically generated at build time.** There is no runtime server-side rendering. The pattern is:

1. **Scripts fetch data** from two external sources and write JSON files under `src/bvc-app/src/data/`
2. **Next.js pages read those JSON files** at build time and use `generateStaticParams()` for dynamic routes

Data sources:
- **Webflow API** (`WEBFLOW_API_KEY`) → CMS content (programs, events, news, etc.) → `src/data/cms/*.json`
- **Sitecore XM Cloud GraphQL** (`SITECORE_GRAPHQL_ENDPOINT` + `SITECORE_GRAPHQL_API_KEY`) → SIS course data (sections, fees, schedules) → `src/data/courses/*.json` and `src/data/oScourses/*.json`

Key data files:
- `src/data/cms/programs.parsed.json` — all programs (parsed by `parsePrograms.mjs`)
- `src/data/courses/course-{SISID}.json` — per-course Extended Ed data
- `src/data/oScourses/course-{SISID}.json` — per-course Open Studies data
- `src/data/static/navigation-breadcrumbs.json` — pre-generated breadcrumbs
- `src/data/navigation-data.json` — navigation structure

### bvc-app — Component Structure

```
src/components/
  base/        # Layout primitives: DrawerMenu, CustomFooter, HeaderLogo, MainMenu
  banners/     # Hero and banner sections
  catalyst/    # Tailwind Catalyst UI library components (button, dialog, table, etc.)
  common/      # Shared: Breadcrumb, Button, Navigation/* (NavBar, DesktopMenu, MobileMenu, SearchDrawer)
  layouts/     # MainLayout (wraps all pages)
  pages/       # Page-level components: Home, ProgramList, Programs
  sections/    # Content sections: CourseGrid, ApplyPathSection, etc.

src/context/
  NavigationContext.tsx  # Drawer/menu state; persisted to localStorage

src/lib/
  courseUtils.ts                # Load per-course JSON, formatting helpers
  navigationBreadcrumbUtils.ts  # Read pre-generated breadcrumb data
  SiteConfig.ts                 # Navigation menu config (placeholder data, not production-ready)
  queries/                      # Sitecore XMC GraphQL query strings
```

### bvc-app — Route Map

| Route | Page file | Data source |
|---|---|---|
| `/` | `app/page.tsx` | Static |
| `/programs/[slug]` | `app/programs/[slug]/page.tsx` | `cms/programs.parsed.json` |
| `/program-list` | `app/program-list/page.tsx` | CMS JSON |
| `/study/extended-education/courses/[sisID]` | `app/study/extended-education/courses/[sisID]/page.tsx` | `courses/course-{sisID}.json` |
| `/study/open-studies/courses/[sisID]` | `app/study/open-studies/courses/[sisID]/page.tsx` | `oScourses/course-{sisID}.json` |
| `/apply/i-am-ready/[slug]` | `app/apply/i-am-ready/[slug]/page.tsx` | CMS JSON |

### nextjs-jamstack

Older Next.js 14 app backed by Sitecore XMC GraphQL. School-specific pages (Chiu School of Business, Centre for Entertainment Arts, School of Technology, Applied Research) and program pages. Config in `src/lib/config/` (SiteConfig, colors, siteMenu). Course outline PDFs are served from `public/pdf/`.

## Environment Variables

Create `.env.local` in each app root:

**`src/bvc-app/.env.local`**
```
WEBFLOW_API_KEY=...
SITECORE_GRAPHQL_ENDPOINT=...
SITECORE_GRAPHQL_API_KEY=...
```

**`src/nextjs-jamstack/` (uses root `.env` or `.env.local`)**
```
SITECORE_GRAPHQL_ENDPOINT=...
SITECORE_GRAPHQL_API_KEY=...
```

Root `.env.template` contains Sitecore Docker/XM Cloud configuration for local CM development (not required for frontend-only work).

## Key Conventions

- **`bvc-app` TypeScript errors are suppressed at build** (`ignoreBuildErrors: true` in `next.config.ts`). Fix type errors but don't rely on the build failing to catch them.
- **Static export** — `bvc-app` uses `output: "export"` with `distDir: "out"`. No `next/image` optimization (images are `unoptimized: true`). No server-only Next.js features (middleware, API routes, ISR).
- **Sitecore GraphQL pagination** — XMC defaults to 10 items per page (`PAGE_SIZE=10`). Scripts use cursor-based pagination to fetch all items.
- **Webflow site ID** is `66a28fdfe76f2f849d7b00f3` (hardcoded in `fetch-webflow-collections.mjs`).
- **`catalyst/` components** are the preferred UI primitives within `bvc-app`. `flowbite-react` is also available.
- Console logs are stripped in production builds (`compiler.removeConsole` in `next.config.ts`).
