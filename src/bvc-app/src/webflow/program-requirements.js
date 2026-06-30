/*
 * BVC program-requirements accordion (Webflow embed)
 *
 * Paste into a Webflow Embed widget on the program detail page template.
 * It looks up the matching JSON in /data/static/program-requirements/ and
 * renders an accordion of terms + courses.
 *
 * Which program to load (in priority order):
 *   1. The Kuali CODE — the prefix of the JSON filename before "_-_"
 *      (e.g. "SD" → SD_-_Software_Development__Diploma_.json). Most reliable.
 *      Provide it via, in priority:
 *        a. data-program-code="SD" on the mount element
 *           (recommended: bind this attribute to the CMS "Code" field)
 *        b. the value of data-bvc-program-requirements="SD" (mark + code in one attr)
 *        c. a ?code=SD URL query param (handy for testing/preview)
 *      The script maps CODE → filename from the manifest, so no full filename
 *      or page-slug guessing is needed.
 *   2. The URL slug (last path segment) — fallback when no code is given.
 *      Tries the bare slug, then common program-type suffixes.
 *
 * Mount target (in priority order):
 *   1. [data-bvc-program-requirements]   ← preferred: add this attr to any div
 *   2. #Courses .w-richtext              ← falls back to the existing rich-text slot
 *   3. #Courses                          ← last resort
 */
(function () {
  // Data origin. Defaults to production; set window.BVC_PR_BASE before this script
  // loads to point at a different host (local/staging testing). No trailing slash.
  const BASE = (typeof window !== 'undefined' && window.BVC_PR_BASE) || 'https://bvc-app.vercel.app/data/static';
  const MANIFEST_URL = BASE + '/program-requirements-manifest.json';
  const REQ_URL = (file) => BASE + '/program-requirements/' + encodeURIComponent(file);

  const STYLE_ID = 'bvc-pr-styles';
  const CSS = `
    .bvc-accordion .accordion-item { margin-bottom: 10px; }
    .bvc-accordion .accordion-button {
      width: 100%;
      height: 40px;
      padding-left: 1em;
      text-align: left;
      font-size: 1em;
      background-image: linear-gradient(101deg, rgba(3, 26, 98, 0.4), rgba(255, 255, 255, 0.2));
      background-color: rgb(0,163,355);
      color: white;
      border: none;
      cursor: pointer;
      position: relative;
    }
    .bvc-accordion .accordion-button::after {
      content: ">";
      position: absolute;
      right: 1rem;
      font-size: 1.4em;
      transition: transform 0.3s ease;
      transform: rotate(90deg);
    }
    .bvc-accordion .accordion-button.active::after { transform: rotate(-90deg); }
    .bvc-accordion .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease;
      background: #f1f1f1;
      padding: 0 1em;
    }
    .bvc-accordion .accordion-content.open { padding: 1em; max-height: 2000px; }
    .bvc-accordion table { width: 100%; border-collapse: collapse; margin: 1rem auto; }
    .bvc-accordion th, .bvc-accordion td { padding: 0.75rem; text-align: left; border: 1px solid #ccc; }
    .bvc-accordion th { background-color: #0077cc; color: white; }
    .bvc-accordion .table-center { text-align: center; }
    .bvc-accordion tr:nth-child(even) { background-color: #f9f9f9; }
    .bvc-accordion .accordion-section { margin-bottom: 1rem; }
    .bvc-accordion .icon.tooltip { height: 25px !important; width: 25px !important; cursor: pointer; }
    .bvc-accordion .accordion-rule-grade { display: inline-block; margin-left: 0.5rem; padding: 0.125rem 0.5rem; border-radius: 4px;
      background: #fff3cd; color: #664d03; font-size: 0.85em; font-weight: 600; }
    .bvc-accordion .accordion-grand-total { margin-top: 1rem; padding: 0.75rem 1em;
      background-image: linear-gradient(101deg, rgba(3, 26, 98, 0.4), rgba(255, 255, 255, 0.2));
      background-color: rgb(0,163,355); color: white; font-weight: 600;
      display: flex; justify-content: space-between; align-items: center; }
    .bvc-accordion .accordion-error { padding: 1rem; border: 1px solid #f5c2c7; background: #f8d7da; color: #842029; }
  `;

  const PDF_SVG = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function getSlug() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    return (segments[segments.length - 1] || '').toLowerCase();
  }

  // BVC URLs strip the program-type suffix (e.g. "/programs/cybersecurity-solutions"
  // → file CSS_-_Cybersecurity_Solutions_Diploma.json, manifest slug
  // "cybersecurity-solutions-diploma"). Try the bare slug first, then append
  // common program-type suffixes.
  const SLUG_SUFFIXES = ['', '-diploma', '-certificate', '-post-diploma-certificate', '-post-diploma', '-bridging'];
  function resolveSlug(manifest, slug) {
    for (const suffix of SLUG_SUFFIXES) {
      const candidate = slug + suffix;
      if (manifest[candidate]) return { slug: candidate, file: manifest[candidate] };
    }
    return null;
  }

  // Read the Kuali program code from the mount element (or ?code= for testing).
  // Priority: data-program-code → data-bvc-program-requirements value → ?code=.
  function getCode(target) {
    let c = '';
    if (target && target.getAttribute) {
      c = (target.getAttribute('data-program-code') || '').trim();
      if (!c) c = (target.getAttribute('data-bvc-program-requirements') || '').trim();
    }
    if (!c) c = (new URLSearchParams(window.location.search).get('code') || '').trim();
    return c;
  }

  // The manifest maps slugs → filenames, and every coded program's filename starts
  // with its CODE then "_-_". Derive a CODE → filename index so a program can be
  // addressed by code alone (a static host can't list files by prefix, so we still
  // need the manifest to resolve the code to the full filename).
  function buildCodeIndex(manifest) {
    const index = {};
    for (const file of Object.values(manifest)) {
      const i = file.indexOf('_-_');
      if (i > 0) {
        const code = file.slice(0, i).toUpperCase();
        if (!(code in index)) index[code] = file;  // codes are unique; first wins
      }
    }
    return index;
  }

  function findTarget() {
    return document.querySelector('[data-bvc-program-requirements]')
      || document.querySelector('#Courses .w-richtext')
      || document.querySelector('#Courses');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderCourseRow(course) {
    const pdf = course.url
      ? `<a class="icon tooltip" href="${escapeHtml(course.url)}" target="_blank" rel="noopener" title="Course outline (PDF) for ${escapeHtml(course.code)}" aria-label="Course outline PDF for ${escapeHtml(course.code)}">${PDF_SVG}</a>`
      : '';
    return `
      <tr>
        <td>${escapeHtml(course.code)}</td>
        <td>${escapeHtml(course.title)}</td>
        <td class="table-center">${escapeHtml(course.credits)}</td>
        <td class="table-center">${pdf}</td>
      </tr>`;
  }

  function renderRule(rule) {
    const gradeBadge = rule.ruleType === 'minimumGrade' && rule.minimumGrade
      ? `<span class="accordion-rule-grade">Min. grade: ${escapeHtml(rule.minimumGrade)}</span>` : '';
    const rows = (rule.courses || []).map(renderCourseRow).join('');
    return `
      <div class="accordion-section">
        <p>${escapeHtml(rule.description)}${gradeBadge}</p>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Course</th>
              <th class="table-center">Credits</th>
              <th class="table-center">PDF</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderTerm(term) {
    const rules = (term.rules || []).map(renderRule).join('');
    return `
      <div class="accordion-item">
        <button class="accordion-button" aria-expanded="false">${escapeHtml(term.termLabel)}</button>
        <div class="accordion-content">
          ${rules}
        </div>
      </div>`;
  }

  function renderAccordion(data) {
    const terms = (data.groupings || []).map(renderTerm).join('');
    const grand = data.grandTotalCredits != null
      ? `<div class="accordion-grand-total"><span>Total program credits</span><span>${escapeHtml(data.grandTotalCredits)}</span></div>` : '';
    return `<div class="bvc-accordion">${terms}${grand}</div>`;
  }

  function attachHandlers(root) {
    root.querySelectorAll('.bvc-accordion .accordion-button').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const content = toggle.nextElementSibling;
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        toggle.classList.toggle('active');
        if (expanded) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }

  function showError(target, msg, detail) {
    const code = getCode(target);
    const slug = getSlug();
    const detailHtml = detail
      ? `<div style="margin-top:0.5rem;font-size:0.85em;opacity:0.85"><strong>Code:</strong> ${escapeHtml(code || '—')}<br><strong>Slug:</strong> ${escapeHtml(slug)}<br><strong>Detail:</strong> ${escapeHtml(detail)}</div>` : '';
    target.innerHTML = `<div class="bvc-accordion"><div class="accordion-error">${escapeHtml(msg)}${detailHtml}</div></div>`;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return res.json();
  }

  async function init() {
    const target = findTarget();
    if (!target) return;
    injectStyles();
    const code = getCode(target);
    const slug = getSlug();
    if (!code && !slug) {
      showError(target, 'Could not determine the program (no code and no URL slug).');
      return;
    }
    try {
      const manifest = await fetchJson(MANIFEST_URL);

      // Prefer the explicit Kuali code; fall back to URL-slug resolution.
      let file = null;
      if (code) {
        file = buildCodeIndex(manifest)[code.toUpperCase()] || null;
      }
      if (!file) {
        const match = resolveSlug(manifest, slug);
        if (match) file = match.file;
      }
      if (!file) {
        throw new Error(`No program-requirements entry for code "${code || '—'}" / slug "${slug}" (tried the code index and slug suffix variants).`);
      }

      const data = await fetchJson(REQ_URL(file));
      target.innerHTML = renderAccordion(data);
      attachHandlers(target);
    } catch (err) {
      console.error('[bvc-program-requirements]', err);
      showError(target, 'Program requirements are temporarily unavailable.', err && err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
