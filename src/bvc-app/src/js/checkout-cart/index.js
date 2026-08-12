/**
 * src/js/checkout-cart/index.js — entry point
 * ---------------------------------------------------------------------------
 * Bundled by scripts/build-os-course.mjs (esbuild, IIFE) into
 * public/js/checkout-cart.js and loaded from Webflow as a plain script:
 *
 *   <script src="https://bvc-app.vercel.app/js/checkout-cart.js" defer></script>
 *
 * This module wires the pieces together and owns nothing itself. If you are
 * hunting a bug, it is almost certainly in one of the smaller modules that
 * live alongside this file.
 */

import { config, fields as fieldDefinitions, steps } from './content.js';
import { createField } from './field.js';
import { createConsent } from './consent.js';
import { createStepper } from './stepper.js';
import { createStudentAuth } from './msal-auth.js';
import { initAddressAutocomplete } from './address-autocomplete.js';
import { readDraft, writeDraft, debounce } from './storage.js';
import { earliestBirthDate, todayUTC, toISODateString } from './validators.js';

function start() {
  const root = document.querySelector('[data-checkout]');
  if (!root) return; // Not the checkout page.

  // --- fields ------------------------------------------------------------

  const fields = new Map();
  fieldDefinitions.forEach((definition) => {
    const field = createField(definition, root);
    if (field) fields.set(definition.name, field);
  });

  // Requirement 2.7.3, enforced by the browser as well as by us. Native
  // min/max also constrains the date picker, so most users never see an error.
  const birthDate = fields.get('birthDate');
  if (birthDate) {
    birthDate.control.min = toISODateString(earliestBirthDate());
    birthDate.control.max = toISODateString(todayUTC());
  }

  // --- cart type: Alberta Student # is mandatory only for Open Studies -----
  //
  // The registration submitter (checkout.js) requires ASN only when the cart
  // is Open Studies, read from the ?type query parameter. Mirror that here so
  // Extended Ed registrations are not blocked by a field that does not apply.
  const cartParams = new URLSearchParams(window.location.search);
  const isOpenStudies =
    cartParams.get(config.cart.typeParam) === config.cart.openStudiesValue;
  const asnField = fields.get('asn');
  if (asnField && !isOpenStudies) {
    asnField.setVisible(false); // hidden => cleared and exempt from validation
  }

  // --- conditional fields (requirements 2.12 and 2.13) --------------------

  function applyConditionals() {
    fieldDefinitions.forEach((definition) => {
      if (!definition.showWhen) return;
      const field = fields.get(definition.name);
      const controller = fields.get(definition.showWhen.field);
      if (!field || !controller) return;

      field.setVisible(definition.showWhen.equals.includes(controller.value));
    });
  }

  // --- billing address (requirement: "Billing Address same as above?") ----
  //
  // When checked, the billing fields are hidden AND exempt from validation
  // (setVisible(false) does both). Default is checked — most people bill to
  // the address they just typed.

  const billingSame = root.querySelector('[data-billing-same]');
  const billingBlock = root.querySelector('[data-billing-block]');
  const billingFieldNames = fieldDefinitions
    .filter((definition) => definition.group === 'billing')
    .map((definition) => definition.name);

  function applyBillingVisibility() {
    if (!billingSame) return;
    const sameAsMailing = billingSame.checked;
    if (billingBlock) billingBlock.hidden = sameAsMailing;
    billingFieldNames.forEach((name) => {
      const field = fields.get(name);
      if (field) field.setVisible(!sameAsMailing);
    });
  }

  billingSame?.addEventListener('change', () => {
    applyBillingVisibility();
    refresh();
  });

  // --- phone dialling code follows the mailing country --------------------
  //
  // Requirement: the phone prefix is based on the country (Canada/US = +1).
  // The number keeps its own field; picking a mailing Country sets the code,
  // and the user can still override it afterwards.
  const countryField = fields.get('country');
  const phoneCodeField = fields.get('phoneCountryCode');
  const phoneNumberField = fields.get('phone');
  const phoneCombined = root.querySelector('[data-phone-combined]');

  countryField?.control.addEventListener('change', () => {
    const code = config.phone.dialCodeByCountry[countryField.value];
    if (code && phoneCodeField) phoneCodeField.value = code;
  });

  /** Mirror "<dialCode><digits>" (e.g. +14035550134) into the hidden #phone
   *  that the cart submitter reads. No separator, per the agreed format. */
  function updateCombinedPhone() {
    if (!phoneCombined) return;
    const code = phoneCodeField?.value || config.phone.defaultDialCode || '';
    const digits = (phoneNumberField?.value || '').replace(/\D/g, '');
    phoneCombined.value = digits ? `${code}${digits}` : '';
  }

  // --- draft persistence -------------------------------------------------

  const draft = readDraft(config.draftKey);
  fields.forEach((field) => {
    if (draft[field.name]) field.control.value = draft[field.name];
  });
  applyConditionals();

  const saveDraft = debounce(() => {
    const snapshot = {};
    fields.forEach((field) => {
      if (field.visible && field.value) snapshot[field.name] = field.value;
    });
    writeDraft(config.draftKey, snapshot);
  }, 400);

  // --- consent (requirements 6 and 7) ------------------------------------

  const consent = createConsent(root, () => refresh());

  // --- step validation ---------------------------------------------------

  /** Fields that physically live inside a given step section. */
  function fieldsInStep(stepId) {
    const section = root.querySelector(`[data-step="${stepId}"]`);
    if (!section) return [];
    return [...fields.values()].filter((field) => section.contains(field.wrapper));
  }

  function validateStep(stepId, reveal) {
    const stepFields = fieldsInStep(stepId);
    let focusTarget = null;
    let errorCount = 0;

    stepFields.forEach((field) => {
      if (reveal) field.markTouched();
      const ok = field.validate(reveal);
      if (!ok) {
        errorCount += 1;
        if (!focusTarget) focusTarget = field.control;
      }
    });

    // The acknowledgements live on the personal step.
    const section = root.querySelector(`[data-step="${stepId}"]`);
    const hasConsent = section?.querySelector('[data-terms-accept], [data-refund-accept]');
    if (hasConsent) {
      const consentOk = consent.validate(reveal);
      if (!consentOk) {
        errorCount += 1;
        if (!focusTarget) focusTarget = consent.firstInvalidControl();
      }
    }

    return { valid: errorCount === 0, focusTarget, errorCount };
  }

  const stepper = createStepper(root, {
    steps,
    validateStep,
    onEnterStep: (stepId) => {
      stepper.refreshNextButton(config.hardDisableNext);
      // Let the cart submitter (checkout.js) refresh the order summary when the
      // payment step is shown — decoupled via a DOM event. The cart may have
      // been populated after checkout.js ran its one-time load.
      document.dispatchEvent(new CustomEvent('bvc:checkout-step', { detail: { step: stepId } }));
    }
  });

  /** Called after any change anywhere in the form. */
  function refresh() {
    applyConditionals();
    updateCombinedPhone();
    stepper.refreshNextButton(config.hardDisableNext);
    saveDraft();
  }

  root.addEventListener('bvc:change', refresh);
  root.addEventListener('change', refresh);

  // --- student type (requirement: current vs new student) ----------------

  const authNotice = root.querySelector('[data-auth-notice]');

  const NOTICES = {
    'no-bvc-token': 'We could not load your details automatically. Please fill in the form below.',
    'no-student-id': 'Your account has no student number attached. Please fill in the form below.',
    unauthorized: 'Your session expired. Please sign in again, or fill in the form below.',
    'not-found': 'We could not find your student record. Please fill in the form below.',
    network: 'We could not reach the student system. Please fill in the form below.',
    'sign-in-failed': 'Sign in did not complete. You can try again, or continue as a new student.'
  };

  function showNotice(reason) {
    if (!authNotice) return;
    authNotice.textContent = NOTICES[reason] || NOTICES.network;
    authNotice.hidden = false;
  }

  const studentAuth = createStudentAuth({
    onProfile(profile) {
      Object.entries(profile).forEach(([name, value]) => {
        if (!value) return;
        const field = fields.get(name);
        if (field) {
          field.value = value;
        } else {
          // Mailing-step inputs that are not in the field registry yet.
          const loose = root.querySelector(`[data-field="${name}"] input`);
          if (loose) loose.value = value;
        }
      });
      applyConditionals();
      refresh();
      if (authNotice) authNotice.hidden = true;
    },
    onProblem: showNotice,
    onSignedIn() {
      root.querySelectorAll('[data-student-type="current"]').forEach((button) => {
        button.hidden = true;
      });
    }
  });

  root.querySelector('[data-student-type="current"]')?.addEventListener('click', async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    button.setAttribute('aria-busy', 'true');
    await studentAuth.signIn();
    button.removeAttribute('aria-busy');
    stepper.goTo('personal');
  });

  root.querySelector('[data-student-type="new"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    stepper.goTo('personal');
  });

  // --- proceed to payment (final step hand-off) --------------------------
  //
  // Mailing is the last step. Its forward button validates the step and then
  // hands off to the cart submitter (checkout.js) via a DOM event; checkout.js
  // runs registration -> submit-payment -> redirect to the Flywire page.
  root.querySelector('[data-checkout-submit]')?.addEventListener('click', (event) => {
    event.preventDefault();
    const { valid, focusTarget } = validateStep(stepper.stepId, true);
    if (!valid) {
      if (focusTarget) {
        focusTarget.focus({ preventScroll: true });
        focusTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    document.dispatchEvent(new CustomEvent('bvc:checkout-submit'));
  });

  // If the user signed in earlier in the cart flow, prefill without a click.
  studentAuth.restoreSession();

  // --- address autocomplete (requirement: Google Maps integration) -------
  //
  // Build role -> field maps per address group from the field metadata, so the
  // Google module can fill the right controls without knowing field names.
  const addressGroups = {};
  fieldDefinitions.forEach((definition) => {
    if (!definition.group || !definition.addressRole) return;
    const field = fields.get(definition.name);
    if (!field) return;
    (addressGroups[definition.group] ||= {})[definition.addressRole] = field;
  });

  // Rejects when no API key is set or Maps is unavailable — harmless; the
  // fields already work as manual entry.
  initAddressAutocomplete({ root, groups: addressGroups, onFill: refresh })
    .catch(() => {});

  // --- go ----------------------------------------------------------------

  applyBillingVisibility();
  stepper.show(0, { focusHeading: false });
  refresh();
}

// Bundled as an IIFE and loaded with `defer`, so the DOM is normally ready —
// but Webflow embeds can land anywhere in the document, so check readiness
// rather than assume.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
