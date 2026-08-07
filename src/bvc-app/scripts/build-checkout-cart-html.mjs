/**
 * scripts/build-checkout-cart-html.mjs
 * ---------------------------------------------------------------------------
 * Renders the Webflow embed markup for the checkout-cart personal-information
 * form from the single source of truth (src/js/checkout-cart/content.js) into
 * src/webflow/checkout-cart.html.
 *
 *   node scripts/build-checkout-cart-html.mjs
 *
 * Because the markup and the validation rules are generated from the same
 * content file, a field can never exist in one and not the other. Paste the
 * generated file into a Webflow Embed element, then load the runtime + styles
 * from Vercel (see the comment block at the top of the generated file).
 *
 * Node built-ins only — no dependencies, no bundler.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  config, fields, options, optionalSuffix, steps
} from '../src/js/checkout-cart/content.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, '..', 'src', 'webflow');
const OUT_FILE = join(OUT_DIR, 'checkout-cart.html');

// Where Vercel serves the bundled assets. Production Webflow embeds point at
// bvc-thesis; swap for a UAT/preview deployment while testing.
const ASSET_ORIGIN = 'https://bvc-thesis.vercel.app';

/** Minimal HTML escaping — enough for attribute and text content. */
const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** The DOM id a control is submitted under — may differ from its logical name
 *  so the cart submitter (checkout.js) can read it by the id it expects. */
const controlId = (field) => field.submitId || field.name;

/** Requirement 3 — optional fields are labelled; mandatory ones get a *. */
function renderLabel(field) {
  const suffix = field.required
    ? '<span class="bvc-field__required" aria-hidden="true">*</span>'
    : ` <span class="bvc-field__optional">(${optionalSuffix})</span>`;

  return `<label class="bvc-field__label" for="${controlId(field)}">${esc(field.label)}${suffix}</label>`;
}

function renderControl(field) {
  const describedBy = [
    field.hint ? `${field.name}-hint` : null,
    `${field.name}-error`
  ].filter(Boolean).join(' ');

  const shared = [
    `id="${controlId(field)}"`,
    `name="${field.name}"`,
    field.required ? 'required' : '',
    `aria-describedby="${describedBy}"`,
    field.autocomplete ? `autocomplete="${field.autocomplete}"` : ''
  ].filter(Boolean).join(' ');

  if (field.type === 'select') {
    const list = options[field.options] || [];
    const items = list.map((option) => {
      const selected = field.defaultValue === option.value ? ' selected' : '';
      return `        <option value="${esc(option.value)}"${selected}>${esc(option.label)}</option>`;
    }).join('\n');

    return `      <select ${shared}>\n` +
      `        <option value="">Please select…</option>\n${items}\n      </select>`;
  }

  const extras = [
    `type="${field.type}"`,
    field.maxLength ? `maxlength="${field.maxLength}"` : '',
    field.inputMode ? `inputmode="${field.inputMode}"` : '',
    // Street fields carry the Google Places hook; the value is the address
    // group so the runtime fills the right siblings.
    field.autocompleteAddress ? `data-address-autocomplete="${field.group}"` : ''
  ].filter(Boolean).join(' ');

  return `      <input ${shared} ${extras}>`;
}

function renderField(field) {
  // Conditional fields start hidden; the runtime reveals them.
  const hidden = field.showWhen ? ' hidden' : '';
  const wide = (field.type === 'select' && !field.narrow) || field.name === 'email' || field.addressRole === 'street'
    ? ' bvc-field--wide'
    : '';

  const hint = field.hint
    ? `\n      <p class="bvc-field__hint" id="${field.name}-hint">${esc(field.hint)}</p>`
    : '';

  const wrapper = `    <div class="bvc-field${wide}" data-field="${field.name}"${hidden}>
      ${renderLabel(field)}
${renderControl(field)}${hint}
      <p class="bvc-field__error" id="${field.name}-error" data-error hidden></p>
    </div>`;

  // The phone number is entered as digits; the runtime writes the combined
  // "+1XXXXXXXXXX" value into this hidden input, which the cart submitter reads.
  if (field.name === 'phone') {
    return `${wrapper}\n    <input type="hidden" id="phone" name="phoneCombined" data-phone-combined>`;
  }

  return wrapper;
}

function renderProgress() {
  const items = steps.map((step) =>
    `    <li class="bvc-progress__item" data-progress-step="${step.id}">${esc(step.short)}</li>`
  ).join('\n');

  return `  <ol class="bvc-progress" aria-label="Checkout progress">\n${items}\n  </ol>`;
}

/** Fields belonging to a step (defaults to the personal step). */
const fieldsForStep = (stepId) => fields.filter((field) => (field.step || 'personal') === stepId);
const inGroup = (list, group) => list.filter((field) => field.group === group);

function renderMailingStep() {
  const mailingFields = fieldsForStep('mailing');
  const mailingAddress = inGroup(mailingFields, 'mailing');
  const billingAddress = inGroup(mailingFields, 'billing');

  return `  <!-- Step 3 — Mailing Information (mailing + billing address) -->
  <section class="bvc-step" data-step="mailing" hidden>
    <h2 class="bvc-step__heading" data-step-heading>Mailing Information</h2>
    <p class="bvc-step__intro">Start typing a street address to autofill. Fields marked <span class="bvc-field__required" aria-hidden="true">*</span> are required.</p>

    <h3 class="bvc-subheading">Mailing Address</h3>
    <div class="bvc-grid">
${mailingAddress.map(renderField).join('\n')}
    </div>

    <label class="bvc-check bvc-check--billing">
      <input type="checkbox" id="checkbox" data-billing-same checked>
      <span>Billing Address same as above?</span>
    </label>

    <div class="bvc-billing" data-billing-block hidden>
      <h3 class="bvc-subheading">Billing Address</h3>
      <div class="bvc-grid">
${billingAddress.map(renderField).join('\n')}
      </div>
    </div>

    <p class="bvc-summary" data-error-summary role="alert" hidden></p>

    <div class="bvc-actions">
      <button type="button" class="bvc-button bvc-button--secondary" data-back>Back</button>
      <button type="button" class="bvc-button" data-checkout-submit>Proceed to Payment</button>
    </div>
  </section>`;
}

function renderForm() {
  return `<!--
  checkout-cart.html — Generated by scripts/build-checkout-cart-html.mjs. DO NOT EDIT BY HAND.
  Edit src/js/checkout-cart/content.js and re-run the generator instead.

  Webflow setup:
    1. Page settings → Before </body>, add:
         <link rel="stylesheet" href="${ASSET_ORIGIN}/css/checkout-cart.css">
         <script src="${ASSET_ORIGIN}/js/checkout-cart.js" defer></script>
    2. Drop an Embed element where the form should go and paste everything below.

  The runtime only needs the data-* attributes, so Designer-built markup works
  identically if you prefer to rebuild it natively in Webflow.
-->
<div data-checkout>
${renderProgress()}

  <!-- Step 1 — current student or new student -->
  <section class="bvc-step" data-step="student-type" hidden>
    <h2 class="bvc-step__heading" data-step-heading>Have you studied at Bow Valley College before?</h2>
    <p class="bvc-step__intro">Signing in fills in most of this form for you.</p>

    <p class="bvc-notice" data-auth-notice hidden></p>

    <div class="bvc-choice">
      <button type="button" class="bvc-button" data-student-type="current">
        I'm a current student — sign in
      </button>
      <button type="button" class="bvc-button bvc-button--secondary" data-student-type="new">
        I'm a new student
      </button>
    </div>
  </section>

  <!-- Step 2 — Personal Information -->
  <section class="bvc-step" data-step="personal" hidden>
    <h2 class="bvc-step__heading" data-step-heading>Personal Information</h2>
    <p class="bvc-step__intro">Fields marked <span class="bvc-field__required" aria-hidden="true">*</span> are required.</p>

    <div class="bvc-grid">
${fieldsForStep('personal').map(renderField).join('\n')}
    </div>

    <!-- Requirement 6 — terms and conditions -->
    <div class="bvc-consent">
      <h3 class="bvc-consent__title" id="terms-title">Terms and Conditions</h3>
      <div class="bvc-terms-box" data-terms-scroll role="region" aria-labelledby="terms-title" tabindex="0">
        <!-- Replace with the approved terms copy, or a Webflow Rich Text element. -->
        <p>Paste the full terms and conditions here.</p>
      </div>
      <p class="bvc-field__hint" data-terms-hint>Scroll to the end of the terms to enable the checkbox below.</p>
      <label class="bvc-check">
        <input type="checkbox" id="checkbox-2" data-terms-accept disabled>
        <span>I have read and accept the terms and conditions.</span>
      </label>
      <p class="bvc-field__error" data-terms-error hidden></p>
    </div>

    <!-- Requirement 7 — refund policies and extension processes -->
    <div class="bvc-consent">
      <h3 class="bvc-consent__title">Refund Policies and Extension Processes</h3>
      <p>
        <a href="${esc(config.refundPolicyUrl)}" target="_blank" rel="noopener noreferrer" data-refund-link>
          Read the refund policies and extension processes (opens in a new tab)
        </a>
      </p>
      <label class="bvc-check">
        <input type="checkbox" data-refund-accept>
        <span>I have read and understood the refund policies and extension processes.</span>
      </label>
      <p class="bvc-field__error" data-refund-error hidden></p>
    </div>

    <p class="bvc-summary" data-error-summary role="alert" hidden></p>

    <div class="bvc-actions">
      <button type="button" class="bvc-button bvc-button--secondary" data-back>Back</button>
      <button type="button" class="bvc-button" data-next>Continue to Mailing Information</button>
    </div>
  </section>

${renderMailingStep()}
</div>
`;
}

async function build() {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, renderForm(), 'utf8');
  console.log(`✓ checkout-cart.html written (${fields.length} fields, ${steps.length} steps)`);
  console.log(`  → ${OUT_FILE}`);
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
