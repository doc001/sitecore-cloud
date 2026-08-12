/**
 * field.mjs
 * ---------------------------------------------------------------------------
 * Wraps one form control. Owns its own validation state, its own error
 * element, and nothing else. The stepper asks a field whether it is valid;
 * the field never asks the stepper anything.
 *
 * DOM contract (produced by scripts/build-checkout.mjs, but any markup that
 * matches will work):
 *
 *   <div class="bvc-field" data-field="firstName">
 *     <label for="firstName">First Name</label>
 *     <input id="firstName" name="firstName">
 *     <p class="bvc-field__hint" id="firstName-hint">…</p>
 *     <p class="bvc-field__error" id="firstName-error" data-error></p>
 *   </div>
 */

import { validateField, digitsOnly } from './validators.mjs';

/**
 * Fields whose input should be scrubbed as the user types.
 * Requirement 2.6.2 and 2.8.2 both say "numbers only" — the kindest reading
 * is to silently drop anything else rather than scold the user for pasting
 * "(403) 555-0134".
 */
const SANITIZERS = {
  phone: digitsOnly,
  asn: digitsOnly
};

export function createField(definition, root) {
  const wrapper = root.querySelector(`[data-field="${definition.name}"]`);
  if (!wrapper) return null; // Field not present in this build — skip silently.

  const control = wrapper.querySelector('input, select, textarea');
  const errorNode = wrapper.querySelector('[data-error]');
  if (!control) return null;

  // `touched` gates error display: we do not shout at someone who is still
  // halfway through typing their email address.
  let touched = false;
  let visible = true;
  let currentError = null;

  function value() {
    return String(control.value ?? '').trim();
  }

  function showError(message) {
    currentError = message;
    wrapper.classList.toggle('is-invalid', Boolean(message));
    control.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorNode) {
      errorNode.textContent = message || '';
      errorNode.hidden = !message;
    }
  }

  /**
   * @param {boolean} reveal — when false, compute validity without painting
   *                           the error (used for enabling the Next button).
   * @returns {boolean} valid
   */
  function validate(reveal = true) {
    // A hidden conditional field is exempt. Requirement 2.12 / 2.13.
    if (!visible) {
      showError(null);
      return true;
    }

    const message = validateField(definition, value());

    if (reveal || (touched && currentError)) {
      showError(touched || reveal ? message : null);
    }
    return !message;
  }

  function setVisible(next) {
    if (visible === next) return;
    visible = next;
    wrapper.hidden = !next;

    if (next) {
      // Requirement 2.12.3 — "Not Applicable" pre-selected on reveal.
      if (definition.defaultValue && !control.value) {
        control.value = definition.defaultValue;
      }
    } else {
      // Clear on hide so a stale answer never reaches the SiS.
      control.value = definition.defaultValue ?? '';
      touched = false;
      showError(null);
    }
  }

  function focus() {
    control.focus({ preventScroll: true });
    control.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // --- wiring ------------------------------------------------------------

  const onInput = () => {
    const sanitize = SANITIZERS[definition.name];
    if (sanitize) {
      const cleaned = sanitize(control.value);
      if (cleaned !== control.value) control.value = cleaned;
    }
    // Live feedback only once the user has committed to the field once.
    if (touched) validate(true);
    wrapper.dispatchEvent(new CustomEvent('bvc:change', { bubbles: true }));
  };

  const onBlur = () => {
    touched = true;
    validate(true);
  };

  control.addEventListener('input', onInput);
  control.addEventListener('change', onInput);
  control.addEventListener('blur', onBlur);

  return {
    name: definition.name,
    definition,
    control,
    wrapper,
    get visible() { return visible; },
    get value() { return value(); },
    set value(next) {
      control.value = next ?? '';
      if (touched) validate(true);
    },
    markTouched() { touched = true; },
    validate,
    setVisible,
    focus
  };
}
