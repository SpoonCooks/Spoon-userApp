# Figma Visual Audit — Findings Record

> ## ✅ COMPLETE — 50 / 50 frames verified, 2026-08-14
>
> **This file is no longer a to-do list.** Nothing is pending. It is now the per-frame findings record
> for the visual audit; every heading below is a verified frame with what was actually seen in it.
>
> The rate limit that blocked the earlier attempt is gone: the audit moved to the imported copy of the
> file in a **student-tier / Full-seat** account, where all 38 outstanding screenshots succeeded with
> **zero failures**. `docs/FIGMA_EXPORT_REQUEST.md` is withdrawn.
>
> - **Structural conclusions that changed** → `FIGMA_USER_APP_AUDIT.md` **§ V**
> - **Open designer/product questions (T-2 … T-37)** → `FIGMA_USER_APP_AUDIT.md` **§ T**
> - **Product rulings of 2026-08-14** → `FIGMA_USER_APP_AUDIT.md` **§ W** · designer-facing:
>   **`FIGMA_FINAL_BLOCKERS.md`**
> - **Design tokens** → `FIGMA_DESIGN_TOKENS.md`
>
> **Rulings applied 2026-08-14:** T-22 (payment → Razorpay direct, no Spoon payment screen), T-18
> (Home = one screen, booking-state variants), T-26 (reschedule option hidden once used), T-11
> (unserviceable address handled in the map flow), T-30 (active booking lives on Home), T-8 (no extra
> legal UI beyond Profile) are **closed**. Findings below are left as observed; the ⚠ flags on those
> six now record *what was seen*, not open questions.
>
> Screenshots: `.figma-audit/screens/` — Windows-safe naming,
> `<node-id-with-colon-as-hyphen>-<slug>.png`.

## File migration

| | Old | New (authoritative) |
|---|---|---|
| File key | `XMNpmq1fShR87GkLJhLGjW` | **`BTPW14a7M69ySPZxdkc2yn`** (`V0_-user-app`) |
| Page | `0:1 User App` | `0:1 User App` — confirmed the **only** page in the document |
| Account | `lakshayd.intern@spoonhelp.com` · starter · View seat | Lakshay Dawar · **student** tier · **Full** seat |

### Node-ID mapping: verified IDENTITY

The import was expected to renumber nodes. **It did not.** Verified by dumping the full `0:1` metadata
tree from the new file and diffing name + x + y + width + height against the old audit inventory:

- **41 / 41** depth-1 canvas children match exactly (ID, name, x, y, w, h).
- **12 / 12** section children match exactly (8 cook cards, 4 Cancellation frames).

**Therefore `old node ID == new node ID` for all 50 audited frames.** No remapping table is required;
only the file key changed. This was measured, not assumed.

### Progress — ✅ COMPLETE

| | Count |
|---|---|
| Total frames requiring visual inspection | **50** |
| Visually verified | **50** |
| Remaining pending | **0** |

**VISUAL_AUDIT: COMPLETE.** Every frame in the inventory has been rendered and inspected.

> *Count-drift note:* the per-batch running totals recorded in earlier revisions of this file were each
> one higher than the true figure (an off-by-one introduced in the batch-1 entry and carried forward).
> The final tally is reconciled from first principles: **12** previously verified + **5 batches × 5** +
> **5** (batch 7) + **3** (batch 8) = **50**. The `1:455` re-capture is not counted as new.

**Previously verified (12):** `73:1036` · `71:747` · `1:455` · `1:728` · `25:1585` · `3:1041` ·
`3:1381` · `3:1658` · `101:1812` · `3:2002` · `143:207` · `3:1848` (manual).

**Verified in this session (38):** `53:174` · `68:214` · `53:31` · `60:655` · `59:520` · `25:1327` ·
`44:5378` · `37:4183` · `37:3943` · `37:3703` · `34:3035` · `34:1919` · `34:2105` · `47:6549` ·
`47:6450` · `47:6059` · `47:5844` · `47:5638` · `3:684` · `99:1413` · `6:2` · `104:2260` · `104:2336` ·
`115:2703` · `6:227` · `6:663` · `71:615` · `54:280` · `94:905` · `119:2885` · `81:448` · `81:710` ·
`81:972` · `81:1234` · `87:510` · `87:380` · `87:250` · `87:120`.

All 49 PNGs are in `.figma-audit/screens/` (50 frames; `3:1848` remains manually verified with no
MCP-rendered PNG — its stored capture is the pre-existing one).

### Capture log

| Date | Batch | Frames | Retrieved | Outcome |
|---|---|---|---|---|
| 2026-08-14 | (old account) | `53:174` | 0 | Rate limited on Starter plan. Superseded. |
| 2026-08-14 | 1 | `53:174`, `68:214`, `53:31`, `60:655`, `59:520` | 5/5 | ✅ No rate limit |
| 2026-08-14 | 2 | `25:1327`, `44:5378`, `37:4183`, `37:3943`, `37:3703` | 5/5 | ✅ |
| 2026-08-14 | 3 | `34:3035`, `34:1919`, `34:2105`, `47:6549`, `47:6450` | 5/5 | ✅ Cluster B confirmed = Reschedule |
| 2026-08-14 | 4 | `47:6059`, `47:5844`, `47:5638`, `3:684`, `99:1413` | 5/5 | ✅ Page 6 reclassified; 2 design defects confirmed |
| 2026-08-14 | 5 | `6:2`, `104:2260`, `104:2336`, `115:2703`, `6:227` | 5/5 | ✅ Cancellation = sheet stack; reschedule-once rule found |
| 2026-08-14 | 6 | `6:663`, `71:615`, `54:280`, `94:905`, `119:2885` | 5/5 | ✅ Rating widget fully specified; "Icons" frame is empty |
| 2026-08-14 | — | `1:455` (re-capture) | 1/1 | Out-of-band. The stored PNG was too low-res to settle the `59:520` contradiction; re-pulled at native 466×2090. See finding V-5. |

**Render resolution note:** `maxDimension` caps but does not upscale. Native render for a 390×830 frame
is **466×906** (~1.19×), and that is the maximum detail the MCP will return. Fine for layout, copy and
component identification; not sufficient for sub-pixel spacing measurement.

---

## Authentication

### ✅ `53:174` — Page 17- Login — VERIFIED (batch 1)

`53-174-page17-login.png`

- **Auth method: phone + OTP only.** No email, no social, no password.
- Country code is a **static `+91` prefix**, not a picker. Single-market assumption baked into the design.
- CTA reads **"GET OTP →"** — confirms OTP entry is a **separate follow-up screen**.
- Brand block above the field: Spoon logo, pill badge "GET A TRAINED COOK IN 15 MINS", headline
  "Professional cooking tailored to your taste".
- Footer trust line: "100% Background-Verified Cooks • Hygiene Inspected".
- **`USER TYPE: [RETURNING USER]` row** sits between the input and the CTA. This is almost certainly a
  **prototype-only state toggle**, not production UI — a real user does not self-declare as returning.
  Do not build it without asking. → new question **T-7**.
- **No T&C / privacy-policy link anywhere on the screen.** Raised as a compliance concern (**T-8**).
  ✅ **RULED (2026-08-14):** T&C / Privacy are available from **Profile**; **do not invent additional
  legal UI beyond the approved design.** Login ships as drawn. Concern raised, decision recorded,
  closed.
- ⚠ **No error-state region** designed (invalid number, OTP send failure, rate limit).

> **OTP screen: `DESIGN_PENDING`.** Confirmed absent from the canvas. Per product decision, it is still
> being designed — **do not invent it**. Blocks the auth flow from being built end-to-end.

---

## Address

**Flow correction:** the three address frames are *not* three steps of one linear "add address" wizard.
16a is a **list/management** screen; 16b→16c is the **add** wizard. Entry to 16b is via 16a's
"Add a new addresses" button.

### ✅ `68:214` — Page 16a- Address location — VERIFIED (batch 1)

`68-214-page16a-address-location.png`

- **Not a map screen.** It is **"Saved addresses"** — a list, despite the frame name saying "location".
- Header: back chevron + "Saved addresses".
- Primary CTA: yellow bar **"Add a new addresses"** + circular `+`. (Copy bug in the design —
  "a new addresses". Fix to "Add a new address".)
- Card titled "Saved Addresses" containing **8 identical rows**, all labelled "Home", all
  `B-402, Green Meadows, Indiranagar 100ft Road, Kora…` — placeholder repetition, not 8 real addresses.
- Each row: bold label + truncated address with trailing ellipsis. **No per-row edit/delete affordance,
  no default-address indicator, no selected state.** → question **T-9**.
- ⚠ **No empty state designed** for a user with zero saved addresses — which is every new user, i.e.
  the state that immediately follows first login. Notable gap.

### ✅ `53:31` — Page 16b- Address location — VERIFIED (batch 1)

`53-31-page16b-address-location.png`

- **"Select service location"** — this is the map/pin step.
- Search field labelled "Area, Street or Building Name", magnifier icon, value
  "Indiranagar 100ft Road, Bengaluru".
- **Map with a red draggable pin.** Styling is **generic/unbranded** (cream ground, pale road strokes) —
  it is a **placeholder illustration, not a real map provider render**. Provider (Google Places /
  Mapbox / Ola Maps) is therefore **still an open engineering choice**, not implied by the design.
- Helper pill over the map: "Move pin to help the cook reach accurately".
- Resolved-address row: pin icon + "Street Name" / "Area 124, subarea 2 xyz, city efg".
- CTA: **"Confirm"**.
- ⚠ **No "use my current location" CTA** and no geolocation-permission prompt designed.
- ⚠ No loading/skeleton state for geocoding.

### ✅ `60:655` — Page 16c- Address full — VERIFIED (batch 1)

`60-655-page16c-address-full.png`

- **"Add address details"** form. Confirmed field schema:

  | Field | Type | Notes |
  |---|---|---|
  |  Flat no. / House No. + Tower | text | |
  |  Building + Plot no. | text | |
  | Area | text (prefilled from 16b) | paired with a **map thumbnail + "Change"** → returns to 16b |
  | Add label | chip select | **Home · Parents · Friends · Others** |
  | Receiver's name | text | under "Receiver's details" |
  | Receiver's phone no. | text | |

- ⚠ **Label chips are `Home / Parents / Friends / Others`** — *not* the Home/Work/Other the structural
  audit assumed. `Parents` is shown selected. Persist as an enum + free text for `Others`.
- **"Receiver's details" is a new concept** the structural audit missed entirely: the booking's contact
  person can differ from the account holder. This changes the booking data model — it needs a
  `receiver: {name, phone}` distinct from the authenticated user. → question **T-10**.
- CTA: **"Check Availability & Save"** — implies a **serviceability check network call** on save, so
  the address can be *rejected*. **No rejection/out-of-service-area state is designed here.**
  ✅ **RULED (2026-08-14):** the **map/address flow** handles it — the map step (`53:31`) displays that
  the area is outside the serviceable area. **Do not invent a separate failure flow.** Closes **T-11**.
  Note the message is not drawn on `53:31` either; we render it inline using that screen's existing
  helper-pill treatment.
- ⚠ **No gate/security-instructions field**, despite Page 8a's "Note before starting" referencing gate
  access. The structural audit's hypothesis is **disproved** — that data has nowhere to be captured.
- No required-vs-optional marking on any field; no disabled CTA state.

---

## Home

### ✅ `59:520` — Page 3- home page (830h) — VERIFIED (batch 1) — **AUDIT CORRECTION** — ✅ **RULED**

`59-520-page3-home-830h.png`

**This is NOT a top-fold crop of `1:455`.** The structural audit (section D) recommended merging them as
"height only". That recommendation is **retracted** — see finding V-5 below for the side-by-side.

> **Product ruling (2026-08-14):** `59:520` is the **post-booking / active-booking variant of Home**,
> and `1:455` is the **normal / pre-booking Home**. One logical Home, two booking-state variants —
> **not two routes.** ETA, cook name and duration in the COOK EN-ROUTE card are **dynamic backend
> data**. Both frames are retained.

Content of `59:520`, in order:
- Header: "⚡ Spoon in 18 mins" + avatar; address selector "Home ▾" / "E102, Purva Skydale, Silver Count…"
- **Populated promo carousel**: photo, "SPECIAL OFFER" pill, "Flat 50% OFF First Booking",
  "Services starting at just ₹69 • Code:…", 4 dot indicators (1st active)
- Two booking tiles: **"Instant Cook / 18 mins"** (lime) · **"SCHEDULE LATER / Plan Next Meal"** (yellow)
- ⚠ **"COOK EN-ROUTE" active-booking card** — black card, cook photo, "Ramesh Kumar",
  "🕐 Arriving in 18 mins", "Duration: 60 mins", circular `→` CTA. **No equivalent exists in `1:455`.**
- Trust row: HOMELY "Ghar ka swaad" · FRESH "Cooked live" · TRUSTWORTHY "Verified cooks"

---

## Instant booking

**Both 4c frames resolved — they are one component, not two screens.**

Each renders the **Instant bottom sheet (`1:728` 4a) with its duration grid blurred and disabled**, and
a centred icon + message overlaid. Home is visible and blurred behind. Implementation: a single
`InstantSheet` with a `blockedReason` state carrying `{icon, message}`, plus the Schedule fallback.

### ✅ `25:1327` — Page 4c- Instant- NA out of shift — VERIFIED (batch 2)

`25-1327-page4c-instant-na-out-of-shift.png`

- Icon: **crescent moon**. Message: **"Slots open at 6 AM today"**.
- Bottom CTA: **"Schedule"**, **yellow**.
- Answers the retention question: the user is **routed to the Scheduled flow**, not offered "notify me".
- Message embeds a **dynamic time** ("6 AM") — must come from a serving-hours config, not hardcoded.

### ✅ `44:5378` — Page 4c- Instant- No slots — VERIFIED (batch 2)

`44-5378-page4c-instant-no-slots.png`

- Icon: **calendar**. Message: **"Sorry, all sold out!"**.
- Bottom CTA: **"Schedule"**, **lime green**.
- **No countdown or ETA-to-next-slot** is shown.
- ⚠ **Inconsistency:** the identical "Schedule" CTA is **yellow on `25:1327` and lime on `44:5378`**.
  Same button, same role, two colours. Almost certainly unintentional. → question **T-12**.

---

## Scheduled booking

> Note: Every 5b/5c frame appears in **two clusters** (A and B). Both clusters must be inspected side-by-side to determine whether B is a duplicate to delete or the Reschedule flow (see `FIGMA_USER_APP_AUDIT.md` question T-1).

### Cluster A (y ≈ -1128 to 929)

#### ✅ `37:4183` / `37:3943` / `37:3703` — Scheduled day / time / duration — VERIFIED (batch 2)

`37-4183-page5b-scheduled-day-clusterA.png` · `37-3943-page5b-scheduled-time-clusterA.png` ·
`37-3703-page5b-scheduled-duration-clusterA.png`

**Structural finding — these are three states of ONE screen, not three screens.**

All three frames are pixel-identical except that each successive frame **reveals one more section**.
Header ("← Schedule"), the persistent bottom bar and everything already chosen stay in place. This is
**progressive disclosure on a single route**, so build **one `ScheduleScreen`**, not a 3-step wizard.

| Frame | Sections visible |
|---|---|
| `37:4183` | Day |
| `37:3943` | Day → Time |
| `37:3703` | Day → Time → Duration |

**Day** — 3 horizontal chips only: `TODAY Aug 5` · `TOMORROW Aug 6` · `FRI Aug 7` (Aug 7 selected, lime
fill). Chips show weekday label above bold date. **Booking horizon appears to be 3 days** — no scroll
affordance, no calendar-grid fallback, no disabled-day treatment shown. → question **T-13**.

**Time** — 3 chips with icons: `Morning` (sunrise, selected) · `Afternoon` (sun) · `Evening` (moon).
⚠ **This resolves the "missing afternoon/night variant" concern: nothing is missing.** The selector has
exactly three periods. The frame *names* say "morning / noon / eve" while the *UI* says
"Morning / Afternoon / Evening" — `noon` == `Afternoon`. The 5b-vs-5c naming split is a **naming
inconsistency in Figma only** and carries no product meaning.

~~There is no concrete time-slot picker anywhere.~~ **Superseded by batch 3** — a **Start time** grid is
revealed as a 4th section on the `34:*` frames. There is no gap here; `T-14` is withdrawn.

**Duration** — 6 tiles in a 3×2 grid, each with a **struck-through original price and a discounted
price**:

| Duration | Was | Now |
|---|---|---|
| 30 mins | ₹150 | ₹69 |
| 45 mins | ₹225 | ₹99 |
| 1 hr | ₹300 | ₹129 |
| **1.5 hr** (selected) | ₹450 | ₹189 |
| 2 hr | ₹600 | ₹259 |
| 2.5 hrs | ₹750 | ₹319 |

Discount is a flat **~54–57% off** across the board — consistent with the "Flat 50% OFF First Booking"
promo on Home. Whether the struck price is permanent or promo-conditional is **not** shown. → **T-15**.

**Persistent bottom bar** (present on all three states, from the very first): black-on-yellow
**"Book Now • ₹129"** with an inset dark **"Pay →"** button, and below it a secondary
**"Share your requests →"** row.

- ⚠ **Price desync bug in the design:** duration **1.5 hr (₹189)** is selected, but the bottom bar still
  reads **₹129** (the 1 hr price). The bar also already showed ₹129 on `37:4183` *before any duration
  was chosen*. Either the bar is stale artwork or ₹129 is a hardcoded default. → question **T-16**.
- **"Share your requests →" is a previously-unknown feature** — free-text special instructions attached
  to a booking. Absent from the structural audit and from the data model. Its own screen/sheet is
  **not on the canvas**. → question **T-17**.

#### ✅ `34:3035` / `34:1919` / `34:2105` — morning / noon / eve — VERIFIED (batch 3)

`34-3035-page5b-scheduled-morning-clusterA.png` · `34-1919-page5b-scheduled-noon-clusterA.png` ·
`34-2105-page5c-scheduled-eve-clusterA.png`

**These are the 4th disclosure state of the same screen, one per selected Time period.** Each adds a
**"Start time"** section below Duration: a **4-column grid of concrete clock times in 15-minute
increments**, filtered to the chosen period. Day / Time / Duration above it are unchanged and still
show `Aug 7` + `1.5 hr` selected.

| Frame | Period chip active | Start-time range | Selected |
|---|---|---|---|
| `34:3035` | Morning | 05:00 AM → 11:45 AM | 06:30 AM (see caveat) |
| `34:1919` | Afternoon | 12:00 PM → 04:45 PM | 01:15 PM |
| `34:2105` | Evening | 05:00 PM → 09:00 PM | 06:15 PM |

**Availability is per-slot:** many chips are greyed/disabled (e.g. all four `:00` slots in several
Morning rows), interleaved with enabled ones. So the backend must expose availability **per 15-minute
slot**, not per period.

**So the full Scheduled screen is one route with four progressive sections:
Day → Time (period) → Duration → Start time.** Confirms and completes the batch-2 finding.

##### Defects found in these three frames

1. ⚠ **`34:2105` Evening contains stale afternoon times.** Rows 1–2, columns 3–4 read
   **`12:30 PM · 12:45 PM · 01:30 PM · 01:45 PM`** — inside a grid that is otherwise
   `05:00 PM`–`09:00 PM`. These are left over from the Afternoon frame. **Do not treat the Evening grid
   as a spec for evening availability**; it is visibly copy-pasted. → question **T-19**.
2. ⚠ **Secondary CTA has two different labels for the same slot:**
   **"Share your requests →"** on `37:4183` / `37:3943` / `37:3703` / `34:3035`, but
   **"Add Custom Meal Brief →"** on `34:1919` / `34:2105`. "Meal Brief" plausibly links this control to
   **Page 6 "service brief"** — which would make it a core flow step rather than an optional extra.
   Same control, two names, two possible meanings. → question **T-17** (widened).
3. Caveat on the Morning selection: at the MCP's native 466px render, adjacent 15-minute labels are at
   the edge of legibility, and the 06:00 row appears to show **`06:30 AM` twice**. Given defect 1
   above, a genuine duplicate is plausible — but this one is **not asserted**, only flagged for the
   designer to check. Treated as unresolved, not as a finding.

### ✅ Cluster B (y ≈ 3329 to 5453) — **CONFIRMED: this is the Reschedule flow, not a duplicate**

The pre-existing product decision is now **visually verified**, not assumed:

- **`47:6549`** (`47-6549-page5b-scheduled-day-clusterB.png`) — header reads **"Reschedule"**;
  bottom bar reads **"Reschedule"** + `Pay →`.
- **`47:6450`** (`47-6450-page5b-scheduled-time-clusterB.png`) — same, with the Time row revealed.

**Diff vs cluster A — exactly two changes:**

| | Cluster A (`37:*` / `34:*`) | Cluster B (`47:*`) |
|---|---|---|
| Header title | `Schedule` | **`Reschedule`** |
| Bottom bar label | `Book Now • ₹129` | **`Reschedule`** — **no price** |

Everything else — Day chips, Time chips, layout, spacing, `Pay →` button, "Share your requests →" —
is identical.

**Implementation consequence:** Schedule and Reschedule are **one screen with a `mode` prop**
(`'book' | 'reschedule'`) driving the title and the bottom-bar label. Do **not** build two screens, and
do **not** delete cluster B.

⚠ **The Reschedule bar shows no price, but still shows `Pay →`.** If rescheduling is free (Page 12a
advertises "Reschedule for free"), a Pay button is wrong; if a fare difference can apply, no amount is
shown. → question **T-20**.

⚠ Cluster B has **no Duration and no Start-time frame drawn** (A has 4 states, B has 2). Whether
reschedule lets the user change duration, or only day/time, is **undesigned**. → question **T-21**.

#### ✅ `47:6059` / `47:5844` / `47:5638` — Reschedule morning / noon / eve — VERIFIED (batch 4)

`47-6059-page5c-scheduled-morning-clusterB.png` · `47-5844-page5b-scheduled-noon-clusterB.png` ·
`47-5638-page5c-scheduled-eve-clusterB.png`

Start-time grids and availability are **identical to their cluster-A counterparts**. Two structural
differences confirmed:

1. ✅ **T-21 answered — Reschedule cannot change duration.** All three frames go
   **Day → Time → Start time**, with **no Duration section at all**. The 3×2 duration grid present on
   `34:*` is absent from every `47:*` frame. So rescheduling moves *when*, never *how long*. That is
   consistent with the price being fixed (hence the priceless "Reschedule" bar) — but it must be an
   intentional product rule, because it means a user who wants a different duration has to cancel and
   rebook. → confirm as **T-21**.
2. Secondary CTA splits the same way as cluster A: **"Share your requests →"** on `47:6549` / `47:6450`
   / `47:6059`, **"Add Custom Meal Brief →"** on `47:5844` / `47:5638`.

##### Two design defects now CONFIRMED in both clusters

- ⚠ **Missing `06:15 AM` / duplicated `06:30 AM`.** The 6 AM row of the Morning grid reads
  `06:00 · 06:30 · 06:30 · 06:45`. The batch-3 caveat is **resolved — this is real, not a render
  artefact**: `47:6059` reproduces it exactly. Present in both `34:3035` and `47:6059`. → **T-25**.
- ⚠ **Stale afternoon times in both Evening grids.** `47:5638` reproduces `34:2105`'s defect precisely —
  rows 1–2, columns 3–4 read `12:30 PM · 12:45 PM · 01:30 PM · 01:45 PM` inside an otherwise
  `05:00 PM`–`09:00 PM` grid. Confirmed systematic, not a one-off. → **T-19**.

Because both defects reproduce identically in both clusters, the Reschedule frames were almost
certainly **duplicated from the Schedule frames after the defects were introduced**. Fixing them
requires editing both clusters.

---

## Booking lifecycle

### ✅ `3:684` — Page 6 — VERIFIED (batch 4) — **MAJOR RECLASSIFICATION**

`3-684-page6-service-brief.png`

**The frame is named "service brief" but its actual title is "Meal Brief & Recipe Link".**
It is **not** a pre-booking payment review. The structural audit predicted "editable vs read-only
fields, payment method picker, taxes/discounts breakdown, T&C acceptance, Confirm & Pay". **None of
that is on this screen.** Every one of those predictions is wrong.

What it actually is: an **optional meal-customisation form** — note the **"Skip"** link in the top
right — that tells the cook what to cook.

| Section | Control | Values seen |
|---|---|---|
| Dietary Preference | single-select chips | **Veg** (selected, black) · Non-Veg · Jain · **Eggetarian** |
| Number of Guests | `−` / `+` stepper | `2` |
| 🍴 Select Dishes for Cook | **multi-select** chips; selected = black + ✓, unselected = outline + `+` | ✓ Homestyle Dal Tadka · ✓ Phulka (Soft Roti) · ✓ Jeera Rice · Paneer Butter Masala · Aloo Gobi Dry · Ghar Ka Rajma · Kadai Chicken Curry · South Indian Rasam |
| Custom dish | text field + **Add** button | placeholder "Add custom dish (e.g., Baingan Bharta)…" |
| 📹 Reel / YT Video Recipe Link | URL field, badged **Optional** | "Have a specific recipe Reel or YouTube Short you want your cook to follow? Paste the link below!" · `https://youtube.com/shorts/dal-tadka-recipe-spoon` |
| Custom Cooking Notes & Spice Preferences | textarea | "Please make low-oil Homestyle Dal Tadka with 8 soft Phulkas and Jeera Rice. Extra cumin in the tadka please!" |

**This is the destination of the Scheduled screen's secondary CTA** — which is labelled
**"Add Custom Meal Brief →"** on 4 of the 6 Scheduled frames. That closes **T-17**: the control is not
a mystery extra, it opens Page 6. The competing label "Share your requests →" on the other frames is
the stale one.

**Consequences:**
- **A `mealBrief` object joins the booking data model**: `{dietaryPreference, guestCount, dishes[],
  customDishes[], recipeUrl, notes}`. None of this was in the structural audit's model.
- The **dish catalogue is a backend resource**, not a static list — with user-authored custom dishes.
- **The recipe-link field accepts arbitrary user URLs.** Validate and sanitise; decide whether the cook
  app renders or merely displays it.
- ✅ **Where payment happens — RESOLVED (product ruling, 2026-08-14).** The audit assumed Page 6 was the
  pay step; the only `Pay →` button in the file is on the Schedule/Reschedule bottom bar, and **no
  payment-method picker, taxes breakdown or T&C acceptance exists anywhere on this canvas.** That
  absence is **intentional**: `Pay →` opens **Razorpay checkout directly**, and there is no Spoon
  payment screen to build. Payment verification and authoritative booking/payment state are
  **backend-owned** — the client refetches state after checkout and never infers success. Closes
  **T-22**.
- ⚠ **The primary CTA is clipped.** The yellow button is sliced by the 830px frame bottom, so its label
  is unreadable. Content overflows the frame. → question **T-23**.

### ✅ `99:1413` — Page 8b- En route late — VERIFIED (batch 4)

`99-1413-page8b-enroute-late.png` — compared directly against the stored `3:1381` (8a).

**Confirmed: a pure state variant. Exactly two things change.**

| | `3:1381` 8a on time | `99:1413` 8b late |
|---|---|---|
| Banner fill | **lime green** | **yellow** |
| Banner body copy | "The cook will reach your location on time!" | "We're sorry for the delay, the cook is running late" |
| Banner heading | "Cook Rekha is arriving" | identical |
| ETA figure | 16 mins | 21 mins *(dynamic — not a variant difference)* |

Identical on both: header (← Home / address + **Help 📞** pill), cook card (photo, "Cook Rekha",
Female · North Indian · West Bengal · Hindi, Bengali, **Call Cook**), "What Rekha cooks best?" 3×3
specialty grid, trust row (Spoon Trained · Background Verified · On-time), and the "Note before
starting" card.

- **No "Reassign cook", no delay reason, no compensation/refund offer, no extra support CTA.** The late
  state is presentational only.
- ⚠ **Neither 8a nor 8b has a Cancel booking control.** Section B of the audit states the cancellation
  flow is "reachable from Confirmation / En route / Arrived (Cancel button)" — **that is contradicted
  for both En route screens.** The only header affordance is `Help`. Either cancellation lives behind
  Help, or the entry point is undesigned. → question **T-24**.
- **Full "Note before starting" copy** (this is where gate access is communicated — and recall Page 16c
  has **no field to capture it**): *"Please approve gate entry and ensure groceries and gas are
  available before cook's arrival to avoid disrupted, extended service and related charges."*

### ~~`3:1848` — Page 10- Countdown~~ ✅ CLEARED

**MANUALLY_VISUALLY_VERIFIED 2026-08-14. No export needed — do not include in the designer request.**

The node is intact; the 1×1 render was an **MCP rendering limitation**, not a broken frame. The `DESIGN_BROKEN` / `MANUAL_EXPORT_REQUIRED` flags previously on this node are withdrawn.

Verification also **reclassified** it: despite the name, it is a live in-service screen (Extend Time, End Service, End OTP, cook profile, Call Cook, specialties grid), most likely the 830h top-fold crop of `101:1812` In service — not a transitional countdown. Full inventory and the dynamic-data note in `FIGMA_USER_APP_AUDIT.md` **section U**.

One question remains open for the designer, but it needs an *answer*, not an export: does `3:1848` diverge from `101:1812` below the fold? See audit question T-4.

---

## Cancellation

> ### ✅ ALL FOUR VERIFIED (batch 5) — **CLASSIFICATION CORRECTION**
>
> **The cancellation flow is a bottom-sheet stack, not four full screens.** Every one of the four
> frames renders as a rounded sheet occupying the lower ~65% of the viewport over a **dark scrim**, and
> all four share one persistent sheet header: `←` + **"Cancel booking"** + a **Help 📞** pill.
> The audit's section E lists Pages 12a–d under "Logical screen" — **retract that**; they are
> **one `CancelBookingSheet` with four steps**, and the back chevron steps within the sheet.

### ✅ `6:2` — Page 12a- Cancel policy — VERIFIED (batch 5)

`6-2-page12a-cancel-policy.png`

**Fee schedule confirmed exactly as the audit recorded it:**

| TIME | FEE AS PERCENTAGE |
|---|---|
| More than 3 hrs to start time | **₹0** |
| Between 3 hrs to 1 hr to start time | **25%** |
| Within 1 hr to start time | **50%** |

Two info rows below it:
- 💰 "**This fee goes towards compensating the cook**" / "Their time is reserved & they won't be able to
  take another job"
- 🔄 "**Cancellation on rescheduled bookings**" / "**An original booking can be rescheduled only once**"

⚠ **New business rule discovered: reschedule is limited to ONCE per booking.** This appears nowhere
else in the file and was not in the structural audit.

> ✅ **RULED (2026-08-14):** once a booking has been rescheduled, the **Reschedule option is not
> shown** — which is why no "already rescheduled" state is drawn on `47:*`. The client **must not
> infer eligibility**; it renders the backend's authoritative action/eligibility state. The
> "Reschedule for free" block here and on `104:2336` is therefore **conditionally rendered**. Closes
> **T-26**.

Then a lime promo block — "**Don't cancel, reschedule instead**" / "Reschedule your booking for free to
a new slot!" + lime **"Reschedule for free"** CTA — and a yellow **"Cancel"** CTA at the bottom.

- ✅ The "Reschedule for free" CTA now has a confirmed destination: the **cluster-B Reschedule screens**.
- ⚠ **The destructive action has no destructive styling.** "Cancel" is rendered in the same primary
  yellow as every positive CTA in the app (Get OTP, Confirm, Pay). Meanwhile the *non*-destructive
  "Reschedule for free" gets the brighter lime. Nothing visually signals irreversibility.
  → question **T-27**.
- Minor: the column header reads "FEE AS PERCENTAGE" but the first value is an absolute `₹0`.

### ✅ `104:2260` — Page 12b- Cancel reason — VERIFIED (batch 5)

`104-2260-page12b-cancel-reason.png`

Title: "**Why do you want to cancel?**". **Single-select radio buttons** (not multi-select).
"Ordered from food delivered apps" is shown selected.

**The analytics enum, verbatim and complete — 7 options:**

1. Something urgent came up
2. Ordered from food delivered apps
3. Family members cooked food
4. Arranged a cook from elsewhere
5. Booked by mistake
6. Did not like the assigned cook
7. Others

CTA: **"Continue"**.

- ⚠ **"Others" does not reveal a free-text field** in this design — so reason #7 captures nothing
  actionable. → question **T-28**.
- ⚠ **No disabled state for "Continue"** is drawn, so whether a reason is mandatory is unspecified.
- Note reason #6 ("Did not like the assigned cook") is a cook-quality signal that should route to the
  cook-rating pipeline, not just analytics.

### ✅ `104:2336` — Page 12c- Refund details — VERIFIED (batch 5)

`104-2336-page12c-refund-details.png`

**"Refund details"** card, three rows:

| Line | Value |
|---|---|
| Original Booking Paid | ₹135 |
| Cancellation Processing Fee | ₹0 |
| **Refund Amount** | **₹135** |

Below: 🛡 "**Refund to original payment source**" / "Takes 3-5 business days".

- ✅ **Refund method is forced, not a choice.** No wallet-vs-original toggle. Answers the open question.
- ✅ The 3–5 business day disclosure is present, and the lime "Reschedule for free" block **does** repeat
  here, above the same yellow "Cancel" CTA.
- The sample shows the **₹0-fee (>3 hrs) case only**. **No 25% or 50% variant is drawn**, so the layout
  for a non-zero fee — and whether the fee row turns red/emphasised — is unverified. → **T-29**.
- Sample-data inconsistency: ₹135 matches no price in the duration grid (₹69/99/129/189/259/319).

### ✅ `115:2703` — Page 12d- Cancel confirm — VERIFIED (batch 5)

`115-2703-page12d-cancel-confirm.png`

Terminal state: calendar icon with a yellow **✕** badge, "**Your booking has been cancelled**".
Repeats **Refund Amount ₹135** + "Refund to original payment source / Takes 3-5 business days".

Lime block: "**Would you like to make another booking?**" with two buttons —
**No** (white, outlined) and **Yes** (lime, filled).

- ✅ Refund amount **is** repeated for reassurance.
- **Destination decided (product):** "Yes" → **Scheduled flow**. "No" destination is still undrawn —
  presumably Home. → confirm as **T-3**.
- ⚠ **There is no "are you sure?" confirmation step.** Tapping "Cancel" on 12c commits the cancellation
  and lands here. Combined with the non-destructive styling noted in 12a, the flow can be completed
  with two taps of an ordinary-looking yellow button. Worth raising.

---

## History

### ✅ `6:227` — Page 14- Booking history — VERIFIED (batch 5)

`6-227-page14-booking-history.png`

Header: `←` + "**Past bookings**" (the frame name says "Booking history"; the UI says "Past bookings").

A flat list of 5 booking cards. Each card:

| Element | Sample |
|---|---|
| Card header | "12th April • 1 hr" *(card 1)* / "12th April • 1:15 PM" *(cards 2–5)* |
| Status pill (top-right) | **Completed** (lime) · **Unfulfilled** (yellow) |
| Cook | avatar + "Cook Rekha" |
| Time range | 12:30 PM - 01:45 PM |
| Price | ₹188 |
| Rating | 4.5 |

**Gaps — this screen is under-specified relative to what the audit anticipated:**

- ✅ **It is "Past bookings" only — and that is intentional. RULED (2026-08-14):** upcoming/active
  booking information lives **on Home**, via the active variant's COOK EN-ROUTE card. **Do not invent
  a separate Upcoming Bookings screen.** Closes **T-30**; Page 14 stays past-only.
- ⚠ **Status enum is `Completed` | `Unfulfilled` — there is no `Cancelled` status**, despite a complete
  cancellation flow existing. **Still open (T-31)** — and sharpened by the ruling above: a cancelled
  booking is neither active (so not on Home) nor `Completed`/`Unfulfilled` (so not in history). It
  currently has nowhere to appear.
- **No per-booking actions at all** — no Rebook, no Rate, no chevron, no tap affordance. The audit
  anticipated these; they are absent.
- **No filter chips, no search, no tabs, no date grouping** (all 5 samples are the same date).
- **No empty state** and no pagination / pull-to-refresh affordance.
- Inconsistency: card 1's header shows a **duration** ("1 hr") where cards 2–5 show a **start time**
  ("1:15 PM"). One pattern is wrong.
- "4.5" carries no star icon, so it is ambiguous whether it is the rating the *user gave* or the
  *cook's* overall rating.
- Sample price ₹188 vs ₹189 in the duration grid — off by one.

---

## Profile

### ✅ `6:663` — Page 15- Profile — VERIFIED (batch 6)

`6-663-page15-profile.png`

Header `←` + "**Profile**". Identity card: avatar, "**Aarav Mehta**", "+91 98765 00000".

**Navigation is a 2×2 tile grid**, not a settings list. Each tile has an icon, title, subtitle, chevron:

| Tile | Subtitle | Destination |
|---|---|---|
| **My orders** | View order history | → `6:227` Page 14 Past bookings |
| **Addresses** | View or add addresses | → `68:214` Page 16a Saved addresses |
| **My refunds** | View refund status | → `71:615` Page 18 Refunds |
| **Help** | Get immediate help | → **undesigned** |

Footer card: "Visit Live Website (spoonhelp.com)" ↗ · "Terms of Service & Privacy Policy" 🛡 ·
**"Log Out of Account"** rendered in **red on pink**.

- ✅ **There is no "Payment methods" entry — correct as drawn.** Combined with Page 6 turning out to be
  a meal brief, this was read as the app having no payment surface at all. **RULED (2026-08-14):**
  intentional — `Pay →` opens **Razorpay checkout directly**, so no Spoon payment-method management
  surface exists or is to be built. Closes **T-22**.
- ✅ **The design system does have a destructive treatment** — logout is red on pink. This makes the
  yellow "Cancel" button on 12a/12c a genuine inconsistency, not an absence of vocabulary.
  Strengthens **T-27**.
- **Help has no destination screen** anywhere in the file, yet a `Help 📞` pill appears in the header of
  the En route, Arrived, In service and all four Cancellation surfaces. → question **T-32**.
- T&C/privacy is linked **here** but not on Login, where consent is actually given (see **T-8**).
- No app-version footer; name and phone show **no edit affordance**.

---

## Refund

### ✅ `71:615` — Page 18- Refund history — VERIFIED (batch 6)

`71-615-page18-refund-history.png`

Header `←` + "**Refunds**". ✅ **A separate top-level screen reached from Profile → My refunds** — *not*
a tab or filter of Booking history. Answers the open navigation question.

Two cards, same card component as Page 14 with a different subtitle line and status enum:

| Status pill | Subtitle line | Amount |
|---|---|---|
| **Processing** (yellow) | "Refund expected by 15th Apr" | ₹188 |
| **Refunded** (lime) | "Refund completed on 15th Apr" | ₹188 |

- **No `Failed` state is designed**, though payment reversals do fail. → question **T-33**.
- **No per-row support-contact CTA** (the audit anticipated one) and **no empty state**.
- Card header still reads "12th April • 1:15 PM" and shows the cook — so refunds are presented
  per-booking. Reuse the Page 14 card as `BookingCard` with a `variant` prop.

---

## Component / reference frames

### ✅ `54:280` — "Icons" — VERIFIED (batch 6) — **not an icon set**

`54-280-icons-reference.png`

⚠ **This frame does not contain an icon library.** Metadata confirms **3 descendant nodes total**
(`Frame`, `Ellipse 2`, `cross`). Visually: a **back chevron `‹`** and a **close `✕`**, each in a
circular white button with a light grey border, floating in an otherwise empty 408×408 frame.

**The question "which icon set is the designer standardising on — Phosphor / Lucide / Material?"
cannot be answered from this frame.** It documents two nav-button styles, nothing more. The dozens of
icons actually used across the app (pin, clock, phone, calendar, sunrise, sun, moon, shield,
headphones, lightning, wallet, refresh) are **not catalogued anywhere in the file**.
→ question **T-34**: the icon library is still an open engineering choice.

### ✅ `94:905` — "Food icons" — VERIFIED (batch 6)

`94-905-food-icons-reference.png`

A single-column strip of **28 icon nodes** (~25 distinct — `Broccoli`, `Cauliflower` and `Sugar Cubes`
each appear twice). **Style: solid/filled monochrome black glyphs**, no outline variant.

Full inventory, from metadata:

> Banana Split · Beef Burger · Broccoli ×2 · Cauliflower ×2 · Coffee Beans · Cucumber · Dim Sum · Eggs ·
> Fish Food · Meat · Mushroom · Naan · Nachos · Noodles · Onion · Peas · Potato · Poultry Leg ·
> Rice Bowl · Samosa · Soup Plate · Sugar Cubes ×2 · Tomato · Wheat · Zucchini

- Each icon is a **separately named node**, so they are discrete assets and can be pulled individually
  via `download_assets`. Whether the underlying fills are vector or rasterised **cannot be determined
  from a render** — verify before choosing SVG vs PNG.
- ⚠ **The set does not cover the dishes actually shown in the app.** The "What Rekha cooks best?" grid
  needs *chicken biryani, fish curries, mutton curries, lauki variants, chola bhatura, chutney
  variants, pyaaz/gobi pakode, pav bhaji, momo variants* — of which only fish, meat/poultry and dim sum
  map cleanly. There is no biryani, bhatura, pav bhaji or chutney glyph. Either the grid reuses generic
  icons or assets are missing. → question **T-35**.
- The 3 duplicate names suggest accidental copies; de-duplicate before exporting.

### ✅ `119:2885` — "Frame 18" — VERIFIED (batch 6) — **the rating widget spec**

`119-2885-frame18-rating-widget.png`

**This is a state chart, not a screen.** Metadata: **257 nodes**, with each value label (`1`, `1.5`,
`2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5`) appearing **exactly 9 times** → a **9 × 9 matrix**: nine copies
of the scale, each showing a different value selected.

Top of frame: a lime **`5+`** badge beside the copy *"Reward the cook if the service exceeded your
expectations to keep them motivated!"* — the **tip prompt**, tied to the top of the scale.

**All three open questions answered:**

1. **Not stars.** The control is a horizontal row of **9 numeric pill/chip buttons**.
2. **Half-ratings ARE user-selectable** — the scale is `1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`
   (9 discrete values, 0.5 steps). It is an input, not a display.
3. **The selected chip's colour is a function of the value** — a gradient from **pale yellow at 1**,
   through **amber/yellow around 2.5–3.5**, to **bright lime at 4.5–5**. Unselected chips are white
   with a pale yellow border. Implement the fill as a lookup keyed by rating, not a single accent.

No hover/pressed/disabled states are drawn — only the 9 selected states.

### ✅ ALL 8 COOK CARDS VERIFIED (batches 7–8)

`81-448-cook-rekha-regular.png` · `81-710-cook-sanchita-regular.png` · `81-972-cook-barsha-regular.png` ·
`81-1234-cook-jyoti-regular.png` · `87-510-cook-rekha-pureveg.png` · `87-380-cook-sanchita-pureveg.png` ·
`87-250-cook-barsha-pureveg.png` · `87-120-cook-jyoti-pureveg.png`

**Result: the pure-veg product decision is confirmed by direct pixel comparison.** Pure veg is a
**dish-list filter on the same cook**, not a separate roster.

For every one of the 4 cooks, the regular and pure-veg cards are **identical in every respect except
the 3×3 specialty grid**: same photograph, same name, same gender/cuisine/home-state/language row, same
`Call Cook` CTA, same trust row (Spoon Trained · Background Verified · On-time), same card chrome and
layout. Nothing is added or removed structurally — only the nine dish chips change.

**→ Build one `CookCard`. The `pureVeg` flag filters `specialties`; it changes nothing else.**

#### Card anatomy (identical across all 8)

Photo · `Cook {name}` · 👤 gender · 👨‍🍳 cuisine · 🏠 home state · 💬 languages · lime `Call Cook`
CTA · divider · 👑 "What {name} cooks best?" · 3×3 grid of dish chips (black glyph in a white circle
above a yellow rounded label) · lime trust row.

#### Full data captured

| Cook | Cuisine | Home state | Languages |
|---|---|---|---|
| Rekha | North Indian | West Bengal | Hindi, Bengali |
| Sanchita | North Indian | Assam | Hindi, Assamese |
| Barsha | North Indian | **Odisha** (regular) / **Odiya** (pure veg) ⚠ | Hindi, Odiya |
| Jyoti | North Indian | Bihar | Hindi |

| Cook | Regular specialties | Pure-veg specialties |
|---|---|---|
| **Rekha** | Chicken biryani · Fish curries · Mutton curries · Lauki variants · Chola bhatura · Chutney variants · Pyaaz/gobi pakode · Pav bhaji · Momo variants | Chola bhatura · Pav bhaji · Baigan palak aloo · Lauki variants · Aloo beans · Chutney variants · Pyaaz/gobi pakode · Raita variants · Momo variants |
| **Sanchita** | Chicken curries · Mutton masala · Mustard fish · Egg/paneer bhurji · Egg masala curry · Palak paneer · Chicken tandoori · Chola bhatura · Momo variants | Veg biryani · Parathe · Chola bhatura · Mixed veg · Palak paneer · Litti chokha · Gobi manchurian · Arbi tuk · Momo variants |
| **Barsha** | Butter Chicken · Fish fry · Mustard fish · Mutton curry · Baigan bharta · Pav bhaji · Paneer tikka · Noodles · Chilli paneer | Baigan bharta · Palak paneer · Dal tadka · Gobhi capsicum · Butter Paneer · Bhindi masala · Paneer tikka · Pav bhaji · Puri aloo sabzi |
| **Jyoti** | Chicken curry · Mutton masala · Keema variants · Chicken biryani · Egg masala curry · Litti chokha · Samosa · Aloo tikki chaat · Namakpara/nimki | Matar paneer · Shahi paneer · Dry fry/tadka · Kheer/sewai · Paratha variants · Litti chokha · Samosa · Aloo tikki chaat · Namakpara/nimki |

**The grid is always exactly 9 dishes** — for every cook, in both variants. Treat 9 as a fixed display
cap and decide what happens when a cook has more or fewer.

**Egg is excluded from pure veg.** Sanchita's regular list carries "Egg/paneer bhurji" and "Egg masala
curry"; both are gone from her pure-veg list. Jyoti's "Egg masala curry" likewise. This is consistent
with **"Eggetarian" being a distinct dietary preference on Page 6** — so the diet filter is at least
three-valued (`veg` / `eggetarian` / `non-veg`), not a boolean. Scope `pureVeg` accordingly.

#### Defects found

- ⚠ **Copy bug on 6 of the 8 cards.** The heading reads "**What rekha cooks best?**" — lowercase, wrong
  name — on Sanchita, Barsha and Jyoti in **both** variants. Only Rekha's two cards read correctly
  ("What Rekha cooks best?"). All cards were evidently duplicated from Rekha's and the name was never
  updated. **The heading must be interpolated: `What {firstName} cooks best?`** → question **T-36**.
- ⚠ **Barsha's home state disagrees between her two cards**: `Odisha` on `81:972` vs `Odiya` on
  `87:250`. "Odiya" is the *language*, not the state, so the pure-veg card is wrong. Proof that the two
  sections were hand-maintained rather than driven from one source. → **T-37**.
- Minor spelling drift across cards: `Gobi manchurian` (Sanchita PV) vs `Gobhi capsicum` (Barsha PV);
  `Pyaaz/gobi pakode` (Rekha). Normalise dish names — they are catalogue keys.
- All four cooks are **Female / North Indian**, and all four show all three trust badges. Section U of
  the audit correctly warns the badges are conditional; **no card shows a partial badge state**, so the
  "some badges missing" layout is unverified.

---

# Cross-frame findings

Findings that span more than one frame and change a structural conclusion in
`FIGMA_USER_APP_AUDIT.md`.

## V-5 — `59:520` is a different Home design from `1:455`, not a crop — **CORRECTION** — ✅ **RULED**

> **Resolved 2026-08-14 (product ruling).** Reading **2 — two states** is correct: `1:455` is the
> normal/pre-booking Home, `59:520` is the post-booking/active-booking variant. Build **one
> state-driven `HomeScreen`**; do not implement them as unrelated routes; archive neither frame. The
> analysis below stands as the record of *why* this needed an answer — and note that the second half of
> reading 2 still applies: **the conflicting tile copy and the differing below-fold content must be
> reconciled.** Tracked as `FIGMA_FINAL_BLOCKERS.md` **D-20** (canonical tile copy) and **B-16** (does
> the active variant keep the below-fold marketing stack?).

The structural audit (section D, and section E "State/variant") classified `59:520` as the top-fold
viewport crop of `1:455` and recommended merging them into one scrolling `HomeScreen`. Both frames have
now been rendered at native resolution and compared. **They are different compositions.**

| | `1:455` (390×2014) | `59:520` (390×830) |
|---|---|---|
| Header | "⚡ Spoon in 18 mins", Home ▾, E102 Purva Skydale | **identical** |
| Promo carousel | **unpopulated placeholder** — three blank yellow rounded rects, no image, no text, no dots | **finished** — photo, "SPECIAL OFFER" pill, "Flat 50% OFF First Booking", subcopy, 4 dot indicators |
| Instant tile copy | "**Instant** / Get a cook in 18 mins" | "**Instant Cook** / 18 mins" |
| Schedule tile copy | "**Schedule** / Plan your meal" | "**SCHEDULE LATER** / Plan Next Meal" |
| Active booking | **absent** | **"COOK EN-ROUTE" card** — Ramesh Kumar, arriving in 18 mins, 60 mins, `→` |
| Body below tiles | "Cooks for every family and every need" → "Reasons to rely on Spoon cooks" (6 tiles) → "How to choose a duration?" table → "What's not included?" → "Spoon's promise" | Trust row: HOMELY / FRESH / TRUSTWORTHY |

The divergence is not truncation — the tile **copy differs**, the carousel is finished in one and empty
in the other, and `59:520` carries a module (`COOK EN-ROUTE`) that has no counterpart anywhere in
`1:455`'s 2014px. A crop cannot add content.

**Two readings, and they need different code:**

1. **Two iterations.** `59:520` is the newer home (finished banner art, tighter tile copy, trust row);
   `1:455` is the older long-form marketing home. → build one, archive the other.
2. **Two states.** `1:455` = home with no active booking; `59:520` = home with a booking in flight. →
   build one screen with a conditional en-route module *and* reconcile the conflicting tile copy and
   the differing below-fold content.

~~Reading 1 is more likely (copy changes and finished-vs-placeholder art track iteration, not state), but
this **cannot be settled from the pixels**~~ — **superseded: product ruled reading 2 (states).** The
pixel-level inference toward "iterations" was wrong; the differing tile copy and unfinished carousel
art are **defects within one design**, not evidence of two designs. **Do not delete either frame.**

The `1:455`-only "How to choose a duration?" table is a genuine content asset regardless — a
PEOPLE × DISH × TIME matrix (1–4 people / snacks-sides-roti / 30 mins, through 7–8 people /
4–5 complex dishes / 2.5 hrs) that maps directly onto the duration options in the booking flows.
