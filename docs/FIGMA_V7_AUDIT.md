# FIGMA V7 AUDIT

**File:** `8F7GqT4hEG2pEhtUGBYw7p` — "V0_-user app (7)", page `0:1` ("User App").
**Device:** physical `I2403` (`10BE9X1HPH001UZ`), 1080 × 2392 @ 440dpi = **392.7 × 869.8 dp**,
Android 16, arm64-v8a. `wm size` / `wm density` are never touched on this handset.

Read through the **desktop** Figma MCP. The remote server refuses this file — the authenticated
account (`lakshayd.intern@spoonhelp.com`) holds a **View** seat, and the remote tools require edit
access. The desktop server works against the open document and was used throughout.

---

## 1. Section inventory — page `0:1`

Every top-level node on the page, classified. Nothing else exists on this page.

| Node | Name | Class | Notes |
| --- | --- | --- | --- |
| `275:4472` | Login flow | **V0 IMPLEMENT** | 5 frames: `73:1036` loading · `250:2383` Page 1 · `275:4289` 2a · `250:2439` 2b · `275:4349` 2c |
| `275:4473` | Address | **V0 IMPLEMENT** | 5 frames: `68:214` 18 · `53:31` 18a · `60:655` 18b · `215:1472` 18c · `228:1801` 18d |
| `338:4507` | Home page | **V0 IMPLEMENT** | `1:455` + `381:511` (two Page 3a artboards) · `367:71` banner cards · `378:189` usecase sliders · `406:1325` assist |
| `275:6021` | Profile | **V0 IMPLEMENT** | `6:663` Page 16 · `6:227` Page 19 · `71:615` Page 20 |
| `267:3520` | Instant booking | **V0 IMPLEMENT** | `1:728` 4a · `25:1327` 4b · `44:5378` 4c · `25:1585` 4d |
| `267:3521` | Scheduled flow | **V0 IMPLEMENT** | `275:4488` 5a · `275:4713` 5b · `275:4938`/`333:3643` 5c · `34:3035` 5d |
| `275:5217` | Rescheduled flow | **V0 IMPLEMENT** | `275:5442` 6a · `275:5490` 6b · `275:5218` 6c |
| `115:2821` | Cancellation flow | **V0 IMPLEMENT** | `6:2` 7a · `104:2260` 7b · `104:2336` 7c · `115:2703` 7d |
| `308:3134` | Service flow | **V0 IMPLEMENT** | 20 frames — see §2 |
| `289:8515` | Cook profiles | component/reference | 8 cards = ONE component × 4 cooks × 2 dish lists |
| `54:280` | Icons | component/reference | back / cross / menu / edit / food glyphs |
| `230:2062` | trash can | non-screen | a loose 36 × 24 glyph on the canvas |
| `3:1848` | Page 10- Countdown | non-screen | **`hidden="true"`** on the canvas — a superseded artboard |
| **`394:1323`** | **V1s** | **V1 — SKIPPED** | see §4 |
| **`408:1404`** | **User profile** | **V1-class — SKIPPED** | see §4 |

**TOTAL_V0_SECTIONS: 9** · **TOTAL_V0_SCREENS: 45** drawn frames (excluding the two duplicate
artboards and the four component/reference/non-screen nodes).

### Duplicates and variants recorded, not implemented twice

- `1:455` and `381:511` are both "Page 3a- home" (1999 vs 1975 tall). `381:511` is the newer
  artboard and is the one followed.
- `275:4938` and `333:3643` are both "Page 5c- duration" (858 vs 888).
- `383:765` and `319:3284` are both "Rating" components on the service flow.
- `337:4284` and `337:4307` were already recorded (pass 9) as node-for-node identical.

---

## 2. Service flow `308:3134` — 20 frames

`433:2290` **Page 21- confirmation loading** is NEW in V7 and had no implementation. Everything
else carries the node ids pass 9 audited, and the lifecycle host renders them from server state:

`3:1041` 8a · `289:6607` 8b · `201:278` 8c · `250:2861` 8d · `3:1381` 9a · `292:469` 9b ·
`201:100` 10a · `292:657` 10b · `3:1658` 11 · `101:1812` 12a · `292:1197` 12b · `3:2002` 13a ·
`275:4189` 13b · `299:1424` 14a · `319:3191` 14b · `306:2885` 15 · `383:765` + `319:3284` Rating ·
`119:2885` post-rating UI guide.

---

## 3. Founder comments implemented

Each of these is a PRODUCT DECISION written on the file, not something a frame draws. They are
covered by `src/__tests__/v7Flow.test.tsx` and `src/__tests__/navigation.test.tsx`.

| Comment | Where it landed |
| --- | --- |
| First-time customer gets **no back control** on 18a | `app/(app)/address/location.tsx`, `ScreenHeader.onBack` now optional |
| Repeat customer's 18a back → Page 18 | `useDeterministicBack('/address')` |
| 18b back → 18a (including on an edit) | `app/(app)/address/details.tsx`, carrying `addressId` |
| 18d back → Page 18 | the sheet dismisses; nothing navigates |
| 18d Edit → 18b **prefilled**, same record | `?addressId=` → `PUT /v1/me/addresses/:id` |
| 18c "Choose another location" → 18a | pushed over a live 18a, so back is a pop |
| "Save as" only under **Others**, and required there | `AddressScreens.tsx` `othersSelected` |
| 18b CTA is **Confirm**, not "Check availability" | `DEMO_ADDRESS_DETAILS.ctaLabel` |
| Serviceability runs ONCE, on Confirm | already held; re-verified on device |
| Page 16 back → Home · 19 back → 16 · 20 back → 16 | `useDeterministicBack` |
| Page 18 back → Page 16 | `useDeterministicBack('/profile')` |
| Page 4a arrow → Home | the sheet sits over Home; nothing navigates |
| Service-flow back buttons → Home | `useDeterministicBack('/home')` on the lifecycle host |
| 7d → Home | `onBookAgain` → `router.replace('/home')` |
| Payment → **Page 21** → poll → Home | `booking/confirming.tsx` + `useBookingConfirmation` |
| Login is not screen-adapted | `LoginScreen.tsx` — hero aspect ratio, `my-auto` form, pinned footer |
| Carousel is 9 cards in a defined order | `home/assets.ts` |

---

## 4. V1 — classified and SKIPPED

**`394:1323` "V1s"** — the section the brief names. Three frames:

| Node | Name | What it is |
| --- | --- | --- |
| `222:1570` | div.bg-white | the "Your profile is incomplete / Complete profile" banner |
| `3:684` | Page 6- service brief | Meal Brief & Recipe Link |
| `381:190` | div.flex-1 | Meal preferences (dietary + recipe link) |

**`408:1404` "User profile"** → `338:4508` "Page 17- profile" — dietary preference, "What food have
you grown up eating?", cook region and gender preference. This is a separate section from `V1s`,
but its CONTENT is exactly what the brief forbids ("do not add V1 preferences"), so it is
classified V1-class and skipped. **Flagged for the founder**: if Page 17 is meant to be V0, it is
the one screen in this pass that was deliberately not built.

`src/features/mealBrief` and `app/(app)/meal-brief.tsx` implement `3:684` from an earlier pass.
They were left in place (removing working code is outside this brief) and are **not routed** — no
screen links to them; the route is reachable only by `spoon://meal-brief` in a review build. No V1
node was implemented, revived or routed to in this pass.

---

## 5. Stale assets found and re-exported

The carousel artwork in the repo predated V7 and was showing superseded copy on device — the
"Munch as much as you want!" card read *"Snacks made with your trusted oil and ghee"* where V7
reads *"Snacks made healthy with good ingredients"*. **All nine** cards were re-exported from V7 at
3×, not only the new one.

`assets/figma/auth/login-hero.jpg` was exported from an older file at 1110 × 1092 — a 1.016 ratio
against `250:2434`'s 1.125 — which is what made `resizeMode="cover"` eat 35pt off the top of the
cook's head inside a 329pt band. Re-exported from the node at 1110 × 987.

`assets/figma/loading/confirmation-progress.png` (`433:2400`) is new.

---

## 6. Design defects recorded, not silently corrected

- **`221:1555` double comma.** `215:1472`'s body reads "We are not operational in your area at the
  moment**, ,** but we are working towards it!". The app transcribes it exactly. It is a copy typo
  for the designer to fix in the file; changing shipped copy without authority is not this pass's
  call.
- **`339:4609` "Save as" is drawn permanently** on `60:655` while Parents is selected. The founder's
  comment overrides the frame: the field belongs to Others. Implemented per the comment, recorded
  here because the frame and the comment disagree.

---

## 7. Measurements taken on the handset

- **Marker drag** (`53:57`). Long-press then drag: the pin's X follows the finger to the pixel at
  every sample, and the Maps SDK's drag "lift" is a constant −72px throughout — no jitter, no
  teleport, no snap-back on release. Reverse geocode resolves after the drop; no serviceability
  request is made until Confirm.
- **Pin anchor.** The tip lands within ~1.5px of the SDK's own location dot for the same
  coordinate. `MAP_PIN_ANCHOR` corrected from `157/172` to the measured `155/172`.
- **CTA geometry.** `275:4485` renders at 93px = **33.8dp** against the frame's 34. Its bottom
  clearance was 16dp on 18b and **12dp on 18a**, both flush against the handset's gesture strip —
  now `Math.max(designGap, insets.bottom)` via `useBottomGutter`.
- **Header inset.** `257:3504` (Profile), `65:35` (Past bookings) and `71:620` (Refunds) are all
  drawn at x 16 / y 16 inside their body column. Profile was rendering flush to the safe area and
  Past bookings had no top lead; both corrected.

---

## 8. Required-field / CTA-state rule

A founder rule that spans several flows: **a CTA whose action depends on required inputs stays
greyed out and non-interactive until every one of them is satisfied.** Disabled here means all
four things — it looks disabled, it refuses touch, its handler returns early, and no request,
navigation or payment can originate from it.

### The disabled treatment is read, not invented

`275:4690` — the "Book Now" bar on Scheduled steps `275:4488` / `275:4713` / `275:4938` — is the
**only** disabled call-to-action drawn anywhere in the file:

| Property | Value on the node |
| --- | --- |
| fill | `rgba(0,0,0,0.07)` |
| label | `rgba(0,0,0,0.5)`, Livvic Black 16/24 |
| height / radius / padding | 34 / 15 / `px 12 py 6` — **identical to the active bar** |
| lift | `0 0 4 rgba(0,0,0,0.15)` — the disabled bar **keeps** the shadow |

Both colours already existed as primitives (`tileDisabled` / `black50`, read off the disabled
duration tile `1:815`); they are now also exposed as `surfaceCtaDisabled` / `textCtaDisabled` and
are what `Button`'s `disabled` state and Login's own bar use. The previous `#F3F4F6` + slate
`#8A94A6` pair was from the slate ramp and appears in no CTA in the file.

`60:655` draws its Confirm bar `#FFD600` even on an empty form, so the file has no disabled state
for `275:4485`. The Scheduled treatment above is applied, because it is the file's own answer to
the same question rather than a grey chosen here.

### `60:655` field contract

| Field | Node | Class |
| --- | --- | --- |
|  Flat no. / House No. + Tower | `60:697` | REQUIRED |
| Building + Plot no. | `63:789` | REQUIRED (one field; the label's "or" means a plot number satisfies it) |
| Label as | `339:4600` | REQUIRED |
| Save as | `339:4609` | CONDITIONAL — shown and required **only** under Others |
| Receiver's name / phone | `222:1559` / `64:27` | OPTIONAL — `64:6` marks the block "(Optional)" |
| Area | `339:4589` | DISPLAY — the geocoder's reading of the confirmed point, not an input |

Plus one piece of CONTEXT the form cannot see for itself: a confirmed coordinate that
`POST /v1/serviceability/check` approved (adding), or the record's own saved point (editing).
Whitespace-only input fails every required check, and the trimmed value is what is submitted.

`src/features/address/validation.ts` owns the rule; the screen draws the CTA from it and the
handler refuses on it, so the two cannot drift.

### Where the same rule lands

| Surface | Gate |
| --- | --- |
| `60:655` Confirm | fields + confirmed serviceable point + no write in flight |
| `275:4488`…`34:3035` Book Now | day → daypart → duration → start time, **and** a server quote |
| `1:728` Book NOW | duration, **and** a server quote |
| `275:5218` Reschedule | day → daypart → start time, + no request in flight |
| `104:2336` Continue | a cancellation reason (and its detail where the reason needs one) |
| `275:4189` Extend / `306:2885` Tip | a chosen option |

The quote is what stops a priced CTA from ever being live while it carries no amount: the label's
figure and the CTA's enablement come from the same `POST /v1/bookings/quote`.

### One active-state correction found while verifying the pair

`53:110` and `275:4485` — both address Confirm bars — carry **no drop shadow at all** on the node:
a plain `#FFD600` fill at a 30pt radius. `Button`'s `primary` variant applies `elevation.cta`
(`0 0 3 rgba(0,0,0,0.15)`), which belongs to `1:821`, the Instant/Scheduled bar. Both address CTAs
now pass `flat`, which is the prop that already existed for exactly this case.

Recorded and not "corrected": `275:4690`'s blur is 4 where the active `1:821` is 3. A disabled bar
with a heavier lift than its live state is a Figma inconsistency between two hand-authored nodes,
not a design distinction, so the CTA elevation is left at 3 for both.

### What was NOT disabled

Navigation and informational CTAs — "Schedule NOW" on the two blocked Instant frames, Cancel /
Reschedule on the lifecycle summaries, "Start Service" / "End Service" (the OTP beside them is
displayed, not entered), Book-again — take no required input and stay live.
