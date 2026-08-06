/**
 * address-autocomplete.js — Google Maps Places autocomplete (NGEW-217)
 * ---------------------------------------------------------------------------
 * Progressive enhancement for the Street Address fields. As the user types,
 * Google suggests complete addresses; picking one fills the rest of that
 * address group (city, province, postal code, country). Every field stays
 * editable afterwards, and if no API key is configured — or the Maps script
 * fails to load — the fields degrade to ordinary manual entry.
 *
 * This module owns the Google integration and nothing else. It knows which
 * control to fill only through the `groups` map handed in by index.js, so the
 * field names live in exactly one place (content.js).
 */

import { config } from './content.js';

const maps = config.googleMaps || {};

let loadPromise = null;

/** Load the Maps JS API (Places library) once, on demand. */
function loadMaps() {
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps);
  if (loadPromise) return loadPromise;

  const key = maps.apiKey;
  if (!key) return Promise.reject(new Error('google-maps: no api key configured'));

  loadPromise = new Promise((resolve, reject) => {
    // A unique global the Maps loader calls back when it is ready. `loading=async`
    // requires a callback, so we hand it one and clean it up on both paths.
    const cbName = `__bvcMapsReady_${String(key).length}_${window.location.pathname.length}`;
    window[cbName] = () => {
      delete window[cbName];
      window.google?.maps?.places ? resolve(window.google.maps) : reject(new Error('google-maps: places missing'));
    };

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key,
      libraries: 'places',
      loading: 'async',
      callback: cbName
    });
    script.src = `${maps.mapsJsBase}?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      delete window[cbName];
      reject(new Error('google-maps: script failed to load'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Pull a named component out of a place, long or short form. */
function pick(components, type, short = false) {
  const hit = components.find((c) => c.types.includes(type));
  if (!hit) return '';
  return short ? hit.short_name : hit.long_name;
}

/** Map a Google place's address_components onto our address roles. */
function toAddress(components) {
  const streetNumber = pick(components, 'street_number');
  const route = pick(components, 'route');
  return {
    street: [streetNumber, route].filter(Boolean).join(' '),
    // Big cities use `locality`; some regions only populate the alternatives.
    city: pick(components, 'locality')
      || pick(components, 'postal_town')
      || pick(components, 'sublocality')
      || pick(components, 'administrative_area_level_2'),
    province: pick(components, 'administrative_area_level_1', true),
    postalCode: pick(components, 'postal_code'),
    country: pick(components, 'country', true)
  };
}

/**
 * @param {object}   opts
 * @param {Element}  opts.root    — the [data-checkout] root.
 * @param {object}   opts.groups  — { mailing: {street, city, province, postalCode, country}, billing: {…} }
 *                                   where each value is a field object from field.js (or undefined).
 * @param {Function} opts.onFill  — called after a group is populated (e.g. refresh()).
 * @returns {Promise<void>} resolves once autocomplete is attached, rejects if
 *                          Maps is unavailable (caller should ignore the reject).
 */
export async function initAddressAutocomplete({ root, groups, onFill }) {
  const inputs = [...root.querySelectorAll('[data-address-autocomplete]')];
  if (!inputs.length) return;

  const google = await loadMaps();

  // The classic widget may be unavailable on brand-new Cloud projects. If so,
  // bail quietly — manual entry is unaffected.
  if (!google.maps.places?.Autocomplete) {
    throw new Error('google-maps: Autocomplete widget unavailable');
  }

  inputs.forEach((input) => {
    const groupName = input.getAttribute('data-address-autocomplete');
    const group = groups[groupName];
    if (!group) return;

    const options = {
      fields: ['address_components'],
      types: ['address']
    };
    if (Array.isArray(maps.countryRestriction) && maps.countryRestriction.length) {
      options.componentRestrictions = { country: maps.countryRestriction };
    }

    const widget = new google.maps.places.Autocomplete(input, options);

    widget.addListener('place_changed', () => {
      const place = widget.getPlace();
      if (!place?.address_components) return;

      const parsed = toAddress(place.address_components);
      const assign = (role, value) => {
        if (!value) return;
        const field = group[role];
        if (field) field.value = value;
      };

      assign('street', parsed.street);
      assign('city', parsed.city);
      assign('province', parsed.province);
      assign('postalCode', parsed.postalCode);
      assign('country', parsed.country);

      onFill?.();
    });
  });
}
