/**
 * msal-auth.mjs
 * ---------------------------------------------------------------------------
 * "Current Student" sign-in, rewritten from the original embed.
 *
 * What changed and why:
 *
 * 1. `initialize()` does not exist on msal-browser 2.12.0 — it was introduced
 *    in v3 and is mandatory from v3 onward. The original code called it
 *    inside a try/catch, so on 2.12.0 it threw `TypeError`, was swallowed,
 *    and every auto-populate silently failed. `ensureInitialized()` below
 *    calls it only when it exists, so this file works on v2, v3 and v4.
 *
 * 2. `redirectUri` was hardcoded to bvc-new-v1.webflow.io while the page runs
 *    on uat.bowvalleycollege.ca — a guaranteed AADSTS50011. It is now derived
 *    from the current location. Every host that serves this page must be
 *    registered as a redirect URI in Entra ID.
 *
 * 3. The button was bound at parse time. If the embed executed before the
 *    button existed, the whole script threw and nothing else ran. Binding now
 *    happens on an element passed in by the caller.
 *
 * 4. The bearer token was being logged to the console (`substring(0, 50)`).
 *    Removed — console logs end up in session replay tools and support
 *    screenshots.
 *
 * 5. Popup blockers now fall back to a redirect flow instead of failing.
 *
 * 6. This module no longer touches form fields. It returns a normalised
 *    profile object and lets checkout.mjs decide what to do with it. That is
 *    what kills the `postalCode` / `postalcode` class of bug: one mapping,
 *    in one place, next to the field definitions.
 */

import { config } from './content.mjs';

const { auth } = config;

let msalInstance = null;
let initPromise = null;

/** Load the MSAL library on demand so Webflow needs only one script tag. */
function loadMsalLibrary() {
  if (window.msal) return Promise.resolve(window.msal);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = auth.msalCdn;
    script.async = true;
    script.onload = () => (window.msal ? resolve(window.msal) : reject(new Error('MSAL failed to load')));
    script.onerror = () => reject(new Error('MSAL failed to load'));
    document.head.appendChild(script);
  });
}

/**
 * Idempotent. Safe to call from a click handler, from page load, or from
 * both at once — the same promise is reused.
 */
function ensureInitialized() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const msal = await loadMsalLibrary();

    msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId: auth.clientId,
        authority: `https://login.microsoftonline.com/${auth.tenantId}`,
        // Whatever page we are actually on. Register each host in Entra ID.
        redirectUri: `${window.location.origin}${window.location.pathname}`
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
      }
    });

    // v3+ requires this; v2 does not have it. Guard rather than assume.
    if (typeof msalInstance.initialize === 'function') {
      await msalInstance.initialize();
    }

    // Completes a redirect-flow sign-in if we came back from one.
    if (typeof msalInstance.handleRedirectPromise === 'function') {
      await msalInstance.handleRedirectPromise().catch(() => null);
    }

    return msalInstance;
  })();

  return initPromise;
}

/** The bvcToken is minted by the course-availability call, not by us. */
function readBvcToken() {
  try {
    const raw = sessionStorage.getItem('bvcToken');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Map the SiS response onto our field names.
 * This is the ONLY place API shape meets form shape.
 */
function toProfile(student, account) {
  return {
    firstName: student.firstName || '',
    middleName: student.middleName || '',
    lastName: student.lastName || '',
    // The API returns a full ISO timestamp; the date input wants YYYY-MM-DD.
    birthDate: student.birthDate ? String(student.birthDate).slice(0, 10) : '',
    email: student.address?.email || account?.username || '',
    phone: String(student.address?.phone || '').replace(/\D/g, ''),
    asn: student.asn || '',
    // Mailing step — harmless if those fields are not on the page yet.
    address: student.address?.street || '',
    city: student.address?.city || '',
    province: student.address?.province || '',
    postalCode: student.address?.postalCode || '',
    country: student.address?.country || ''
  };
}

async function fetchStudent(account) {
  const studentId = account?.idTokenClaims?.studentid;
  if (!studentId) return { ok: false, reason: 'no-student-id' };

  const token = readBvcToken();
  if (!token) return { ok: false, reason: 'no-bvc-token' };

  const endpoint = `/sitecorexm.api/student/${studentId}`;
  const url = `${auth.studentApiBase}?endpoint=${encodeURIComponent(endpoint)}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (response.status === 401) return { ok: false, reason: 'unauthorized' };
  if (response.status === 404) return { ok: false, reason: 'not-found' };
  if (!response.ok) return { ok: false, reason: `http-${response.status}` };

  const student = await response.json();
  return { ok: true, profile: toProfile(student, account) };
}

/**
 * @param {object} handlers
 * @param {(profile: object) => void} handlers.onProfile  — prefill the form.
 * @param {(reason: string) => void}  handlers.onProblem  — user-facing notice.
 * @param {() => void}                handlers.onSignedIn — hide the button etc.
 */
export function createStudentAuth({ onProfile, onProblem, onSignedIn }) {
  async function loadProfileFor(account) {
    const result = await fetchStudent(account);
    if (result.ok) {
      onProfile?.(result.profile);
      onSignedIn?.();
    } else {
      onProblem?.(result.reason);
    }
    return result;
  }

  /** Click handler for the "Current Student" button. */
  async function signIn() {
    try {
      const instance = await ensureInitialized();
      const request = { scopes: auth.scopes };

      let account;
      try {
        const response = await instance.loginPopup(request);
        account = response.account;
      } catch (popupError) {
        // Blocked popup — fall back to a full-page redirect.
        const blocked = /popup/i.test(popupError?.errorCode || popupError?.message || '');
        if (blocked) {
          await instance.loginRedirect(request);
          return null;
        }
        throw popupError;
      }

      return await loadProfileFor(account);
    } catch (error) {
      onProblem?.('sign-in-failed');
      console.error('Sign-in failed:', error?.errorCode || error?.message || error);
      return null;
    }
  }

  /** Silent path: already signed in from an earlier page in the cart flow. */
  async function restoreSession() {
    try {
      const instance = await ensureInitialized();
      const accounts = instance.getAllAccounts();
      if (!accounts.length) return null;
      if (!readBvcToken()) return null; // Nothing to authenticate with yet.
      return await loadProfileFor(accounts[0]);
    } catch {
      return null;
    }
  }

  return { signIn, restoreSession };
}
