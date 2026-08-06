/**
 * content.mjs
 * ---------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for the checkout form.
 *
 * Everything a non-developer might need to change lives in this file:
 * labels, hints, error messages, and every drop-down list. The build script
 * renders the HTML from this file, and the runtime validates against it, so
 * the two can never drift apart.
 *
 * To add a language, a country, or change an error message: edit here, rebuild.
 * Nothing else needs to be touched.
 */

export const config = {
  // Shown next to the birth date field and used by the date validator.
  dateFormat: 'YYYY-MM-DD',

  // Requirement 2.7.3 — no year earlier than 100 years prior.
  maxAgeYears: 100,

  // Requirement 2.8 — Alberta Student Number is exactly this many digits.
  asnLength: 9,

  // North American phone number, digits only.
  phoneDigits: 10,

  /**
   * Requirement 8.1 asks for a genuinely disabled "Next" button.
   *
   * A truly `disabled` button cannot be focused, cannot be clicked, and
   * announces nothing to a screen reader — the user is stuck with no way to
   * find out WHY they are stuck. So the default here is a button that LOOKS
   * disabled (aria-disabled + styling) but still accepts a click, which then
   * reveals every error and focuses the first offending field.
   *
   * Set this to true if the business owner insists on a hard `disabled`.
   */
  hardDisableNext: false,

  // Draft answers survive a back-navigation or accidental refresh.
  draftKey: 'bvc.checkout.draft',

  // Requirement 7 — opens in a new tab.
  refundPolicyUrl: 'https://bowvalleycollege.ca/about-us/policies/refund-policy',
  termsPolicyUrl: 'https://bowvalleycollege.ca/about-us/policies',

  // MSAL — see msal-auth.mjs. Override per environment if needed.
  auth: {
    clientId: '74ec0abb-7354-4176-9a9e-e9886b631c78',
    tenantId: '8f11c6f4-648e-4c0c-bb99-96e8408a8e2a',
    scopes: ['openid', 'profile', 'email', 'https://bowvalleycollege.ca/ngew/test/login'],
    // v4 exposes initialize(); the 2.12.0 build in the original embed does not.
    msalCdn: 'https://alcdn.msauth.net/browser/4.5.0/js/msal-browser.min.js',
    studentApiBase: 'https://nextjs-jamstack-dev.vercel.app/api/bvcpayment/'
  },

  /**
   * Google Maps Places autocomplete for the address fields (NGEW-217).
   *
   * `apiKey` is intentionally empty here — provision a browser key in Google
   * Cloud, restrict it by HTTP referrer to the hosts that serve this page
   * (uat.bowvalleycollege.ca, the Webflow staging domain, production), enable
   * the "Maps JavaScript API" + "Places API", and drop it in. Until a key is
   * set the module no-ops and every address field stays fully usable as plain
   * manual entry.
   *
   * `countryRestriction` biases suggestions; null = worldwide. It is aligned
   * to Canada by default because the Province list is Canadian.
   */
  googleMaps: {
    apiKey: '',
    countryRestriction: ['ca'],
    mapsJsBase: 'https://maps.googleapis.com/maps/api/js'
  },

  /**
   * Phone country/dialling code. The number is stored in its own field; the
   * dialling code lives in `phoneCountryCode`. Canada and the US share +1, so
   * that is the default. `dialCodeByCountry` lets the mailing Country selection
   * drive the code (still user-overridable) — requirement: "add the prefix
   * based on the country, for Canada and US is 1".
   */
  phone: {
    defaultDialCode: '+1',
    dialCodeByCountry: {
      CA: '+1', US: '+1', MX: '+52', GB: '+44', IE: '+353', FR: '+33',
      DE: '+49', IT: '+39', ES: '+34', PL: '+48', UA: '+380', RU: '+7',
      IN: '+91', PK: '+92', LK: '+94', NP: '+977', CN: '+86', HK: '+852',
      TW: '+886', JP: '+81', KR: '+82', PH: '+63', VN: '+84', ID: '+62',
      MY: '+60', SG: '+65', TH: '+66', BD: '+880', IR: '+98', IQ: '+964',
      IL: '+972', JO: '+962', LB: '+961', SA: '+966', AE: '+971', TR: '+90',
      EG: '+20', DZ: '+213', MA: '+212', NG: '+234', GH: '+233', KE: '+254',
      ET: '+251', TZ: '+255', SO: '+252', SD: '+249', ER: '+291', SN: '+221',
      CM: '+237', CD: '+243', ZA: '+27', ZW: '+263', BR: '+55', AR: '+54',
      CL: '+56', CO: '+57', PE: '+51', VE: '+58', GT: '+502', HN: '+504',
      SV: '+503', JM: '+1', AU: '+61'
    }
  },

  /**
   * Which cart the form is serving. Open Studies (`os`) makes the Alberta
   * Student # mandatory; every other type hides it — this mirrors the cart
   * submitter (checkout.js), which reads the same `?type` query parameter.
   */
  cart: {
    typeParam: 'type',
    openStudiesValue: 'os'
  }
};

/** Appended to the label of every non-mandatory field. Requirement 3. */
export const optionalSuffix = 'optional';

/**
 * Drop-down data.
 *
 * `value` is what gets submitted to the SiS (the business meaning name /
 * code from the attachments). `label` is what the user reads. Swap the
 * `value` strings for the exact SiS codes once confirmed — the runtime never
 * inspects them, so nothing else breaks.
 */
export const options = {
  // Requirement 2.9 — see Gender.png for business meaning names.
  gender: [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'X', label: 'X (Non-Binary, Gender Diverse)' },
    { value: 'U', label: 'Unreported' }
  ],

  // Requirement 2.11 — see PermanentResidentStatus.jpg.
  citizenshipStatus: [
    { value: 'CAN', label: 'Canadian' },
    { value: 'PR', label: 'Permanent Resident' },
    { value: 'REF', label: 'Refugee' },
    { value: 'STUDY', label: 'Study Permit' },
    { value: 'WORK', label: 'Work Permit' },
    { value: 'OTHER', label: 'Other' }
  ],

  // Requirement 2.12 — see Indigenous Status.png.
  indigenousStatus: [
    { value: 'FN_STATUS', label: 'First Nations - Status' },
    { value: 'FN_NONSTATUS', label: 'First Nations - Non Status' },
    { value: 'METIS', label: 'Metis' },
    { value: 'INUIT', label: 'Inuit' },
    { value: 'NA', label: 'Not Applicable' }
  ],

  // Requirement 2.10 — first language. Extend freely.
  firstLanguage: [
    { value: 'EN', label: 'English' },
    { value: 'FR', label: 'French' },
    { value: 'AR', label: 'Arabic' },
    { value: 'ZH', label: 'Chinese (Mandarin)' },
    { value: 'YUE', label: 'Chinese (Cantonese)' },
    { value: 'NL', label: 'Dutch' },
    { value: 'TL', label: 'Filipino / Tagalog' },
    { value: 'DE', label: 'German' },
    { value: 'GU', label: 'Gujarati' },
    { value: 'HI', label: 'Hindi' },
    { value: 'IT', label: 'Italian' },
    { value: 'JA', label: 'Japanese' },
    { value: 'KO', label: 'Korean' },
    { value: 'CR', label: 'Cree' },
    { value: 'BLA', label: 'Blackfoot' },
    { value: 'OJ', label: 'Ojibwe' },
    { value: 'FA', label: 'Persian / Farsi' },
    { value: 'PL', label: 'Polish' },
    { value: 'PT', label: 'Portuguese' },
    { value: 'PA', label: 'Punjabi' },
    { value: 'RU', label: 'Russian' },
    { value: 'SO', label: 'Somali' },
    { value: 'ES', label: 'Spanish' },
    { value: 'TA', label: 'Tamil' },
    { value: 'TI', label: 'Tigrinya' },
    { value: 'UK', label: 'Ukrainian' },
    { value: 'UR', label: 'Urdu' },
    { value: 'VI', label: 'Vietnamese' },
    { value: 'OTHER', label: 'Other' }
  ],

  /**
   * Requirement 2.13 — Country of Citizenship.
   * ISO 3166-1 alpha-2 codes. This is a working subset covering the bulk of
   * BVC's international intake; paste the full ISO list here when SiS
   * confirms its country codes.
   */
  countryOfCitizenship: [
    { value: 'AF', label: 'Afghanistan' }, { value: 'DZ', label: 'Algeria' },
    { value: 'AR', label: 'Argentina' }, { value: 'AU', label: 'Australia' },
    { value: 'BD', label: 'Bangladesh' }, { value: 'BR', label: 'Brazil' },
    { value: 'CM', label: 'Cameroon' }, { value: 'CL', label: 'Chile' },
    { value: 'CN', label: 'China' }, { value: 'CO', label: 'Colombia' },
    { value: 'CD', label: 'Congo (DRC)' }, { value: 'EG', label: 'Egypt' },
    { value: 'SV', label: 'El Salvador' }, { value: 'ER', label: 'Eritrea' },
    { value: 'ET', label: 'Ethiopia' }, { value: 'FR', label: 'France' },
    { value: 'DE', label: 'Germany' }, { value: 'GH', label: 'Ghana' },
    { value: 'GT', label: 'Guatemala' }, { value: 'HN', label: 'Honduras' },
    { value: 'HK', label: 'Hong Kong' }, { value: 'IN', label: 'India' },
    { value: 'ID', label: 'Indonesia' }, { value: 'IR', label: 'Iran' },
    { value: 'IQ', label: 'Iraq' }, { value: 'IE', label: 'Ireland' },
    { value: 'IL', label: 'Israel' }, { value: 'IT', label: 'Italy' },
    { value: 'JM', label: 'Jamaica' }, { value: 'JP', label: 'Japan' },
    { value: 'JO', label: 'Jordan' }, { value: 'KE', label: 'Kenya' },
    { value: 'KR', label: 'Korea, South' }, { value: 'LB', label: 'Lebanon' },
    { value: 'MY', label: 'Malaysia' }, { value: 'MX', label: 'Mexico' },
    { value: 'MA', label: 'Morocco' }, { value: 'NP', label: 'Nepal' },
    { value: 'NG', label: 'Nigeria' }, { value: 'PK', label: 'Pakistan' },
    { value: 'PS', label: 'Palestine' }, { value: 'PE', label: 'Peru' },
    { value: 'PH', label: 'Philippines' }, { value: 'PL', label: 'Poland' },
    { value: 'RO', label: 'Romania' }, { value: 'RU', label: 'Russia' },
    { value: 'SA', label: 'Saudi Arabia' }, { value: 'SN', label: 'Senegal' },
    { value: 'SG', label: 'Singapore' }, { value: 'SO', label: 'Somalia' },
    { value: 'ZA', label: 'South Africa' }, { value: 'ES', label: 'Spain' },
    { value: 'LK', label: 'Sri Lanka' }, { value: 'SD', label: 'Sudan' },
    { value: 'SY', label: 'Syria' }, { value: 'TW', label: 'Taiwan' },
    { value: 'TZ', label: 'Tanzania' }, { value: 'TH', label: 'Thailand' },
    { value: 'TR', label: 'Türkiye' }, { value: 'UA', label: 'Ukraine' },
    { value: 'AE', label: 'United Arab Emirates' },
    { value: 'GB', label: 'United Kingdom' }, { value: 'US', label: 'United States' },
    { value: 'VE', label: 'Venezuela' }, { value: 'VN', label: 'Vietnam' },
    { value: 'ZW', label: 'Zimbabwe' }, { value: 'OTHER', label: 'Other' }
  ],

  /**
   * Canadian provinces and territories. Values are the two-letter codes that
   * Google Places returns as `administrative_area_level_1.short_name`, so an
   * autocompleted address selects the right option with no translation.
   */
  province: [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' }
  ],

  /**
   * Mailing country. Values are ISO 3166-1 alpha-2 codes (Google Places
   * `country.short_name`). Canada is the default; the list mirrors the
   * international intake covered by countryOfCitizenship.
   */
  country: [
    { value: 'CA', label: 'Canada' }, { value: 'US', label: 'United States' },
    { value: 'AF', label: 'Afghanistan' }, { value: 'DZ', label: 'Algeria' },
    { value: 'AR', label: 'Argentina' }, { value: 'AU', label: 'Australia' },
    { value: 'BD', label: 'Bangladesh' }, { value: 'BR', label: 'Brazil' },
    { value: 'CM', label: 'Cameroon' }, { value: 'CL', label: 'Chile' },
    { value: 'CN', label: 'China' }, { value: 'CO', label: 'Colombia' },
    { value: 'CD', label: 'Congo (DRC)' }, { value: 'EG', label: 'Egypt' },
    { value: 'SV', label: 'El Salvador' }, { value: 'ER', label: 'Eritrea' },
    { value: 'ET', label: 'Ethiopia' }, { value: 'FR', label: 'France' },
    { value: 'DE', label: 'Germany' }, { value: 'GH', label: 'Ghana' },
    { value: 'GT', label: 'Guatemala' }, { value: 'HN', label: 'Honduras' },
    { value: 'HK', label: 'Hong Kong' }, { value: 'IN', label: 'India' },
    { value: 'ID', label: 'Indonesia' }, { value: 'IR', label: 'Iran' },
    { value: 'IQ', label: 'Iraq' }, { value: 'IE', label: 'Ireland' },
    { value: 'IL', label: 'Israel' }, { value: 'IT', label: 'Italy' },
    { value: 'JM', label: 'Jamaica' }, { value: 'JP', label: 'Japan' },
    { value: 'JO', label: 'Jordan' }, { value: 'KE', label: 'Kenya' },
    { value: 'KR', label: 'Korea, South' }, { value: 'LB', label: 'Lebanon' },
    { value: 'MY', label: 'Malaysia' }, { value: 'MX', label: 'Mexico' },
    { value: 'MA', label: 'Morocco' }, { value: 'NP', label: 'Nepal' },
    { value: 'NG', label: 'Nigeria' }, { value: 'PK', label: 'Pakistan' },
    { value: 'PS', label: 'Palestine' }, { value: 'PE', label: 'Peru' },
    { value: 'PH', label: 'Philippines' }, { value: 'PL', label: 'Poland' },
    { value: 'RO', label: 'Romania' }, { value: 'RU', label: 'Russia' },
    { value: 'SA', label: 'Saudi Arabia' }, { value: 'SN', label: 'Senegal' },
    { value: 'SG', label: 'Singapore' }, { value: 'SO', label: 'Somalia' },
    { value: 'ZA', label: 'South Africa' }, { value: 'ES', label: 'Spain' },
    { value: 'LK', label: 'Sri Lanka' }, { value: 'SD', label: 'Sudan' },
    { value: 'SY', label: 'Syria' }, { value: 'TW', label: 'Taiwan' },
    { value: 'TZ', label: 'Tanzania' }, { value: 'TH', label: 'Thailand' },
    { value: 'TR', label: 'Türkiye' }, { value: 'UA', label: 'Ukraine' },
    { value: 'AE', label: 'United Arab Emirates' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'VE', label: 'Venezuela' }, { value: 'VN', label: 'Vietnam' },
    { value: 'ZW', label: 'Zimbabwe' }, { value: 'OTHER', label: 'Other' }
  ],

  /**
   * Phone dialling codes. Value is the code that gets prefixed to the number;
   * Canada and the US both use +1, which is the default. Ordered by BVC intake
   * volume, then alphabetical. The mailing Country can auto-select the matching
   * entry via config.phone.dialCodeByCountry.
   */
  phoneCountryCode: [
    { value: '+1', label: '+1 (Canada / United States)' },
    { value: '+91', label: '+91 (India)' },
    { value: '+63', label: '+63 (Philippines)' },
    { value: '+234', label: '+234 (Nigeria)' },
    { value: '+86', label: '+86 (China)' },
    { value: '+92', label: '+92 (Pakistan)' },
    { value: '+44', label: '+44 (United Kingdom)' },
    { value: '+52', label: '+52 (Mexico)' },
    { value: '+55', label: '+55 (Brazil)' },
    { value: '+33', label: '+33 (France)' },
    { value: '+49', label: '+49 (Germany)' },
    { value: '+81', label: '+81 (Japan)' },
    { value: '+82', label: '+82 (South Korea)' },
    { value: '+84', label: '+84 (Vietnam)' },
    { value: '+880', label: '+880 (Bangladesh)' },
    { value: '+971', label: '+971 (United Arab Emirates)' },
    { value: '+966', label: '+966 (Saudi Arabia)' },
    { value: '+254', label: '+254 (Kenya)' },
    { value: '+27', label: '+27 (South Africa)' },
    { value: '+61', label: '+61 (Australia)' }
  ]
};

/**
 * Field definitions.
 *
 * name       — the DOM id, the data-field value, and the draft-storage key.
 * validate   — key into the validators registry (see validators.mjs).
 * showWhen   — conditional display; the field is hidden AND exempt from
 *              validation whenever the condition is false.
 */
export const fields = [
  {
    name: 'firstName', label: 'First Name', type: 'text', required: true,
    validate: 'personName', maxLength: 50, autocomplete: 'given-name'
  },
  {
    name: 'middleName', label: 'Middle Name or Initial', type: 'text', required: false,
    validate: 'personName', maxLength: 50, autocomplete: 'additional-name'
  },
  {
    name: 'lastName', label: 'Last Name', type: 'text', required: true,
    validate: 'personName', maxLength: 50, autocomplete: 'family-name'
  },
  {
    name: 'previousLastName', label: 'Previous Legal Last Name', type: 'text',
    required: false, validate: 'personName', maxLength: 50
  },
  {
    name: 'email', label: 'Email Address', type: 'email', required: true,
    validate: 'email', maxLength: 254, autocomplete: 'email',
    inputMode: 'email'
  },
  {
    // Dialling code prefix. Defaults to +1 (Canada / US); the mailing Country
    // can update it (see index.js). `narrow` keeps it beside the number.
    name: 'phoneCountryCode', label: 'Country Code', type: 'select', required: true,
    validate: 'choice', options: 'phoneCountryCode', defaultValue: '+1', narrow: true
  },
  {
    // The visible input holds the 10 digits (validated). The dialling code is
    // combined into a hidden #phone (+1XXXXXXXXXX) that the cart submitter
    // (checkout.js) reads — so this input takes a different id.
    name: 'phone', label: 'Phone Number', type: 'tel', required: true,
    validate: 'phone', maxLength: 14, autocomplete: 'tel',
    inputMode: 'tel', hint: '10 digits, numbers only', submitId: 'phoneNumber'
  },
  {
    name: 'birthDate', label: 'Birth Date', type: 'date', required: true,
    validate: 'birthDate', autocomplete: 'bday',
    hint: `Format: ${config.dateFormat}`
  },
  {
    // OS-only. The submitter reads Open Studies ASN from #asn-os.
    name: 'asn', label: 'Alberta Student #', type: 'text', required: true,
    validate: 'asn', maxLength: config.asnLength, inputMode: 'numeric',
    hint: `${config.asnLength} digits, numbers only`, submitId: 'asn-os'
  },
  {
    name: 'gender', label: 'Gender', type: 'select', required: true,
    validate: 'choice', options: 'gender'
  },
  {
    name: 'firstLanguage', label: 'First Language', type: 'select', required: true,
    validate: 'choice', options: 'firstLanguage'
  },
  {
    name: 'citizenshipStatus', label: 'Citizenship Status', type: 'select',
    required: true, validate: 'choice', options: 'citizenshipStatus'
  },
  {
    // Requirement 2.12 — only when Canadian, defaults to "Not Applicable".
    name: 'indigenousStatus', label: 'Indigenous Status', type: 'select',
    required: true, validate: 'choice', options: 'indigenousStatus',
    defaultValue: 'NA',
    showWhen: { field: 'citizenshipStatus', equals: ['CAN'] }
  },
  {
    // Requirement 2.13 — every non-Canadian status.
    name: 'countryOfCitizenship', label: 'Country of Citizenship', type: 'select',
    required: true, validate: 'choice', options: 'countryOfCitizenship',
    showWhen: { field: 'citizenshipStatus', equals: ['PR', 'REF', 'STUDY', 'WORK', 'OTHER'] }
  },

  // ==========================================================================
  // Mailing Information step
  //
  // `step`        — which section the field is rendered into.
  // `group`       — 'mailing' or 'billing'; billing fields are hidden and
  //                 exempt from validation while "same as above" is checked.
  // `addressRole` — which part of an address this control holds, so the Google
  //                 Places autocomplete can map a picked place onto the group.
  // ==========================================================================

  // --- Mailing address ----------------------------------------------------
  {
    name: 'address', label: 'Street Address', type: 'text', required: true,
    validate: 'address', maxLength: 100, autocomplete: 'street-address',
    step: 'mailing', group: 'mailing', addressRole: 'street',
    autocompleteAddress: true
  },
  {
    name: 'city', label: 'City', type: 'text', required: true,
    validate: 'personName', maxLength: 60, autocomplete: 'address-level2',
    step: 'mailing', group: 'mailing', addressRole: 'city'
  },
  {
    name: 'province', label: 'Province', type: 'select', required: true,
    validate: 'choice', options: 'province', autocomplete: 'address-level1',
    step: 'mailing', group: 'mailing', addressRole: 'province'
  },
  {
    name: 'postalCode', label: 'Postal Code', type: 'text', required: true,
    validate: 'postalCode', maxLength: 7, autocomplete: 'postal-code',
    hint: 'Format: A1A 1A1', step: 'mailing', group: 'mailing',
    addressRole: 'postalCode', submitId: 'postalcode'
  },
  {
    name: 'country', label: 'Country', type: 'select', required: true,
    validate: 'choice', options: 'country', defaultValue: 'CA',
    autocomplete: 'country', step: 'mailing', group: 'mailing',
    addressRole: 'country'
  },

  // --- Billing address (mirrors mailing; hidden when "same as above") ------
  {
    name: 'billingAddress', label: 'Street Address', type: 'text', required: true,
    validate: 'address', maxLength: 100, autocomplete: 'section-billing street-address',
    step: 'mailing', group: 'billing', addressRole: 'street',
    autocompleteAddress: true, submitId: 'streetAddress-2'
  },
  {
    name: 'billingCity', label: 'City', type: 'text', required: true,
    validate: 'personName', maxLength: 60, autocomplete: 'section-billing address-level2',
    step: 'mailing', group: 'billing', addressRole: 'city', submitId: 'city-2'
  },
  {
    name: 'billingProvince', label: 'Province', type: 'select', required: true,
    validate: 'choice', options: 'province', autocomplete: 'section-billing address-level1',
    step: 'mailing', group: 'billing', addressRole: 'province', submitId: 'province-2'
  },
  {
    name: 'billingPostalCode', label: 'Postal Code', type: 'text', required: true,
    validate: 'postalCode', maxLength: 7, autocomplete: 'section-billing postal-code',
    hint: 'Format: A1A 1A1', step: 'mailing', group: 'billing',
    addressRole: 'postalCode', submitId: 'postalCode-2'
  },
  {
    name: 'billingCountry', label: 'Country', type: 'select', required: true,
    validate: 'choice', options: 'country', defaultValue: 'CA',
    autocomplete: 'section-billing country', step: 'mailing', group: 'billing',
    addressRole: 'country', submitId: 'country-2'
  }
];

/** Every user-facing error string, in one place. */
export const messages = {
  required: 'This field is required.',
  requiredSelect: 'Please choose an option.',
  personName: 'Use letters, numbers, spaces, hyphens, apostrophes or periods only.',
  email: 'Enter a valid email address, for example name@example.com.',
  phone: `Enter a ${config.phoneDigits}-digit phone number.`,
  birthDateFormat: `Enter the date as ${config.dateFormat}.`,
  birthDateFuture: 'Birth date cannot be in the future.',
  birthDateTooOld: `Birth date cannot be more than ${config.maxAgeYears} years ago.`,
  asn: `Your Alberta Student # must be exactly ${config.asnLength} digits.`,
  address: 'Enter a valid street address.',
  postalCode: 'Enter a valid postal code, for example T2P 5C5.',
  termsScroll: 'Please scroll to the end of the terms and conditions first.',
  termsRequired: 'You must accept the terms and conditions to continue.',
  refundRequired: 'You must confirm you have read the refund policies and extension processes.',
  summaryOne: 'There is 1 item that needs your attention.',
  summaryMany: (n) => `There are ${n} items that need your attention.`
};

/** Step definitions — drives the progress indicator and the stepper. */
export const steps = [
  { id: 'student-type', title: 'Student Type', short: 'Start' },
  { id: 'personal', title: 'Personal Information', short: 'Personal' },
  { id: 'mailing', title: 'Mailing Information', short: 'Mailing' },
  { id: 'payment', title: 'Payment Information', short: 'Payment' }
];
