/**
 * OS-Course cart experience — SOURCE
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE. Do not edit public/js/os-course.js (it is generated).
 *
 *   Build : npm run js:build      (esbuild -> public/js/os-course.js, minified)
 *   Watch : npm run js:watch      (rebuild on save)
 *   Sandbox (local mock + watch): npm run os-course:dev
 *
 * Loaded from Webflow via:
 *   <script src="https://bvc-uat.vercel.app/js/os-course.js" defer></script>
 *
 * Endpoints are overridable for local testing. Set BEFORE this script loads:
 *   window.__OS_COURSE_CONFIG__ = { dataOrigin: '', apiOrigin: '' };
 * Defaults (production/UAT):
 *   dataOrigin : https://bvc-uat.vercel.app          (this app's /data/*)
 *   apiOrigin  : https://bvc-uat-api-proxy.vercel.app (mstoken, bvcpayment)
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';
  if (window.__bvcOsCourseLoaded) console.warn('[OS-Course] Already initialised — skipping duplicate load.');
  else {
    ((window.__bvcOsCourseLoaded = !0), console.log('[OS-Course] Script loaded'));
    var _cfg = (typeof window !== 'undefined' && window.__OS_COURSE_CONFIG__) || {},
      e = _cfg.dataOrigin != null ? _cfg.dataOrigin : 'https://bvc-uat.vercel.app',
      t = _cfg.apiOrigin != null ? _cfg.apiOrigin : 'https://bvc-uat-api-proxy.vercel.app',
      s = window.tokenStorage || {
        key: 'bvcToken',
        setToken: function (e) {
          sessionStorage.setItem(this.key, JSON.stringify({ token: e, timestamp: Date.now() }));
        },
        isTokenExpired: function () {
          try {
            var e = JSON.parse(sessionStorage.getItem(this.key));
            return !(e && e.token && e.timestamp) || Date.now() - e.timestamp > 36e5;
          } catch (e) {
            return !0;
          }
        },
        getToken: function () {
          try {
            var e = JSON.parse(sessionStorage.getItem(this.key));
            return (e && e.token) || null;
          } catch (e) {
            return null;
          }
        },
        clearToken: function () {
          sessionStorage.removeItem(this.key);
        },
      };
    window.tokenStorage = s;
    var a =
      window.getMsToken ||
      async function () {
        console.log('[Token] Requesting new token from proxy...');
        var e = await fetch(t + '/api/mstoken', { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        if (!e.ok) throw new Error('Token request failed with status: ' + e.status);
        var s = await e.json();
        if (!s.access_token) throw new Error('No access token in response');
        return s.access_token;
      };
    window.getMsToken = a;
    var n = null,
      i = { '1AE082FF1070438CBAA776B245B6F75D': 'Any-time Online', C38BDD5C70E34955AD170B6C6A1EC5E8: 'AudioVideo Based Instruction', '481341DF9A144AC8A315112B97377EC9': 'Blended', '0102087B8DAB4E96B64F49185C0B1FF8': 'Blended Asynchronous', '914480483DE14389ABD9EE4F1D28589E': 'Blended Self-Paced', C45FFE750A404E30A906FC3C6FDD99FC: 'Blended Synchronous', '6BF78E16E03F462FAEE8F223086CFB35': 'Blended Synchronous Asynchronous', '5969AC19010546B5B9834F6F8D2F3B29': 'BVC Online', '2E7F9F03DDB84D6BB91FDC2D4464372A': 'Challenge', '6F3515869E4C4C5599F470A7A58B13F0': 'Combined Online', C5BAA31D7BC0449890F790E897A92261: 'Computer Assisted Instruction', '2B0F27FC3A764DBB941F2644DB71B7D6': 'Correspondence Based Instruction', E27E365D5A3341629CFDB4DB6DE64FCA: 'Distributed Learning ecampus 2', '467A978F3823421BBDF788D21BC7B09C': 'ECampus Alberta - online learning', B146327974D348BD8306F957AE47CECD: 'eCampusAlberta Online', EE331EC390BC4D329910C5911DF970A7: 'Face to Face Self-Paced', '939C8DACA6C1415EBC831B3F062D4250': 'Face to Face Synchronous', '8317C7933CC449C2984E7F1CCD6FF5B8': 'Flexclass', F8EBCF8BF2D147AA9F76522DCBEDFA75: 'Home Study', '9754E29DF0754139B125292A81550174': 'Hyflex', E9F804275D3C4B61A685F63DF5134F14: 'In Class', '8AFAF1DADDEF4B71AC14DA272E952D0A': 'Micro-Credential Assessment', '5D448378DA984E9986E737C02BEA8F46': 'Mixed', C570FE50B9824FD6906B571CDE435CF3: 'Off-Site', EC1C42ED10C54C1995A9F2CFEAC79CD9: 'Online Asynchronous', '9FA504584ED84FABB0748D043A306BC3': 'Online Self-Paced', '71159BEB070D42C981D9758B3108A0CD': 'Online Synchronous', F6250694BAD64615BCB91693A45D76C5: 'Online Synchronous Asynchronous', '40817BFE87E1432EB3E68929DF8C9965': 'Real-time Online', '60C2E33F37514B7E884D1BEFB7155785': 'Teleconferencing / Videoconferencing', '63ADFB9EB3484A00BD66C043F43DEBE4': 'Traditional and Self Paced', '05A8F1DF96624B67A7F9DC22C32B4A5F': 'Work Experience', '00D83EDBF5B642ADA6493FBFE3EC116A': 'Airdrie', '481D28AD75CA4F12B5B10C078AA05F35': 'Banff', '0B44F9AE85B9426F9A3876762BBA5B5A': 'Calgary', '8005CA67F70B43C2BBB5004FF89FA4E1': 'Calgary Downtown Campus', A9B98CE5F1D5460F8812E36A93FDF320: 'Cochrane', '82E8438804E84947BAAF251119943A6A': 'Distance Learning', '5AA49765063A4B0BB623C0404A92406A': 'High River', '2B4E485287444409AA1E828DA53BFC0C': 'Okotoks', D8ECBBFE90E944FA8526B7A90ED56FC5: 'Online', D532C4A03C6C42E99C3C5569D3B7F59F: 'Regional', '05A9B93BC41A4F5CBE72FC9B97548AFF': 'Rural', A7B3BDCF1E404C32890EF853D2DCFDF2: 'Strathmore', FBE851B811DA49F0A8795BD188113BDB: 'Three Gorges Medical College', AF5967FBE4D446E3BA1212EFEE54B86C: 'Three Hills', '1B561481FF05406A897B1FEB28F98004': 'Yukon' },
      o = { M: 'Mondays', T: 'Tuesdays', W: 'Wednesdays', R: 'Thursdays', F: 'Fridays', S: 'Saturdays', U: 'Sundays' };
    window.toggleAccordion = function (e) {
      var t = document.getElementById('accordion-' + e);
      if (t) {
        var s = t.previousElementSibling;
        t.classList.contains('open')
          ? (t.classList.remove('open'), s.classList.remove('active'))
          : (document.querySelectorAll('.accordion-content.open').forEach(function (e) {
              (e.classList.remove('open'), e.previousElementSibling.classList.remove('active'));
            }),
            t.classList.add('open'),
            s.classList.add('active'));
      }
    };
    var r = {
        mainSessionKey: 'cartSession',
        feeSessionKey: 'feeSession',
        init: function () {
          sessionStorage.getItem(this.mainSessionKey) || sessionStorage.setItem(this.mainSessionKey, JSON.stringify({ active: !0, createdAt: new Date().toISOString() }));
        },
        createFeeSession: function (e) {
          var t = { active: !0, createdAt: new Date().toISOString(), feeData: e, relatedTo: this.mainSessionKey };
          return (sessionStorage.setItem(this.feeSessionKey, JSON.stringify(t)), t);
        },
        hasFeeSession: function () {
          return null !== sessionStorage.getItem(this.feeSessionKey);
        },
        clearFeeSession: function () {
          sessionStorage.removeItem(this.feeSessionKey);
        },
        clearAllSessions: function () {
          (sessionStorage.removeItem(this.mainSessionKey), sessionStorage.removeItem(this.feeSessionKey));
        },
      },
      c = {
        items: [],
        maxItems: 6,
        sessionKey: 'cartItems',
        bvcCourseIdKey: 'bvcCourseId',
        init: function () {
          (this.loadFromSession(), this.updateAddedButtonStates(), this.updateCartCounter(), this.updateBvcCourseId(), sessionStorage.setItem('totalCredits', this.getTotalCredits().toString()));
        },
        loadFromSession: function () {
          var e = sessionStorage.getItem(this.sessionKey);
          if (e)
            try {
              this.items = JSON.parse(e);
            } catch (e) {
              (console.error('Error loading cart:', e), (this.items = []));
            }
        },
        saveToSession: function () {
          try {
            (sessionStorage.setItem(this.sessionKey, JSON.stringify(this.items)), this.updateBvcCourseId(), sessionStorage.setItem('totalCredits', this.getTotalCredits().toString()));
          } catch (e) {
            console.error('Error saving cart:', e);
          }
        },
        updateBvcCourseId: function () {
          try {
            var e = {
              coursesInCart: this.items.map(function (e) {
                return Number(e.sku);
              }),
              totalAmount: this.getTotal().toFixed(2),
              fees: this.items.reduce(function (e, t) {
                return (t.fees && (e[t.sku] = { feeData: t.fees, summary: t.feeSummary }), e);
              }, {}),
            };
            sessionStorage.setItem(this.bvcCourseIdKey, JSON.stringify(e));
          } catch (e) {
            console.error('Error updating bvcCourseId:', e);
          }
        },
        addItem: function (e) {
          return (
            !this.items.some(function (t) {
              return t.sku === e.sku;
            }) &&
            !(this.items.length >= this.maxItems) &&
            (this.items.push(e), this.items.length > 1 && r.hasFeeSession() && r.clearFeeSession(), this.saveToSession(), this.updateCartCounter(), !0)
          );
        },
        removeItem: function (e) {
          var t = this.items.length;
          return (
            (this.items = this.items.filter(function (t) {
              return t.sku !== e;
            })),
            this.items.length < t && (this.saveToSession(), this.updateAddedButtonStates(), this.updateCartCounter(), !0)
          );
        },
        getTotalCredits: function () {
          return this.items.reduce(function (e, t) {
            return e + (parseInt(t.credits) || 0);
          }, 0);
        },
        getTotal: function () {
          var e = 0;
          return (
            this.items.forEach(function (t) {
              ((e += (parseFloat(t.price) || 0) * (t.quantity || 1)), t.feeSummary && t.feeSummary.totalAmount && (e += parseFloat(t.feeSummary.totalAmount) || 0));
            }),
            e
          );
        },
        isInCart: function (e) {
          return this.items.some(function (t) {
            return t.sku === e;
          });
        },
        isCartFull: function () {
          return this.items.length >= this.maxItems;
        },
        updateAddedButtonStates: function () {
          var e = this.isCartFull(),
            t = this;
          document.querySelectorAll('.addtocartbutton').forEach(function (s) {
            var a = s.getAttribute('data-product-id'),
              n = t.isInCart(a),
              i = s.classList.contains('unavailable');
            n ? (s.classList.add('in-cart'), s.setAttribute('aria-disabled', 'true'), (s.title = 'Already in cart'), (s.textContent = 'In cart')) : i || (s.classList.remove('in-cart'), s.removeAttribute('aria-disabled'), (s.title = e ? 'Cart is full (max 6)' : ''), (s.textContent = 'Add'), s.classList.toggle('in-cart', e));
          });
        },
        updateCartCounter: function () {
          var e = document.getElementById('cartProducts');
          e && ((e.textContent = this.items.length.toString()), (e.style.display = this.items.length > 0 ? 'inline-block' : 'none'));
        },
      },
      l = {
        cart: null,
        overlay: null,
        closeButton: null,
        cartItemsContainer: null,
        totalAmount: null,
        cartMessage: null,
        init: function () {
          ((this.cart = document.querySelector('.sliding-cart')), (this.overlay = document.querySelector('.cart-overlay')), (this.closeButton = document.querySelector('.cart-close')), (this.cartItemsContainer = document.querySelector('.cart-items')), (this.totalAmount = document.querySelector('.total-amount')), (this.cartMessage = document.querySelector('.cart-message')));
        },
      },
      d = function (e, t) {
        var s = document.createElement('div');
        ((s.className = 'notification notification-' + t),
          (s.textContent = e),
          document.body.appendChild(s),
          setTimeout(function () {
            s.remove();
          }, 3e3));
      },
      u = {
        sessionKey: 'unavailableCourses',
        init: function () {
          sessionStorage.getItem(this.sessionKey) || sessionStorage.setItem(this.sessionKey, JSON.stringify([]));
        },
        markAsUnavailable: function (e) {
          var t = this.get();
          -1 === t.indexOf(e) && (t.push(e), sessionStorage.setItem(this.sessionKey, JSON.stringify(t)));
        },
        isUnavailable: function (e) {
          return -1 !== this.get().indexOf(e);
        },
        get: function () {
          return JSON.parse(sessionStorage.getItem(this.sessionKey) || '[]');
        },
      };
    (m().catch(function () {}), 'loading' === document.readyState ? document.addEventListener('DOMContentLoaded', D) : D());
  }
  function m(e) {
    if (!e) {
      var t = s.getToken();
      if (t && !s.isTokenExpired()) return Promise.resolve(t);
    }
    return (
      (n && !e) ||
        (n = a()
          .then(function (e) {
            return (s.setToken(e), console.log('[Token] Stored in browser memory (sessionStorage).'), (n = null), e);
          })
          .catch(function (e) {
            throw ((n = null), console.error('[Token] Failed to obtain token:', e), e);
          })),
      n
    );
  }
  function v(e) {
    if (!e) return 'N/A';
    var t = e.replace(/[{}\-]/g, '').toUpperCase();
    return i[t] || e;
  }
  function f(e) {
    if (!e) return '';
    var t = e.substring(0, 4),
      s = e.substring(4, 6),
      a = e.substring(6, 8);
    return new Date(t, s - 1, a).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function p(e) {
    return Array.isArray(e.timeBlocks) && e.timeBlocks.length
      ? '<div class="timeblock-info"><div class="detail-label">Schedule</div><div class="timeblock-details">' +
          e.timeBlocks
            .map(function (e) {
              var t = (function (e) {
                if (!e) return { day: '', hours: '' };
                var t = e.trim().split(/\s+/);
                return { day: o[t[0]] || t[0], hours: t.slice(1).join(' ') };
              })(e.schedule);
              return '<div><span class="productdays">' + t.day + '</span>:<br/><span class="producthours">' + t.hours + '</span></div>';
            })
            .join('') +
          '</div></div>'
      : '';
  }
  function y(e, t, s) {
    var a = Math.random().toString(36).substr(2, 9),
      n = (function (e) {
        var t = Array.isArray(e.timeBlocks)
          ? e.timeBlocks.filter(function (e) {
              return e.startTime;
            })
          : [];
        if (0 === t.length) return { start: e.startDate, end: e.endDate };
        var s = t
            .map(function (e) {
              return e.startTime;
            })
            .sort(),
          a = t
            .map(function (e) {
              return e.endTime;
            })
            .filter(Boolean)
            .sort();
        return { start: s[0], end: a.length ? a[a.length - 1] : e.endDate };
      })(e),
      i = f(n.start),
      o = f(n.end),
      r = (e.fees && e.fees.domestic && e.fees.domestic.amount) || 0,
      c = (e.fees && e.fees.domestic && e.fees.domestic.tax) || 0,
      l = parseFloat(r).toFixed(0),
      d = e.fees && e.fees.international && null != e.fees.international.amount ? e.fees.international.amount : null,
      u = null !== d ? parseFloat(d).toFixed(0) : null,
      m = v(e.deliveryType),
      y = v(e.campus),
      h = p(e),
      g = e.credits || s,
      A = e.registrationStart ? '<div class="detail-item"><div class="detail-label">Registration</div><div class="detail-value">' + f(e.registrationStart) + (e.registrationEnd ? ' &ndash; ' + f(e.registrationEnd) : '') + '</div></div>' : '';
    return '<div class="accordion-item-' + a + '"><button class="accordion-toggle" onclick="toggleAccordion(\'' + a + '\')"><div class="date-range"><span class="productdates">' + i + ' &ndash; ' + o + '</span><span class="dropdown-icon">&#9660;</span></div></button><div class="accordion-content" id="accordion-' + a + '"><span class="productlocation" style="display:none;">' + y + '</span><div class="course-details"><div class="detail-group"><div class="detail-item"><div class="detail-label">Credits</div><div class="detail-value">' + g + '</div></div><div class="detail-item"><div class="detail-label">Hours</div><div class="detail-value">' + e.hours + '</div></div>' + A + h + '</div><div class="price-section"><div class="price-info"><div class="price-display"><span class="currency">$</span><span class="price">' + l + '</span><span class="currency-code">CAD</span></div><div class="student-type">Domestic Student</div>' + (c > 0 ? '<div class="tax-note">+ $' + parseFloat(c).toFixed(2) + ' tax</div>' : '') + (null !== u ? '<div class="price-display intl" style="margin-top:8px;"><span class="currency">$</span><span class="price">' + u + '</span><span class="currency-code">CAD</span></div><div class="student-type">International Student</div>' : '') + '</div><div class="action-section"><a href="#" data-accordion-id="' + a + '" data-product-name="' + t + '" data-product-id="' + e.sisId + '" data-product-credits="' + g + '" data-quantity="1" data-product-price="' + l + '" data-product-delivery="' + m + '" class="c-button_cart addtocartbutton w-button" tabindex="0">Add</a><p class="additional-fees">Additional fees apply</p></div></div></div></div></div>';
  }
  function h(e, t, s) {
    var a = (function (e) {
        var t = {};
        return (
          e.forEach(function (e) {
            var s = v(e.deliveryType),
              a = v(e.campus);
            (t[s] || (t[s] = {}), t[s][a] || (t[s][a] = []), t[s][a].push(e));
          }),
          t
        );
      })(
        e.slice().sort(function (e, t) {
          var s = function (e) {
            return new Date(e.startDate.substring(0, 4), e.startDate.substring(4, 6) - 1, e.startDate.substring(6, 8));
          };
          return s(e) - s(t);
        }),
      ),
      n = '';
    return (
      Object.keys(a).forEach(function (e) {
        n += '<div class="course-offering"><h3 class="offering-title">' + e + '</h3>';
        var i = a[e];
        (Object.keys(i).forEach(function (e) {
          n +=
            '<div class="offering-location"><h4 class="location-title">' +
            e +
            '</h4><div class="date-label">START / END DATE</div>' +
            i[e]
              .map(function (e) {
                return y(e, t, e.credits || s);
              })
              .join('') +
            '</div>';
        }),
          (n += '</div>'));
      }),
      n
    );
  }
  function g() {
    (l.cart.classList.add('open'), l.overlay.classList.add('open'), c.isCartFull() ? ((l.cartMessage.textContent = 'Maximum number of products (6) has been reached.'), l.cartMessage.classList.add('visible')) : l.cartMessage.classList.remove('visible'));
  }
  function A() {
    (l.cart.classList.remove('open'), l.overlay.classList.remove('open'));
  }
  function C() {
    var e = document.createDocumentFragment();
    (c.items.forEach(function (t) {
      var s = document.createElement('div');
      s.className = 'cart-item';
      var a =
        t.timeblocks && t.timeblocks.length > 0
          ? '<div class="cart-item-info"><span style="font-weight:600;">Schedule:</span></div>' +
            t.timeblocks
              .map(function (e) {
                return '<div class="cart-item-info" style="padding-left:20px;">• ' + e.day + ': ' + e.hours + '</div>';
              })
              .join('')
          : '<div class="cart-item-info"><span style="font-weight:600;">Days:</span> ' + (t.productdays || 'Not specified') + '</div><div class="cart-item-info"><span style="font-weight:600;">Hours:</span> ' + (t.producthours || 'Not specified') + '</div>';
      ((s.innerHTML = '<button class="remove-item" data-sku="' + t.sku + '">Remove</button><div class="cart-item-details"><div><strong>' + (t.productName || t.sku) + '</strong></div><div class="cart-item-info"><span style="font-weight:600;">Credits: </span> ' + t.credits + '</div><div class="cart-item-info"><span style="font-weight:600;">Tuition:</span> $' + t.price + ' x ' + t.quantity + '</div><div class="cart-item-info"><span style="font-weight:600;">Delivery:</span> ' + (t.productDelivery || 'Standard') + '</div><div class="cart-item-info"><span style="font-weight:600;">Dates:</span> ' + (t.productdates || 'Not specified') + '</div>' + a + '<div class="cart-item-info"><span style="font-weight:600;">Location:</span> ' + (t.productlocation || 'Not specified') + '</div></div>'), e.appendChild(s));
    }),
      (l.cartItemsContainer.innerHTML = ''),
      l.cartItemsContainer.appendChild(e));
    var t = sessionStorage.getItem('feeSession'),
      s = t ? JSON.parse(t) : null,
      a = s && s.feeData && s.feeData.fees ? s.feeData.fees : [],
      n = s && s.feeData && s.feeData.summary ? s.feeData.summary : { totalAmount: 0, totalTax: 0, grandTotal: 0 };
    if (a.length > 0) {
      var i = document.createElement('div');
      i.className = 'cart-shared-fees';
      var o = '<hr><div class="cart-item-info"><strong>Additional fees:</strong></div>';
      (a.forEach(function (e) {
        ((o += '<div class="cart-item-info fee-item">• ' + e.description + ': $' + e.amount.toFixed(2)), e.tax && e.tax > 0 && (o += ' + $' + e.tax.toFixed(2) + ' tax'), (o += '</div>'));
      }),
        (o += '<div class="cart-item-info"><strong>Total Fees:</strong> $' + n.totalAmount.toFixed(2) + '</div>'),
        (i.innerHTML = o),
        l.cartItemsContainer.appendChild(i));
    }
    var r = c.items.reduce(function (e, t) {
        return e + parseFloat(t.price) * t.quantity;
      }, 0),
      d = r + n.totalAmount + n.totalTax,
      u = document.createElement('div');
    ((u.className = 'cart-summary'), (u.innerHTML = '<hr /><div class="cart-item-info"><strong>Subtotal:</strong> $' + r.toFixed(2) + '</div><div class="cart-item-info"><strong>Additional Fees:</strong> $' + n.totalAmount.toFixed(2) + '</div><div class="cart-item-info"><strong>Tax:</strong> $' + n.totalTax.toFixed(2) + '</div>'), l.cartItemsContainer.appendChild(u), (l.totalAmount.textContent = d.toFixed(2)));
  }
  async function F(e) {
    e.preventDefault();
    var t = e.currentTarget;
    if (!t.classList.contains('in-cart') && !t.classList.contains('unavailable')) {
      if (c.isCartFull()) return (d('Maximum number of products (6) has been reached', 'error'), void g());
      t.classList.add('loading');
      try {
        var s = await m(),
          a = (function (e) {
            var t = e.getAttribute('data-accordion-id'),
              s = e.getAttribute('data-product-id');
            if (!s) throw new Error('Product ID not found');
            var a = { sku: s, quantity: parseInt(e.getAttribute('data-quantity') || '1'), price: parseFloat(e.getAttribute('data-product-price') || '0'), productName: e.getAttribute('data-product-name') || '', productDelivery: e.getAttribute('data-product-delivery') || '', credits: e.getAttribute('data-product-credits') || '', productdays: '', productdates: '', producthours: '', productlocation: '', timeblocks: [] },
              n = document.querySelector('.accordion-item-' + t);
            if (n) {
              var i = n.querySelector('.timeblock-details');
              if (
                (i &&
                  i.querySelectorAll('div').forEach(function (e) {
                    var t = e.querySelector('.productdays'),
                      s = e.querySelector('.producthours');
                    t && s && a.timeblocks.push({ day: t.innerText.trim(), hours: s.innerText.trim() });
                  }),
                0 === a.timeblocks.length)
              ) {
                var o = n.querySelector('.productdays'),
                  r = n.querySelector('.producthours');
                (o && (a.productdays = o.innerText), r && (a.producthours = r.innerText));
              } else ((a.productdays = a.timeblocks[0].day), (a.producthours = a.timeblocks[0].hours));
              var c = n.querySelector('.productdates');
              c && (a.productdates = c.innerText);
              var l = n.querySelector('.productlocation');
              l && (a.productlocation = l.innerText);
            }
            return a;
          })(t);
        if (u.isUnavailable(a.sku)) return void d('This date is not available', 'error');
        var n = await S(a.sku, s);
        if ((401 === n.status && ((s = await m(!0)), (n = await S(a.sku, s))), 200 === n.status)) {
          if (!n.data || !n.data.seatsAreAvailable) return (u.markAsUnavailable(a.sku), t.classList.add('unavailable'), void d('No seats available for this date', 'error'));
          if (c.addItem(a)) {
            c.updateAddedButtonStates();
            var i = c.items.map(function (e) {
              return e.sku;
            });
            try {
              (await B(i, s), C(), g(), d('Item added to cart!', 'success'));
            } catch (e) {
              (console.error('Error checking fees:', e), C(), g(), d('Item added to cart! (Fee calculation pending)', 'warning'));
            }
          } else d('Item is already in your cart', 'error');
        } else {
          if (404 !== n.status) throw new Error('Failed to check course availability (status ' + n.status + ')');
          (u.markAsUnavailable(a.sku), t.classList.add('unavailable'), d('This date is not available', 'error'));
        }
      } catch (e) {
        (console.error('Error in handleAddToCart:', e), d(e.message, 'error'));
      } finally {
        t.classList.remove('loading');
      }
    }
  }
  async function S(e, s) {
    var a = 'thesissitecorexm.api/courseofferings/' + e,
      n = await fetch(t + '/api/bvcpayment?endpoint=' + encodeURIComponent(a), { method: 'GET', mode: 'cors', headers: { Authorization: 'Bearer ' + s, 'Content-Type': 'application/json', Accept: 'application/json' } }),
      i = await n.json().catch(function () {
        return null;
      });
    return (console.log('[API] Availability', e, '-> status', n.status), { status: n.status, data: i });
  }
  async function B(e, s) {
    var a = e;
    if (
      ((Array.isArray(a) && 0 !== a.length) ||
        (a = c.items.map(function (e) {
          return e.sku;
        })),
      0 === a.length)
    )
      return { status: 400, feeData: [], summary: { totalAmount: 0, totalTax: 0, grandTotal: 0, feeCount: 0 } };
    var n = 'thesissitecorexm.api/fee/' + a.join(',') + '/null',
      i = await fetch(t + '/api/bvcpayment?endpoint=' + encodeURIComponent(n), { method: 'GET', mode: 'cors', headers: { Authorization: 'Bearer ' + s, 'Content-Type': 'application/json' } });
    if (!i.ok) throw new Error('Fee API returned status ' + i.status);
    var o = await i.json(),
      l = o.reduce(function (e, t) {
        return e + (t.amount || 0);
      }, 0),
      d = o.reduce(function (e, t) {
        return e + (t.tax || 0);
      }, 0);
    (c.items.forEach(function (e) {
      var t = o.filter(function (t) {
        return t.courseSku === e.sku;
      });
      ((e.fees = t),
        (e.feeSummary = {
          totalAmount: t.reduce(function (e, t) {
            return e + (t.amount || 0);
          }, 0),
          totalTax: t.reduce(function (e, t) {
            return e + (t.tax || 0);
          }, 0),
          grandTotal: t.reduce(function (e, t) {
            return e + (t.amount || 0) + (t.tax || 0);
          }, 0),
        }));
    }),
      c.saveToSession());
    var u = { status: i.status, feeData: o, summary: { totalAmount: l, totalTax: d, grandTotal: l + d, feeCount: o.length } };
    return (r.createFeeSession({ courseIds: a.join(','), fees: o, summary: u.summary, timestamp: new Date().toISOString() }), u);
  }
  async function E(e, t) {
    var s = await fetch(e + '/data/open-studies/index.json', { mode: 'cors' }),
      a = s.ok ? await s.json() : null,
      n = null;
    a &&
      (a.categories || []).forEach(function (e) {
        (e.courses || []).forEach(function (e) {
          (e.slug !== t && e.sisId !== t) || (n = e);
        });
      });
    var i = (n && n.sisId) || t;
    return {
      data: await (async function (e) {
        var t = await fetch(e, { mode: 'cors' });
        if (!t.ok) throw new Error('HTTP ' + t.status + ': ' + t.statusText);
        return t.json();
      })(e + '/data/oScourses/course-' + encodeURIComponent(i) + '.json'),
      pdfFilename: n ? n.pdfFilename : null,
    };
  }
  function b(e) {
    (e.querySelectorAll('.addtocartbutton').forEach(function (e) {
      e.addEventListener('click', F);
    }),
      c.updateAddedButtonStates(),
      (async function (e) {
        var t = e.querySelectorAll('.addtocartbutton');
        if (0 !== t.length) {
          var s,
            a = e.querySelector('.enrollment-section');
          a && ((a.style.position = 'relative'), ((s = document.createElement('div')).className = 'availability-loading-overlay'), (s.innerHTML = '<div class="availability-spinner"></div><div>Checking availability…</div>'), a.appendChild(s));
          try {
            var n;
            try {
              n = await m();
            } catch (e) {
              return void console.warn('[Availability] No token — skipping availability sweep.');
            }
            for (var i = 0; i < t.length; i++) {
              var o = t[i],
                r = o.getAttribute('data-product-id');
              if (r && !c.isInCart(r))
                try {
                  var l = await S(r, n);
                  if ((401 === l.status && ((n = await m(!0)), (l = await S(r, n))), 200 === l.status && l.data && l.data.seatsAreAvailable)) (o.classList.remove('unavailable'), (o.title = ''), (o.textContent = 'Add'));
                  else {
                    u.markAsUnavailable(r);
                    var d = e.querySelector('.accordion-item-' + o.getAttribute('data-accordion-id'));
                    d && (d.style.display = 'none');
                  }
                } catch (e) {
                  console.warn('Availability check failed for ' + r, e);
                }
            }
            (e.querySelectorAll('.offering-location').forEach(function (e) {
              var t = e.querySelectorAll('[class^="accordion-item-"]');
              Array.prototype.every.call(t, function (e) {
                return 'none' === e.style.display;
              }) && (e.style.display = 'none');
            }),
              e.querySelectorAll('.course-offering').forEach(function (e) {
                var t = e.querySelectorAll('.offering-location');
                Array.prototype.every.call(t, function (e) {
                  return 'none' === e.style.display;
                }) && (e.style.display = 'none');
              }));
            var v = e.querySelectorAll('.course-offering'),
              f = e.querySelectorAll('.course-offering[style*="display: none"]');
            if (v.length > 0 && v.length === f.length) {
              var p = e.querySelector('.enrollment-header');
              p && p.insertAdjacentHTML('afterend', '<p class="no-sections">No sections currently available.</p>');
            }
          } catch (e) {
            console.error('Error during availability check:', e);
          } finally {
            s && s.remove();
          }
        }
      })(e));
  }
  async function D() {
    console.log('[Init] Starting OS Course initialisation...');
    var t = document.getElementById('courseComponent');
    if (t) {
      (document.getElementById('os-course-styles') || document.querySelector('link[href*="os-course.css"]') || console.warn('[Init] os-course.css not detected. Load it via <link href=".../css/os-course.css"> or a <style id="os-course-styles"> block, or the component will not be styled.'),
        document.querySelector('.sliding-cart') || document.body.insertAdjacentHTML('beforeend', '<div class="cart-overlay"></div><div class="sliding-cart"><span class="cart-close">&times;</span><h2>Shopping Cart</h2><div class="cart-items"></div><div class="cart-total">Total: $<span class="total-amount">0.00</span></div><div class="cart-message"></div><button class="checkout-button">Proceed to Checkout</button></div>'),
        l.init(),
        r.init(),
        u.init(),
        c.init(),
        C(),
        l.closeButton.addEventListener('click', A),
        l.overlay.addEventListener('click', A),
        l.cartItemsContainer.addEventListener('click', function (e) {
          e.target.matches('.remove-item') &&
            (async function (e) {
              try {
                if ((c.removeItem(e), 0 === c.items.length))
                  (r.clearAllSessions(),
                    ['cartItems', 'totalCredits', 'bvcCourseId', 'courseFees'].forEach(function (e) {
                      sessionStorage.removeItem(e);
                    }),
                    C(),
                    d('Your cart is now empty.', 'success'),
                    l.cartMessage.classList.remove('visible'));
                else {
                  try {
                    var t = await m();
                    (await B(
                      c.items.map(function (e) {
                        return e.sku;
                      }),
                      t,
                    ),
                      C(),
                      d('Item removed from cart', 'success'));
                  } catch (e) {
                    (console.error('Failed to update fees after removal:', e), C(), d('Item removed, but could not update fees.', 'warning'));
                  }
                  l.cartMessage.classList.toggle('visible', c.isCartFull());
                }
                c.updateAddedButtonStates();
              } catch (e) {
                (console.error('Error removing item:', e), d('Failed to remove item from cart', 'error'));
              }
            })(e.target.dataset.sku);
        }),
        document.querySelector('.checkout-button').addEventListener('click', function () {
          c.items.length > 0 ? (window.location.href = '../cart-checkout?type=os') : d('Your cart is empty', 'error');
        }));
      var s = document.querySelector('.opencartbutton');
      if ((s && s.addEventListener('click', g), console.log('[Init] Cart infrastructure ready'), t.querySelector('.addtocartbutton'))) return (console.log('[Init] Server-rendered offerings found — binding directly.'), void b(t));
      var a,
        n,
        o,
        v,
        f,
        p,
        y = (function () {
          var e = document.getElementById('courseComponent'),
            t = e && e.getAttribute('data-sisid');
          if (t && t.trim()) return t.trim();
          var s = window.location.pathname.replace(/\/$/, '').split('/');
          return s[s.length - 1] || '';
        })();
      if (y)
        try {
          var F = (
            await Promise.all([
              E(e, y),
              fetch(e + '/data/sis-data-lookup.json', { mode: 'cors' })
                .then(function (e) {
                  return e.ok ? e.json() : null;
                })
                .then(function (e) {
                  if (e) {
                    var t = (e.lookups && e.lookups.deliveryTypes && e.lookups.deliveryTypes.byId) || {},
                      s = (e.lookups && e.lookups.campuses && e.lookups.campuses.byId) || {};
                    (Object.keys(t).forEach(function (e) {
                      i[e.toUpperCase()] = t[e].displayName || t[e].name;
                    }),
                      Object.keys(s).forEach(function (e) {
                        i[e.toUpperCase()] = s[e].displayName || s[e].name;
                      }));
                  }
                })
                .catch(function () {}),
            ])
          )[0];
          ((t.innerHTML = ((a = F.data), (n = F.pdfFilename), (o = a.name || ''), (v = a.description || ''), (f = Number(a.credits || 0)), (p = Array.isArray(a.sections) ? a.sections : []), '<div class="course-page-grid"><div class="course-info-col">' + (f > 0 ? '<div class="c-course_credits"><div class="c-course_credits-box"><div class="c-course_credits-txt">' + f + '</div><div>Credits</div></div></div>' : '') + (v ? '<h2 class="c-course__col1">Course Description</h2><div class="w-richtext"><p>' + v + '</p></div>' : '') + (n ? '<div class="course-pdf-section"><a class="course-pdf-link" href="' + e + '/data/course-outlines-pdf/' + encodeURIComponent(n) + '" target="_blank" rel="noopener">Download Course Outline (PDF)</a></div>' : '') + '</div><div class="course-offers-col">' + (p.length > 0 ? '<div class="enrollment-section"><div class="enrollment-header">Enroll now</div>' + h(p, o, f) + '</div>' : '<p class="no-sections">No sections currently available.</p>') + '</div></div>')), b(t), console.log('[Init] Built from JSON. Done.'));
        } catch (e) {
          (t.insertAdjacentHTML('beforeend', '<p style="color:red;">Failed to load course data: ' + e.message + '</p>'), console.error('[bvc-os-course]', e));
        }
      else t.innerHTML = '<p style="color:red;">Course ID not found in URL.</p>';
    } else console.warn('[Init] #courseComponent not found');
  }
})();
