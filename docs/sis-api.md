# SiS Extended Education API — observed contract

The backend behind the Open Studies / Extended Ed cart and checkout: course
availability, cart validation, fees, registration, and payment.

**Everything in this file marked "observed" was established by calling the UAT API
on 2026-08-17 and 2026-08-18.** That matters because the published spec is incomplete in the one
place the cart depends on most — `/validation`'s success response has no schema at
all — and because several documented shapes do not match what the deployed service
actually returns. Where the two disagree, this file records both.

- **Spec** (OpenAPI 3.0.1, `Thesis Extended Education v1`):
  `OneDrive - Bow Valley College/General/Projects/External Website/Open Studies/API Json/thesis-ext-edu-apiVersion-3.json`
  (a Swagger 2.0 copy and a YAML copy sit beside it; the `-3` file is the one with
  component schemas).
- **Client code**: `src/bvc-app/src/js/os-course/`, `ee-course/`, `checkout/`.
- **Checkout flow narrative**: see `CLAUDE.md` → *bvc-app — Webflow Embeds*. This
  file documents the API surface, not the flow.

## Calling it

Everything goes through the Vercel payment proxy, which forwards to
`devapi.bvc.dev/ths-extended-edu/v1/`. A bearer token is required on every call.

```
POST {apiOrigin}/api/mstoken          body {}          -> { access_token }
*    {apiOrigin}/api/bvcpayment?endpoint=<api path>    Authorization: Bearer <token>
```

`apiOrigin` is `https://bvc-uat-api-proxy.vercel.app` (UAT) or
`https://bvc-api-proxy.vercel.app` (prod). The `endpoint` value is passed
**unescaped** by the probe scripts and by `os-course.js`; the slashes route fine.

The backend can also be hit directly at
`https://devapi.bvc.dev/ths-extended-edu/v1/<api path>` with the same token — useful
for proving a fault is not the proxy's (see `fee-test-direct.ps1`).

> **Transport is per-endpoint and inconsistent.** `submit-payment` takes everything
> on the query string, `registration` takes a JSON body, `validation` takes a JSON
> body and **415s** on the query string, and `fee` accepts either a path segment or
> the documented `?studentNo=` query. Do not infer one endpoint's transport from a
> sibling's.

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

### Error codes

The full set, from the service source (supplied by the SiS team 2026-08-18). Course
codes land in `courseErrorResponses[].courseError[].code`; user errors land in
`userError.errors[]` as plain strings.

| Kind | Code / error | Fires when | Reachable anonymously? |
|---|---|---|---|
| course | `Offering Missing` | `Registration failed. {code} is no longer available.` | **yes** — the only one we have ever seen |
| course | `Offering Full` | `Registration failed. {code} is full.` | in principle — **never observed**, see below |
| course | `AlreadyRegistered` | learner already holds this offering | no — needs a real `studentId` |
| user | `Hold` | account hold blocks registration | no |
| user | `AlreadyEnrolled` / `AlreadyEnrolledV2` | already enrolled in the course | no |
| user | `InternationalLearner` | learner is not domestic | no — depends on the learner record |
| user | `MaximumNumberOfCredits` | credit cap exceeded | no |
| user | `RegistrationRemoved` | a prior registration was removed | no |
| user | *(timeblock)* | `One or more courses in your cart have time conflicts…` | **yes** |

**Everything except the two "yes" rows needs a real learner.** The public cart sends
`studentId: "0"`, so `userError.errors` is always empty for it — confirmed by sweeping
all 297 sections individually and provoking a 12-course, 36-credit cart. Those errors
become reachable only once SSO supplies a real student id.

> ### ⚠ `Offering Full` is never emitted
>
> A dedicated full code exists, yet across **all 297 sections** the only course code
> returned is `Offering Missing` — 42 times. `PSYC1101-50` / `10730`, independently
> confirmed full by the registrar, comes back `Offering Missing`, not `Offering Full`.
>
> **This invalidates the earlier reading in this file that "`Offering Missing` is how
> the API reports a full section".** With a distinct code available and unused, the
> 42 are more likely genuinely absent from whatever set `/validation` consults —
> while `/courseofferings` returns `200` with seats for the same ids, so the two
> endpoints are reading different sources.
>
> Until this is resolved **we cannot tell "full" from "withdrawn"**, which blocks any
> UI that labels a section *Full* (see open question 2).

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

**2. `/validation` rejects sections the site presents as available.**

Whole-catalogue sweep: **46 of 301** (2026-08-18; 42 of 297 the day before) return
`Offering Missing` on their own. The set is not random — it is dominated by
high-demand intro courses (**ENGL1201 ×10**, COMM1101 ×4, INDG1101 ×4, MGMT ×3,
PSYC1101 ×2, plus SOCI, ANAT1101, HRES), and every section independently known to be
full is in it.

**Confirmed against a real full section (2026-08-17).** `10730` / `PSYC1101-50` is
known to be full in the SiS:

| source | says |
|---|---|
| `/courseofferings/10730` | `200`, `seatsAreAvailable: 1` — **wrong** |
| `public/data` (what the site renders) | `seatsAvailable: true` — **wrong** |
| `/validation` | `Offering Missing` — **correct** |

**`/validation` leads `seatsAreAvailable` by at least a day.** Re-swept 2026-08-18:
`PSYC1101-50` **and** `-51` are now `seatsAvailable: false` in `public/data`, which
`/validation` had been reporting as unregisterable 24 hours earlier. Our generated
data and `courseofferings` catch up eventually; validation is right first.

#### `Offering Missing` has two causes, and `courseofferings` separates them

| `courseofferings` | `/validation` | Meaning |
|---|---|---|
| `200`, seats reported | `Offering Missing` | **known but full** — e.g. `PSYC1101-50/10730`, `PSYC1101-51/10732` |
| `404` | `Offering Missing` | **not in the SiS at all** — published to Sitecore but not yet propagated |

The second case is real and visible: `SAFT9406-120…123` (skus `30799`, `30800`,
`30801`, `30802`) appeared in the catalogue on 2026-08-17 with registration opening
the same day for a 2026-09-09 class. Both endpoints refuse them, while the previous
batch of the same course (`SAFT9406-116/117`, registration opened 2026-07-27) is
accepted by both. The site lists all of them; only the older ones can be registered.

This is why the add-to-cart path calls **both** endpoints rather than picking one:
`courseofferings` distinguishes "not there yet" from "full", which `/validation`
alone never can.

#### Stability over 24 hours

| | 2026-08-17 | 2026-08-18 |
|---|---|---|
| catalogue sections | 297 | 301 |
| rejected solo | 42 | 46 |
| freed up since yesterday | — | **0** |
| newly rejected | — | 4 (the new `SAFT9406` batch) |
| flagged full in `public/data` | 5 | 7 |

Nothing that was refused yesterday became registerable today, and every new
rejection is a newly-published section. Note the earlier "all rejections are Open
Studies" observation **no longer holds** — the four `SAFT9406` sections are Extended
Ed. That pattern was an artefact of the catalogue on the day.

Two consequences:

- The site advertises as available both the full sections and the not-yet-propagated
  ones. The seat check at `os-course/index.js:554` passes all of them.
- **Solo validation is safe and worth doing on its own.** A single-course cart cannot
  trigger the conflict defect, so validating just the course being added — with no
  cart context — is strictly better than the seat check and is not blocked by issue 1.

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

## `/registration` — coded field constraints

Verified against UAT 2026-08-20 by POSTing real registrations (`registration-codes-test.ps1`).
Sitecore is the source of truth for these codes — but **two fields cannot carry a
Sitecore SisId**, because the API constrains their format:

| Field | Domain | Why |
|---|---|---|
| `gender` | **single character** — `M` `F` `X` `U` | bound to `System.Char`; `"21"` → `400 "Error converting value \"21\" to type 'System.Char'"` |
| `country`, `country_Citizenship` | **ISO alpha-2** — `CA`, `PH` | `400 "Country code must consist of exactly 2 alphabetic characters"`; Sitecore's `CAN`/`USA`/`FRA` are three |
| `legalStatus` | Sitecore SisId — `1716`, `2207` | plain string; accepted |
| `language` | Sitecore SisId — `121`, `2110` | plain string; accepted |
| `ethnicity` | Sitecore SisId — `2`, `18` | plain string; accepted |

Sitecore's country SisIds are a mix of 146 two-character and 127 three-character
codes, and even the two-character ones are not reliably ISO (`PO` for Poland, `XK`
for the United Kingdom).

**ISO overrides Sitecore for this field** (decision 2026-08-20). Everywhere else
Sitecore is the source of truth, but country codes go out as ISO alpha-2, so the
United Kingdom is `GB` rather than Sitecore's `XK`, and Poland `PL` rather than `PO`.

`scripts/generate-form-options.mjs` resolves each country **from its name**, not its
code — the code cannot be trusted, and `XK` is why: ICU resolves it happily, to
**Kosovo**. Being well-formed is not the same as meaning the right country. Only when
ICU does not recognise the Sitecore spelling ("Vietnam, Republic Of", "People's
Republic of China", "American Somoa") does it fall back to the SisId, then to an
ISO alpha-3 → alpha-2 table.

> **ICU knows more codes than ISO assigns**, and the extras win a name lookup because
> they sort after the canonical code — it maps `RH` to Zimbabwe, `UK` to the United
> Kingdom, `SU` to Russia. Deprecated codes are therefore *detected*, not listed:
> canonicalising `und-XX` returns a different region for an alias (`RH` → `ZW`,
> `AN` → `CW`) and the same one for a live code. Only the exceptionally-reserved and
> user-assigned codes, which alias nothing, are named explicitly.

The four UK constituents Sitecore lists separately (`XF` England, `XG` Northern
Ireland, `XH` Scotland, `XI` Wales) collapse to `GB`, so searching "Scotland" works.

**253 of 273** countries end up with a valid code; the generator exits non-zero if
any row would fail the 2-character rule. `form-options.json` carries
`[isoAlpha2, sitecoreName, sisId]` so a mismatch traces back.

> **Kosovo is the one casualty.** It has no officially assigned ISO alpha-2 — the
> de-facto code is `XK`, which is exactly what Sitecore uses for the United Kingdom.
> Emitting `XK` for Kosovo would file those learners as British in a SiS reading
> Sitecore's table, so it is excluded instead. Needs a decision if any Kosovar
> learner ever registers.

**Nothing is validated beyond format.** Registrations 21–27 store `legalStatus=1`,
`ethnicity=6`, `language=ENG` exactly as sent — values that exist nowhere in
Sitecore. The API is a pass-through writer, so a wrong-but-well-formed code is
accepted silently and only matters to whatever consumes the registration downstream.

Two further observations:

- **`feeGroup` is derived, not stored as sent.** The client sends `'Tuition'`;
  reading a registration back gives `DOMESTIC`. Whether it is computed from
  `legalStatus` or is simply a constant is **unresolved** — `GET /registration/{id}`
  answers `500 "Object reference not set to an instance of an object."` for every
  freshly-created registration (120–124), while older ones (21, 25) read fine. So we
  could not read back what our probes stored.
- `GET /student/{id}` returns *labels*, not codes — `legalStatus=Canadian`,
  `countryCitizen=Canada` — so it cannot be used to infer the write domain.

## Spec vs. reality

| # | Spec says | Actually | Impact |
|---|---|---|---|
| 1 | `/validation` 200 has no schema | returns `userError` / `courseErrorResponses` / `isCartValid` | cart logic is built on an undocumented shape |
| 2 | `PostCourseValidation.studentId` is `nullable: true` | omitting it → `400 "The StudentId field is required."` | always send `"0"` |
| 3 | `studentId` is a `string` | non-numeric → `500` FormatException | must be digits in a string |
| 4 | `CourseAvailability` is `"Full"` / `"Available"` | integer `0` / `1` | latent seat-check failure, above |
| 5 | `additionalProperties: false` | unknown body properties are ignored, not rejected | don't rely on either behaviour |
| 6 | `fee` takes `?studentNo=` (query) | **both** forms work, and the trailing slash is optional — `fee/815`, `fee/815/`, and `fee/815?studentNo=` all return the same 200 | the comment at `os-course.js:30-34` overstates the trailing slash as required |
| 7 | `POST /registration` returns `Registration` | actual body wraps it — client reads `result.newRegistration.id` | `checkout/index.js:804` |
| 8 | `Registration` includes `studentPk` and `studentNumber` | client sends an **empty** `studentPk` to `submit-payment` and never reads these back | see open questions |
| 9 | 404s return `ProblemDetails` (`type`/`title`/`status`/`detail`/`instance`) | they return **`ApiErrorResult`** — `{errorId, errorMessage}` — with a genuinely useful message, e.g. `"Unable to find course offerings with ID 999999999."` | parse `errorMessage`, not `detail`; verified on `courseofferings`, `registration`, `payment` |
| 10 | `GET /student/{id}` documents a 404 | **never 404s.** Any id, including `999999999`, returns `200` with a skeleton `Student` | cannot be used to test whether a student exists |
| 11 | `AdditionalFee` has no `courseSku` | correct — it carries `offeringId` (section suffix, e.g. `93`), `programId` (`ACCT9103`), `programOfferingId` (`ACCT9103-93`) | **our code filters fees on `fee.courseSku`, a field that does not exist** — see below |
| 12 | — | `GET /registration/1` → `500 "Object reference not set to an instance of an object."` | second unguarded null-ref on this API, alongside the `studentPk` one |

### Per-item fee attribution is dead code

`feesForSku()` in `src/js/shared/fees.js` — and the inline version it was extracted
from — filters on `fee.courseSku === sku`. The API never returns that field, so
`item.fees` is always `[]` and `item.feeSummary` always zero.

This is pre-existing, not a regression, and the **displayed totals are unaffected**:
the cart renders the cart-level `summary`, which is correct. Only a per-course fee
breakdown would be empty.

It is arguably unfixable as written, and the dedupe rule is why. Fees are
cart-level, so `dedupeFees()` keeps one set by description — and for a two-course
cart (`815` + `340`) every surviving line is stamped `programOfferingId:
"ACCT9103-93"`, i.e. whichever course happened to be first. After dedupe there is no
per-course attribution left to recover. Either drop the per-item fields or stop
deduping, but they cannot both be right.


## Test fixtures

Verified 2026-08-17. Fixture rot is the usual reason a probe script "fails" when the
API is healthy.

| Id | State |
|---|---|
| `815` | live — `ACCT1103-01`, seats available, validates clean alone |
| `340` | live — `ACCT9103-93`, seats available, validates clean alone |
| **any two live skus together** | `Timeblock Conflict` — see the blocking issues above |
| `816`, `817`, `818`, `2595`, `10044` | live, seats available |
| `3698`, `21669`, `22321`, `3410`, `19066`, `10730`, `10732` | **full** — `seatsAreAvailable: 0`; `/validation` calls them `Offering Missing`. The last two only became `false` in our data on 08-18, a day after validation flagged them |
| `2162`, `4153`, `4157` | `courseofferings` `200`/seats, `/validation` `Offering Missing` — the "known but full" case |
| `30799`, `30800`, `30801`, `30802` | `SAFT9406-120…123` — **404 on `courseofferings`** and `Offering Missing` on validation: published to Sitecore 08-17, not yet in the SiS |
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

## Open questions for the SiS team

1. **`Timeblock Conflict` is firing on non-overlapping courses** (blocking issue 1).
   12/12 pairs meeting on different days were rejected. Is the rule comparing
   `timeBlock.startTime`/`endTime` — which arrive as term spans at midnight — instead
   of the day/time in `schedule`? Does prod behave the same? Until this is fixed
   `/validation` cannot gate add-to-cart.
2. **Confirm the two causes of `Offering Missing`.** We can now separate them with
   `courseofferings` — `200` means known-but-full, `404` means not in the SiS at all
   — and both are live: 42 of the former, 4 of the latter (`SAFT9406-120…123`,
   published to Sitecore on 08-17 and still unregisterable). Is that reading right,
   and **how long should propagation take?** Sections are on the public site now
   that nobody can register.
3. **Why is `seatsAreAvailable` behind?** `/validation` refused `PSYC1101-50/-51` a
   full day before either `courseofferings` or our generated data marked them full.
   Is the seat flag computed on a different schedule, and can it be made to agree?
4. **Publish the `/validation` 200 schema**, and the full set of `code` values.
   Two are known; the cart has to behave sensibly for the rest.
5. **Can `Offering Missing` be split?** It currently covers withdrawn, unknown, and
   full. Distinct codes would let us tell a user *"this section filled up"* rather
   than a generic "no longer available".
6. **`studentId` is documented nullable but is required** (divergence 2/3). Either
   the annotation or the doc should change; today it leads straight into a 400.
7. **`CourseAvailability` serialisation** (divergence 4) — is the integer form
   intentional and stable, or will it become the documented string?
8. **`studentPk`.** `POST /registration` returns `studentPk` / `studentNumber`, and
   `submit-payment` accepts `studentPk` — but the client sends it empty.
   `checkout/index.js:16-17` records that a non-empty value 500s for new
   registrations, while `studentpk-test.ps1` expects the opposite (`'1'` → 200,
   empty → 500). One of those is stale. What is the correct value for a new
   anonymous registration, and should it come from the registration response?
9. **`userError.errors`** — is it always plain strings, or can it carry
   `{code, description}` objects like `courseError`? Only ever observed as strings,
   and only for the conflict case.
10. **404 bodies are `ApiErrorResult`, not the documented `ProblemDetails`**
    (divergence 9), and **`GET /student/{id}` never 404s** (divergence 10) — it
    returns a skeleton record for any id, so it cannot answer "does this student
    exist". Both look like doc bugs rather than service bugs; please confirm.
11. **`GET /registration/1` returns a 500 null-ref** (divergence 12). Harmless to us
    today, but it is the same unguarded-null class as the `studentPk` failure.
