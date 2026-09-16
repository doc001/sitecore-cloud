/**
 * Program Tuition tabs — SOURCE
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE. Do not edit public/js/program-tuition.js (generated).
 *
 *   Build : npm run js:build      (esbuild -> public/js/program-tuition.js)
 *   Watch : npm run js:watch      (rebuild on save)
 *
 * Loaded once from the Webflow program detail template — no per-program copy:
 *   <link rel="stylesheet" href="https://bvc-app.vercel.app/css/program-tuition.css" />
 *   <script src="https://bvc-app.vercel.app/js/program-tuition.js" defer></script>
 *
 * WHAT IT REPLACES
 * The template's #Tuition-and-Fees section renders a Webflow tabs component
 * fed by a CMS collection of hand-typed per-term prices. This script swaps
 * ONLY that tabs component (.c-tabs) for one built from
 * /data/static/program-tuition.json, which scripts/generateProgramTuition.mjs
 * reads straight out of Finance's annual tuition workbook. The section heading
 * and the disclaimer below it stay Webflow's.
 *
 * FAIL OPEN
 * Every path that cannot produce a table — no section on the page, a fetch
 * failure, a program the dataset does not have — leaves the Webflow tabs
 * exactly as rendered. program-tuition.css hides those tabs while this script
 * decides, with a CSS-only reveal after 3 s, so even a script that never loads
 * cannot leave the section blank.
 *
 * PROGRAM IDENTIFICATION (in priority order)
 *   1. data-program-code on the mount element (bind Webflow's Code field)
 *   2. <meta name="bvc-program-code" content="OA">
 *   3. window.__PROGRAM_TUITION_CONFIG__.code / window.BVC_PROGRAM_CODE
 *   4. URL slug, looked up in the dataset's bySlug — EXACT match only
 *
 * CONFIG — set BEFORE this script loads, all optional:
 *   window.__PROGRAM_TUITION_CONFIG__ = {
 *     dataOrigin: 'https://bvc-app.vercel.app',  // default: this script's origin
 *     code: 'OA',
 *     mount: '#Tuition-and-Fees',
 *     etiMarker: '*'                              // '' to drop the asterisk
 *   };
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  if (window.__bvcProgramTuitionLoaded) {
    console.warn('[ProgramTuition] Already initialised — skipping duplicate load.');
    return;
  }
  window.__bvcProgramTuitionLoaded = true;

  var CFG = window.__PROGRAM_TUITION_CONFIG__ || {};

  var FALLBACK_ORIGIN = 'https://bvc-app.vercel.app';
  var DATA_PATH = '/data/static/program-tuition.json';
  var CSS_PATH = '/css/program-tuition.css';
  // A dedicated mount renders the whole block into itself; the Webflow section
  // keeps its heading and disclaimer and only has its tabs component swapped.
  var DEDICATED_MOUNT = '[data-bvc-program-tuition]';
  var SECTION_MOUNT = '#Tuition-and-Fees';
  var WEBFLOW_TABS = '.c-tabs';
  // Tells program-tuition.css to stop hiding the Webflow tabs.
  var SETTLED_CLASS = 'bvc-tuition-settled';
  var CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,23}$/;
  var ETI_MARKER = CFG.etiMarker != null ? String(CFG.etiMarker) : '*';

  var AUDIENCES = [
    { key: 'domestic', label: 'Domestic Students' },
    { key: 'international', label: 'International Students' }
  ];

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

  function resolveOrigin(target) {
    if (CFG.dataOrigin != null) return trimSlash(CFG.dataOrigin);
    var attr = target && target.getAttribute('data-base-url');
    if (attr) return trimSlash(attr);
    if (SCRIPT_SRC) {
      try {
        return trimSlash(new URL(SCRIPT_SRC, window.location.href).origin);
      } catch (err) {
        /* fall through */
      }
    }
    return FALLBACK_ORIGIN;
  }

  /** Keeps a lone <script> tag self-sufficient when the <link> was not added. */
  function ensureStylesheet(origin) {
    if (document.querySelector('link[rel="stylesheet"][href*="program-tuition.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = origin + CSS_PATH;
    document.head.appendChild(link);
  }

  function normalizeCode(value) {
    var code = String(value == null ? '' : value).trim().toUpperCase();
    // Webflow renders an unbound CMS placeholder literally, e.g. "{{CODE}}".
    if (!code || code.indexOf('{') !== -1) return '';
    return CODE_PATTERN.test(code) ? code : '';
  }

  function readDeclaredCode(target) {
    var meta = document.querySelector('meta[name="bvc-program-code"]');
    var candidates = [
      target && target.getAttribute('data-program-code'),
      meta && meta.getAttribute('content'),
      CFG.code,
      window.BVC_PROGRAM_CODE
    ];
    for (var i = 0; i < candidates.length; i++) {
      var code = normalizeCode(candidates[i]);
      if (code) return code;
    }
    return '';
  }

  function currentSlug() {
    var segments = window.location.pathname.split('/').filter(Boolean);
    return (segments[segments.length - 1] || '').toLowerCase();
  }

  /**
   * Whole dollars, as the page has always shown them. Each term is rounded
   * for display and the total is the sum of the ROUNDED terms, so the figures
   * on screen always add up — Administrative Professional's terms of $2,861.10
   * + $2,861.10 + $530.40 total $6,252, not the $6,253 rounding the raw sum
   * would give.
   */
  function dollars(amount) {
    return '$' + Math.round(amount).toLocaleString('en-CA');
  }

  function termLabel(term) {
    // Term 0 is the workbook's annual figure for programs without terms.
    return term === 0 ? 'Annual tuition' : 'Term ' + term;
  }

  /* ── rendering ────────────────────────────────────────────────────── */

  function renderPanel(audience, block, active) {
    var marker = audience.key === 'domestic' && block.eti ? ETI_MARKER : '';
    var total = 0;
    var rows = block.terms.map(function (t) {
      total += Math.round(t.amount);
      return '<tr>'
        + '<th scope="row"><span class="bvc-tuition__cell">' + escapeHtml(termLabel(t.term)) + '</span></th>'
        + '<td><span class="bvc-tuition__cell">' + escapeHtml(dollars(t.amount) + marker) + '</span></td>'
        + '</tr>';
    }).join('');

    // A single row IS the total; repeating it underneath says nothing.
    var foot = block.terms.length > 1
      ? '<tfoot><tr>'
        + '<th scope="row" class="bvc-tuition__total-label">Estimated total tuition:</th>'
        + '<td class="bvc-tuition__total-amount">' + escapeHtml(dollars(total)) + '</td>'
        + '</tr></tfoot>'
      : '';

    return '<div class="bvc-tuition__panel" role="tabpanel"'
      + ' id="bvc-tuition-panel-' + audience.key + '" aria-labelledby="bvc-tuition-tab-' + audience.key + '"'
      + (active ? '' : ' hidden') + '>'
      + '<table class="bvc-tuition__table">'
      + '<thead><tr><th scope="col">Term</th><th scope="col">Tuition</th></tr></thead>'
      + '<tbody>' + rows + '</tbody>' + foot
      + '</table></div>';
  }

  function renderTuition(program) {
    var audiences = AUDIENCES.filter(function (a) {
      var block = program[a.key];
      return block && block.terms && block.terms.length;
    });
    if (!audiences.length) return '';

    var tabs = audiences.map(function (a, i) {
      var active = i === 0;
      return '<button type="button" role="tab" class="bvc-tuition__tab"'
        + ' id="bvc-tuition-tab-' + a.key + '" aria-controls="bvc-tuition-panel-' + a.key + '"'
        + ' aria-selected="' + active + '"' + (active ? '' : ' tabindex="-1"') + '>'
        + escapeHtml(a.label) + '</button>';
    }).join('');

    var panels = audiences.map(function (a, i) {
      return renderPanel(a, program[a.key], i === 0);
    }).join('');

    return '<div class="bvc-tuition">'
      + '<div class="bvc-tuition__tabs" role="tablist" aria-label="Tuition by student type">' + tabs + '</div>'
      + panels + '</div>';
  }

  function attachTabs(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        root.querySelector('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (event.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (event.key === 'Home') next = tabs[0];
        else if (event.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        event.preventDefault();
        select(next);
        next.focus();
      });
    });
  }

  /* ── boot ─────────────────────────────────────────────────────────── */

  function settle(section) {
    if (section) section.classList.add(SETTLED_CLASS);
  }

  function init() {
    var dedicated = document.querySelector(CFG.mount || DEDICATED_MOUNT);
    var section = dedicated ? null : document.querySelector(SECTION_MOUNT);
    var target = dedicated || section;
    // Loaded from the template head; a page without the section is not a
    // program page with tuition.
    if (!target || target.getAttribute('data-bvc-tuition-ready') === 'true') return;
    target.setAttribute('data-bvc-tuition-ready', 'true');

    var origin = resolveOrigin(target);
    ensureStylesheet(origin);

    fetch(origin + DATA_PATH, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + origin + DATA_PATH);
        return res.json();
      })
      .then(function (data) {
        var programs = (data && data.programs) || {};
        var code = readDeclaredCode(target) || (data && data.bySlug && data.bySlug[currentSlug()]) || '';
        var program = code && programs[code];
        var html = program ? renderTuition(program) : '';

        if (!html) {
          console.warn('[ProgramTuition] No tuition for ' + (code ? 'code "' + code + '"' : 'slug "' + currentSlug() + '"')
            + ' — leaving the Webflow tuition section as rendered.');
          settle(section);
          return;
        }

        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        var block = wrapper.firstChild;

        if (dedicated) {
          dedicated.innerHTML = '';
          dedicated.appendChild(block);
        } else {
          var tabs = section.querySelector(WEBFLOW_TABS);
          if (tabs) {
            tabs.parentNode.replaceChild(block, tabs);
          } else {
            var heading = section.querySelector('.program-section-title');
            section.insertBefore(block, heading ? heading.nextSibling : section.firstChild);
          }
          settle(section);
        }
        attachTabs(block);
      })
      .catch(function (err) {
        console.error('[ProgramTuition]', err);
        settle(section);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
