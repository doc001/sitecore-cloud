/**
 * EE-Course (Extended Education) cart experience — SOURCE
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE. Do not edit public/js/ee-course.js (it is generated).
 *
 *   Build : npm run js:build      (esbuild -> public/js/ee-course.js)
 *   Watch : npm run js:watch      (rebuild on save)
 *
 * Loaded from Webflow (Extended Education course pages) via:
 *   <script src="https://bvc-app-uat.vercel.app/js/ee-course.js" defer></script>
 *
 * Mirrors the Open Studies cart (same data shape, same thesissitecorexm.api
 * availability + fee endpoints) but reads /data/courses/ and sends shoppers to
 * the Extended Ed checkout (?type=ee, no ASN).
 *
 * Endpoints/config are overridable. Set BEFORE this script loads:
 *   window.__EE_COURSE_CONFIG__ = { dataOrigin: "", apiOrigin: "", feeApplicantId: 1 };
 * Defaults (production):
 *   dataOrigin     : https://bvc-app-uat.vercel.app        (this app /data/*)
 *   apiOrigin      : https://bvc-uat-api-proxy.vercel.app (mstoken, bvcpayment)
 *   feeApplicantId : ''  (empty studentNo segment in fee/{skus}/{studentNo}; backend expects it)
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';
  if (window.__bvcEeCourseLoaded) {
    console.warn('[EE-Course] Already initialised — skipping duplicate load.');
  } else {
    window.__bvcEeCourseLoaded = true;
    console.log('[EE-Course] Script loaded');
    var _cfg = (typeof window !== 'undefined' && window.__EE_COURSE_CONFIG__) || {},
      dataOrigin = _cfg.dataOrigin != null ? _cfg.dataOrigin : 'https://bvc-app-uat.vercel.app',
      apiOrigin = _cfg.apiOrigin != null ? _cfg.apiOrigin : 'https://bvc-uat-api-proxy.vercel.app',
      // Fee endpoint is `fee/{skus}/{studentNo}` where {studentNo} must be EMPTY for an
      // anonymous fee preview — the URL ends in a trailing slash (`fee/2595/`). Verified
      // 2026-07-28: empty → 200 with fee data; the literal string 'null' now 404s. The
      // value does not change the returned fee amounts. Override per env (e.g. a real
      // applicant id) via window.__EE_COURSE_CONFIG__ = { feeApplicantId: <id> }. See OS-COURSE-CART.md.
      feeId = _cfg.feeApplicantId != null ? _cfg.feeApplicantId : '',
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
      dayCodeMap = { M: 'Mondays', T: 'Tuesdays', W: 'Wednesdays', R: 'Thursdays', F: 'Fridays', S: 'Saturdays', U: 'Sundays' };
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
              button.textContent = 'In cart';
            } else if (!unavailable) {
              button.classList.remove('in-cart');
              button.removeAttribute('aria-disabled');
              button.title = cartFull ? 'Cart is full (max 6)' : '';
              button.textContent = 'Add';
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
      showNotification = function (message, type) {
        var notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(function () {
          notification.remove();
        }, 3e3);
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
  function renderSchedule(section) {
    return Array.isArray(section.timeBlocks) && section.timeBlocks.length
      ? '<div class="timeblock-info"><div class="detail-label">Schedule</div><div class="timeblock-details">' +
          section.timeBlocks
            .map(function (timeBlock) {
              var parsed = (function (schedule) {
                if (!schedule) return { day: '', hours: '' };
                var parts = schedule.trim().split(/\s+/);
                return { day: dayCodeMap[parts[0]] || parts[0], hours: parts.slice(1).join(' ') };
              })(timeBlock.schedule);
              return '<div><span class="productdays">' + parsed.day + '</span>:<br/><span class="producthours">' + parsed.hours + '</span></div>';
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
      deliveryTypeName = resolveGuid(section.deliveryType),
      campusName = resolveGuid(section.campus),
      scheduleHtml = renderSchedule(section),
      credits = section.credits || fallbackCredits,
      registrationHtml = section.registrationStart ? '<div class="detail-item"><div class="detail-label">Registration</div><div class="detail-value">' + formatDate(section.registrationStart) + (section.registrationEnd ? ' &ndash; ' + formatDate(section.registrationEnd) : '') + '</div></div>' : '';
    return '<div class="accordion-item-' + accordionId + '"><button class="accordion-toggle" onclick="toggleAccordion(\'' + accordionId + '\')"><div class="date-range"><span class="productdates">' + formattedStart + ' &ndash; ' + formattedEnd + '</span><span class="dropdown-icon">&#9660;</span></div></button><div class="accordion-content" id="accordion-' + accordionId + '"><span class="productlocation" style="display:none;">' + campusName + '</span><div class="course-details"><div class="detail-group"><div class="detail-item"><div class="detail-label">Credits</div><div class="detail-value">' + credits + '</div></div><div class="detail-item"><div class="detail-label">Hours</div><div class="detail-value">' + section.hours + '</div></div>' + registrationHtml + scheduleHtml + '</div><div class="price-section"><div class="price-info"><div class="price-display"><span class="currency">$</span><span class="price">' + domesticPriceDisplay + '</span><span class="currency-code">CAD</span></div><div class="student-type">Domestic Student</div>' + (domesticTax > 0 ? '<div class="tax-note">+ $' + parseFloat(domesticTax).toFixed(2) + ' tax</div>' : '') + (null !== internationalPriceDisplay ? '<div class="price-display intl" style="margin-top:8px;"><span class="currency">$</span><span class="price">' + internationalPriceDisplay + '</span><span class="currency-code">CAD</span></div><div class="student-type">International Student</div>' : '') + '</div><div class="action-section"><a href="#" data-accordion-id="' + accordionId + '" data-product-name="' + productName + '" data-product-id="' + section.sisId + '" data-product-credits="' + credits + '" data-quantity="1" data-product-price="' + domesticPriceDisplay + '" data-product-tax="' + parseFloat(domesticTax).toFixed(2) + '" data-product-delivery="' + deliveryTypeName + '" class="c-button_cart addtocartbutton w-button" tabindex="0">Add</a><p class="additional-fees">Additional fees apply</p></div></div></div></div></div>';
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
      cartDom.cartMessage.textContent = 'Maximum number of products (6) has been reached.';
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
                return '<div class="cart-item-info" style="padding-left:20px;">• ' + block.day + ': ' + block.hours + '</div>';
              })
              .join('')
          : '<div class="cart-item-info"><span style="font-weight:600;">Days:</span> ' + (item.productdays || 'Not specified') + '</div><div class="cart-item-info"><span style="font-weight:600;">Hours:</span> ' + (item.producthours || 'Not specified') + '</div>';
      itemEl.innerHTML = '<button class="remove-item" data-sku="' + item.sku + '">Remove</button><div class="cart-item-details"><div><strong>' + (item.productName || item.sku) + '</strong></div><div class="cart-item-info"><span style="font-weight:600;">Credits: </span> ' + item.credits + '</div><div class="cart-item-info"><span style="font-weight:600;">Tuition:</span> $' + item.price + ' x ' + item.quantity + '</div>' + (parseFloat(item.tax) > 0 ? '<div class="cart-item-info"><span style="font-weight:600;">Tuition Tax:</span> $' + parseFloat(item.tax).toFixed(2) + '</div>' : '') + '<div class="cart-item-info"><span style="font-weight:600;">Delivery:</span> ' + (item.productDelivery || 'Standard') + '</div><div class="cart-item-info"><span style="font-weight:600;">Dates:</span> ' + (item.productdates || 'Not specified') + '</div>' + scheduleHtml + '<div class="cart-item-info"><span style="font-weight:600;">Location:</span> ' + (item.productlocation || 'Not specified') + '</div></div>';
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
    summaryEl.innerHTML = '<hr /><div class="cart-item-info"><strong>Subtotal:</strong> $' + subtotal.toFixed(2) + '</div><div class="cart-item-info"><strong>Additional Fees:</strong> $' + feeSummary.totalAmount.toFixed(2) + '</div><div class="cart-item-info"><strong>Tax:</strong> $' + (taxTotal + feeSummary.totalTax).toFixed(2) + '</div>';
    cartDom.cartItemsContainer.appendChild(summaryEl);
    cartDom.totalAmount.textContent = grandTotal.toFixed(2);
  }
  async function handleAddToCart(event) {
    event.preventDefault();
    var button = event.currentTarget;
    if (!button.classList.contains('in-cart') && !button.classList.contains('unavailable')) {
      if (cart.isCartFull()) {
        showNotification('Maximum number of products (6) has been reached', 'error');
        return void openCart();
      }
      button.classList.add('loading');
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
        if (unavailableStore.isUnavailable(cartItem.sku)) return void showNotification('This date is not available', 'error');
        var availabilityResp = await checkAvailability(cartItem.sku, token);
        if ((401 === availabilityResp.status && ((token = await getValidToken(true)), (availabilityResp = await checkAvailability(cartItem.sku, token))), 200 === availabilityResp.status)) {
          if (!availabilityResp.data || !availabilityResp.data.seatsAreAvailable) {
            unavailableStore.markAsUnavailable(cartItem.sku);
            button.classList.add('unavailable');
            return void showNotification('No seats available for this date', 'error');
          }
          if (cart.addItem(cartItem)) {
            cart.updateAddedButtonStates();
            renderCart(true);
            openCart();
            button.classList.remove('loading');
            var skus = cart.items.map(function (item) {
              return item.sku;
            });
            try {
              await calculateFees(skus, token);
              renderCart();
              showNotification('Item added to cart!', 'success');
            } catch (error) {
              // Fees are optional for EE — fail silently and let the shopper proceed.
              console.warn('[Fees] Could not calculate fees — proceeding without them.', error);
              sessionManager.clearFeeSession();
              renderCart();
              showNotification('Item added to cart!', 'success');
            }
          } else showNotification('Item is already in your cart', 'error');
        } else {
          if (404 !== availabilityResp.status) throw new Error('Failed to check course availability (status ' + availabilityResp.status + ')');
          unavailableStore.markAsUnavailable(cartItem.sku);
          button.classList.add('unavailable');
          showNotification('This date is not available', 'error');
        }
      } catch (error) {
        console.error('Error in handleAddToCart:', error);
        showNotification(error.message, 'error');
      } finally {
        button.classList.remove('loading');
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
  // Additional fees are CART-LEVEL — charged once per registration, never per
  // course. The fee API returns a set PER course/offering, so a multi-course cart
  // comes back with the same institutional fees repeated (each stamped with a
  // program-offering id, and amounts that can differ by program). Collapse to ONE
  // set by fee type (description) so each fee — Student Association, Services,
  // Technology, Learner Wellness — shows exactly once for the whole cart. First
  // occurrence wins. See OS-COURSE-CART.md (Backend API contract).
  function dedupeFees(fees) {
    var seen = {},
      result = [];
    (Array.isArray(fees) ? fees : []).forEach(function (fee) {
      var key = (fee.description || '').trim().toLowerCase();
      seen[key] || ((seen[key] = 1), result.push(fee));
    });
    return result;
  }
  async function calculateFees(skus, token) {
    var effectiveSkus = skus;
    if (!(Array.isArray(effectiveSkus) && 0 !== effectiveSkus.length))
      effectiveSkus = cart.items.map(function (item) {
        return item.sku;
      });
    if (0 === effectiveSkus.length) return { status: 400, feeData: [], summary: { totalAmount: 0, totalTax: 0, grandTotal: 0, feeCount: 0 } };
    var endpoint = 'thesissitecorexm.api/fee/' + effectiveSkus.join(',') + '/' + feeId,
      response = await fetch(apiOrigin + '/api/bvcpayment?endpoint=' + encodeURIComponent(endpoint), { method: 'GET', mode: 'cors', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error('Fee API returned status ' + response.status);
    var dedupedFees = dedupeFees(await response.json()),
      totalAmount = dedupedFees.reduce(function (sum, fee) {
        return sum + (fee.amount || 0);
      }, 0),
      totalTax = dedupedFees.reduce(function (sum, fee) {
        return sum + (fee.tax || 0);
      }, 0);
    cart.items.forEach(function (item) {
      var courseFees = dedupedFees.filter(function (fee) {
        return fee.courseSku === item.sku;
      });
      item.fees = courseFees;
      item.feeSummary = {
        totalAmount: courseFees.reduce(function (sum, fee) {
          return sum + (fee.amount || 0);
        }, 0),
        totalTax: courseFees.reduce(function (sum, fee) {
          return sum + (fee.tax || 0);
        }, 0),
        grandTotal: courseFees.reduce(function (sum, fee) {
          return sum + (fee.amount || 0) + (fee.tax || 0);
        }, 0),
      };
    });
    cart.saveToSession();
    var result = { status: response.status, feeData: dedupedFees, summary: { totalAmount: totalAmount, totalTax: totalTax, grandTotal: totalAmount + totalTax, feeCount: dedupedFees.length } };
    sessionManager.createFeeSession({ courseIds: effectiveSkus.join(','), fees: dedupedFees, summary: result.summary, timestamp: new Date().toISOString() });
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
  function bindOfferings(container) {
    container.querySelectorAll('.addtocartbutton').forEach(function (button) {
      button.addEventListener('click', handleAddToCart);
    });
    cart.updateAddedButtonStates();
    (async function (container) {
      var buttons = container.querySelectorAll('.addtocartbutton');
      if (0 !== buttons.length) {
        var loadingOverlay,
          enrollmentSection = container.querySelector('.enrollment-section');
        if (enrollmentSection) {
          enrollmentSection.style.position = 'relative';
          (loadingOverlay = document.createElement('div')).className = 'availability-loading-overlay';
          loadingOverlay.innerHTML = '<div class="availability-spinner"></div><div>Checking availability…</div>';
          enrollmentSection.appendChild(loadingOverlay);
        }
        try {
          var token;
          try {
            token = await getValidToken();
          } catch (error) {
            return void console.warn('[Availability] No token — skipping availability sweep.');
          }
          for (var index = 0; index < buttons.length; index++) {
            var button = buttons[index],
              productId = button.getAttribute('data-product-id');
            if (productId && !cart.isInCart(productId))
              try {
                var availabilityResp = await checkAvailability(productId, token);
                if ((401 === availabilityResp.status && ((token = await getValidToken(true)), (availabilityResp = await checkAvailability(productId, token))), 200 === availabilityResp.status && availabilityResp.data && availabilityResp.data.seatsAreAvailable)) {
                  button.classList.remove('unavailable');
                  button.title = '';
                  button.textContent = 'Add';
                } else {
                  unavailableStore.markAsUnavailable(productId);
                  var accordionEl = container.querySelector('.accordion-item-' + button.getAttribute('data-accordion-id'));
                  accordionEl && (accordionEl.style.display = 'none');
                }
              } catch (error) {
                console.warn('Availability check failed for ' + productId, error);
              }
          }
          container.querySelectorAll('.offering-location').forEach(function (locationEl) {
            var accordionItems = locationEl.querySelectorAll('[class^="accordion-item-"]');
            Array.prototype.every.call(accordionItems, function (accordionItem) {
              return 'none' === accordionItem.style.display;
            }) && (locationEl.style.display = 'none');
          });
          container.querySelectorAll('.course-offering').forEach(function (offeringEl) {
            var locations = offeringEl.querySelectorAll('.offering-location');
            Array.prototype.every.call(locations, function (location) {
              return 'none' === location.style.display;
            }) && (offeringEl.style.display = 'none');
          });
          var offerings = container.querySelectorAll('.course-offering'),
            hiddenOfferings = container.querySelectorAll('.course-offering[style*="display: none"]');
          if (offerings.length > 0 && offerings.length === hiddenOfferings.length) {
            var header = container.querySelector('.enrollment-header');
            header && header.insertAdjacentHTML('afterend', '<p class="no-sections">No sections currently available.</p>');
          }
        } catch (error) {
          console.error('Error during availability check:', error);
        } finally {
          loadingOverlay && loadingOverlay.remove();
        }
      }
    })(container);
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
        event.target.matches('.remove-item') &&
          (async function (sku) {
            try {
              if ((cart.removeItem(sku), 0 === cart.items.length)) {
                sessionManager.clearAllSessions();
                ['cartItems', 'totalCredits', 'bvcCourseId', 'courseFees'].forEach(function (key) {
                  sessionStorage.removeItem(key);
                });
                renderCart();
                showNotification('Your cart is now empty.', 'success');
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
                  showNotification('Item removed from cart', 'success');
                } catch (error) {
                  // Fees are optional for EE — fail silently and keep checkout available.
                  console.warn('[Fees] Could not recalculate fees after removal — proceeding without them.', error);
                  sessionManager.clearFeeSession();
                  renderCart();
                  showNotification('Item removed from cart', 'success');
                }
                cartDom.cartMessage.classList.toggle('visible', cart.isCartFull());
              }
              cart.updateAddedButtonStates();
            } catch (error) {
              console.error('Error removing item:', error);
              showNotification('Failed to remove item from cart', 'error');
            }
          })(event.target.dataset.sku);
      });
      document.querySelector('.checkout-button').addEventListener('click', function (event) {
        if (this.disabled) return void event.preventDefault();
        cart.items.length > 0 ? (window.location.href = '../cart-checkout?type=ee') : showNotification('Your cart is empty', 'error');
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
