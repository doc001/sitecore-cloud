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
| `bvc-app` | https://bvc-app.vercel.app | **Production** — sole deployment target; Webflow embeds load all CSS/JS/data from here |

**Webflow embeds reference `bvc-app` for CSS, JS, and course data:**
```html
<link rel="stylesheet" href="https://bvc-app.vercel.app/css/os-course.css" />
<script src="https://bvc-app.vercel.app/js/ee-course.js" defer></script>
<script src="https://bvc-app.vercel.app/js/os-course.js" defer></script>
```

**All deployments target `bvc-app`. Vercel is a static host only — it never rebuilds.**
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
npm run deploy:bvcapp      # Full pipeline: vercel pull → build → package → deploy --prebuilt to bvc-app
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
   last set that reached the site and **reports** if too much of the catalogue repriced
   at once. Advisory since 2026-08-14: it alerts, it never stops the deploy (see below)
3. Package `out/` into `.vercel/output/` (Vercel Build Output API v3 static format)
4. `vercel pull` — refreshes `.vercel/project.json` project link
5. `vercel deploy --prebuilt` — uploads static files; Vercel does not rebuild.
   **A non-zero exit is verified, not trusted** — see "Deploy verification" below
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

Fires on: Build FAILED, Package FAILED, Deploy FAILED, fee anomaly (advisory), and
deploy-CLI-errored-but-published (advisory).

**Card shape.** `sendTeams` takes an optional `extra: { facts, mono }`. `facts` are
label/value rows appended above the standard Project/Host/Time; `mono` is an **array
of lines** rendered as a monospace block. Callers that pass neither get the same card
as before — `pipeline.mjs` and `sitecore-fee-watch.mjs` are unchanged.

- **`mono` is one `TextBlock` per line, deliberately.** A single TextBlock containing
  `\n` does not reliably break in Teams — Adaptive Card markdown wants a blank line —
  which silently collapses a timings table into one run-on line.
- The severity band is a `Container` with `style: attention | good`. That is what
  replaced MessageCard's `themeColor` bar; the text inside must **not** set `color`,
  or it renders Attention-red on an Attention-red band.
- `msteams: { width: 'Full' }` — without it the card is narrow and monospace rows wrap,
  which defeats the alignment.
- **Adaptive Cards have no code spans.** Backticks render literally, so command names
  in alert copy use plain quotes.
- The legacy `*.office.com` MessageCard path folds `facts` and `mono` into the text
  body — plainer, but it carries the same information.

### Deploy verification

`vercel deploy` has exited non-zero on deploys that actually reached production —
2026-08-11 (×2), 08-12, and 08-14, always `Error: Not authorized` thrown *after* the
upload was accepted. Every one of those deployments was `Ready` and serving the
production alias, so four "Deploy FAILED" pages were for releases that worked.

`verifyPublished()` in `pipeline.mjs` therefore treats the exit code as a hint and the
API as the authority. On a non-zero deploy it parses the deployment URL out of the
deploy output, then asks **what the production alias is serving right now**, and
requires it to be that exact deployment, and `Ready`.

- **Inspect the alias, not the deployment.** `vercel inspect <deployment>` lists every
  alias the deployment has *ever* held, so a superseded one still looks aliased and
  would be waved through — confirmed against a real superseded deployment. Inspecting
  `bvc-app.vercel.app` instead resolves to whatever currently serves it.
- Anything unprovable is a failure: no URL in the output, `inspect` erroring, or the
  alias serving something else. A genuinely failed deploy leaves the alias on the
  previous deployment, so it still reports.
- When it does confirm a publish, the run continues and Teams gets an **advisory**
  card (heartbeat suffix `null` — the run's real outcome pings a few steps later).
- Scope/project live in `VERCEL_SCOPE` / `VERCEL_PROJECT`; verification must target
  the same project as the deploy, so they are single-sourced rather than inline.

**The fee anomaly alert must not touch the heartbeat.** It fires mid-run, while the
pipeline is still working, so pinging there would tell the monitor the run had ended
when it had not — and the genuine outcome (deploy succeeded or failed) pings a few
steps later anyway. `notify()`'s 4th argument is the heartbeat suffix: `'/fail'`
(default) for a real breakage, `''` for "completed as designed", and **`null` to send
Teams + toast without pinging at all**, which is what the anomaly alert passes. The
card still renders in the attention colour — an anomaly is worth a human look, it just
no longer stops the release.

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
The guard raises an alert when **≥25% of comparable sections and ≥10 sections** change
price in one run.

**It is advisory — it never stops a deploy** (changed 2026-08-14). It used to `exit(2)`
and hold the site on the previous data, which traded one failure for a worse one:
Sitecore publishes hourly, so a held run dropped that hour's *real* content changes too,
not just the suspect prices. With the sync flipping, roughly every second run was held
and the site silently fell hours behind — three consecutive hours went unpublished on
2026-08-14 before anyone noticed, because a held run looks identical to a healthy one
from the outside. Detection and reporting are unchanged; only the veto is gone.

- Baseline: `.pipeline-state/fee-baseline.json` (git-ignored, machine-local). Advanced
  after a successful deploy — so now normally every run, which makes the report mean
  "changed since the last publish" rather than "since some older run".
- Suppress the check entirely (skips the *reporting* too): `node pipeline.mjs
  --skip-fee-guard` or `SKIP_FEE_GUARD=1`. Rarely wanted now that it cannot block.
- Tune: `FEE_GUARD_THRESHOLD` (default `0.25`), `FEE_GUARD_MIN_CHANGED` (default `10`).
- Exit codes: `0` = ran (with or without an anomaly), `1` = build/package/deploy failure.
  **Exit `2` no longer occurs.**

### Fee watcher (`sitecore-fee-watch.mjs`)

Second PM2 app, `bvc-fee-watch`, cron `'0 */5 * * * *'`. Read-only GraphQL polls
against Sitecore Edge — no build, no deploy, nothing written.

Separate from the fee guard on purpose. The guard sees the catalogue once an hour,
only while the pipeline runs, and reports a percentage; it answers *"how much of the
catalogue moved in this release?"*. Neither is a gate — both are notification channels.
The watcher answers *"when exactly did upstream change, and to what?"* — it
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

### SiS health watcher (`sis-health-watch.mjs`)

Third PM2 app, `bvc-sis-health`, cron `'0 2-59/5 * * * *'` — every 5 minutes, offset
from `bvc-fee-watch` so the two never start in the same second. Read-only: it creates
no cart and submits no registration.

**The highest-severity watcher of the three.** The fee guard and fee watcher report
wrong *prices*; this one reports a cart that cannot take an order at all. Nothing else
touches the live API a shopper hits on Add to Cart — the fee watcher polls Sitecore
Edge, a different system holding catalogue data.

```bash
node sis-health-watch.mjs            # one poll, prints per-probe timings
node sis-health-watch.mjs --history  # recorded state changes
```

**It alerts on LATENCY, not status codes.** Measured 2026-08-18 against production —
15 identical requests to `courseofferings/2428`:

```
min 2.8s   median 10.9s   max 90.3s   mean 31.5s      every one HTTP 200
```

SiS does not fail by answering wrong; it fails by answering late. The `504 Gateway
Timeout` the browser shows is the Vercel proxy giving up on a call SiS would
eventually have completed. **A status-code check would have reported everything
healthy throughout the entire outage**, which is why this watcher times every probe
and treats the status code as secondary.

- Probes all three endpoints the cart depends on — `courseofferings` (add to cart),
  `validation` (seat check), `fee` (checkout total). All three degraded together on
  2026-08-18, so probing one would under-report.
- **`mstoken` is the control, and every alert carries it.** It runs on the *same*
  Vercel project as the cart endpoints and held 0.29–0.90 s while they ranged to 90 s.
  Fast control + slow probes = the fault is the SiS backend, not the proxy. That
  comparison is in the Teams card so nobody re-derives it under pressure.
- **Every log line and alert names the environment it measured** — proxy origin,
  SiS backend, offering id, and the endpoint path per probe. The backend is read
  from the proxy's `X-Api-Base` header on each poll rather than hardcoded, because
  a hardcoded one was already wrong: prod forwards to `api.bowvalleycollege.ca`,
  UAT to `apim-bvc-uat-001.azure-api.net`, and **`devapi.bvc.dev` is the dev host
  that these docs and the alert text wrongly named until 2026-08-19**. Without the
  stamp, a log line from a run with `SIS_API_ORIGIN` pointed at UAT is
  indistinguishable from a prod one — and these logs go to the SiS team as
  evidence. See `docs/sis-api.md` → *Environments*.
- `SLOW` at 8 s (`SIS_WATCH_SLOW_MS`) — above a healthy ~2 s call, below the 10.9 s
  incident median. `DOWN` on non-2xx or past 30 s (`SIS_WATCH_TIMEOUT_MS`), because a
  call that slow has already produced a 504 in someone's browser.
- **Two consecutive bad polls before alerting** (`SIS_WATCH_FAILS_BEFORE_ALERT`). This
  backend is erratic enough that one unlucky sample must not page anyone. Teams
  alerts then cool down for 1 h (`SIS_WATCH_COOLDOWN_H`); a **recovery** message is
  sent when it returns to OK, so an open alert never goes stale.
- Its own heartbeat, `HEARTBEAT_SIS_URL` — success when healthy, `/fail` when not.
  Separate from `HEARTBEAT_URL` because "SiS is unhealthy" and "the deploy pipeline
  failed" are different conditions needing different alarms. This is also the only
  thing that catches the watcher itself dying.
- State: `.pipeline-state/sis-watch-last.json`; incidents: `sis-watch-history.jsonl`.
- Always exits 0.

> The repair is not in this repo. `bvc-api-proxy` is a separate Vercel project, and
> the slow leg is the SiS backend behind it. This watcher exists to prove *when* it
> degrades and hand the SiS team timestamps they can match to their own logs.

### Log archiver (`archive-logs.mjs`)

Fourth PM2 app, `bvc-log-archive`, cron `'0 30 3 * * *'` — daily at 03:30. Moves
every **complete** day out of `logs/` into OneDrive, filed by ISO week and day:

```
C:\Users\jcueto\OneDrive - Bow Valley College\General\Matrix\Open Cart\
  2026-W34\2026-08-19\pipeline-out.log, sis-health-out.log, fee-watch-out.log, …
```

```bash
node archive-logs.mjs --dry-run   # report what would move, touch nothing
node archive-logs.mjs             # archive and truncate
```

`logs/` is append-only and nothing prunes it — `pipeline-out.log` alone grows
~2 MB/day. But disk is the lesser reason. **Every log this project produces lives
on one laptop**, including the SiS timings the SiS team is being asked to act on;
if that machine is rebuilt or lost, so is the entire record. OneDrive is backed up
and shareable.

- **Only complete days move.** Today is still being written, so archiving it would
  split one day across two runs and leave the archive looking complete when it is
  not. Local logs therefore hold today and nothing else.
- **Every archive write lands before anything is truncated.** A partial archive
  followed by a truncate loses logs outright — worse than the disk it was freeing.
- **A missing archive root aborts the run.** If the path is wrong or OneDrive has
  not mounted, creating the folder ourselves would file logs into a directory that
  never syncs — they would look safely archived while still on one disk.
- **`pm2 reloadLogs` runs after truncating.** PM2 holds each log open at its own
  write offset; once the file shrinks that offset is past the end and PM2 pads the
  gap with NUL bytes. Skipping this is what corrupts rotated logs.
- **It skips its own live logs** via PM2's `pm_out_log_path` / `pm_err_log_path`,
  which it would otherwise truncate mid-write. Run by hand, it archives everything.
- Day grouping reads the `2026-08-19T08:45:12: ` prefix PM2 writes (`time: true`).
  All 56k existing lines carry it; a line without one inherits the day above it
  rather than being dropped.
- Folder is `2026-W34` by **ISO week-year**, not calendar year — so 2026-12-31 and
  2027-01-01 file into the same week, which is the point of grouping by week.
- Destination overridable with `LOG_ARCHIVE_DIR`.
- **Nothing is ever deleted from the archive.** Pruning is a human decision.

> 03:30 is chosen, not arbitrary: `bvc-fee-watch` fires on minutes divisible by 5,
> `bvc-sis-health` on :02/:07/:12…, and `bvc-hourly-deploy` at :15. Nothing starts
> at :30, so the truncate cannot race a poll mid-write.

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

**`src/js/shared/`** holds logic imported by more than one bundle. It is not an
entry point — esbuild inlines it into each one, so there is no runtime dependency
between the bundles.

| Module | Exports | Used by |
|---|---|---|
| `fees.js` | `fetchCartFees`, `dedupeFees`, `summariseFees`, `feesForSku` | os-course, ee-course, checkout |
| `validation.js` | `validateCart`, `readValidation`, `isConflict` | os-course, ee-course, checkout |

Both are free of cart/session/DOM coupling — callers own their own storage and
rendering. They exist because checkout has to recalculate fees after pruning a
course from the cart, and because the fail-open rules for `/validation` are subtle
enough that three copies would drift. See "Cart availability checks" below and
`docs/sis-api.md`.

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
  program-requirements.html          # SNIPPET ONLY — the two loader tags for program-requirements.js/.css
  extended-education-listing-cards.html  # SNIPPET ONLY — the one loader tag for ee-listing.js
```

Three flavours of embed live here:
- **Inline snippets** (the course listing/detail files above) — self-contained HTML+CSS+JS pasted whole into an Embed block.
- **Bundled-asset embeds** (`checkout-cart.html`, and the `os-course` / `ee-course` / `checkout` runtimes) — the HTML is just markup carrying `data-*` hooks; the CSS and JS are separate bundled files loaded from Vercel via `<link>` / `<script src>`. Source is `src/js/<name>/` + `src/css/<name>.css`, built by `js:build`. See the JS/CSS build commands above.
- **Loader-tag snippets** (`program-requirements.html`, `extended-education-listing-cards.html`) — nothing is pasted into an Embed block at all. The file is documentation wrapped around the one or two `<script>`/`<link>` tags that go in the page's "Before `</head>`" custom code; the script finds its own mount. See "Extended Education course availability" below.

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
- **`data-base-url`** on the container div points to the Vercel deployment. Production Webflow embeds use `https://bvc-app.vercel.app`.
- **Checkout-cart embed**: a multi-step personal-info form (**Start → Personal → Mailing**; there is **no in-form payment tab and no in-form cart**), not a course renderer. Root hook is `[data-checkout]`; the runtime binds `data-*` attributes (`data-step`, `data-field`, `data-next/back`, `data-student-type`, terms/refund consent, `data-billing-same`, `data-billing-block`, `data-address-autocomplete`, `data-phone-combined`, `data-checkout-submit`). Load order: `<link .../css/checkout-cart.css>` + `<script .../js/checkout-cart.js defer>` in page settings, then paste `src/webflow/checkout-cart.html` into an Embed. `content.js` is the single source of truth (fields, options, copy, MSAL, and the `googleMaps` / `phone` / `cart` config); regenerate markup with `npm run checkout-cart:html` — never hand-edit. Modules: `field / consent / stepper / validators / storage / msal-auth / address-autocomplete`.
  - **Mailing step** = a Mailing address + a Billing address (5 mandatory fields each: Street, City, Province, Postal Code, Country). "Billing Address same as above?" (`data-billing-same`, default checked) hides billing and exempts it from validation. Street fields have Google Places autocomplete (`address-autocomplete.js`) that fills the rest of the group — **inert until `config.googleMaps.apiKey` is set**; manual entry always works.
  - **Phone**: visible `#phoneNumber` (10 digits) plus a `phoneCountryCode` select (default **+1**, auto-follows the mailing Country). Submitted as a **combined hidden `#phone` = `+1XXXXXXXXXX`** (no separator).
  - **ASN** is visible/required **when the cart contains credit-bearing courses** (any `cartItems[].credits > 0`, falling back to `sessionStorage.totalCredits`), hidden and exempt from validation when none do. It is re-read on every step change. `?type` no longer gates it — a cart can mix Open Studies and Extended Ed items. The submitter mirrors this in `cartRequiresAsn()`.
  - **Field ids** are aligned to what the submitter reads via a `submitId` override (`postalCode→postalcode`, billing `streetAddress-2/city-2/province-2/postalCode-2/country-2`, OS asn `asn-os`, billing-same checkbox `checkbox`, terms `checkbox-2`).
  - **Submission**: the Mailing step's **"Proceed to Payment"** button (`data-checkout-submit`) validates, then dispatches a `bvc:checkout-submit` DOM event. The separate `public/js/checkout.js` (source `src/js/checkout/index.js`) listens and runs the purchase: **create token → registration → submit-payment → redirect to the Flywire payment page**. It reads courses/fees from the session cart (`sessionStorage.cartItems` / `feeSession`) and richer fields from the form. Contract: `studentId:0`, **empty `studentPk`** (a non-empty value 500s for new registrations); coded enums (gender/language/legalStatus/ethnicity) pass through `*_MAP` tables in checkout.js with known-good defaults — fill them from the SiS enum to send real values.
  - **Page-owned scaffold**: the Webflow **page** provides `#shoppingCart` (the cart column) and optionally `#registerToCourse`. The embed must **not** declare those ids (a duplicate id shadows the page's, leaving its cart empty). checkout.js renders the cart into the page's `#shoppingCart` and re-renders it on every `bvc:checkout-step` event. Its `DOMContentLoaded` is null-guarded so missing scaffold never throws.
  - The course-page cart button ("Proceed to Checkout") in `os-course.js` / `ee-course.js` navigates to the checkout page with `?type=os` / `?type=ee`.

### bvc-app — Extended Education course availability

`/study/extended-education` renders its Courses grid from a Webflow collection
list, so a card appears when an editor publishes a CMS record — which says
nothing about whether the SIS has a section to sell. 21 of the 60 published
records currently have none, so a third of the grid led to a course nobody
could register for.

`src/js/ee-listing/index.js` → `public/js/ee-listing.js` fixes that from the
page's `<head>`. Loader tag and full setup notes:
`src/webflow/extended-education-listing-cards.html`.

```bash
npm run generateExtendedEducationJson   # scripts/buildExtendedEducationCourses.mjs
```

- Data: `/data/extended-education-courses.json`, built by joining the Webflow
  CMS snapshot (slugs, names, areas) with `coursesIndex.json`, the SIS list of
  courses that have sections. It emits **every** published course with an
  `available` flag — including the withheld ones — so the file records what was
  hidden and why rather than silently shrinking. Runs inside `bvcapp-scripts`
  and `hourly-scripts`, after `generateCourseData` writes the index.
- **It refuses to write an empty availability list.** An extraction failure
  would otherwise mark every course unavailable and blank the page.
- **Externally-registered courses are kept.** PSKN and the two PMI courses set
  `no-cart-ext-ed-course` with an `apply-now-link`; they are registered on a
  third party's site and have no SIS offering by design. They are matched on
  page slug, not course code — they have no course code at all, and Webflow
  renders their code field as an empty `.w-dyn-bind-empty`.
- Codes are compared whitespace-stripped and upper-cased: Webflow holds
  `TECH 9400` where the SIS has `TECH9400`.

**The script removes cards; it does not rebuild the grid.** That is the whole
design decision, and it was arrived at the hard way. The first version rendered
every card from the JSON with markup copying Webflow's classes and Finsweet
attributes exactly. It looked right and it broke the page's filters. Measured
against production:

| approach | counters | filtering |
|---|---|---|
| `fsAttributes.destroy()` + `init()` | updated | **dead** — search and Area stopped filtering |
| `CMSList.clearItems()` + `addItems()` | updated | **dead** — "Business" left all 38 valid, not 15 |
| prune `CMSList.items` in place | needs a nudge | **intact** — "Business" → 15 of 38 |

Finsweet keys each card to a `CMSItem` holding props it derived at index time.
A replacement element loses that association however identical its HTML; the
original element keeps it. So the JSON decides *which* courses appear and
Webflow's own elements are reused for the ones that stay — which puts the
identical set on the page, and keeps search, sort and the Area filter working.
Verified live: trimmed to 38, "Business" matched 15 (15 on the page),
"Technology" 11 (11 on the page), cleared 38.

- The script drops the removed cards from `CMSList.items` / `validItems` /
  `originalItemsOrder` as well as the DOM, then writes the `results-count` /
  `items-count` elements directly — Finsweet does not re-render those just
  because the list shrank, and left alone they claim 60 items over 39 cards.
- If Finsweet has not initialised yet, none of that is needed: it indexes the
  trimmed list itself. The instance lookup resolves to `null` and is skipped.
- **Every failure path leaves the page as Webflow rendered it** — all cards
  shown, nothing hidden, nothing invisible. That covers a hung fetch, a 404, an
  empty dataset, and a card the dataset has never heard of (fail open: hide
  what is known to be unsellable, not everything unexplained). A `visibility`
  rule hides the grid while cards are being removed, with a hard failsafe timer
  so a stall can never leave it invisible.
- `renderMissing` (default off) appends cards for courses the SIS can sell that
  have no Webflow record. There are none today, and such a card is the one
  element Finsweet would not have indexed — invisible to search and filters.
  The console names them either way; the real fix is the Webflow record.

> Pre-existing and untouched: the "Starts in" month select filters on a `Month`
> field no card has ever carried, so choosing a month empties the grid.

### bvc-app — Course outline PDFs

Outlines live in `src/bvc-app/public/data/course-outlines-pdf/` (6,051 files,
~1.5 GB) and are served at `/data/course-outlines-pdf/{filename}`.

**Vercel's static host 404s any filename containing a non-ASCII byte.** Verified
against production: an ASCII name with spaces and parentheses serves `200`, while
the same file carrying `U+00A0`, `U+2013` or `U+2019` in its name 404s no matter
how the URL is percent-encoded. The file uploads fine and sits in
`.vercel/output/static/` — it simply cannot be addressed.

The DB export re-emits Word-style smart punctuation in course titles on every run,
so this recurs. 152 files across 36 course codes were affected when first found
(`U+00A0` no-break space ×113, `U+2013` en dash ×34, `U+2019` right quote ×5) —
which broke the outline link on 6 program pages: 3DAM, AVFX (ANMO2101), DCSD,
GASH, SW (HMSV1105), and ITS (TECH1203).

```bash
npm run sanitizeOutlines         # rename + rewrite URLs
npm run sanitizeOutlines:check   # report only, touch nothing
```

`scripts/sanitize-outline-filenames.mjs` runs **first** in both `hourly-scripts`
and `bvcapp-scripts`, because the generators resolve `pdfFilename` by reading the
directory — the names have to be clean before they look.

- **Only non-ASCII names are touched.** A plain-ASCII name is already addressable
  however odd it looks — `SODV1400_Scripting  Fundamentals` ships a double space
  and serves `200` — so renaming it would churn files for nothing.
- Accents are folded to their base letter (NFD) before the strip, so a French
  title degrades to `Cafe` rather than `Caf`. Anything still non-ASCII is dropped
  rather than guessed at.
- **A rename never overwrites an existing file.** Where an ASCII twin is already
  present it is the one being served, so the odd-named duplicate is left alone.
- **It rewrites the URLs too.** The `program-requirements` datasets are
  hand-maintained JSON with the outline URL typed in (see
  `generateProgramRequirements.mjs`), so renaming the file alone would leave those
  links pointing at a name that no longer exists. All four mirrors are updated —
  `public/data/static/` and the gitignored `src/data/static/` copy of both
  `program-requirements/` and `program-requirements-by-code/`. The Open Studies
  generators read the directory, so they need no rewrite.
- Stale copies are dropped from `out/` and `.vercel/output/static/` so an earlier
  build cannot carry an old name forward into the package.
- `main()` is guarded on `process.argv[1]`: importing the module for its
  `sanitize()` export must never rename anything.

**Which outline a course gets is decided in one place**, `scripts/lib/resolve-outline-pdf.mjs`.
Two scripts used to resolve it independently and disagreed about what a filename
even looks like, because the export has emitted two naming generations:

```
ACCT1103_Introduction to Financial Accounting_Fall 2023_Current.pdf     (older)
ACCT1103_Introduction to Financial Accounting_(Fall 2023_Current).pdf   (current)
```

`generateOpenStudiesPublicJson` matched only the bare form and
`buildOpenStudiesByArea` only the parenthesised one. Measured over all 1,196 SIS
ids holding an outline: **100 had only a parenthesised current outline** and so
got no download link at all, and **217 more linked a stale term** — JUST1101
served Winter 2025 while its Fall 2026 outline sat unused. Fixing it in one place
means a third naming generation is one change, not three.

- **Ordering is by term, not by string.** The old `buildOpenStudiesByArea` took
  the first `_Current)` it happened to encounter and otherwise fell back to
  `sort().pop()` — a lexicographic sort that ranks "Winter 2021" above
  "Fall 2026". Both are now ranked on parsed `(season, year)`.
- **Where both naming twins exist the parenthesised one wins.** They are
  byte-identical for 700 of 703 courses; for the 3 that differ the parenthesised
  file is the newer re-export.
- **`fallbackToLatest` is opt-in.** Off for the course pages, so a course whose
  outline was retired shows no link rather than a superseded one; on for the
  listing table, where a dated outline beats an empty cell. That preserves what
  each script already did.
- Verified across the catalogue before and after: 100 courses gained a link,
  217 moved to a genuinely newer term, 703 were same-term twin swaps, and
  **0 regressed**. All 61 files the resolver picks for the live Open Studies
  site return 200.

> Extended Education has no outlines at all — `src/js/ee-course/index.js` sets
> `pdfFilename: null` outright, so none of this applies to it.

> **The hourly job does not publish PDFs at all.** `pipeline.mjs --data-only`
> excludes `course-outlines-pdf` from its overlay (1.5 GB it never touches), so a
> new or renamed outline reaches the site only on a full `node pipeline.mjs`.

### bvc-app — Cart availability checks

Nothing is registerable just because it rendered. The course pages are statically
generated hourly, and the cart then sits in `sessionStorage` for the whole session,
so what the shopper sees can be hours stale. Four checks run against the SiS API,
all of them on an action the shopper took — **none on page render**, see below.
Full API contract and its known defects are in **`docs/sis-api.md`**.

| When | Check | Catches |
|---|---|---|
| Add to cart | `courseofferings/{sku}` | 404s, and the seats it does know about |
| Add to cart | `validation` (solo) | full **and** withdrawn sections, accurately |
| Checkout load | `validation` per item | anything that died since it was added |
| Checkout submit | `validation` per item | anything that died while the form was filled in |

**`seatsAreAvailable` is not a reliable seat check.** It reported seats for 37 of the
42 sections the SiS refuses to register, including one confirmed full on the live
site. `/validation` is the only trustworthy source, and it reports a full section as
`Offering Missing` — the same code it uses for a withdrawn one, so user-facing copy
has to stay generic.

**Reading a validation response**: an invalid cart arrives as **HTTP 200** with the
verdict in the body, so `response.ok` only ever means the call was well-formed. All
three bundles go through `readValidation()` in `src/js/shared/validation.js`, which
returns `null` for anything it cannot interpret. Every caller **fails open** on
`null` — a validation outage must never become a cart outage, and registration still
gates the transaction server-side.

**Checkout repair** (`checkout.repairCart()`) runs after the first paint and again
before submit. It validates each item **on its own**, drops explicit failures,
recalculates the cart-level fees for what remains (`shared/fees.js` — stale fees
would otherwise be billed), rewrites `cartItems` / `feeSession` / `totalCredits`,
shows a notice naming what went, and dispatches `bvc:cart-updated` so the form
re-evaluates ASN visibility. A non-empty result aborts the submit rather than
creating a registration that `submit-payment` would reject.

**Nothing is checked to RENDER a section** (changed 2026-09-01). The course pages
draw their offerings from the Sitecore JSON alone. `bindOfferings()` used to run a
serial `courseofferings` sweep across every section before revealing the enrolment
list, hiding any that did not answer with seats — three failures in one:

- it keyed on `seatsAreAvailable`, which is the unreliable flag above, so it hid
  sections that were on sale and kept ones the SiS refuses;
- the calls are serial against a 10.9 s-median backend, so the list sat behind a
  "Checking availability…" spinner for minutes on a course with many sections;
- **any SiS degradation emptied the page**. Every probe failing hid every section,
  and the fallback copy said "No sections currently available." — a healthy
  catalogue rendered as a course nobody could buy, with nothing to say otherwise.

Availability is now decided at the only moment it can be acted on — the **Add**
click. On a refusal the button greys out (`.unavailable`) and reads "Unavailable"
with the reason in its `title`. Refusals persist for the session in
`unavailableStore`, so a greyed button stays greyed across re-renders and
back-navigation without another call.

**The wait is signalled in two places, deliberately.** The button gets a spinner
and a "Checking…" label at **full opacity** — the first version dimmed it to 0.6,
which was reported as the button *disappearing* rather than working, and it is
right: fading the one thing that changed is the opposite of feedback. Alongside it
`busyToast` raises a fixed "Checking availability…" toast at `z-index: 10001`,
above the sliding cart (9999) and its overlay (9998). Either indicator alone can
go unseen — the button can be scrolled out of view or, on a successful add, be
covered by the cart sliding over it; the toast is the one that survives both.
Unlike `showNotification`, it has no timer: it is torn down when the work ends,
not 3 s later, because 3 s is meaningless against a 10.9 s median. Once the cart
is open it hands off — the cart's own fee spinner takes over and the toast hides,
so there are never two spinners claiming different things.

**Extended Education has no international price and no additional fees.** Both
were being displayed anyway, and both are now suppressed from the data rather
than by hardcoding a rule per product line.

| | international set | differs from domestic | fee API returns |
|---|---|---|---|
| Extended Ed | 83 of 87 sections | **0** | `[]` (12 courses sampled) |
| Open Studies | 221 of 221 | **221** (e.g. 646 vs 1678) | 4 fees, $225 |

- **The second price renders only when it actually differs** — the rendered
  strings are compared, so equal-after-rounding is equal on the page. Sitecore
  populates `international` for nearly every EE section, but it just repeats the
  domestic figure, so the page printed "$120 Domestic Student / $120
  International Student" and invited the reader to hunt for a difference that is
  not there. Verified across the whole catalogue: EE 0 of 87 sections show it,
  OS 221 of 221 keep it, and **no course is mixed** — so the rule cannot half-
  apply to anything. It is data-driven on purpose: if an EE course ever gains a
  real international rate it appears without a code change.
- **"Domestic Student" goes with it.** With no second price to contrast against,
  the qualifier implies a distinction that does not exist.
- **`ee-course` drops the "Additional fees apply" note.** The fee API returns an
  empty set for every EE offering tested (12 sections, 12 different courses)
  against 4 fees for every OS section, so the note promised a charge that never
  arrives. **The fee call itself is deliberately kept on add-to-cart**: checkout
  totals the cart from the session rather than re-asking the API, so skipping it
  would silently undercharge if EE ever does gain fees.
- **Zero-value cart rows are omitted.** An EE cart has no additional fees and
  often no tax, and was printing two `$0.00` lines.

**Credits are shown only when there are credits.** Extended Education carries
`credits: 0` on all 126 of its sections (Open Studies is 3/4/6), so the accordion
and the cart were both printing a literal "Credits 0". Data-driven like the price
rule above, so an EE course that ever gains credits shows them. **The
`data-product-credits` attribute is still emitted at 0** — checkout decides ASN
visibility from `cartItems[].credits > 0`, and a mixed EE + OS cart needs the
zero present rather than missing. Hiding the display must not change the data.

**Schedule day codes are normalised by `parseSchedule()`.** Sitecore emits one
scheme — **`Su M T W Th F Sa`** — confirmed across all 14 distinct tokens in the
catalogue. Note what is absent: no `R` for Thursday, no bare `S`, no `U`. The old
`dayCodeMap` was built for that other (registrar) scheme *and* looked up whole
tokens as single letters, so only `M`/`T`/`W`/`F` ever matched — `Th`, `Sa`,
`MW`, `TTh`, `FSa`, `ThF` all fell through and printed raw. That is why one row
read "Mondays" and the next read "TTh".

- Matching is **greedy longest-first** (`Su`,`Sa`,`Th`,`Tu` before `M`,`T`,`W`,
  `F`), so `MTWThF` cannot mis-split. `R`/`S`/`U` are kept as a defensive
  fallback against an upstream scheme change.
- An unparseable token is **printed verbatim**, never guessed. Showing an
  unrecognised code is bad; inventing days is worse.
- **`SuMTWThFSa 12:00 AM - 12:00 AM` is a placeholder, not a schedule** — 100
  occurrences (51 EE, 49 OS), the most common value in the data, and the only
  thing that midnight window is ever paired with. Rendered literally it claims
  the class meets every day at midnight. It now reads "Self-paced — study any
  time" with no time. **Both conditions are required**: all seven days with real
  hours is a genuine schedule and still renders as seven days.
- Where there is no meeting time, the colon and the `Hours:` row are dropped in
  both the accordion and the cart, rather than left dangling over an empty value.
- **`scheduleBlocks()` removes two kinds of upstream noise** before rendering.
  Sections repeat an identical block (`FSa 8:00 AM - 4:50 PM` twice on the same
  section), which printed the same line twice; and **18 sections (11 EE, 7 OS)
  carry the placeholder ALONGSIDE real meeting times**, which read as a section
  that both has no set time and meets on Fridays. Duplicates are collapsed, and
  where a real block exists it wins — the placeholder is only shown when it is
  the only thing there is to say.
- Verified against all 84 distinct schedule strings in the catalogue: 0 printed
  raw. The test drives the parser extracted from the BUILT bundle, not the source.

**An offering with no price captures interest instead of selling.** Sitecore
sends `fees: { domestic: null, international: null }` when nobody has entered a
price — four Extended Education courses today (ADMN9302, DESN9315, ISEC9105,
ISEC9208), one section each. `domesticAmount` coerced that null to `0`, so the
page advertised **"$ 0 CAD" behind a live Add button** and a shopper could carry
a free course to checkout. Confirmed on production before the fix.

- **`sectionHasPrice()` gates everything.** When a course has NO sellable
  section, `renderOffersColumn()` drops the entire offerings list — delivery
  type, campus, date-range accordion, hours, registration window, schedule — and
  renders the interest form. All of that describes an offering the shopper
  cannot have, and sitting it next to "no offers are available" reads as a
  contradiction. The heading becomes **"Register your interest"**, since "Enroll
  now" over a panel with nothing to enrol in is its own small lie.
- **Mixed courses keep what sells.** If some sections have a price and some do
  not, the priced ones render normally and the priceless ones are left out, with
  a console warning naming the count so a missing price is diagnosable rather
  than invisible. No course is mixed today.
- **The form is inline, not behind a button.** Once the panel carries no course
  detail there is nothing for a modal to reveal, so the click was friction in
  front of the only thing on offer.

**`src/js/shared/interest-form.js`** holds both ends of the round trip — the
course pages render the form, the Extended Education listing shows the popup
ClickDimensions redirects back to.

- Posts to the ClickDimensions form `aP8W4U9m7qUqri3nnRw6WT` with the same five
  fields and reCAPTCHA as `/forms/program-form`, and the same hidden CRM fields
  (`s_type`, `funnelStartingStage`, `initialTouchPoint`, `contact_type`,
  `campaignType`) — they are how the lead is routed. **`cd_visitorkey` is
  deliberately NOT copied**: ClickDimensions sets it per visitor, and a fixed
  value would attribute every enquiry to one person.
- **The course rides in `s_faqs`.** That field already submits the sentence "I
  am interested. Contact me with more information."; it now names the course.
  This is the ONLY thing that identifies the lead — the form has no course field
  and redirects to one FIXED url, so nothing else carries it.
- **The redirect is configured in ClickDimensions, not here.** The form has no
  `ReturnUrl` field. It must point at `…/study/extended-education?m=success` and
  `?m=error`. `readSubmissionOutcome()` also accepts a bare `?m-error`, which is
  the literal form the redirect was specified in and parses as a parameter
  *named* "m-error" rather than a value — keying only on `m` would show nothing
  on every failed submission.
- Success auto-closes after 10 s (measured 10.4 s); **an error does not**, because
  the person has just lost what they typed. The marker is stripped from the URL
  so a refresh cannot replay the popup.
- **`fitRecaptcha()` measures rather than guesses.** The widget is a rigid
  304×78 iframe Google will not reflow — the only thing in this form that cannot
  adapt. It is scaled to the column's real width, re-fitting on resize and
  orientation change. A media-query breakpoint would have to assume Webflow's
  page gutters, which can change without us. Verified 430→280 px: fits at every
  width, no horizontal page overflow.
- The cart's remove control grows to 40×40 under `@media (pointer: coarse)` —
  28 px is fine for a mouse and well under the ~44 px a finger needs, and it is
  the one destructive control in the cart.

**Cart copy lives in one `MSG` map per course bundle.** The strings had drifted
apart in three ways at once: four nouns for the same thing ("this date", "this
offering", "Item", "products"), inconsistent terminal punctuation, and a button
`title` that disagreed with the toast fired at the same moment. Worse,
`showNotification(error.message)` put raw exception text in front of shoppers —
"Failed to fetch", "Failed to check course availability (status 502)". Convention
now: full sentences, terminal period, **"this date"** for the accordion the
shopper opened (it is labelled with a date range — "offering"/"section" are
internal words) and **"course"** for a cart row. `readValidation()` in
`shared/validation.js` follows the same rules so API verdicts match. The raw
error still reaches the console; the shopper gets `MSG.unexpected`.

> Deliberate and preserved: **ee-course treats a failed fee calculation as
> non-fatal** and still reports success, where os-course says checkout is
> unavailable. That divergence is intentional (`// Fees are optional for EE`),
> so only the wording was unified, not the behaviour.

**The cart's remove control is an icon in the row's top-right**, not a red block
above the course name. It used to be emitted *first* in the row markup and styled
as a solid `#e74c3c` "Remove" button, which made the destructive action the
loudest thing in every row and left the course name reading as its caption.
`.cart-item` had carried `position: relative` all along for a fix that was never
written. The control now renders last in source order, is pulled to the corner
absolutely, and `.cart-item-name` reserves `padding-right: 32px` so a long course
name wraps around it rather than under it (verified: 85-character name over three
lines, 5 px clearance). The handler uses `closest('.remove-item')` and reads
`data-sku` off that element rather than `event.target`, so a click landing on a
child cannot lose the sku.

**The checkout submit is covered by an overlay** (`submitOverlay` in
`src/js/checkout/index.js`). "Proceed to Payment" fires validation → registration →
`submit-payment` → the Flywire redirect: two SiS calls, so the page previously sat
inert for anything up to ~90 s with no feedback, which invites a second click and a
second registration. A fixed full-viewport overlay with a spinner goes up before the
pre-submit repair, names each step as it advances, and blocks the repeat click. It
is **never hidden on the success path** — the navigation is what removes it, so
there is no bare-page gap before the redirect. Every failure path hides it
explicitly, and `handleSubmit()` wraps `runSubmit()` so an unexpected throw cannot
strand the shopper behind a spinner that never resolves. Styles are injected by the
script rather than shipped in a stylesheet, because `checkout.js` has no paired CSS
bundle and must not depend on `checkout-cart.css` being on the page.

> Fixing that overlay exposed a second bug: the registration `catch` **swallowed
> every error** — its two `alert()` calls were commented out — so a failed
> registration did nothing visible at all. It now calls `showErrorMessage()`.

**Config flags** — set before the scripts load, no rebuild needed:

| Flag | Default | Where |
|---|---|---|
| `validateOnAdd` | `true` | `__OS_COURSE_CONFIG__`, `__EE_COURSE_CONFIG__` |
| `validateConflicts` | **`false`** | all three configs |
| `repairOnLoad` | `true` | `__BVC_CHECKOUT_CONFIG__` |

> **`validateConflicts` is off for a reason.** Sending the whole cart lets the API
> report a clash *between* items — the one thing a per-offering call cannot see — but
> as of 2026-08-17 UAT returns `Timeblock Conflict` for **every** pair of courses,
> including ones meeting on different days (0 of 12 disjoint-day pairs passed). Turn
> it on only once that is fixed upstream; today it would cap the cart at one course.

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
# Optional: separate dead-man's switch for the SiS health watcher. A DIFFERENT
# check from HEARTBEAT_URL — "the cart's backend is unhealthy" and "the deploy
# pipeline failed" need different alarms and different escalation.
HEARTBEAT_SIS_URL=
```

`sis-health-watch.mjs` also reads these, all optional with working defaults:

| var | default | what it does |
|---|---|---|
| `SIS_API_ORIGIN` | `https://bvc-api-proxy.vercel.app` | proxy to probe; point at the UAT proxy to watch UAT |
| `SIS_WATCH_SKU` | `2428` | offering id to time; change if that section is withdrawn |
| `SIS_WATCH_SLOW_MS` | `8000` | at/over this, a probe is DEGRADED |
| `SIS_WATCH_TIMEOUT_MS` | `30000` | give up and call it DOWN |
| `SIS_WATCH_FAILS_BEFORE_ALERT` | `2` | consecutive bad polls before Teams fires |
| `SIS_WATCH_COOLDOWN_H` | `1` | minimum gap between Teams alerts |

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
