/**
 * src/js/checkout-cart/markup.js
 * ---------------------------------------------------------------------------
 * Renders the checkout form's markup from content.js.
 *
 * Used from BOTH sides, which is the point:
 *   - scripts/build-checkout-cart-html.mjs writes src/webflow/checkout-cart.html
 *     for anyone who still wants to paste markup into a Webflow Embed;
 *   - checkout-cart.js calls renderFormInner() in the browser when the page has
 *     not supplied the markup itself.
 *
 * That second path is what removes the hand-paste step: a Webflow page needs only
 * an empty <div data-checkout> and the script tag, and every future change to a
 * field, an option list or a code arrives with the next deploy. Pasted markup and
 * the deployed bundle drifted apart every time content.js changed, and a drifted
 * value fails silently — that is how "Canadian" stopped opening Indigenous Status.
 *
 * No DOM and no Node APIs: pure string building, so it runs in either place.
 */

import {
  config, features, fields, options, optionalSuffix, steps
} from './content.js';

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

/**
 * Step 1 — current student or new student. Rendered only when
 * features.studentSignIn is on; otherwise the form opens on Personal and the
 * MSAL sign-in button never reaches the page.
 */
function renderStudentTypeStep() {
  if (!features.studentSignIn) return '';
  return `  <!-- Step 1 — current student or new student -->
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

`;
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

/** The contents of the form root — what the runtime injects into [data-checkout]. */
export function renderFormInner() {
  return `${renderProgress()}

${renderStudentTypeStep()}
  <!-- Personal Information -->
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

${renderMailingStep()}`;
}

/** The full element, for the generated Webflow embed file. */
export function renderForm() {
  return `<div data-checkout>
${renderFormInner()}
</div>
`;
}

export { fields, steps };
