# Scheduled slot visibility — cross-repo closure

**Reported:** Customer App → Schedule → `Tuesday, Aug 25` + `Noon` + `2 hours` rendered a
completely blank **Start time** section. `Book Now` was correctly disabled.

**Required behaviour:** available candidates visible and selectable; unavailable candidates
visible, greyed and disabled; `Book Now` disabled without an available selection. A day on which
nothing is bookable must show a grid of grey cards, never an empty section.

**Verdict:** the defect was **frontend only**. The backend already returned every candidate.

---

## 1. Root cause

Classification: **`FRONTEND_RENDER_CONDITION_BUG`** (primary), with
**`FRONTEND_TIMEZONE_BUG`** confirmed as a second, independent latent defect on the same path.

Explicitly **not** the cause: `BACKEND_RETURNS_AVAILABLE_ONLY`,
`BACKEND_DROPS_UNAVAILABLE_CANDIDATES`, `BACKEND_RETURNS_ZERO_CANDIDATES`,
`FRONTEND_SCHEMA_STRIPS_AVAILABILITY`, `FRONTEND_ADAPTER_FILTERS_UNAVAILABLE`.

### 1.1 What the trace showed

The whole path was read end to end. No layer filtered on `available`:

| Layer | File | Verdict |
|---|---|---|
| Candidate generation + verdicts | `src/bookings/availability/scheduled-availability.ts` | Returns **all** candidates, each with `available` + `reason` |
| Service/serialisation | `src/bookings/booking-service.ts` → `getScheduledAvailability` | Returns `slots: result.slots` verbatim — no filter |
| HTTP route | `src/api/routes/v1/index.ts` (`GET /availability/scheduled`) | Pass-through |
| Zod schema | `src/features/availability/api/schemas.ts` | Keeps `available` and `reason` |
| API module | `src/features/availability/api/availabilityApi.ts` | Pass-through |
| Adapter | `src/features/scheduled/adapters.ts` | Marks unavailable as `disabled: true`, keeps them |
| Render | `ScheduleScreen.tsx` → `ChipGroup` → `Chip` | Renders every option; grey + `disabled` already correct |

A `slots.filter((s) => s.available)` exists **nowhere** in either repository.

### 1.2 The actual defect

`src/features/scheduled/data.ts` collapsed every non-`ready` availability state into `null`:

```ts
availability: availability.state.status === 'ready' ? availability.state.data : null,
```

and then returned `ready(schedule)` regardless. `slotsByPeriodFrom` maps `null` to **empty
buckets**. So a **failed**, **schema-invalid**, or **still-loading** availability read was
published to the screen as a *successful* view model whose Start time grid was empty — visually
identical to "the server offers nothing here", with **no error surface and no retry**.

Because `showStart` became true the instant a duration was tapped, the heading appeared
immediately over nothing, and stayed blank permanently if the request had failed. That is exactly
the reported symptom.

A whole-day `rejection` (`SOCIETY_NOT_SUPPORTED`, `OUTSIDE_BOOKING_WINDOW`, …) was dropped
entirely by the adapter, producing the same silent blank from a third distinct cause.

### 1.3 The second defect — device-timezone bucketing

`periodIdFor` grouped slots with `start.getHours()`, i.e. the **device** clock, while the
catalogue publishes the period boundaries as minutes-from-midnight in
`operatingWindow.timeZone` (`Asia/Kolkata`). On any handset not set to IST the two are different
frames of reference: a 12:00 IST slot (`…T06:30:00Z`) reported minute 390 and filed under
**MORNING**. The slot **label** and the day strip had the same fault, so a card could be written
`6:30 AM` for a slot the server called noon, and an Aug 25 IST slot could be reasoned about as
Aug 24.

### 1.4 Residual uncertainty (stated honestly)

The deployed API (`https://spoon-api-kalc.onrender.com`) requires a bearer token that was not
available in this environment, so the *live* response for the specific failing request was not
captured. What is proven is narrower and sufficient: the backend cannot produce an empty `slots`
array for that selection (§2), and no frontend layer removes candidates — therefore the observed
blank was reachable **only** through the loading / error / rejection collapse, all three of which
are now fixed and separated. Which of the three fired on the reporter's device is not
distinguishable after the fact.

---

## 2. Exact request and response

### Request produced by the failing selection

```http
GET /v1/availability/scheduled?addressId=<uuid>&date=2026-08-25&durationMinutes=120
Authorization: Bearer <customer token>
```

- Address/hub — the account's **default** address; the hub is resolved server-side from it.
- Date — `2026-08-25`, a local calendar date (not an instant).
- Timezone — not sent. The server resolves the day in `Asia/Kolkata`; the client now derives
  the date string in that same zone.
- Duration — `120`.
- Period — **not sent**. `Morning/Noon/Evening` is a client-side grouping of the returned grid.
- Booking horizon / pagination — none. The horizon is server policy
  (`SCHEDULED_HORIZON_DAYS = 3`); the response is unpaginated.

### Response (produced by executing the real engine for the failing case)

`calculateScheduledAvailability` was run against the launch policy (15-min grid, 05:00–22:00,
`allowedDurationMinutes` including 120) for `2026-08-25`, duration 120, **zero cook capacity**:

```
rejection        : undefined
total candidates : 61          (05:00 → 20:00, the latest 2-hour start ending by 22:00)
available count  : 0
NOON candidates  : 16          (12:00 → 15:45)
distinct reasons : [ 'NO_PRESENT_COOK' ]
```

Sanitized excerpt:

```json
{
  "date": "2026-08-25",
  "durationMinutes": 120,
  "slots": [
    { "start": "2026-08-25T06:30:00.000Z", "available": false, "reason": "NO_PRESENT_COOK" },
    { "start": "2026-08-25T06:45:00.000Z", "available": false, "reason": "NO_PRESENT_COOK" },
    { "start": "2026-08-25T07:00:00.000Z", "available": false, "reason": "NO_PRESENT_COOK" }
  ],
  "validUntil": "2026-08-23T04:30:30.000Z"
}
```

**The Noon section had 16 candidates to draw.** No cook identity, schedule, coordinate or other
customer's booking appears anywhere in the payload.

---

## 3. Where the defect was

**Frontend only.** The backend needed no behavioural change — this is §5 **Case A**. The single
backend edit is documentation of an already-correct contract (§4).

---

## 4. Contract changes

**No breaking change. No response-shape change. No new field on the wire.**

`GET /v1/availability/scheduled` previously documented its 200 as the untyped generic
`#/components/responses/Ok`, so "unavailable candidates are returned" was true in code but stated
nowhere. Added to `openapi/openapi.yaml`:

- `components.schemas.ScheduledSlot` — `start` / `available` / `reason`, all required,
  `additionalProperties: false` (the fence that keeps cook identity out).
- `components.schemas.ScheduledAvailability` — `date` / `durationMinutes` / `slots` /
  `validUntil` required, optional `rejection`, `additionalProperties: false`.
- An endpoint description stating that `slots` is a **candidate** list, that an unfulfillable
  candidate is returned with `available: false` and is **not omitted**, that clients must render
  such candidates disabled rather than hide them, that the grid is **advisory** and `POST
  /bookings` remains the authority, and that `rejection` (whole-request refusal, empty `slots`) is
  a different state from a populated list in which nothing is available.

The reason vocabulary is documented as **open** — clients must degrade an unrecognised code to a
plain unavailable state. The frontend Zod schema already types `reason` as `string` for this
reason, so no client change was needed.

---

## 5. Files changed

### Backend — `D:\spoon-backend` (2 files, no `src/` behaviour change)

| File | Change |
|---|---|
| `openapi/openapi.yaml` | Documented the response; added `ScheduledSlot` + `ScheduledAvailability` schemas |
| `tests/unit/scheduled-slot-visibility.test.ts` | **New** — 21 cases (see §7) |

### Frontend — `D:\spoon-frontend` (9 files)

| File | Change |
|---|---|
| `src/features/scheduled/serviceTime.ts` | **New** — service-timezone wall clock, calendar-date arithmetic, period membership; falls back to the device reading rather than throwing |
| `src/features/scheduled/data.ts` | Availability **error** → `DataState.error`; **in-flight** → `slotsPending`; no longer fabricates a successful empty grid; service date resolved in the service timezone |
| `src/features/scheduled/adapters.ts` | Period bucketing, slot labels and the day strip moved onto the service clock; `unavailableReason` carried; `rejection` carried |
| `src/features/scheduled/types.ts` | `ScheduleViewModel.slotsPending`, `.slotsRejection`; `ScheduleSlotOption.unavailableReason`; documented that `slotsByPeriod` holds **every** candidate |
| `src/features/scheduled/screens/ScheduleScreen.tsx` | Start time grid withheld while pending; selected slot **derived**, so one no longer offered is dropped and the CTA greys; press guard on disabled cards |
| `src/features/scheduled/screens/ScheduleScreen.test.tsx` | `COMPLETE_SELECTION` pointed at an **available** fixture slot (it named a disabled one) |
| `src/features/scheduled/serviceTime.test.ts` | **New** — 12 timezone/boundary cases |
| `src/features/scheduled/slotVisibility.test.tsx` | **New** — 11 cases through the real hook |
| `src/demo/fixtures/booking.ts` | `slotsPending: false` on both demo view models |
| `src/test/renderWithRuntime.tsx` | Added the missing `GET /v1/availability/scheduled` stub |

> The missing stub is itself evidence: the harness is documented to *fail loudly* on an unstubbed
> endpoint, yet the Schedule and Reschedule route tests passed without it — because the old seam
> converted that failure into a normal-looking screen. Surfacing the error made the omission
> visible.

**No Cook App file, pricing, tax, KML serviceability, booking-coordinate arrival or OTP code was
touched. No commit, push, merge, PR or deployment was performed. Both working trees were clean at
the start and no pre-existing work was reset, stashed or overwritten.**

---

## 6. Before / after

| Situation | Before | After |
|---|---|---|
| All candidates unavailable, read succeeded | Grey cards (already correct) | Unchanged — grey cards |
| Availability request **fails** | Blank Start time section, no error, no retry | Designed `ErrorState` + "Try again" |
| Response **fails schema** | Blank Start time section | Designed `ErrorState` |
| Read **in flight** | Empty grid under the heading | Section withheld until the server answers |
| Whole-day `rejection` | Silent blank | Distinguished on the view model (`slotsRejection`) |
| Non-IST device | Slots bucketed into the wrong period; labels on the device clock | Bucketed and labelled on the service clock |
| Selected slot becomes unavailable | Stayed selected; CTA could stay live | Selection dropped; CTA greys |
| Press on a grey card | Refused by `Chip` only | Refused by `Chip` **and** the screen |

**Zero UI redesign.** No layout, card size, available/grey/selected style, typography, colour,
spacing, selector or CTA changed. No screen, modal, toast or layout was added. The only visual
delta is that a heading no longer appears over a not-yet-loaded grid, and a failure now uses the
error surface that already existed.

---

## 7. Tests and exact results

### Backend — `tests/unit/scheduled-slot-visibility.test.ts` (21 new cases, all passing)

Zero capacity: candidate list **non-empty** (61), **every** candidate `available: false`, every
`reason` in the closed vocabulary, Noon holds **16** candidates, and **every published candidate
is refused by `isScheduledSlotFeasible`** — visible does not mean bookable. Plus: identical
candidate membership on open vs closed days; mixed day from a real booking conflict; fully open
day; a break rendered as `NO_SHIFT_COVERAGE` rather than removed; no cook id or foreign booking id
anywhere in the payload; exactly three fields per slot; stable ascending ordering across reads;
the 10 PM cutoff exactly reached and never exceeded for all six durations; `AFTER_LATEST_START`;
capacity disappearing between draw and tap; `OUTSIDE_BOOKING_WINDOW` as the one legitimate empty
list; every candidate inside the requested India day; every candidate in exactly one period; and
three OpenAPI-alignment cases including that the spec text itself says unavailable candidates are
**not omitted**.

### Frontend — 23 new cases, all passing

`serviceTime.test.ts` (12): the same instant buckets **NOON** under `Asia/Kolkata` and **MORNING**
under `UTC` (the old bug, made explicit); half-open boundaries at 11:45/12:00 and 15:45/16:00;
every candidate in exactly one period; a 00:30 IST instant keeps its IST date; date-stepped day
strip; Tuesday 25 Aug labelled Tuesday on any handset.

`slotVisibility.test.tsx` (11) — driving the **real** `useScheduleData` → `useScheduledAvailability`
→ Zod → adapters → screen: all 16 Noon cards visible/grey/disabled when none are bookable; all 16
visible with 8 disabled when mixed; all selectable when open; CTA grey until an available slot is
picked; press on a grey card ignored; duration change refetches and clears the selection; day
change refetches and clears; a refetch that removes capacity drops the selection while the card
**stays on screen greyed**; request failure → error surface; schema failure → error surface;
in-flight → no empty grid.

### Gate results

| Gate | Backend | Frontend |
|---|---|---|
| `format:check` | ✅ pass | ✅ pass |
| `validate:openapi` | ✅ pass | `NOT_APPLICABLE` (no such script) |
| `typecheck` | ✅ pass | ✅ pass |
| `lint` | ✅ pass | ✅ pass (`--max-warnings=0`) |
| `build` | ✅ pass | `NOT_APPLICABLE` (no such script) |
| `test:unit` | ✅ **628 passed**, 56 files | — |
| full test suite | — | ✅ **1074 passed**, 75 suites (`--runInBand --silent`) |
| `test:integration` | ⛔ **BLOCKED** | — |
| `test:migrations` | ⛔ **BLOCKED** | — |
| `git diff --check` | ✅ clean | ✅ clean |

**Blocked, not failed.** `npm run test:integration` and `npm run test:migrations` could not
execute: Testcontainers aborts in `getContainerRuntimeClient` because no Docker daemon is
reachable (`npipe:////./pipe/dockerDesktopLinuxEngine` — Docker Desktop is not running). **457
integration and 19 migration tests were SKIPPED, none executed.** No claim is made about them.
This is environmental and pre-existing; the change touches no migration and no `src/` runtime path
on the backend.

---

## 8. Deployment status

**Not deployed.** Nothing was committed, pushed, merged, tagged or deployed; no PR was opened.
Both changes sit in the working trees:

- Frontend branch `frontend/v0-integration-closure` @ `85a2219`
- Backend branch `main` @ `a4d182e`

The deployed API at `https://spoon-api-kalc.onrender.com` is **unchanged and needs no redeploy** —
the backend edit is OpenAPI documentation and a test file, with no `src/` behaviour change. The
frontend fix requires a new build to reach devices.

---

## 9. Device / emulator evidence

**None. `PENDING_DEVICE_VERIFICATION` — not performed, and not claimed.**

Three AVDs exist (`Ref393GA`, `Ref_393`, `Small_Phone`) but none is running and `adb devices` is
empty. Reproducing the original case end to end also needs a phone-OTP session against the
deployed API and a backend state with no cook capacity for that hub/day — neither credentials nor
capacity seeding were available here. The live network response for the failing selection was
therefore **not** captured either (the endpoint returns `UNAUTHENTICATED` without a token).

What stands in for it: the backend response was reproduced by executing the real engine (§2), and
the full frontend chain — hook, schema, adapter, screen — is exercised by the 11 integration cases
in `slotVisibility.test.tsx`, which assert the rendered card count, the disabled accessibility
state and the CTA state for exactly the `Noon` + `2 hours` selection.

### Still to do on a device

1. Boot an AVD, install a dev build, sign in.
2. Select the third day chip, `Noon`, `2 hours`.
3. Confirm: cards visible; every unavailable card grey; not pressable; `Book Now` grey.
4. Switch to a combination with capacity; confirm enabled cards appear.
5. Confirm no layout or visual change against the Figma frames.
6. Inspect the live `GET /v1/availability/scheduled` response and confirm it carries
   `available: false` entries.

---

## 10. Remaining blockers

1. **`PENDING_DEVICE_VERIFICATION`** — §9. The only outstanding functional check.
2. **Integration + migration tests BLOCKED** — Docker Desktop not running. Re-run
   `npm run test:integration` and `npm run test:migrations` on a machine with Docker before merge.
3. **Live response not captured** — needs a customer bearer token.
4. **`FIGMA_PENDING`: no designed surface for a whole-day `rejection`.** It is now carried on the
   view model as `slotsRejection` and deliberately **not drawn** — inventing copy or a banner would
   be a design decision this screen has not been given. Until a frame exists, a rejected day
   renders as the existing empty behaviour. Worth raising with design.
5. **`unavailableReason` is carried but never shown** — permitted by the brief ("may remain
   nonvisual"). It is a bounded, non-identifying code, ready for a future "why?" affordance.
6. **`Intl` with a `timeZone` is assumed present.** Every helper in `serviceTime.ts` falls back to
   the device reading (the previous behaviour) rather than throwing, so the worst case on an engine
   without it is the old bucketing — never a crash or a blank screen. Worth confirming on a real
   Hermes build during §9.
7. **An availability error now takes the whole screen** into the existing `ErrorState`, hiding the
   day/period chips behind a retry. That is the designed surface and matches how a catalogue error
   already behaves, but if product prefers the chips to stay and only the Start time section to
   show the failure, that needs a frame.
