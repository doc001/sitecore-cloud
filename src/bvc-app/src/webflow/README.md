# Webflow embeds

Standalone vanilla-JS snippets meant to be pasted into Webflow **Embed** widgets on the bowvalleycollege.ca site. They run client-side, fetch JSON from `https://bvc-app.vercel.app/data/...`, and render into a mount point on the page.

## `program-requirements.js`

Replaces the static `#Courses > div.w-richtext` block on each program detail page with a dynamic accordion built from `src/data/static/program-requirements/<PROGRAM>.json`.

### How it picks the JSON

The script always fetches `https://bvc-app.vercel.app/data/static/program-requirements-manifest.json` first, then resolves a program two ways — **code first, slug fallback**:

**1. By Kuali CODE (preferred, most reliable).** Every coded program's JSON filename starts with its code then `_-_` (e.g. `SD_-_Software_Development__Diploma_.json`). The script builds a `CODE → filename` index from the manifest values, so you can address a program by code alone — no slug guessing. The code is read from, in priority:

   1. `data-program-code="SD"` on the mount element — **recommended: bind this to the CMS "Code" field** so each program page supplies its own code.
   2. the value of `data-bvc-program-requirements="SD"` (mark the mount and pass the code in one attribute).
   3. a `?code=SD` URL query param (handy for testing/preview).

   Matching is case-insensitive. Because a static host can't list files by prefix, the manifest is still required to turn the code into the full filename — but you never have to know or hardcode that filename.

**2. By URL slug (fallback).** If no code is given, the script reads the **last segment** of `window.location.pathname` (e.g. `cybersecurity-solutions`), lowercases it, and tries these candidates against the manifest in order:

   ```
   <slug>
   <slug>-diploma
   <slug>-certificate
   <slug>-post-diploma-certificate
   <slug>-post-diploma
   <slug>-bridging
   ```

   BVC's marketing URLs often drop the program-type suffix the JSON filenames include — e.g. `/programs/cybersecurity-solutions` has no exact key, but `cybersecurity-solutions-diploma` does → `CSS_-_Cybersecurity_Solutions_Diploma.json`. If you hit a URL pattern not covered, extend `SLUG_SUFFIXES`. **Providing a code avoids this whole class of slug-mismatch problem.**

Once a file is resolved (by either path), the script fetches it and renders the accordion.

The manifest itself is built by `scripts/generateProgramRequirementsManifest.mjs` and ships with the next `npm run build:bvcapp` → `npm run deploy:bvcapp` cycle.

### How to install in Webflow

1. On the program detail page template (or a single page), add an **Embed** element where you want the accordion. Inside, paste:

   ```html
   <div data-bvc-program-requirements data-program-code="SD"></div>
   <script>
     /* paste contents of program-requirements.js here */
   </script>
   ```

   **Recommended (CMS collection page):** bind `data-program-code` to the program's **Code** field instead of hardcoding it — in Webflow, select the `<div>`, add the custom attribute `data-program-code`, and set its value to the Code field. Each program page then loads its own JSON by code, regardless of how its URL slug is spelled.

   Alternatively, host the JS somewhere and `<script src="..."></script>` it.

2. **No code?** The script still works by URL slug — skip `data-program-code` and it falls back to slug resolution. And if you'd rather replace the existing rich-text block in `#Courses` without adding a new container, skip the `<div>` entirely — the script falls back to `#Courses > .w-richtext`, then `#Courses`. (You can still pass a code via `?code=` for testing in that case.)

### Editing the script vs. editing the data

These are two different deploy paths — don't confuse them:

| Change | Where to update | Deploy how |
|--------|----------------|-----------|
| Tweak the script (styles, fallback rules, rendering) | Webflow Embed widget on bowvalleycollege.ca | Publish the Webflow site. **No bvc-app deploy needed.** |
| Add/edit a program JSON, or rename a file (changes the manifest) | `src/bvc-app/src/data/static/program-requirements/` | `npm run build:bvcapp` then `npm run deploy:bvcapp` from the monorepo root |

### Adding a new program

1. Drop the new `<CODE>_-_<Title>.json` file into `src/bvc-app/src/data/static/program-requirements/`.
2. Run `npm run build:bvcapp` from the monorepo root (regenerates the manifest, copies into `public/`).
3. Run `npm run deploy:bvcapp`.
4. Confirm the slug derived by the manifest matches the BVC Webflow page URL after the suffix-fallback rules. If it doesn't, rename the JSON file so the title portion lines up.

### Slug rules

`<CODE>_-_<Title>.json` → strip `<CODE>_-_`, replace `_` and `_-_` with `-`, lowercase. So:

| JSON file                                            | Manifest slug                               | Matches BVC URL                                 |
|------------------------------------------------------|---------------------------------------------|------------------------------------------------|
| `AASD_-_Addiction_Studies_Diploma.json`              | `addiction-studies-diploma`                 | `/programs/addiction-studies-diploma`           |
| `AASC_-_Addiction_Studies_-_Aboriginal_Focus.json`   | `addiction-studies-aboriginal-focus`        | `/programs/addiction-studies-aboriginal-focus`  |
| `EBM_-_Esports_Business_Management__Diploma_.json`   | `esports-business-management-diploma`       | `/programs/esports-business-management-diploma` or `/programs/esports-business-management` (via `-diploma` fallback) |
| `CSS_-_Cybersecurity_Solutions_Diploma.json`         | `cybersecurity-solutions-diploma`           | `/programs/cybersecurity-solutions` (via `-diploma` fallback) |

Run `node scripts/generateProgramRequirementsManifest.mjs` to preview the full map locally; slug collisions are logged to stderr.

### Debugging on the live page

When the script can't render, the embed shows an error block with:

- `Code:` — the program code it read (from the mount attribute or `?code=`), or `—` if none
- `Slug:` — what was derived from the URL
- `Detail:` — the underlying error (HTTP 404, network failure, "No program-requirements entry for...", etc.)

For more, open DevTools → Console; the script logs `[bvc-program-requirements] <err>` with the full stack. Common cases:

- **`HTTP 404 fetching .../program-requirements-manifest.json`** — the manifest isn't deployed. Confirm it exists at `public/data/static/program-requirements-manifest.json` locally, then `deploy:bvcapp`.
- **`No program-requirements entry for code "<code>" / slug "<slug>"`** — neither the code nor the slug resolved. If you passed a code, check it matches the JSON filename prefix (before `_-_`) and that the program's JSON is deployed; if relying on the slug, either rename the source JSON or add a new suffix to `SLUG_SUFFIXES`.
- **CORS / blocked request** — bowvalleycollege.ca's CSP may not allow `connect-src` to `bvc-app.vercel.app`. Check the Network tab in DevTools; if blocked by CSP, the request shows status `(blocked:csp)`. Fix is on the BVC site CSP side, not in this script.

### Testing locally (`program-requirements.test.html`)

A self-contained harness sits next to the script. It loads the **real** `program-requirements.js` via `<script src>` (so there's nothing to keep in sync) and fetches live data from production (`bvc-app.vercel.app` sends `Access-Control-Allow-Origin: *`, so cross-origin fetch from localhost works).

```bash
# from this folder (src/bvc-app/src/webflow)
python -m http.server 8099
# then open:
#   http://localhost:8099/program-requirements.test.html?code=SD
```

- Pick a program by **code** with the quick-pick chips or the input box; the harness sets `data-program-code` on the mount exactly like a Webflow CMS binding, then the embed resolves and renders it.
- A status line shows the independent resolution (`code → file`, or “no match → slug fallback”), so you can tell a *resolution* failure from a *render* failure.
- `?base=<url>` overrides the data origin (via `window.BVC_PR_BASE`) to test against a local/staging copy instead of production — e.g. serve `src/bvc-app/src/data/static` somewhere and pass its URL.
- Try `?code=NOPE-BAD` to see the on-page error block (now showing `Code:` and `Slug:`).

> The test page and the `window.BVC_PR_BASE` hook are dev-only conveniences; production behaviour is unchanged when neither is used.

### Customizing the look

The script injects a `<style id="bvc-pr-styles">` block on first run. All accordion rules are scoped under `.bvc-accordion` (the wrapper class on the rendered root), so they don't bleed into other tables/elements on the page. To override anything from Webflow's stylesheet, add CSS *after* the embed loads — your rules will win.
