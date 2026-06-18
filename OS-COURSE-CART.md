# OS-Course cart — local development

The cart script that runs on the Webflow Open-Studies course pages.

> **Paths below are relative to `src/bvc-app/`.** Run all `npm run …` commands
> from that directory (or with `--filter bvc-app` from the repo root).

## Layout

| Path | Role |
|------|------|
| `src/bvc-app/src/js/os-course/index.js` | **JS source — edit this.** Authored, readable. |
| `src/bvc-app/src/css/os-course.css` | **CSS source — edit this** (course component styles). |
| `src/bvc-app/scripts/build-os-course.mjs` | esbuild bundler → minified JS + CSS. |
| `src/bvc-app/public/js/os-course.js` | **Generated, git-ignored.** Rebuilt fresh on every `npm run build`. |
| `src/bvc-app/public/css/os-course.css` | **Generated, git-ignored.** Rebuilt fresh on every `npm run build`. |
| `src/bvc-app/dev/os-course/` | Local sandbox (never deployed — lives outside `public/`). |

> `os-course.css` covers **both** the course component **and** the cart (overlay,
> notifications, spinner, add-to-cart button states). The sandbox harness only adds
> page chrome + a base button look (which on Webflow comes from the button's own
> `w-button` / `c-button_cart` classes).

## Develop locally (no deployments)

```bash
npm run os-course:dev
```

Then open **http://localhost:4321**. This runs two things together:

1. **esbuild watch** — rebuilds the minified `src/bvc-app/public/js/os-course.js` every time you save `src/bvc-app/src/js/os-course/index.js`.
2. **mock sandbox server** — serves the built script, mock course data, and mock APIs.

Edit the source → save → refresh the browser. That's the full loop. **Live editing = this.**

## What's mocked

- `POST /api/mstoken` → fake bearer token
- `GET /api/bvcpayment?endpoint=…courseofferings/<sku>` → seats available
- `GET /api/bvcpayment?endpoint=…fee/<skus>/<id>` → canned fees
- `GET /data/oScourses/course-MOCK101.json` → mock course (in the script's real shape)

Change what the cart sees by editing `src/bvc-app/dev/os-course/mock/data/*` — no rebuild, no deploy.

The sandbox points the script at itself via:
```js
window.__OS_COURSE_CONFIG__ = { dataOrigin: '', apiOrigin: '', feeApplicantId: 1 };
```
In production these default to the live origins (data: `bvc-thesis.vercel.app`, api: `bvc-uat-api-proxy.vercel.app`, feeApplicantId: `1`).

## Backend API contract (`bvcpayment` proxy)

The cart talks to the registration API through a **passthrough proxy** at
`apiOrigin` (`bvc-uat-api-proxy.vercel.app`, the `nextjs-jamstack` project,
`src/app/api/bvcpayment/route.ts`). The proxy requires a Bearer token and just
forwards `?endpoint=<path>` to `BASE_URL/<path>`, returning the upstream status
verbatim. Current `BASE_URL` = `https://devapi.bvc.dev/extended-edu-registration/v1`
(DEV; a PROD base URL is commented out in the route).

**Tenant prefix changed to `thesissitecorexm.api`** (the old `sitecorexm.api` now
404s). Two endpoints the cart uses:

| Endpoint | Notes |
|---|---|
| `thesissitecorexm.api/courseofferings/{sku}` | availability — returns `{seatsAreAvailable}` |
| `thesissitecorexm.api/fee/{sku[,sku...]}/{id}` | fees — `{id}` **must be a parseable integer** |

> ⚠️ **Fee `{id}` segment (was `null`).** The old API accepted a literal `null`
> here; the new one throws `500 "The input string 'null' was not in a correct
> format."`. It must be an integer. The value does **not** change the returned fee
> amounts (`/1`, `/2`, `/3` are identical) — it appears to be a required
> applicant/student id the API loads (only test ids 1–3 exist on DEV; `0`/`5`/`100`
> → `500 "Object reference not set…"`). The cart currently sends **`feeApplicantId`
> (default `1`)** as a **placeholder**. ❓ **Open question for the API owner:** what
> should an *anonymous* cart send — should the endpoint accept `null`/`0` for a
> public fee preview, or is there a designated preview id? Set the agreed value via
> `__OS_COURSE_CONFIG__.feeApplicantId` (or change the source default) once known.

> 🔁 **Duplicate fee lines.** For some courses the fee endpoint emits each fee
> line **twice** (identical `description`/`programOfferingId`/`amount`/`tax`),
> which would both list duplicates and **double the total**. The cart collapses
> exact duplicates via `dedupeFees()` in `checkFees` before computing totals or
> storing the fee session — idempotent, so a clean (non-duplicated) response is
> unaffected. Fees render in a collapsible **“Additional fees” drawer** (total
> always visible, click to expand the breakdown). Genuinely different per-course
> fees (the API prorates them across a multi-course cart) are preserved.

### Reproduce / debug from the terminal

```bash
PROXY="https://bvc-uat-api-proxy.vercel.app"
# 1) get a bearer token (POST only — GET returns 405)
TOKEN=$(curl -s -X POST "$PROXY/api/mstoken" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
# 2) availability (200)
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PROXY/api/bvcpayment?endpoint=thesissitecorexm.api%2Fcourseofferings%2F19606"
# 3) fees — note the trailing /1, NOT /null (multi-sku: comma-join the skus)
curl -s -H "Authorization: Bearer $TOKEN" \
  "$PROXY/api/bvcpayment?endpoint=thesissitecorexm.api%2Ffee%2F19606%2F1"
```

## Other commands

```bash
npm run js:build          # one-off minified build
npm run js:watch          # watch/rebuild only (no server)
npm run os-course:sandbox # server only (no watch)
```

## Loading from Webflow

Add this to the page (before `</body>`):

```html
<link rel="stylesheet" href="https://bvc-thesis.vercel.app/css/os-course.css" />
<script src="https://bvc-thesis.vercel.app/js/os-course.js" defer></script>
```

This is the complete embed — `os-course.css` contains all the component **and**
cart styles, so no inline CSS is needed on the page.

> ⚠️ **Migrating from the old inline setup:** the script and styles used to be
> pasted directly into the Webflow page (a big `<script>` block and a
> `<style id="os-course-styles">` block). When you switch to the `<link>` +
> `<script src>` above, **remove those old inline blocks from Webflow** so there
> aren't two copies running. The external files are now the single source of truth.

### Cache-busting

The file URLs are stable, so Webflow/browsers may cache an old copy after a
deploy. During active testing, append a version query to force a fresh fetch:

```html
<script src="https://bvc-thesis.vercel.app/js/os-course.js?v=2" defer></script>
```

## Checkout script (cart-checkout page)

The registration/payment form on the Webflow **cart-checkout** page uses the same
extract → build → serve pipeline as the cart.

| Path | Role |
|------|------|
| `src/bvc-app/src/js/checkout/index.js` | **JS source — edit this.** Authored, readable. |
| `src/bvc-app/public/js/checkout.js` | **Generated, git-ignored.** Built by `npm run js:build`. |

Built by the same `scripts/build-os-course.mjs` (an extra esbuild target), so
`npm run js:build` / `js:watch` rebuild it alongside the cart, and it ships on
every `npm run build`.

**Load from Webflow** (before `</body>`, on the cart-checkout page):

```html
<script src="https://bvc-thesis.vercel.app/js/checkout.js" defer></script>
```

The bundle is self-contained — it includes the shared `tokenStorage` / `getMsToken`
helpers (reused if the cart already defined them) and reads cart state from
`sessionStorage` (`cartItems`, `feeSession`). It drives the form on
`?type=os` (Open Studies, ASN required) vs. Extended Ed.

Config is overridable (set before the script loads):
```js
window.__BVC_CHECKOUT_CONFIG__ = { apiOrigin: 'https://bvc-uat-api-proxy.vercel.app' };
```

Endpoints (through the bvcpayment proxy, `thesissitecorexm.api` tenant):
- `thesissitecorexm.api/registration/` (POST) → returns `newRegistration.id`
- `thesissitecorexm.api/payment/submit-payment` (POST, query params) → returns `result.paymentUrl`

> ⚠️ **Migrating from the inline setup:** remove the old inline `<script>` block
> from the Webflow checkout page when you switch to `<script src>` so only one copy
> runs. As with the cart, append `?v=N` while testing to defeat the CDN cache.

### Fee handling (fixed) & remaining follow-ups

**Fixed — fees are read from the cart/session level.** Fees are stored in
`feeSession.feeData.fees` (de-duped) with totals in `feeSession.feeData.summary`,
**not** per item. The checkout now reads them there:
- `submitPayment()` sums course tuition, then adds `getSessionFeeTotals()`
  (`summary.totalAmount + summary.totalTax`, falling back to summing the fees array).
  Previously it summed the always-empty `item.fees`, so the payment amount dropped
  fees entirely.
- `getSessionFees()` now recognizes the canonical `{ feeData: { fees, summary } }`
  shape, so the registration payload's `additionalFees` is populated.

Remaining follow-ups:

1. **`displayCartItems(items)`** ignores the `sessionFees` argument passed by
   `loadCartItems()` and re-reads `feeSession` from `sessionStorage` instead (works,
   but the dead parameter is misleading).
2. Course/payment relies on `result.newRegistration.id` — make sure the registration
   response shape matches before go-live.
