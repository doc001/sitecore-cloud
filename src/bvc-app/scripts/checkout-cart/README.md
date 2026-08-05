# BVC Checkout — Personal Information

Vanilla JavaScript, ES modules, zero dependencies. Runtime lives on Vercel,
markup lives in Webflow.

```
scripts/build-checkout.mjs   # SSG — renders markup, copies runtime
src/checkout/                # source of truth
  content.mjs                # ← edit this for labels, options, copy
  validators.mjs             # pure functions, no DOM
  field.mjs                  # one control: live validation + error + focus
  consent.mjs                # terms scroll gate + refund acknowledgement
  stepper.mjs                # step navigation, progress, Next button state
  msal-auth.mjs              # current-student sign-in + profile fetch
  storage.mjs                # sessionStorage draft, wrapped in try/catch
  checkout.mjs               # entry point — wires the above together
  checkout.css
public/checkout/             # generated — served by Vercel
vercel.json                  # CORS + content-type headers
```

## Build

```bash
node scripts/build-checkout.mjs
```

No install step. Node 18+ (uses `node:fs/promises` and top-level ESM only).

## Webflow setup

**1. Page settings → Before `</body>`:**

```html
<link rel="stylesheet" href="https://YOUR-APP.vercel.app/checkout/checkout.css">
<script type="module" src="https://YOUR-APP.vercel.app/checkout/checkout.mjs"></script>
```

**2. Drop an Embed element where the form should go and paste the contents of
`public/checkout/form.html`.**

You can also rebuild the markup natively in Webflow — the runtime only needs
the `data-` attributes listed below, so Designer-built markup works exactly
the same.

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

## Requirements coverage

| Req | Where |
|---|---|
| 1, 2.1–2.11 | `content.mjs` → `fields`, rendered by the build script |
| 2.12, 2.13 (conditional) | `showWhen` in `content.mjs`, applied in `checkout.mjs` |
| 2.12.3 (default "Not Applicable") | `defaultValue: 'NA'` + `field.setVisible()` |
| 3 (optional indicated) | `renderLabel()` in the build script |
| 4 (date format shown) | `hint` on the `birthDate` field |
| 5, 5.1 (invalid entries block) | `field.mjs` + `stepper.goNext()` |
| 6.2 (scroll to enable) | `consent.mjs` |
| 7.2 (new tab) | `target="_blank" rel="noopener noreferrer"` |
| 8.1 (Next disabled) | `stepper.refreshNextButton()` — see note below |
| 9 (Back / Next) | `[data-back]` / `[data-next]` |

## Two deliberate deviations

**1. The Next button is styled disabled, not `disabled`.**
A real `disabled` button cannot be focused or clicked, so a stuck user gets no
explanation. Here the button *looks* disabled (`aria-disabled` + 55% opacity)
but a click reveals every error and focuses the first one. If the business
owner wants a hard `disabled`, flip `config.hardDisableNext` to `true` in
`content.mjs`.

**2. Errors appear on blur, not on every keystroke.**
Typing `d` into an empty email field and being told it's invalid is hostile.
A field validates when the user leaves it, and from then on updates live — so
a correction clears the error immediately.

## MSAL — what was wrong with the original embed

1. **`initialize()` does not exist in msal-browser 2.12.0.** It arrived in v3.
   The original called it inside a `try/catch`, so on 2.12.0 it threw
   `TypeError`, was swallowed, and every silent auto-populate failed. The CDN
   default is now v4; `ensureInitialized()` guards the call either way.
2. **`redirectUri` was pinned to `bvc-new-v1.webflow.io`** while the page runs
   on `uat.bowvalleycollege.ca` → `AADSTS50011`. It is now derived from
   `window.location`. **Every host must be registered as a redirect URI in
   Entra ID** — webflow.io, uat, and production.
3. **The button was bound at parse time.** If the embed ran before the button
   existed, the whole script threw. Binding is now deferred.
4. **`postalCode` read `getElementById('postalcode')`** while every sibling id
   was camelCase. API→form mapping now happens once, in `toProfile()`.
5. **The bearer token was logged** (`substring(0, 50)`). Removed — console
   output ends up in session replay and support screenshots.
6. **Blocked popups failed hard.** Now falls back to `loginRedirect`.

## Still to confirm

- **SiS codes.** The `value` on every option in `content.mjs` is a placeholder
  (`M`, `CAN`, `FN_STATUS`…). Swap in the real business meaning names from
  Gender.png / PermanentResidentStatus.jpg / IndigenousStatus.png — nothing
  else needs to change.
- **Requirement 2.11.3** says citizenship options come from the SiS. They are
  static here. If they need to be live, add a fetch in `checkout.mjs` that
  replaces `options.citizenshipStatus` before fields are built.
- **Country list** is a working subset. Paste the full ISO list when SiS
  confirms its codes.
- **Phone** — the spec's "only numbers?" carried a question mark. Currently 10
  digits, non-digits stripped as you type. Say the word if extensions or
  international numbers need to be allowed.
- **Server-side validation.** Everything here is a courtesy to the user. The
  same rules must run again before anything reaches the SiS. `validators.mjs`
  is DOM-free specifically so it can be imported by the API route.
