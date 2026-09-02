// Shared cart-validation logic for os-course, ee-course and checkout.
//
// `thesissitecorexm.api/validation` is the only trustworthy availability check:
// `courseofferings` reports seats for sections the SiS considers full (5 of 42 caught
// — see docs/sis-api.md). It is also the only endpoint that can see a clash BETWEEN
// two cart items, which a per-offering call never can.

/**
 * POST the cart for validation.
 *
 * `studentId` is documented `nullable` but is REQUIRED and must parse as a number:
 * omit it and the API answers 400, send a non-numeric string and it answers 500.
 * The payload must be a JSON BODY — on the query string this endpoint answers 415,
 * unlike its siblings `fee` and `submit-payment`.
 *
 * Pass an empty `cartSkus` for the solo form ("can this offering be registered at
 * all"), which cannot trip the catalogue-wide conflict defect described in
 * docs/sis-api.md.
 */
export async function validateCart(options) {
  var cartSkus = Array.isArray(options.cartSkus) ? options.cartSkus : [],
    response = await fetch(options.apiOrigin + '/api/bvcpayment?endpoint=thesissitecorexm.api/validation', {
      method: 'POST',
      mode: 'cors',
      headers: { Authorization: 'Bearer ' + options.token, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ studentId: '0', courseBeingAdded: Number(options.sku), coursesInCart: cartSkus.map(Number) }),
    }),
    data = await response.json().catch(function () {
      return null;
    });
  console.log('[API] Validation', options.sku, '-> status', response.status, data && data.isCartValid);
  return { status: response.status, data: data };
}

/**
 * Interpret a validation response.
 *
 * Returns `null` for "could not determine" — callers MUST let the course through in
 * that case. An invalid cart arrives as HTTP 200 with the verdict in the body, so
 * `response.ok` only ever means the call was well-formed.
 *
 * The guard is on the array rather than on `isCartValid` deliberately: the 200
 * response has no schema in the published spec, so if the shape ever drifts
 * `isCartValid` reads as `undefined` — falsy — and a naive check would silently
 * reject every course.
 */
export function readValidation(response) {
  if (!response || 200 !== response.status || !response.data) return null;
  if (!Array.isArray(response.data.courseErrorResponses)) return null;
  if (0 === response.data.courseErrorResponses.length) return { ok: true };

  var codes = response.data.courseErrorResponses.reduce(function (accumulator, entry) {
    (entry.courseError || []).forEach(function (error) {
      if (error && error.code && -1 === accumulator.indexOf(error.code)) accumulator.push(error.code);
    });
    return accumulator;
  }, []);

  // The flagged offeringId is NOT reliably the course under test — for a clash the
  // API flags one side of the pair regardless of which one is new (verified across
  // five permutations). Callers validate one course at a time against a known-good
  // context, so the verdict belongs to that course and the ids are ignored.
  // Copy convention, shared with the course bundles' MSG map: one noun for the
  // thing the shopper clicked ("this date" — the accordion they opened is labelled
  // with a date range; "offering"/"section" are internal words), full sentences,
  // terminal period. `Offering Missing` covers full AND withdrawn, so it has to
  // stay generic — see docs/sis-api.md.
  var message = 'This date cannot be added to your cart.';
  if (-1 !== codes.indexOf('Timeblock Conflict')) message = 'This date overlaps with another course in your cart.';
  else if (-1 !== codes.indexOf('Offering Missing')) message = 'This date is no longer available.';

  return { ok: false, codes: codes, message: message };
}

/** True when the verdict is a clash with the cart rather than a property of the offering. */
export function isConflict(verdict) {
  return !!verdict && !verdict.ok && -1 !== verdict.codes.indexOf('Timeblock Conflict');
}
