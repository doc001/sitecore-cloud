# SiS Extended Education API — observed contract

The backend behind the Open Studies / Extended Ed cart and checkout: course
availability, cart validation, fees, registration, and payment.

**Production is the environment that matters, and its origins are recorded under
*Environments* below — verified 2026-08-19 by reading each proxy's `X-Api-Base`.**

**The behavioural findings marked "observed" were established against UAT on
2026-08-17**, and are labelled ⚠ UAT where prod has not been re-checked. Treat
those as descriptions of the service, not of an environment: they are what the
deployed code does, but the two blocking defects below were only ever reproduced
on UAT and must be confirmed on prod before anyone acts on them.

The published spec is no substitute: it is incomplete in the one
place the cart depends on most — `/validation`'s success response has no schema at
all — and several documented shapes do not match what the deployed service
actually returns. Where the two disagree, this file records both.

- **Spec** (OpenAPI 3.0.1, `Thesis Extended Education v1`):
  `OneDrive - Bow Valley College/General/Projects/External Website/Open Studies/API Json/thesis-ext-edu-apiVersion-3.json`
  (a Swagger 2.0 copy and a YAML copy sit beside it; the `-3` file is the one with
  component schemas).
- **Client code**: `src/bvc-app/src/js/os-course/`, `ee-course/`, `checkout/`.
- **Checkout flow narrative**: see `CLAUDE.md` → *bvc-app — Webflow Embeds*. This
  file documents the API surface, not the flow.

## Calling it

Everything goes through a Vercel payment proxy, which forwards to the SiS backend
for its environment. A bearer token is required on every call.

```
POST {apiOrigin}/api/mstoken          body {}          -> { access_token }
*    {apiOrigin}/api/bvcpayment?endpoint=<api path>    Authorization: Bearer <token>
```

The `endpoint` value is passed **unescaped** by the probe scripts and by
`os-course.js`; the slashes route fine.

### Environments

| | `apiOrigin` (proxy) | SiS backend it forwards to |
|---|---|---|
| **PROD** | `https://bvc-api-proxy.vercel.app` | `https://api.bowvalleycollege.ca/ths-extended-edu/v1` |
| UAT | `https://bvc-uat-api-proxy.vercel.app` | `https://apim-bvc-uat-001.azure-api.net/ths-extended-edu/v1` |

Production is what the live Webflow cart and `sis-health-watch.mjs` call — both
default to `bvc-api-proxy.vercel.app` with no env override set.

> **Do not take these from memory — ask the proxy.** Each one reports its own
> upstream, answered from config without calling SiS:
>
> ```bash
> curl -sI -X HEAD https://bvc-api-proxy.vercel.app/api/bvcpayment | grep -i x-api-base
> ```
>
> That is how the table above was established, and `sis-health-watch.mjs` resolves
> it the same way on every poll so its logs name the host they measured.

> ⚠ **`devapi.bvc.dev` is not production and never was.** Earlier revisions of this
> file, of `CLAUDE.md`, and of the watcher's alert text named it as the backend; it
> is the *dev* host, still hardcoded in the retired `src/nextjs-jamstack` proxy
> routes. Corrected 2026-08-19. The backend can be hit directly at
> `<backend>/<api path>` with the same token — useful for proving a fault is not
> the proxy's — but use the row above for the environment you mean.

> **Transport is per-endpoint and inconsistent.** `submit-payment` takes everything
> on the query string, `registration` takes a JSON body, `validation` takes a JSON
> body and **415s** on the query string, and `fee` takes a path segment plus a query
> param. Do not infer one endpoint's transport from a sibling's.

## Endpoint inventory

| Method | Path | Input | 200 returns |
|---|---|---|---|
| GET | `/courseofferings/{id}` | path `id` | `CourseOffering` |
| POST | `/validation` | body `PostCourseValidation` | **no schema in spec** — see below |
| GET | `/fee/{coursesInCart}` | path `coursesInCart`, query `studentNo` | `AdditionalFee` |
| GET | `/payment/{id}` | path `id` | `Payment` |
| POST | `/payment/submit-payment` | query `coursesInCart`, `totalAmount`, `registrationId`, `studentPk` | `IActionResult` |
| POST | `/payment/webhook/process-status` | — | `boolean` |
| GET | `/registration/{id}` | path `id` | `Registration` |
| POST | `/registration` | body `PostRegistration` | `Registration` |
| PUT | `/registration` | query `id`, body `PostRegistration` | `Registration` |
| GET | `/student/{id}` | path `id` | `Student` |

All paths are prefixed `thesissitecorexm.api/`. The older `sitecorexm.api/` prefix
404s.

`PUT /registration` identifies the target with **`?id=`** (the registration id), not
by `studentId` in the body — so it updates a registration, not a student.

## `/validation` — the cart check

The only endpoint that can see relationships *between* cart items. A per-offering
endpoint cannot detect a timetable clash.

### Request (documented, and matches reality)

```jsonc
POST .../api/bvcpayment?endpoint=thesissitecorexm.api/validation
Content-Type: application/json          // application/json-patch+json also accepted
{
  "studentId":        "0",              // string, but must parse as a number
  "courseBeingAdded": 815,              // int64, optional
  "coursesInCart":    [815, 340]        // int64[], optional
}
```

Ids are **offering sisIds** — the same numbers the cart stores as `item.sku` and
`os-course.js` sends as `Number(item.sku)`.

### Response (observed — **not in the spec**)

The spec declares `200: OK` with no content schema. What it actually returns:

```jsonc
{
  "userError": { "errors": ["...cart-level message..."] },   // array of plain STRINGS
  "courseErrorResponses": [
    { "offeringId": 815,
      "courseError": [ { "code": "Timeblock Conflict", "description": "..." } ] }
  ],
  "isCartValid": false
}
```

### Error codes seen so far

| `code` | Trigger | `description` |
|---|---|---|
| `Offering Missing` | offering withdrawn, id never existed, **section full**, or unregisterable for a reason `courseofferings` cannot see | `Registration failed. {offeringId} is no longer available.` |
| `Timeblock Conflict` | two cart items clash | `This offering has a timeblock conflict with another course in your cart and cannot be registered.` |

Both codes were provoked by probe; the list is **not authoritative**.

`Offering Missing` is heavily overloaded. A garbage id (`999999999`), a withdrawn
offering (`30838`), **and a full section** all return it identically, so the code
alone never tells you why. Confirmed against all five catalogue sections the API
reports as `seatsAreAvailable: 0` — every one returns `Offering Missing` from
`/validation`.

> **So `/validation` does cover seats** — it refuses full sections, it just will not
> say that is the reason. `/courseofferings/{id}` remains the only way to distinguish
> *full* from *gone*, which matters only for the wording shown to the user.

### ⚠ Two UAT behaviours that block wiring this into the cart

Measured 2026-08-17 by sweeping all 297 sections in
`public/data/{oScourses,courses}/course-*.json`. Both need an answer from the SiS
team before `/validation` goes anywhere near add-to-cart.

**1. `Timeblock Conflict` fires for every pair of courses — confirmed defect.**

Of 297 catalogue sections, 255 validate cleanly alone. Put any two of them in a cart
together and the pair is rejected. **0 of 15 arbitrary pairs passed. 0 of 12 pairs
that meet on provably different days passed.** Three-course carts fail too.

```
CONFLICT  ACCT1103-01 [MW 3:30 PM - 4:50 PM]  +  COMM1101-35 [F 9:30 AM - 12:20 PM]
CONFLICT  ACCT1103-01 [MW 3:30 PM - 4:50 PM]  +  COMM1101-51 [T  6:00 PM - 8:50 PM]
CONFLICT  ACCT1103-01 [MW 3:30 PM - 4:50 PM]  +  BIOL1403-01 [Th 11:00 AM - 1:50 PM]
```

Monday/Wednesday afternoon against Friday morning cannot overlap. This is not a
business rule and not sparse test data — the rule itself is wrong.

Likely mechanism: the `timeBlock` fields we receive carry **term spans at midnight**,
not class times —

```jsonc
{ "startTime": "20260902T000000", "endTime": "20261216T000000",
  "frequency": "Weekly", "schedule": "MW 3:30 PM - 4:50 PM" }
```

`startTime`/`endTime` span September to December for every section, and the real
meeting pattern exists only inside the free-text `schedule` string. Comparing the
datetime fields makes every section overlap every other one, which is exactly the
observed result.

**Until this is fixed, `/validation` cannot gate add-to-cart** — it would cap the
cart at one course.

**2. `/validation` rejects 42 sections that `/courseofferings` reports as available.**

Whole-catalogue sweep: 42 of 297 return `Offering Missing` on their own. The set is
not random.

- **all 42 are Open Studies**; zero Extended Ed (all 84 EE sections pass)
- **all 42 are credit-bearing** (41 × 3 credits, 1 × 6); the 84 zero-credit EE
  sections all pass
- heavily concentrated in high-demand intro courses — **ENGL1201 ×10**, COMM1101 ×4,
  INDG1101 ×4, MGMT ×3, PSYC1101 ×2, plus SOCI, ANAT1101, HRES
- **all 5 sections known to be full are in this set**

**Confirmed against a real full section (2026-08-17).** `10730` / `PSYC1101-50` is
known to be full in the SiS:

| source | says |
|---|---|
| `/courseofferings/10730` | `200`, `seatsAreAvailable: 1` — **wrong** |
| `public/data` (what the site renders) | `seatsAvailable: true` — **wrong** |
| `/validation` | `Offering Missing` — **correct** |

So `Offering Missing` is how this API reports a full section, **`/validation` is the
only trustworthy seat check**, and `courseofferings.seatsAreAvailable` should not be
used for one — it catches 5 of the 42.

Two consequences:

- The public site is currently advertising roughly 37 full sections as available, and
  the add-to-cart seat check at `os-course/index.js:554` passes them.
- **Solo validation is safe and worth doing on its own.** A single-course cart cannot
  trigger the conflict defect (255 of 297 sections validate cleanly alone), so
  validating just the course being added — independently of cart context — is
  strictly better than the current seat check and is not blocked by issue 1.

### Rules for any client

**1. A 200 is not a pass.** `isCartValid: false` arrives as HTTP 200. Non-2xx means
the *call* was malformed, never that the cart is bad:

| Status | Cause |
|---|---|
| 400 | `studentId` missing |
| 415 | payload sent on the query string instead of a JSON body |
| 500 | `studentId` present but not numeric (`FormatException` leaks through) |

So do **not** reuse the `if (!response.ok) throw` pattern at
`src/bvc-app/src/js/checkout/index.js:798` — correct for `registration`, wrong here.

**2. Conflict errors do not identify the course being added.** Verified across five
permutations of the pair `(815, 340)` — as `courseBeingAdded`, as the incumbent, and
with the array order reversed — the flag landed on `815` every time. It is not
lowest-id (815 > 340); it is a fixed property of the pair.

Consequence: `courseErrorResponses.find(e => e.offeringId === addedSku)` is an unsafe
add-to-cart gate. Adding 340 to a cart holding 815 flags 815, so that test says
"340 is fine" and admits the conflicting item.

**3. Prefer differential validation over switching on `code`.** The two known codes
need opposite handling — a stale incumbent (`Offering Missing`) should be pruned
while the add proceeds, whereas a `Timeblock Conflict` must block the add regardless
of which id is flagged. Keying that off the `code` string couples the cart to an
undocumented vocabulary.

Instead, validate the cart *without* the new course and *with* it, and attribute any
error that appears to the add. That stays correct for codes we have never seen. The
baseline is free in practice — it is the result of the previous successful add.

**4. Fail open on anything unrecognised.** Guard on the array, not on `isCartValid`:

```js
const errors = Array.isArray(res?.courseErrorResponses) ? res.courseErrorResponses : null;
if (errors === null) return { ok: true, unknown: true };   // shape drifted -> never block
```

If the response shape changes, `isCartValid` becomes `undefined`, which is falsy — a
naive check would silently empty every cart. On an endpoint with no documented
response, that is a matter of when, not if.

**5. The API's own copy is not display-ready.** `Registration failed. 30838 is no
longer available.` exposes an internal id during what is, to the user, a cart
refresh. `...have time conflicts and have been removed. Please review your cart.`
describes a removal the API did not perform. Render our own wording, using the course
name from the cart item.

## `/courseofferings/{id}` — seats and existence

```jsonc
GET .../courseofferings/815
{ "id": 815, "offeringId": "01", "courseId": "ACCT1103", "seatsAreAvailable": 1 }
```

`id` is the offering sisId (the cart's `sku`), `offeringId` is the section suffix
(`"01"` → `ACCT1103-01`), `courseId` the course code. A withdrawn or unknown id
returns **404**.

> **`seatsAreAvailable` is documented as a string enum and returned as an integer.**
> The spec defines `CourseAvailability` as `["Full", "Available"]`; the deployed API
> serialises it by index — `Full = 0`, `Available = 1`.

`os-course.js:554` tests `!availabilityResp.data.seatsAreAvailable`, which is correct
for the integer form (`!0` → blocked) **only by coincidence**. If the API ever adds a
`JsonStringEnumConverter` — the shape the spec already advertises — `"Full"` becomes
a truthy string, `!"Full"` is `false`, and every full section silently becomes
addable with no error anywhere.

Harden against both encodings (same fix at `os-course.js:705`):

```js
const seats  = availabilityResp.data?.seatsAreAvailable;
const isFull = seats === 0 || seats === 'Full';     // block only when definitely full
```

## Spec vs. reality

| # | Spec says | Actually | Impact |
|---|---|---|---|
| 1 | `/validation` 200 has no schema | returns `userError` / `courseErrorResponses` / `isCartValid` | cart logic is built on an undocumented shape |
| 2 | `PostCourseValidation.studentId` is `nullable: true` | omitting it → `400 "The StudentId field is required."` | always send `"0"` |
| 3 | `studentId` is a `string` | non-numeric → `500` FormatException | must be digits in a string |
| 4 | `CourseAvailability` is `"Full"` / `"Available"` | integer `0` / `1` | latent seat-check failure, above |
| 5 | `additionalProperties: false` | unknown body properties are ignored, not rejected | don't rely on either behaviour |
| 6 | `fee` takes `?studentNo=` (query) | client sends `fee/{skus}/{studentNo}` as a path segment, trailing slash required | see `os-course.js:30-34`; works, but is not what is documented |
| 7 | `POST /registration` returns `Registration` | actual body wraps it — client reads `result.newRegistration.id` | `checkout/index.js:804` |
| 8 | `Registration` includes `studentPk` and `studentNumber` | client sends an **empty** `studentPk` to `submit-payment` and never reads these back | see open questions |

## Test fixtures

Verified 2026-08-17. Fixture rot is the usual reason a probe script "fails" when the
API is healthy.

| Id | State |
|---|---|
| `815` | live — `ACCT1103-01`, seats available, validates clean alone |
| `340` | live — `ACCT9103-93`, seats available, validates clean alone |
| **any two live skus together** | `Timeblock Conflict` — see the blocking issues above |
| `816`, `817`, `818`, `2595`, `10044` | live, seats available |
| `3698`, `21669`, `22321`, `3410`, `19066` | **full** — `seatsAreAvailable: 0`; `/validation` calls them `Offering Missing` |
| `2162`, `4153`, `4157` | `courseofferings` says fine, `/validation` says `Offering Missing` |
| `30836`, `30838`, `30839` | **dead — 404.** Hardcoded in `fee-test.ps1`, `studentpk-test.ps1`, `validation-test.ps1` |

Our generated `seatsAvailable` matches the API exactly — the same five sections are
flagged in `public/data` and by `courseofferings`. The catalogue is 297 sections
across both trees, so a full sweep is cheap and is the fastest way to re-measure any
of this.

Live ids can be pulled from `src/bvc-app/public/data/oScourses/course-*.json`
(`sections[].sisId`) rather than hardcoded.

## Probe scripts

Ad-hoc PowerShell probes live in the repo root and are **git-ignored** (`.gitignore`
excludes `*.ps1` by default, since these carry tokens and secrets).

| Script | Covers |
|---|---|
| `token-test.ps1` | Azure AD client_credentials direct, bypassing the proxy |
| `proxy-test.ps1` | token → `submit-payment` smoke test |
| `validation-test.ps1` | `/validation` transport matrix + edge cases |
| `fee-test.ps1` / `fee-test-direct.ps1` | `fee/{sku}/{id}`, through the proxy and direct |
| `studentpk-test.ps1` | `submit-payment` behaviour per `studentPk` — **creates registrations** |

> `token-test.ps1` has a client secret as a parameter default. It is git-ignored, but
> it is plaintext on disk — move it to an env lookup and rotate if it has been shared.

Read-only probes (`validation`, `courseofferings`, `fee`) are safe to run at will.
`studentpk-test.ps1` writes to the UAT SiS.

> ⚠ **These scripts are hardcoded to non-prod.** `fee-test.ps1` and
> `fee-test-direct.ps1` carry `bvc-uat-api-proxy.vercel.app` and `devapi.bvc.dev`
> respectively. Point them at the PROD row above before quoting their output as
> evidence of a production fault. For prod timings, prefer
> `node sis-health-watch.mjs`, which stamps proxy, backend and offering into every
> line it writes.

## Open questions for the SiS team

1. **`Timeblock Conflict` is firing on non-overlapping courses** (blocking issue 1).
   12/12 pairs meeting on different days were rejected. Is the rule comparing
   `timeBlock.startTime`/`endTime` — which arrive as term spans at midnight — instead
   of the day/time in `schedule`? Does prod behave the same? Until this is fixed
   `/validation` cannot gate add-to-cart.
2. **Are the 42 `Offering Missing` sections actually full?** (blocking issue 2).
   They are all OS, all credit-bearing, and concentrated in high-demand courses,
   which suggests `/validation` has the true seat state while
   `courseofferings.seatsAreAvailable` is stale (it flags 5 of the 42). If so, the
   site is showing ~37 full sections as available and `seatsAreAvailable` should not
   be used as a seat check. Please confirm which source is authoritative.
3. **Publish the `/validation` 200 schema**, and the full set of `code` values.
   Two are known; the cart has to behave sensibly for the rest.
4. **Can `Offering Missing` be split?** It currently covers withdrawn, unknown, and
   full. Distinct codes would let us tell a user *"this section filled up"* rather
   than a generic "no longer available".
5. **`studentId` is documented nullable but is required** (divergence 2/3). Either
   the annotation or the doc should change; today it leads straight into a 400.
6. **`CourseAvailability` serialisation** (divergence 4) — is the integer form
   intentional and stable, or will it become the documented string?
7. **`studentPk`.** `POST /registration` returns `studentPk` / `studentNumber`, and
   `submit-payment` accepts `studentPk` — but the client sends it empty.
   `checkout/index.js:16-17` records that a non-empty value 500s for new
   registrations, while `studentpk-test.ps1` expects the opposite (`'1'` → 200,
   empty → 500). One of those is stale. What is the correct value for a new
   anonymous registration, and should it come from the registration response?
8. **`userError.errors`** — is it always plain strings, or can it carry
   `{code, description}` objects like `courseError`? Only ever observed as strings,
   and only for the conflict case.
