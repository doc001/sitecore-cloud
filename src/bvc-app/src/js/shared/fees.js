// Shared cart-fee logic.
//
// Used by os-course, ee-course and checkout. It exists because the checkout page has
// to recalculate fees after pruning an unavailable course from the cart, and the only
// implementation used to live inside the course-page bundles — so checkout either had
// to duplicate the dedupe rule or bounce the user back to the cart.
//
// Deliberately free of cart/session/DOM coupling: callers own their own storage and
// rendering, this module only talks to the fee API and does the arithmetic.

/**
 * Additional fees are CART-LEVEL — charged once per registration, never per course.
 * The fee API returns a set PER course/offering, so a multi-course cart comes back
 * with the same institutional fees repeated (each stamped with a program-offering id,
 * and amounts that can differ by program). Collapse to ONE set by fee type
 * (description) so each fee — Student Association, Services, Technology, Learner
 * Wellness — shows exactly once for the whole cart. First occurrence wins.
 * See OS-COURSE-CART.md (Backend API contract).
 */
export function dedupeFees(fees) {
  var seen = {},
    result = [];
  (Array.isArray(fees) ? fees : []).forEach(function (fee) {
    var key = (fee.description || '').trim().toLowerCase();
    seen[key] || ((seen[key] = 1), result.push(fee));
  });
  return result;
}

export function summariseFees(fees) {
  var list = Array.isArray(fees) ? fees : [],
    totalAmount = list.reduce(function (sum, fee) {
      return sum + (fee.amount || 0);
    }, 0),
    totalTax = list.reduce(function (sum, fee) {
      return sum + (fee.tax || 0);
    }, 0);
  return { totalAmount: totalAmount, totalTax: totalTax, grandTotal: totalAmount + totalTax, feeCount: list.length };
}

/** The subset of a deduped fee set that belongs to one course, plus its own summary. */
export function feesForSku(fees, sku) {
  var courseFees = (Array.isArray(fees) ? fees : []).filter(function (fee) {
    return fee.courseSku === sku;
  });
  return { fees: courseFees, summary: summariseFees(courseFees) };
}

/**
 * GET `fee/{skus}/{studentNo}`.
 *
 * The trailing segment must be PRESENT but may be EMPTY for an anonymous preview —
 * the URL ends in a bare slash (`fee/2595/`). Verified 2026-07-28: empty → 200 with
 * fee data, the literal string 'null' → 404. The value does not change the amounts.
 * (The OpenAPI spec declares `studentNo` as a query parameter instead; the path form
 * is what the deployed API accepts. See docs/sis-api.md, divergence 6.)
 *
 * Returns `{ status, feeData, summary }`. An empty sku list is a no-op rather than a
 * request, so callers can hand it a freshly-emptied cart without special-casing.
 */
export async function fetchCartFees(options) {
  var skus = Array.isArray(options.skus) ? options.skus : [];
  if (0 === skus.length) return { status: 400, feeData: [], summary: summariseFees([]) };

  var endpoint = 'thesissitecorexm.api/fee/' + skus.join(',') + '/' + (options.feeId != null ? options.feeId : ''),
    response = await fetch(options.apiOrigin + '/api/bvcpayment?endpoint=' + encodeURIComponent(endpoint), {
      method: 'GET',
      mode: 'cors',
      headers: { Authorization: 'Bearer ' + options.token, 'Content-Type': 'application/json' },
    });
  if (!response.ok) throw new Error('Fee API returned status ' + response.status);

  var dedupedFees = dedupeFees(await response.json());
  return { status: response.status, feeData: dedupedFees, summary: summariseFees(dedupedFees) };
}
