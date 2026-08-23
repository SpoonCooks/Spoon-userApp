# Spoon User App — Backend Connectivity Closure

**Date:** 2026-08-21
**Scope:** `D:\spoon-frontend` (implementation). `D:\spoon-backend` inspected READ-ONLY.
**Supersedes:** the 2026-08-20 revision of this file, written by the run that was interrupted when
the laptop disconnected. This is the single consolidated handover; nothing else in `docs/` is a
connectivity audit, and no prior document was deleted.

---

## 1. Executive outcome

The interrupted run's work was audited, found sound, and **preserved in full**. Everything it
claimed was independently re-verified rather than taken on trust: the full gate, the lifecycle
mapping, the session-recovery edges, the address and refund schema corrections, and the extension
`keyId` blocker. All of it holds.

Three things this run adds on top of it:

1. **The backend truth is now current.** The interrupted run audited backend commit `a13ce96` on
   the unmerged branch `feature/phase10-gate-arrival`. That work has since been merged: backend
   `origin/main` is now **`dc34930`** (PR #17, merged 2026-08-20 18:28 IST), and
   `git diff a13ce96 origin/main` is **empty** — the merged tree is byte-identical to the audited
   one. So the contract findings carried forward unchanged, on a merged basis rather than a
   speculative one.
2. **The deployed runtime is now positively identified**, not inferred. The interrupted run could
   only report route-surface parity and marked deployed-version verification `PARTIAL`. A
   discriminating live probe now proves the deployed build carries the merged profile contract —
   see §6.
3. **One further production-path defect was found and fixed** — a defect that predates the
   interrupted run and that it did not catch, because it is only visible against the deployed
   request schema rather than in either repository's code:

   > **Every address save that filled the optional receiver phone failed.** Both
   > `POST /v1/me/addresses` and `PUT /v1/me/addresses/:addressId` bind `receiverPhone` with
   > `^\+[1-9][0-9]{7,14}$` (E.164). The form draws a bare "Phone no." field on a `phone-pad`
   > whose own placeholder is **`98765 43210`** — and the app sent exactly what was typed. So the
   > value the design invites is precisely the value the backend refuses, and the customer got a
   > generic failure with nothing pointing at the phone field. Confirmed against the **deployed**
   > API, not just the source. §10.

**Not closed, with proof rather than assumption:**

- **Extension checkout** — `BLOCKED_BY_DEPLOYED_BACKEND`. `POST /v1/bookings/:id/extensions` still
  does not attach `keyId` on backend `main`. Re-verified this run against the merged tree and the
  OpenAPI document, where `additionalProperties: false` excludes the field structurally. §11.
- **Waitlist** and **Recovery/Replacement** — `UI_REQUIRED_PRODUCT_GAP`. Endpoints deployed and
  reachable; neither has any existing control that could carry the flow. §12.
- **Push delivery** — `BLOCKED_BY_EXTERNAL_CREDENTIALS`. All code-safe wiring complete; no
  `google-services.json` / APNs key exists in this environment. §13.
- **Device / authenticated-runtime E2E** — `PENDING_DEVICE_VERIFICATION`. The deployed API
  correctly refuses the development OTP echo, so a session needs a real SMS to a real handset. No
  authenticated deployed call was made, and none is claimed. §15.

---

## 2. Interrupted-run recovery findings

### Method

No `reset`, `checkout --`, `stash` or `clean` was run at any point. The working tree was audited in
place with `git status --short`, `git diff --stat`, `git diff --check`,
`git ls-files --others --exclude-standard`, and file mtimes used **as evidence only**.

```
branch  main
HEAD    ab6589c  feat: implement Spoon user app frontend
tree    ~273 modified/added paths, all uncommitted — the project has one commit
```

Because the whole project is uncommitted against a single root commit, `git diff` cannot isolate
the interrupted run. Its edit window was recovered from mtimes instead: a contiguous band from
**20:35 to 21:27 on 2026-08-20**, ending with this document. Twenty-six source files plus four
root/doc files fall inside it, listed in §5.

### Integrity checks, all clean

| Check | Result |
|---|---|
| `git diff --check` (whitespace / conflict damage) | exit 0, no output |
| Conflict markers (`<<<<<<<` / `=======` / `>>>>>>>`) in `src`, `docs` | none |
| `.only` / `.skip` / `xit` / `xdescribe` | none anywhere in `src` |
| `z.any()`, `as any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` in non-test source | **zero** |
| `eslint-disable` in non-test source | 4, all pre-existing and narrowly justified (react-hooks deps x3, `no-require-imports` for the Razorpay native module) |
| Truncated / syntactically invalid files | none — `tsc --noEmit` clean |
| Temporary debugging code | none — `no-console` is an error rule and lint is clean |
| New `TODO`/`FIXME` attributable to the task | none; the 55 `TODO(...)` comments are pre-existing design/product notes, several now stale (§12) |
| Weakened Zod schemas | none. The one schema relaxation (`label` optional on the address write reply) **tightens** agreement with the published contract, and the same change made the refund fields *required* |

### Classification

| Class | Verdict |
|---|---|
| `VALID_AND_COMPLETE` | The whole interrupted edit set. Every file compiles, lints, is covered by tests, and implements what its comments claim. |
| `VALID_BUT_UNVERIFIED` | Its claimed gate result (`72 suites / 1042 tests`). **Re-run this session before any edit of mine: identical — 72/1042, exit 0.** Now verified. |
| `PARTIALLY_IMPLEMENTED` | **None found.** The run reached its document, which it writes last; no half-applied edit, dangling import or orphaned helper exists. |
| `INCORRECT_OR_UNSAFE` | **None found.** |
| `UNRELATED_USER_WORK` | The other ~247 uncommitted paths — Figma assets, fonts, patches, plugins, EAS/dev scripts, prior-phase docs, the built APK. **Untouched.** |

**Nothing was recreated.** Every change the interrupted run made was left exactly as it found it.

---

## 3. Work preserved from the interrupted run

All of it. Specifically, and re-verified in code this session rather than assumed:

| Area | Preserved change | How re-verified |
|---|---|---|
| Booking lifecycle | `lifecycleCopyFor` keyed by the **resolved view**, replacing a table keyed by view name but indexed by backend status | Read `data.ts` / `bookingStatusView.ts`; `BOOKING_STATUS_VIEWS` matches the backend's canonical status set exactly (§8) |
| Lifecycle | Reassignment before departure resolves to Confirmation + notice (8b), not the en-route surface | `viewForBooking` applies `reassigned` only when `base.view === 'enRoute'` |
| Lifecycle | `inService.endsAtMs` from `timing.expectedEnd`; both OTP codes blanked and refilled only from `tracking.serviceOtp` | Read `adapters.ts:307-331, 403-478` |
| Session | `expired` + `SIGNED_IN` -> `authenticated` | Read `sessionMachine.ts:69-85` |
| Session | Authenticated shell watches the session, lets `refreshing` through, redirects to `/login` outside `(app)` | Read `src/app/(app)/_layout.tsx` in full |
| Address | `label` optional on the write reply (`PUT` does not send it) | Backend `main` handler builds the reply without `label`; OpenAPI `AddressWritten` requires only `[id, isDefault, serviceability, latitude, longitude]` |
| Refunds | `refundSchema` on the real field names, required | Read `booking/api/schemas.ts` |
| Home | Banner rating chips wired to `PUT /v1/bookings/:id/rating`, `5+` -> `exceptional` | Read `home.tsx:108-113` and `booking/[id].tsx:178-184` |
| Push | Token-rotation listener; invalidation on `bookingKeys.all()`; deep link to the booking, falling back to `/home` | Read `usePushNotifications.ts:125-131`, `deepLink.ts` |
| Tests | `lifecycleFromDto.test.tsx` (14), `appShellSession.test.tsx` (7), and the added session / address / refund / extension cases | All present and passing |

---

## 4. Work repaired or completed by this run

Nothing needed repair. Two things were **completed**:

1. **The receiver-phone contract defect** — found, fixed, covered. §10.
2. **Deployed-backend verification** — upgraded from the interrupted run's inference to a positive
   contract fingerprint. §6.

The document itself was rewritten to the required structure and truth-table format.

---

## 5. Current frontend and backend versions

### Frontend — `D:\spoon-frontend`

```
branch   main
HEAD     ab6589c  feat: implement Spoon user app frontend
app      spoon-user-app 0.1.0   (package.json, app.config.ts)
state    large uncommitted working tree — preserved; no commit, push, PR or build was made
```

Files the interrupted run touched (mtime 20:35-21:27, 2026-08-20):

```
src/app/(app)/_layout.tsx                    src/features/booking/api/schemas.ts
src/app/(app)/booking/[id].tsx               src/features/booking/api/schemas.test.ts
src/app/(app)/home.tsx                       src/features/booking/adapters.ts
src/app/(app)/meal-brief.tsx                 src/features/booking/data.ts
src/core/auth/sessionMachine.ts              src/features/booking/lifecycleFromDto.test.tsx
src/core/auth/sessionMachine.test.ts         src/features/booking/screens/BookingDetailScreen.tsx
src/features/address/api/schemas.ts          src/features/booking/screens/BookingDetailScreen.test.tsx
src/features/address/api/schemas.test.ts     src/features/booking/state/bookingStatusView.ts
src/features/booking/api/bookingApi.ts       src/features/booking/types.ts
src/features/booking/api/hooks.ts            src/features/history/data.ts
src/features/booking/api/index.ts            src/features/home/screens/HomeScreen.tsx
src/features/booking/api/keys.ts             src/features/notifications/api/hooks.ts
src/__tests__/appShellSession.test.tsx       src/features/notifications/usePushNotifications.ts

.env.example    app.config.ts    eas.json    docs/USER_APP_BACKEND_CONNECTIVITY_CLOSURE.md
```

**Zero files under `src/ui/` and zero under any `components/` directory appear in that set** —
mechanical confirmation that the interrupted run held the UI freeze. §16.

### Backend — `D:\spoon-backend` (read-only)

```
local checkout   feature/phase10-gate-arrival @ a13ce96  "final fixes"
origin/main      dc34930  "Merge pull request #17 from SpoonCooks/feature/phase10-gate-arrival"
                 authored 2026-08-20 18:28:48 +0530
merge parents    1225455 (main) + a13ce96 (branch)
git diff a13ce96 origin/main   ->  EMPTY
```

The only write performed on that repository was `git fetch origin`, which updates remote-tracking
refs and touches neither the working tree nor any branch. **The merge is confirmed**, and because
the merged tree is byte-identical to `a13ce96`, every contract statement the interrupted run made
about `a13ce96` is now a statement about `main`. The task's instruction to treat "backend is
unmerged" as stale is correct; the instruction not to *rely* on the pre-merge report was honoured by
re-deriving each finding from `origin/main` directly.

---

## 6. Deployed backend verification

```
base URL   https://spoon-api-kalc.onrender.com     (app.config.ts -> extra.apiBaseUrl)
probed     2026-08-20T18:56Z .. 2026-08-20T19:40Z

GET /health/live   200  {"status":"ok"}
GET /health/ready  200  {"status":"ready","dependencies":[
                          {"name":"postgres","healthy":true,"durationMs":34.501},
                          {"name":"postgis","healthy":true,"durationMs":35.819},
                          {"name":"redis","healthy":true,"durationMs":61.132}]}
```

No response body or header carries a version, commit or build id — `x-render-origin-server`,
`rndr-id` and `x-request-id` are per-request, not per-build. So the deployed build was identified by
**contract fingerprint** instead.

### The fingerprint

The merge changed exactly one route *schema*: `PUT /v1/me/profile` went from name-only to the
eight-field questionnaire. Fastify validates the body before the auth hook runs, so the two builds
are distinguishable without a token — a rejected body answers `400 INVALID_REQUEST`, an accepted one
falls through to `401 UNAUTHENTICATED`.

```
PUT /v1/me/profile  {"name":"p","dietaryPreference":null,"grownUpEating":["x"],
                     "genderPreference":null}                        -> 401   accepted
PUT /v1/me/profile  {"name":"p","dietaryPreference":"eggetarian","mealStructure":"daily-cook-2x",
                     "regionPreference":"my-state","genderPreference":"either",
                     "householdStructure":"family-with-kids"}        -> 401   accepted
PUT /v1/me/profile  {"name":"p","grownUpEating":["toddler","teen"],
                     "pressingIssue":"time"}                         -> 401   accepted
PUT /v1/me/profile  {"name":"p","dietaryPreference":"pescatarian"}   -> 400   enum enforced
PUT /v1/me/profile  {"name":"p","totallyUnknownField":1}             -> 400   control
```

The pre-merge build rejects all eight-field bodies (`additionalProperties: false`, `name` only). The
deployed instance accepts them **and enforces the merged enums**, while still rejecting a genuinely
unknown key. **The deployed runtime is the merged tree.** The limit of this claim, stated plainly: it
identifies the *contract*, not a commit hash — and since `main` and `a13ce96` have identical trees,
no observable difference between them exists to detect.

### Deployed route and request-contract surface

Every endpoint the app consumes was probed unauthenticated with **the exact body or query string the
client actually sends**. `401` means the request passed schema validation and was refused only for
want of a token; nothing returned `404`.

```
GET  /v1/me · /v1/catalogue · /v1/me/addresses · /v1/me/bookings?limit=20
     /v1/me/bookings/active · /v1/me/refunds?limit=20                              401
GET  /v1/availability/instant?addressId&durationMinutes                            401
GET  /v1/availability/scheduled?addressId&date&durationMinutes                     401
GET  /v1/bookings/{id} · /tracking · /extension-options · /cancellation-preview
     /reschedule-options · /cook-contact · /refunds · /resolution                  401
POST /v1/serviceability/check          {latitude,longitude}                        401
POST /v1/me/addresses                  full write body + Idempotency-Key           401 *
PUT  /v1/me/addresses/{id}             full write body                             401 *
POST /v1/bookings/quote                instant and scheduled variants              401
POST /v1/bookings                      {addressId,slotType,durationMinutes,
                                        mealNotes,referenceUrl}                    401
POST /v1/bookings/{id}/payments/order · /payments/verify                           401
POST /v1/bookings/{id}/cancel          {reasonCode:"CHANGED_PLANS",reasonDetail}   401 **
POST /v1/bookings/{id}/reschedule      {scheduledStart}                            401
PUT  /v1/bookings/{id}/rating          {stars:5,exceptional:true,feedback}
                                       and {stars:4.5}                             401
POST /v1/bookings/{id}/tips {amountPaise} · /tips/verify                           401
POST /v1/bookings/{id}/extensions      {minutes:20}                                401
POST /v1/bookings/{id}/extensions      {minutes:45}                                400  enum enforced
POST /v1/bookings/{id}/extensions/{eid}/verify-payment                             401
PUT  /v1/me/waitlist                   {name,intendedUseCase}                      401
PUT  /v1/me/push-token                 {token,platform:"android"}                  401
```

`*` — only after the `receiverPhone` fix; the pre-fix body returned `400`. §10.
`**` — `reasonCode` is bounded `^[A-Z][A-Z0-9_]{0,63}$`. A lowercase probe returns `400`; the app
sends the catalogue's own published codes, so this is a probe artefact, not a client defect.

No destructive request was made, no payment was attempted, and `POST /v1/auth/otp/send` was
deliberately **not** probed with a schema-valid body, because a valid body sends a real SMS.

### The five states, kept separate

| State | Verdict |
|---|---|
| `IMPLEMENTED_IN_BACKEND_REPOSITORY` | Yes, on `origin/main` `dc34930` |
| `PRESENT_IN_OPENAPI` | Yes for every consumed endpoint; the one exception is the tips-verify `Idempotency-Key` parameter, which the handler requires and the document omits (§11) |
| `DEPLOYED_RUNTIME_VERIFIED` | Route surface and **request** contracts: yes, live. Response bodies: **no** — they need a token (§15) |
| `FRONTEND_CONNECTED` | Per endpoint, §7 |
| `DEVICE_VERIFIED` | **No.** Nothing in this document claims it |

---

## 7. Endpoint-by-endpoint connectivity matrix

| Endpoint | Method | Client | Status |
|---|---|---|---|
| `/v1/auth/otp/send` | POST | `authApi.sendOtp` | Connected — `toE164` normalises to the contract's E.164 |
| `/v1/auth/otp/verify` | POST | `authApi.verifyOtp` | Connected |
| `/v1/auth/refresh` | POST | `sessionGateway` | Connected — single-flight |
| `/v1/auth/logout` | POST | `sessionController.signOut` | Connected — local credentials cleared unconditionally |
| `/v1/me` | GET | `useMe` | Connected — 8 profile fields + `profileComplete` |
| `/v1/me/profile` | PUT | `useUpdateProfile` | Connected — 8 fields, null-vs-omitted preserved, option ids match the backend vocabularies exactly |
| `/v1/catalogue` | GET | `useCatalogue` | Connected — prices, cancellation reasons, tips, support phone, instant promise |
| `/v1/me/addresses` | GET | `useAddresses` | Connected |
| `/v1/me/addresses` | POST | `useCreateAddress` | **Fixed this run** — `receiverPhone` now E.164; `addressCreateScope(input)` over the full payload |
| `/v1/me/addresses/:id` | PUT | `useUpdateAddress` | **Fixed** — `label` optional (interrupted run); `receiverPhone` E.164 (this run) |
| `/v1/me/addresses/:id` | DELETE | `useDeleteAddress` | Connected |
| `/v1/serviceability/check` | POST | `useServiceabilityCheck` | Connected — verdict, reason and hub all survive parsing |
| `/v1/me/waitlist` | PUT | — | **Not wired** — `UI_REQUIRED_PRODUCT_GAP` (§12) |
| `/v1/availability/instant` | GET | `useInstantAvailability` | Connected |
| `/v1/availability/scheduled` | GET | `useScheduledAvailability` | Connected — slots are server slots, not a static list |
| `/v1/bookings/quote` | POST | `useQuote` | Connected — selected saved address |
| `/v1/bookings` | POST | `useCreateBooking` | Connected — server price/tax/total; idempotency scoped to the draft |
| `/v1/bookings/:id` | GET | `useBookingDetail` | **Fixed** — status maps to the right view; polled |
| `/v1/me/bookings` | GET | `useBookingHistory` | Connected |
| `/v1/me/bookings/active` | GET | `useActiveBookings` | Connected — backend priority order consumed as-is, never re-sorted |
| `/v1/me/refunds` | GET | `useRefunds` | **Fixed** — real field names |
| `/v1/bookings/:id/refunds` | GET | `useBookingRefunds` | Connected — auto-cancelled refund amount |
| `/v1/bookings/:id/payments/order` | POST | `usePayForBooking` | Connected |
| `/v1/bookings/:id/payments/verify` | POST | `usePayForBooking` | Connected — success only after the server verifies |
| `/v1/bookings/:id/cancellation-preview` | GET | `useCancellationPreview` | Connected — `staleTime: 0`, refreshed before confirmation |
| `/v1/bookings/:id/cancel` | POST | `useCancelBooking` | Connected — catalogue reason codes |
| `/v1/bookings/:id/reschedule-options` | GET | `useRescheduleOptions` | Connected — backend eligibility is the authority |
| `/v1/bookings/:id/reschedule` | POST | `useRescheduleBooking` | Connected |
| `/v1/bookings/:id/cook-contact` | GET | `useCallCook` | Connected — on press only, never cached |
| `/v1/bookings/:id/tracking` | GET | `useTracking` | Connected — server `refreshAfterSeconds` honoured; stops after arrival |
| `/v1/bookings/:id/extension-options` | GET | `useExtensionOptions` | Connected |
| `/v1/bookings/:id/extensions` | POST | `useCreateExtension` | Connected (order) — checkout blocked, §11 |
| `/v1/bookings/:id/extensions/:eid/verify-payment` | POST | `useCreateExtension` | Implemented; unreachable until `keyId` ships |
| `/v1/bookings/:id/rating` | PUT | `useRateBooking` | Connected — from Completion and the Home banner |
| `/v1/bookings/:id/tips` | POST | `useTipCook` | Connected |
| `/v1/bookings/:id/tips/verify` | POST | `useTipCook` | Connected |
| `/v1/bookings/:id/resolution` | GET | — | **Not wired** — `UI_REQUIRED_PRODUCT_GAP` (§12) |
| `/v1/bookings/:id/replacement/accept` | POST | — | **Not wired** — `UI_REQUIRED_PRODUCT_GAP` |
| `/v1/bookings/:id/replacement/decline` | POST | — | **Not wired** — `UI_REQUIRED_PRODUCT_GAP` |
| `/v1/me/push-token` | PUT | `useRegisterPushToken` | Connected — on sign-in and on OS token rotation |

---

## 8. Backend-status-to-screen mapping

The backend's canonical set, confirmed from the `bookings.status` CHECK constraint on `main`:

```
created · assigned · cook_en_route · cook_arrived · cooking · completed · cancelled
```

`BOOKING_STATUS_VIEWS` in `src/features/booking/state/bookingStatusView.ts` is the only place those
strings appear in the app, and it covers all seven.

| Backend state | Resolved view | Existing screen |
|---|---|---|
| `created` (payment pending) | `confirmation` | Confirmation; `isAwaitingConfirmation` holds the customer on the confirming surface until the server moves on |
| `assigned` | `confirmation` | Confirmation, with the cook card once `cook` is on the payload |
| `assigned`/`created` **+ `reassignment.occurred`** | `confirmation` | Confirmation **+ the `292:201` reassignment notice** (page 8b) — not the en-route surface, which has no sub-model for it |
| `cook_en_route` | `enRoute` | Tracking, ETA from `eta.estimatedArrivalAt`; on-time vs late chosen by the server's `timingVerdict` (`UNKNOWN` is not treated as on time) |
| `cook_en_route` **+ `reassignment.occurred`** | `reassigned` | Tracking's reassigned variant (8c / 8d) |
| `cook_arrived` | `arrived` | Arrived, "Cook has arrived at your location"; Start OTP rendered **only** from `tracking.serviceOtp.start`; ETA polling stops |
| `cooking` | `inService` | In-service timer counting to `timing.expectedEnd`; End OTP from `tracking.serviceOtp.end`; Extend available |
| `completed`, `allowedActions.canRate === true` | `completion` | Completion with rating and tip reachable |
| `completed`, rated | `completion` | Completion without the rating prompt |
| `cancelled`, `cancelledBy !== 'system'` | `cancelled` | Cancelled |
| `cancelled`, `cancelledBy === 'system'` | `autoCancelled` | Auto-cancelled, refund amount from `GET /bookings/:id/refunds` |
| anything unrecognised | `unknown` | Safe generic state **plus a log** — forward-compatibility, not a fallback the live states hit |

Reassignment is an **attribute**, never a status: it is read from `reassignment.occurred` and layered
onto whichever lifecycle state the booking is actually in, so it cannot destroy the base state.

### Home banner

| Backend condition | Banner |
|---|---|
| `created` / `assigned` | Upcoming / Confirmed |
| + `reassignment.occurred` | Reassigned |
| `cook_en_route` | Arriving, with ETA minutes from tracking |
| `cook_arrived` | Arrived — uses the persisted `timing.arrivedAt`; ETA tracking stops |
| `cooking` | Live booking, minutes left from `timing.expectedEnd` |
| `completed` + `canRate` | Rating required — actionable only for rating |

Priority between multiple bookings is the **backend's**: `GET /v1/me/bookings/active` orders
`cooking > cook_arrived > cook_en_route > assigned/created > completed-unrated`, and the client takes
`data[0]` without re-sorting.

---

## 9. Files changed, and why

### By this run

| File | Change |
|---|---|
| `src/features/address/api/addressApi.ts` | `bodyOf` now normalises `receiverPhone` through `toE164` — the same helper Login already uses for `POST /v1/auth/otp/send`. Placed on the transport boundary so create, update and `addressCreateScope` see identical bytes. No other field touched. |
| `src/features/address/api/addressApi.test.ts` | **New.** 9 cases: the four typed forms a customer can produce, omission, update, conformance to the backend's own pattern, and the two idempotency-scope consequences. |

### By the interrupted run, preserved

Booking lifecycle (`data.ts`, `adapters.ts`, `bookingStatusView.ts`, `types.ts`, `api/*`,
`screens/BookingDetailScreen.tsx`); address (`api/schemas.ts`); session
(`core/auth/sessionMachine.ts`, `src/app/(app)/_layout.tsx`); home (`src/app/(app)/home.tsx`,
`screens/HomeScreen.tsx`); history (`history/data.ts`); push (`notifications/*`, `app.config.ts`,
`.env.example`); two stale-comment corrections (`booking/[id].tsx`, `meal-brief.tsx`); `eas.json`
(trailing newline only); and the tests listed in §14. Per-file rationale is in §3.

**Preserved untouched:** the ~247 other uncommitted paths. No commit, push, PR, deploy or EAS build
was made. No backend file was modified.

---

## 10. Bugs fixed

### Found and fixed this run

**20. The receiver's phone was sent in a format the deployed backend refuses.**

*Endpoints:* `POST /v1/me/addresses` and `PUT /v1/me/addresses/:addressId`.

*Contract:* both bind `receiverPhone` with `^\+[1-9][0-9]{7,14}$` — E.164, country code required
(`src/api/routes/v1/index.ts:920` and `:1040` on `main`).

*What the app sent:* `form.receiverPhone.trim()`, raw. The field is drawn as a bare "Phone no." on a
`phone-pad` (`64:27`), its placeholder is `98765 43210`, and the block is marked "(Optional)" — so
there is no country-code affordance anywhere on screen and no validation state to fail into.

*Live evidence, deployed instance:*

```
POST /v1/me/addresses  {... receiverPhone:"9876543210"      }  -> 400 INVALID_REQUEST
POST /v1/me/addresses  {... receiverPhone:"+91 98765 43210" }  -> 400 INVALID_REQUEST
POST /v1/me/addresses  {... receiverPhone:"+919876543210"   }  -> 401 (schema accepted)
PUT  /v1/me/addresses/{id}                                      -> the same three results
```

Bisected field by field: with every other optional field present and `receiverPhone` omitted the
same body returns `401`; adding the phone alone flips it to `400`.

*Customer impact:* a completed address form with a receiver phone filled in never saved. The error
surfaced as a generic failure with nothing indicating which field was at fault, and retrying re-sent
the same rejected body. Address creation is on the critical path — no address, no booking.

*Fix:* one call to the app's existing `toE164` on the transport boundary. It only ever *adds* the
prefix and strips separators; a number already carrying its country code, and one the backend
previously stored and the edit form replayed, both pass through unchanged. No UI, no copy, no
validation rule and no new business assumption: the country code reused is the one Login already
sends, taken from the design's own `+91` cell.

*Idempotency consequence, deliberate:* because `addressCreateScope` derives from the same `bodyOf`,
"98765 43210" and "9876543210" now scope to one intent and reuse one `Idempotency-Key`, instead of
minting a second key for a request the backend would consider identical.

### Found and fixed by the interrupted run, verified this run

1. **Booking lifecycle mapping — the primary defect.** The copy table was keyed by frontend view
   name and indexed by backend status, so every live booking missed the lookup and rendered "This
   booking is being updated". En route, Arrived, Start OTP, the timer, End OTP, Extend, Completion,
   rating and tip were all unreachable from a real booking.
2. **Reassignment before departure resolved to the wrong screen** — it needs an en-route sub-model
   the confirmation copy does not carry, so the host fell through to the placeholder. It is page 8b.
3. **Reassignment was never read at all** — `reassignment.occurred` was not passed into view
   resolution; the notice is now also *dropped* when the server reports none.
4. **The service timer was never populated** — it kept the fixture's `now + 48 min`; now
   `timing.expectedEnd`, the only correct answer for a late or extended service.
5. **Fixture OTP `111` was reachable.** Both codes blanked, refilled only from `tracking.serviceOtp`.
6. **The banner named the wrong cook** — "Cook Rekha" came from the fixture; now `cook.name`.
7. **On-time / late was never server-driven** — `timingVerdict` parsed and discarded.
8. **The auto-cancelled refund was the frame's ₹135** — now `GET /bookings/:id/refunds`.
9. **The completion headline was "12th April • 1:15 PM • 1 hr"** — now the booking's own schedule.
10. **A successful address update was reported as a failure** — `label` required, never sent by `PUT`.
11. **Every refund row was empty** — three wrong field names, all optional, so a valid record parsed
    to `undefined`s and nothing threw.
12. **Session expiry was unrecoverable without a restart** — `expired` ignored `SIGNED_IN`.
13. **The authenticated shell ignored expiry** — no route out of a Home whose every read 401s.
14. **The Home banner's rating chips were permanently disabled** — drawn, but no handler was wired.
15. **The extension sheet showed frame prices** — now server options and tax-inclusive totals.
16. **The extension sheet could submit an option the server never offered** — the fixture's
    `defaultOptionId` survived an empty option list, leaving the CTA live and preselected.
17. **The Instant sheet showed invented prices and struck-through "was" prices while loading** —
    DEC-071 is explicit that V0 has no promo engine and no backend strike-price authority.
18. **The booking screen did not follow the booking** — the detail read was not polled.
19. **Push token rotation was never registered** — the backend's copy would silently stop delivering.

---

## 11. Remaining backend blockers, with evidence

### BLOCKED_BY_DEPLOYED_BACKEND — extension checkout has no `keyId`

Re-verified this run against `origin/main` `dc34930`, independently of the earlier report.

**Request the client makes:**

```http
POST /v1/bookings/{bookingId}/extensions
Authorization: Bearer <access token>
Idempotency-Key: <stable, scoped to booking.extend:{bookingId}:{minutes}>
Content-Type: application/json

{ "minutes": 20 }
```

**The response has no `keyId`. Three sources on `main` agree:**

1. `openapi/openapi.yaml:2160` — `ExtensionQuote` = `ExtensionOption` + `{extensionId, state,
   paymentId, calculatedAt, providerOrderId}` with **`additionalProperties: false`**. The field is
   structurally excluded, not merely undocumented.
2. `src/fulfilment/extension-service.ts` — `ExtensionQuote` declares no `keyId`;
   `createExtensionPaymentOrder` returns `{ ...quote, providerOrderId }`.
3. `src/api/routes/v1/index.ts:2409` — the route sends that result unchanged.

**Contrast — `keyId` is attached at the route, which is exactly why this one missed it:**

```
src/api/routes/v1/index.ts:1529   keyId: config.providers.razorpay.keyId ?? null   // payments/order
src/api/routes/v1/index.ts:1710   keyId: config.providers.razorpay.keyId ?? null   // tips
src/api/routes/v1/index.ts:2409   (no keyId)                                       // extensions
```

**Client behaviour: fails closed.** `useCreateExtension` throws instead of opening Razorpay — a
fabricated or app-embedded key would either be rejected downstream or take a real payment against
the wrong merchant. `extensionQuoteSchema` types `keyId` as `z.string().nullable().optional()`, so
the response parses cleanly today and the flow completes unchanged the day the field ships. Covered
by `checkoutFlows.test.tsx`.

**Smallest backend fix — one line, mirroring line 1710:**

```ts
const result = await createExtensionPaymentOrder(resolution(), paymentProvider, quote);
return reply.code(201).send(jsonData({ ...result, keyId: config.providers.razorpay.keyId ?? null }));
```

plus `keyId: { type: [string, 'null'] }` on `ExtensionQuote` in `openapi/openapi.yaml` — required,
because `additionalProperties: false` would otherwise reject it.

**Evidence limitation, stated plainly:** the response body was **not** captured from the deployed
instance, because that needs a token (§15). The evidence is contract-level, plus live confirmation
that the route is registered and its `minutes` enum enforced on the deployed instance (§6).

### BLOCKED_BY_DEPLOYED_BACKEND (minor) — no push-token revocation

`PUT /v1/me/push-token` is the only push route. `device_push_tokens` carries `revoked_at`, but no
customer-facing route sets it, so logout cannot revoke. The mitigation is the backend's own and is
real: re-registering a token under a different account **moves** it
(`ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id`), so a shared handset stops
delivering the previous customer's notifications at the next sign-in. Between logout and that
sign-in the association persists. Smallest fix: `DELETE /v1/me/push-token` setting `revoked_at`,
called from `sessionController.signOut`.

### Contract inconsistencies recorded, not worked around

- `GET /v1/me/addresses` returns `hub_id` in snake_case among camelCase neighbours. The schema
  spells it as it is; the adapter renames it.
- `POST /v1/me/addresses` echoes `label`; `PUT` does not. Both conform to `AddressWritten`.
- `POST /v1/bookings/:id/tips/verify` **requires** an `Idempotency-Key` (the handler refuses without
  one) but the OpenAPI operation does not declare the parameter. The client always sends it.
- `receiverPhone` demands E.164 while the drawn field offers no country-code affordance. Handled at
  the transport boundary (§10); a designed `+91` prefix cell on `64:27` would be the product fix.

---

## 12. UI / product gaps excluded by the freeze

### UI_REQUIRED_PRODUCT_GAP — Waitlist

`PUT /v1/me/waitlist` is deployed and reachable (`401` on a schema-valid probe), taking
`{name, addressId?, intendedUseCase?, otherUseCaseText?}` with only `name` required.

`AddressOutOfServiceView` (`215:1472`, "Coming soon to your area!") is its natural home and **has no
action surface at all**. Read in full this run: a back-titled header, an illustration disc, a
headline and an apology line. No CTA, no input, no `addressId` — the address was refused, so none
was created. Its view model is exactly `{headerTitle, title, message}`.

Not wired, and deliberately not by a side effect: enrolling a customer in a waitlist on screen
entry, without a control they pressed, is a consent decision this task has no authority to make.
Needs one designed CTA and a product decision on which optional fields to collect.

### UI_REQUIRED_PRODUCT_GAP — Recovery / replacement

`GET /v1/bookings/:id/resolution` and `POST .../replacement/{accept,decline}` are all deployed and
registered. A repository-wide search finds **no** replacement-offer screen, sheet, banner variant or
accept/decline control anywhere in the app — the only matches for "replacement" are two prose
comments. There is nothing to connect. The capability is real and is not being hidden; it needs a
designed surface.

### UI_REQUIRED_PRODUCT_GAP — customer-initiated cancellation has no result surface

The cancellation sheet's `confirmed` step is the terminus. No screen shows a customer-cancelled
booking's own refund outcome afterwards.

### UI gaps — history and refund pills

No `Cancelled` pill exists in the drawn history status set (B-15), and no failed/reconcile pill
exists for refunds (D-15). `history/data.ts` therefore maps `succeeded` -> "Refunded",
`requested` / `provider_pending` / `failed_retryable` -> "Processing", and draws **no pill** for
`reconcile_required` / `failed_terminal` rather than inventing one.

### PRODUCT_DECISION_PENDING — Meal Brief

`src/features/mealBrief/data.ts` is the last `useDevFixture` in the app and is deliberately
inactive. The backend gap is *not* persistence — `POST /v1/bookings` accepts `mealBrief`,
`mealNotes` and `referenceUrl`, and the catalogue publishes `mealBrief` bounds. The real gap is that
no approved production entry point routes to the screen. Kept honest and classified
`PRODUCT_DECISION_PENDING`, not "connected".

### Stale in-code documentation

Several `TODO(backend-contract)` comments in feature barrel files still say endpoints "do not
exist" — cancellation, history, tracking, scheduling — which the merged backend has since
contradicted. They are comments only; no code reads them, and correcting all of them would touch a
dozen files for no functional gain. Recorded here rather than silently swept.

---

## 13. Credential, provider and device blockers

### BLOCKED_BY_EXTERNAL_CREDENTIALS — FCM / APNs

All code-safe wiring is complete: `expo-notifications` plugin configured in `app.config.ts` with the
iOS `aps-environment` entitlement and the remote-notification background mode; an optional
`android.googleServicesFile` fed from `GOOGLE_SERVICES_JSON`; token acquisition; registration via
`PUT /v1/me/push-token` on sign-in **and** on OS token rotation; foreground and tap handlers;
`bookingKeys.all()` invalidation on receipt; and deep links that route to the booking or fall back
to `/home`.

Push payload text is never treated as business truth — a notification triggers a refetch, and the
screen renders what the backend then returns.

Missing: `google-services.json` for `com.spoonhelp.userapp.dev`, and an APNs key in EAS. Neither
exists in this environment. **No secret was committed**; `.env.example` documents
`GOOGLE_SERVICES_JSON` as a *path*, never contents.

### PENDING_DEVICE_VERIFICATION — authenticated deployed runtime

The deployed environment correctly refuses the development OTP echo (`loadConfig` rejects the flag
outside development/test), so obtaining a session requires a real SMS to a real handset. No
authenticated deployed call was made.

### No provider smoke test

No Razorpay checkout was opened, in test mode or otherwise. No real charge was created.

---

## 14. Test results

### Full gate — this session, with the fix in place

```
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!

$ npm run typecheck
> tsc --noEmit
(no output — clean)

$ npm run lint
> eslint . --max-warnings=0
(no output — 0 errors, 0 warnings)

$ npm test -- --runInBand --silent
Test Suites: 73 passed, 73 total
Tests:       1051 passed, 1051 total
Snapshots:   0 total
Time:        73.946 s

$ git diff --check
(no output — exit 0)
```

`FRONTEND_BUILD: NOT_APPLICABLE` — there is no `build` script in `package.json` (`start`, `android`,
`ios`, `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `verify`,
`postinstall`). A native build is an EAS operation and was not run. No fake build script was added.

### Attribution run — the interrupted work alone, before any edit of mine

```
Test Suites: 72 passed, 72 total
Tests:       1042 passed, 1042 total
exit 0
```

Identical to what the interrupted run reported, which is what upgrades its claim from
`VALID_BUT_UNVERIFIED` to verified. The delta to 73/1051 is exactly this run's new suite (+9).

### Focused runs

```
$ npx jest --runInBand src/features/address
Test Suites: 9 passed, 9 total   Tests: 142 passed

$ npx jest --runInBand src/features/address/api/addressApi.test.ts
Tests: 9 passed  (receiver phone: 4 typed forms, omission, update, backend-pattern
                  conformance; scope: same-intent reuse, genuine-change rotation)
```

### Required coverage map

| Area | Covering suites |
|---|---|
| Session expiry -> re-login | `core/auth/sessionMachine.test.ts`, `sessionController.test.ts`, `singleFlight.test.ts`, `tokenStore.test.ts`, `__tests__/appShellSession.test.tsx` |
| Profile 8-field read/save, completeness | `profile.test.tsx`, `profileContract.test.ts`, `profileFields.test.ts`, `profileOnboarding.test.tsx` |
| Address create/update/delete, serviceability parsing, idempotency | `address/api/schemas.test.ts`, **`address/api/addressApi.test.ts`**, `addressIdempotency.test.tsx`, `addressSubmitGate.test.tsx`, `finalFigmaAddress.test.tsx`, `AddressScreens.test.tsx` |
| Booking DTO -> view mapping | `lifecycleFromDto.test.tsx`, `adapters.test.ts`, `bookingStatusView.test.ts`, `lifecycle.test.tsx`, `finalFigmaLifecycle.test.tsx` |
| Dynamic banner states, multi-booking priority | `homeBannerView.test.ts`, `HomeScreen.test.tsx` |
| Tracking and arrival | `booking/api/schemas.test.ts`, `adapters.test.ts`, `lifecycleFromDto.test.tsx` |
| Start/End OTP parsing, service timer | `lifecycleFromDto.test.tsx`, `adapters.test.ts` |
| Booking payment | `submission.test.tsx`, `payment/api/razorpayLauncher.test.ts` |
| Extension order / checkout / verification | `checkoutFlows.test.tsx` (incl. the `keyId` fail-closed case), `BookingDetailScreen.test.tsx` |
| Tip payment, exceptional rating | `checkoutFlows.test.tsx`, `lifecycleFromDto.test.tsx` |
| Cancellation, rescheduling, refund/history parsing | `CancelBookingSheet.test.tsx`, `BookingListScreen.test.tsx`, `booking/api/schemas.test.ts`, `reschedule/eligibility.test.ts` |
| Waitlist | Not applicable — no UI to submit it (§12) |
| Push invalidation and deep links | `notifications/deepLink.test.ts` |
| `productionDataPath` | `__tests__/productionDataPath.test.ts`, plus the no-`111` / no-`₹135` / no-`Extend • ₹16` assertions in `lifecycleFromDto.test.tsx` and `BookingDetailScreen.test.tsx` |

No test was skipped, disabled or weakened to make the gate green.

---

## 15. Manual device evidence

**None. No physical-device run was performed and none is claimed.**

What *was* performed, and nothing more:

| Check | Result |
|---|---|
| Deployed liveness / readiness | `200`; postgres, postgis, redis all healthy |
| Deployed build identity | Contract fingerprint — the merged 8-field profile schema is live, enums enforced (§6) |
| Deployed request contracts | ~35 endpoints probed unauthenticated with the client's exact bodies/queries; all registered, all schema-accepted except the two documented probe artefacts |
| Backend contract | `origin/main` `dc34930` source + `openapi/openapi.yaml` read for every consumed endpoint |
| Automated gates | format, typecheck, lint, 1051 tests, `git diff --check` — all clean |

Not performed: any authenticated deployed call, any Razorpay checkout (test mode included), any FCM
or APNs delivery, and the `login -> profile -> address -> booking -> payment -> arrival -> OTP ->
timer -> extension -> rating -> history` handset walkthrough.

The serviceable coordinate `12.902429, 77.649321` was used as fixture data in unit tests and inside
unauthenticated schema probes that were refused at the auth boundary. It never reached a
serviceability decision on the deployed instance.

---

## 16. Zero-UI-change confirmation

**This run modified two files: `src/features/address/api/addressApi.ts` (transport) and a new test
file. Neither is a UI file. No file under `src/ui/`, no `components/` file, and no screen was
touched by this run at all.**

For the interrupted run, the same holds mechanically: its 26-file edit window contains **zero**
`src/ui/` and **zero** `components/` paths. Two `screens/` files appear, both data plumbing:

- `BookingDetailScreen.tsx` — an optional `bookingId` prop passed, with the already-tracked
  `extensionOptionId`, into the existing `useExtensionData` call. No JSX element, style or string
  changed.
- `HomeScreen.tsx` — the existing optional `onRateActiveBooking` signature widened to carry the
  banner's destination; an inline conditional spread replaced by a `bannerRater` helper producing
  the identical prop. No JSX element, style or string changed.

No layout, spacing, colour, typography, icon, illustration, label, copy string, animation or
navigation route was changed. No screen was added, removed or redesigned. No Figma component was
replaced. No loading, empty, error, modal, sheet or banner **design** was altered. No test id was
added to a rendered tree. The rendered-tree suites (`routes.test.tsx`, `responsive.test.tsx`, the
`finalFigma*` suites, `AddressScreens.test.tsx`) all pass unchanged.

### Deliberate customer-visible behaviour changes, and why each is required

The freeze permits behaviour changes necessary to connect the existing design to backend truth.
Five qualify, listed rather than buried:

1. **Live bookings render their designed screens** instead of "This booking is being updated". That
   is the defect being fixed.
2. **The Home banner's rating chips are interactive.** They were drawn but permanently disabled
   because the route wired no handler; they now render in their designed enabled state.
3. **Prices and OTP digits are withheld until the server supplies them.** The alternative is showing
   a price or a code that is not real.
4. **The extension CTA reads "Extend" until an option is priced**, then carries the server's
   tax-inclusive total. Previously it always read `Extend • ₹16`.
5. **An address with a receiver phone now saves.** Behaviour change: failure -> success. The digits
   the customer typed are unchanged and nothing new is displayed.

---

## 17. Final truth table

```
INTERRUPTED_WORK_AUDITED:                         YES
VALID_INTERRUPTED_WORK_PRESERVED:                 YES
PARTIAL_INTERRUPTED_WORK_COMPLETED:               NOT_APPLICABLE
UNRELATED_USER_WORK_PRESERVED:                    YES
USER_APP_UI_CHANGED:                              NO

DEPLOYED_BACKEND_VERSION_VERIFIED:                YES
DEPLOYED_PROFILE_CONTRACT_VERIFIED:               YES
DEPLOYED_ADDRESS_CONTRACT_VERIFIED:               YES
DEPLOYED_EXTENSION_CONTRACT_VERIFIED:             PARTIAL

USER_AUTH_CONNECTED:                              YES
SESSION_EXPIRY_RECOVERY_WORKS:                    YES
USER_PROFILE_ALL_FIELDS_CONNECTED:                YES
PROFILE_COMPLETENESS_CONNECTED:                   YES
ADDRESS_CREATE_CONNECTED:                         YES
ADDRESS_UPDATE_CONNECTED:                         YES
ADDRESS_DELETE_CONNECTED:                         YES
SERVICEABILITY_BACKEND_DRIVEN:                    YES

CATALOGUE_CONNECTED:                              YES
INSTANT_AVAILABILITY_CONNECTED:                   YES
SCHEDULED_AVAILABILITY_CONNECTED:                 YES
BOOKING_QUOTE_CONNECTED:                          YES
BOOKING_CREATE_CONNECTED:                         YES
BOOKING_PAYMENT_CONNECTED:                        YES

BOOKING_STATUS_MAPPING_FIXED:                     YES
LIVE_BOOKING_FLOW_CONNECTED:                      YES
DYNAMIC_BANNER_CONNECTED:                         YES
MULTIPLE_BOOKING_PRIORITY_CONNECTED:              YES
TRACKING_CONNECTED:                               YES
ARRIVAL_STATUS_CONNECTED:                         YES
RAW_COOK_COORDINATES_EXPOSED_TO_CUSTOMER:         NO

START_OTP_CONNECTED:                              YES
SERVICE_TIMER_CONNECTED:                          YES
END_OTP_CONNECTED:                                YES

EXTENSION_ORDER_CONNECTED:                        YES
EXTENSION_CHECKOUT_CONNECTED:                     BLOCKED_BY_DEPLOYED_BACKEND
EXTENSION_VERIFICATION_CONNECTED:                 PARTIAL
TIP_PAYMENT_CONNECTED:                            YES
RATING_EXCEPTIONAL_CONNECTED:                     YES

CANCELLATION_CONNECTED:                           YES
RESCHEDULING_CONNECTED:                           YES
REFUNDS_CONNECTED:                                YES
BOOKING_HISTORY_CONNECTED:                        YES
WAITLIST_CONNECTED:                               UI_REQUIRED_PRODUCT_GAP
RECOVERY_CONNECTED:                               UI_REQUIRED_PRODUCT_GAP
RECOVERY_UI_REQUIRED:                             YES

PUSH_TOKEN_REGISTRATION_CONNECTED:                YES
PUSH_INVALIDATION_CONNECTED:                      YES
FCM_DEVICE_DELIVERY_VERIFIED:                     BLOCKED_BY_EXTERNAL_CREDENTIALS

PRODUCTION_MOCK_DATA_REMOVED:                     PARTIAL
FRONTEND_FORMAT_PASS:                             YES
FRONTEND_TYPECHECK_PASS:                          YES
FRONTEND_LINT_PASS:                               YES
FRONTEND_FULL_TESTS_PASS:                         YES
FRONTEND_BUILD_PASS:                              NOT_APPLICABLE
DEPLOYED_DEVICE_E2E_PASS:                         PENDING_DEVICE_VERIFICATION
PHYSICAL_DEVICE_VERIFIED:                         PENDING_DEVICE_VERIFICATION

ALL_EXISTING_USER_UI_FUNCTIONALITIES_BACKEND_CONNECTED:  PARTIAL
USER_APP_READY_FOR_CONTROLLED_PILOT:              PARTIAL
USER_APP_READY_FOR_PUBLIC_RELEASE:                NO
```

### Notes on every non-`YES` value

- **`PARTIAL_INTERRUPTED_WORK_COMPLETED: NOT_APPLICABLE`** — the audit found no partially
  implemented work to complete. The interrupted run finished its edits and its document; nothing was
  half-applied. The defect fixed this run (§10) predates it and is not interrupted work.
- **`USER_APP_UI_CHANGED: NO`** — §16, established mechanically as well as by inspection.
- **`DEPLOYED_BACKEND_VERSION_VERIFIED: YES`** — with its method stated: the service publishes no
  build metadata, so identification is by contract fingerprint (§6). That proves the deployed
  runtime serves the merged contract. It does not produce a commit hash, and no client can.
- **`DEPLOYED_EXTENSION_CONTRACT_VERIFIED: PARTIAL`** — the *request* contract was verified live
  (route registered, `minutes` enum enforced: 20 accepted, 45 refused). The *response*, which is
  where `keyId` is missing, requires a token and was not observed on the deployed instance. The
  absence is proven from `main` source and OpenAPI (§11).
- **`EXTENSION_CHECKOUT_CONNECTED: BLOCKED_BY_DEPLOYED_BACKEND`** — no `keyId` on the extension
  quote. The client fails closed. One-line backend fix in §11.
- **`EXTENSION_VERIFICATION_CONNECTED: PARTIAL`** — `POST /extensions/:eid/verify-payment` is
  implemented, extension-scoped, unit-tested, and invalidates the booking, tracking and
  extension-options reads. It is unreachable end to end until checkout can open.
- **`RAW_COOK_COORDINATES_EXPOSED_TO_CUSTOMER: NO`** — confirmed on both sides. The backend's
  customer tracking response carries `destination` as gate/society **names** and no coordinate; the
  frontend's `trackingSchema` has no latitude or longitude at all. The only coordinates anywhere in
  the customer's booking payload are the customer's own immutable booking point.
- **`WAITLIST_CONNECTED` / `RECOVERY_CONNECTED: UI_REQUIRED_PRODUCT_GAP`** — endpoints deployed and
  probed; no existing control can carry either flow. §12. Not hidden, not reclassified.
- **`FCM_DEVICE_DELIVERY_VERIFIED: BLOCKED_BY_EXTERNAL_CREDENTIALS`** — all code-safe wiring done;
  no Firebase/APNs credentials in this environment; no delivery test performed. §13.
- **`PRODUCTION_MOCK_DATA_REMOVED: PARTIAL`** — no production **business state** comes from a
  fixture: every price, status, ETA, arrival, timer, OTP, refund, tax, assignment and eligibility
  value on a production path is a backend field. Fixture modules still supply **design copy** —
  banner titles, note text, CTA wording, section headings, marketing panels — because no endpoint
  serves copy and replacing it would be a UI change. `useDevFixture` survives in exactly one place,
  the Meal Brief screen, which has no production entry point. All `(dev)` routes refuse to render
  outside `__DEV__`, so the fixture `111` in the showcase is unreachable in a release build.
- **`FRONTEND_BUILD_PASS: NOT_APPLICABLE`** — no `build` script exists; none was invented.
- **`DEPLOYED_DEVICE_E2E_PASS` / `PHYSICAL_DEVICE_VERIFIED: PENDING_DEVICE_VERIFICATION`** — §15.
  Nothing here claims a physical-device, provider or authenticated deployed-runtime result.
- **`ALL_EXISTING_USER_UI_FUNCTIONALITIES_BACKEND_CONNECTED: PARTIAL`** — everything reachable in
  the current UI is connected except extension **payment**, blocked upstream. Waitlist and recovery
  are not existing UI functionalities: they have no UI.
- **`USER_APP_READY_FOR_CONTROLLED_PILOT: PARTIAL`** — the full lifecycle, payment, tips, rating,
  cancellation, rescheduling, refunds and history are connected and unit-verified, but a pilot needs
  the extension `keyId` fix, FCM credentials, and one supervised device walkthrough against the
  deployed backend.
- **`USER_APP_READY_FOR_PUBLIC_RELEASE: NO`** — follows from all of the above.

### Suggested next steps

1. **Backend:** attach `keyId` to the extension quote (§11) — one line plus one OpenAPI field. It is
   the only thing between the app and a complete extension payment.
2. **Backend:** add `DELETE /v1/me/push-token` so logout can revoke.
3. **Design/product:** a `+91` prefix cell on `64:27` would make the receiver-phone contract visible
   to the customer instead of handled silently at the transport boundary.
4. **Ops:** generate `google-services.json` for `com.spoonhelp.userapp.dev`, upload an APNs key to
   EAS, set `GOOGLE_SERVICES_JSON`, build a development client, run a real delivery test.
5. **QA:** one supervised handset walkthrough against the deployed backend — login -> profile ->
   KML-valid address (including a receiver phone) -> catalogue -> booking -> Razorpay test mode ->
   confirmed banner -> en route -> arrived -> Start OTP -> timer -> extension -> End OTP ->
   rating/tip -> history/refunds.
6. **Product/design:** a waitlist CTA on `215:1472`; a replacement-offer surface for recovery; a
   terminal screen for customer-initiated cancellation; a decision on the Meal Brief entry point.
7. **Backend (optional):** expose a build/commit identifier on `/health/live` so deployed-version
   verification stops depending on contract fingerprinting.
