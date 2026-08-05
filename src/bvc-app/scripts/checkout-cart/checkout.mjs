/**
 * checkout.mjs — entry point
 * ---------------------------------------------------------------------------
 * Loaded from Webflow as:
 *
 *   <script type="module"
 *           src="https://<your-vercel-app>/checkout/checkout.mjs"></script>
 *
 * This module wires the pieces together and owns nothing itself. If you are
 * hunting a bug, it is almost certainly in one of the smaller modules.
 */

import { config, fields as fieldDefinitions, steps } from './content.mjs';
import { createField } from './field.mjs';
import { createConsent } from './consent.mjs';
import { createStepper } from './stepper.mjs';
import { createStudentAuth } from './msal-auth.mjs';
import { readDraft, writeDraft, debounce } from './storage.mjs';
import { earliestBirthDate, todayUTC, toISODateString } from './validators.mjs';

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
    onEnterStep: () => stepper.refreshNextButton(config.hardDisableNext)
  });

  /** Called after any change anywhere in the form. */
  function refresh() {
    applyConditionals();
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

  // If the user signed in earlier in the cart flow, prefill without a click.
  studentAuth.restoreSession();

  // --- go ----------------------------------------------------------------

  stepper.show(0, { focusHeading: false });
  refresh();
}

// The script is a module, so it is deferred by default — but Webflow embeds
// can land anywhere in the document, so check readiness rather than assume.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
