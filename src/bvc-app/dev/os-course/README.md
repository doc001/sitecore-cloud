# OS-Course cart — local development

The cart script that runs on the Webflow Open-Studies course pages.

## Layout

| Path | Role |
|------|------|
| `src/js/os-course/index.js` | **JS source — edit this.** Authored, readable. |
| `src/css/os-course.css` | **CSS source — edit this** (course component styles). |
| `scripts/build-os-course.mjs` | esbuild bundler → minified JS + CSS. |
| `public/js/os-course.js` | **Generated, git-ignored.** Rebuilt fresh on every `npm run build`. |
| `public/css/os-course.css` | **Generated, git-ignored.** Rebuilt fresh on every `npm run build`. |
| `dev/os-course/` | Local sandbox (never deployed — lives outside `public/`). |

> `os-course.css` covers **both** the course component **and** the cart (overlay,
> notifications, spinner, add-to-cart button states). The sandbox harness only adds
> page chrome + a base button look (which on Webflow comes from the button's own
> `w-button` / `c-button_cart` classes).

## Develop locally (no deployments)

```bash
npm run os-course:dev
```

Then open **http://localhost:4321**. This runs two things together:

1. **esbuild watch** — rebuilds the minified `public/js/os-course.js` every time you save `src/js/os-course/index.js`.
2. **mock sandbox server** — serves the built script, mock course data, and mock APIs.

Edit the source → save → refresh the browser. That's the full loop. **Live editing = this.**

## What's mocked

- `POST /api/mstoken` → fake bearer token
- `GET /api/bvcpayment?endpoint=…courseofferings/<sku>` → seats available
- `GET /api/bvcpayment?endpoint=…fee/<skus>/null` → canned fees
- `GET /data/oScourses/course-MOCK101.json` → mock course (in the script's real shape)

Change what the cart sees by editing `dev/os-course/mock/data/*` — no rebuild, no deploy.

The sandbox points the script at itself via:
```js
window.__OS_COURSE_CONFIG__ = { dataOrigin: '', apiOrigin: '' };
```
In production these default to UAT (`bvc-uat.vercel.app` / `bvc-uat-api-proxy.vercel.app`).

## Other commands

```bash
npm run js:build          # one-off minified build
npm run js:watch          # watch/rebuild only (no server)
npm run os-course:sandbox # server only (no watch)
```

## Loading from Webflow

Add this to the page (before `</body>`):

```html
<link rel="stylesheet" href="https://bvc-uat.vercel.app/css/os-course.css" />
<script src="https://bvc-uat.vercel.app/js/os-course.js" defer></script>
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
<script src="https://bvc-uat.vercel.app/js/os-course.js?v=2" defer></script>
```
