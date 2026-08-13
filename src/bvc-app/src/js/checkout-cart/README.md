# checkout-cart — multi-step registration form (Webflow embed)

Multi-step personal-information form for the BVC checkout page. Vanilla JS, zero
runtime dependencies — modular source under `src/`, bundled by esbuild into a
single self-contained IIFE served from Vercel, embedded in Webflow via a plain
`<script src>`.

**Flow:** `Start → Personal → Mailing`. There is **no in-form payment tab and no
in-form cart** — the Webflow page owns the cart column. The Mailing step's
**"Proceed to Payment"** button hands off to the submitter (`checkout.js`), which
runs the purchase and redirects to the **Flywire** payment page.

> Converted from the earlier `scripts/checkout-cart/*.mjs` prototype (served raw
> as `type="module"` under `/checkout/`), which is superseded by this folder.

## Layout

```
src/js/checkout-cart/          # source of truth (esbuild entry = index.js)
  index.js                     # entry — wires the modules together
  content.js                   # ← edit for labels, options, copy, config
  validators.js                # pure functions, no DOM (reusable server-side)
  field.js                     # one control: live validation + error + focus
  consent.js                   # terms scroll gate + refund acknowledgement
  stepper.js                   # step navigation, progress, Next button state
  msal-auth.js                 # current-student sign-in + profile fetch
  address-autocomplete.js      # Google Places autocomplete for address fields
  storage.js                   # sessionStorage draft, wrapped in try/catch
src/css/checkout-cart.css      # styles (bvc- prefixed, custom-property themed)
scripts/build-checkout-cart-html.mjs   # renders the Webflow markup from content.js
src/webflow/checkout-cart.html         # generated markup — paste into a Webflow Embed
public/js/checkout-cart.js     # built — served by Vercel

src/js/checkout/index.js       # the SUBMITTER (separate script) — see below
public/js/checkout.js          # built submitter (git-ignored) — served by Vercel
```

## Build

```bash
npm run js:build            # bundle JS + CSS -> public/{js,css}/  (readable, DEV/UAT)
npm run js:build:prod       # minified, console/debugger stripped  (PROD)
npm run checkout-cart:html  # regenerate src/webflow/checkout-cart.html from content.js
```

`js:build` builds every Webflow asset (os-course, ee-course, checkout,
checkout-cart) in one shot — it is already part of `npm run build`.

Because the markup and the validation rules both derive from `content.js`, a
field can never exist in one and not the other. **Add/rename a field in
`content.js`, run `npm run checkout-cart:html`, rebuild, and re-paste the Embed.**

## Webflow setup

**1. Page settings → Before `</body>`:**

```html
<link rel="stylesheet" href="https://bvc-app.vercel.app/css/checkout-cart.css">
<script src="https://bvc-app.vercel.app/js/checkout-cart.js" defer></script>
<script src="https://bvc-app.vercel.app/js/checkout.js" defer></script>
```

**2. Drop an Embed where the form should go and paste `src/webflow/checkout-cart.html`.**
Designer-built markup works too — the runtime only needs the `data-` hooks below.

**3. The PAGE (not the embed) provides the cart column `#shoppingCart`** (and,
optionally, a `#registerToCourse` button). ⚠️ **Never add those ids inside the
embed** — a duplicate id shadows the page's, so `checkout.js` renders the cart
into the hidden copy and the page's cart column stays empty.

### DOM contract (form)

| Attribute | Purpose |
|---|---|
| `data-checkout` | Root. Nothing runs without it. |
| `data-step="personal"` | One section per step (`student-type` / `personal` / `mailing`). |
| `data-step-heading` | Focus lands here on step change. |
| `data-field="firstName"` | Wrapper; must contain the input/select and `[data-error]`. |
| `data-error` | Where this field's message is written. |
| `data-next` / `data-back` | Step navigation buttons. |
| `data-checkout-submit` | Final "Proceed to Payment" button (Mailing step). |
| `data-student-type="current"` / `"new"` | Start-step buttons. |
| `data-terms-scroll` | The scrollable terms box. |
| `data-terms-accept` / `data-refund-accept` | Consent checkboxes (terms id `checkbox-2`). |
| `data-billing-same` | "Billing same as above?" checkbox (id `checkbox`). |
| `data-billing-block` | The collapsible billing-address container. |
| `data-address-autocomplete="mailing"\|"billing"` | Street input that gets Google Places autocomplete. |
| `data-phone-combined` | Hidden `#phone` holding the combined `+1XXXXXXXXXX`. |
| `data-error-summary` | `role="alert"` region (one per step). |
| `data-progress-step="personal"` | Progress indicator items. |

## `content.js` config

- `config.googleMaps` — **`apiKey` is empty by default**; the address
  autocomplete is inert (manual entry works) until you set a referrer-restricted
  browser key (enable *Maps JavaScript API* + *Places API*). `countryRestriction`
  biases suggestions (default `['ca']`).
- `config.phone` — `defaultDialCode` (`+1`) and `dialCodeByCountry` (mailing
  Country → dial code). The visible number input is `#phoneNumber`; the runtime
  writes the combined `+1XXXXXXXXXX` into the hidden `#phone`.
- `config.cart` — `itemsKey` (`cartItems`) + `totalCreditsKey` (`totalCredits`),
  the sessionStorage keys the course-page cart writes. ASN is visible and
  mandatory when **any cart item carries credits**, and hidden (cleared, exempt
  from validation) when none do. It is re-read on every step change, since the
  cart can be written after this script runs. `?type` is deliberately NOT used:
  a cart can mix Open Studies and Extended Ed items. The submitter
  (`checkout.js`) applies the same rule in `cartRequiresAsn()`.
- `fields[]` — each field's DOM id is `submitId || name`; `submitId` is used to
  match the ids the submitter reads (`postalcode`, `streetAddress-2`, `city-2`,
  `province-2`, `postalCode-2`, `country-2`, `asn-os`). `group` (`mailing` /
  `billing`) + `addressRole` (`street`/`city`/`province`/`postalCode`/`country`)
  drive the billing toggle and autocomplete.
- `options` (gender, citizenshipStatus, firstLanguage, countryOfCitizenship,
  province, country, phoneCountryCode) — **SiS codes are placeholders**; the form
  never inspects them.

## Submitter integration (`src/js/checkout/index.js` → `checkout.js`)

A **separate** script on the same page that turns the completed form into a
registration + payment. It is decoupled from the form via DOM events:

- Form → `bvc:checkout-step` on every step change → checkout.js re-renders the
  page's `#shoppingCart` (handles a cart populated after load).
- Form → `bvc:checkout-submit` when "Proceed to Payment" is clicked (after the
  Mailing step validates) → checkout.js runs the flow.

**Purchase flow:** create token (`/api/mstoken`) → `registration/` (POST) →
`payment/submit-payment` (POST) → `result.paymentUrl` (a Flywire session) →
redirect to `../payment-page`.

- Courses / `additionalFees` / `totalAmount` come from the **session cart**
  (`sessionStorage.cartItems` + `feeSession`), never the form.
- Personal/address/phone come from the form (Option B: real gender, middleName,
  previousLastName, language, citizenship → legalStatus / country_Citizenship).
- **Contract:** `studentId: 0` and **empty `studentPk`** for new/anonymous
  registrations (a non-empty `studentPk` 500s). Overridable via
  `window.__BVC_CHECKOUT_CONFIG__ = { apiOrigin, studentPk }` set before the
  script loads.
- **Coded enums** (gender/language/legalStatus/ethnicity) go through `*_MAP`
  tables at the top of `checkout.js`, each with the known-good hardcoded value as
  a safe fallback so a wrong code can never 400 the registration. Only `EN→ENG`
  and `CAN→1` are confirmed — **fill the maps from the SiS enum to send real
  values**, then adjust `DEFAULTS`.
- `checkout.js`'s `DOMContentLoaded` is null-guarded (`openStudiesFields` /
  `os-hide` / `email-form`) so missing page scaffold never throws.

## Notes carried over from the prototype

- **MSAL redirect URIs**: every host that serves the page (webflow.io, UAT,
  production) must be registered in Entra ID. The redirect URI is derived from
  `window.location` at runtime.
- **Client validation is a courtesy.** The rules in `validators.js` are DOM-free
  so they can run again server-side before anything reaches the SiS.
- **Forward buttons** are styled-disabled (not `disabled`) by default so a stuck
  user still gets an explanation on click. Flip `config.hardDisableNext` for a
  hard `disabled`.
