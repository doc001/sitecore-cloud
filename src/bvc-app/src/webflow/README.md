# Webflow embeds

Standalone vanilla-JS snippets meant to be pasted into Webflow **Embed** widgets on the bowvalleycollege.ca site. They run client-side, fetch JSON from `https://bvc-app.vercel.app/data/...`, and render into a mount point on the page.

## `program-requirements.js`

Replaces the static `#Courses > div.w-richtext` block on each program detail page with a dynamic accordion built from `src/data/static/program-requirements/<PROGRAM>.json`.

### How it picks the JSON

1. Reads the **last segment** of `window.location.pathname` (e.g. `cybersecurity-solutions`) and lowercases it.
2. Fetches `https://bvc-app.vercel.app/data/static/program-requirements-manifest.json`.
3. Resolves the slug against the manifest, trying these candidates in order:

   ```
   <slug>
   <slug>-diploma
   <slug>-certificate
   <slug>-post-diploma-certificate
   <slug>-post-diploma
   <slug>-bridging
   ```

   This is needed because BVC's marketing URLs often drop the program-type suffix that the source JSON filenames include. For example `/programs/cybersecurity-solutions` has no exact key, but `cybersecurity-solutions-diploma` does → resolves to `CSS_-_Cybersecurity_Solutions_Diploma.json`. If you ever hit a BVC URL pattern not covered by these suffixes, extend `SLUG_SUFFIXES` in the script.

4. Fetches the resolved JSON and renders the accordion.

The manifest itself is built by `scripts/generateProgramRequirementsManifest.mjs` and ships with the next `npm run build:bvcapp` → `npm run deploy:bvcapp` cycle.

### How to install in Webflow

1. On the program detail page template (or a single page), add an **Embed** element where you want the accordion. Inside, paste:

   ```html
   <div data-bvc-program-requirements></div>
   <script>
     /* paste contents of program-requirements.js here */
   </script>
   ```

   Alternatively, host the JS somewhere and `<script src="..."></script>` it.

2. If you'd rather replace the existing rich-text block in `#Courses` without adding a new container, you can skip the `<div data-bvc-program-requirements>` — the script will fall back to `#Courses > .w-richtext`, then `#Courses`.

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

- `Slug:` — what was derived from the URL
- `Detail:` — the underlying error (HTTP 404, network failure, "No program-requirements entry for...", etc.)

For more, open DevTools → Console; the script logs `[bvc-program-requirements] <err>` with the full stack. Common cases:

- **`HTTP 404 fetching .../program-requirements-manifest.json`** — the manifest isn't deployed. Confirm it exists at `public/data/static/program-requirements-manifest.json` locally, then `deploy:bvcapp`.
- **`No program-requirements entry for "<slug>" (also tried suffix variants)`** — the URL slug doesn't match any manifest key even after suffix fallbacks. Either rename the source JSON, or add a new suffix to `SLUG_SUFFIXES` in the script.
- **CORS / blocked request** — bowvalleycollege.ca's CSP may not allow `connect-src` to `bvc-app.vercel.app`. Check the Network tab in DevTools; if blocked by CSP, the request shows status `(blocked:csp)`. Fix is on the BVC site CSP side, not in this script.

### Customizing the look

The script injects a `<style id="bvc-pr-styles">` block on first run. All accordion rules are scoped under `.bvc-accordion` (the wrapper class on the rendered root), so they don't bleed into other tables/elements on the page. To override anything from Webflow's stylesheet, add CSS *after* the embed loads — your rules will win.
