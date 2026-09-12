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

**Vocabulary.** `BACKEND_GAP_GROWN_UP_FOOD_CATALOGUE` is now a REAL gap, and the earlier reading of
it as a settled product decision has been reversed.

The position was that the field is an open vocabulary, so the control should take whatever the
customer types. On device that produced exactly what an open vocabulary produces: "It's okay" was
submitted as a household's regional cuisine, alongside half-typed words and free-form spellings of
the same cuisine. None of it can be grouped, counted or matched against a cook, and all of it is
durable customer data. Two answers meaning "Punjabi" were two different rows.

`341:4655` is therefore a PICKER as of this pass. It filters a closed list, only a member of that
list can be added, and the stored value is the list's own spelling — see
`PROFILE_GROWN_UP_FOOD_OPTIONS` in `src/features/profile/fields.ts` and the rules in
`validation.ts`.

**The list is currently bundled with the client, which is the part that still needs the backend.**
Re-wording or extending it costs an app release today, and two clients on different versions can
disagree about what the vocabulary is. It belongs on `GET /v1/catalogue` beside the other published
policy:

```
catalogue.profile.grownUpEatingOptions: { id: string; label: string }[]
```

`cook_profiles.cuisines` already stores the same kind of value on the backend, so the two lists
should be one — a customer's "Bengali food" and a cook's `bengali` are the same fact, and matching
them today means matching on display strings.

No backend change is REQUIRED for this pass to work: `PUT /v1/me/profile` accepts any safe string
for `grownUpEating` (`parseGrownUpEating` in `src/identity/profile-details.ts` bounds length and
count, not vocabulary), so the picker's values submit and prefill unchanged, and answers saved
before it existed still round-trip and can still be removed. Adding the endpoint field is what
closes the gap; until then the client is the source of truth for this one list, and knowingly so.

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

## 2b. Account deletion — CLOSED in contract, wired

`BACKEND_GAP_ACCOUNT_DELETE` is retired. `DELETE /v1/me` exists, is instant and self-serve, and
the frontend consumes it: Profile → Account → Delete Account → No/Yes sheet → `/account/delete-otp`
(Login's own `OtpScreen`, reused rather than reproduced) → `DELETE /v1/me`.

**The code is never pre-verified.** `POST /v1/auth/otp/verify` would consume the one-time code and
mint a session as a side effect, so the delete call would arrive holding a code the server had
already spent. The typed code goes straight into the delete body, which verifies it itself.

**`audience` is sent by deletion only.** `POST /v1/auth/otp/send` defaults a missing `audience` to
`customer`, so Login's request is left exactly as it was — pinned by `authApi.test.ts`, because a
default leaking into Login would change a working production request on the app's only way in.
Deletion also sends the call authenticated: the route ignores the header, but the auth rate limiter
buckets by user id when a token is present and by phone when it is not, which keeps deletion sends
out of the same 8-per-10-minutes budget as login sends on that number.

**Idempotency.** One key per attempt (`account:delete:<userId>`), held across every retry of it —
wrong code, block, timeout, 5xx — because the server hashes an empty body against the key and marks
a failure `failed_retryable`, so the same key with a corrected code is processed rather than
replayed. The key is retired when the customer leaves the OTP screen, so re-entering the flow is a
genuinely new attempt. The key's alphabet is contract (`^[A-Za-z0-9._~-]{8,128}$`, narrower than
the transport's 200-char printable-ASCII ceiling) and is pinned by `idempotency.test.ts`: a
generator swapped for base64 or a wide-alphabet nanoid would emit `+` or `=` and fail as
INVALID_REQUEST, which on this screen is indistinguishable from a mistyped OTP.

**Retention copy.** Bookings, payments and refunds are RETAINED for eight years under Indian tax
law, with the name and number stripped. No copy in this flow may say "all your data will be
deleted"; the store-compliance disclosure is tracked as outstanding UI work, not a contract gap.

**KNOWN: one `GET /v1/me` 401s immediately after a successful deletion.** The contract says not to
call an authenticated endpoint after the 200, and this one is not called deliberately. Sign-out
runs `queryClient.clear()` BEFORE it dispatches `SIGNED_OUT` (`onSessionCleared` in
`src/core/runtime.ts`), so for the moment between the two, the OTP screen's `useMe` observer is
still mounted against an empty cache and refetches with tokens the server has already revoked.

It is bounded to a single request — auth errors are not retryable (`src/core/query/queryClient.ts`)
— and self-correcting: the 401 lands in the same global handler that has already signed the
customer out. It is NOT specific to deletion; a normal Log Out from Profile does the same thing
with the same query. Fixing it properly means reordering teardown inside `sessionController`,
which every sign-out in the app shares, so it is recorded here rather than worked around locally
for one screen. Expect one post-deletion 401 per deletion in backend logs.

**KNOWN: a blocked deletion leaves the six typed digits in place.** `ACCOUNT_DELETION_BLOCKED` is
the one failure where the code was accepted, so the customer may want to retry the SAME code once
they have cleared the booking or refund. The frames draw no CTA — the code submits when the last
digit lands — so there is no control that resubmits an unchanged code. In practice the customer
leaves the screen to deal with the blocker (the notice links them there), and re-entering the flow
resets everything, so this is a dead end only for someone who resolves the block without leaving.

### PENDING_BACKEND_DEPLOYMENT_VERIFICATION — `details.reason` on a blocked deletion

`ACCOUNT_DELETION_BLOCKED` (409) currently returns `{ error: { code, message, requestId } }` with a
fixed sentence naming all three possible causes — active booking, refund in progress, open recovery
case — and no way to tell which one fired. The backend is adding `details.reason`
(`active_booking` / `pending_refund` / `open_recovery_case`) following the same `publicDetails`
pattern `SLOT_UNAVAILABLE` already uses.

The client is already written for both: `deletionFailureView` (`src/features/account`) reads
`details.reason` when present and names the cause with a link to the screen that clears it
(bookings, refunds, or the WhatsApp line for a recovery case, since no resolution screen exists —
see §4), and falls back to the server's own sentence with no link when it is absent. **No frontend
change is needed when the field ships**; re-verify the deep-link targets against a real 409 then.

A blocked deletion is deliberately NOT drawn in the rejected-code slot: the code was accepted, and
tinting the digit boxes red would tell the customer they mistyped something they did not.

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
