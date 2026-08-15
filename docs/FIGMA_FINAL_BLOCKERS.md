# Figma — Final Blockers & Design Defects

**For:** design + founders · **From:** frontend
**Compiled:** 2026-08-14 · **Product rulings applied:** 2026-08-14
**Figma file:** `BTPW14a7M69ySPZxdkc2yn` (`V0_-user-app`) · page `0:1 User App`
**Screenshots referenced:** `.figma-audit/screens/`

---

## Status

- **Visual audit: 50 / 50 frames — COMPLETE.** Not reopened by this document.
- **Product rulings received 2026-08-14 closed 6 of the 14 blockers**, including both of the two that
  stopped work outright (payment and Home).
- **Remaining true implementation blockers: 4.** **Remaining product decisions: 10.**
- **FOUNDATION IMPLEMENTATION: CLEARED TO BEGIN.** See § 4.

Source detail: `docs/FIGMA_USER_APP_AUDIT.md` (structure, § T question register) and
`docs/FIGMA_VISUAL_AUDIT_PENDING.md` (per-frame findings record).

> **Numbering note.** The rulings referred to the login legal-links item as "B-14"; in this document
> that item is **B-6**. It is closed below. **B-14 (struck-through pricing) is a different item and
> remains open** — see § 2.

---

## Confirmed by the visual audit — no answer needed

Verified findings, recorded so they are not re-litigated. No response required.

| # | Confirmed | Evidence |
|---|---|---|
| C-1 | **Scheduled booking is ONE screen with progressive disclosure**, not a multi-step wizard: **Day → Time (period) → Duration → Start time.** | `37:4183`, `37:3943`, `37:3703`, `34:3035`, `34:1919`, `34:2105` |
| C-2 | **Reschedule is the separate cluster-B flow** — same screen, `mode: 'reschedule'`. Header and bottom bar read "Reschedule"; bar carries **no price**. Cluster B is **not** a duplicate to delete. | `47:6549`, `47:6450`, `47:6059`, `47:5844`, `47:5638` |
| C-3 | **Reschedule has NO Duration step.** Every `47:*` frame is Day → Time → Start time. Rescheduling moves *when*, never *how long*. | Duration grid on all `34:*`, absent from all `47:*` |
| C-4 | **Cancellation is a bottom-sheet stack**, not four screens — one sheet over a dark scrim, one persistent `← Cancel booking + Help` header, four steps. | `6:2`, `104:2260`, `104:2336`, `115:2703` |
| C-5 | **A booking can be rescheduled only ONCE** — stated on the cancellation policy sheet, nowhere else in the file. *(Behaviour now ruled — see R-3.)* | `6:2` |
| C-6 | **`pureVeg` is a cook/dish filtering attribute, not a separate cook roster.** All 8 cards are identical except the 3×3 specialty grid. One `CookCard`; `pureVeg` filters `specialties` only. | `81:448/710/972/1234` vs `87:510/380/250/120` |
| C-7 | **"Eggetarian" exists, so the diet model cannot be assumed boolean.** Chips are **Veg · Non-Veg · Jain · Eggetarian**, and egg dishes are dropped from every pure-veg list. At least 4-valued. | `3:684`; Sanchita/Jyoti egg dishes absent from `87:*` |
| C-8 | **Page 6 is "Meal Brief & Recipe Link"**, not a payment review — a **skippable** customisation form (diet, guest count, dish multi-select, custom dish, recipe URL, notes). | `3:684` — title and "Skip" link both visible |
| C-9 | **Visual audit is 50/50 complete.** 11 earlier + 1 manual (`3:1848`) + 38 in 8 batches, zero failures. | `FIGMA_USER_APP_AUDIT.md` § S |

---

# 0. RESOLVED BY PRODUCT — 2026-08-14

Closed. These are now **specification**, not questions. Implementation follows the ruling as written.

## R-1 · Payment — RESOLVED *(was B-1, T-22)*

**Ruling:** There is **no separate Spoon payment screen**. Tapping `Pay →` opens **Razorpay checkout
directly**. Do not invent a payment-method or payment-review screen. **Payment verification and
authoritative booking/payment state remain backend-owned.**

**Nodes now settled:** `37:3703` / `47:6549` (the `Pay →` bar), `3:684` (meal brief — correctly *not* a
pay step), `25:1585` (taxes popup — informational only), `6:663` (Profile correctly has no payment
methods entry), `3:1041` (Confirmation).

**Implementation consequences**
- No payment routes in the router. `Pay →` invokes the Razorpay checkout SDK and nothing else.
- The client **never** decides that a payment succeeded. On checkout return — success, failure or
  dismissal alike — it **refetches authoritative booking state** and renders whatever the backend says.
  No client-side success inference, no optimistic booking creation.
- Razorpay becomes a committed dependency. Integration mode, key/account, order-creation endpoint and
  the checkout return contract are **backend-contract and engineering items**, not design questions.
- `25:1585` remains the only tax/discount breakdown surface in the product. Accepted as drawn.

## R-2 · Home — RESOLVED *(was B-2, T-18)*

**Ruling:** **One logical Home experience with booking-state variants.**

- **`1:455` (390×2014) = the normal / pre-booking Home.**
- **`59:520` (390×830) = the post-booking / active-booking variant**, containing: top booking
  ETA/status ("Spoon in 18 mins" in the sample), Instant Cook, Schedule Later, the **COOK EN-ROUTE**
  booking card, assigned cook information, arrival ETA, and booking duration.
- ETA, cook name and duration are **dynamic backend data** — nothing in that card is a UI constant.
- **Do not implement the two frames as unrelated routes. Model them as state-driven variants of Home.**

**Implementation consequences**
- One `HomeScreen` route, one active-booking query driving which variant renders.
- Both frames are retained as the two variant references; neither is archived.
- The **tile-copy conflict is now a copy defect, not an architecture question** — "Instant" vs
  "Instant Cook", "Schedule" vs "SCHEDULE LATER". Moved to § 3 as **D-20**.
- Whether the active variant keeps the below-fold marketing stack is a **small open decision** — § 2.

## R-3 · Reschedule limit — RESOLVED *(was B-3, T-26)*

**Ruling:** A booking may be rescheduled **only once**. After it has been rescheduled, the Reschedule
option is **not shown**. **Do not independently infer eligibility on the client** where the backend
exposes authoritative action/eligibility state.

**Nodes now settled:** `6:2` and `104:2336` — the "Reschedule for free" block is **conditionally
rendered** on backend-supplied eligibility. No disabled state, no error-on-submit state, and no
`rescheduleCount` arithmetic in the client.

**Implementation consequence:** booking responses must carry an eligibility/actions field. That is a
**backend-contract item** now, not a design gap.

## R-4 · Unserviceable address — RESOLVED *(was B-5, T-11)*

**Ruling:** The existing map/address flow handles this. If the selected address is outside
serviceability, **the map flow displays that the area is outside the serviceable area**. Do not invent
another separate failure flow.

**Nodes now settled:** `53:31` (Page 16b, map step — where the message surfaces) and `60:655`
(Page 16c — no separate rejection screen).

**Implementation consequence:** serviceability is surfaced **inline in the map step**, not as a modal,
a rejection screen, or a post-save block. Noted honestly: the message itself is **not drawn** on
`53:31`, so we will render it inline using the screen's existing helper-pill treatment. Flagged in the
appendix as an assumption, not re-raised as a blocker.

## R-5 · Upcoming booking — RESOLVED *(was B-9, T-30)*

**Ruling:** Upcoming/active booking information appears **on Home** — the active Home variant contains
the COOK EN-ROUTE card. **Do not invent a separate Upcoming Bookings screen** unless another product
requirement explicitly requires one.

**Nodes now settled:** `59:520` (active Home) and `6:227` (Page 14 stays **Past bookings only**).

**Implementation consequences**
- No Upcoming screen, no tabs added to Page 14 for it.
- Reduces the pressure on the unresolved tab-bar question in `FRONTEND_FOUNDATION_PLAN.md` § 4: Home
  is the active-booking surface, so the shell does not need a bookings tab to make the app usable.
- ⚠ **This ruling does not cover T-31.** Cancelled bookings still have nowhere to appear — Page 14's
  status enum is `Completed | Unfulfilled` and a cancelled booking is neither, nor is it active, so it
  falls off both Home and history. Carried forward as an open product decision in § 2.

## R-6 · Login legal links — RESOLVED *(was B-6, T-8; referred to as "B-14" in the rulings)*

**Ruling:** T&C / Privacy are available from **Profile**. **Do not invent additional legal UI beyond
the approved design.**

**Nodes now settled:** `53:174` (Login — built exactly as drawn, no consent line added) and `6:663`
(Profile — retains the "Terms of Service & Privacy Policy" link).

**Implementation consequence:** Login ships as designed. The consent-at-point-of-collection concern was
raised in the previous revision of this document and is **accepted by product**; recorded here once so
the decision is traceable, and closed.

---

# 1. REMAINING TRUE IMPLEMENTATION BLOCKERS

Four. Each one stops a specific screen from being written — not the foundation (§ 4).

---

## B-7 · When does the OTP screen land? — **blocks auth end-to-end**

> **Question:** The OTP entry screen is confirmed absent from the canvas and marked `DESIGN_PENDING` by
> product decision. When can we expect it — and will it include resend, timeout/expiry, wrong-code and
> rate-limited states?

**Affected node:** `53:174` — Page 17- Login · **Screenshot:** `53-174-page17-login.png`
The CTA "GET OTP →" confirms a follow-up screen is intended.

**Why it blocks:** auth gates every other flow. Login itself also has **no error-state region** drawn
(invalid number, send failure, rate limit), so even the screen that *does* exist cannot handle its own
failures. **We will not invent this screen.**

**Interpretations:** none — this is a delivery date, not an ambiguity.

**Recommendation:** *None on the design.* Only that all four failure states arrive in the same delivery,
since all four are guaranteed to occur in production.

---

## B-4 · Does rescheduling ever charge money? — **blocks the Reschedule submit path**

> **Question:** The Reschedule bottom bar shows **no price but still shows `Pay →`**. Now that `Pay →`
> is confirmed to open **Razorpay directly** (R-1), that button would launch a checkout for an
> unspecified amount. Is rescheduling free — in which case `Pay →` must be removed from the design — or
> can a fare difference apply?

**Affected nodes:** `47:6549`, `47:6450` (bottom bar) · `6:2`, `104:2336` ("Reschedule for free")
**Screenshots:** `47-6549-page5b-scheduled-day-clusterB.png` ·
`47-6450-page5b-scheduled-time-clusterB.png` · `6-2-page12a-cancel-policy.png` ·
`104-2336-page12c-refund-details.png`

**Why it blocks:** R-1 sharpened this rather than closing it. The reschedule submit either (a) calls a
reschedule endpoint and returns, or (b) opens Razorpay for a delta. Those are different code paths and
different backend contracts, and the design currently implies both at once. Note **C-3** — reschedule
cannot change duration, and duration is the price driver — so the artwork is internally consistent with
"free" *except* for the `Pay →` button.

**Available interpretations**
1. **Always free.** `Pay →` is copy-paste residue from the Schedule bar; remove it from the design.
2. **A fare difference can apply.** The bar needs an amount, and the flow needs a Razorpay call.
3. **Free within a policy window, chargeable outside it.** Needs a fee schedule like the cancellation
   one, which does not exist.

**Recommendation:** Interpretation 1 is the only one the existing artwork supports — `6:2` says "free",
the bar carries no price, and the price driver is immutable. **We will not assume it.** One line from
you closes this.

---

## B-11 · Can a booking be cancelled from the live-booking screens? — **blocks the cancellation entry point**

> **Question:** Neither En route screen has a Cancel control — the only header affordance is `Help`. Is
> cancellation reachable from En route / Arrived / In service, and if so, from where?

**Affected nodes:** `3:1381`, `99:1413` · also `3:1658` Arrived, `101:1812` In service
**Screenshots:** `3-1381-page8a-enroute-ontime.png` · `99-1413-page8b-enroute-late.png` ·
`3-1658-page9-arrived.png` · `101-1812-page10-in-service.png`

**Why it blocks:** the cancellation sheet is fully designed (C-4) but has **no verified entry point**
from any live-booking screen. The audit's flow map claims one exists; the pixels contradict it. And the
fee schedule on `6:2` is explicitly time-relative to start ("within 1 hr to start time: 50%"), which is
only reachable if late cancellation is possible. So a complete flow currently has no door.

**Available interpretations**
1. Cancel lives behind the `Help` pill *(couples this to B-10)*.
2. The entry point is undesigned and needs adding to `3:1381` / `99:1413` / `3:1658`.
3. Cancellation is only available before dispatch — in which case the 50% tier on `6:2` is unreachable
   and that fee row is wrong.

**Recommendation:** *None.* Flagging only that interpretation 3 makes the published fee schedule
incorrect, so one of the two designs needs changing either way.

---

## B-8 · How far ahead can a user book? — **blocks the Day selector**

> **Question:** The Day row offers exactly **three chips** — `TODAY Aug 5` · `TOMORROW Aug 6` ·
> `FRI Aug 7`. Is a 3-day horizon the product rule, or is the row scrollable / calendar-backed?

**Affected nodes:** `37:4183`, `47:6549` · **Screenshots:**
`37-4183-page5b-scheduled-day-clusterA.png` · `47-6549-page5b-scheduled-day-clusterB.png`

**Why it blocks:** it decides whether the day selector is a fixed three-chip row or a scrolling /
calendar-backed component — different components, different backend query. It also affects Reschedule,
which reuses the same row. No scroll affordance, no calendar fallback and **no disabled-day treatment**
are drawn, so a fully booked day has no visual language today.

**Available interpretations**
1. Hard 3-day horizon, fixed row.
2. Longer horizon, horizontally scrollable chips (only the first three drawn).
3. Longer horizon with an undrawn calendar-picker fallback.

**Recommendation:** *None.* Whichever it is, a **disabled / sold-out day state** is needed —
start-time availability is already per-slot, so a fully unavailable day is inevitable.

---

# 2. REMAINING PRODUCT DECISIONS

Not blockers. Work proceeds; each is needed before the named screen is finished, and several also
determine a backend-contract field.

| # | Decision needed | Nodes / screenshots | Needed before | What we do meanwhile |
|---|---|---|---|---|
| **B-10** | **`Help` has no destination** — a `Help 📞` pill appears on nine surfaces and a Help tile sits in Profile, but no Help screen exists. Dial-out, in-app support, or third-party chat? *(T-32)* | `3:1381`, `99:1413`, `3:1658`, `101:1812`, `6:2`, `104:2260`, `104:2336`, `115:2703`, `6:663` | any live-booking or cancellation screen ships | Render the pill; stub the handler. **If it's a phone number, send it and it ships immediately.** Couples to **B-11**. |
| **B-12** | **Does the meal-brief diet preference filter cooks/dishes, or only inform the assigned cook?** And does "pure veg" map to `Veg`, or `Veg + Jain`? The brief is **skippable**, so a default must be chosen deliberately. *(C-6/C-7)* | `3:684`; `81:447` vs `87:119` and all 8 cards | the meal brief and cook assignment ship | Component answer is settled (one `CookCard`, `pureVeg` filters `specialties`). Data-model answer parked. |
| **B-13** | **"Receiver's details"** (name + phone, distinct from the account holder) — per-address as drawn, or overridable per booking? Also: label chips are **Home · Parents · Friends · Others**, and `Others` takes no free text. *(T-10)* | `60:655` / `60-655-page16c-address-full.png` | the address form ships | Persisting `receiver: {name, phone}` **on the address record**, exactly as drawn. Say the word if it should be per-booking. |
| **B-14** | **Are the struck-through prices permanent or promotional?** ₹150→₹69 … ₹750→₹319, a flat ~55% off, alongside "Flat 50% OFF First Booking" on Home. Decides one price per tile or two, and whether the struck value is a backend field. *(T-15)* | `37:3703`, `1:455`, `59:520` | the duration grid ships | Rendering both prices as drawn. **Also tell us what the second-booking grid looks like** — that state does not exist in the file. |
| **B-15** | **Where do cancelled bookings appear?** Left open by R-5: Page 14's enum is `Completed \| Unfulfilled` with no `Cancelled`, and a cancelled booking is not active either — so it falls off both Home and history. *(T-31)* | `6:227` / `6-227-page14-booking-history.png` | Page 14 ships | Nothing — a cancelled booking is currently invisible after the confirmation sheet. |
| **B-16** | **Does the active-booking Home keep the below-fold marketing stack?** `1:455` carries "Reasons to rely on Spoon cooks", the **"How to choose a duration?" matrix**, "What's not included?" and "Spoon's promise"; `59:520` ends at a trust row. Same content below the active-booking card, or a deliberately shorter Home? *(from R-2)* | `1:455`, `59:520` | Home ships | Treating the active variant as replacing the stack, per the module list in R-2. |
| **B-17** | **Which secondary-CTA label is canonical** — "Share your requests →" (5 frames) or "Add Custom Meal Brief →" (4 frames)? Both open Page 6. *(T-17)* | all `5b`/`5c` frames | the Schedule screen ships | Using "Add Custom Meal Brief →" — it names the destination correctly. |
| **B-18** | **What does Refund details look like with a non-zero fee?** Only the ₹0 case is drawn; the 25% and 50% variants — and whether the fee row is emphasised — are unverified. *(T-29)* | `104:2336` / `104-2336-page12c-refund-details.png` | the cancellation sheet ships | Reusing the ₹0 layout with the fee row populated. |
| **B-19** | **Should cancel reason "Others" reveal a free-text field?** As drawn, reason 7 of 7 captures nothing actionable. Also unspecified: is "Continue" gated on choosing a reason? *(T-28)* | `104:2260` / `104-2260-page12b-cancel-reason.png` | the cancellation sheet ships | Building as drawn — no free text, no gating. |
| **B-20** | **Is Login's `USER TYPE: [RETURNING USER]` row production UI or a prototype toggle?** *(T-7)* | `53:174` / `53-174-page17-login.png` | Login ships | Treating it as prototype-only and omitting it. |

---

# 3. NON-BLOCKING DESIGN DEFECTS

These do **not** block implementation — the correct behaviour is known and will be built. They need
fixing **in Figma** so the file stops disagreeing with the app.

---

## D-1 · Morning start-time grid: duplicated `06:30 AM`, missing `06:15 AM` *(T-25)*

**Nodes:** `34:3035` (Schedule) and `47:6059` (Reschedule)
**Screenshots:** `34-3035-page5b-scheduled-morning-clusterA.png` · `47-6059-page5c-scheduled-morning-clusterB.png`

The 6 AM row reads **`06:00 · 06:30 · 06:30 · 06:45`**; it should read `06:00 · 06:15 · 06:30 · 06:45`.
First flagged as a possible render artefact at the MCP's 466px native resolution — **confirmed real**,
because `47:6059` reproduces it exactly.

**Why non-blocking:** the grid is a 15-minute sequence generated from the period range, so `06:15` will
render correctly regardless of the artwork. **Fix needed in both clusters.**

---

## D-2 · Afternoon times appearing inside both Evening grids *(T-19)*

**Nodes:** `34:2105` (Schedule) and `47:5638` (Reschedule)
**Screenshots:** `34-2105-page5c-scheduled-eve-clusterA.png` · `47-5638-page5c-scheduled-eve-clusterB.png`

Rows 1–2, columns 3–4 read **`12:30 PM · 12:45 PM · 01:30 PM · 01:45 PM`** inside a grid that is
otherwise `05:00 PM`–`09:00 PM`. Leftovers from the Afternoon frame, reproduced identically in both
clusters — systematic copy-paste, not a one-off.

**Why non-blocking:** the Evening grid is generated from the evening range; stale chips cannot survive
into code. **But it does mean the Evening frames are not a usable spec for evening availability** — we
are treating `05:00 PM`–`09:00 PM` as the intended range. Please confirm that range when fixing.

---

## D-3 · Price desync — ₹189 selected, bottom bar reads ₹129 *(T-16)*

**Nodes:** `37:4183`, `37:3943`, `37:3703` (and the `34:*` states, which inherit the same bar)
**Screenshots:** `37-4183-page5b-scheduled-day-clusterA.png` ·
`37-3943-page5b-scheduled-time-clusterA.png` · `37-3703-page5b-scheduled-duration-clusterA.png`

The **1.5 hr (₹189)** tile is selected, but the bar reads **"Book Now • ₹129"** — the 1 hr price. The
bar also showed ₹129 on `37:4183`, *before any duration was chosen*.

**Why non-blocking:** the bar is obviously bound to the selected duration and will be. Two assumptions
we are making in the absence of a correction — flag if either is wrong:
- the bar shows **no price** (or a disabled state) until a duration is selected;
- ₹129 / 1 hr is **not** a pre-selected default.

Related sample-data drift, same cause: `104:2336` and `115:2703` show **₹135**; `6:227` and `71:615`
show **₹188** — neither matches any tile price (₹69/99/129/189/259/319), and ₹188 vs ₹189 is off by one.

---

## D-4 · "What **rekha** cooks best?" on six of eight cook cards *(T-36)*

**Nodes:** `81:710` Sanchita · `81:972` Barsha · `81:1234` Jyoti · `87:380` Sanchita · `87:250` Barsha ·
`87:120` Jyoti *(correct only on `81:448` / `87:510`, Rekha's own cards)*
**Screenshots:** `81-710-cook-sanchita-regular.png` · `81-972-cook-barsha-regular.png` ·
`81-1234-cook-jyoti-regular.png` · `87-380-cook-sanchita-pureveg.png` ·
`87-250-cook-barsha-pureveg.png` · `87-120-cook-jyoti-pureveg.png`

The heading reads "What **rekha** cooks best?" — wrong name **and** lowercase — on every card except
Rekha's two. All cards were duplicated from Rekha's and the name was never updated.

**Why non-blocking:** the heading is interpolated — `What {firstName} cooks best?` — so the app renders
the right name for every cook. Only the Figma file is wrong. Please confirm **capitalisation**: we use
the cook's name as stored (`Rekha`), matching Rekha's own correct cards.

---

## Other defects confirmed in the audit

| # | Defect | Nodes | Screenshot |
|---|---|---|---|
| D-5 | **Barsha's home state disagrees between her two cards** — `Odisha` (regular) vs `Odiya` (pure veg). "Odiya" is the language, so the pure-veg card is wrong. *(T-37)* | `81:972`, `87:250` | `81-972-cook-barsha-regular.png`, `87-250-cook-barsha-pureveg.png` |
| D-6 | **Secondary CTA has two labels for one control** — "Share your requests →" on 5 frames, "Add Custom Meal Brief →" on 4. Both open Page 6. *(decision tracked as B-17)* | `37:4183/3943/3703`, `34:3035`, `47:6549/6450/6059` vs `34:1919/2105`, `47:5844/5638` | multiple `5b`/`5c` captures |
| D-7 | **Same button, two colours** — the Instant blocked-state "Schedule" CTA is **yellow** on out-of-shift and **lime** on no-slots. *(T-12)* | `25:1327`, `44:5378` | `25-1327-page4c-instant-na-out-of-shift.png`, `44-5378-page4c-instant-no-slots.png` |
| D-8 | **Page 6's primary CTA is clipped by the frame bottom** — the label is unreadable; content overflows 830px. *(T-23)* | `3:684` | `3-684-page6-service-brief.png` |
| D-9 | **Destructive "Cancel" uses primary yellow**, same as Get OTP / Confirm / Pay, while the *non*-destructive "Reschedule for free" gets brighter lime. Logout (`6:663`) proves a red destructive style exists. Also **no "are you sure?" step** — cancellation commits in two taps. *(T-27)* | `6:2`, `104:2336`, `115:2703`, `6:663` | `6-2-page12a-cancel-policy.png`, `104-2336-page12c-refund-details.png` |
| D-10 | **Copy: "Add a new addresses"** → "Add a new address". | `68:214` | `68-214-page16a-address-location.png` |
| D-11 | **Booking-history card headers disagree** — card 1 shows a duration ("1 hr"), cards 2–5 a start time ("1:15 PM"). | `6:227` | `6-227-page14-booking-history.png` |
| D-12 | **"FEE AS PERCENTAGE" column header, but the first value is an absolute `₹0`.** | `6:2` | `6-2-page12a-cancel-policy.png` |
| D-13 | **Food-icon set doesn't cover the dishes the app shows** — no biryani, bhatura, pav bhaji or chutney glyph; `Broccoli`, `Cauliflower`, `Sugar Cubes` each appear twice. *(T-35)* | `94:905` | `94-905-food-icons-reference.png` |
| D-14 | **The "Icons" frame contains only a back chevron and a close ✕** (3 nodes). Not an icon set — the icon library stays an open engineering choice. *(T-34)* | `54:280` | `54-280-icons-reference.png` |
| D-15 | **Refund status enum is `Processing \| Refunded` — no `Failed`**, though reversals do fail. *(T-33)* | `71:615` | `71-615-page18-refund-history.png` |
| D-16 | **Dish-name spelling drift** — `Gobi manchurian` vs `Gobhi capsicum`, `Pyaaz/gobi pakode`. These are catalogue keys; normalise them. | `87:380`, `87:250`, `81:448` | cook-card captures |
| **D-20** | ⚠ **New, from R-2.** **The two Home variants use different tile copy** — "**Instant** / Get a cook in 18 mins" vs "**Instant Cook** / 18 mins", and "**Schedule** / Plan your meal" vs "**SCHEDULE LATER** / Plan Next Meal". Now that both are variants of one Home, the same tiles must not rename themselves when a booking becomes active. **One canonical pair needed.** Also: the promo carousel is finished art on `59:520` and an empty placeholder on `1:455`. | `1:455`, `59:520` | `1-455-page3-home-tall.png`, `59-520-page3-home-830h.png` |

---

# 4. FOUNDATION READINESS

**Verdict: foundation implementation is CLEARED TO BEGIN.**

The four remaining blockers (§ 1) are **screen-level**: OTP entry, the reschedule-charge question, the
cancellation entry point, and the booking horizon. None of them touches the foundation work scoped in
`docs/FRONTEND_FOUNDATION_PLAN.md` § 21, which is deliberately design-independent — project scaffold,
TypeScript config, folder architecture and import rules, the router shell, theme/token layer, the API
transport layer (no endpoints), state and error architecture, storage, config, logging, and the test
harness.

**What the rulings unblocked at the foundation level**
- **R-1** removes payment routes from the router entirely and fixes the post-checkout rule: refetch
  authoritative state, never infer success. That is an architecture decision, and it is now made.
- **R-2** settles Home as one route with state-driven variants — the app's entry point and the parent
  of both booking flows.
- **R-5** relieves the tab-bar uncertainty in `FRONTEND_FOUNDATION_PLAN.md` § 4: no Upcoming screen is
  needed, so the shell does not need a bookings tab to be usable.
- **R-3** reinforces the § 20 responsibility boundary — the client renders backend-supplied eligibility
  and does not compute it.

**What remains gated, and by what**
- **Auth screens** — B-7 (OTP `DESIGN_PENDING`).
- **Reschedule submit** — B-4.
- **Cancellation entry point** — B-11 (and B-10 if it lives behind `Help`).
- **The Day selector on Schedule/Reschedule** — B-8.
- **All API endpoints, payload shapes and status enums** — the standing constraint: **no backend
  contract exists** (`FRONTEND_FOUNDATION_PLAN.md` § 5, § 15, § 18, § 20). Unchanged by these rulings,
  and independent of design. The transport mechanism is buildable now; the contract is not inventable.

---

## Appendix — proceeding without asking

Recorded for transparency. Not blocking; tell us if any is wrong.

| Item | What we will do |
|---|---|
| **Serviceability message on `53:31`** *(from R-4)* — the ruling says the map flow shows it, but no such message is drawn on the frame | Render it inline in the map step using the screen's existing helper-pill treatment |
| **Loading / skeleton states** *(T-5)* — none designed, though address lookup, cook assignment, Razorpay return, OTP, extension pricing and refund calculation all need them | Build generic skeleton/spinner treatments from the existing token set |
| **Pages 2, 5a, 8c, 13 absent** *(T-2)* | Assume intentionally renamed/deleted; building nothing for them |
| **`3:1848` vs `101:1812`** *(T-4)* — same `Page 10-` prefix, 830h vs 1236h | One scrolling `InServiceScreen`. Confirm before either frame is deleted |
| **Nothing designed between a correct Start OTP and the live session** *(T-4c)* | Instant swap plus a generic loading state |
| **Saved-address rows have no edit/delete/default affordance and no empty state** *(T-9)* | Ship the list as drawn; raise when the empty state matters |
| **Cook specialty grid is always exactly 9 dishes** | Treat 9 as a display cap; overflow truncated, shortfall renders fewer tiles |
| **Map provider unchosen** — `53:31`'s map is a placeholder illustration, not a provider render | Open engineering decision, not a design one |
| **Trust badges (Spoon Trained / Background Verified / On-time)** — all cards show all three | Render conditionally; no partial layout exists to match |
| **Razorpay integration specifics** *(from R-1)* — checkout mode, key/account, order creation, return contract | Engineering + backend-contract items; not designer questions |
