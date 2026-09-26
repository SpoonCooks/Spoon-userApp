# Figma User App Audit

**Status:**
- STRUCTURAL_AUDIT: COMPLETE
- **VISUAL_AUDIT: COMPLETE** — 50 / 50 frames (was PARTIAL at 12/50)
- **IMPLEMENTATION_READY: PARTIAL** — **product rulings on 2026-08-14 closed the two hard blockers**
  (payment T-22, Home T-18) plus T-26, T-11, T-30 and T-8. **Foundation implementation is cleared to
  begin**; four screen-level blockers remain (T-20, T-24, T-13, and the `DESIGN_PENDING` OTP screen).
  See section T (closed / open) and section W for the rulings as written.
- Designer/founder-facing summary: **`docs/FIGMA_FINAL_BLOCKERS.md`**.

**File:** **`BTPW14a7M69ySPZxdkc2yn`** (`V0_-user-app`) — an imported copy.
Supersedes `XMNpmq1fShR87GkLJhLGjW`, which is no longer used.
**Page:** `0:1 User App` (the only top-level page in the file — no "Cook App" page exists here)
**Date compiled:** 2026-08-14 · **Visual audit completed:** 2026-08-14

**Node IDs are unchanged by the import.** Verified, not assumed: 41/41 depth-1 children and 12/12
section children match the previous inventory on ID, name, x, y, width and height. Every node ID in
this document is valid in the new file. Only the file key changed.

**Design tokens:** extracted separately to `docs/FIGMA_DESIGN_TOKENS.md`.

---

## 0. What was read

- Full XML metadata for the User App canvas (`0:1`, 830 KB) — re-pulled from the new file.
- Full metadata for all 3 Figma Sections (`Cook profiles`, `Cook profiles- pure veg`, `Cancellation flow`).
- **Rendered screenshots for all 50 frames.** 11 were captured in the earlier session; `3:1848` was
  verified manually outside the MCP (section U); the remaining **38 were captured in 8 batches** on
  2026-08-14 against the new file. PNGs are in `.figma-audit/screens/` (49 files — `3:1848` has no
  MCP-rendered PNG).
- Design-variable definitions via `get_variable_defs`. Note: the tool **rejects a page node** as a
  target, so it was retargeted at `1:455`; the extracted set is therefore Home's token usage, not a
  guaranteed-complete file inventory. Details and caveats in `docs/FIGMA_DESIGN_TOKENS.md`.
- **Render-resolution limit:** `get_screenshot`'s `maxDimension` caps but never upscales. A 390×830
  frame renders at **466×906** and no larger. Sufficient for layout, copy and component identification;
  **not** sufficient for sub-pixel spacing measurement. Any spacing figure in this document is
  approximate unless it came from metadata.
- **Comments/annotations:** still not read — the available Figma MCP surface exposes `get_metadata`, `get_design_context`, `get_screenshot`, `get_figjam`, `get_variable_defs`, `get_libraries`, Code Connect tools, and Weave, but **no `get_comments` / `list_annotations` tool**. See section Q.

---

## A. Canvas inventory (depth-1 children of `0:1 User App`)

| # | Kind | ID | Name | x | y | w×h | Classification |
|---|------|----|----|----|----|-----|-----------------|
| 1 | frame | `71:747` | Page 1- loading others | 3253 | -3762 | 390×830 | Onboarding / brand intro |
| 2 | frame | `73:1036` | Page 1- loading landing | 3790 | -3762 | 390×830 | App-boot splash |
| 3 | frame | `1:455` | Page 3- home page | 3058 | -2439 | 390×**2014** | Scrollable home (long) |
| 4 | frame | `59:520` | Page 3- home page | 3790 | -2439 | 390×830 | Home viewport variant (top-fold only) |
| 5 | frame | `1:728` | Page 4a- Instant- available | -261 | -1128 | 390×830 | Instant duration **bottom sheet** over Home |
| 6 | frame | `25:1585` | Page 4b- Instant taxes pop up | -868 | -1128 | 390×830 | **Modal dialog** over 4a |
| 7 | frame | `25:1327` | Page 4c- Instant- NA out of shift | 346 | -1128 | 390×830 | Instant empty-state (out-of-hours) |
| 8 | frame | `44:5378` | Page 4c- Instant- No slots | 992 | -1128 | 390×830 | Instant empty-state (no slots) |
| 9 | frame | `37:4183` | Page 5b- Scheduled day | 5724 | -1128 | 390×891 | Scheduled step 1 (cluster A) |
| 10 | frame | `37:3943` | Page 5b- Scheduled time | 6331 | -1128 | 390×891 | Scheduled step 2 (cluster A) |
| 11 | frame | `37:3703` | Page 5b- Scheduled duration | 6938 | -1128 | 390×891 | Scheduled step 3 (cluster A) |
| 12 | frame | `34:3035` | Page 5b- Scheduled morning | 7545 | -1128 | 390×891 | Scheduled meal-slot variant (cluster A) |
| 13 | frame | `34:1919` | Page 5b- Scheduled noon | 7545 | -74 | 390×840 | Scheduled meal-slot variant (cluster A) |
| 14 | frame | `34:2105` | Page 5c- Scheduled eve | 7545 | 929 | 390×830 | Scheduled meal-slot variant (cluster A) |
| 15 | frame | `47:6549` | Page 5b- Scheduled day | 736 | 3329 | 390×891 | Scheduled step 1 (cluster B — duplicate) |
| 16 | frame | `47:6450` | Page 5b- Scheduled time | 1343 | 3329 | 390×891 | Scheduled step 2 (cluster B — duplicate) |
| 17 | frame | `47:6059` | Page 5c- Scheduled morning | 1950 | 3329 | 390×891 | Scheduled variant (cluster B) |
| 18 | frame | `47:5844` | Page 5b- Scheduled noon | 1950 | 4401 | 390×840 | Scheduled variant (cluster B) |
| 19 | frame | `47:5638` | Page 5c- Scheduled eve | 1950 | 5453 | 390×830 | Scheduled variant (cluster B) |
| 20 | frame | `3:684` | Page 6- service brief | 1866 | 135 | 390×830 | Pre-book review |
| 21 | frame | `3:1041` | Page 7- Confirmation | 2462 | 135 | 390×**1019** | Booking confirmed (scrollable) |
| 22 | frame | `3:1381` | Page 8a- En route on time | 3058 | 135 | 390×882 | En-route (happy path) |
| 23 | frame | `99:1413` | Page 8b- En route late | 3058 | 1191 | 390×882 | En-route (late variant) |
| 24 | frame | `3:1658` | Page 9- Arrived | 3654 | 135 | 390×**1002** | Arrival + Start OTP |
| 25 | frame | `3:1848` | Page 10- Countdown | 4780 | 135 | 390×830 | **MANUALLY_VISUALLY_VERIFIED** — despite the name, this is a *live in-service* screen, not a transition. Top-fold variant of `101:1812`. See section U |
| 26 | frame | `101:1812` | Page 10- In service | 4217 | 135 | 390×**1236** | Live-cooking session (scrollable) |
| 27 | frame | `3:2002` | Page 11- Extension | 4730 | 135 | 390×892 | **Bottom sheet** over In service |
| 28 | frame | `143:207` | Page 11- Completion | 6204 | 135 | 390×879 | Rate + tip after End OTP |
| 29 | frame | `6:227` | Page 14- Booking history | 182 | 135 | 390×830 | Auxiliary |
| 30 | frame | `6:663` | Page 15- Profile | -868 | 135 | 390×830 | Auxiliary |
| 31 | frame | `68:214` | Page 16a- Address location | -343 | 135 | 390×830 | Address flow step 1 |
| 32 | frame | `53:31` | Page 16b- Address location | -343 | 1118 | 390×830 | Address flow step 2 |
| 33 | frame | `60:655` | Page 16c- Address full | -343 | 2172 | 390×830 | Address flow step 3 |
| 34 | frame | `53:174` | Page 17- Login | -1529 | 135 | 390×830 | Auth |
| 35 | frame | `71:615` | Page 18- Refund history | 707 | 135 | 390×830 | Auxiliary |
| 36 | frame | `54:280` | Icons | -2208 | -6 | 408×408 | **Design reference** (not a screen) |
| 37 | frame | `94:905` | Food icons | 11724 | 4025 | 100×729 | **Design reference** (not a screen) |
| 38 | frame | `119:2885` | Frame 18 (Rating) | 5806 | 292 | 358×567 | **Reusable component reference** — 1–5 rating widget consumed by Page 11 Completion |
| 39 | section | `81:447` | Cook profiles | 10541 | 4042 | 480×2415 | Section |
| 40 | section | `87:119` | Cook profiles- pure veg | 11182 | 4042 | 480×2415 | Section |
| 41 | section | `115:2821` | Cancellation flow | -868 | -2758 | 2119×1149 | Section |

**Total top-level items: 41** (35 Page screens + 3 design-reference frames + 3 Sections).

### Cook-profile card frames (children of the Cook-profile sections)

| Section | Card | ID |
|---|---|---|
| Cook profiles (`81:447`) | Rekha | `81:448` |
| Cook profiles (`81:447`) | Sanchita | `81:710` |
| Cook profiles (`81:447`) | Barsha | `81:972` |
| Cook profiles (`81:447`) | Jyoti | `81:1234` |
| Cook profiles- pure veg (`87:119`) | Rekha | `87:510` |
| Cook profiles- pure veg (`87:119`) | Sanchita | `87:380` |
| Cook profiles- pure veg (`87:119`) | Barsha | `87:250` |
| Cook profiles- pure veg (`87:119`) | Jyoti | `87:120` |

### Cancellation-section screen frames

| Card | ID |
|---|---|
| Page 12a Cancel policy | `6:2` |
| Page 12b Cancel reason | `104:2260` |
| Page 12c Refund details | `104:2336` |
| Page 12d Cancel confirm | `115:2703` |

---

## B. Reconstructed flows (from spatial ordering + visual confirmation)

**Boot / onboarding row (y ≈ -3762):**
Splash `71:747`/`73:1036` → Home.

**Home (y ≈ -2439):** **one route, two booking-state variants** (product ruling 2026-08-14, § W R-2).
`1:455` (tall, scrollable) is the **normal / pre-booking Home** — hero, book tiles, cook cards, duration
matrix, non-inclusions, favourites. `59:520` is the **post-booking / active-booking variant** — booking
ETA/status, Instant Cook, Schedule Later, the **COOK EN-ROUTE** card, assigned cook, arrival ETA and
booking duration (all dynamic backend data). **Not two routes, and neither frame is archived.**

**Instant flow (y ≈ -1128, x -868 → 992):**
Home → tap Instant → **bottom sheet 4a (Instant available)** → optional **modal 4b (taxes)** OR empty-states 4c (out-of-shift / no slots) → Book Now → Page 6 service brief → Page 7 Confirmation.

**Scheduled flow — cluster A (right side, y ≈ -1128 to 929):**
Day (`37:4183`) → Time (`37:3943`) → Duration (`37:3703`) → meal-slot variants Morning/Noon/Eve (`34:3035`/`34:1919`/`34:2105`) → Page 6 service brief → Page 7 Confirmation.

**Scheduled flow — cluster B (bottom, y ≈ 3329 to 5453):**
Day (`47:6549`) → Time (`47:6450`) → Morning/Noon/Eve (`47:6059`/`47:5844`/`47:5638`). **Duplicates of cluster A with the same names.** Without designer confirmation, this is either (a) an older/newer iteration left on the canvas, or (b) the Reschedule flow (Page 12a offers "Reschedule for free" — that CTA needs a destination). Flag for the designer.

**Booking-lifecycle row (y ≈ 135):**
Login (`53:174`) → Address 16a → 16b → 16c → Home → Booking history (`6:227`) → Refund history (`71:615`) → Service brief (`3:684`) → Confirmation (`3:1041`) → En route on time (`3:1381`) → Arrived (`3:1658`) with Start OTP → **In service** (`101:1812`, top-fold `3:1848`) → Extension **bottom sheet** (`3:2002`) → Completion (`143:207`) with rating + tip.

**Correction (2026-08-14):** this row previously read `Arrived → Countdown (3:1848) → In service`. Manual verification of `3:1848` removed that intermediate step — it is the same screen as In service. **Consequence: nothing is designed for the moment between a correct Start OTP and the live session appearing.** That transition needs either a loading state or an instant swap; the file specifies neither. Added as designer question T-4.
En route late (`99:1413` at y=1191) is a **state variant** of 8a, not a separate destination.

**Cancellation flow (Section `115:2821`):**
Page 12a Cancel policy → 12b Cancel reason → 12c Refund details → 12d Cancel confirm. Same "Reschedule for free" reroute appears on 12a and 12c.

**Cook profiles (Sections `81:447` and `87:119`):**
Each contains 4 cook cards — Rekha, Sanchita, Barsha, Jyoti (same names in identical y-slots in both sections). The two sections differ by dietary variant (regular vs pure-veg). These look like source-of-truth cook-card component variants used inside Home / Service brief / Confirmation / En route / Arrived / In service / Completion.

---

## C. Missing "Page N" numbers

Used: 1, 3, 4a-c, 5b-c, 6, 7, 8a-b, 9, 10, 11, 12a-d, 14, 15, 16a-c, 17, 18.
**Absent: 2, 5a, 8c, 13.** No screen with those numbers exists on this page. Likely renamed / deleted / never drawn. Flag for the designer.

---

## D. Duplicate-looking frames explained

**Updated 2026-08-14 after visual verification.** Two rows in this table were wrong.

| Frame A | Frame B | What's actually different | Recommendation |
|---|---|---|---|
| `1:455` Page 3 home 2014h | `59:520` Page 3 home 830h | ⚠ **NOT height only — the original row was wrong.** Verified: the promo carousel is an *empty placeholder* in `1:455` and *finished artwork* in `59:520`; the Instant/Schedule tile copy **differs**; and `59:520` carries a **"COOK EN-ROUTE" active-booking card that appears nowhere in `1:455`'s 2014px**. A crop cannot add content. | ✅ **RESOLVED (product ruling, § W R-2): booking-state variants of ONE Home.** `1:455` = pre-booking, `59:520` = active booking. **Build one state-driven `HomeScreen`; do not implement as unrelated routes; keep both frames.** The conflicting tile copy is now a **copy defect** needing one canonical pair (`FIGMA_FINAL_BLOCKERS.md` D-20) |
| Scheduled cluster A (5 frames) | Scheduled cluster B (5 frames) | ✅ **Resolved — cluster B is the Reschedule flow.** Verified visually: `47:*` headers read **"Reschedule"** and the bottom bar reads **"Reschedule"** (no price) vs **"Book Now • ₹129"**. Cluster B additionally has **no Duration step**. | **One screen with a `mode: 'book' \| 'reschedule'` prop.** Do not delete cluster B. |
| Cook profiles `81:447` | Cook profiles- pure veg `87:119` | ✅ **Confirmed by pixel comparison.** For all 4 cooks the two cards are identical except the 3×3 specialty grid — same photo, name, cuisine, state, languages, CTA, trust row. | **Single `CookCard`; `pureVeg` filters `specialties` only.** Note the diet axis is 3-valued (veg / eggetarian / non-veg), not boolean |
| `3:1381` En route on time | `99:1413` En route late | ✅ **Confirmed — exactly two changes:** banner fill lime→yellow, and body copy "The cook will reach your location on time!" → "We're sorry for the delay, the cook is running late". No new controls. | **Single screen with variant prop** |
| `101:1812` Page 10 In service 1236h | `3:1848` Page 10 Countdown 830h | Height only, as far as the verified content shows — both carry the countdown, Extend Time, End Service, End OTP, cook profile, Call Cook, specialties grid and "Note before starting". Same `Page 10-` prefix | **Merge** into one `InServiceScreen` with a ScrollView. Same treatment as the Page 3 home pair above. Confirm with designer before deleting either frame |

---

## E. Classification per frame

**Updated 2026-08-14 after visual verification.** Three groups moved.

| Classification | Frames |
|---|---|
| **Logical screen** | Page 1 (both), **Page 3 — ONE screen with two booking-state variants (resolved, § W R-2)**, Page 6 *(a meal-brief form, not a payment review — see V-2)*, Page 7, Page 8a, Page 9, Page 10 In service, Page 11 Completion, Page 14, Page 15, Pages 16a/b/c, Page 17, Page 18 |
| **One screen, progressive disclosure** | ⚠ **New.** The six cluster-A Scheduled frames (`37:4183` Day, `37:3943` Time, `37:3703` Duration, `34:3035` Morning, `34:1919` Noon, `34:2105` Eve) are **states of a single screen** that reveals Day → Time → Duration → Start time. Likewise the five cluster-B frames as **Reschedule** (Day → Time → Start time; no Duration). **11 frames → 1 screen with a `mode` prop.** |
| **Bottom-sheet stack** | ⚠ **New — Pages 12a–d moved here from "Logical screen".** All four render as a sheet over a dark scrim sharing one `← Cancel booking + Help` header. **One `CancelBookingSheet` with four steps.** |
| **State/variant of another screen** | `99:1413` (En route late), **`3:1848` Page 10 Countdown** (top-fold of In service `101:1812` — see section U), `25:1327` + `44:5378` (**blocked-states of the Instant sheet, not screens** — each is `1:728` blurred with an icon + message overlay) |
| **State/variant — resolved** | `59:520` — the **active-booking state variant of Home**, not a top-fold crop and not a separate screen. Settled by product ruling § W R-2. |
| **Full-screen transitional state** | Page 1 loading landing (splash), Page 1 loading others (brand intro) |
| **Bottom sheet** | Page 4a Instant available, Page 11 Extension |
| **Modal dialog** | Page 4b Instant taxes pop up (over 4a) |
| **Reusable component reference** | Frame 18 Rating widget (`119:2885`), Cook profile cards inside both Cook-profiles sections |
| **Design reference / not a screen** | Icons `54:280`, Food icons `94:905` |
| **Flow-duplicate candidate** | Scheduled cluster B (5 frames) |
| **Section heading** | Cook profiles, Cook profiles- pure veg, Cancellation flow |

---

## P. Figma section / heading map

The **only** grouping devices used on this canvas are Figma Sections (3 of them). There are no top-level text nodes, arrows, or connectors — the rest of the canvas is organised **purely spatially**, not by heading.

| Heading | Node ID | Kind | Frames contained | Intended flow | Related feature |
|---|---|---|---|---|---|
| Cook profiles | `81:447` | Section | `81:1234` Jyoti, `81:972` Barsha, `81:710` Sanchita, `81:448` Rekha | Cook-card component library (regular) | Cards embedded in Home, Service brief, Confirmation, En route, Arrived, In service, Completion |
| Cook profiles- pure veg | `87:119` | Section | `87:120` Jyoti, `87:250` Barsha, `87:380` Sanchita, `87:510` Rekha | Cook-card component library (pure-veg variant) | Same as above with `pureVeg` state |
| Cancellation flow | `115:2821` | Section | `6:2` Page 12a Cancel policy, `104:2260` Page 12b Cancel reason, `104:2336` Page 12c Refund details, `115:2703` Page 12d Cancel confirm | Booking cancellation | Reachable from Confirmation / En route / Arrived (Cancel button) |

Everything outside these 3 sections is grouped only by canvas coordinates — the sections named after concepts like "Instant flow", "Scheduled flow", "Booking lifecycle" that would normally frame these clusters **do not exist** as Figma Sections in this file. Any grouping described in section B above was reconstructed from x/y positions and Page-number prefixes, not from designer-authored headings.

---

## Q. Comments and annotations

**Figma comments were not exposed by the available MCP tools and therefore could not be independently audited.** The Figma MCP surface bound to this session includes: `get_metadata`, `get_design_context`, `get_screenshot`, `get_figjam`, `get_variable_defs`, `get_libraries`, `download_assets`, `search_design_system`, Code Connect tooling (`get_code_connect_map`, `add_code_connect_map`, `list_file_components_for_code_connect`, `get_code_connect_suggestions`, `get_context_for_code_connect`, `send_code_connect_mappings`), shader tools, Weave tools, and design/generation write tools. **No `get_comments`, `list_comments`, `list_annotations`, or equivalent tool is present.** Component descriptions and developer notes are exposed only where they surface inside the XML metadata as node attributes — none were observed on this canvas.

The only in-canvas text that behaves like designer commentary is copy embedded inside the screens themselves (e.g. the "Extend booking" screen's two info notes, and Page 12a's cancellation-fee schedule). Those are product content, not designer annotations, so they have been treated as spec, not context.

To audit real Figma comments, either (a) add a comments-capable MCP tool, or (b) share a URL/export of the Figma comment thread.

---

## R. Loading and transitional-state inventory

| State | Figma node | Parent logical screen | Trigger | Expected exit | Full-screen vs overlay | Reusable component opportunity |
|---|---|---|---|---|---|---|
| App-boot splash | `73:1036` Page 1 loading landing | (root) | App launch | Auth resolved → Login (17) or Home (3) | Full-screen | `SplashScreen` — reuse for warm starts |
| Brand intro / onboarding | `71:747` Page 1 loading others | (root) | First-run after splash | Home (3) or Login (17) | Full-screen | `OnboardingIntro` — one-shot; guard with a "seen" flag |
| Instant duration bottom sheet | `1:728` Page 4a Instant available | Home (3) | Tap **Instant** tile | Book Now → Page 6, OR dismiss | **Overlay (bottom sheet)** | `InstantSheet` using a bottom-sheet component |
| Taxes info modal | `25:1585` Page 4b Instant taxes pop up | Instant sheet 4a | Tap "Check payment details" | Dismiss → back to 4a | **Overlay (dialog)** | Generic `InfoDialog` |
| Instant empty state — out of shift | `25:1327` Page 4c NA out of shift | Instant sheet 4a | Tap **Instant** outside serving hours | Dismiss; user can pick Scheduled | Overlay (same sheet surface, empty variant) | State inside `InstantSheet` |
| Instant empty state — no slots | `44:5378` Page 4c No slots | Instant sheet 4a | All slots taken | Dismiss / switch to Scheduled | Overlay (same sheet, empty variant) | State inside `InstantSheet` |
| ~~Countdown~~ **(retracted)** | `3:1848` Page 10 Countdown | — | — | — | — | **No `CountdownScreen` component.** Manual verification showed this frame is a live in-service surface with Extend Time, End Service and End OTP controls — not a short-lived auto-advancing transition. The remaining-time countdown is a *timer element inside* the In service screen, not a screen of its own. See section U |
| Extension bottom sheet | `3:2002` Page 11 Extension | In service (10) | Tap **Extend Time** | Confirm → back to In service with new timer, OR "Book NOW" fallback | **Overlay (bottom sheet)** | `ExtendBookingSheet` |
| **Home — active-booking state** | `59:520` Page 3 (830h) | Home (3) | A booking is live (en route / in service) | Booking completes or is cancelled → Home returns to the `1:455` pre-booking variant | Not an overlay — a variant of the Home route | **Implement as a state-driven variant of `HomeScreen`**, with the COOK EN-ROUTE card rendered from an active-booking query. ETA, cook name and duration are dynamic (§ W R-2) |

Beyond those, **no skeleton screens, spinners, or per-tile loading placeholders were designed** on this page. That's a **gap worth flagging to the designer**: real network calls (address lookup, cook assignment, payment processing, OTP verification, extension pricing, refund calculation) will all need loading UX, and none is drawn.

---

## S. Coverage verification

- **Total major top-level items on User App canvas:** 41 (35 Page frames + 3 design-reference frames + 3 Sections).
- **Items structurally inspected via metadata:** 41 / 41.
- **Total frames requiring visual inspection:** 50 — 35 depth-1 Page frames + 4 Cancellation-section frames + 3 design-reference frames + 8 cook-profile cards.
- **Items visually inspected: 50 / 50 (100%).** ✅ 11 in the earlier session + 1 manual (`3:1848`) + **38 in 8 batches on 2026-08-14**.
- **Rate limit: resolved.** The audit moved to the imported file in a **student-tier, Full-seat** account. All 38 screenshots succeeded; **zero failures, zero rate-limit errors**. The earlier block was the Starter plan's tool-call quota, not a node or permission problem.
- **`docs/FIGMA_EXPORT_REQUEST.md` is obsolete** — the designer does not need to hand-export anything. It is retained only for the product questions it raises.
- **Resolved caveat:** the earlier note that Page 10 Countdown (`3:1848`) might be a broken node is **withdrawn**. The 1×1 render was an MCP rendering limitation; the Figma node is intact. See section U.
- **Remaining limits on this audit** — what "complete" does *not* mean:
  - Rendering caps at ~1.19× (466×906 for a 390×830 frame), so **exact spacing/typography values were not measured from pixels**; use metadata or the design file for those.
  - **Figma comments and annotations remain unread** (no MCP tool exposes them — section Q). Designer intent recorded in comments is still invisible to this audit.
  - The token extraction is **scoped to `1:455`'s usage**, not the file's full variable collection.
  - Several screens have **only one sample state drawn** (e.g. Refund details shows only the ₹0-fee case), so sibling states are inferred, not verified.

---

## T. Designer / product questions

Rewritten 2026-08-14 after the visual audit. **T-1, T-6 are closed by verification; T-3 is closed by a
product decision.** T-7 onward were new, raised by frames seen for the first time.
**Updated 2026-08-14 (later the same day): product rulings closed T-22, T-18, T-26, T-11, T-30 and
T-8.** The rulings are recorded verbatim in **section W**; the designer-facing version is
`docs/FIGMA_FINAL_BLOCKERS.md`.

### Closed

| # | Question | Resolution |
|---|---|---|
| T-1 | Is Scheduled cluster B a duplicate or the Reschedule flow? | ✅ **Reschedule.** Verified — `47:*` headers and bottom bars read "Reschedule". Build as a `mode` prop, don't delete. |
| T-3 | Where does Page 12d "Yes" go? | ✅ **Product decision: the Scheduled flow.** ("No" destination still undrawn — presumed Home.) |
| T-6 | Same 4 cook names in both sections — one roster or two? | ✅ **One roster.** Cards are identical except the specialty grid. `pureVeg` filters dishes only. |
| **T-22** | **Where does payment happen?** | ✅ **RULING (§ W R-1): there is no separate Spoon payment screen.** `Pay →` opens **Razorpay checkout directly**. **Do not invent a payment-method or payment-review screen.** Payment verification and authoritative booking/payment state are **backend-owned** — the client refetches state after checkout and never infers success. |
| **T-18** | **Is Home one screen or two?** | ✅ **RULING (§ W R-2): one logical Home with booking-state variants.** `1:455` = normal/pre-booking; `59:520` = post-booking/active-booking (booking ETA/status, Instant Cook, Schedule Later, COOK EN-ROUTE card, assigned cook, arrival ETA, duration — all dynamic). **Model as state-driven variants, not unrelated routes.** |
| **T-26** | What happens after a booking's one reschedule is used? | ✅ **RULING (§ W R-3): the Reschedule option is not shown.** No disabled state, no submit-time error. **The client must not infer eligibility** where the backend exposes authoritative action/eligibility state. |
| **T-11** | Address rejected by the serviceability check | ✅ **RULING (§ W R-4): the existing map/address flow handles it** — the map step displays that the area is outside the serviceable area. **Do not invent a separate failure flow.** |
| **T-30** | Where does a user find an upcoming booking? | ✅ **RULING (§ W R-5): on Home**, via the active Home variant's COOK EN-ROUTE card. **Do not invent an Upcoming Bookings screen** absent an explicit requirement. ⚠ Does **not** cover T-31 (cancelled bookings), which stays open. |
| **T-8** | No T&C / privacy link on Login | ✅ **RULING (§ W R-6): T&C / Privacy are available from Profile. Do not invent additional legal UI beyond the approved design.** Login ships as drawn. |
| — | Is the OTP screen missing? | ✅ **`DESIGN_PENDING`** by product decision. Login's CTA is "GET OTP →", confirming a follow-up screen is intended. **Do not invent it.** Still blocks auth — see below. |
| — | Are the two Page 1 loading frames real states? | ✅ **Yes**, valid designed loading states (product decision). |
| — | Is `3:1848` broken? | ✅ **No** — MCP rendering limitation. Manually verified. Section U. |

### Open — blocking

Four remain, all **screen-level**. None blocks the foundation work in `FRONTEND_FOUNDATION_PLAN.md` § 21.

| # | Question | Why it blocks |
|---|---|---|
| **—** | **The OTP entry screen is `DESIGN_PENDING`.** Login also has no error-state region (invalid number, send failure, rate limit). | Auth cannot be built end-to-end, and auth gates every other flow. Do not invent it. |
| **T-20** | **Does rescheduling ever charge?** The Reschedule bar shows no price but still shows `Pay →` — which, per R-1, now means "open Razorpay" for an unspecified amount. | Decides whether the reschedule submit path touches payment at all. Two different code paths and two different backend contracts. |
| **T-24** | **Neither En route screen has a Cancel control.** The fully designed cancellation sheet has no verified entry point from any live-booking screen. | A complete flow with no door. Also interacts with T-32 (`Help` has no destination). |
| **T-13** | **Is the 3-day Day row the real booking horizon?** No scroll affordance, no calendar fallback, no disabled-day treatment. | Decides the day-selector component shape on both Schedule and Reschedule, and what the backend must expose. |

### Open — non-blocking but needed before the relevant screen is built

**T-13, T-20 and T-24 were promoted to the blocking table above** and are no longer listed here.
**T-18 and T-30 were closed** by the 2026-08-14 rulings; T-31 was *not*.

| # | Question |
|---|---|
| T-2 | Are Pages 2, 5a, 8c, 13 intentionally absent, or missing? *(unchanged)* |
| T-4 | (a) Does `3:1848` diverge from `101:1812` below the fold? (b) Rename the misleading "Countdown" frame? (c) **Nothing is designed between a correct Start OTP on Page 9 and the live In-service screen.** |
| T-5 | Loading/skeleton states are absent everywhere. Coming, or spec generic ones during build? |
| T-7 | Login's `USER TYPE: [RETURNING USER]` row — prototype-only toggle, or production UI? |
| T-9 | Saved-addresses rows have no edit/delete/default affordance and **no empty state** — which every new user hits immediately. |
| T-10 | Page 16c introduces **"Receiver's details" (name + phone)**, distinct from the account holder. Confirm this joins the booking model. |
| T-12 | The Instant blocked-state "Schedule" CTA is **yellow on `25:1327` but lime on `44:5378`**. Intentional? |
| T-15 | Duration tiles show struck-through prices at a flat ~55% off. Permanent, or tied to the first-booking promo? |
| T-16 | **Price desync:** 1.5 hr (₹189) is selected but the bottom bar reads ₹129 — and read ₹129 before any duration was chosen. |
| T-17 | The secondary CTA is labelled **"Share your requests →"** on 4 frames and **"Add Custom Meal Brief →"** on 4 others. Confirmed to open Page 6. Which label is canonical? |
| T-19 | **Both Evening start-time grids contain stale afternoon times** (`12:30 PM · 12:45 PM · 01:30 PM · 01:45 PM` inside a 5–9 PM grid). Present in `34:2105` and `47:5638`. |
| T-21 | **Reschedule cannot change duration** (no Duration section on any `47:*` frame). Intentional? It forces cancel-and-rebook for a duration change. |
| T-23 | Page 6's primary CTA is **clipped by the frame bottom** — its label is unreadable. |
| T-25 | Morning start-time grid is missing **`06:15 AM`** and shows **`06:30 AM` twice**. Confirmed in both clusters. |
| T-27 | **The destructive "Cancel" button uses the same primary yellow as every positive CTA**, while the *non*-destructive "Reschedule for free" gets brighter lime. Logout proves a red destructive style exists. Also: there is **no "are you sure?" step** before cancellation commits. |
| T-28 | Cancel reason **"Others" reveals no free-text field**, so it captures nothing actionable. Is "Continue" gated on picking a reason? |
| T-29 | Refund details is drawn **only for the ₹0-fee case**. What does the 25% / 50% variant look like? |
| T-31 | Booking status enum is `Completed \| Unfulfilled` — **no `Cancelled`**, despite a full cancellation flow. Where do cancelled bookings appear? ⚠ **Left open by the T-30 ruling:** active bookings now live on Home, but a cancelled booking is neither active nor `Completed`/`Unfulfilled`, so it falls off both Home and history. |
| T-32 | **`Help` has no destination screen**, yet a Help pill appears on En route, Arrived, In service and all four Cancellation surfaces. |
| T-33 | Refund status enum is `Processing \| Refunded` — **no `Failed`** state. |
| T-34 | The "Icons" frame (`54:280`) contains **only a back chevron and a close ✕** — it is not an icon set. The icon library is still an open engineering choice. |
| T-35 | The Food-icons set (~25 glyphs) **does not cover the dishes shown in the app** — no biryani, bhatura, pav bhaji or chutney glyph. Also contains 3 duplicates. |
| T-36 | **Copy bug on 6 of 8 cook cards:** the heading reads "What **rekha** cooks best?" on Sanchita, Barsha and Jyoti. Must interpolate the cook's name. |
| T-37 | **Barsha's home state disagrees between her two cards** — `Odisha` vs `Odiya`. |

---

## U. Manual visual verification — `3:1848` Page 10 Countdown

**Status: MANUALLY_VISUALLY_VERIFIED** (2026-08-14, verified outside the MCP by a human reviewer).

**The node is not broken.** The 1×1-pixel result returned on both `get_screenshot` attempts was an **MCP rendering limitation**, not a defect in the Figma node and not a permissions problem. Any `MANUAL_EXPORT_REQUIRED` or `DESIGN_BROKEN` concern previously attached to this node is **withdrawn** — it does not need re-exporting or recreating by the designer.

### Verified content

| # | Element | Notes |
|---|---|---|
| 1 | Header — home/address + Help | Matches the header used across the booking-lifecycle screens |
| 2 | Active service status — "Cook *(name)* is cooking" | Live session state |
| 3 | Remaining-time countdown | **Dynamic** — see data note below |
| 4 | Cooking-in-progress messaging | |
| 5 | Cook / service illustration | |
| 6 | **Extend Time** CTA | Opens Extension bottom sheet `3:2002` |
| 7 | **End Service** CTA | |
| 8 | End OTP section | **Dynamic** |
| 9 | Assigned cook profile | Consumes the cook-card component (`81:*` / `87:*`) |
| 10 | Call Cook CTA | |
| 11 | Cook details / preferences | |
| 12 | "What *(name)* cooks best?" specialties grid | **Dynamic** |
| 13 | Spoon Trained / Background Verified / On-time indicators | Trust badges |
| 14 | "Note before starting" informational card | Referenced by Page 8a's gate/security instructions |

### Reclassification

The frame is **named** "Countdown" but its content is a **live in-service surface**. A transitional, auto-advancing state does not carry an End OTP field, an Extend Time CTA, or an End Service CTA — those are controls for a session already running. Items 1–14 above are the same control set catalogued on `101:1812` Page 10 In service.

Both frames share the `Page 10-` prefix. `101:1812` is 390×1236; `3:1848` is 390×830. The most likely reading is that **`3:1848` is the top-fold viewport crop of `101:1812`** — exactly the relationship `59:520` has to `1:455` on Home. Treated here as one screen, `InServiceScreen`, with a ScrollView.

**Confirmation still needed:** verification captured the element inventory, not a pixel diff against `101:1812`. Whether the two frames diverge *below* the fold is open — recorded as designer question T-4(a). Do not delete either frame until answered.

**Knock-on effect:** removing the intermediate Countdown step leaves **no designed state between a correct Start OTP on Page 9 and the live session**. This joins the general absence of loading states already flagged in section R. Recorded as T-4(c).

### Data note — all example content is dynamic

Everything concrete observed in this frame is **sample data, not a UI constant**. When this screen is built, none of the following may be hardcoded:

| Observed as | Actually | Source |
|---|---|---|
| Countdown reading "48 mins" | Remaining session time, derived from booking start + duration, ticking live | Booking record + clock |
| Cook name "Rekha" (status line, "What Rekha cooks best?", profile) | The assigned cook for this booking | Cook assignment |
| End OTP digits | Per-booking generated code | Backend |
| Specialties in the "cooks best" grid | Per-cook cuisine list | Cook profile |
| Address in header | User's selected service address | Address record |
| Trust indicators (Spoon Trained / Background Verified / On-time) | Per-cook boolean/qualitative flags — **render conditionally**, do not assume all three always show | Cook profile |

The cook name appears in at least three separate places on this screen and must resolve from a single source. The countdown is the only element requiring a live ticking timer.

---

## V. Visual audit — what the pixels changed

Completed 2026-08-14 across 8 batches. Full per-frame detail lives in
`docs/FIGMA_VISUAL_AUDIT_PENDING.md`, which is now a **findings record**, not a to-do list.

**The headline: metadata-only classification was wrong or incomplete on 5 of the 50 frames, and two of
those errors would have produced the wrong architecture.** That is the case for having done this pass.

### V-1 · Scheduled is one screen, not eleven

The six cluster-A frames are **progressive-disclosure states of a single route**
(Day → Time → Duration → Start time), and the five cluster-B frames are the same screen in
**Reschedule** mode (Day → Time → Start time, no Duration). Section A lists these as 11 separate
screens. **Build 1 screen with a `mode` prop, not 11.**

Also captured: the **Start time grid is per-15-minutes with per-slot availability**, so the backend must
expose availability at 15-minute granularity, not per period. And "morning / noon / eve" in the frame
names maps to **Morning / Afternoon / Evening** in the UI — nothing is missing, the 5b/5c split is
meaningless.

### V-2 · Page 6 is a meal brief, not a payment review — ✅ *payment now resolved (§ W R-1)*

`3:684` is titled **"Meal Brief & Recipe Link"** and is a skippable customisation form: dietary
preference, guest count, multi-select dish chips, custom-dish entry, a **YouTube/Reel recipe URL**, and
a free-text notes field. The structural audit predicted a payment-method picker, taxes breakdown, T&C
acceptance and a "Confirm & Pay" CTA — **none of it is there, or anywhere else in the file.**

This adds a `mealBrief` object to the booking model. It also raised "where does payment happen?" as the
audit's single biggest blocker (**T-22**) — **now closed**: there is no Spoon payment screen at all;
`Pay →` opens **Razorpay checkout directly**, and payment verification plus authoritative
booking/payment state are backend-owned. The absence the audit found was **correct and intentional**.
See § W R-1.

### V-3 · Cancellation is a bottom-sheet stack, not four screens

All four 12a–d frames render as a sheet over a dark scrim under one persistent
`← Cancel booking + Help` header. **One `CancelBookingSheet`, four steps.** The pass also surfaced a
business rule stated nowhere else: **a booking can be rescheduled only once** (T-26).

### V-4 · The Instant 4c frames are states, not screens

Both are `1:728` with the duration grid blurred and an icon + message overlaid — moon /
"Slots open at 6 AM today", calendar / "Sorry, all sold out!". Both fall back to **Schedule**, which
answers the retention question: users are routed to Scheduled, not offered "notify me".

### V-5 · Home is two booking-state variants of one screen — ✅ *resolved (§ W R-2)*

`59:520` is **not** the top-fold crop of `1:455`. Detailed comparison in the pending doc. The pass could
not settle from pixels whether the two frames were iterations or states; **the ruling settles it as
states** — `1:455` pre-booking, `59:520` active-booking. **One state-driven `HomeScreen`, both frames
retained.** The conflicting tile copy survives as a copy defect needing one canonical pair
(`FIGMA_FINAL_BLOCKERS.md` D-20).

### What the pass confirmed rather than changed

- En route late is a pure two-property state variant of En route on time.
- Cook cards differ **only** in the specialty grid → one `CookCard`, `pureVeg` filters dishes.
- The Page 12a fee schedule (₹0 / 25% / 50%) matches what was recorded.
- The rating widget is fully specified: **9 numeric chips, `1`–`5` in 0.5 steps, user-selectable
  half-ratings, and a fill colour that varies with the value** — plus a `5+` tip prompt.

### Net effect on screen count

Frames that metadata suggested were ~50 distinct surfaces resolve to roughly **26 buildable
components/screens**, the largest collapses being Scheduled (11 → 1), Cancellation (4 → 1 sheet) and
Instant (3 → 1 sheet with states).

### Still blocking IMPLEMENTATION_READY — **updated after the 2026-08-14 rulings**

The visual gap was closed by this pass; the specification gap has since been **mostly** closed by
product. **T-22, T-18, T-26, T-11, T-30 and T-8 are all resolved** (§ W).

**Remaining blockers, all screen-level:** the `DESIGN_PENDING` **OTP screen** (blocks auth), **T-20**
(does rescheduling charge?), **T-24** (no cancellation entry point from live-booking screens) and
**T-13** (booking horizon / day-selector shape).

**Foundation implementation is cleared to begin** — the work scoped in
`FRONTEND_FOUNDATION_PLAN.md` § 21 is design-independent and none of the four touches it. The standing
constraint is unchanged and unrelated to design: **no backend contract exists**, so no endpoint,
payload shape or status enum may be written. Loading states also remain absent across the app (T-5).

---

## W. Product rulings — 2026-08-14

Received from product/founders after the visual audit. **These are specification, not questions.**
The designer-facing version, with node IDs, screenshots and consequences, is
`docs/FIGMA_FINAL_BLOCKERS.md` § 0.

| # | Closes | Ruling |
|---|---|---|
| **R-1** | T-22 | **Payment.** There is **no separate Spoon payment screen**. Tapping `Pay →` opens **Razorpay checkout directly**. **Do not invent a payment-method / payment-review screen.** Payment verification and authoritative booking/payment state remain **backend-owned**. → No payment routes; after checkout the client **refetches authoritative state** and never infers success. Razorpay is a committed dependency; its integration mode, keys, order creation and return contract are backend/engineering items. |
| **R-2** | T-18 | **Home.** **One logical Home experience with booking-state variants.** `1:455` = the normal / pre-booking Home. `59:520` = the post-booking / active-booking variant, containing booking ETA/status, Instant Cook, Schedule Later, the **COOK EN-ROUTE** card, assigned cook information, arrival ETA and booking duration. **ETA, cook name and duration are dynamic backend data.** **Do not implement the two frames as unrelated routes — model them as state-driven variants of Home.** |
| **R-3** | T-26 | **Reschedule limit.** A booking may be rescheduled **only once**; afterwards the Reschedule option is **not shown**. **Do not independently infer eligibility on the client** where the backend exposes authoritative action/eligibility state. → The "Reschedule for free" block on `6:2`/`104:2336` renders conditionally on backend eligibility. |
| **R-4** | T-11 | **Unserviceable address.** The existing map/address flow handles it — if the selected address is outside serviceability, **the map flow displays that the area is outside the serviceable area**. **Do not invent another separate failure flow.** → Surfaced inline in the map step (`53:31`), not as a modal or rejection screen. |
| **R-5** | T-30 | **Upcoming booking.** Upcoming/active booking information appears **on Home** — the active variant's COOK EN-ROUTE card. **Do not invent a separate Upcoming Bookings screen** unless another product requirement explicitly requires one. → Page 14 stays past-only. ⚠ Does **not** resolve T-31 (cancelled bookings have nowhere to appear). |
| **R-6** | T-8 | **Login legal links.** T&C / Privacy are available from **Profile**. **Do not invent additional legal UI beyond the approved design.** → Login ships exactly as drawn. The consent-at-point-of-collection concern was raised by the audit and is accepted by product; recorded once here and closed. |
