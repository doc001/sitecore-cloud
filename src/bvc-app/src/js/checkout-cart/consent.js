/**
 * consent.mjs
 * ---------------------------------------------------------------------------
 * Requirements 6 and 7.
 *
 *   6.2 — the "I accept" checkbox stays disabled until the user has scrolled
 *         to the bottom of the terms.
 *   7.2 — the refund policy link opens in a new tab.
 *   7.3 — the user must acknowledge the refund policy.
 *
 * Two edge cases that bite every scroll-gate implementation:
 *
 *   a) On a tall desktop viewport the terms box may not scroll at all. There
 *      is nothing to scroll to, so the gate must open immediately or the user
 *      is permanently blocked.
 *   b) Zoom, rotation, or font-size changes turn (a) into a scrolling box and
 *      back again — hence the ResizeObserver rather than a one-time check.
 */

import { messages } from './content.js';

// Sub-pixel scroll heights mean `scrollTop + clientHeight` rarely equals
// `scrollHeight` exactly. A few pixels of slack avoids a gate that never opens.
const SCROLL_SLACK = 8;

export function createConsent(root, onChange) {
  const scrollBox = root.querySelector('[data-terms-scroll]');
  const termsCheckbox = root.querySelector('[data-terms-accept]');
  const refundCheckbox = root.querySelector('[data-refund-accept]');
  const termsHint = root.querySelector('[data-terms-hint]');
  const termsError = root.querySelector('[data-terms-error]');
  const refundError = root.querySelector('[data-refund-error]');

  let hasScrolledToEnd = false;

  function atEnd() {
    if (!scrollBox) return true;
    const { scrollTop, clientHeight, scrollHeight } = scrollBox;
    // Case (a): content shorter than the box — nothing to scroll.
    if (scrollHeight <= clientHeight + SCROLL_SLACK) return true;
    return scrollTop + clientHeight >= scrollHeight - SCROLL_SLACK;
  }

  function unlockIfScrolled() {
    if (hasScrolledToEnd || !atEnd()) return;

    hasScrolledToEnd = true;
    if (termsCheckbox) termsCheckbox.disabled = false;
    if (termsHint) termsHint.hidden = true;
    onChange();
  }

  function showError(node, message) {
    if (!node) return;
    node.textContent = message || '';
    node.hidden = !message;
  }

  /**
   * @param {boolean} reveal — paint the error messages.
   * @returns {boolean} both acknowledgements given.
   */
  function validate(reveal = true) {
    const termsOk = Boolean(termsCheckbox?.checked);
    const refundOk = Boolean(refundCheckbox?.checked);

    if (reveal) {
      showError(
        termsError,
        termsOk ? null : (hasScrolledToEnd ? messages.termsRequired : messages.termsScroll)
      );
      showError(refundError, refundOk ? null : messages.refundRequired);
    }
    return termsOk && refundOk;
  }

  /** First unmet acknowledgement, so the stepper can focus it. */
  function firstInvalidControl() {
    if (!termsCheckbox?.checked) return hasScrolledToEnd ? termsCheckbox : scrollBox;
    if (!refundCheckbox?.checked) return refundCheckbox;
    return null;
  }

  // --- wiring ------------------------------------------------------------

  if (scrollBox) {
    if (termsCheckbox) termsCheckbox.disabled = true;
    scrollBox.addEventListener('scroll', unlockIfScrolled, { passive: true });

    // Keyboard users tab into the box and press End / arrow keys; scroll
    // events still fire, but make the box focusable so they can.
    if (!scrollBox.hasAttribute('tabindex')) scrollBox.setAttribute('tabindex', '0');

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(unlockIfScrolled).observe(scrollBox);
    }
    // Case (a), on load — deferred by a microtask. When the terms box is too
    // short to scroll, atEnd() is true immediately and this fires onChange
    // synchronously; but the caller (start()) wires `stepper` and `consent`
    // AFTER createConsent returns, so a synchronous callback here reaches them
    // while they are still in the temporal dead zone. Deferring lets start()
    // finish wiring before the first unlock runs.
    queueMicrotask(unlockIfScrolled);
  } else if (termsCheckbox) {
    hasScrolledToEnd = true;
    termsCheckbox.disabled = false;
  }

  [termsCheckbox, refundCheckbox].forEach((box) => {
    box?.addEventListener('change', () => {
      validate(true);
      onChange();
    });
  });

  return { validate, firstInvalidControl };
}
