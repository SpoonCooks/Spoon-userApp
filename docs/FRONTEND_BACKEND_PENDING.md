# Frontend → backend: pending contract work

**Audited against:** `D:\spoon-backend` — `openapi/openapi.yaml` and the working-tree source at
commit `756b1ab` ("failure fixes"), read only, no changes made. Frontend wiring completed
2026-08-20.

> **Status: WIRED, NOT YET VERIFIED AGAINST A DEPLOYMENT.**
>
> The eight-field profile contract, the per-address serviceability verdict, the tip and extension
> payment orders and the `exceptional` rating all exist in the backend contract and are now
> consumed by this app. None of it has been exercised against a running deployment: at the time of
> writing the backend CI closure was still in flight and the merged contract was **not** deployed.
> Everything below marked `PENDING_BACKEND_DEPLOYMENT_VERIFICATION` is implemented and unit-tested
> against the contract, and is awaiting a deployed backend plus an emulator pass.

---

## 1. Profile — CLOSED in contract, wired

`user_profiles` now carries a column per answer, `PUT /v1/me/profile` accepts all eight and
`GET /v1/me` inlines them beside the identity. The seven `BACKEND_GAP_*` markers this file used to
carry are retired.

| # | PROFILE_FIELD | Contract | Frontend |
|---|---|---|---|
| 1 | `name` **\*** | `string`, required | sent + prefilled |
| 2 | `householdStructure` | enum, nullable | sent + prefilled |
| 3 | `mealStructure` **\*** | enum, nullable | sent + prefilled |
| 4 | `pressingIssue` | text, nullable | sent + prefilled |
| 5 | `dietaryPreference` **\*** | enum, nullable | sent + prefilled |
| 6 | `grownUpEating` | `string[]`, nullable | sent + prefilled |
| 7 | `regionPreference` | enum, nullable | sent + prefilled |
| 8 | `genderPreference` | enum, nullable | sent + prefilled |

The canonical option ids in `src/features/profile/fields.ts` were adopted verbatim by the
contract's enums, so there is no translation layer and none was added.

**Semantics honoured.** `PUT` is a PATCH: an omitted key preserves the stored answer, an explicit
`null` clears it. The screen prefills all eight and submits all eight, so an untouched answer
round-trips its own value rather than relying on omission. `grownUpEating` distinguishes `null`
(never answered) from `[]` (answered, then emptied); the form cannot draw that difference, so
`null` is collapsed to `[]` for DISPLAY only and never on the way out.

**Completeness.** `profileComplete` is now `name` AND `mealStructure` AND `dietaryPreference`, and
is the exact inverse of `onboardingRequired` on `/auth/otp/verify`. Both are consumed verbatim:
the boot gate reads the former, the OTP screen routes on the latter. `BACKEND_GAP_PROFILE_COMPLETENESS`
is retired.

**Vocabulary.** `BACKEND_GAP_GROWN_UP_FOOD_CATALOGUE` stands, deliberately. No endpoint publishes a
regional-cuisine list and the contract documents the field as an OPEN vocabulary. The control takes
what the customer types; no list is fabricated. This is a **product decision**, not a gap to close.

## 2. Serviceability — CLOSED in contract, wired

`GET /v1/me/addresses` returns an evaluated `serviceability` verdict per row, computed at read time
against the live hub, society and gate rows. `G-7` is retired.

The first-run gate no longer reads "no usable address" as "no address at all". It now asks whether
any saved address is something other than `outside_service_area` — `temporarily_unavailable` counts
as usable, because the contract states a paused hub is "expected to work again" and pushing the
customer to the map would only ask them to pin a new point in the same paused area. Nothing on the
client computes coverage, ranks hubs, or reads `hub_id` as a verdict.

### PENDING_BACKEND_DEPLOYMENT_VERIFICATION — address create

`POST /v1/me/addresses` returns `address.serviceability` in the working tree (the `/me/addresses`
handler projects it from the same stage `GET` uses). The DEPLOYED build predates that — it is the
G-7 fix, commit `f074c17` — so on a device pointed at the stale deployment the write response
fails `addressWriteResponseSchema` and the save surfaces "Something went wrong".

Observed on the handset 2026-08-20: the point `12.902429, 77.649321` (HSR Sec 2) passed the
serviceability check and reached `60:655`, and the save then failed boundary validation on the
RESPONSE, not on the request.

This is the app being ahead of the deployment, exactly as with `GET /v1/me`, and it predates the
integration pass — `addressWriteResponseSchema` already required `serviceability`. The schema is
deliberately NOT weakened to accept the stale shape: doing so would drop the one field the
first-run gate now reads. Re-verify after deployment.

## 3. Still open

### `BACKEND_GAP_EXTENSION_KEY_ID` — blocks extension checkout

`POST /v1/bookings/:id/payments/order` and `POST /v1/bookings/:id/tips` both attach the PUBLIC
Razorpay `keyId` to their reply. `POST /v1/bookings/:id/extensions` does not: `ExtensionQuote`
declares no `keyId` and the route returns the service result unchanged
(`src/api/routes/v1/index.ts`, the `/extensions` handler; `ExtensionQuote` in `openapi.yaml`).

Checkout cannot be opened without a publishable key, and embedding one in the app or reusing a key
from a different order would either be rejected downstream or charge the wrong merchant. So the
extension flow **fails closed** at that step.

*Minimal change:* attach `keyId` to the extension quote exactly as the tip route already does
(`{ ...result, keyId: config.providers.razorpay.keyId ?? null }`). The frontend already models the
field as optional and threads it through, so the flow completes with **no further frontend change**.

### `support.whatsappPhone` still unpublished

Not blocking. `resolveWhatsAppPhone` prefers the catalogue whenever it carries a number and falls
back to `+91 8792997836`, so publishing one moves every Help control with no release.

### OpenAPI omissions (document, not behaviour)

Two operations are under-specified relative to the handler. The frontend follows the **handler**:

- `POST /v1/bookings/:id/tips/verify` — the document declares no `requestBody` and no
  `Idempotency-Key` parameter; the handler requires `{ providerPaymentId, signature }` and refuses
  without an idempotency key.
- `POST /v1/bookings/:id/replacement/accept` — the document declares no `requestBody`; the handler
  requires `{ offerId }`.

## 4. Blocked on missing frontend UI — NOT built in this pass

These backend capabilities are complete and unconsumed. Building a surface for them would mean
creating new screens, which the zero-UI-change brief excludes.

| Capability | Endpoint | Why blocked |
|---|---|---|
| Waitlist | `PUT /v1/me/waitlist`, `DELETE` | `BLOCKED_BY_MISSING_EXISTING_UI`. The "Coming soon to your area!" screen (`215:1472`) draws a header, art and two lines of copy — no fields, no submit CTA. The contract wants `name`, `addressId`, `intendedUseCase`, `otherUseCaseText`; none of the four has a control anywhere in the app. |
| Recovery / replacement | `GET /v1/bookings/:id/resolution`, `POST .../replacement/accept`, `POST .../replacement/decline` | `BLOCKED_BY_MISSING_EXISTING_UI`. No resolution screen, no replacement proposal, no accept/decline control exists in code. The endpoints also need an `offerId` that no client surface currently receives. |

## 5. Product decisions — do not "fix"

- **No struck-through list price.** Rejected backend-side: `customer-catalogue.ts` records that
  publishing one "would mean inventing money". `G-3` is closed as a decision, not a gap.
- **No cuisine vocabulary.** See §1.
- **Meal brief has no persistence.** `src/features/mealBrief/data.ts` remains the one
  `useDevFixture` seam, declared in `src/__tests__/productionDataPath.test.ts` so the list stays
  auditable. `useDevFixture` reports `loading` forever outside `__DEV__`, so a release build cannot
  render sample data. `BLOCKED_BY_PRODUCT_DECISION`.
