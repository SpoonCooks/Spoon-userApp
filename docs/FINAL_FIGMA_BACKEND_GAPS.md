# FINAL_FIGMA_BACKEND_GAPS

Gaps discovered while reconciling the app against the FINAL Figma
(`PsQEgznJ0uWH0MnZsS2Ffc`, canvas `0:1`).

> **RE-AUDITED 2026-08-20 against `D:\spoon-backend` `openapi/openapi.yaml` and the working tree at
> `756b1ab`.** Five of the seven entries below are CLOSED: the backend shipped them and this app now
> consumes them. Each is marked inline. Nothing here has been exercised against a running
> deployment — the merged contract was not deployed at the time of writing — so every "wired" claim
> is `PENDING_BACKEND_DEPLOYMENT_VERIFICATION`.
>
> | | Verdict |
> |---|---|
> | G-1 Reassignment | **CLOSED** — `booking.reassignment` published and consumed |
> | G-2 Arrival timestamp | **CLOSED** — `timing.arrivedAt` published and consumed |
> | G-3 Struck-through price | **CLOSED AS PRODUCT DECISION** — will not be published |
> | G-4 `5+` rating | **CLOSED** — `exceptional` published and now sent |
> | G-5 Tip checkout | **CLOSED** — order + verify published and now wired |
> | G-6 Support number | **OPEN, not blocking** — fallback in place |
> | G-7 Address serviceability | **CLOSED** — per-address verdict published and consumed |
>
> One NEW gap was found and is tracked in
> [`FRONTEND_BACKEND_PENDING.md`](./FRONTEND_BACKEND_PENDING.md) §3:
> `BACKEND_GAP_EXTENSION_KEY_ID` — the extension quote carries no publishable Razorpay key, so
> extension checkout cannot open. Tip and booking orders both carry one.

**Only genuine backend requirements are listed.** Anything the frontend could close, the frontend
closed. Each entry names the UI feature, the Figma state that needs it, the field the client would
read, the endpoint it would read it from, and the smallest change that would close it.

Nothing in this list is faked in the app. Where a field is missing the client either omits the
element, falls back to a status word, or records the collapse in a log — it never invents a value.

---

## G-1 — Cook reassignment is not reported

> **CLOSED.** `BookingReassignment` (`occurred`, `sequence`, `reassignedAt`) is published on
> the booking detail, on every summary and on tracking, from one derivation. `home/data.ts`
> reads `reassignment.occurred` and both banner variants light. The claim below that it is
> "the single largest blocker" no longer holds.

| | |
| --- | --- |
| **UI feature** | Home banner variants `reassignedConfirmed` and `reassignedArriving` |
| **Figma state** | `394:1210` ("Reassigned" / Confirmed!), `393:1050` ("Reassigned" / Arriving in) |
| **Required data** | Whether THIS booking's cook has been reassigned |
| **Existing endpoint** | `GET /v1/bookings/:id`, `GET /v1/bookings/:id/tracking` |
| **Existing fields** | `status`, `cook{ id, name, photoUrl }`, `allowedActions`, `timing` |
| **Missing** | Any field expressing "the cook changed after assignment" |
| **Minimal change** | `booking.reassigned: boolean` on the detail payload (and on the active-booking summary, which is what Home actually reads). A `reassignedAt` timestamp would also serve. |

Two of the eleven drawn banner cards, and Figma pages `8b`, `10a` and `10b`, are selected by this
fact alone. `homeBannerFor` already accepts a `reassigned` input and lights both variants the
moment it is supplied; it is never defaulted to `true`, so today every such booking draws the
ordinary card. **This is the single largest blocker to completing the 11-state banner.**

## G-2 — No arrival timestamp

> **CLOSED.** `timing.arrivedAt` is published from `cook_arrived` onward and for the rest of
> the booking, and is `null` again after a reassignment. `booking/adapters.ts` renders the
> clock time from it instead of the status word.

| | |
| --- | --- |
| **UI feature** | Home banner `arrived`; Figma draws a clock time, not a word |
| **Figma state** | `337:4307` "Arrived at **1:12 PM**", `394:1235` "Arrived at **1:16 PM**" |
| **Required data** | The instant the cook ARRIVED |
| **Existing endpoint** | `GET /v1/bookings/:id`, `.../tracking` |
| **Existing fields** | `timing.actualStart` (when SERVICE started — a later, different moment), `eta.updatedAt` (when the estimate was recalculated) |
| **Missing** | `timing.arrivedAt` |
| **Minimal change** | `timing.arrivedAt: string \| null` (ISO), set when status becomes `cook_arrived` |

The card currently prints the status word "Arrived" rather than `actualStart`, because
`actualStart` would print a time that is quietly wrong.

## G-3 — Struck-through list price on duration tiles

> **CLOSED AS A PRODUCT DECISION — do not implement.** The backend deliberately declines to
> publish a list price: `customer-catalogue.ts` records that computing one "would mean
> inventing money". The tiles render without the strike price permanently.

| | |
| --- | --- |
| **UI feature** | Instant and Scheduled duration tiles |
| **Figma state** | `1:728` — every tile draws `₹150 ₹69`, `₹225 ₹99`, `₹300 ₹129`, `₹450 ₹189`, `₹600 ₹259`, `₹750 ₹319` |
| **Required data** | The pre-discount price per duration |
| **Existing endpoint** | `GET /v1/catalogue` |
| **Existing fields** | `durations[].serviceAmountPaise`, `.taxAmountPaise`, `.totalAmountPaise` |
| **Missing** | The "was" price |
| **Minimal change** | `durations[].listAmountPaise: number` |

The ratios in the design are not constant (2.17 … 2.38), so it cannot be derived from the price by
a multiplier — it is merchandising data. **The tiles currently render without the strike price.**

## G-4 — `5+` cannot be recorded

> **CLOSED.** `exceptional: boolean` exists on `RatingRequest` and `RatingData`, with its own
> migration and a database CHECK binding it to `stars: 5`. The client now sends the pair and
> the structured "collapsed to 5" warning is gone. `isFivePlus` remains the EARNINGS term and
> is unaffected.

| | |
| --- | --- |
| **UI feature** | Rating, both modes (task §13) |
| **Figma state** | `383:765` — the `5+` chip FILLED, the nine-chip scale gone, replaced by "Thank you for appreciating the cook's efforts!" |
| **Required data** | A rating value distinguishable from `5` |
| **Existing endpoint** | `PUT /v1/bookings/:id/rating` |
| **Existing fields** | `stars` — 1..5 in 0.5 steps, enforced at the edge, in the service and by a DB constraint |
| **Missing** | Any representation of "beyond 5" |
| **Minimal change** | `exceptional: boolean` alongside `stars` (preferred — it leaves the existing scale and its constraint untouched), or widen `stars` to allow `5.5` |

`5+` is a real, reachable component state and is preserved end to end in the client as
`RatingSelection`. At the wire it is sent as `stars: 5` **and a structured warning is logged**
(`Rating 5+ collapsed to 5 …`). It is not a silent collapse, but it IS a loss: today a customer who
chose `5+` and one who chose `5` are indistinguishable to the backend.

## G-5 — Tip checkout has no order or verify

> **CLOSED.** `POST /tips` returns a full `TipOrderData` — including `providerOrderId` and the
> public `keyId` — and `POST /tips/verify` settles it tip-scoped and idempotently. The client
> now runs the same order → checkout → verify → refetch pipeline booking payment uses, and
> `booking.tip` is the authority on what was captured.

| | |
| --- | --- |
| **UI feature** | Tip flow (task §14) |
| **Figma state** | `306:2885` "Page 15- Tip pop out" |
| **Required data** | A payment order for the tip, and a way to verify the payment |
| **Existing endpoint** | `POST /v1/bookings/:id/tips` (body `{ amountPaise }`) — recorded as *contract-read*, response shape unverified |
| **Existing fields** | Unknown. The client does not parse the response. |
| **Missing** | (a) whether `POST /tips` returns a Razorpay order (`providerOrderId`, `keyId`, `amountPaise`, `currency`); (b) a tip-scoped verify — `/v1/bookings/:id/payments/verify` is booking-scoped and settles the BOOKING's payment |
| **Minimal change** | Have `POST /tips` return the same `paymentOrderSchema` shape the booking order returns, and add `POST /v1/bookings/:id/tips/:tipId/verify` (or accept a `target: 'tip'` discriminator on the existing verify) |

The client sends the real, catalogue-published amount and refetches the booking. It does **not**
open checkout, because the order shape and the verify route are both unconfirmed, and opening
Razorpay against a guessed order — or reporting success without a verify — is the faked payment
§14 forbids. Everything else is ready: the launcher, the SDK (autolinked and compiling), the
order→checkout→verify→refetch pipeline are all in place and used by booking payment.

## G-6 — Support number is still unpublished

| | |
| --- | --- |
| **UI feature** | Every Help / WhatsApp control |
| **Figma state** | The `Help` pill on `7a`–`7d`, `8a`–`8d`, `9a`–`9b`, `10a`–`10b`, `11`, `12a`–`12b`, `13a`–`13b`, `14a`–`14b`, `15`, `16`; the `383:748` WhatsApp disc on `8a`/`8b` |
| **Required data** | Spoon's support number |
| **Existing endpoint** | `GET /v1/catalogue` |
| **Existing fields** | `support.whatsappPhone` — present in the schema, **empty on every deployment** |
| **Missing** | A value |
| **Minimal change** | Publish `support.whatsappPhone` |

**Not blocking.** The founder's ruling (§15) is implemented as the fallback: every control reaches
`+91 8792997836`. `resolveWhatsAppPhone` prefers the catalogue whenever it carries a number, so
publishing one moves the destination with no release.

## G-7 — "Usable address" cannot distinguish a serviceable one

> **CLOSED.** Every row of `GET /v1/me/addresses` carries an evaluated `serviceability`
> verdict (`status`, `reason`, optional `hub`), computed at read time rather than persisted.
> `useAddressGate` now reads it: only `outside_service_area` demands another address, because
> the contract states `temporarily_unavailable` is expected to work again.

| | |
| --- | --- |
| **UI feature** | First-run address gate (task §4) |
| **Figma state** | `53:31` → `60:655` → Home |
| **Required data** | Whether a SAVED address is currently serviceable |
| **Existing endpoint** | `GET /v1/me/addresses` |
| **Existing fields** | `hub_id: string \| null` |
| **Missing** | An explicit per-address serviceability verdict |
| **Minimal change** | `addresses[].serviceable: boolean` (or document that `hub_id === null` means exactly that) |

The gate currently reads "no usable address" as "no address at all". Treating `hub_id: null` as
unusable would trap a customer in onboarding with no way out the day a hub is reconfigured, so it
is not enforced without the contract saying so.

---

# NOT backend gaps — resolved in the frontend this pass

Recorded so they are not re-raised:

- **Cancel from a live booking** — the current file DOES draw it (`3:1041`, `292:241`). Wired,
  gated by `allowedActions.canCancel`. (Old blocker B-11.)
- **Help has no destination** — settled by the founder's comment. Every entry point is wired,
  including Profile's tile, which was the last inert one. (Old blocker B-10.)
- **Address delete has no endpoint** — it does: `DELETE /v1/me/addresses/:id`, and `useDeleteAddress`
  already wrapped it. The TODO claiming otherwise was stale, and the control is now wired.
- **Address edit cannot preserve identity** — `PUT /v1/me/addresses/:id` exists and is now used, so
  editing updates the record rather than creating an unrelated one.
- **Completion's submitted state** — derivable today from `allowedActions.canRate === false`; no new
  field needed.

---

# Environment blockers (not contract gaps)

- **CONFIG — map / Places provider.** `53:31` has no tile layer and its search field resolves
  nothing, so the pin cannot be moved off the device's own GPS fix. On a handset physically outside
  the service area this makes address creation **impossible**, which in turn blocks booking, quote
  and Razorpay checkout on that device. This is the single biggest obstacle to end-to-end device QA.
- **PROV-2 — Google Routes API** must be reachable or instant answers `TRAVEL_ESTIMATE_UNAVAILABLE`.
- **DEP-1 / DEP-4** — MSG91 credentials and a current Render deployment.
