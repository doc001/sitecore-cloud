/**
 * Extended Education course cards — SOURCE
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE. Do not edit public/js/ee-listing.js (generated).
 *
 *   Build : npm run js:build      (esbuild -> public/js/ee-listing.js)
 *   Watch : npm run js:watch      (rebuild on save)
 *
 * Loaded once from the "Before </head>" custom code of
 * /study/extended-education — no Embed block, and no paired stylesheet:
 *   <script src="https://bvc-app.vercel.app/js/ee-listing.js"></script>
 *
 * WHAT IT DOES
 * Takes the Courses grid down to what a shopper can actually register for.
 * /data/extended-education-courses.json decides which courses belong on the
 * page; every course it marks unavailable is removed. Webflow renders a card
 * whenever an editor publishes a CMS record, which says nothing about whether
 * the SIS has a section to sell — 21 of the 60 published records currently do
 * not, so a third of the grid led to a course nobody could register for.
 *
 * ── WHY IT REMOVES CARDS RATHER THAN RE-RENDERING THEM ──────────────────────
 * The first cut of this script rebuilt the grid from the JSON, emitting cards
 * that copied Webflow's classes and Finsweet attributes exactly. It looked
 * right and it broke the page's filters. Measured against production:
 *
 *   fsAttributes.destroy() + init()   counters updated; search and the Area
 *                                     checkboxes stopped filtering entirely.
 *   CMSList clearItems() + addItems() counters updated; cmsfilter stopped
 *                                     recomputing — ticking "Business" left
 *                                     all 38 items valid instead of 15.
 *   pruning CMSList.items in place    filtering intact: "Business" -> 15 valid
 *                                     of 38, matching the 15 cards on screen.
 *
 * Finsweet holds each card as a CMSItem with props it derived at index time.
 * Substituted elements lose that association no matter how identical the
 * markup; the original elements keep it. So the JSON stays the authority on
 * *which* courses appear, and Webflow's own elements are reused for the ones
 * that stay. Since every available course currently has a Webflow card, the
 * two approaches put the identical set on the page — one of them just also
 * keeps search, sort and the Area filter working.
 *
 * renderCard() below still builds a card from the JSON, for courses the SIS
 * can sell that have no Webflow record. There are none today; it is off by
 * default (renderMissing) precisely because such a card is the one element on
 * the page Finsweet would not have indexed.
 *
 * ── FAIL-OPEN ───────────────────────────────────────────────────────────────
 * A card is only removed when the dataset positively says that course is
 * unavailable. A card the dataset has never heard of is left alone: this
 * script's job is to hide what is known to be unsellable, not to hide
 * everything it cannot explain.
 *
 * CONFIG — set BEFORE this script loads:
 *   window.__EE_LISTING_CONFIG__ = {
 *     dataOrigin: '',        // where /data/*.json lives; defaults to this script's origin
 *     mount: '',             // CSS selector for the Courses list, if detection is wrong
 *     coursePageOrigin: '',  // prefix for links on appended cards; default site-relative
 *     renderMissing: false,  // append cards for sellable courses with no Webflow record
 *     showUnavailable: false,// true keeps every card, for debugging
 *     pagePattern: null,     // RegExp the pathname must match; null disables the guard
 *     revealMs: 6000         // failsafe: never leave the list hidden longer than this
 *   };
 *
 * Data is produced by scripts/buildExtendedEducationCourses.mjs:
 *   /data/extended-education-courses.json
 * ---------------------------------------------------------------------------
 */
import { showResultPopup, readSubmissionOutcome } from '../shared/interest-form.js';

(function () {
  'use strict';

  // The interest form on a course page posts to ClickDimensions, which redirects
  // the shopper BACK to this page with ?m=success or ?m=error. This is the only
  // script that runs here, so it owns showing the outcome. It runs before the
  // card-pruning work below and is independent of it — a popup must still appear
  // if the grid is missing or the dataset fails to load.
  (function showInterestOutcome() {
    try {
      var outcome = readSubmissionOutcome();
      if (!outcome) return;
      function show() {
        showResultPopup(outcome);
        // Drop the marker so a refresh or a back-navigation does not replay the
        // popup, and so the URL the shopper may copy is the clean listing page.
        try {
          var url = new URL(window.location.href);
          ['m', 'm-error', 'm-success'].forEach(function (key) {
            url.searchParams.delete(key);
          });
          window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash);
        } catch (error) {
          /* replaceState is cosmetic; never let it stop the popup */
        }
      }
      if ('loading' === document.readyState) document.addEventListener('DOMContentLoaded', show);
      else show();
    } catch (error) {
      console.warn('[EEListing] Could not show the submission outcome', error);
    }
  })();

  if (window.__bvcEeListingLoaded) {
    console.warn('[EEListing] Already initialised — skipping duplicate load.');
    return;
  }
  window.__bvcEeListingLoaded = true;

  var CFG = window.__EE_LISTING_CONFIG__ || {};

  var FALLBACK_ORIGIN = __DATA_ORIGIN__;
  var DATA_PATH = '/data/extended-education-courses.json';

  // Only this page has a Courses grid to trim. The script is safe to load
  // site-wide — findList() would not match anything else — but the guard means
  // it does not even fetch on other pages. Set pagePattern to null to disable.
  var PAGE_PATTERN = CFG.pagePattern === undefined
    ? /\/study\/extended-education\/?$/i
    : CFG.pagePattern;

  // Preferred mount: a custom attribute the editor adds to the Courses
  // collection list in the Designer. It is present the instant the opening tag
  // is parsed, so the list is hidden before its stale cards can paint. The
  // Finsweet selector is the fallback and only resolves once a course link has
  // streamed in, which is a few milliseconds later.
  var EXPLICIT_SELECTOR = '[data-bvc-ee-listing]';
  var LIST_SELECTOR = '[fs-cmsfilter-element="list"], [fs-cmsload-element="list"], .w-dyn-items';

  // Site-relative, so course links follow whichever host serves the page —
  // production, UAT, or a webflow.io preview.
  var COURSE_PAGE_PREFIX = '/extended-education/';
  // The Certificates grid on the same page carries identical Finsweet
  // attributes; only the hrefs tell the two apart. Certificate links live under
  // /extended-education-certificate/, which does not match this prefix.
  var COURSE_LINK_SELECTOR = 'a[href*="' + COURSE_PAGE_PREFIX + '"]';
  var SLUG_PATTERN = /\/extended-education\/([^\/?#]+)/;

  var ITEM_SELECTOR = '.w-dyn-item';
  var STATE_ATTR = 'data-bvc-ee-state';

  // document.currentScript is only readable while the script executes, so the
  // origin is captured here rather than inside init().
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';

  /* ── helpers ──────────────────────────────────────────────────────── */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function trimSlash(url) {
    return String(url || '').trim().replace(/\/+$/, '');
  }

  /**
   * Where the JSON lives. Deriving it from this script's own URL is what keeps
   * the Webflow page and a future all-on-Vercel deployment working from the
   * same source: today it resolves to bvc-app.vercel.app, and once the site is
   * served from one origin it resolves to that origin instead.
   */
  function resolveOrigin() {
    if (CFG.dataOrigin != null) return trimSlash(CFG.dataOrigin);
    if (SCRIPT_SRC) {
      try {
        return trimSlash(new URL(SCRIPT_SRC, window.location.href).origin);
      } catch (err) {
        /* fall through */
      }
    }
    return FALLBACK_ORIGIN;
  }

  /**
   * The only styling this script owns: hide the list while the unavailable
   * cards are being taken out. It has to be in the document synchronously — a
   * linked stylesheet arrives over the network, by which point the cards it is
   * meant to hide have already painted.
   */
  function injectHidingRule() {
    if (document.getElementById('bvc-ee-listing-hide')) return;
    var style = document.createElement('style');
    style.id = 'bvc-ee-listing-hide';
    // visibility, not display: the grid keeps its height, so trimming the
    // cards does not shift the rest of the page.
    style.textContent = '[' + STATE_ATTR + '="loading"]{visibility:hidden}';
    (document.head || document.documentElement).appendChild(style);
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      return res.json();
    });
  }

  /* ── finding the Courses list ─────────────────────────────────────── */

  function isCoursesList(el) {
    if (!el) return false;
    if (el.matches(EXPLICIT_SELECTOR)) return true;
    var link = el.querySelector(COURSE_LINK_SELECTOR);
    if (!link) return false;
    // getAttribute, not .href — the DOM property resolves to an absolute URL,
    // and /extended-education-certificate/x contains neither form of the
    // prefix, but a same-named path on another host would.
    return (link.getAttribute('href') || '').indexOf(COURSE_PAGE_PREFIX) !== -1;
  }

  function findList() {
    if (CFG.mount) {
      var configured = document.querySelector(CFG.mount);
      if (configured) return configured;
    }
    var explicit = document.querySelector(EXPLICIT_SELECTOR);
    if (explicit) return explicit;

    var candidates = document.querySelectorAll(LIST_SELECTOR);
    for (var i = 0; i < candidates.length; i++) {
      if (isCoursesList(candidates[i])) return candidates[i];
    }
    return null;
  }

  /**
   * Resolves as soon as the list exists — during parsing if possible, so the
   * hiding rule lands before the stale cards paint. Falls back to a final look
   * at DOMContentLoaded, which is also the point where "the list is simply not
   * on this page" becomes a definite answer rather than a not-yet.
   */
  function whenListReady() {
    return new Promise(function (resolve) {
      var found = findList();
      if (found) return resolve(found);

      var settled = false;
      function finish(el) {
        if (settled) return;
        settled = true;
        observer.disconnect();
        document.removeEventListener('DOMContentLoaded', onReady);
        resolve(el);
      }

      var observer = new MutationObserver(function () {
        var el = findList();
        if (el) finish(el);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });

      function onReady() { finish(findList()); }
      document.addEventListener('DOMContentLoaded', onReady);
    });
  }

  /* ── matching cards to the dataset ────────────────────────────────── */

  /**
   * Cards are matched on the slug in their course link, not on the course code.
   * The three externally-registered courses (PSKN, the two PMI ones) have no
   * code at all — Webflow renders an empty <p class="w-dyn-bind-empty"> — so a
   * code match would fail to identify exactly the cards that must be kept.
   * Slugs are unique in Webflow and always present.
   */
  function slugOf(value) {
    var match = SLUG_PATTERN.exec(String(value || ''));
    return match ? decodeURIComponent(match[1]).toLowerCase() : '';
  }

  function cardSlug(card) {
    var link = card.querySelector(COURSE_LINK_SELECTOR);
    return link ? slugOf(link.getAttribute('href')) : '';
  }

  /* ── rendering (only for courses Webflow has no card for) ─────────── */

  function coursePageUrl(course) {
    if (!course.pageUrl) return '';
    var origin = CFG.coursePageOrigin ? trimSlash(CFG.coursePageOrigin) : '';
    return origin + course.pageUrl;
  }

  /**
   * Mirrors the Webflow-rendered card exactly, including how Webflow marks an
   * unbound field (.w-dyn-bind-empty) and hides the cart glyph on courses
   * registered on a third party's site (.w-condition-invisible). Reproducing
   * those classes rather than omitting the elements is what lets the page's own
   * CSS — which this script never touches — lay the card out identically.
   */
  function renderCard(course) {
    var url = coursePageUrl(course);
    var area = course.area
      ? '<p fs-cmssort-field="area" fs-cmsfilter-field="Program area" class="su">' + escapeHtml(course.area) + '</p>'
      : '<p fs-cmssort-field="area" fs-cmsfilter-field="Program area" class="su w-dyn-bind-empty"></p>';

    var name = url
      ? '<a fs-cmssort-field="name" href="' + escapeHtml(url) + '" class="c-program-name__text">'
        + escapeHtml(course.name) + '</a>'
      : '<div fs-cmssort-field="name" class="c-program-name__text">' + escapeHtml(course.name) + '</div>';

    var code = course.code
      ? '<p>' + escapeHtml(course.code) + '</p>'
      : '<p class="w-dyn-bind-empty"></p>';

    var description = course.description
      ? '<p class="paragraph">' + escapeHtml(course.description) + '</p>'
      : '<p class="paragraph w-dyn-bind-empty"></p>';

    var cartIcon = '<div class="button-icon-left' + (course.showCartIcon ? '' : ' w-condition-invisible')
      + '">shopping_cart</div>';

    var button = url
      ? '<div class="div-block-45"><a href="' + escapeHtml(url) + '" class="button-wrapper-blue w-inline-block">'
        + cartIcon + '<div class="c-button__text">View course</div></a></div>'
      : '';

    return '<div role="listitem" class="c-collection-item-36vw w-dyn-item">'
      + area + name + code + description + button
      + '</div>';
  }

  /* ── Finsweet ─────────────────────────────────────────────────────── */

  /**
   * The CMSList instance holding this element, if Finsweet has already indexed
   * it. Resolves to null when Finsweet is absent or has not settled — and null
   * needs no handling, because Finsweet then indexes whatever is left in the
   * DOM by the time it does run.
   *
   * The instances are only reachable through each module's `loading` promise;
   * there is no synchronous handle to them. A module that has not settled is
   * skipped rather than awaited, so a slow Finsweet boot cannot hold the stale
   * cards on screen.
   */
  function cmsListFor(element) {
    var fsa = window.fsAttributes;
    if (!fsa || Array.isArray(fsa)) return Promise.resolve(null);

    // `resolve` is deleted once a module settles, so its presence means the
    // module is still booting and its instances do not exist yet.
    var settled = ['cmsfilter', 'cmsload', 'cmssort'].filter(function (name) {
      var mod = fsa[name];
      return mod && mod.loading && !mod.resolve;
    });
    if (!settled.length) return Promise.resolve(null);

    return Promise.all(settled.map(function (name) {
      return Promise.resolve(fsa[name].loading).catch(function () { return []; });
    })).then(function (groups) {
      for (var i = 0; i < groups.length; i++) {
        var instances = groups[i] || [];
        for (var j = 0; j < instances.length; j++) {
          var listInstance = instances[j].listInstance || instances[j];
          if (listInstance && listInstance.list === element) return listInstance;
        }
      }
      return null;
    }).catch(function () { return null; });
  }

  /**
   * Drop the removed cards from the CMSList's own bookkeeping so cmsfilter,
   * cmssort and the counters all agree with the DOM. Filtering the arrays in
   * place is deliberate: every surviving CMSItem keeps the props Finsweet
   * derived for it, which is the thing that breaks when items are substituted.
   */
  function pruneCmsList(listInstance, keptElements) {
    if (!listInstance) return false;
    var kept = keptElements;
    var survives = function (item) {
      return item && item.element && kept.indexOf(item.element) !== -1;
    };
    try {
      if (listInstance.items) listInstance.items = listInstance.items.filter(survives);
      if (listInstance.validItems) listInstance.validItems = listInstance.validItems.filter(survives);
      if (listInstance.originalItemsOrder) {
        listInstance.originalItemsOrder = listInstance.originalItemsOrder.filter(survives);
      }
      return true;
    } catch (err) {
      console.warn('[EEListing] Could not update the Finsweet item list; its counters may be stale.', err);
      return false;
    }
  }

  /**
   * The "Showing N results of N items" counters are rendered by Finsweet from
   * the item count it had at index time, and it does not re-render them just
   * because the list shrank. Left alone they would claim 60 items over a grid
   * of 39. Finsweet overwrites these the next time it filters, using its own
   * now-pruned items, so this only has to be right until then.
   */
  function syncCounters(count) {
    ['results-count', 'items-count'].forEach(function (name) {
      var els = document.querySelectorAll('[fs-cmsfilter-element="' + name + '"]');
      for (var i = 0; i < els.length; i++) els[i].textContent = String(count);
    });
  }

  /* ── boot ─────────────────────────────────────────────────────────── */

  function trim(list, data) {
    var courses = (data && data.courses) || [];
    var bySlug = {};
    courses.forEach(function (course) {
      if (course && course.slug) bySlug[String(course.slug).toLowerCase()] = course;
    });

    var cards = Array.prototype.slice.call(list.querySelectorAll(ITEM_SELECTOR));
    var kept = [];
    var dropped = [];
    var unknown = [];

    cards.forEach(function (card) {
      var slug = cardSlug(card);
      var course = slug ? bySlug[slug] : null;
      if (!course) {
        // Nothing in the dataset says this course is unsellable, so it stays.
        unknown.push(slug || '(no course link)');
        kept.push(card);
        return;
      }
      if (course.available || CFG.showUnavailable) kept.push(card);
      else dropped.push({ card: card, course: course });
    });

    dropped.forEach(function (entry) { entry.card.remove(); });

    // Courses the SIS can sell that Webflow has no record of cannot be shown
    // without inventing a card Finsweet never indexed — off unless asked for.
    var onPage = {};
    kept.forEach(function (card) { onPage[cardSlug(card)] = true; });
    var missing = courses.filter(function (course) {
      return course && course.available && course.slug && !onPage[String(course.slug).toLowerCase()];
    });
    if (missing.length && CFG.renderMissing) {
      list.insertAdjacentHTML('beforeend', missing.map(renderCard).join(''));
    }

    var shown = list.querySelectorAll(ITEM_SELECTOR).length;
    syncCounters(shown);

    // Correct Finsweet's bookkeeping if it has already indexed this list. When
    // it has not, this resolves to null and Finsweet simply indexes the trimmed
    // list itself — the case that needs no help.
    cmsListFor(list).then(function (listInstance) {
      if (listInstance) {
        pruneCmsList(listInstance, Array.prototype.slice.call(list.querySelectorAll(ITEM_SELECTOR)));
      }
    });

    return { shown: shown, dropped: dropped, unknown: unknown, missing: missing };
  }

  function init() {
    if (PAGE_PATTERN && !CFG.mount && !PAGE_PATTERN.test(window.location.pathname)) return;

    injectHidingRule();

    // Started before the list is looked for, so the round trip overlaps the
    // rest of the page parsing instead of following it.
    var loading = fetchJson(resolveOrigin() + DATA_PATH);

    whenListReady().then(function (list) {
      if (!list) return; // not the Courses page after all — leave the DOM alone
      if (list.getAttribute(STATE_ATTR)) return; // a second copy of this script

      list.setAttribute(STATE_ATTR, 'loading');

      // If anything below stalls — a hung fetch, a rejected promise we failed
      // to anticipate — the page must not be left with an invisible course
      // list. Webflow's own cards are stale, not broken.
      var failsafe = setTimeout(function () {
        if (list.getAttribute(STATE_ATTR) === 'loading') {
          console.warn('[EEListing] Timed out; showing the Webflow-rendered courses unchanged.');
          list.setAttribute(STATE_ATTR, 'timeout');
        }
      }, CFG.revealMs || 6000);

      loading
        .then(function (data) {
          var courses = (data && data.courses) || [];
          // An empty dataset is far more likely to be a broken upstream than a
          // college with no Extended Education, and trimming against it would
          // do nothing anyway. Say so rather than looking like a clean run.
          if (!courses.length) {
            console.warn('[EEListing] Dataset is empty; leaving the page as Webflow rendered it.');
            list.setAttribute(STATE_ATTR, 'empty');
            return;
          }

          var result = trim(list, data);
          list.setAttribute(STATE_ATTR, 'ready');

          console.log('[EEListing] Showing ' + result.shown + ' courses; removed '
            + result.dropped.length + ' with no purchasable section.');
          if (result.unknown.length) {
            console.warn('[EEListing] ' + result.unknown.length + ' card(s) are not in the dataset and were '
              + 'left in place: ' + result.unknown.join(', '));
          }
          if (result.missing.length) {
            console.warn('[EEListing] ' + result.missing.length + ' sellable course(s) have no card on this '
              + 'page: ' + result.missing.map(function (c) { return c.code || c.slug; }).join(', ')
              + (CFG.renderMissing ? ' — appended.' : ' — add them in Webflow, or set renderMissing.'));
          }
        })
        .catch(function (err) {
          console.error('[EEListing]', err);
          list.setAttribute(STATE_ATTR, 'error');
        })
        .then(function () {
          clearTimeout(failsafe);
        });
    });
  }

  init();
})();
