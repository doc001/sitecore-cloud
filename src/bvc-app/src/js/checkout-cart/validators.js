/**
 * validators.mjs
 * ---------------------------------------------------------------------------
 * Pure functions. No DOM, no side effects, no imports beyond content.
 * Each validator takes a trimmed string and returns an error message, or
 * `null` when the value is acceptable.
 *
 * Keeping these DOM-free means they can be reused server-side (the same rules
 * must run again before anything is written to the SiS — client validation is
 * a courtesy to the user, never a security control).
 */

import { config, messages } from './content.js';

/**
 * "Alphanumeric, with certain special characters allowed."
 * Letters (including accented Latin), digits, spaces, hyphen, apostrophe
 * (both straight and curly), and period. Deliberately permissive about
 * accents — rejecting "Ngô" or "O'Brien" is a support ticket waiting to
 * happen.
 */
const NAME_PATTERN = /^[\p{L}\p{M}0-9 .'’\-]+$/u;

/**
 * Street address — as permissive as NAME_PATTERN but also allows the comma,
 * number sign, and slash that real addresses carry ("12 Main St, Unit #3B").
 */
const ADDRESS_PATTERN = /^[\p{L}\p{M}0-9 .,#'’\-\/]+$/u;

/** Canadian postal code, spaces optional: A1A 1A1. */
const CANADIAN_POSTAL_PATTERN = /^[A-Za-z]\d[A-Za-z]\d[A-Za-z]\d$/;

/**
 * Pragmatic email check. Full RFC 5322 is unreadable and rejects nothing real;
 * this catches the mistakes people actually make (missing @, missing dot,
 * trailing space) and leaves true verification to the confirmation email.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Strip everything that is not a digit. */
export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/** Strict YYYY-MM-DD parse. Returns a Date, or null if the string is invalid. */
export function parseISODate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Build in UTC so the user's timezone can never shift the day.
  const date = new Date(Date.UTC(year, month - 1, day));

  // Catches roll-over nonsense like 2024-02-31 becoming March 2nd.
  const isReal =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isReal ? date : null;
}

/** Today at UTC midnight — the upper bound for a birth date. */
export function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** The earliest acceptable birth date. Requirement 2.7.3. */
export function earliestBirthDate() {
  const today = todayUTC();
  return new Date(Date.UTC(
    today.getUTCFullYear() - config.maxAgeYears,
    today.getUTCMonth(),
    today.getUTCDate()
  ));
}

/** Format a Date as YYYY-MM-DD for the native date input's min/max. */
export function toISODateString(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * The registry. Keys match the `validate` property on each field definition
 * in content.mjs.
 */
export const validators = {
  personName(value) {
    return NAME_PATTERN.test(value) ? null : messages.personName;
  },

  email(value) {
    return EMAIL_PATTERN.test(value) ? null : messages.email;
  },

  phone(value) {
    return digitsOnly(value).length === config.phoneDigits ? null : messages.phone;
  },

  birthDate(value) {
    const date = parseISODate(value);
    if (!date) return messages.birthDateFormat;
    if (date > todayUTC()) return messages.birthDateFuture;
    if (date < earliestBirthDate()) return messages.birthDateTooOld;
    return null;
  },

  asn(value) {
    const digits = digitsOnly(value);
    // Requirement 2.8 — exactly nine digits, nothing else.
    return digits.length === config.asnLength && digits === value
      ? null
      : messages.asn;
  },

  address(value) {
    return ADDRESS_PATTERN.test(value) ? null : messages.address;
  },

  /**
   * Canadian format when it looks Canadian, otherwise any reasonably-sized
   * string so international addresses are not rejected. Mirrors the rule the
   * legacy cart submitter uses (checkout.js validatePostalCode).
   */
  postalCode(value) {
    const normalized = value.toUpperCase().replace(/\s+/g, '');
    const ok = CANADIAN_POSTAL_PATTERN.test(normalized) || normalized.length >= 5;
    return ok ? null : messages.postalCode;
  },

  /** Any <select>: the placeholder option carries an empty value. */
  choice(value) {
    return value ? null : messages.requiredSelect;
  }
};

/**
 * Validate a single field definition against a raw value.
 * Returns an error string, or null.
 */
export function validateField(field, rawValue) {
  const value = String(rawValue ?? '').trim();

  if (!value) {
    if (!field.required) return null; // Optional and empty — fine.
    return field.type === 'select' ? messages.requiredSelect : messages.required;
  }

  const run = validators[field.validate];
  return run ? run(value) : null;
}
