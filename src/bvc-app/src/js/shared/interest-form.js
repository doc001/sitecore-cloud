// Interest capture for offerings that cannot be sold.
//
// Some sections arrive from Sitecore with no price at all —
// `fees: { domestic: null, international: null }`. Four Extended Education
// courses are in that state today (ADMN9302, DESN9315, ISEC9105, ISEC9208), each
// with a single section. The renderer used to coerce that null to 0, so the page
// advertised "$ 0 CAD" behind a working Add button and a shopper could carry a
// free course to checkout. The offering is real; the price is simply missing.
//
// When nothing in a course can be sold, the offers column stops describing an
// offering altogether — no dates, hours, registration window or schedule, all of
// which imply something to enrol in — and becomes this form instead.
//
// The form is rendered INLINE rather than behind an "I am interested" button.
// Once the panel carries no course detail there is nothing for a modal to reveal,
// so the click was pure friction in front of the only thing on offer.
//
// Shared because BOTH ends of the round trip need it — the course pages render
// the form, and the Extended Education listing page shows the success/error
// popup that ClickDimensions redirects back to. esbuild inlines this into each
// bundle, so there is no runtime dependency between them.

/** ClickDimensions endpoint for the interest form. */
var FORM_ACTION = 'https://analytics-ca.clickdimensions.com/forms/h/aP8W4U9m7qUqri3nnRw6WT';

// Public reCAPTCHA site key, copied from /forms/program-form. A site key is
// designed to be public — it identifies the site to Google and is worthless
// without the paired secret, which lives on their server, not here.
var RECAPTCHA_SITEKEY = '6LdZA8grAAAAAJ4TqnEHpm6-HazESgQ1SdM1KrQC';

// Hidden fields carried over verbatim from /forms/program-form. They are how the
// CRM routes and classifies the lead; dropping them would land the enquiry
// unclassified. `cd_visitorkey` is deliberately NOT here — ClickDimensions' own
// tracking script sets it per visitor, and a copied value would attribute every
// enquiry to one person.
var HIDDEN_FIELDS = [
  ['s_type', '916190001'],
  ['funnelStartingStage', '916190002'],
  ['initialTouchPoint', '916190004'],
  ['contact_type', '916190000'],
  ['campaignType', ''],
];

var STYLE_ID = 'bvc-interest-styles',
  POPUP_ID = 'bvc-interest-popup',
  SUCCESS_AUTOCLOSE_MS = 10000;

export function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  var style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = [
    // --- the panel that stands in for the offerings list ---
    '.bvc-interest-panel{padding:20px 22px 24px}',
    '.bvc-interest-note{font-size:.95rem;line-height:1.5;color:#444;margin:0 0 18px}',
    '.bvc-interest-panel label{display:block;margin:0 0 4px;font-size:.85rem;font-weight:600;color:#222}',
    '.bvc-interest-panel .bvc-field{margin-bottom:14px}',
    '.bvc-interest-panel input[type=text],.bvc-interest-panel input[type=email],',
    '.bvc-interest-panel input[type=tel],.bvc-interest-panel select{width:100%;box-sizing:border-box;padding:9px 11px;',
    'border:1px solid #ccc;border-radius:6px;font-size:1rem;font-family:inherit;background:#fff;color:#222}',
    '.bvc-interest-panel input:focus,.bvc-interest-panel select:focus{outline:2px solid #0a66c2;outline-offset:1px;border-color:#0a66c2}',
    '.bvc-required{color:#c0392b}',
    '.bvc-interest-panel .bvc-consent-label{font-weight:400;color:#444;line-height:1.45;font-size:.85rem}',
    '.bvc-interest-submit{width:100%;padding:11px;border:none;border-radius:6px;background:#0a66c2;color:#fff;',
    'font-size:1rem;font-family:inherit;cursor:pointer;margin-top:4px}',
    '.bvc-interest-submit:hover{background:#084d92}',
    // The widget is a rigid 304x78 iframe that Google will not reflow, so on a
    // narrow phone it is the one thing here that cannot shrink. fitRecaptcha()
    // measures the column and scales it down when it does not fit; these rules
    // only reclaim the horizontal padding first, so the scaling starts later and
    // is gentler. transform-origin is set here so the scaled widget stays flush
    // with the fields above it rather than drifting to the middle.
    '.bvc-interest-panel .g-recaptcha{margin:4px 0 16px;transform-origin:0 0}',
    '@media (max-width:430px){.bvc-interest-panel{padding:18px 14px 20px}}',
    // --- result popup (success / error) ---
    '#' + POPUP_ID + '{position:fixed;inset:0;z-index:2147483645;display:flex;align-items:center;justify-content:center;',
    'padding:24px;background:rgba(0,0,0,.45)}',
    '#' + POPUP_ID + ' .bvc-popup-card{position:relative;width:100%;max-width:26rem;background:#fff;border-radius:10px;',
    'padding:28px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:inherit;color:#222}',
    '#' + POPUP_ID + ' .bvc-popup-icon{width:52px;height:52px;margin:0 auto 14px;border-radius:50%;display:flex;',
    'align-items:center;justify-content:center;font-size:28px;color:#fff}',
    '#' + POPUP_ID + '.is-success .bvc-popup-icon{background:#27ae60}',
    '#' + POPUP_ID + '.is-error .bvc-popup-icon{background:#e74c3c}',
    '#' + POPUP_ID + ' h2{margin:0 0 8px;font-size:1.2rem}',
    '#' + POPUP_ID + ' p{margin:0 0 18px;font-size:.92rem;color:#555;line-height:1.5}',
    '#' + POPUP_ID + ' .bvc-popup-dismiss{padding:9px 22px;border:none;border-radius:6px;background:#0a66c2;color:#fff;',
    'font-size:.95rem;font-family:inherit;cursor:pointer}',
    '#' + POPUP_ID + ' .bvc-popup-dismiss:hover{background:#084d92}',
    '#' + POPUP_ID + ' .bvc-popup-close{position:absolute;top:8px;right:8px;width:30px;height:30px;border:none;',
    'border-radius:6px;background:transparent;color:#999;font-size:22px;line-height:1;cursor:pointer}',
    '#' + POPUP_ID + ' .bvc-popup-close:hover{background:#f1f1f1;color:#222}',
  ].join('');
  document.head.appendChild(style);
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}

function field(id, name, type, label, required) {
  return (
    '<div class="bvc-field"><label for="' +
    id +
    '">' +
    label +
    (required ? ' <span class="bvc-required">*</span>' : '') +
    '</label><input class="text-field" maxlength="256" type="' +
    type +
    '" id="' +
    id +
    '" name="' +
    name +
    '" placeholder="Enter your ' +
    label +
    '"' +
    (required ? ' required' : '') +
    '></div>'
  );
}

/**
 * Markup for the interest form.
 *
 * `courseName` / `courseCode` are folded into the `s_faqs` free-text field, which
 * the reference form already submits as the sentence "I am interested. Contact me
 * with more information." Naming the course there is the ONLY way this lead says
 * what it is about — the ClickDimensions form has no course or program field, and
 * it redirects to one FIXED url, so neither the payload nor the return trip
 * carries the course unless it is put here.
 *
 * Field ids are suffixed per course so that two forms on one page — which cannot
 * happen today, but costs nothing to allow — do not collide in their <label for>.
 */
export function interestFormHtml(options) {
  var settings = options || {},
    courseName = settings.courseName || '',
    courseCode = settings.courseCode || '',
    subject = courseName ? courseName + (courseCode ? ' (' + courseCode + ')' : '') : '',
    faqValue = subject ? 'I am interested in ' + subject + '. Contact me with more information.' : 'I am interested. Contact me with more information.',
    suffix = String(courseCode || courseName || 'x').replace(/[^A-Za-z0-9]/g, '') || 'x';

  return (
    '<form class="bvc-interest-form" action="' +
    FORM_ACTION +
    '" method="post">' +
    field('bvc-first-' + suffix, 'first_name', 'text', 'First Name', true) +
    field('bvc-last-' + suffix, 'last_name', 'text', 'Last Name', true) +
    field('bvc-email-' + suffix, 'email', 'email', 'Email Address', true) +
    field('bvc-phone-' + suffix, 'phone', 'tel', 'Phone Number', false) +
    // Wording supplied by BVC. The field itself is unchanged from the reference
    // form — same name, same 1/0 values — so the CRM reads it as it always has.
    '<div class="bvc-field"><label class="bvc-consent-label" for="bvc-consent-' +
    suffix +
    '">You are agreeing to receive future communications from Bow Valley College. <span class="bvc-required">*</span></label>' +
    '<select class="select-field" id="bvc-consent-' +
    suffix +
    '" name="bvc_receivefutureeventcommunications" required>' +
    '<option value="">Please select...</option><option value="1" selected>Yes</option><option value="0">No</option></select></div>' +
    '<div class="g-recaptcha" data-sitekey="' +
    RECAPTCHA_SITEKEY +
    '"></div>' +
    '<input type="hidden" name="s_faqs" value="' +
    escapeHtml(faqValue) +
    '">' +
    HIDDEN_FIELDS.map(function (pair) {
      return '<input type="hidden" name="' + pair[0] + '" value="' + pair[1] + '">';
    }).join('') +
    '<input type="submit" class="bvc-interest-submit" value="Submit">' +
    '</form>'
  );
}

/**
 * Render the reCAPTCHA widgets inside `root`.
 *
 * Explicit render, not reCAPTCHA's implicit auto-scan: the form is written into
 * the page by our own render pass, which can easily happen after the script has
 * finished its one automatic sweep of the document — and it never looks again.
 */
/**
 * Scale the reCAPTCHA to fit its column.
 *
 * The widget is a fixed 304x78 iframe. Google does not reflow it, so on a narrow
 * phone it is the only thing in this form that cannot adapt — everything else is
 * fluid. Letting it overflow pushes the page sideways; clipping it makes the form
 * unsubmittable. So it is measured against the space actually available and
 * scaled down only when it does not fit.
 *
 * Measured rather than driven by a media query on purpose: the breakpoint would
 * have to guess the page's gutters, which belong to Webflow and can change
 * without us. The column's real width cannot be guessed wrong.
 */
export function fitRecaptcha(root) {
  (root || document).querySelectorAll('.g-recaptcha').forEach(function (container) {
    var available = container.clientWidth;
    if (!available) return; // not laid out yet (display:none, detached)
    var scale = Math.min(1, available / 304);
    if (scale >= 1) {
      container.style.transform = '';
      container.style.height = '';
      return;
    }
    container.style.transform = 'scale(' + scale.toFixed(3) + ')';
    // A transform does not affect layout, so the element keeps reserving the
    // full 78px and leaves a gap under the shrunken widget. Reclaim it.
    container.style.height = Math.ceil(78 * scale) + 'px';
  });
}

var fitTimer = null;
function scheduleFit() {
  clearTimeout(fitTimer);
  fitTimer = setTimeout(function () {
    fitRecaptcha(document);
  }, 150);
}

export function activateInterestForms(root) {
  injectStyles();
  var containers = (root || document).querySelectorAll('.g-recaptcha:not([data-rendered])');
  if (!containers.length) return;

  // Rotating a phone or opening the keyboard changes the column width.
  if (!window.__bvcFitBound) {
    window.__bvcFitBound = true;
    window.addEventListener('resize', scheduleFit);
    window.addEventListener('orientationchange', scheduleFit);
  }

  function renderAll() {
    if (!window.grecaptcha || !window.grecaptcha.render) return;
    document.querySelectorAll('.g-recaptcha:not([data-rendered])').forEach(function (container) {
      try {
        window.grecaptcha.render(container, { sitekey: RECAPTCHA_SITEKEY });
        container.setAttribute('data-rendered', '1');
        fitRecaptcha(container.parentNode || document);
      } catch (error) {
        // Already rendered, or the API is unhappy. ClickDimensions validates
        // server-side too, so a widget that fails to draw must not be a dead end.
        console.warn('[Interest] reCAPTCHA render failed', error);
      }
    });
  }

  if (window.grecaptcha && window.grecaptcha.render) return void renderAll();
  window.__bvcRecaptchaLoad = renderAll;
  if (!document.querySelector('script[data-bvc-recaptcha]')) {
    var script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=__bvcRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-bvc-recaptcha', '1');
    document.head.appendChild(script);
  }
}

/** Remove the result popup. */
export function closeResultPopup() {
  var popup = document.getElementById(POPUP_ID);
  popup && popup.remove();
}

/**
 * Show the post-submit popup ClickDimensions redirects back to.
 *
 * Success closes itself after ten seconds; an error does NOT, because the person
 * has just lost what they typed and needs to read why.
 */
export function showResultPopup(kind) {
  injectStyles();
  closeResultPopup();
  var isSuccess = 'success' === kind,
    popup = document.createElement('div');
  popup.id = POPUP_ID;
  popup.className = isSuccess ? 'is-success' : 'is-error';
  popup.innerHTML =
    '<div class="bvc-popup-card" role="alertdialog" aria-modal="true" aria-labelledby="bvc-popup-title">' +
    '<button type="button" class="bvc-popup-close" aria-label="Close">&times;</button>' +
    '<div class="bvc-popup-icon" aria-hidden="true">' +
    (isSuccess ? '&#10003;' : '!') +
    '</div>' +
    '<h2 id="bvc-popup-title">' +
    (isSuccess ? 'Thank you for your interest' : 'Your request could not be sent') +
    '</h2><p>' +
    (isSuccess
      ? 'We have received your details and will connect with you as soon as the course is available.'
      : 'Something went wrong while sending your request. Please try again, or contact us if the problem continues.') +
    '</p><button type="button" class="bvc-popup-dismiss">Close</button></div>';

  document.body.appendChild(popup);
  popup.querySelector('.bvc-popup-close').addEventListener('click', closeResultPopup);
  popup.querySelector('.bvc-popup-dismiss').addEventListener('click', closeResultPopup);
  popup.addEventListener('click', function (event) {
    if (event.target === popup) closeResultPopup();
  });
  document.addEventListener('keydown', function handler(event) {
    if ('Escape' === event.key) {
      closeResultPopup();
      document.removeEventListener('keydown', handler);
    }
  });
  if (isSuccess) setTimeout(closeResultPopup, SUCCESS_AUTOCLOSE_MS);
  return popup;
}

/**
 * Read the outcome ClickDimensions redirected back with.
 *
 * Accepts `?m=success` / `?m=error`, and also a bare `?m-error` — that is the
 * literal form the redirect was specified in, and it parses as a parameter NAMED
 * "m-error" rather than a value, so keying only on `m` would silently show
 * nothing on every failed submission.
 */
export function readSubmissionOutcome(search) {
  var params = new URLSearchParams(search != null ? search : window.location.search),
    value = (params.get('m') || '').toLowerCase();
  if ('success' === value) return 'success';
  if ('error' === value) return 'error';
  if (params.has('m-error') || params.has('m-success')) return params.has('m-error') ? 'error' : 'success';
  return null;
}
