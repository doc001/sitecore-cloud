/**
 * BVC Cart Checkout — SOURCE
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE. Do not edit public/js/checkout.js (it is generated).
 *
 *   Build : npm run js:build      (esbuild -> public/js/checkout.js, minified)
 *   Watch : npm run js:watch      (rebuild on save)
 *
 * Loaded from Webflow on the cart-checkout page via:
 *   <script src="https://bvc-app.vercel.app/js/checkout.js" defer></script>
 *
 * Config is overridable. Set BEFORE this script loads:
 *   window.__BVC_CHECKOUT_CONFIG__ = { apiOrigin: '', studentPk: '' };
 * Default (production):
 *   apiOrigin : https://bvc-api-proxy.vercel.app  (mstoken, bvcpayment proxy)
 *   studentPk : '' (empty — these are new/anonymous registrations; submit-payment
 *               null-refs with a 500 if a non-empty studentPk is sent)
 *
 * Backend endpoints go through the bvcpayment proxy and use the
 * `thesissitecorexm.api` tenant prefix (the old `sitecorexm.api` now 404s).
 * See OS-COURSE-CART.md (Backend API contract).
 * ---------------------------------------------------------------------------
 */
import { fetchCartFees, feesForSku } from '../shared/fees.js';
import { validateCart, readValidation } from '../shared/validation.js';

(function () {
  'use strict';

  // --- config -------------------------------------------------------------
  var _cfg = (typeof window !== 'undefined' && window.__BVC_CHECKOUT_CONFIG__) || {};
  var apiOrigin = _cfg.apiOrigin != null ? _cfg.apiOrigin : __API_ORIGIN__;
  // Empty studentNo segment in `fee/{skus}/{studentNo}` — matches the course pages.
  var feeId = _cfg.feeApplicantId != null ? _cfg.feeApplicantId : '';
  // Re-check the cart when the checkout page loads. The cart lives in sessionStorage
  // and can sit there for a whole session, so a course can fill or be withdrawn
  // between the add and this page. Doing it at LOAD rather than at submit is
  // deliberate: nothing has been typed yet, so a course dropping out reads as the
  // cart refreshing rather than as a promise being retracted after ten minutes of
  // form filling.
  var repairOnLoad = _cfg.repairOnLoad !== false;
  // Each item is checked ON ITS OWN. Sending the whole cart in one call would trip
  // the conflict defect in docs/sis-api.md and prune a perfectly good cart to one
  // item. Opt in once that is fixed upstream.
  var validateConflicts = true === _cfg.validateConflicts;
  // studentPk must be EMPTY for new/anonymous registrations — submit-payment now
  // null-refs (500) if a non-empty value is sent. Left overridable via config for a
  // future signed-in/MSAL flow, but the default for this public checkout is empty.
  var studentPk = _cfg.studentPk != null ? _cfg.studentPk : '';

  // --- shared token helpers (shared with the cart; reuse if already on page) ---
  var tokenStorage =
    window.tokenStorage || {
      key: 'bvcToken',
      setToken: function (token) {
        sessionStorage.setItem(this.key, JSON.stringify({ token: token, timestamp: Date.now() }));
      },
      isTokenExpired: function () {
        try {
          var storedEntry = JSON.parse(sessionStorage.getItem(this.key));
          return !(storedEntry && storedEntry.token && storedEntry.timestamp) || Date.now() - storedEntry.timestamp > 36e5;
        } catch (error) {
          return true;
        }
      },
      getToken: function () {
        try {
          var storedEntry = JSON.parse(sessionStorage.getItem(this.key));
          return (storedEntry && storedEntry.token) || null;
        } catch (error) {
          return null;
        }
      },
      clearToken: function () {
        sessionStorage.removeItem(this.key);
      },
    };
  window.tokenStorage = tokenStorage;

  var getMsToken =
    window.getMsToken ||
    async function () {
      console.log('[Token] Requesting new token from proxy...');
      var res = await fetch(apiOrigin + '/api/mstoken', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Token request failed with status: ' + res.status);
      var json = await res.json();
      if (!json.access_token) throw new Error('No access token in response');
      return json.access_token;
    };
  window.getMsToken = getMsToken;

  // --- coded registration fields -----------------------------------------
  //
  // The form now carries Sitecore SisIds directly as its option values, so there is
  // nothing left to translate — what the shopper picked IS what /registration wants.
  // The old GENDER_MAP / LANGUAGE_MAP / LEGAL_STATUS_MAP tables are gone with it;
  // they mapped short codes onto values that turned out not to exist in Sitecore at
  // all (legalStatus '1', ethnicity '6', language 'ENG', country 'CA').
  //
  // Sitecore is the source of truth for these codes — confirmed with the registrar
  // 2026-08-20. See docs/sis-api.md and src/js/checkout-cart/content.js.
  // Two of these are NOT Sitecore SisIds, because /registration constrains them:
  //   gender  is bound to System.Char — a multi-character value 400s
  //   country / country_Citizenship must be exactly 2 alphabetic characters,
  //           so Sitecore's CAN / USA / FRA are rejected
  // legalStatus, language and ethnicity are plain strings and do take SisIds
  // (all verified against UAT 2026-08-20; see docs/sis-api.md).
  var DEFAULTS = {
    gender: 'U',         // Unreported — single char, not SisId 678
    language: '121',     // English (SisId)
    legalStatus: '1716', // Canadian (SisId)
    ethnicity: '18',     // Not Applicable (SisId)
    country: 'CA',       // Canada — ISO alpha-2, not Sitecore's CAN
  };

  // Legal statuses billed at domestic rates. Everything else — Student Visa, Work
  // Permit, Non-Canadian, Other, and notably Refugee Claimant — is international.
  // Registrar, 2026-08-20.
  var DOMESTIC_LEGAL_STATUS = [
    '1716', // Canadian
    '1721', // Permanent Resident
    '2209', // Refugee
    '1717', // Convention Refugee
  ];

  /** Domestic unless the learner picked a status that is explicitly international. */
  function isDomesticLegalStatus(code) {
    return !code || -1 !== DOMESTIC_LEGAL_STATUS.indexOf(String(code));
  }
  window.bvcIsDomesticLegalStatus = isDomesticLegalStatus;

  // --- submitting overlay -------------------------------------------------
  //
  // "Proceed to Payment" fires registration -> submit-payment -> a redirect to
  // Flywire. Those are two SiS calls against a backend with a measured 10.9 s
  // median and a 90 s worst case (CLAUDE.md, SiS health watcher), so the page
  // sat completely inert for anything from seconds to a minute and a half —
  // long enough that shoppers click again, and a second click here means a
  // second registration.
  //
  // The overlay covers the viewport for that whole window: it blocks the repeat
  // click, and it survives until the browser navigates away (or an error path
  // takes it down explicitly), so there is no gap between "done" and "gone".
  //
  // Styles are injected rather than shipped in a stylesheet because checkout.js
  // has no paired CSS bundle — the page loads checkout-cart.css, which this
  // script must not depend on being present.
  var SUBMIT_OVERLAY_ID = 'bvc-submitting-overlay';
  var submitOverlay = {
    injectStyles: function () {
      if (document.getElementById(SUBMIT_OVERLAY_ID + '-styles')) return;
      var style = document.createElement('style');
      style.id = SUBMIT_OVERLAY_ID + '-styles';
      style.textContent = [
        '#' + SUBMIT_OVERLAY_ID + '{position:fixed;inset:0;z-index:2147483646;display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;gap:18px;background:rgba(255,255,255,.92);',
        '-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);text-align:center;padding:24px;',
        'font-family:inherit;color:#333;opacity:0;transition:opacity .15s ease-in}',
        '#' + SUBMIT_OVERLAY_ID + '.is-visible{opacity:1}',
        '#' + SUBMIT_OVERLAY_ID + ' .bvc-submitting-spinner{width:52px;height:52px;border:4px solid #dfe3e8;',
        'border-top-color:#0066cc;border-radius:50%;animation:bvc-submitting-spin .8s linear infinite}',
        '#' + SUBMIT_OVERLAY_ID + ' .bvc-submitting-title{font-size:1.15rem;font-weight:600;margin:0}',
        '#' + SUBMIT_OVERLAY_ID + ' .bvc-submitting-note{font-size:.9rem;color:#666;margin:0;max-width:32rem}',
        '@keyframes bvc-submitting-spin{to{transform:rotate(360deg)}}',
        '@media (prefers-reduced-motion:reduce){#' + SUBMIT_OVERLAY_ID + ' .bvc-submitting-spinner{animation-duration:2.4s}',
        '#' + SUBMIT_OVERLAY_ID + '{transition:none;opacity:1}}',
      ].join('');
      document.head.appendChild(style);
    },
    /** Show the overlay. `title` names the step so a long wait still reads as progress. */
    show: function (title, note) {
      try {
        this.injectStyles();
        var overlay = document.getElementById(SUBMIT_OVERLAY_ID);
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = SUBMIT_OVERLAY_ID;
          // aria-live so a screen reader announces the wait and each step change;
          // aria-busy marks the page as working rather than broken. alertdialog
          // + aria-modal tells assistive tech the form behind is out of reach.
          overlay.setAttribute('role', 'alertdialog');
          overlay.setAttribute('aria-modal', 'true');
          overlay.setAttribute('aria-live', 'polite');
          // Lock scrolling behind the overlay; only on first show, since step()
          // re-enters here and would otherwise save 'hidden' as the original.
          this.scrollLock = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          overlay.innerHTML =
            '<div class="bvc-submitting-spinner" aria-hidden="true"></div>' +
            '<p class="bvc-submitting-title"></p>' +
            '<p class="bvc-submitting-note"></p>';
          document.body.appendChild(overlay);
        }
        overlay.querySelector('.bvc-submitting-title').textContent = title || 'Processing your registration…';
        overlay.querySelector('.bvc-submitting-note').textContent = note || 'Please do not close or refresh this page. You will be taken to the payment page shortly.';
        document.body.setAttribute('aria-busy', 'true');
        // Next frame, so the opacity transition actually runs.
        requestAnimationFrame(function () {
          overlay.classList.add('is-visible');
        });
      } catch (error) {
        // An overlay that throws must never be what stops a registration.
        console.warn('[Checkout] Could not show the submitting overlay', error);
      }
    },
    /** Update the copy without flashing the overlay off and on between the two calls. */
    step: function (title, note) {
      if (document.getElementById(SUBMIT_OVERLAY_ID)) this.show(title, note);
    },
    hide: function () {
      try {
        var overlay = document.getElementById(SUBMIT_OVERLAY_ID);
        if (overlay) {
          overlay.remove();
          document.body.style.overflow = this.scrollLock || '';
        }
        document.body.removeAttribute('aria-busy');
      } catch (error) {
        console.warn('[Checkout] Could not hide the submitting overlay', error);
      }
    },
  };
  // A shopper who backs into this page from Flywire gets it out of the bfcache
  // with the overlay still painted. Clear it on restore.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) submitOverlay.hide();
  });

  // Shopping Cart and Form Integration
  class CheckoutFormHandler {
    constructor() {
      // Container for cart display / messages. Prefer the Webflow form wrapper,
      // fall back to the checkout-cart root so nothing throws if it is absent.
      this.form = document.getElementById('email-form') || document.querySelector('[data-checkout]');
      this.shoppingCartElement = document.getElementById('shoppingCart');
      this.registerButton = document.getElementById('registerToCourse');
      // Set for the whole registration -> payment hand-off; see handleSubmit().
      this.submitting = false;
      // Save type globally
      const urlParams = new URLSearchParams(window.location.search);
      this.type = urlParams.get('type');
      // Set the proxy base URL (config-overridable)
      this.proxyBaseUrl = apiOrigin + '/api/bvcpayment';
      // Form fields mapping. ids match the checkout-cart form (Option A):
      // #phone is the hidden combined "+1XXXXXXXXXX"; #phoneNumber is the
      // visible digits input. Richer fields feed the coded schema values.
      this.fields = {
        firstName: document.getElementById('firstName'),
        middleName: document.getElementById('middleName'),
        lastName: document.getElementById('lastName'),
        previousLastName: document.getElementById('previousLastName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'), // combined +1XXXXXXXXXX
        birthDate: document.getElementById('birthDate'),
        gender: document.getElementById('gender'),
        firstLanguage: document.getElementById('firstLanguage'),
        citizenshipStatus: document.getElementById('citizenshipStatus'),
        // Submitted as `ethnicity`. Only rendered for Canadians, so it is often
        // absent — DEFAULTS.ethnicity ('18' Not Applicable) covers that.
        indigenousStatus: document.getElementById('indigenousStatus'),
        countryOfCitizenship: document.getElementById('countryOfCitizenship'),
        asn: this.getAsnField(),
        address: document.getElementById('address'),
        city: document.getElementById('city'),
        province: document.getElementById('province'),
        postalCode: document.getElementById('postalcode'),
        country: document.getElementById('country'),
        billingCheckbox: document.getElementById('checkbox'),
        billingAddress: document.getElementById('streetAddress-2'),
        billingCity: document.getElementById('city-2'),
        billingProvince: document.getElementById('province-2'),
        billingPostalCode: document.getElementById('postalCode-2'),
        billingCountry: document.getElementById('country-2'),
        termsCheckbox: document.getElementById('checkbox-2'),
      };
      // Initialize everything
      this.initializeFormHandlers();
      this.loadCartItems();
      // Render first, then reconcile — the cart paints immediately and corrects
      // itself a beat later, rather than the column sitting empty during the calls.
      if (repairOnLoad)
        this.repairCart().catch(function (error) {
          console.error('[Repair] cart repair failed; cart left as-is', error);
        });
      this.setupBillingAddressToggle();
      this.setupPostalCodeAutoFormat();
      this.setupFeeTierToggle();
      this.createErrorElements();
      this.checkForPaymentErrors();

      // Re-render the cart whenever the multi-step form changes step, so a cart
      // populated after this constructor ran (prior page / cart script) still
      // shows up in the page's cart column.
      document.addEventListener('bvc:checkout-step', () => this.loadCartItems());

      // The form's final "Proceed to Payment" button hands off here: run the
      // registration -> submit-payment -> Flywire redirect flow.
      document.addEventListener('bvc:checkout-submit', () => this.handleSubmit());
    }

    /**
     * The ASN input, whichever id the page ships it under. The legacy Webflow
     * page has BOTH #asn-os and #asn and disables the one that does not apply
     * (see the DOMContentLoaded block at the bottom); the checkout-cart form
     * ships only #asn-os and shows it whenever the cart has credits. So pick
     * the first enabled one rather than keying off ?type — a mixed cart is
     * Extended Ed by ?type yet still needs the Open Studies ASN input.
     */
    getAsnField() {
      const candidates = [document.getElementById('asn-os'), document.getElementById('asn')].filter(Boolean);
      return candidates.find((el) => !el.disabled) || candidates[0] || null;
    }

    /**
     * ASN is mandatory when the cart contains credit-bearing courses, not when
     * ?type=os — carts can mix Open Studies and Extended Ed items. Mirrors
     * cartHasCredits() in src/js/checkout-cart/index.js. Read fresh each call
     * so a cart populated after this handler was constructed still counts.
     */
    cartRequiresAsn() {
      try {
        const storedCart = sessionStorage.getItem('cartItems');
        const items = storedCart ? JSON.parse(storedCart) : null;
        if (Array.isArray(items)) {
          return items.some((item) => parseFloat(item && item.credits) > 0);
        }
      } catch (error) {
        // Unreadable cart — fall through to the totalCredits mirror.
      }
      try {
        return parseFloat(sessionStorage.getItem('totalCredits')) > 0;
      } catch (error) {
        return false;
      }
    }

    checkForPaymentErrors() {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const processingStatus = urlParams.get('processing');

      // Check if there's an error parameter
      if (processingStatus === 'error') {
        // Display error notification
        this.showErrorMessage('Your payment could not be processed. Please check your payment details and try again, or contact customer support for assistance.');

        // Scroll to top to make sure the message is visible
        window.scrollTo(0, 0);
      }
    }

    createErrorElements() {
      // For each field that needs validation, create an error span if it doesn't exist
      const fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'birthDate', 'address', 'city', 'province', 'postalCode', 'country'];
      // A credit-bearing cart also requires the ASN.
      if (this.cartRequiresAsn()) {
        fieldsToValidate.push('asn');
      }
      fieldsToValidate.forEach((field) => {
        const inputElement = this.fields[field];
        if (inputElement) {
          // Check if error element already exists
          let errorElement = document.getElementById(`${field}-error`);
          if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.id = `${field}-error`;
            errorElement.className = 'error';
            errorElement.style.color = 'red';
            errorElement.style.fontSize = '12px';
            errorElement.style.display = 'block';
            errorElement.style.marginTop = '4px';
            // Insert after input field
            inputElement.insertAdjacentElement('beforebegin', errorElement);
          }
        }
      });

      // Create terms and conditions error element if it doesn't exist
      if (!document.getElementById('terms-error')) {
        const termsErrorElement = document.createElement('span');
        termsErrorElement.id = 'terms-error';
        termsErrorElement.className = 'error';
        termsErrorElement.style.color = 'red';
        termsErrorElement.style.fontSize = '12px';
        termsErrorElement.style.display = 'block';
        termsErrorElement.style.marginTop = '4px';
        if (this.fields.termsCheckbox) {
          this.fields.termsCheckbox.parentElement.insertAdjacentElement('afterend', termsErrorElement);
        }
      }
    }

    validateAsn(asn) {
      const digitsOnly = asn.replace(/\D/g, '');
      return digitsOnly.length === 9;
    }

    setupPostalCodeAutoFormat() {
      const postalCodeInput = this.fields.postalCode;
      if (postalCodeInput) {
        postalCodeInput.addEventListener('input', (event) => {
          let value = event.target.value.toUpperCase().replace(/\s+/g, '');

          if (value.length > 3) {
            value = value.slice(0, 3) + ' ' + value.slice(3);
          }

          event.target.value = value;
        });
      }
    }

    setupFeeTierToggle() {
      if (this.fields.citizenshipStatus) {
        this.fields.citizenshipStatus.addEventListener('change', () => {
          this.applyFeeTier();
        });
      }
      this.applyFeeTier();
    }

    applyFeeTier() {
      var citizenshipEl = this.fields.citizenshipStatus;
      if (!citizenshipEl || !citizenshipEl.value) return;

      var domestic = isDomesticLegalStatus(citizenshipEl.value);

      var items;
      try {
        items = JSON.parse(sessionStorage.getItem('cartItems') || '[]');
      } catch (error) {
        return;
      }
      if (!Array.isArray(items) || 0 === items.length) return;

      var changed = false;
      items.forEach(function (item) {
        if (null == item.domesticPrice && null == item.internationalPrice) return;
        var newPrice = domestic
          ? (null != item.domesticPrice ? item.domesticPrice : item.price)
          : (null != item.internationalPrice ? item.internationalPrice : item.price);
        var newTax = domestic
          ? (null != item.domesticTax ? item.domesticTax : item.tax)
          : (null != item.internationalTax ? item.internationalTax : item.tax);
        if (item.price !== newPrice || item.tax !== newTax) {
          item.price = newPrice;
          item.tax = newTax;
          changed = true;
        }
      });

      if (changed) {
        sessionStorage.setItem('cartItems', JSON.stringify(items));
        this.loadCartItems();
      }
    }

    setupBillingAddressToggle() {
      const billingAddressSection = document.querySelector('.billing-address');
      if (!billingAddressSection) return;
      // Set initial state
      if (this.fields.billingCheckbox && this.fields.billingCheckbox.checked) {
        billingAddressSection.style.display = 'none';
      } else {
        billingAddressSection.style.display = 'block';
      }
      // Add event listener
      if (this.fields.billingCheckbox) {
        this.fields.billingCheckbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            billingAddressSection.style.display = 'none';
          } else {
            billingAddressSection.style.display = 'block';
          }
        });
      }
    }

    initializeFormHandlers() {
      // Use the register button for form submission
      if (this.registerButton) {
        this.registerButton.addEventListener('click', this.handleSubmit.bind(this));
      }
    }

    async getToken(forceRefresh) {
      let token = tokenStorage.getToken();
      if (forceRefresh || !token || tokenStorage.isTokenExpired()) {
        token = await getMsToken();
        tokenStorage.setToken(token);
      }
      return token;
    }

    /**
     * Re-validate the cart on page load and drop anything that can no longer be
     * registered, then recalculate fees for whatever is left.
     *
     * Fails OPEN in every direction: an item is dropped only on an explicit verdict
     * from the API. A missing token, a network error, or a response shape we do not
     * recognise leaves the cart exactly as it was — a validation outage must never
     * empty somebody's basket on the way to paying.
     *
     * Returns the items it removed, so handleSubmit() can abort on a non-empty result.
     */
    async repairCart() {
      let items = [];
      try {
        items = JSON.parse(sessionStorage.getItem('cartItems') || '[]');
      } catch (error) {
        return [];
      }
      if (!Array.isArray(items) || 0 === items.length) return [];

      let token;
      try {
        token = await this.getToken();
      } catch (error) {
        console.warn('[Repair] no token; leaving the cart untouched', error);
        return [];
      }

      const skus = items.map((item) => item.sku);
      const verdicts = await Promise.all(
        items.map(async (item) => {
          // Solo by default. Sending the rest of the cart as context would trip the
          // conflict defect and prune a healthy cart down to one item.
          const context = validateConflicts ? skus.filter((sku) => sku !== item.sku) : [];
          try {
            let response = await validateCart({ apiOrigin, sku: item.sku, cartSkus: context, token });
            if (401 === response.status) {
              token = await this.getToken(true);
              response = await validateCart({ apiOrigin, sku: item.sku, cartSkus: context, token });
            }
            return readValidation(response);
          } catch (error) {
            console.warn('[Repair] validation failed for', item.sku, '— keeping it', error);
            return null;
          }
        })
      );

      const isDropped = (index) => !!verdicts[index] && !verdicts[index].ok;
      const removed = items.filter((_, index) => isDropped(index));
      if (0 === removed.length) return [];

      const kept = items.filter((_, index) => !isDropped(index));
      console.log('[Repair] dropping', removed.map((item) => item.sku).join(', '));

      // Fees are CART-LEVEL, so removing a course changes the whole set. Recalculate
      // before re-rendering, or the page bills the previous cart's fees.
      try {
        const result = await fetchCartFees({ apiOrigin, skus: kept.map((item) => item.sku), feeId, token });
        kept.forEach((item) => {
          const perCourse = feesForSku(result.feeData, item.sku);
          item.fees = perCourse.fees;
          item.feeSummary = perCourse.summary;
        });
        if (0 === kept.length) sessionStorage.removeItem('feeSession');
        else
          sessionStorage.setItem(
            'feeSession',
            JSON.stringify({
              active: true,
              createdAt: new Date().toISOString(),
              // Shape must match what the cart writes — getSessionFees() reads
              // feeSession.feeData.fees / .summary.
              feeData: { courseIds: kept.map((item) => item.sku).join(','), fees: result.feeData, summary: result.summary, timestamp: new Date().toISOString() },
              relatedTo: 'cartSession',
            })
          );
      } catch (error) {
        // Showing no fees beats showing the previous cart's fees on a cart that changed.
        console.error('[Repair] fee recalculation failed; clearing the fee session', error);
        sessionStorage.removeItem('feeSession');
      }

      sessionStorage.setItem('cartItems', JSON.stringify(kept));
      // Keep the credits mirror in step — ASN visibility falls back to it when the
      // cart cannot be read, and dropping the only credit course must hide the field.
      try {
        if (null !== sessionStorage.getItem('totalCredits'))
          sessionStorage.setItem(
            'totalCredits',
            String(
              kept.reduce(function (total, item) {
                return total + (parseInt(item.credits, 10) || 0);
              }, 0)
            )
          );
      } catch (error) {
        /* non-fatal */
      }

      const names = removed.map((item) => item.productName || item.name || item.sku);
      this.showCartNotice(
        1 === names.length
          ? `${names[0]} is no longer available and has been removed from your cart.`
          : `These courses are no longer available and have been removed from your cart: ${names.join(', ')}.`
      );
      this.loadCartItems();
      // Lets the form re-evaluate anything derived from the cart (ASN visibility).
      document.dispatchEvent(new CustomEvent('bvc:cart-updated', { detail: { removed: removed.length, remaining: kept.length } }));
      return removed;
    }

    showCartNotice(text) {
      if (!this.shoppingCartElement || !this.shoppingCartElement.parentNode) return;
      let notice = document.getElementById('bvc-cart-notice');
      if (!notice) {
        notice = document.createElement('div');
        notice.id = 'bvc-cart-notice';
        notice.setAttribute('role', 'status');
        // Inserted as a SIBLING: displayCartItems() overwrites the cart element's
        // innerHTML, so a notice placed inside it would vanish on the next render.
        notice.style.cssText = 'padding:12px;margin-bottom:12px;border-left:4px solid #b00020;background:#fdf0f2;color:#5c0011;font-size:14px;line-height:1.4;';
        this.shoppingCartElement.parentNode.insertBefore(notice, this.shoppingCartElement);
      }
      notice.textContent = text;
    }

    loadCartItems() {
      // Check if cart items exist in sessionStorage
      let cartItems = [];
      try {
        const storedCart = sessionStorage.getItem('cartItems');
        if (storedCart) {
          console.log('Cart items found:', storedCart);
          cartItems = JSON.parse(storedCart);
        }

        // Fix missing product names if they exist as 'name' instead of 'productName'
        cartItems = cartItems.map((item) => {
          if (!item.productName && item.name) {
            item.productName = item.name;
          }
          return item;
        });
      } catch (error) {
        console.error('Error loading cart items:', error);
        cartItems = [];
      }

      // Get session fees if they exist
      let sessionFees = this.getSessionFees();

      // For debugging, log the fees
      console.log('Session fees for cart display:', sessionFees);

      // If no fees found, check if there's another key that might contain fees
      if (!sessionFees) {
        const possibleFeeKeys = ['fees', 'courseFees', 'additionalFees', 'sessionFees'];
        for (const key of possibleFeeKeys) {
          try {
            const potentialFees = sessionStorage.getItem(key);
            if (potentialFees) {
              console.log(`Found potential fees in ${key}:`, potentialFees);
              const parsedFees = JSON.parse(potentialFees);
              if (parsedFees && (Array.isArray(parsedFees) || parsedFees.fees)) {
                sessionFees = Array.isArray(parsedFees) ? { fees: parsedFees } : parsedFees;
                console.log(`Using fees from ${key}:`, sessionFees);
                break;
              }
            }
          } catch (e) {
            console.error(`Error checking for fees in ${key}:`, e);
          }
        }
      }

      // Display cart items with session fees if they exist
      this.displayCartItems(cartItems, sessionFees);
    }

    getSessionFees() {
      try {
        const feeSession = sessionStorage.getItem('feeSession');
        if (feeSession) {
          console.log('Fee session found:', feeSession);
          const parsedFees = JSON.parse(feeSession);
          // Canonical cart shape written by the cart: { feeData: { fees: [...], summary: {...} } }.
          // Fees live at the cart/session level, NOT per item.
          if (parsedFees && parsedFees.feeData && Array.isArray(parsedFees.feeData.fees)) {
            return { fees: parsedFees.feeData.fees, summary: parsedFees.feeData.summary || null };
          }
          // Validate the structure of the fee data
          if (!parsedFees || !Array.isArray(parsedFees.fees)) {
            // Try to handle different possible structures
            if (Array.isArray(parsedFees)) {
              // If it's directly an array of fees
              return { fees: parsedFees };
            } else if (typeof parsedFees === 'object') {
              // If it has a different structure, try to extract fees
              const fees = parsedFees.fees || parsedFees.feeItems || parsedFees.items || [];
              return { fees: fees };
            }
          } else {
            return parsedFees;
          }
        }
      } catch (error) {
        console.error('Error loading session fees:', error);
      }
      // For debugging: if no fees found, check all session storage
      console.log('All session storage items:');
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        console.log(`${key}: ${sessionStorage.getItem(key)}`);
      }
      return null;
    }

    // Cart-level fee totals (amount + tax) from feeSession. Prefers the
    // pre-computed summary; falls back to summing the (de-duped) fees array.
    getSessionFeeTotals() {
      try {
        const feeSession = JSON.parse(sessionStorage.getItem('feeSession') || 'null');
        const feeData = feeSession && feeSession.feeData;
        if (feeData && feeData.summary) {
          return {
            amount: parseFloat(feeData.summary.totalAmount) || 0,
            tax: parseFloat(feeData.summary.totalTax) || 0,
          };
        }
        if (feeData && Array.isArray(feeData.fees)) {
          return feeData.fees.reduce(
            (totals, fee) => ({
              amount: totals.amount + (parseFloat(fee.amount) || 0),
              tax: totals.tax + (parseFloat(fee.tax) || 0),
            }),
            { amount: 0, tax: 0 }
          );
        }
      } catch (error) {
        console.error('Error reading session fee totals:', error);
      }
      return { amount: 0, tax: 0 };
    }

    displayCartItems(items) {
      if (!this.shoppingCartElement) {
        console.error('Shopping cart element not found');
        return;
      }
      // Rendered here rather than added to the container once, because every render
      // replaces innerHTML — a heading written by anything else would be wiped on the
      // next bvc:checkout-step. Both branches carry it so the column is never a
      // headless block of prices.
      const cartTitle = '<h2 class="bvc-cart-title">Shopping Cart</h2>';

      if (items.length === 0) {
        this.shoppingCartElement.innerHTML = cartTitle + '<p class="bvc-cart-empty">Your shopping cart is empty.</p>';
        return;
      }
      let productTotal = 0;
      let tuitionTax = 0;
      let cartHtml = cartTitle + `<div class="shopping-cart-items">`;

      items.forEach((item) => {
        const productId = item.id || item.sku;
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        const quantity = item.quantity || 1;
        const itemTotal = price * quantity;
        productTotal += itemTotal;
        tuitionTax += (parseFloat(item.tax) || 0) * quantity;

        const productName = item.productName || item.name || 'Unknown Product';
        const productDelivery = item.productDelivery || '';
        const productDays = item.productdays || '';
        const productDates = item.productdates || item.dates || '';
        const productHours = item.producthours || item.hours || '';

        cartHtml += `
        <div class="cart-item">
            <div class="cart-item-details">
                <div><strong>${item.productName || item.sku}</strong></div>
                <div class="cart-item-info"><span style="font-weight: 600;">Credits: </span> ${item.credits}</div>
                <div class="cart-item-info"><span style="font-weight: 600;">Tuition:</span> $${item.price} x ${item.quantity}</div>
                ${parseFloat(item.tax) > 0 ? `<div class="cart-item-info"><span style="font-weight: 600;">Tuition Tax:</span> $${parseFloat(item.tax).toFixed(2)}</div>` : ''}
                <div class="cart-item-info"><span style="font-weight: 600;">Delivery:</span> ${item.productDelivery || 'Standard'}</div>
                <div class="cart-item-info"><span style="font-weight: 600;">Dates:</span> ${item.productdates || 'Not specified'}</div>
                ${item.timeblocks && item.timeblocks.length > 0
            ? `<div class="cart-item-info"><span style="font-weight: 600;">Schedule:</span></div>
                       ${item.timeblocks.map((block) =>
              `<div class="cart-item-info" style="padding-left: 20px;">• ${block.day}: ${block.hours}</div>`
            ).join('')}`
            : `<div class="cart-item-info"><span style="font-weight: 600;">Days:</span> ${item.productdays || 'Not specified'}</div>
                       <div class="cart-item-info"><span style="font-weight: 600;">Hours:</span> ${item.producthours || 'Not specified'}</div>`
          }
                <div class="cart-item-info"><span style="font-weight: 600;">Location:</span> ${item.productlocation || 'Not specified'}</div>
        </div>
            <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
        </div>`;
      });

      cartHtml += `</div>`;

      // Now get fee session from sessionStorage
      let sessionFeeData = sessionStorage.getItem('feeSession');
      let sessionFees = sessionFeeData ? JSON.parse(sessionFeeData) : null;

      let totalFees = 0;
      let totalTax = tuitionTax;
      let grandTotal = productTotal;

      if (sessionFees && sessionFees.feeData && sessionFees.feeData.fees) {
        const fees = sessionFees.feeData.fees;
        cartHtml += `<div class="cart-session-fees"><h5>Additional Fees</h5>`;

        for (let i = 0; i < fees.length; i++) {
          const fee = fees[i];
          const feeName = fee.description || 'Fee';
          const feeAmount = parseFloat(fee.amount) || 0;
          const feeTax = parseFloat(fee.tax) || 0;

          totalFees += feeAmount;
          totalTax += feeTax;

          cartHtml += `
            <div class="fee-item">
                <div class="fee-item-details"><strong>${feeName}</strong></div>
                <div class="fee-item-amount">$${feeAmount.toFixed(2)}${feeTax > 0 ? ` + $${feeTax.toFixed(2)} tax` : ''}</div>
            </div>`;
        }

        cartHtml += `</div>`;
      }

      grandTotal += totalFees + totalTax;

      cartHtml += `
    <div class="cart-summary">
        <div class="cart-row">
            <div class="cart-label">Subtotal (Courses):</div>
            <div class="cart-value">$${productTotal.toFixed(2)}</div>
        </div>
        <div class="cart-row">
            <div class="cart-label">Additional Fees Total:</div>
            <div class="cart-value">$${totalFees.toFixed(2)}</div>
        </div>
        <div class="cart-row">
            <div class="cart-label">Tax:</div>
            <div class="cart-value">$${totalTax.toFixed(2)}</div>
        </div>
        <div class="cart-row total">
            <div class="cart-label">Total:</div>
            <div class="cart-value">$${grandTotal.toFixed(2)}</div>
        </div>
    </div>`;

      this.shoppingCartElement.innerHTML = cartHtml;
    }

    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }

    validatePhone(phone) {
      const re = /^\+?[\d\s\-()]{10,}$/;
      return re.test(phone);
    }

    validatePostalCode(postalCode) {
      const normalized = postalCode.toUpperCase().replace(/\s+/g, '');
      const canadianFormat = /^[A-Za-z]\d[A-Za-z]\d[A-Za-z]\d$/;
      return canadianFormat.test(normalized) || normalized.length >= 5;
    }

    validateBirthDate(birthDate) {
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) return false;

      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

      return date <= eighteenYearsAgo;
    }

    validateForm() {
      let isValid = true;
      const errors = {};

      // Clear previous errors. Two shapes: the legacy .error nodes, and the
      // form's own .bvc-field__error[data-error], which are hidden when empty.
      document.querySelectorAll('.error').forEach((el) => {
        el.textContent = '';
      });
      document.querySelectorAll('[data-error]').forEach((el) => {
        el.textContent = '';
        el.hidden = true;
      });

      Object.values(this.fields).forEach((field) => {
        if (field && field.classList) {
          field.classList.remove('error-field');
        }
      });

      const requiredFields = {
        firstName: 'First Name is required',
        lastName: 'Last Name is required',
        email: 'Email is required',
        phone: 'Phone Number is required',
        birthDate: 'Birth Date is required',
        address: 'Street Address is required',
        city: 'City is required',
        province: 'Province is required',
        postalCode: 'Postal Code is required',
        country: 'Country is required',
      };

      if (this.cartRequiresAsn()) {
        requiredFields['asn'] = 'ASN is required';
      }

      Object.entries(requiredFields).forEach(([field, message]) => {
        const input = this.fields[field];
        if (input && !input.value.trim()) {
          errors[field] = message;
          isValid = false;
          input.classList.add('error-field');
        }
      });

      if (this.fields.email && this.fields.email.value && !this.validateEmail(this.fields.email.value)) {
        errors.email = 'Invalid email format';
        isValid = false;
        this.fields.email.classList.add('error-field');
      }

      if (this.fields.phone && this.fields.phone.value && !this.validatePhone(this.fields.phone.value)) {
        errors.phone = 'Invalid phone number';
        isValid = false;
        this.fields.phone.classList.add('error-field');
      }

      if (this.fields.birthDate && this.fields.birthDate.value && !this.validateBirthDate(this.fields.birthDate.value)) {
        errors.birthDate = 'Invalid birth date';
        isValid = false;
        this.fields.birthDate.classList.add('error-field');
      }

      if (this.fields.postalCode && this.fields.postalCode.value && !this.validatePostalCode(this.fields.postalCode.value)) {
        errors.postalCode = 'Invalid postal code';
        isValid = false;
        this.fields.postalCode.classList.add('error-field');
      }

      // ASN Final Validation — credit courses in the cart, not ?type=os.
      if (this.cartRequiresAsn() && this.fields.asn) {
        const asnValue = this.fields.asn.value.trim();

        if (!asnValue) {
          errors.asn = 'ASN is required';
          isValid = false;
          this.fields.asn.classList.add('error-field');
        } else if (!/^\d{9}$/.test(asnValue)) {
          errors.asn = 'ASN must be exactly 9 digits';
          isValid = false;
          this.fields.asn.classList.add('error-field');
        }
      }

      const termsCheckbox = document.getElementById('checkbox-2');
      if (termsCheckbox && !termsCheckbox.checked) {
        errors.terms = 'You must accept the terms and conditions';
        isValid = false;
        const termsError = document.getElementById('terms-error') || document.querySelector('[data-terms-error]');
        if (termsError) {
          termsError.textContent = errors.terms;
          termsError.hidden = false;
        }
      }

      Object.keys(errors).forEach((field) => {
        if (field !== 'terms') {
          const errorElement = document.getElementById(`${field}-error`);
          if (errorElement) {
            errorElement.textContent = errors[field];
            errorElement.hidden = false;
          }
        }
      });

      // Kept for the summary in handleSubmit: a field that fails here can live on
      // a step that is not on screen, so the per-field message alone is invisible.
      this.validationErrors = errors;

      return isValid;
    }

    /**
     * Thin wrapper around the real submit.
     *
     * The overlay covers the whole viewport, so ANY unhandled throw between
     * raising it and the redirect would leave the shopper looking at a spinner
     * that never resolves — worse than the blank wait it replaced. Every known
     * failure inside runSubmit() takes the overlay down itself; this catches the
     * ones nobody thought of.
     */
    async handleSubmit(event) {
      try {
        await this.runSubmit(event);
      } catch (error) {
        console.error('[Checkout] Unhandled submit failure', error);
        this.submitting = false;
        submitOverlay.hide();
        this.showErrorMessage('Something went wrong while processing your registration. Please try again, or contact us if this keeps happening.');
      }
    }

    async runSubmit(event) {
      if (event) {
        event.preventDefault();
      }
      // The overlay blocks the pointer, but not the Enter key and not a second
      // dispatch of bvc:checkout-submit — and a second pass through here would
      // create a second registration for the same cart.
      if (this.submitting) {
        return;
      }
      // Validate the form
      if (!this.validateForm()) {
        const messages = Object.keys(this.validationErrors || {}).map((key) => this.validationErrors[key]);
        this.showErrorMessage(
          messages.length
            ? `Please correct the following before continuing: ${messages.join('; ')}.`
            : 'Please check your details before continuing.'
        );
        return;
      }
      // Held until the redirect; every way out below clears it again.
      this.submitting = true;
      // Last line of defence. The load-time repair can be minutes old by now — a
      // section can fill while the shopper works through the three form steps. Catch
      // it here rather than creating a registration that submit-payment will reject
      // with a generic "please try again" the shopper can do nothing about.
      // Fails open: repairCart() only ever returns items the API explicitly refused.
      //
      // The overlay goes up HERE, not after the repair: this call is itself a
      // per-item round trip to the same slow backend, so the shopper is already
      // waiting on it. It stays up until the browser leaves for Flywire, or an
      // error path below takes it down.
      submitOverlay.show('Checking your cart…', 'Confirming your courses are still available. Please do not close or refresh this page.');
      try {
        const droppedAtSubmit = await this.repairCart();
        if (droppedAtSubmit.length) {
          this.submitting = false;
          submitOverlay.hide();
          this.showErrorMessage(
            1 === droppedAtSubmit.length
              ? `${droppedAtSubmit[0].productName || droppedAtSubmit[0].sku} is no longer available and has been removed. Please review your cart before continuing to payment.`
              : 'Some courses are no longer available and have been removed. Please review your cart before continuing to payment.'
          );
          return;
        }
      } catch (error) {
        console.error('[Repair] pre-submit check failed; continuing', error);
      }
      // Get cart items
      let cartItems = [];
      try {
        const storedCart = sessionStorage.getItem('cartItems');
        if (storedCart) {
          cartItems = JSON.parse(storedCart);
        }
      } catch (error) {
        console.error('Error loading cart items:', error);
      }
      // Get session fees if they exist
      const sessionFees = this.getSessionFees();
      // Extract course IDs
      const courseIds = cartItems.map((item) => item.sku);
      // Prepare form data
      const formData = this.collectFormData();
      // Determine billing address
      const useSameAddress = this.fields.billingCheckbox && this.fields.billingCheckbox.checked;
      // Format the data according to the required schema. Coded fields carry the
      // Sitecore SisId the form supplied; DEFAULTS only covers a field left blank.
      const isCanadianCitizen = formData.citizenshipStatus === '1716';
      const data = {
        studentId: 0, // New/anonymous students: send 0. The API now rejects null ("The StudentId field is required.")
        firstName: formData.firstName || '',
        middleName: formData.middleName || '',
        lastName: formData.lastName || '',
        previousLastName: formData.previousLastName || '',
        birthDate: this.formatDate(formData.birthDate),
        gender: formData.gender || DEFAULTS.gender,
        address: formData.address || '',
        city: formData.city || '',
        province: formData.province || '',
        postalCode: formData.postalCode || '',
        country: formData.country || DEFAULTS.country,
        email: formData.email || '',
        phone: formData.phone || '', // combined +1XXXXXXXXXX from the form
        asn: formData.asn || '',
        courses: courseIds.length > 0 ? courseIds : [219369], // Default course ID if none provided
        legalStatus: formData.citizenshipStatus || DEFAULTS.legalStatus,
        language: formData.firstLanguage || DEFAULTS.language,
        // Indigenous Status only renders for Canadians; everyone else is Not Applicable.
        ethnicity: formData.indigenousStatus || DEFAULTS.ethnicity,
        feeGroup: 'Tuition',
        // Canadians => Canada; otherwise the selected country of citizenship.
        country_Citizenship: isCanadianCitizen ? DEFAULTS.country : (formData.countryOfCitizenship || DEFAULTS.country),
      };

      // If we have session fees, add them to the data
      // Start building from item-level fees
      let additionalFees = [];
      cartItems.forEach((item) => {
        if (Array.isArray(item.fees)) {
          item.fees.forEach((fee) => {
            const feeAmount = typeof fee.amount === 'string' ? parseFloat(fee.amount) : fee.amount || 0;
            if (!isNaN(feeAmount)) {
              additionalFees.push({
                name: fee.description || 'Fee',
                description: '', // optional, extend if needed
                amount: feeAmount,
              });
            }
          });
        }
      });

      // Optionally merge in sessionFees for legacy support
      if (sessionFees) {
        let sessionBased = [];
        if (Array.isArray(sessionFees.fees)) {
          sessionBased = sessionFees.fees;
        } else if (Array.isArray(sessionFees)) {
          sessionBased = sessionFees;
        } else if (typeof sessionFees === 'object') {
          const possibleKeys = ['items', 'feeItems', 'additionalFees'];
          for (const key of possibleKeys) {
            if (Array.isArray(sessionFees[key])) {
              sessionBased = sessionFees[key];
              break;
            }
          }
        }
        sessionBased.forEach((fee) => {
          const feeAmount = typeof fee.amount === 'string' ? parseFloat(fee.amount) : fee.amount || 0;
          if (!isNaN(feeAmount)) {
            additionalFees.push({
              name: fee.name || fee.description || 'Fee',
              description: fee.description || '',
              amount: feeAmount,
            });
          }
        });
      }

      // Finally, assign to payload if any
      if (additionalFees.length > 0) {
        data.additionalFees = additionalFees;
      }
      // If billing address is different, add it to the data
      if (!useSameAddress) {
        data.billingAddress = {
          address: formData.billingAddress || '',
          city: formData.billingCity || '',
          province: formData.billingProvince || '',
          postalCode: formData.billingPostalCode || '',
          country: formData.billingCountry || 'CA',
        };
      }
      try {
        // First check if we have a token
        let token = tokenStorage.getToken();
        if (tokenStorage.isTokenExpired()) {
          console.log('Token expired or missing, requesting new token...');
          token = await getMsToken();
          tokenStorage.setToken(token);
          console.log('New token stored successfully');
        } else {
          console.log('Using existing token');
        }
        submitOverlay.step('Processing your registration…', 'This can take up to a minute. Please do not close or refresh this page.');
        const endpoint = 'thesissitecorexm.api/registration/';
        const params = new URLSearchParams();
        params.append('endpoint', endpoint);
        const proxyUrl = `${this.proxyBaseUrl}?${params.toString()}`;
        console.log('Request payload:', data);
        // Save the payload in the sessionStorage for reference
        sessionStorage.setItem('bvcUser', JSON.stringify(data));
        const payload = JSON.stringify(data);
        console.log('Stringified payload:', payload);
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json-patch+json',
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        });
        if (response.status === 401) {
          // Handle unauthorized specifically
          throw new Error('Your session has expired. Please log in again.');
        }
        if (!response.ok) {
          throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        const regId = JSON.stringify(result);
        console.log('Registration successful:', regId);
        let registrationId = result.newRegistration['id'];
        console.log('Registration ID:', registrationId);
        await this.submitPayment(registrationId);
      } catch (error) {
        console.error('Registration error:', error);
        // The overlay blocks the page, so every failure path MUST take it down —
        // otherwise a failed registration leaves the shopper staring at a spinner
        // that never resolves. This branch used to swallow the error entirely
        // (the alerts below it were commented out), which was survivable only
        // because nothing was covering the page.
        this.submitting = false;
        submitOverlay.hide();
        this.showErrorMessage(
          error.message && (error.message.includes('token is missing') || error.message.includes('session has expired'))
            ? error.message
            : 'Registration failed: ' + (error.message || 'please try again, or contact us if this keeps happening.')
        );
      }
    }

    async submitPayment(registrationId) {
      try {
        let token = tokenStorage.getToken();
        if (tokenStorage.isTokenExpired()) {
          token = await getMsToken();
          tokenStorage.setToken(token);
        }

        const endpointPayment = 'thesissitecorexm.api/payment/submit-payment';

        // Load all cart items (up to 5 allowed)
        const storedCart = sessionStorage.getItem('cartItems');
        const cartItems = storedCart ? JSON.parse(storedCart) : [];

        // Calculate totalAmount = course tuition + cart-level fees.
        // Fees are stored at the cart/session level (feeSession), NOT per item,
        // so sum tuition here and add the session fee total (amount + tax) below.
        let totalAmount = 0;
        let tuitionTax = 0;
        cartItems.forEach((item) => {
          const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0;
          const quantity = item.quantity || 1;
          totalAmount += price * quantity;
          tuitionTax += (parseFloat(item.tax) || 0) * quantity;
        });
        totalAmount += tuitionTax;

        const feeTotals = this.getSessionFeeTotals();
        totalAmount += feeTotals.amount + feeTotals.tax;
        console.log('Payment total breakdown:', {
          tuition: (totalAmount - tuitionTax - feeTotals.amount - feeTotals.tax).toFixed(2),
          tuitionTax: tuitionTax.toFixed(2),
          fees: feeTotals.amount.toFixed(2),
          feeTax: feeTotals.tax.toFixed(2),
          total: totalAmount.toFixed(2),
        });

        // Use all course IDs/SKUs (no limit)
        const courseIds = cartItems.map((item) => item.id || item.sku).filter(Boolean);
        const coursesInCartString = courseIds.join(',');

        if (!coursesInCartString || !registrationId) {
          throw new Error('Missing course ID(s) or registration ID.');
        }

        // Construct final URL
        const params = new URLSearchParams();
        params.append('endpoint', endpointPayment);
        params.append('coursesInCart', coursesInCartString);
        params.append('totalAmount', totalAmount.toFixed(2));
        params.append('registrationId', registrationId);
        params.append('studentPk', studentPk);

        submitOverlay.step('Preparing your payment…', 'Almost there — please do not close or refresh this page.');
        const payUrl = `${this.proxyBaseUrl}?${params.toString()}`;
        console.log('Submitting payment to:', payUrl);

        const response = await fetch(payUrl, {
          method: 'POST',
          headers: {
            Accept: 'text/plain',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Payment response:', data);

        if (data.result && data.result.paymentUrl) {
          sessionStorage.setItem('bvcPayment', data.result.paymentUrl);
          document.dispatchEvent(new CustomEvent('bvc:checkout-complete', { detail: { registrationId: registrationId } }));
          submitOverlay.step('Redirecting to the payment page…', 'Please do not close or refresh this page.');
          window.location.href = '../payment-page';
        } else {
          throw new Error('Payment URL not found in response.');
        }
      } catch (error) {
        console.error('Payment submission error:', error);
        this.submitting = false;
        submitOverlay.hide();
        this.showErrorMessage(`Payment submission failed: ${error.message}`);
      }
    }

    collectFormData() {
      // Collect form data from fields
      const formData = {};

      // Personal information (Option B — richer fields sourced from the form)
      formData.firstName = this.fields.firstName ? this.fields.firstName.value : '';
      formData.middleName = this.fields.middleName ? this.fields.middleName.value : '';
      formData.lastName = this.fields.lastName ? this.fields.lastName.value : '';
      formData.previousLastName = this.fields.previousLastName ? this.fields.previousLastName.value : '';
      formData.email = this.fields.email ? this.fields.email.value : '';
      formData.phone = this.fields.phone ? this.fields.phone.value : ''; // combined +1XXXXXXXXXX
      formData.birthDate = this.fields.birthDate ? this.fields.birthDate.value : '';
      formData.gender = this.fields.gender ? this.fields.gender.value : '';
      formData.firstLanguage = this.fields.firstLanguage ? this.fields.firstLanguage.value : '';
      formData.citizenshipStatus = this.fields.citizenshipStatus ? this.fields.citizenshipStatus.value : '';
      formData.indigenousStatus = this.fields.indigenousStatus ? this.fields.indigenousStatus.value : '';
      formData.countryOfCitizenship = this.fields.countryOfCitizenship ? this.fields.countryOfCitizenship.value : '';
      formData.asn = this.fields.asn ? this.fields.asn.value : '';

      // Mailing information
      formData.address = this.fields.address ? this.fields.address.value : '';
      formData.city = this.fields.city ? this.fields.city.value : '';
      formData.province = this.fields.province ? this.fields.province.value : '';
      formData.postalCode = this.fields.postalCode ? this.fields.postalCode.value : '';
      formData.country = this.fields.country ? this.fields.country.value : '';

      // Billing information (if needed)
      formData.billingAddress = this.fields.billingAddress ? this.fields.billingAddress.value : '';
      formData.billingCity = this.fields.billingCity ? this.fields.billingCity.value : '';
      formData.billingProvince = this.fields.billingProvince ? this.fields.billingProvince.value : '';
      formData.billingPostalCode = this.fields.billingPostalCode ? this.fields.billingPostalCode.value : '';
      formData.billingCountry = this.fields.billingCountry ? this.fields.billingCountry.value : '';

      return formData;
    }

    formatDate(dateString) {
      // Try to convert to ISO format
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (e) {
        console.error('Date formatting error:', e);
      }
      // Return original if conversion fails
      return dateString;
    }

    showConfirmationMessage() {
      // Create a confirmation message element
      const confirmationElement = document.createElement('div');
      confirmationElement.className = 'confirmation-message';
      confirmationElement.style.backgroundColor = '#dff0d8';
      confirmationElement.style.color = '#3c763d';
      confirmationElement.style.padding = '15px';
      confirmationElement.style.borderRadius = '4px';
      confirmationElement.style.marginTop = '20px';
      confirmationElement.innerHTML = `
            <h3>Registration Successful!</h3>
            <p>Thank you for your registration. Your courses have been added to your profile.</p>
            <p>You will receive a confirmation email shortly.</p>
            <p>Redirecting to payment page...</p>
        `;
      // Replace form with confirmation
      if (this.form) {
        this.form.innerHTML = '';
        this.form.appendChild(confirmationElement);
      }
      // Scroll to top
      window.scrollTo(0, 0);
      // Simulate redirect after a delay
      setTimeout(() => {
        // In a real implementation, this would redirect to the payment page
        console.log('Redirecting to payment page...');
      }, 3000);
    }

    showErrorMessage(message) {
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.style.backgroundColor = '#f2dede';
      errorElement.style.color = '#a94442';
      errorElement.style.padding = '15px';
      errorElement.style.borderRadius = '4px';
      errorElement.style.marginBottom = '20px';
      errorElement.innerHTML = `
            <h3>Registration Error</h3>
            <p>${message || 'There was an error processing your registration. Please try again.'}</p>
        `;
      // Insert at the top of the form
      if (this.form) {
        this.form.insertBefore(errorElement, this.form.firstChild);
        // Scroll to error
        errorElement.scrollIntoView({ behavior: 'smooth' });
      }

      // Remove after 5 seconds
      setTimeout(() => {
        if (errorElement.parentNode) {
          errorElement.parentNode.removeChild(errorElement);
        }
      }, 5000);
    }
  }

  // DOM fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    const queryParams = new URLSearchParams(window.location.search);
    const type = queryParams.get('type');
    // These scaffold elements are optional (the checkout-cart form does not
    // include them and manages ASN visibility itself). Guard every access so
    // a missing element can never throw and abort the handler.
    const show = (id, display) => {
      const el = document.getElementById(id);
      if (el) el.style.display = display;
    };
    if (type === 'os') {
      show('openStudiesFields', 'block');
      show('os-hide', 'none');
      // Disable regular ASN field (if it exists)
      const regularAsn = document.getElementById('asn');
      if (regularAsn) {
        regularAsn.disabled = true;
        regularAsn.style.display = 'none';
      }
    } else {
      // Legacy page only: it ships BOTH ASN inputs, so the Open Studies one is
      // switched off when the other is in play. The checkout-cart form ships
      // #asn-os alone and decides its own visibility from the cart's credits
      // (a mixed EE + OS cart is ?type=ee yet still needs the ASN), so leave a
      // lone #asn-os enabled.
      const openStudiesAsn = document.getElementById('asn-os');
      if (openStudiesAsn && document.getElementById('asn')) {
        openStudiesAsn.disabled = true;
        openStudiesAsn.style.display = 'none';
      }
    }
    show('email-form', 'block');
    const formHandler = new CheckoutFormHandler();
    formHandler.createErrorElements();
  });
})();
