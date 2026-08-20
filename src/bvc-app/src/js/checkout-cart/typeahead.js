/**
 * "Other" search for the long Sitecore lookups.
 *
 * The country and language selects carry a curated shortlist — the ~49 countries and
 * ~40 languages the college actually sees — plus an `OTHER` entry. Choosing `OTHER`
 * opens a search over the complete Sitecore set (273 countries, 505 languages).
 *
 * It searches rather than accepting free text on purpose. Every value submitted to
 * /thesissitecorexm.api/registration has to be a real Sitecore SisId, and those codes
 * are not derivable — they mix 2- and 3-character forms and disagree with ISO
 * (Canada is CAN, Poland PO, the UK XK). Free text would leave unresolvable answers
 * with no valid code to send, and Sitecore has no global "Other" country, only
 * regional catch-alls we cannot infer from a typed string.
 *
 * The chosen result is injected into the <select> as a real <option> and selected,
 * so the existing field wrapper, validation and submitter need no special case —
 * the control always holds a valid SisId.
 */

const ENDPOINT = '/data/form-options.json';
const MAX_RESULTS = 8;

let cache = null;
let inFlight = null;

/** Lazily fetch the full lists — ~17 KB, and only when someone picks "Other". */
async function loadOptions(dataOrigin) {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = fetch((dataOrigin || '') + ENDPOINT, { mode: 'cors' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((json) => {
        cache = json;
        return json;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

function score(name, query) {
  const n = name.toLowerCase();
  const i = n.indexOf(query);
  if (i === -1) return -1;
  // Prefix beats mid-string, shorter beats longer: "Chad" outranks "Republic of Chad".
  return (i === 0 ? 0 : 100) + i + name.length / 1000;
}

function search(list, query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return list
    .map((row) => ({ code: row[0], name: row[1], s: score(row[1], q) }))
    .filter((row) => row.s >= 0)
    .sort((a, b) => a.s - b.s)
    .slice(0, MAX_RESULTS);
}

/**
 * @param {HTMLSelectElement} select   the control holding the curated shortlist
 * @param {string} listKey             'countries' | 'languages'
 * @param {object} [opts]              { dataOrigin, otherValue, onPick }
 */
export function attachTypeahead(select, listKey, opts = {}) {
  if (!select || select.dataset.typeaheadReady === '1') return;
  select.dataset.typeaheadReady = '1';

  const otherValue = opts.otherValue || 'OTHER';
  const wrapper = document.createElement('div');
  wrapper.className = 'bvc-typeahead';
  wrapper.hidden = true;
  wrapper.innerHTML =
    '<input type="text" class="bvc-typeahead__input" autocomplete="off" role="combobox"' +
    ' aria-expanded="false" aria-autocomplete="list" placeholder="Start typing to search…">' +
    '<ul class="bvc-typeahead__list" role="listbox" hidden></ul>' +
    '<p class="bvc-typeahead__hint">Search the full list.</p>';
  select.insertAdjacentElement('afterend', wrapper);

  const input = wrapper.querySelector('.bvc-typeahead__input');
  const list = wrapper.querySelector('.bvc-typeahead__list');
  let results = [];
  let active = -1;

  const closeList = () => {
    list.hidden = true;
    list.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    active = -1;
  };

  function pick(row) {
    // Reuse the option if this code is already in the shortlist, otherwise add it.
    let option = Array.prototype.find.call(select.options, (o) => o.value === row.code);
    if (!option) {
      option = document.createElement('option');
      option.value = row.code;
      option.textContent = row.name;
      select.insertBefore(option, select.querySelector('option[value="' + otherValue + '"]'));
    }
    select.value = row.code;
    // The field wrapper and any showWhen conditions listen for change/input.
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.dispatchEvent(new Event('input', { bubbles: true }));
    wrapper.hidden = true;
    input.value = '';
    closeList();
    if (typeof opts.onPick === 'function') opts.onPick(row);
  }

  function render() {
    if (!results.length) return closeList();
    list.innerHTML = results
      .map((r, i) => '<li role="option" id="bvc-ta-' + i + '" aria-selected="' + (i === active) + '"' + (i === active ? ' class="is-active"' : '') + '>' + r.name + '</li>')
      .join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    Array.prototype.forEach.call(list.children, (li, i) => {
      // mousedown, not click: blur would hide the list before click lands.
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        pick(results[i]);
      });
    });
  }

  async function onType() {
    let data;
    try {
      data = await loadOptions(opts.dataOrigin);
    } catch (error) {
      // Fail soft — the curated shortlist still works, only the search is lost.
      console.warn('[Typeahead] could not load ' + ENDPOINT, error);
      wrapper.querySelector('.bvc-typeahead__hint').textContent = 'Search is unavailable — please pick the closest match above.';
      return;
    }
    results = search(data[listKey] || [], input.value);
    active = results.length ? 0 : -1;
    render();
  }

  input.addEventListener('input', onType);
  input.addEventListener('blur', () => setTimeout(closeList, 120));
  input.addEventListener('keydown', (event) => {
    if (list.hidden) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      active = (active + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length;
      render();
    } else if (event.key === 'Enter' && active > -1) {
      event.preventDefault();
      pick(results[active]);
    } else if (event.key === 'Escape') {
      closeList();
    }
  });

  function sync() {
    const on = select.value === otherValue;
    wrapper.hidden = !on;
    if (on) {
      // Warm the cache while they reach for the keyboard.
      loadOptions(opts.dataOrigin).catch(() => {});
      input.focus();
    } else {
      closeList();
    }
  }
  select.addEventListener('change', sync);
  sync();
}
