/**
 * Program Completion Requirements accordion — SOURCE
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE. Do not edit public/js/program-requirements.js (generated).
 *
 *   Build : npm run js:build      (esbuild -> public/js/program-requirements.js)
 *   Watch : npm run js:watch      (rebuild on save)
 *
 * Loaded once from the Webflow program detail template — no per-program CMS
 * copy, no Embed block:
 *   <link rel="stylesheet" href="https://bvc-app.vercel.app/css/program-requirements.css" />
 *   <script src="https://bvc-app.vercel.app/js/program-requirements.js" defer></script>
 *
 * ORIGIN RESOLUTION
 * The JSON origin defaults to the origin this script was served from, so the
 * same file keeps working unchanged when the site itself moves onto Vercel and
 * serves /js/* and /data/* from one origin. Override explicitly if needed —
 * set BEFORE this script loads:
 *   window.__PROGRAM_REQUIREMENTS_CONFIG__ = { dataOrigin: '', code: '', mount: '' };
 *
 * PROGRAM IDENTIFICATION (in priority order)
 *   1. data-program-code on the mount element  ← preferred
 *      In Webflow, add it as a custom attribute on the #Courses div and bind
 *      the Code field, so it renders as data-program-code="ECE".
 *   2. <meta name="bvc-program-code" content="ECE">
 *   3. window.__PROGRAM_REQUIREMENTS_CONFIG__.code / window.BVC_PROGRAM_CODE
 *   4. URL slug, looked up in program-requirements-index.json — EXACT match only.
 *
 * The original embed guessed by appending '-diploma', '-certificate', … to the
 * slug and took the first hit, so the ECE *certificate* page was served the
 * ECED *diploma* dataset (69 credits instead of 36). Codes are unique per
 * program, so path 1 cannot make that mistake; when nothing resolves the
 * script says so rather than rendering a plausible but wrong program.
 *
 * Data is produced by scripts/generateProgramRequirements.mjs:
 *   /data/static/program-requirements-by-code/{CODE}.json
 *   /data/static/program-requirements-index.json
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  if (window.__bvcProgramRequirementsLoaded) {
    console.warn('[ProgramRequirements] Already initialised — skipping duplicate load.');
    return;
  }
  window.__bvcProgramRequirementsLoaded = true;

  var CFG = window.__PROGRAM_REQUIREMENTS_CONFIG__ || {};

  var FALLBACK_ORIGIN = 'https://bvc-app.vercel.app';
  var INDEX_PATH = '/data/static/program-requirements-index.json';
  var BY_CODE_PATH = '/data/static/program-requirements-by-code/';
  var CSS_PATH = '/css/program-requirements.css';
  var CSS_MARKER = 'data-bvc-pr-styles';
  var MOUNT_SELECTORS = ['[data-bvc-program-requirements]', '#Courses .w-richtext', '#Courses'];
  // Mirrors CODE_PATTERN in scripts/generateProgramRequirements.mjs.
  var CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,23}$/;

  var PDF_SVG = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">'
    + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
    + '<path d="M14 2v6h6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  // document.currentScript is only readable while the script executes, so the
  // origin is captured here rather than inside init().
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';

  var uid = 0;

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
   * the Webflow embed and a future all-on-Vercel deployment working from the
   * same source: today it resolves to bvc-app.vercel.app, and once the site is
   * served from one origin it resolves to that origin instead.
   */
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
    if (document.querySelector('[' + CSS_MARKER + ']')) return;
    if (document.querySelector('link[rel="stylesheet"][href*="program-requirements.css"]')) return;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = origin + CSS_PATH;
    link.setAttribute(CSS_MARKER, 'true');
    document.head.appendChild(link);
  }

  function findTarget() {
    var selectors = CFG.mount ? [CFG.mount].concat(MOUNT_SELECTORS) : MOUNT_SELECTORS;
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function normalizeCode(value) {
    var code = String(value == null ? '' : value).trim().toUpperCase();
    // Webflow renders an unbound CMS placeholder literally, e.g. "{{CODE}}".
    if (!code || code.indexOf('{') !== -1) return '';
    return CODE_PATTERN.test(code) ? code : '';
  }

  /** Explicit sources only — never derived from the program name or title. */
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

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      return res.json();
    });
  }

  /* ── rendering ────────────────────────────────────────────────────── */

  function renderStatus(target, message) {
    target.innerHTML = '<div class="bvc-accordion"><div class="accordion-status">' + escapeHtml(message) + '</div></div>';
  }

  function renderError(target, message, detail) {
    var detailHtml = detail ? '<div class="accordion-error-detail">' + escapeHtml(detail) + '</div>' : '';
    target.innerHTML = '<div class="bvc-accordion"><div class="accordion-error" role="alert">'
      + escapeHtml(message) + detailHtml + '</div></div>';
  }

  function renderCourseRow(course) {
    var pdf = '';
    if (course.url) {
      var label = 'Course outline PDF for ' + (course.code || course.title || 'this course');
      pdf = '<a class="icon tooltip" href="' + escapeHtml(course.url) + '" target="_blank" rel="noopener noreferrer"'
        + ' title="' + escapeHtml(label) + '" aria-label="' + escapeHtml(label) + '">' + PDF_SVG + '</a>';
    }
    return '<tr>'
      + '<td>' + escapeHtml(course.code) + '</td>'
      + '<td>' + escapeHtml(course.title) + '</td>'
      + '<td class="table-center">' + escapeHtml(course.credits) + '</td>'
      + '<td class="table-center">' + pdf + '</td>'
      + '</tr>';
  }

  function renderRule(rule) {
    var badge = '';
    if (rule.ruleType === 'minimumGrade' && rule.minimumGrade) {
      badge = '<span class="accordion-rule-badge">Min. grade: ' + escapeHtml(rule.minimumGrade) + '</span>';
    } else if (rule.ruleType === 'minimumCreditsFromList' && rule.minimumCredits != null) {
      badge = '<span class="accordion-rule-badge">Choose ' + escapeHtml(rule.minimumCredits) + ' credits</span>';
    }

    var courses = rule.courses || [];
    if (!courses.length) {
      return '<div class="accordion-section"><p class="accordion-rule-desc">'
        + escapeHtml(rule.description) + badge + '</p></div>';
    }

    return '<div class="accordion-section">'
      + '<p class="accordion-rule-desc">' + escapeHtml(rule.description) + badge + '</p>'
      + '<div class="accordion-table-wrap"><table>'
      + '<thead><tr><th scope="col">Code</th><th scope="col">Course</th>'
      + '<th scope="col" class="table-center">Credits</th>'
      + '<th scope="col" class="table-center">PDF</th></tr></thead>'
      + '<tbody>' + courses.map(renderCourseRow).join('') + '</tbody>'
      + '</table></div></div>';
  }

  function renderTerm(term) {
    var id = 'bvc-pr-panel-' + (++uid);
    var credits = term.totalCredits != null
      ? '<span class="accordion-term-credits">' + escapeHtml(term.totalCredits) + ' credits</span>'
      : '';
    return '<div class="accordion-item">'
      + '<button type="button" class="accordion-button" aria-expanded="false" aria-controls="' + id + '">'
      + '<span>' + escapeHtml(term.termLabel) + '</span>' + credits
      + '</button>'
      + '<div class="accordion-content" id="' + id + '" role="region">'
      + (term.rules || []).map(renderRule).join('')
      + '</div></div>';
  }

  function renderAccordion(data) {
    var terms = (data && data.groupings) || [];
    if (!terms.length) return '';
    var total = data.grandTotalCredits != null
      ? '<div class="accordion-grand-total"><span>Total program credits</span><span>'
        + escapeHtml(data.grandTotalCredits) + '</span></div>'
      : '';
    return '<div class="bvc-accordion">' + terms.map(renderTerm).join('') + total + '</div>';
  }

  function attachHandlers(root) {
    root.querySelectorAll('.accordion-button').forEach(function (button) {
      button.addEventListener('click', function () {
        var content = button.nextElementSibling;
        var expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        if (expanded) {
          content.style.maxHeight = '';
          content.classList.remove('open');
        } else {
          content.classList.add('open');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });

    // Keep an open panel sized correctly when the layout reflows.
    window.addEventListener('resize', function () {
      root.querySelectorAll('.accordion-content.open').forEach(function (content) {
        content.style.maxHeight = content.scrollHeight + 'px';
      });
    });
  }

  /* ── boot ─────────────────────────────────────────────────────────── */

  function resolveCode(target, origin) {
    var declared = readDeclaredCode(target);
    if (declared) return Promise.resolve(declared);

    var slug = currentSlug();
    if (!slug) {
      return Promise.reject(new Error('No program code was supplied and the URL has no slug to fall back on.'));
    }

    return fetchJson(origin + INDEX_PATH).then(function (index) {
      var code = index && index.bySlug ? index.bySlug[slug] : null;
      if (!code) {
        throw new Error('No program is registered for slug "' + slug + '". Add data-program-code to the '
          + 'mount element, or add this program in generateProgramRequirements.mjs.');
      }
      return code;
    });
  }

  function init() {
    var target = findTarget();
    // The script is loaded site-wide from the template head; pages without a
    // requirements slot are simply not program pages.
    if (!target || target.getAttribute('data-bvc-pr-ready') === 'true') return;
    target.setAttribute('data-bvc-pr-ready', 'true');
    target.classList.add('bvc-pr');

    var origin = resolveOrigin(target);
    ensureStylesheet(origin);
    renderStatus(target, 'Loading program requirements…');

    resolveCode(target, origin)
      .then(function (code) {
        return fetchJson(origin + BY_CODE_PATH + encodeURIComponent(code) + '.json');
      })
      .then(function (data) {
        var html = renderAccordion(data);
        if (!html) {
          renderStatus(target, 'Course requirements for this program are not published yet.');
          return;
        }
        target.innerHTML = html;
        attachHandlers(target);
      })
      .catch(function (err) {
        console.error('[ProgramRequirements]', err);
        renderError(
          target,
          'Program requirements are temporarily unavailable.',
          'Slug: ' + currentSlug() + ' · Code: ' + (readDeclaredCode(target) || '(not set)') + ' · ' + (err && err.message)
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
