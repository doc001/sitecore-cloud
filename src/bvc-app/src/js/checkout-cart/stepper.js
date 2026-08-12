/**
 * stepper.mjs
 * ---------------------------------------------------------------------------
 * Requirements 5.1, 8 and 9.
 *
 * Shows one step at a time, guards forward navigation, and moves focus to the
 * first field that needs attention. It knows nothing about what a "valid"
 * step means — that judgement is injected via `validateStep`.
 */

import { messages } from './content.js';

export function createStepper(root, { steps, validateStep, onEnterStep }) {
  const sections = new Map();
  steps.forEach((step) => {
    const el = root.querySelector(`[data-step="${step.id}"]`);
    if (el) sections.set(step.id, el);
  });

  const order = steps.map((s) => s.id).filter((id) => sections.has(id));
  const progressItems = root.querySelectorAll('[data-progress-step]');

  let index = 0;

  function currentId() {
    return order[index];
  }

  function currentSection() {
    return sections.get(currentId());
  }

  function announce(errorCount) {
    // Each step carries its own summary, so resolve it against the step the
    // user is actually looking at.
    const summary = currentSection()?.querySelector('[data-error-summary]');
    if (!summary) return;
    if (!errorCount) {
      summary.textContent = '';
      summary.hidden = true;
      return;
    }
    summary.textContent =
      errorCount === 1 ? messages.summaryOne : messages.summaryMany(errorCount);
    summary.hidden = false;
  }

  function updateProgress() {
    progressItems.forEach((item) => {
      const position = order.indexOf(item.dataset.progressStep);
      item.classList.toggle('is-current', position === index);
      item.classList.toggle('is-complete', position > -1 && position < index);
      if (position === index) {
        item.setAttribute('aria-current', 'step');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Requirement 8.1 wants the Next button disabled until the step is complete.
   * We paint it as disabled but keep it operable — see config.hardDisableNext
   * in content.mjs for the reasoning.
   */
  function refreshNextButton(hardDisable) {
    const section = currentSection();
    const next = section?.querySelector('[data-next]');
    if (!next) return;

    const { valid } = validateStep(currentId(), false);
    next.classList.toggle('is-disabled', !valid);
    next.setAttribute('aria-disabled', valid ? 'false' : 'true');
    if (hardDisable) next.disabled = !valid;
  }

  function show(nextIndex, { focusHeading = true } = {}) {
    index = Math.max(0, Math.min(nextIndex, order.length - 1));

    order.forEach((id, position) => {
      const section = sections.get(id);
      section.hidden = position !== index;
    });

    announce(0);
    updateProgress();
    onEnterStep?.(currentId());

    if (focusHeading) {
      const heading = currentSection().querySelector('[data-step-heading]');
      if (heading) {
        // Focus the heading, not the first input: screen reader users need to
        // hear where they have landed before they start typing.
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      currentSection().scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function goNext() {
    const { valid, focusTarget, errorCount } = validateStep(currentId(), true);

    if (!valid) {
      announce(errorCount);
      // Requirement 5.1 — the user cannot proceed, and lands on the problem.
      if (focusTarget) {
        focusTarget.focus({ preventScroll: true });
        focusTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    if (index < order.length - 1) show(index + 1);
    return true;
  }

  function goBack() {
    if (index > 0) show(index - 1);
  }

  // Delegated so buttons can be added or re-rendered without re-binding.
  root.addEventListener('click', (event) => {
    const next = event.target.closest('[data-next]');
    if (next && root.contains(next)) {
      event.preventDefault();
      goNext();
      return;
    }

    const back = event.target.closest('[data-back]');
    if (back && root.contains(back)) {
      event.preventDefault();
      goBack();
    }
  });

  // Enter inside a text input should advance, not submit the whole form.
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const tag = event.target.tagName;
    if (tag === 'TEXTAREA' || event.target.closest('[data-terms-scroll]')) return;
    if (tag === 'INPUT' || tag === 'SELECT') {
      event.preventDefault();
      goNext();
    }
  });

  return {
    show,
    goNext,
    goBack,
    refreshNextButton,
    get stepId() { return currentId(); },
    goTo(id) {
      const position = order.indexOf(id);
      if (position > -1) show(position);
    }
  };
}
