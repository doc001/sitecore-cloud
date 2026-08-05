# checkout-cart — personal information form (Webflow embed)

Multi-step personal-information form for **https://uat.bowvalleycollege.ca/cart-checkout**.
Vanilla JS, zero runtime dependencies. This is the canonical project pattern:
modular source under `src/`, bundled by esbuild into a single self-contained
IIFE served from Vercel, embedded in Webflow via a plain `<script src>`.

> Converted from the earlier `scripts/checkout-cart/*.mjs` prototype, which was
> served raw as `type="module"` under `/checkout/`. That folder is superseded
> by this one and can be removed.

## Layout

```
src/js/checkout-cart/        # source of truth (esbuild entry = index.js)
  index.js                   # entry — wires the modules together
  content.js                 # ← edit for labels, options, copy, config
  validators.js              # pure functions, no DOM (reusable server-side)
  field.js                   # one control: live validation + error + focus
  consent.js                 # terms scroll gate + refund acknowledgement
  stepper.js                 # step navigation, progress, Next button state
  msal-auth.js               # current-student sign-in + profile fetch
  storage.js                 # sessionStorage draft, wrapped in try/catch
src/css/checkout-cart.css    # styles (bvc- prefixed, custom-property themed)
scripts/build-checkout-cart-html.mjs   # renders the Webflow markup from content.js
src/webflow/checkout-cart.html         # generated markup — paste into a Webflow Embed
public/js/checkout-cart.js    # built — served by Vercel
public/css/checkout-cart.css  # built — served by Vercel
```

## Build

```bash
npm run js:build            # bundle JS + CSS -> public/{js,css}/  (readable, DEV/UAT)
npm run js:build:prod       # minified, console/debugger stripped  (PROD)
npm run checkout-cart:html  # regenerate src/webflow/checkout-cart.html from content.js
```

`js:build` builds every Webflow asset (os-course, ee-course, checkout,
checkout-cart) in one shot — it is already part of `npm run build`.

Because the markup and the validation rules both derive from `content.js`,
a field can never exist in one and not the other. Add a field there, run
`npm run checkout-cart:html`, and rebuild.

## Webflow setup

**1. Page settings → Before `</body>`:**

```html
<link rel="stylesheet" href="https://bvc-thesis.vercel.app/css/checkout-cart.css">
<script src="https://bvc-thesis.vercel.app/js/checkout-cart.js" defer></script>
```

**2. Drop an Embed element where the form should go and paste the contents of
`src/webflow/checkout-cart.html`.** Designer-built markup works too — the
runtime only needs the `data-` attributes below.

### DOM contract

| Attribute | Purpose |
|---|---|
| `data-checkout` | Root. Nothing runs without it. |
| `data-step="personal"` | One section per step. |
| `data-step-heading` | Focus lands here on step change. |
| `data-field="firstName"` | Wrapper; must contain the input/select and `[data-error]`. |
| `data-error` | Where this field's message is written. |
| `data-next` / `data-back` | Navigation buttons. |
| `data-terms-scroll` | The scrollable terms box. |
| `data-terms-accept` / `data-refund-accept` | The two checkboxes. |
| `data-student-type="current"` / `"new"` | Step 1 buttons. |
| `data-error-summary` | `role="alert"` region for the error count. |
| `data-progress-step="personal"` | Progress indicator items. |

## Notes carried over from the prototype

- **SiS codes** in `content.js` `options` are placeholders — swap in the real
  business-meaning names/codes once confirmed. The runtime never inspects them.
- **MSAL redirect URIs**: every host that serves the page (webflow.io, UAT,
  production) must be registered in Entra ID. The redirect URI is derived from
  `window.location` at runtime.
- **Client validation is a courtesy.** The same rules in `validators.js` are
  DOM-free so they can run again server-side before anything reaches the SiS.
- **Next button** is styled-disabled (not `disabled`) by default so a stuck
  user still gets an explanation on click. Flip `config.hardDisableNext` for a
  hard `disabled`.
