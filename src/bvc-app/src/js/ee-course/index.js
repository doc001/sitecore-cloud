/**
 * EE-Course (Extended Education) cart experience — SOURCE
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE. Do not edit public/js/ee-course.js (it is generated).
 *
 *   Build : npm run js:build      (esbuild -> public/js/ee-course.js)
 *   Watch : npm run js:watch      (rebuild on save)
 *
 * Loaded from Webflow (Extended Education course pages) via:
 *   <script src="https://bvc-app.vercel.app/js/ee-course.js" defer></script>
 *
 * Mirrors the Open Studies cart (same data shape, same thesissitecorexm.api
 * availability + fee endpoints) but reads /data/courses/ and sends shoppers to
 * the Extended Ed checkout (?type=ee, no ASN).
 *
 * Endpoints/config are overridable. Set BEFORE this script loads:
 *   window.__EE_COURSE_CONFIG__ = { dataOrigin: "", apiOrigin: "", feeApplicantId: 1 };
 * Defaults (production):
 *   dataOrigin     : https://bvc-app.vercel.app        (this app /data/*)
 *   apiOrigin      : https://bvc-api-proxy.vercel.app (mstoken, bvcpayment)
 *   feeApplicantId : ''  (empty studentNo segment in fee/{skus}/{studentNo}; backend expects it)
 * ---------------------------------------------------------------------------
 */
import { fetchCartFees, feesForSku } from '../shared/fees.js';
import { validateCart, readValidation, isConflict } from '../shared/validation.js';

(function () {
  'use strict';
  if (window.__bvcEeCourseLoaded) {
    console.warn('[EE-Course] Already initialised — skipping duplicate load.');
  } else {
    window.__bvcEeCourseLoaded = true;
    console.log('[EE-Course] Script loaded');
    var _cfg = (typeof window !== 'undefined' && window.__EE_COURSE_CONFIG__) || {},
      dataOrigin = _cfg.dataOrigin != null ? _cfg.dataOrigin : 'https://bvc-app.vercel.app',
      apiOrigin = _cfg.apiOrigin != null ? _cfg.apiOrigin : 'https://bvc-api-proxy.vercel.app',
      // Fee endpoint is `fee/{skus}/{studentNo}` where {studentNo} must be EMPTY for an
      // anonymous fee preview — the URL ends in a trailing slash (`fee/2595/`). Verified
      // 2026-07-28: empty → 200 with fee data; the literal string 'null' now 404s. The
      // value does not change the returned fee amounts. Override per env (e.g. a real
      // applicant id) via window.__EE_COURSE_CONFIG__ = { feeApplicantId: <id> }. See OS-COURSE-CART.md.
      feeId = _cfg.feeApplicantId != null ? _cfg.feeApplicantId : '',
      // `thesissitecorexm.api/validation` is the only trustworthy availability check.
      // courseofferings reports seats for sections the SiS considers full — it catches
      // 5 of 42, and PSYC1101-50 is bookable on the live site today (docs/sis-api.md).
      // Validating the course being added ON ITS OWN cannot trip the conflict defect
      // below, so it runs on every add. Disable entirely with
      //   window.__EE_COURSE_CONFIG__ = { validateOnAdd: false }
      validateOnAdd = _cfg.validateOnAdd !== false,
      // Opt-in: also send the current cart, letting the API report a clash BETWEEN
      // items — the one thing courseofferings can never see. OFF by default because as
      // of 2026-08-17 UAT returns `Timeblock Conflict` for EVERY pair, including
      // courses that meet on different days, which would refuse every second add.
      // Turn on once that is fixed upstream:
      //   window.__EE_COURSE_CONFIG__ = { validateConflicts: true }
      validateConflicts = true === _cfg.validateConflicts,
      tokenStorage = window.tokenStorage || {
        key: 'bvcToken',
        setToken: function (token) {
          sessionStorage.setItem(this.key, JSON.stringify({ token: token, timestamp: Date.now() }));
        },
        isTokenExpired: function () {
          try {
            var stored = JSON.parse(sessionStorage.getItem(this.key));
            return !(stored && stored.token && stored.timestamp) || Date.now() - stored.timestamp > 36e5;
          } catch (error) {
            return true;
          }
        },
        getToken: function () {
          try {
            var stored = JSON.parse(sessionStorage.getItem(this.key));
            return (stored && stored.token) || null;
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
        var response = await fetch(apiOrigin + '/api/mstoken', { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        if (!response.ok) throw new Error('Token request failed with status: ' + response.status);
        var data = await response.json();
        if (!data.access_token) throw new Error('No access token in response');
        return data.access_token;
      };
    window.getMsToken = getMsToken;
    var inFlightTokenPromise = null,
      guidLookup = { '1AE082FF1070438CBAA776B245B6F75D': 'Any-time Online', C38BDD5C70E34955AD170B6C6A1EC5E8: 'AudioVideo Based Instruction', '481341DF9A144AC8A315112B97377EC9': 'Blended', '0102087B8DAB4E96B64F49185C0B1FF8': 'Blended Asynchronous', '914480483DE14389ABD9EE4F1D28589E': 'Blended Self-Paced', C45FFE750A404E30A906FC3C6FDD99FC: 'Blended Synchronous', '6BF78E16E03F462FAEE8F223086CFB35': 'Blended Synchronous Asynchronous', '5969AC19010546B5B9834F6F8D2F3B29': 'BVC Online', '2E7F9F03DDB84D6BB91FDC2D4464372A': 'Challenge', '6F3515869E4C4C5599F470A7A58B13F0': 'Combined Online', C5BAA31D7BC0449890F790E897A92261: 'Computer Assisted Instruction', '2B0F27FC3A764DBB941F2644DB71B7D6': 'Correspondence Based Instruction', E27E365D5A3341629CFDB4DB6DE64FCA: 'Distributed Learning ecampus 2', '467A978F3823421BBDF788D21BC7B09C': 'ECampus Alberta - online learning', B146327974D348BD8306F957AE47CECD: 'eCampusAlberta Online', EE331EC390BC4D329910C5911DF970A7: 'Face to Face Self-Paced', '939C8DACA6C1415EBC831B3F062D4250': 'Face to Face Synchronous', '8317C7933CC449C2984E7F1CCD6FF5B8': 'Flexclass', F8EBCF8BF2D147AA9F76522DCBEDFA75: 'Home Study', '9754E29DF0754139B125292A81550174': 'Hyflex', E9F804275D3C4B61A685F63DF5134F14: 'In Class', '8AFAF1DADDEF4B71AC14DA272E952D0A': 'Micro-Credential Assessment', '5D448378DA984E9986E737C02BEA8F46': 'Mixed', C570FE50B9824FD6906B571CDE435CF3: 'Off-Site', EC1C42ED10C54C1995A9F2CFEAC79CD9: 'Online Asynchronous', '9FA504584ED84FABB0748D043A306BC3': 'Online Self-Paced', '71159BEB070D42C981D9758B3108A0CD': 'Online Synchronous', F6250694BAD64615BCB91693A45D76C5: 'Online Synchronous Asynchronous', '40817BFE87E1432EB3E68929DF8C9965': 'Real-time Online', '60C2E33F37514B7E884D1BEFB7155785': 'Teleconferencing / Videoconferencing', '63ADFB9EB3484A00BD66C043F43DEBE4': 'Traditional and Self Paced', '05A8F1DF96624B67A7F9DC22C32B4A5F': 'Work Experience', '00D83EDBF5B642ADA6493FBFE3EC116A': 'Airdrie', '481D28AD75CA4F12B5B10C078AA05F35': 'Banff', '0B44F9AE85B9426F9A3876762BBA5B5A': 'Calgary', '8005CA67F70B43C2BBB5004FF89FA4E1': 'Calgary Downtown Campus', A9B98CE5F1D5460F8812E36A93FDF320: 'Cochrane', '82E8438804E84947BAAF251119943A6A': 'Distance Learning', '5AA49765063A4B0BB623C0404A92406A': 'High River', '2B4E485287444409AA1E828DA53BFC0C': 'Okotoks', D8ECBBFE90E944FA8526B7A90ED56FC5: 'Online', D532C4A03C6C42E99C3C5569D3B7F59F: 'Regional', '05A9B93BC41A4F5CBE72FC9B97548AFF': 'Rural', A7B3BDCF1E404C32890EF853D2DCFDF2: 'Strathmore', FBE851B811DA49F0A8795BD188113BDB: 'Three Gorges Medical College', AF5967FBE4D446E3BA1212EFEE54B86C: 'Three Hills', '1B561481FF05406A897B1FEB28F98004': 'Yukon' },
      // Day codes as Sitecore actually emits them. Every one of the 14 distinct
      // tokens in the catalogue uses ONE scheme — Su M T W Th F Sa — verified
      // 2026-09-02 across all 100 EE + OS course files. Note what is NOT here:
      // no `R` for Thursday, no bare `S` for Saturday, no `U` for Sunday. The old
      // map was built for that other (registrar) scheme and keyed whole tokens
      // against single letters, so only 'M', 'T', 'W' and 'F' ever matched —
      // 'Th', 'Sa', 'MW', 'TTh', 'FSa', 'ThF' and the rest fell through and were
      // printed raw. That is why the page showed "Mondays" on one row and "TTh"
      // on the next.
      //
      // `R`/`S`/`U` are still accepted below as a defensive fallback in case
      // upstream ever switches schemes; they cost nothing and cannot collide with
      // today's data, because two-character codes are matched FIRST and matching
      // is case-sensitive. The one genuine ambiguity is an upper-cased 'SU': it
      // does not equal 'Su', so it parses as S + U — Saturdays, Sundays. No
      // parser can resolve that without knowing the scheme, and upstream emits
      // 'Su'; noted so a future reader is not surprised by it.
      dayCodeMap = { Su: 'Sundays', M: 'Mondays', T: 'Tuesdays', W: 'Wednesdays', Th: 'Thursdays', F: 'Fridays', Sa: 'Saturdays', Tu: 'Tuesdays', R: 'Thursdays', S: 'Saturdays', U: 'Sundays' },
      // Longest-first, so 'Th' is consumed before 'T' and 'Sa'/'Su' before 'S'.
      dayCodeTokens = ['Su', 'Sa', 'Th', 'Tu', 'M', 'T', 'W', 'R', 'F', 'S', 'U'],
      // The whole week paired with a zero-length midnight window is Sitecore's
      // placeholder for "there is no scheduled meeting time" — 100 occurrences,
      // and the ONLY thing that window is ever paired with. Rendered literally it
      // claims the class meets every day at midnight.
      NO_MEETING_TIME = 'Self-paced — study any time';
    window.toggleAccordion = function (accordionId) {
      var content = document.getElementById('accordion-' + accordionId);
      if (content) {
        var toggleButton = content.previousElementSibling;
        if (content.classList.contains('open')) {
          content.classList.remove('open');
          toggleButton.classList.remove('active');
        } else {
          document.querySelectorAll('.accordion-content.open').forEach(function (openContent) {
            openContent.classList.remove('open');
            openContent.previousElementSibling.classList.remove('active');
          });
          content.classList.add('open');
          toggleButton.classList.add('active');
        }
      }
    };
    var sessionManager = {
        mainSessionKey: 'cartSession',
        feeSessionKey: 'feeSession',
        init: function () {
          if (!sessionStorage.getItem(this.mainSessionKey)) {
            sessionStorage.setItem(this.mainSessionKey, JSON.stringify({ active: true, createdAt: new Date().toISOString() }));
          }
        },
        createFeeSession: function (feeData) {
          var feeSession = { active: true, createdAt: new Date().toISOString(), feeData: feeData, relatedTo: this.mainSessionKey };
          sessionStorage.setItem(this.feeSessionKey, JSON.stringify(feeSession));
          return feeSession;
        },
        hasFeeSession: function () {
          return null !== sessionStorage.getItem(this.feeSessionKey);
        },
        clearFeeSession: function () {
          sessionStorage.removeItem(this.feeSessionKey);
        },
        clearAllSessions: function () {
          sessionStorage.removeItem(this.mainSessionKey);
          sessionStorage.removeItem(this.feeSessionKey);
        },
      },
      cart = {
        items: [],
        maxItems: 6,
        sessionKey: 'cartItems',
        bvcCourseIdKey: 'bvcCourseId',
        init: function () {
          this.loadFromSession();
          this.updateAddedButtonStates();
          this.updateCartCounter();
          this.updateBvcCourseId();
          sessionStorage.setItem('totalCredits', this.getTotalCredits().toString());
        },
        loadFromSession: function () {
          var stored = sessionStorage.getItem(this.sessionKey);
          if (stored)
            try {
              this.items = JSON.parse(stored);
            } catch (error) {
              console.error('Error loading cart:', error);
              this.items = [];
            }
        },
        saveToSession: function () {
          try {
            sessionStorage.setItem(this.sessionKey, JSON.stringify(this.items));
            this.updateBvcCourseId();
            sessionStorage.setItem('totalCredits', this.getTotalCredits().toString());
          } catch (error) {
            console.error('Error saving cart:', error);
          }
        },
        updateBvcCourseId: function () {
          try {
            var payload = {
              coursesInCart: this.items.map(function (item) {
                return Number(item.sku);
              }),
              totalAmount: this.getTotal().toFixed(2),
              fees: this.items.reduce(function (accumulator, item) {
                if (item.fees) accumulator[item.sku] = { feeData: item.fees, summary: item.feeSummary };
                return accumulator;
              }, {}),
            };
            sessionStorage.setItem(this.bvcCourseIdKey, JSON.stringify(payload));
          } catch (error) {
            console.error('Error updating bvcCourseId:', error);
          }
        },
        addItem: function (item) {
          return (
            !this.items.some(function (existing) {
              return existing.sku === item.sku;
            }) &&
            !(this.items.length >= this.maxItems) &&
            (this.items.push(item), this.items.length > 1 && sessionManager.hasFeeSession() && sessionManager.clearFeeSession(), this.saveToSession(), this.updateCartCounter(), true)
          );
        },
        removeItem: function (sku) {
          var previousCount = this.items.length;
          return (
            (this.items = this.items.filter(function (item) {
              return item.sku !== sku;
            })),
            // Removing an item can only ever resolve a conflict, so drop every
            // conflict block and let the next add re-derive them against the new cart.
            conflictStore.clear(),
            this.items.length < previousCount && (this.saveToSession(), this.updateAddedButtonStates(), this.updateCartCounter(), true)
          );
        },
        getTotalCredits: function () {
          return this.items.reduce(function (total, item) {
            return total + (parseInt(item.credits) || 0);
          }, 0);
        },
        getTotal: function () {
          var total = 0;
          this.items.forEach(function (item) {
            total += (parseFloat(item.price) || 0) * (item.quantity || 1);
            if (item.feeSummary && item.feeSummary.totalAmount) total += parseFloat(item.feeSummary.totalAmount) || 0;
          });
          return total;
        },
        isInCart: function (sku) {
          return this.items.some(function (item) {
            return item.sku === sku;
          });
        },
        isCartFull: function () {
          return this.items.length >= this.maxItems;
        },
        updateAddedButtonStates: function () {
          var cartFull = this.isCartFull(),
            self = this;
          document.querySelectorAll('.addtocartbutton').forEach(function (button) {
            var productId = button.getAttribute('data-product-id'),
              inCart = self.isInCart(productId),
              unavailable = button.classList.contains('unavailable');
            if (inCart) {
              button.classList.add('in-cart');
              button.setAttribute('aria-disabled', 'true');
              button.title = 'Already in cart';
              button.textContent = LABEL.inCart;
            } else if (!unavailable) {
              button.classList.remove('in-cart');
              button.removeAttribute('aria-disabled');
              button.title = cartFull ? 'Cart is full (max 6)' : '';
              button.textContent = LABEL.add;
              button.classList.toggle('in-cart', cartFull);
            }
          });
        },
        updateCartCounter: function () {
          var counter = document.getElementById('cartProducts');
          if (counter) {
            counter.textContent = this.items.length.toString();
            counter.style.display = this.items.length > 0 ? 'inline-block' : 'none';
          }
        },
      },
      cartDom = {
        cart: null,
        overlay: null,
        closeButton: null,
        cartItemsContainer: null,
        totalAmount: null,
        cartMessage: null,
        init: function () {
          this.cart = document.querySelector('.sliding-cart');
          this.overlay = document.querySelector('.cart-overlay');
          this.closeButton = document.querySelector('.cart-close');
          this.cartItemsContainer = document.querySelector('.cart-items');
          this.totalAmount = document.querySelector('.total-amount');
          this.cartMessage = document.querySelector('.cart-message');
        },
      },
      // Every user-facing string in one place, so the toast, the button `title`
      // and the in-cart warning cannot drift apart — they had, in wording,
      // punctuation and vocabulary ("date" / "offering" / "item" / "product" for
      // the same thing). Convention: full sentences, terminal period, and ONE noun
      // per concept — "this date" for the accordion the shopper opened (it is
      // labelled with a date range; "offering" and "section" are internal words),
      // "course" for a row in the cart. Verdict copy from the API follows the same
      // rules in ../shared/validation.js.
      MSG = {
        cartFull: 'Your cart is full (maximum 6 courses).',
        unavailable: 'This date is no longer available.',
        noSeats: 'No seats are available for this date.',
        alreadyInCart: 'This course is already in your cart.',
        added: 'Added to your cart.',
        addedNoFees: 'Added to your cart, but fees could not be calculated. Checkout is unavailable.',
        removed: 'Removed from your cart.',
        removedNoFees: 'Removed from your cart, but fees could not be recalculated. Checkout is unavailable.',
        cartEmptied: 'Your cart is now empty.',
        cartEmpty: 'Your cart is empty.',
        removeFailed: 'That course could not be removed. Please try again.',
        // Shown instead of a raw exception string. `error.message` was going
        // straight to the shopper — "Failed to fetch", "Failed to check course
        // availability (status 502)" — which is noise to them and detail to
        // anyone else. The real error still goes to the console.
        unexpected: 'Something went wrong. Please try again.',
        // In-cart fee error. Same sentence shape as addedNoFees rather than the
        // em-dash variant it used to carry.
        feeError: 'Additional fees could not be calculated. Checkout is unavailable.',
      },
      // Button labels. Here too, not inline: each appears in three or four places
      // and has to agree with the `title` set alongside it.
      LABEL = {
        add: 'Add',
        inCart: 'In cart',
        checking: 'Checking…',
        unavailable: 'Unavailable',
      },
      showNotification = function (message, type) {
        var notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(function () {
          notification.remove();
        }, 3e3);
      },
      // A busy indicator that OUTLIVES the click. showNotification expires on a
      // 3 s timer, which is useless for a call whose median is 10.9 s; and the
      // button alone cannot be relied on — it can be scrolled out of view, and a
      // successful add slides the cart and its overlay over the top of it. This
      // stays up for exactly as long as the work does.
      busyToast = {
        el: null,
        show: function (message) {
          if (!this.el) {
            this.el = document.createElement('div');
            this.el.className = 'bvc-busy-toast';
            this.el.setAttribute('role', 'status');
            this.el.setAttribute('aria-live', 'polite');
            this.el.innerHTML = '<span class="bvc-btn-spinner" aria-hidden="true"></span><span class="bvc-busy-text"></span>';
            document.body.appendChild(this.el);
          }
          this.el.querySelector('.bvc-busy-text').textContent = message;
        },
        hide: function () {
          if (this.el) {
            this.el.remove();
            this.el = null;
          }
        },
      },
      unavailableStore = {
        sessionKey: 'unavailableCourses',
        init: function () {
          if (!sessionStorage.getItem(this.sessionKey)) sessionStorage.setItem(this.sessionKey, JSON.stringify([]));
        },
        markAsUnavailable: function (sku) {
          var unavailableSkus = this.get();
          if (-1 === unavailableSkus.indexOf(sku)) {
            unavailableSkus.push(sku);
            sessionStorage.setItem(this.sessionKey, JSON.stringify(unavailableSkus));
          }
        },
        isUnavailable: function (sku) {
          return -1 !== this.get().indexOf(sku);
        },
        get: function () {
          return JSON.parse(sessionStorage.getItem(this.sessionKey) || '[]');
        },
      },
      // Deliberately NOT sessionStorage, unlike unavailableStore. A conflict is a
      // relationship with what is currently in the cart, not a property of the
      // offering — remove the other course and it is addable again. Persisting it
      // would leave the button dead for the rest of the session.
      conflictStore = {
        skus: [],
        mark: function (sku) {
          if (-1 === this.skus.indexOf(sku)) this.skus.push(sku);
        },
        isConflicted: function (sku) {
          return -1 !== this.skus.indexOf(sku);
        },
        clear: function () {
          var cleared = this.skus;
          this.skus = [];
          // Re-enable only what this store blocked; anything in unavailableStore
          // (no seats / 404) stays blocked on its own merits.
          cleared.forEach(function (sku) {
            if (unavailableStore.isUnavailable(sku)) return;
            document.querySelectorAll('.addtocartbutton[data-product-id="' + sku + '"]').forEach(function (button) {
              button.classList.remove('unavailable');
              button.removeAttribute('aria-disabled');
              button.title = '';
              button.textContent = LABEL.add;
            });
          });
        },
      };
    getValidToken().catch(function () {});
    if ('loading' === document.readyState) document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  function getValidToken(forceRefresh) {
    if (!forceRefresh) {
      var cachedToken = tokenStorage.getToken();
      if (cachedToken && !tokenStorage.isTokenExpired()) return Promise.resolve(cachedToken);
    }
    (inFlightTokenPromise && !forceRefresh) ||
      (inFlightTokenPromise = getMsToken()
        .then(function (token) {
          tokenStorage.setToken(token);
          console.log('[Token] Stored in browser memory (sessionStorage).');
          inFlightTokenPromise = null;
          return token;
        })
        .catch(function (error) {
          inFlightTokenPromise = null;
          console.error('[Token] Failed to obtain token:', error);
          throw error;
        }));
    return inFlightTokenPromise;
  }
  function resolveGuid(guid) {
    if (!guid) return 'N/A';
    var normalized = guid.replace(/[{}\-]/g, '').toUpperCase();
    return guidLookup[normalized] || guid;
  }
  function formatDate(yyyymmdd) {
    if (!yyyymmdd) return '';
    var year = yyyymmdd.substring(0, 4),
      month = yyyymmdd.substring(4, 6),
      day = yyyymmdd.substring(6, 8);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  /**
   * Expand a Sitecore day code into full day names.
   *
   * Greedy longest-match: 'MTWThF' -> M, T, W, Th, F. Returns null when the token
   * cannot be fully consumed, so callers can fall back to printing it verbatim —
   * showing an unrecognised code is bad, but inventing days is worse.
   */
  function expandDayCode(code) {
    var remaining = String(code || ''),
      names = [];
    while (remaining.length) {
      for (var index = 0, matched = false; index < dayCodeTokens.length; index++) {
        var token = dayCodeTokens[index];
        if (0 === remaining.indexOf(token)) {
          names.push(dayCodeMap[token]);
          remaining = remaining.slice(token.length);
          matched = true;
          break;
        }
      }
      if (!matched) return null;
    }
    return names.length ? names : null;
  }
  /**
   * Normalise one `schedule` string ("MW 3:30 PM - 4:50 PM") into what the page
   * should print. Returns { day, hours }; an empty `hours` means there is no
   * meeting time to show and callers must not render a time alongside it.
   */
  function parseSchedule(schedule) {
    if (!schedule) return { day: '', hours: '' };
    var parts = String(schedule).trim().split(/\s+/),
      code = parts[0],
      hours = parts.slice(1).join(' '),
      names = expandDayCode(code);
    // Placeholder: the full week AND a zero-length midnight window. Both are
    // required — all seven days with real hours would be a genuine schedule.
    if (names && 7 === names.length && /^12:00\s*AM\s*-\s*12:00\s*AM$/i.test(hours)) return { day: NO_MEETING_TIME, hours: '' };
    return { day: names ? names.join(', ') : code, hours: hours };
  }
  /**
   * The timeblocks worth printing, parsed, deduped and de-contradicted.
   *
   * Sitecore hands back two kinds of noise. Sections repeat an identical block —
   * 'FSa 8:00 AM - 4:50 PM' twice on the same section — which rendered as the same
   * line printed twice. And 18 sections (11 EE, 7 OS) carry the all-week midnight
   * placeholder ALONGSIDE real meeting times, which reads as a section that both
   * has no set time and meets on Fridays. Where a real block exists it is the
   * truth, so the placeholder is dropped; where it is alone it is the only thing
   * there is to say.
   */
  function scheduleBlocks(section) {
    var parsedBlocks = (section.timeBlocks || []).map(function (timeBlock) {
        return parseSchedule(timeBlock.schedule);
      }),
      seen = {},
      unique = parsedBlocks.filter(function (block) {
        if (!block.day) return false;
        var key = block.day + '|' + block.hours;
        return !seen[key] && (seen[key] = true);
      }),
      hasRealBlock = unique.some(function (block) {
        return !!block.hours;
      });
    return hasRealBlock
      ? unique.filter(function (block) {
          return !!block.hours;
        })
      : unique;
  }
  function renderSchedule(section) {
    var blocks = scheduleBlocks(section);
    return blocks.length
      ? '<div class="timeblock-info"><div class="detail-label">Schedule</div><div class="timeblock-details">' +
          blocks
            .map(function (parsed) {
              // No colon and no time element when there are no hours — otherwise
              // the placeholder renders as "Self-paced — study any time:" with a
              // dangling colon over an empty line.
              return parsed.hours
                ? '<div><span class="productdays">' + parsed.day + '</span>:<br/><span class="producthours">' + parsed.hours + '</span></div>'
                : '<div><span class="productdays">' + parsed.day + '</span></div>';
            })
            .join('') +
          '</div></div>'
      : '';
  }
  function renderAccordionItem(section, productName, fallbackCredits) {
    var accordionId = Math.random().toString(36).substr(2, 9),
      dateRange = (function (section) {
        var timeBlocksWithStart = Array.isArray(section.timeBlocks)
          ? section.timeBlocks.filter(function (timeBlock) {
              return timeBlock.startTime;
            })
          : [];
        if (0 === timeBlocksWithStart.length) return { start: section.startDate, end: section.endDate };
        var startTimes = timeBlocksWithStart
            .map(function (timeBlock) {
              return timeBlock.startTime;
            })
            .sort(),
          endTimes = timeBlocksWithStart
            .map(function (timeBlock) {
              return timeBlock.endTime;
            })
            .filter(Boolean)
            .sort();
        return { start: startTimes[0], end: endTimes.length ? endTimes[endTimes.length - 1] : section.endDate };
      })(section),
      formattedStart = formatDate(dateRange.start),
      formattedEnd = formatDate(dateRange.end),
      domesticAmount = (section.fees && section.fees.domestic && section.fees.domestic.amount) || 0,
      domesticTax = (section.fees && section.fees.domestic && section.fees.domestic.tax) || 0,
      domesticPriceDisplay = parseFloat(domesticAmount).toFixed(0),
      internationalAmount = section.fees && section.fees.international && null != section.fees.international.amount ? section.fees.international.amount : null,
      internationalPriceDisplay = null !== internationalAmount ? parseFloat(internationalAmount).toFixed(0) : null,
      // No "Additional fees apply" note here, unlike os-course. The fee API returns
      // an EMPTY set for every Extended Education offering — 12 sections across 12
      // different EE courses, all `[]`, verified 2026-09-02, against 4 fees
      // (Student Association / Services / Technology / Learner Wellness, $225) for
      // every Open Studies section. The note promised a charge that never arrives.
      // The fee call itself is deliberately KEPT on add-to-cart: if EE ever does
      // gain fees, skipping it would silently undercharge, since checkout totals
      // the cart from the session rather than re-asking the API.
      //
      // Only show a second price when there IS a second price. Sitecore populates
      // `international` for nearly every section, but for Extended Education it
      // simply repeats the domestic amount — 83 of 83 sections carrying the field,
      // across all 39 EE courses, verified 2026-09-02 — so the page was printing
      // "$120 Domestic Student / $120 International Student" and inviting the
      // reader to find a difference that is not there. Open Studies genuinely
      // differs on all 221 of its sections (e.g. 646 vs 1678), so the same rule
      // keeps it. Compared as the rendered strings, which is what the shopper
      // actually sees — equal after rounding is equal on the page.
      hasDistinctInternationalPrice = null !== internationalPriceDisplay && internationalPriceDisplay !== domesticPriceDisplay,
      deliveryTypeName = resolveGuid(section.deliveryType),
      campusName = resolveGuid(section.campus),
      scheduleHtml = renderSchedule(section),
      // Credits are shown only when the section HAS credits. Extended Education
      // carries `credits: 0` on all 126 of its sections (Open Studies is 3/4/6),
      // so the page and the cart were both printing a literal "Credits 0".
      // Data-driven rather than keyed off the bundle: an EE course that ever gains
      // credits shows them, and OS is untouched.
      //
      // `data-product-credits` is deliberately still emitted at 0. Checkout reads
      // it to decide whether the ASN field is required (any cartItems[].credits > 0),
      // and a mixed EE + OS cart depends on the zero being present rather than
      // missing. Hiding the DISPLAY must not change the DATA.
      credits = section.credits || fallbackCredits,
      registrationHtml = section.registrationStart ? '<div class="detail-item"><div class="detail-label">Registration</div><div class="detail-value">' + formatDate(section.registrationStart) + (section.registrationEnd ? ' &ndash; ' + formatDate(section.registrationEnd) : '') + '</div></div>' : '';
    return '<div class="accordion-item-' + accordionId + '"><button class="accordion-toggle" onclick="toggleAccordion(\'' + accordionId + '\')"><div class="date-range"><span class="productdates">' + formattedStart + ' &ndash; ' + formattedEnd + '</span><span class="dropdown-icon">&#9660;</span></div></button><div class="accordion-content" id="accordion-' + accordionId + '"><span class="productlocation" style="display:none;">' + campusName + '</span><div class="course-details"><div class="detail-group">' + (parseFloat(credits) > 0 ? '<div class="detail-item"><div class="detail-label">Credits</div><div class="detail-value">' + credits + '</div></div>' : '') + '<div class="detail-item"><div class="detail-label">Hours</div><div class="detail-value">' + section.hours + '</div></div>' + registrationHtml + scheduleHtml + '</div><div class="price-section"><div class="price-info"><div class="price-display"><span class="currency">$</span><span class="price">' + domesticPriceDisplay + '</span><span class="currency-code">CAD</span></div>' + (hasDistinctInternationalPrice ? '<div class="student-type">Domestic Student</div>' : '') + (domesticTax > 0 ? '<div class="tax-note">+ $' + parseFloat(domesticTax).toFixed(2) + ' tax</div>' : '') + (hasDistinctInternationalPrice ? '<div class="price-display intl" style="margin-top:8px;"><span class="currency">$</span><span class="price">' + internationalPriceDisplay + '</span><span class="currency-code">CAD</span></div><div class="student-type">International Student</div>' : '') + '</div><div class="action-section"><a href="#" data-accordion-id="' + accordionId + '" data-product-name="' + productName + '" data-product-id="' + section.sisId + '" data-product-credits="' + credits + '" data-quantity="1" data-product-price="' + domesticPriceDisplay + '" data-product-tax="' + parseFloat(domesticTax).toFixed(2) + '" data-product-delivery="' + deliveryTypeName + '" class="c-button_cart addtocartbutton w-button" tabindex="0">Add</a></div></div></div></div></div>';
  }
  function renderOfferings(sections, courseName, defaultCredits) {
    var groupedByDeliveryThenCampus = (function (sortedSections) {
        var groups = {};
        sortedSections.forEach(function (section) {
          var deliveryTypeName = resolveGuid(section.deliveryType),
            campusName = resolveGuid(section.campus);
          if (!groups[deliveryTypeName]) groups[deliveryTypeName] = {};
          if (!groups[deliveryTypeName][campusName]) groups[deliveryTypeName][campusName] = [];
          groups[deliveryTypeName][campusName].push(section);
        });
        return groups;
      })(
        sections.slice().sort(function (first, second) {
          var toDate = function (section) {
            return new Date(section.startDate.substring(0, 4), section.startDate.substring(4, 6) - 1, section.startDate.substring(6, 8));
          };
          return toDate(first) - toDate(second);
        }),
      ),
      html = '';
    Object.keys(groupedByDeliveryThenCampus).forEach(function (deliveryTypeName) {
      html += '<div class="course-offering"><h3 class="offering-title">' + deliveryTypeName + '</h3>';
      var byCampus = groupedByDeliveryThenCampus[deliveryTypeName];
      Object.keys(byCampus).forEach(function (campusName) {
        html +=
          '<div class="offering-location"><h4 class="location-title">' +
          campusName +
          '</h4><div class="date-label">START / END DATE</div>' +
          byCampus[campusName]
            .map(function (section) {
              return renderAccordionItem(section, courseName, section.credits || defaultCredits);
            })
            .join('') +
          '</div>';
      });
      html += '</div>';
    });
    return html;
  }
  function openCart() {
    cartDom.cart.classList.add('open');
    cartDom.overlay.classList.add('open');
    if (cart.isCartFull()) {
      cartDom.cartMessage.textContent = MSG.cartFull;
      cartDom.cartMessage.classList.add('visible');
    } else {
      cartDom.cartMessage.classList.remove('visible');
    }
  }
  function closeCart() {
    cartDom.cart.classList.remove('open');
    cartDom.overlay.classList.remove('open');
  }
  function renderCart(feesLoading) {
    var fragment = document.createDocumentFragment();
    cart.items.forEach(function (item) {
      var itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      var scheduleHtml =
        item.timeblocks && item.timeblocks.length > 0
          ? '<div class="cart-item-info"><span style="font-weight:600;">Schedule:</span></div>' +
            item.timeblocks
              .map(function (block) {
                // Same rule as the accordion: no colon, no time, when the
                // section has no meeting time to state.
                return '<div class="cart-item-info" style="padding-left:20px;">• ' + block.day + (block.hours ? ': ' + block.hours : '') + '</div>';
              })
              .join('')
          : '<div class="cart-item-info"><span style="font-weight:600;">Days:</span> ' + (item.productdays || 'Not specified') + '</div>' +
            // "Hours: Not specified" underneath "Self-paced — study any time" is
            // noise: the line above has already answered the question.
            (item.producthours ? '<div class="cart-item-info"><span style="font-weight:600;">Hours:</span> ' + item.producthours + '</div>' : '');
      // The remove control comes AFTER the details in source order and is pulled to
      // the row's top-right by CSS (.cart-item was already position:relative for a
      // fix that had never been written). It used to be emitted FIRST as a solid red
      // "Remove" block, which put a destructive action where the row's heading
      // belongs and pushed the course name below it. `aria-label` names the course,
      // because "×" alone tells a screen-reader user nothing about what it removes.
      itemEl.innerHTML = '<div class="cart-item-details"><div class="cart-item-name"><strong>' + (item.productName || item.sku) + '</strong></div>' + (parseFloat(item.credits) > 0 ? '<div class="cart-item-info"><span style="font-weight:600;">Credits:</span> ' + item.credits + '</div>' : '') + '<div class="cart-item-info"><span style="font-weight:600;">Tuition:</span> $' + item.price + ' x ' + item.quantity + '</div>' + (parseFloat(item.tax) > 0 ? '<div class="cart-item-info"><span style="font-weight:600;">Tuition Tax:</span> $' + parseFloat(item.tax).toFixed(2) + '</div>' : '') + '<div class="cart-item-info"><span style="font-weight:600;">Delivery:</span> ' + (item.productDelivery || 'Standard') + '</div><div class="cart-item-info"><span style="font-weight:600;">Dates:</span> ' + (item.productdates || 'Not specified') + '</div>' + scheduleHtml + '<div class="cart-item-info"><span style="font-weight:600;">Location:</span> ' + (item.productlocation || 'Not specified') + '</div></div><button class="remove-item" type="button" data-sku="' + item.sku + '" title="Remove from cart" aria-label="Remove ' + (item.productName || item.sku) + ' from cart">&times;</button>';
      fragment.appendChild(itemEl);
    });
    cartDom.cartItemsContainer.innerHTML = '';
    cartDom.cartItemsContainer.appendChild(fragment);
    var checkoutBtn = document.querySelector('.checkout-button');
    if (feesLoading) {
      var feeLoadEl = document.createElement('div');
      feeLoadEl.className = 'cart-fees-loading';
      feeLoadEl.innerHTML = '<div class="cart-fees-spinner"></div>Calculating fees…';
      cartDom.cartItemsContainer.appendChild(feeLoadEl);
      var summaryLoadEl = document.createElement('div');
      summaryLoadEl.className = 'cart-summary';
      summaryLoadEl.innerHTML = '<hr /><div class="cart-item-info"><strong>Total:</strong> Calculating…</div>';
      cartDom.cartItemsContainer.appendChild(summaryLoadEl);
      cartDom.totalAmount.textContent = '…';
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }
    var feeSessionRaw = sessionStorage.getItem('feeSession'),
      feeSession = feeSessionRaw ? JSON.parse(feeSessionRaw) : null,
      fees = feeSession && feeSession.feeData && feeSession.feeData.fees ? feeSession.feeData.fees : [],
      feeSummary = feeSession && feeSession.feeData && feeSession.feeData.summary ? feeSession.feeData.summary : { totalAmount: 0, totalTax: 0, grandTotal: 0 };
    // Fees are OPTIONAL for Extended Ed. If the fee API fails to connect we fail
    // silently and still allow checkout — the button is gated only on cart contents.
    if (checkoutBtn) checkoutBtn.disabled = !(cart.items.length > 0);
    if (fees.length > 0) {
      var sharedFeesEl = document.createElement('div');
      sharedFeesEl.className = 'cart-shared-fees';
      var feesHtml =
        '<hr><button type="button" class="fees-toggle" aria-expanded="false"><span class="fees-toggle-label">Additional fees</span><span class="fees-toggle-amount">$' +
        feeSummary.totalAmount.toFixed(2) +
        '</span><span class="fees-toggle-caret" aria-hidden="true">&#9662;</span></button><div class="fees-breakdown" hidden>';
      fees.forEach(function (fee) {
        feesHtml += '<div class="cart-item-info fee-item">• ' + fee.description + ': $' + fee.amount.toFixed(2);
        if (fee.tax && fee.tax > 0) feesHtml += ' + $' + fee.tax.toFixed(2) + ' tax';
        feesHtml += '</div>';
      });
      feesHtml += '<div class="cart-item-info fees-breakdown-total"><strong>Total Fees:</strong> $' + feeSummary.totalAmount.toFixed(2) + '</div></div>';
      sharedFeesEl.innerHTML = feesHtml;
      cartDom.cartItemsContainer.appendChild(sharedFeesEl);
      var toggleButton = sharedFeesEl.querySelector('.fees-toggle');
      toggleButton &&
        toggleButton.addEventListener('click', function () {
          var expanded = 'true' === toggleButton.getAttribute('aria-expanded'),
            breakdownEl = sharedFeesEl.querySelector('.fees-breakdown');
          toggleButton.setAttribute('aria-expanded', String(!expanded));
          if (breakdownEl) breakdownEl.hidden = expanded;
          sharedFeesEl.classList.toggle('fees-open', !expanded);
        });
    }
    var subtotal = cart.items.reduce(function (sum, item) {
        return sum + parseFloat(item.price) * item.quantity;
      }, 0),
      taxTotal = cart.items.reduce(function (sum, item) {
        return sum + (parseFloat(item.tax) || 0) * (item.quantity || 1);
      }, 0),
      grandTotal = subtotal + taxTotal + feeSummary.totalAmount + feeSummary.totalTax,
      summaryEl = document.createElement('div');
    summaryEl.className = 'cart-summary';
    // Rows that would read $0.00 are omitted rather than printed. An Extended
    // Education cart has no additional fees and often no tax, so it was showing
    // two zero lines and inviting the shopper to wonder what they were for.
    summaryEl.innerHTML =
      '<hr /><div class="cart-item-info"><strong>Subtotal:</strong> $' +
      subtotal.toFixed(2) +
      '</div>' +
      (feeSummary.totalAmount > 0 ? '<div class="cart-item-info"><strong>Additional Fees:</strong> $' + feeSummary.totalAmount.toFixed(2) + '</div>' : '') +
      (taxTotal + feeSummary.totalTax > 0 ? '<div class="cart-item-info"><strong>Tax:</strong> $' + (taxTotal + feeSummary.totalTax).toFixed(2) + '</div>' : '');
    cartDom.cartItemsContainer.appendChild(summaryEl);
    cartDom.totalAmount.textContent = grandTotal.toFixed(2);
  }
  async function handleAddToCart(event) {
    event.preventDefault();
    var button = event.currentTarget;
    if (!button.classList.contains('in-cart') && !button.classList.contains('unavailable')) {
      if (cart.isCartFull()) {
        showNotification(MSG.cartFull, 'error');
        return void openCart();
      }
      // The availability check is the ONLY SiS call standing between the click and
      // the cart, and that backend has a measured 10.9 s median (CLAUDE.md). Say so
      // in two places, because either one alone can go unseen: a spinner in the
      // button itself, and a toast that survives the cart sliding over the button.
      button.classList.add('loading');
      setButtonBusy(button, LABEL.checking);
      busyToast.show('Checking availability…');
      try {
        var token = await getValidToken(),
          cartItem = (function (button) {
            var accordionId = button.getAttribute('data-accordion-id'),
              productId = button.getAttribute('data-product-id');
            if (!productId) throw new Error('Product ID not found');
            var item = { sku: productId, quantity: parseInt(button.getAttribute('data-quantity') || '1'), price: parseFloat(button.getAttribute('data-product-price') || '0'), tax: parseFloat(button.getAttribute('data-product-tax') || '0'), productName: button.getAttribute('data-product-name') || '', productDelivery: button.getAttribute('data-product-delivery') || '', credits: button.getAttribute('data-product-credits') || '', productdays: '', productdates: '', producthours: '', productlocation: '', timeblocks: [] },
              accordionEl = document.querySelector('.accordion-item-' + accordionId);
            if (accordionEl) {
              var timeblockDetails = accordionEl.querySelector('.timeblock-details');
              if (
                (timeblockDetails &&
                  timeblockDetails.querySelectorAll('div').forEach(function (blockEl) {
                    var daysEl = blockEl.querySelector('.productdays'),
                      hoursEl = blockEl.querySelector('.producthours');
                    daysEl && hoursEl && item.timeblocks.push({ day: daysEl.innerText.trim(), hours: hoursEl.innerText.trim() });
                  }),
                0 === item.timeblocks.length)
              ) {
                var daysEl = accordionEl.querySelector('.productdays'),
                  hoursEl = accordionEl.querySelector('.producthours');
                daysEl && (item.productdays = daysEl.innerText);
                hoursEl && (item.producthours = hoursEl.innerText);
              } else {
                item.productdays = item.timeblocks[0].day;
                item.producthours = item.timeblocks[0].hours;
              }
              var datesEl = accordionEl.querySelector('.productdates');
              datesEl && (item.productdates = datesEl.innerText);
              var locationEl = accordionEl.querySelector('.productlocation');
              locationEl && (item.productlocation = locationEl.innerText);
            }
            return item;
          })(button);
        if (unavailableStore.isUnavailable(cartItem.sku)) {
          disableButton(button, MSG.unavailable);
          return void showNotification(MSG.unavailable, 'error');
        }
        var availabilityResp = await checkAvailability(cartItem.sku, token);
        if ((401 === availabilityResp.status && ((token = await getValidToken(true)), (availabilityResp = await checkAvailability(cartItem.sku, token))), 200 === availabilityResp.status)) {
          if (!availabilityResp.data || !availabilityResp.data.seatsAreAvailable) {
            unavailableStore.markAsUnavailable(cartItem.sku);
            disableButton(button, MSG.noSeats);
            return void showNotification(MSG.noSeats, 'error');
          }
          // Empty context unless conflict checking is switched on, so the default is
          // the solo form: it answers "can this offering be registered at all", which
          // is the question the seats check above gets wrong.
          if (validateOnAdd) {
            var contextSkus = validateConflicts
                ? cart.items.map(function (item) {
                    return item.sku;
                  })
                : [],
              validationResp = await validateCart({ apiOrigin: apiOrigin, sku: cartItem.sku, cartSkus: contextSkus, token: token });
            if (401 === validationResp.status) {
              token = await getValidToken(true);
              validationResp = await validateCart({ apiOrigin: apiOrigin, sku: cartItem.sku, cartSkus: contextSkus, token: token });
            }
            var verdict = readValidation(validationResp);
            // A null verdict means the call failed or came back in a shape we do not
            // recognise. Fail OPEN — a validation outage must not become a cart outage,
            // and registration still gates the transaction server-side.
            if (verdict && !verdict.ok) {
              // A clash is relative to the current cart and must lift once the other
              // course is removed. "No longer available" is a property of the offering
              // itself, so it persists for the session like the seats check above.
              if (isConflict(verdict)) conflictStore.mark(cartItem.sku);
              else unavailableStore.markAsUnavailable(cartItem.sku);
              disableButton(button, verdict.message);
              return void showNotification(verdict.message, 'error');
            }
          }
          if (cart.addItem(cartItem)) {
            cart.updateAddedButtonStates();
            renderCart(true);
            openCart();
            // The cart is now on screen with its own fee-loading spinner, so it
            // takes over as the indicator. Two spinners saying different things
            // is worse feedback than one.
            busyToast.hide();
            button.classList.remove('loading');
            var skus = cart.items.map(function (item) {
              return item.sku;
            });
            try {
              await calculateFees(skus, token);
              renderCart();
              showNotification(MSG.added, 'success');
            } catch (error) {
              // Fees are optional for EE — fail silently and let the shopper proceed.
              console.warn('[Fees] Could not calculate fees — proceeding without them.', error);
              sessionManager.clearFeeSession();
              renderCart();
              showNotification(MSG.added, 'success');
            }
          } else showNotification(MSG.alreadyInCart, 'error');
        } else {
          if (404 !== availabilityResp.status) throw new Error('Failed to check course availability (status ' + availabilityResp.status + ')');
          unavailableStore.markAsUnavailable(cartItem.sku);
          disableButton(button, MSG.unavailable);
          showNotification(MSG.unavailable, 'error');
        }
      } catch (error) {
        console.error('Error in handleAddToCart:', error);
        showNotification(MSG.unexpected, 'error');
      } finally {
        button.classList.remove('loading');
        busyToast.hide();
        // Restore the label unless a terminal state already claimed it
        // ("In cart" from updateAddedButtonStates, "Unavailable" from disableButton).
        if (!button.classList.contains('in-cart') && !button.classList.contains('unavailable')) button.textContent = LABEL.add;
      }
    }
  }
  async function checkAvailability(sku, token) {
    var endpoint = 'thesissitecorexm.api/courseofferings/' + sku,
      response = await fetch(apiOrigin + '/api/bvcpayment?endpoint=' + encodeURIComponent(endpoint), { method: 'GET', mode: 'cors', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json' } }),
      data = await response.json().catch(function () {
        return null;
      });
    console.log('[API] Availability', sku, '-> status', response.status);
    return { status: response.status, data: data };
  }
  // The fee fetch, dedupe and arithmetic live in ../shared/fees.js so the checkout
  // page can recalculate after pruning a course. This wrapper keeps the parts that
  // ARE cart-specific: per-item attribution and writing the session.
  async function calculateFees(skus, token) {
    var effectiveSkus = skus;
    if (!(Array.isArray(effectiveSkus) && 0 !== effectiveSkus.length))
      effectiveSkus = cart.items.map(function (item) {
        return item.sku;
      });
    var result = await fetchCartFees({ apiOrigin: apiOrigin, skus: effectiveSkus, feeId: feeId, token: token });
    if (0 === effectiveSkus.length) return result;
    cart.items.forEach(function (item) {
      var perCourse = feesForSku(result.feeData, item.sku);
      item.fees = perCourse.fees;
      item.feeSummary = perCourse.summary;
    });
    cart.saveToSession();
    sessionManager.createFeeSession({ courseIds: effectiveSkus.join(','), fees: result.feeData, summary: result.summary, timestamp: new Date().toISOString() });
    return result;
  }
  async function fetchCourseData(origin, sisId) {
    // Extended Education: the course id maps directly to /data/courses/course-{sisId}.json.
    // No category-index slug lookup and no PDF course outlines (EE has none).
    return {
      data: await (async function (url) {
        var response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        return response.json();
      })(origin + '/data/courses/course-' + encodeURIComponent(sisId) + '.json'),
      pdfFilename: null,
    };
  }
  // Sections are rendered from the Sitecore data alone — no availability sweep.
  //
  // This used to time a `courseofferings` call PER section before showing the
  // enrolment list, hiding any section that did not answer with seats. Three
  // things were wrong with it. The seats flag it keyed on is not trustworthy
  // (`seatsAreAvailable` reported seats for 37 of the 42 sections the SiS
  // refuses to register — see docs/sis-api.md), so it hid the wrong rows. The
  // calls are serial against a backend measured at a 10.9 s median and a 90 s
  // max (see the SiS health watcher in CLAUDE.md), so the page sat behind a
  // spinner for minutes. And any degradation there emptied the enrolment
  // section entirely — a course with sections on sale rendered as "No sections
  // currently available."
  //
  // Availability is now decided at the only moment it can be acted on: the Add
  // click, in handleAddToCart(), which greys the button out when the SiS says
  // no. One call, on demand, against the section the shopper actually chose.
  function bindOfferings(container) {
    container.querySelectorAll('.addtocartbutton').forEach(function (button) {
      button.addEventListener('click', handleAddToCart);
    });
    // Anything already refused during this session stays greyed out across
    // re-renders and back-navigation — sessionStorage, no network call.
    markKnownUnavailable(container);
    cart.updateAddedButtonStates();
  }
  /**
   * Re-apply the session's refusals to freshly-rendered buttons.
   *
   * Skips anything already in the cart: that button belongs to
   * updateAddedButtonStates(), and greying it here would leave it stuck reading
   * "In cart" after the item is removed instead of returning to "Add".
   */
  function markKnownUnavailable(container) {
    (container || document).querySelectorAll('.addtocartbutton').forEach(function (button) {
      var productId = button.getAttribute('data-product-id');
      if (productId && !cart.isInCart(productId) && unavailableStore.isUnavailable(productId)) disableButton(button, MSG.unavailable);
    });
  }
  /** Put one Add button into its busy state: spinner + label, still fully visible. */
  function setButtonBusy(button, label) {
    button.innerHTML = '<span class="bvc-btn-spinner" aria-hidden="true"></span>';
    button.appendChild(document.createTextNode(label));
  }
  /** Grey out one Add button and say why. */
  function disableButton(button, message) {
    button.classList.add('unavailable');
    button.setAttribute('aria-disabled', 'true');
    button.title = message || MSG.unavailable;
    button.textContent = LABEL.unavailable;
  }
  async function init() {
    console.log('[Init] Starting OS Course initialisation...');
    var courseComponent = document.getElementById('courseComponent');
    if (courseComponent) {
      document.getElementById('os-course-styles') || document.querySelector('link[href*="os-course.css"]') || console.warn('[Init] os-course.css not detected. Load it via <link href=".../css/os-course.css"> or a <style id="os-course-styles"> block, or the component will not be styled.');
      document.querySelector('.sliding-cart') || document.body.insertAdjacentHTML('beforeend', '<div class="cart-overlay"></div><div class="sliding-cart"><span class="cart-close">&times;</span><h2>Shopping Cart</h2><div class="cart-items"></div><div class="cart-total">Total: $<span class="total-amount">0.00</span></div><div class="cart-message"></div><button class="checkout-button">Proceed to Checkout</button></div>');
      cartDom.init();
      sessionManager.init();
      unavailableStore.init();
      cart.init();
      renderCart();
      cartDom.closeButton.addEventListener('click', closeCart);
      cartDom.overlay.addEventListener('click', closeCart);
      cartDom.cartItemsContainer.addEventListener('click', function (event) {
        // closest(), not matches(): the click can land on a child of the button.
        // The sku is then read off THAT element rather than event.target, which
        // would be the child and carry no data-sku.
        var removeButton = event.target.closest('.remove-item');
        removeButton &&
          (async function (sku) {
            try {
              if ((cart.removeItem(sku), 0 === cart.items.length)) {
                sessionManager.clearAllSessions();
                ['cartItems', 'totalCredits', 'bvcCourseId', 'courseFees'].forEach(function (key) {
                  sessionStorage.removeItem(key);
                });
                renderCart();
                showNotification(MSG.cartEmptied, 'success');
                cartDom.cartMessage.classList.remove('visible');
              } else {
                try {
                  var token = await getValidToken();
                  await calculateFees(
                    cart.items.map(function (item) {
                      return item.sku;
                    }),
                    token,
                  );
                  renderCart();
                  showNotification(MSG.removed, 'success');
                } catch (error) {
                  // Fees are optional for EE — fail silently and keep checkout available.
                  console.warn('[Fees] Could not recalculate fees after removal — proceeding without them.', error);
                  sessionManager.clearFeeSession();
                  renderCart();
                  showNotification(MSG.removed, 'success');
                }
                cartDom.cartMessage.classList.toggle('visible', cart.isCartFull());
              }
              cart.updateAddedButtonStates();
            } catch (error) {
              console.error('Error removing item:', error);
              showNotification(MSG.removeFailed, 'error');
            }
          })(removeButton.dataset.sku);
      });
      document.querySelector('.checkout-button').addEventListener('click', function (event) {
        if (this.disabled) return void event.preventDefault();
        cart.items.length > 0 ? (window.location.href = '../cart-checkout?type=ee') : showNotification(MSG.cartEmpty, 'error');
      });
      var openCartButton = document.querySelector('.opencartbutton');
      if ((openCartButton && openCartButton.addEventListener('click', openCart), console.log('[Init] Cart infrastructure ready'), courseComponent.querySelector('.addtocartbutton'))) {
        console.log('[Init] Server-rendered offerings found — binding directly.');
        return void bindOfferings(courseComponent);
      }
      var courseData,
        pdfFilename,
        courseName,
        courseDescription,
        courseCredits,
        courseSections,
        sisId = (function () {
          var component = document.getElementById('courseComponent'),
            attr = component && component.getAttribute('data-sisid');
          if (attr && attr.trim()) return attr.trim();
          var pathSegments = window.location.pathname.replace(/\/$/, '').split('/');
          return pathSegments[pathSegments.length - 1] || '';
        })();
      if (sisId)
        try {
          var courseResult = (
            await Promise.all([
              fetchCourseData(dataOrigin, sisId),
              fetch(dataOrigin + '/data/sis-data-lookup.json', { mode: 'cors' })
                .then(function (response) {
                  return response.ok ? response.json() : null;
                })
                .then(function (lookupData) {
                  if (lookupData) {
                    var deliveryTypesById = (lookupData.lookups && lookupData.lookups.deliveryTypes && lookupData.lookups.deliveryTypes.byId) || {},
                      campusesById = (lookupData.lookups && lookupData.lookups.campuses && lookupData.lookups.campuses.byId) || {};
                    Object.keys(deliveryTypesById).forEach(function (id) {
                      guidLookup[id.toUpperCase()] = deliveryTypesById[id].displayName || deliveryTypesById[id].name;
                    });
                    Object.keys(campusesById).forEach(function (id) {
                      guidLookup[id.toUpperCase()] = campusesById[id].displayName || campusesById[id].name;
                    });
                  }
                })
                .catch(function () {}),
            ])
          )[0];
          courseComponent.innerHTML =
            ((courseData = courseResult.data),
            (pdfFilename = courseResult.pdfFilename),
            (courseName = courseData.name || ''),
            (courseDescription = courseData.description || ''),
            (courseCredits = Number(courseData.credits || 0)),
            (courseSections = Array.isArray(courseData.sections) ? courseData.sections : []),
            '<div class="course-page-grid"><div class="course-info-col">' + (courseCredits > 0 ? '<div class="c-course_credits"><div class="c-course_credits-box"><div class="c-course_credits-txt">' + courseCredits + '</div><div>Credits</div></div></div>' : '') + (courseDescription ? '<h2 class="c-course__col1">Course Description</h2><div class="w-richtext"><p>' + courseDescription + '</p></div>' : '') + (pdfFilename ? '<div class="course-pdf-section"><a class="course-pdf-link" href="' + dataOrigin + '/data/course-outlines-pdf/' + encodeURIComponent(pdfFilename) + '" target="_blank" rel="noopener">Download Course Outline (PDF)</a></div>' : '') + '</div><div class="course-offers-col">' + (courseSections.length > 0 ? '<div class="enrollment-section"><div class="enrollment-header">Enroll now</div>' + renderOfferings(courseSections, courseName, courseCredits) + '</div>' : '<p class="no-sections">No sections currently available.</p>') + '</div></div>');
          bindOfferings(courseComponent);
          console.log('[Init] Built from JSON. Done.');
        } catch (error) {
          courseComponent.insertAdjacentHTML('beforeend', '<p style="color:red;">Failed to load course data: ' + error.message + '</p>');
          console.error('[bvc-ee-course]', error);
        }
      else courseComponent.innerHTML = '<p style="color:red;">Course ID not found in URL.</p>';
    } else console.warn('[Init] #courseComponent not found');
  }
})();
