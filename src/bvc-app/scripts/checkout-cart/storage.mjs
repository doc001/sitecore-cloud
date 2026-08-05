/**
 * storage.mjs
 * ---------------------------------------------------------------------------
 * sessionStorage with a seatbelt.
 *
 * Every access is wrapped, because sessionStorage throws — not returns null,
 * throws — in Safari private mode, when the storage quota is full, and when
 * the page is inside a third-party iframe with cookies blocked. An
 * unprotected `sessionStorage.getItem` is one of the most common ways a
 * checkout page dies for a small slice of users nobody tests with.
 */

export function readDraft(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeDraft(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false; // Draft saving is a nicety; never block the user for it.
  }
}

export function clearDraft(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* nothing useful to do */
  }
}

/** Debounce so a fast typist does not write to storage on every keystroke. */
export function debounce(fn, wait = 300) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
