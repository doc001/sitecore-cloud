# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisites

- **Node.js v22 LTS** — download from https://nodejs.org/ (npm is bundled, no separate install needed). Verify with `node -v` and `npm -v`.
- If using nvm: `nvm install 22 && nvm use 22`
- Run `npm install` **once from the repo root** — this is an npm workspaces monorepo, so all packages (`src/bvc-app`, `src/nextjs-jamstack`) are installed in one shot. Do not run `npm install` inside individual app folders.

## Repository Overview

This is `bvc-monorepo`, a Turborepo monorepo for **Bow Valley College (BVC)** web properties. It contains two Next.js apps and Sitecore XM Cloud content modules.

```
src/
  nextjs-jamstack/   # Next.js 14 / React 18 – Sitecore-backed school/program site
  bvc-app/           # Next.js 15 / React 19 – primary BVC app (active development)
  *.module.json      # Sitecore XM Cloud content module manifests
```

Both apps deploy to Vercel under the `bvc-marketing-its` scope.

### Vercel Projects (bvc-app)

| Project | URL | Purpose |
|---|---|---|
| `bvc-app-uat` | https://bvc-app-uat.vercel.app | **Production** — sole deployment target; Webflow embeds load all CSS/JS/data from here |

**Webflow embeds reference `bvc-app-uat` for CSS, JS, and course data:**
```html
<link rel="stylesheet" href="https://bvc-app-uat.vercel.app/css/os-course.css" />
<script src="https://bvc-app-uat.vercel.app/js/ee-course.js" defer></script>
<script src="https://bvc-app-uat.vercel.app/js/os-course.js" defer></script>
```

**All deployments target `bvc-app-uat`. Vercel is a static host only — it never rebuilds.**
The pipeline builds locally, packages `out/` as Vercel Build Output API v3, then uploads with `--prebuilt`.

On-demand deploy (same steps as the hourly PM2 cron):
```bash
npm run deploy:bvcapp   # or: node pipeline.mjs
```

## Commands

### Root (Turborepo)
```bash
npm run build              # Build all workspaces
npm run build:jamstack     # Build nextjs-jamstack only
npm run build:bvcapp       # Build bvc-app only (Turbo; pass -- --cache=local: to skip cache read AND write)
npm run deploy:jamstack    # Deploy nextjs-jamstack to Vercel prod
npm run deploy:bvcapp      # Full pipeline: vercel pull → build → package → deploy --prebuilt to bvc-app-uat
```

### Hourly Automated Pipeline (PM2)

`pipeline.mjs` (root) runs the full data refresh + deploy automatically every hour.

```bash
# One-off manual run:
node pipeline.mjs

# PM2 setup (run once to activate the hourly schedule):
# Note: pm2 startup does NOT work on Windows — use pm2-windows-startup instead
npm install -g pm2
pm2 start ecosystem.config.js       # starts cron at :15 every hour
pm2 save                            # save process list to ~/.pm2/dump.pm2
npm install -g pm2-windows-startup  # Windows auto-start on login
pm2-startup install

# PM2 day-to-day commands:
pm2 status                      # check if pipeline is running/scheduled
pm2 logs bvc-hourly-deploy      # live log tail
pm2 restart bvc-hourly-deploy   # force an immediate run now
pm2 delete bvc-hourly-deploy && pm2 save --force   # disable the schedule
```

**`pm2 stop` does NOT disable the cron.** `cron_restart` fires on stopped apps — that
is the whole point of pairing it with `autorestart: false`. To actually halt the
schedule use `pm2 delete`, then `pm2 save --force` so a reboot cannot resurrect it
from `~/.pm2/dump.pm2`.

**The cron must use six fields** (`'0 15 * * * *'`, leading `0` = second). A five-field
`'15 * * * *'` matches on *every second* of that minute, and PM2 fires ~1 s early: it
started a run at :49:59, matched again at :50:00, SIGINT-killed the in-flight run and
started a second one — every hour.

**Schedule rationale**: the upstream SIS → Sitecore sync starts on the hour and
finishes ~:06, so :15 reads freshly-synced data.

**Pipeline steps** (total ~5 min):
1. `npm run build:bvcapp -- --cache=local:` — data scripts + breadcrumbs + Next.js build → `out/`
   (no cache read **or** write — a plain `--force` still writes ~200 MB/run to `.turbo/cache`,
   which Turbo never prunes; that once grew to 35 GB and filled the disk)
2. **Fee guard** (`fee-guard.mjs`) — compares freshly-extracted section fees against the
   last set that reached the site; blocks the deploy if too much of the catalogue
   repriced at once (see below)
3. Package `out/` into `.vercel/output/` (Vercel Build Output API v3 static format)
4. `vercel pull` — refreshes `.vercel/project.json` project link
5. `vercel deploy --prebuilt` — uploads static files; Vercel does not rebuild
6. `cleanup-data.mjs` — removes intermediate JSON files (only touches `src/data/`;
   `public/data/` survives, which is what the fee guard reads)

Logs are written to `logs/` (git-ignored).

### Alerting (`notify.mjs`)

Two channels, covering different failures. **Neither may ever fail a deploy** — every
function swallows its own errors and returns a boolean, because a monitoring outage
must not become an outage.

| Channel | Env var | Answers |
|---|---|---|
| Windows toast | — | (always on; only visible to whoever is logged into that machine) |
| Teams | `TEAMS_WEBHOOK_URL` | *what* broke — fires only when the pipeline runs |
| Heartbeat | `HEARTBEAT_URL` | *that* it ran — the monitor alerts when a ping fails to arrive |

Fires on: Build FAILED, Package FAILED, Deploy FAILED, and Deploy BLOCKED (fee guard).

**A fee-guard block pings the heartbeat as a SUCCESS, not a failure.** Blocked is not
broken — the run executed and correctly declined to publish. While the upstream sync
flips, a block is the expected outcome of roughly every second run, so sending `/fail`
would leave the dead-man's switch red half the time; a permanently-red monitor is one
nobody reads, and it would be red for the wrong reason exactly when a real outage hit.
Teams still carries the block detail. `notify()`'s 4th argument is the heartbeat suffix
(`'/fail'` default, `''` for "completed as designed").

**The heartbeat is the one that catches silence.** If the machine sleeps, the PM2 daemon
dies, or the cron is deleted, nothing else produces a single alert — and that is
indistinguishable from a healthy site. The pipeline pings `<url>/start` when a run
begins, `<url>` on success, `<url>/fail` on any failure. A *local* watchdog cannot cover
this, since it dies with the machine it is watching.

**Teams payload format**: Microsoft retired the O365 connector webhooks; their
replacement is a Power Automate **Workflows** webhook, which rejects the old MessageCard
shape and expects an Adaptive Card in a message envelope. `teamsPayload()` picks the
format from the webhook host, so a still-working legacy `*.office.com` URL is handled
too. Workflows answers `202` with an empty body; connectors answer `200 "1"`.

> Historical note: 28 failure alerts fired between 2026-07 and 2026-08 — 23 build, 5
> deploy — and **none reached anyone**, because `TEAMS_WEBHOOK_URL` was never set and the
> toast went to an unattended machine at 01:54 AM. Setting these two env vars is what
> makes the alerting real.

### Fee guard

The SIS → Sitecore sync has been observed emitting **two different datasets on alternating
hourly runs** (2026-08-12/13): e.g. `ANAT1101-20` Domestic flipped 1020 → 1000 → 1020 every
hour, catalogue-wide, with International amounts also swapping between sections. The pipeline
is a faithful reader — no script in this repo writes to Sitecore — so it published whichever
half of the flip it caught, and roughly every second deploy shipped wrong prices.

A real price update touches a handful of courses; a sync fault touches nearly all of them.
The guard blocks the deploy when **≥25% of comparable sections and ≥10 sections** change
price in one run, and leaves the site on the previous data.

- Baseline: `.pipeline-state/fee-baseline.json` (git-ignored, machine-local). Advanced
  **only after a successful deploy**, so a blocked run keeps comparing against the last
  dataset that actually reached the site.
- Publish anyway (genuine catalogue-wide change): `node pipeline.mjs --skip-fee-guard`
  or `SKIP_FEE_GUARD=1`.
- Tune: `FEE_GUARD_THRESHOLD` (default `0.25`), `FEE_GUARD_MIN_CHANGED` (default `10`).
- Exit code `2` = blocked by the guard (distinct from `1` = build/deploy failure).

### Fee watcher (`sitecore-fee-watch.mjs`)

Second PM2 app, `bvc-fee-watch`, cron `'0 */5 * * * *'`. Read-only GraphQL polls
against Sitecore Edge — no build, no deploy, nothing written.

Separate from the fee guard on purpose. The guard sees the catalogue once an hour,
only while the pipeline runs, and reports a percentage; it answers *"should we deploy
this?"*. The watcher answers *"when exactly did upstream change, and to what?"* — it
keeps reporting when the hourly deploy is disabled, and pins the write to ~5 minutes
instead of an hour, which is the precision the SIS team needs to match a flip against
their own job logs.

```bash
node sitecore-fee-watch.mjs            # one poll, prints current state
node sitecore-fee-watch.mjs --history  # every recorded flip, with __Updated stamps
```

- Probes a handful of sections across **both** trees (`Credit Courses` and `Courses`),
  so a future fault can be identified as catalogue-wide or confined to one tree.
- State: `.pipeline-state/fee-watch-last.json`; flip log: `fee-watch-history.jsonl`.
- On a change it alerts through `notify.mjs` (Teams) with `from → to` and the
  `__Updated` stamp — but **at most once per 6 h** (`FEE_WATCH_ALERT_COOLDOWN_H`).
  The known fault flips twice an hour; alerting on each would be ~48 messages a day,
  and an alert nobody reads is worse than no alert. The history file still records
  **every** flip — that is the artefact, the Teams message is just the nudge.
- **`__Updated` is the field that proves a write rather than a stale cache** — a cache
  keeps serving an old timestamp. That single field is what identified this as an
  upstream Sitecore write in the first place.
- Always exits 0. Monitoring must never become an outage.

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

**Webflow-embedded JS/CSS assets** (bundled by esbuild — see `scripts/build-os-course.mjs`):

```bash
npm run js:build        # Bundle src/js/*/index.js + src/css/*.css → public/{js,css}/* (readable, DEV/UAT)
npm run js:build:prod   # Same, minified + console/debugger stripped (PROD)
npm run js:watch        # Rebuild on every save
npm run checkout-cart:html  # Regenerate src/webflow/checkout-cart.html from content.js
```

`js:build` is the first step of `npm run build`, so a normal build/deploy
always refreshes these. Sources live under `src/js/<name>/index.js` (ES modules,
esbuild follows imports) and `src/css/<name>.css`; each bundles to a
self-contained IIFE at `public/js/<name>.js` served at `/js/<name>.js`.

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
- `public/data/coursesIndex.json` — Extended Ed course index (generated at build)
- `public/data/open-studies/index.json` — Open Studies course index by category (generated at build)
- `public/data/sis-data-lookup.json` — GUID-to-name lookup for delivery types and campuses

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

### bvc-app — Webflow Embeds

Standalone HTML/CSS/JS snippets pasted into Webflow "Embed" blocks. They fetch JSON from the Vercel deployment at runtime and render course data client-side.

```
src/webflow/
  open-studies-listing.html          # OS program page — accordion table grouped by category
  open-studies-course.html           # OS course detail — description, credits, accordion offerings, add-to-cart
  extended-education-listing.html    # EE program page — searchable flat table
  extended-education-course.html     # EE course detail — same layout as OS, reads from /data/courses/
  checkout-cart.html                 # checkout page multi-step form: Start→Personal→Mailing (GENERATED from content.js — do not hand-edit)
```

Two flavours of embed live here:
- **Inline snippets** (the course listing/detail files above) — self-contained HTML+CSS+JS pasted whole into an Embed block.
- **Bundled-asset embeds** (`checkout-cart.html`, and the `os-course` / `ee-course` / `checkout` runtimes) — the HTML is just markup carrying `data-*` hooks; the CSS and JS are separate bundled files loaded from Vercel via `<link>` / `<script src>`. Source is `src/js/<name>/` + `src/css/<name>.css`, built by `js:build`. See the JS/CSS build commands above.

Key conventions:
- **Course detail embeds target `#courseComponent`** — the existing Webflow div on course pages.
- **Listing embeds create their own container** (`#bvc-os-listing` / `#bvc-ee-listing`).
- **Two-level section grouping**: course detail embeds group sections by Delivery Type, then by Campus (location). Each delivery type gets an `<h3>` heading, each campus gets an `<h4>` subheading, with accordion items underneath.
- **Cart integration**: course detail embeds output `.addtocartbutton` elements with `data-product-*` attributes. A separate CartManager/ecommerce script (also a Webflow embed) attaches to these buttons. The display embed must load **before** the cart script.
- **GUID resolution**: delivery types and campuses come from Sitecore as GUIDs. Embeds use a hardcoded lookup table plus a runtime fetch of `/data/sis-data-lookup.json` for augmentation.
- **Date display**: accordion items show dates derived from `timeBlock.startTime/endTime` (actual class dates), falling back to `section.startDate/endDate` when no timeBlocks exist.
- **Accordion detail fields**: Credits (first), Fee, Dates, Days, Time. Seats are intentionally hidden (always show as available). Location is shown in the campus subheading rather than per-item.
- **PDF course outlines** (OS only): fetched via `pdfFilename` from the course index JSON. Correct path is `/data/course-outlines-pdf/{pdfFilename}`. EE courses do not have PDF outlines.
- **Responsive**: desktop uses CSS grid (4 columns); mobile (≤ 640px) switches to flex column. Desktop-only code cell (`.bvc-os-code-desktop`) is hidden on mobile; mobile top bar (`.bvc-os-row-top`) is hidden on desktop.
- **`data-base-url`** on the container div points to the Vercel deployment. Production Webflow embeds use `https://bvc-app-uat.vercel.app`.
- **Checkout-cart embed**: a multi-step personal-info form (**Start → Personal → Mailing**; there is **no in-form payment tab and no in-form cart**), not a course renderer. Root hook is `[data-checkout]`; the runtime binds `data-*` attributes (`data-step`, `data-field`, `data-next/back`, `data-student-type`, terms/refund consent, `data-billing-same`, `data-billing-block`, `data-address-autocomplete`, `data-phone-combined`, `data-checkout-submit`). Load order: `<link .../css/checkout-cart.css>` + `<script .../js/checkout-cart.js defer>` in page settings, then paste `src/webflow/checkout-cart.html` into an Embed. `content.js` is the single source of truth (fields, options, copy, MSAL, and the `googleMaps` / `phone` / `cart` config); regenerate markup with `npm run checkout-cart:html` — never hand-edit. Modules: `field / consent / stepper / validators / storage / msal-auth / address-autocomplete`.
  - **Mailing step** = a Mailing address + a Billing address (5 mandatory fields each: Street, City, Province, Postal Code, Country). "Billing Address same as above?" (`data-billing-same`, default checked) hides billing and exempts it from validation. Street fields have Google Places autocomplete (`address-autocomplete.js`) that fills the rest of the group — **inert until `config.googleMaps.apiKey` is set**; manual entry always works.
  - **Phone**: visible `#phoneNumber` (10 digits) plus a `phoneCountryCode` select (default **+1**, auto-follows the mailing Country). Submitted as a **combined hidden `#phone` = `+1XXXXXXXXXX`** (no separator).
  - **ASN** is visible/required **when the cart contains credit-bearing courses** (any `cartItems[].credits > 0`, falling back to `sessionStorage.totalCredits`), hidden and exempt from validation when none do. It is re-read on every step change. `?type` no longer gates it — a cart can mix Open Studies and Extended Ed items. The submitter mirrors this in `cartRequiresAsn()`.
  - **Field ids** are aligned to what the submitter reads via a `submitId` override (`postalCode→postalcode`, billing `streetAddress-2/city-2/province-2/postalCode-2/country-2`, OS asn `asn-os`, billing-same checkbox `checkbox`, terms `checkbox-2`).
  - **Submission**: the Mailing step's **"Proceed to Payment"** button (`data-checkout-submit`) validates, then dispatches a `bvc:checkout-submit` DOM event. The separate `public/js/checkout.js` (source `src/js/checkout/index.js`) listens and runs the purchase: **create token → registration → submit-payment → redirect to the Flywire payment page**. It reads courses/fees from the session cart (`sessionStorage.cartItems` / `feeSession`) and richer fields from the form. Contract: `studentId:0`, **empty `studentPk`** (a non-empty value 500s for new registrations); coded enums (gender/language/legalStatus/ethnicity) pass through `*_MAP` tables in checkout.js with known-good defaults — fill them from the SiS enum to send real values.
  - **Page-owned scaffold**: the Webflow **page** provides `#shoppingCart` (the cart column) and optionally `#registerToCourse`. The embed must **not** declare those ids (a duplicate id shadows the page's, leaving its cart empty). checkout.js renders the cart into the page's `#shoppingCart` and re-renders it on every `bvc:checkout-step` event. Its `DOMContentLoaded` is null-guarded so missing scaffold never throws.
  - The course-page cart button ("Proceed to Checkout") in `os-course.js` / `ee-course.js` navigates to the checkout page with `?type=os` / `?type=ee`.

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

These files are **gitignored and must be created manually** on each developer machine. The actual values (API keys, endpoints, credentials) are stored in the team's **local OneNote notebook** — ask a team member for access if you don't have it.

Create `.env.local` in each app root:

**`src/bvc-app/.env.local`**
```
WEBFLOW_API_KEY=...
SITECORE_GRAPHQL_ENDPOINT=...
SITECORE_GRAPHQL_API_KEY=...
SC_APIKEY=...
SITECORE_USERNAME=...
SITECORE_PASSWORD=...
# Optional: Teams webhook for pipeline alerts. Create it as a Power Automate
# "Workflows" webhook (the old O365 connectors are retired). notify.mjs picks the
# payload format from the host, so a legacy *.office.com URL still works.
TEAMS_WEBHOOK_URL=
# Optional: dead-man's switch. healthchecks.io (or compatible) ping URL. The
# pipeline pings <url>/start, then <url> on success or <url>/fail on failure —
# so the monitor alerts when a run stops happening at all.
HEARTBEAT_URL=
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
