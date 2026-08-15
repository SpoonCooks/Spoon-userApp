# Figma pixel-perfect audit

**Source of truth:** Figma `1kd1u3WEc00SENkToIPloW` — "V0_-user-app (1)", page `0:1`.
Earlier passes were audited against `QMgajesW22fQcUbs7TKspS` / `BTPW14a7M69ySPZxdkc2yn`; where those
disagree with the current file, **the current file wins**.
Access via `figma-desktop` MCP, student Full seat (`lakshay58csea24@bpitindia.edu.in`).

Status vocabulary: **PIXEL_PERFECT** · **RESPONSIVE_VERIFIED** · **ASSET_PENDING** ·
**DESIGN_PENDING** · **PRODUCT_PENDING** · **BACKEND_DATA_PENDING** · **NEEDS_FIX** ·
**NOT_AUDITED**.

> A screen is only marked PIXEL_PERFECT when structure, dimensions, typography, colours, radii,
> borders, shadows, icons, imagery and alignment have each been compared against its node AND the
> result has been rendered and looked at. Nothing here is marked PIXEL_PERFECT from code
> inspection alone.

---

# PASS 4 — NEW FIGMA FILE `1kd1u3WEc00SENkToIPloW`

The visual source of truth moved to `1kd1u3WEc00SENkToIPloW` ("V0_-user-app (1)"), one page `0:1`.
Where it conflicts with the old file or with §P3, **the new file wins**. Older sections remain valid
for backend rulings, architecture and history only.

**Pass 4 is now complete: every frame in the latest file has been classified at node level.**
§P4.0–§P4.6 below record the first (partial) sweep and the second, which finished it.

## P4.0 Delta method — how "UNCHANGED" was earned

`get_metadata` on `0:1` returns ~830k characters, past the tool's limit, so the page was pulled to
disk and parsed by indentation to recover the true top level: **49 frames**. Node IDs are largely
carried over from the old file, which means this is a FORK of it plus additions — so a matching ID
is evidence of lineage, NOT evidence that a frame is unchanged.

The first pass inspected 3 frames and left 46 as NOT_YET_DELTAED. This pass closed all 46, using a
method that produces evidence rather than an assumption:

1. `.figma-audit/screens/` holds a **render of all 49 frames from the OLD file**, captured during
   the pass-2 visual audit. Each carries its own pixel size.
2. Every frame was re-rendered from the NEW file **at exactly that pixel size** (`get_screenshot`
   with `maxDimension` set to the old capture's longer edge), so both images come out of the same
   renderer at the same scale and are directly comparable.
3. The pair was differenced (`.figma-audit/_p4diff`): mean absolute difference plus the percentage
   of pixels differing by ≥ 24/255, with a shift search (±3 px, ±8 px) to separate a real change
   from a sub-pixel nudge.
4. Anything that moved was localised (bounding box + per-row bands), cropped old-vs-new, and read.
   Only then was `get_design_context` / `get_metadata` spent, and only on the node that moved.

**Calibration** — the method's own noise floor, measured on this data:

| Signal | Reading |
| --- | --- |
| Same size, no change | **0.00 %** (26 frames landed exactly here) |
| Sub-pixel layout nudge | 1.1–1.9 %, collapsing to ~1.1 % at a 1 px offset |
| A real new element | 1.7–5.0 % with a bounded, structured diff region |
| A redesign | **24.3 %** (Login) |

Two frames needed a tie-break beyond pixels and got one from the node itself — see `1:728` in
§P4.2. **Frames whose old capture was rendered at a reduced size are flagged in §P4.2**, because a
low-resolution comparison cannot resolve a small change.

## P4.1 Classification — 59 frames, all node-level compared

**Coverage, stated exactly.** 54 frames were diffed against a real old-file baseline: the 49 in
`.figma-audit/screens/`, plus `201:100`, `209:747`, `201:278`, `209:1207` and `3:1848` rendered
fresh from the pass-2 file `QMgajesW22fQcUbs7TKspS`, which is still accessible. (The pass-1 key
`BTPW14a7M69ySPZxdkc2yn` is not — `201:100` returns "node not found" there.) The remaining 5 have
no old-file counterpart and are NEW or containers. Nothing is classified from a matching node ID.

| Class | Count |
| --- | --- |
| NEW | **4** |
| CHANGED | **6** |
| UNCHANGED | **45** |
| OBSOLETE | **2** |
| REFERENCE container / bounds-only | **2** |
| **Total distinct frames classified** | **59** |

### NEW — no counterpart in the old file (4)

| Node | Screen | Status |
| --- | --- | --- |
| `227:1649` | Page 17b **Login OTP** | IMPLEMENTED · DEVICE VERIFIED (pass 4a) |
| `239:2261` | Login OTP, second copy | Screenshot-identical to `227:1649`; a duplicate frame, not a state |
| `228:1801` | Page 17a **Address edit** sheet | **IMPLEMENTED · DEVICE VERIFIED · RESPONSIVE** |
| `215:1472` | Page 16d **Address out of service** | **IMPLEMENTED · DEVICE VERIFIED · RESPONSIVE** |

### UNCHANGED frames whose STATE had never been built (3)

| Node | Screen | Diff vs old file | Status |
| --- | --- | --- | --- |
| `34:3035` | Page 5b Scheduled **morning** | **0.00 %** | **IMPLEMENTED · DEVICE VERIFIED · RESPONSIVE** |
| `34:1919` | Page 5b Scheduled **noon** | **0.00 %** | **IMPLEMENTED · DEVICE VERIFIED · RESPONSIVE** |
| `34:2105` | Page 5c Scheduled **evening** | **0.00 %** | **IMPLEMENTED · DEVICE VERIFIED · RESPONSIVE** |

These frames did not change — the previous pass simply never inspected them. Each is the
already-built Schedule screen with a different period selected, which is exactly how
`ScheduleViewModel` models them (`periods` + `slotsByPeriod`). What was genuinely missing was the
**start-time grid's own geometry**, which no previously-inspected frame published — see §P4.3.

### CHANGED — same logical screen, materially different design (6)

| Node | Screen | What actually changed | Status |
| --- | --- | --- | --- |
| `53:174` | **Login** | Completely redesigned (24.3 % diff). 364pt hero photograph, 134 × 93 logo lockup, two-line tagline, 24pt-radius pill field outlined `#FFD600` with a 1.778pt `#FFE666` divider, filled `#FFD600` CTA, legal footer | **REBUILT · DEVICE VERIFIED · RESPONSIVE** |
| `6:663` | **Profile** | NEW `222:1570` "Your profile is incomplete" prompt between the identity card and the tile grid; the **My refunds** tile glyph changed from a curved arrow to a banknote (`222:1569`) | **CORRECTED · DEVICE VERIFIED · RESPONSIVE** |
| `68:214` | **Saved addresses** | Every row gains a trailing `#FFD600` **kebab**, which is the entry point to the new `228:1801` sheet. The row narrowed 338 → 304.22 to make room | **CORRECTED · DEVICE VERIFIED · RESPONSIVE** |
| `60:655` | **Address details** | Every input outlined `#FFD600` (was `#CAD5E2`); a NEW free-text **"Save as"** field below the label chips; **"(Optional)"** appended to the Receiver's-details heading | **CORRECTED · DEVICE VERIFIED · RESPONSIVE** |
| `6:2` | **Cancellation — policy** | The first fee tier reads **"Free"** in `#01CF8F` instead of an absolute `₹0` — which closes defect **D-12**; copy "take another job" → "do another job" | **CORRECTED · DEVICE VERIFIED · RESPONSIVE** |
| `54:280` | Icons reference | Grew from 2 marks (back, ✕) to 5 — back, ✕, kebab, edit pencil, red trash. **Caught by eye, not by the metric**: three small marks on a 408² canvas score only 0.24 %, which is why every non-zero diff was looked at rather than thresholded away | REFERENCE — the three new marks are consumed by `68:214` / `228:1801` |

### UNCHANGED — node-level compared, nothing moved (45 with the three above)

Each of these rendered **0.00 %** different from the old file at matched resolution unless noted.
Implementation preserved; no re-verification needed beyond the shared-dependency re-checks in §P4.5.

`1:455` Home canonical (0.06 %) · `1:728` Instant available (see §P4.2) · `25:1585` taxes dialog
(0.13 %) · `25:1327` Instant out-of-shift · `44:5378` Instant no-slots · `3:684` Meal Brief ·
`3:1041` Confirmation · `3:1381` En route on-time · `99:1413` En route late · `3:1658` Arrived ·
`101:1812` In service (0.09 %) · `3:2002` Extension sheet · `143:207` Completion ·
`104:2260` cancel reason · `104:2336` refund details (0.07 %) · `115:2703` cancel confirmed
(0.13 %) · `53:31` address map (0.34 %, no visible delta) · `37:3703` / `37:3943` / `37:4183`
Schedule · `47:6549` / `47:6450` / `47:6059` / `47:5844` / `47:5638` Reschedule ·
`71:747` loading interstitial · `73:1036` loading splash · `94:905` food icons ·
`119:2885` rating reference · `81:448` / `81:710` / `81:972` cook cards ·
`87:510` / `87:380` / `87:250` / `87:120` pure-veg cook cards.

Four more were baselined against the pass-2 file rather than the screenshot set, and are equally
unchanged: **`209:1207` Home 3b (0.00 %)**, `209:747` Reassigned late (0.00 %), `201:278` Auto
cancelled (0.00 %) and `201:100` Reassigned on-time (0.20 %). `209:1207` is 830pt in BOTH files —
the tall child §1 cites is `209:1226` inside it — so Home 3b's role, and the promo → upcoming card
→ tiles → cuisines order the implementation builds, are confirmed unchanged.

Two frames moved by **1 px** and nothing else — `6:227` booking history (4.67 % → **1.50 %** at
`dy=1`) and `71:615` refunds (1.94 % → **1.11 %** at `dy=1`). Their card content, borders, badges
and photographs are identical; the border pixel samples (166,166,168) vs (147,147,147) at the same
coordinate. Recorded as **UNCHANGED (sub-pixel offset)**, below the resolution of the pass-3 device
measurements.

### OBSOLETE (2) — recorded, code deliberately NOT deleted

| Node | What it was | Ruling |
| --- | --- | --- |
| `59:520` | The old 830pt active-booking Home | **DELETED from the file** — `get_screenshot` returns "node ID was not found". Its role is now `209:1207`. No code change: Home was already ONE route with a conditionally-inserted card, so nothing referenced `59:520` except a dev-menu note, which has been corrected. |
| `3:1848` | The 830pt duplicate of In service (old blocker T-4) | Renders **1 × 1 and empty in BOTH files** — it was already a dead frame, not emptied by this revision. T-4 was resolved as "one scrolling `InServiceScreen`"; nothing to delete. |

### REFERENCE / bounds-only (2)

`81:1234` cook card (Jyoti) — frame bounds changed 378 × 476 → 346 × 439; the card content is
unchanged and still shows defect D-4. C-6 holds, one `CookCard`, **no code impact**.
`115:2821` is the 2119 × 1149 **section container** holding the cancellation frames, not a screen.

### Also reference

`94:905` food icons and `119:2885` rating scale — both 0.00 %.

`209:1207` is Home 3b and is **UNCHANGED in role**: rendered at 830pt it shows banner → promo
carousel → **UpcomingBookingCard** → Instant/Schedule tiles → the cuisine section continuing past
the frame edge. That is exactly the insertion order §1 locks and the implementation builds, and it
confirms the marketing stack survives in the active-booking state (**B-16** answered: it is kept).

## P4.2 The two frames that needed a tie-break

**`1:728` Instant — reported 3.87 %, ruled UNCHANGED.** The old capture is 258 × 500 for a 390pt
artboard (0.66 px/pt), too coarse to resolve a small change, and the diff was concentrated in text
anti-aliasing bands. It was settled from the node instead of the pixels: `get_metadata` on `1:750`
returns ETA pill `1:754` **w 109 at x 103, h 32**, tiles **165 × 67.6** at x 0/173 and y
0/77.6/155.2 (gutter **8**, row gap **10**), CTA `1:821` **338 × 34** at y 350.8, caption `25:1325`
at x 128. Every one of those is what §P3.3 measured and what the code renders. UNCHANGED.

**`6:227` / `71:615`** — resolved by the shift search above.

## P4.3 Login / OTP / the Scheduled start-time grid

**Login `53:174` — PHYSICAL_DEVICE_VERIFIED.** The previous pass could not verify it because
`spoon://login` "resolved incorrectly". The cause was found and fixed: the route rendered
`LoginScreen` (a `flex: 1` `SafeAreaView`) as a flex sibling of a ~1500pt content-sized
`DevRouteMenu`, which squashed the screen to a few pixels. The menu now lives at its own `__DEV__`
route (`spoon://menu`); `/login` renders nothing but the frame. Production navigation is untouched.

Measured on the handset (393 × 870 dp, 2.7481 px/dp), against the node values cached in §P4.4:

| Element | Node | Device | Δ |
| --- | --- | --- | --- |
| hero band image | 352 (364 − 2 × 6) | **351.9** | −0.1 |
| hero full-bleed | 0 / 0 side margins | **0 / 0** | 0 |
| field height | 34 | **33.84** | −0.16 |
| field side margins | 16 | **16.01 / 16.01** | +0.01 |
| dial divider `#FFE666` | **1.778** | 4 px core + 2 half = **5.0 px = 1.82** | +0.04 |
| divider position | ~85 | **86.61** | text-metric |
| input text start | divider + 16 | **105.16** (divider ends 88.79) | +0.4 |
| field → CTA gap | 16 | **16.37** | +0.37 |
| CTA height | 34 | **34.21** | +0.21 |
| CTA width / margins | px 16 | **360.98**, 16.01 / 16.01 | ~0 |
| legal line 1 ink | 9/13.5 at ~785.5 | **786.0** | +0.5 |
| CTA fill | `#FFD600` | **(255,214,0)** | exact |
| field border | `#FFD600` | **(255,214,0)** | exact |
| "minutes" accent | `#FFD600` | **(255,214,0)** | exact |
| safe area | top inset honoured | **40.58 dp**, hero begins below it | correct |

**Keyboard behaviour — a real defect, found only on the handset.** With the keyboard open the
phone field, the CTA and the legal line were **completely covered and unreachable**. Three causes,
fixed in order: `KeyboardAvoidingView` passed `behavior={undefined}` on Android, and Android's
`windowSoftInputMode="adjustResize"` **is inert under the edge-to-edge display this app runs in**,
so nothing resized; and a scroll issued from `keyboardDidShow` runs before the resize reaches the
view, so it computes against the old height and does nothing. The fix is `behavior="padding"` on
both platforms plus a scroll driven off the ScrollView's own `onLayout`. Re-verified: field, CTA
and legal line all visible above the keyboard, at 393 × 870 and at 393 × 546.

The same broken Android path was present in **`OtpScreen`** and **`AddressDetailsForm`** and is
fixed in both. `MealBriefScreen` already used `behavior="height"` and was left alone.

**Scheduled start-time grid `34:3485`** — the geometry no earlier frame published:

| Property | Node | Implementation |
| --- | --- | --- |
| chip padding | px **14.02**, pt **6.9** / pb **7.8** (asymmetric) | `Chip density="slot"` |
| chip label | Livvic **Bold 11/16.5** | new `slotLabel` token — the Day/Time chips are Black 12/16 and one style cannot serve both |
| chip height | 31.2 | measured **31.30** |
| column pitch / gutter | 85.5 / **10** | measured gutter **10.0** |
| row pitch / gap | 40.1 / **8.9** | measured **9.10** |
| idle fill | `rgba(255,247,204,0.7)` | measured **(255,250,219)** — exact composite |
| selected fill | `rgba(226,255,104,0.7)` + `0 0 4` | measured **(236,255,155)** = the §P3.2 flattened token |
| disabled fill | `rgba(0,0,0,0.07)` **at opacity 0.4** | measured **(248,248,248)** — exact |
| disabled ink | `rgba(0,0,0,0.5)` | `textDisabledOnTile` |

The 40 % fade on a disabled slot belongs to the density, not the state: the Day and Time chips
carry no such fade.

## P4.4 Cached node measurements (do not re-read)

**Login `53:174`** — hero `225:1640` (364pt, py 6, `object-cover`) · brand `53:179` (167pt, pt12/pb6,
logo 134 × 93) · tagline Bold **18/28** + SemiBold **14/16** · form `53:175` (237pt, gap 21) · field
`53:225` (338 × radius 24, 1pt `#FFD600`, dial cell closed by a **1.778pt** `#FFE666` rule, both runs
SemiBold 14/16) · CTA `53:242` (h **34**, radius **16**, Black 16/24 at **−0.4**) · legal `53:251`
(Regular 9/13.5, both links underlined).

**OTP `227:1649`** — brand `227:1666` (172pt, `justify-end`) with a tagline deliberately NOT Login's
(Bold **14/20** + Medium **11/16.5**) · `227:1678` Bold 12/16 · `227:1680` Regular 10/15 at 70%
beside a 14pt `#FFD600` pencil (`227:1700`) 12pt clear · digits `227:1681` (338 row, radius 24, six
**35 × 35** boxes at radius **5** on `#FFEF99`, 10pt apart, Bold **18/28** at 70%) · resend
`230:2086` Medium 11/16.5 · CTA `227:1687` as Login's.

**Address edit `228:1801`** — sheet `230:1924` (370 × 504, radius top **20**, pt 10 / pb 16 / px 16,
gap 10) over `229:1923` `rgba(0,0,0,0.8)` · header `230:1925` (45pt band, 32pt back at 0/7, title
Black **20/28** at x 47) — the `headerVariant="screen"` header, with the back drawn as the OUTLINED
disc (`230:1927`), not the bare arrow the other sheets use · card `6:700` (338 × 423, white, 1pt
`#E2E8F0`, radius 24, padding 15.889, gap 12) · `6:706` Bold 14/20 `#1D293D` · `6:712` gap **21** ·
row `6:713` (`rgba(255,247,204,0.7)`, radius 16, padding 11.889; Bold 12/16 `#0F172B` over Regular
11/14.67 `#45556C`) · actions `230:2080` / `230:2083` (28pt disc, label at x **40** → gap **12**,
Bold 14/20). Each disc exports on a **36pt** canvas because the node draws itself at
`inset -14.29%`; rendered 36 in a 28 box with a −4 margin. Delete glyph `#FF0404`, edit black.

**Address out of service `215:1472`** — banner `218:1536` (45pt, 343 wide: 32pt back at 4/7, label
SemiBold **11/16.5** and line Regular **9/13.5** at x 47, profile 41pt at x 302 holding a 32pt disc
and a 25pt glyph) · body `221:1553` (gap **30**, pt **40** / pb **80** / px 16, centred) · disc
`222:1557` a **flat `#FFEF99` 215pt circle** · art `219:1551` 150 × 125 (`h 120.63%`, top 0) ·
copy `221:1556` (px 15 / py 10, gap 10): `221:1554` Black **20/25**, `221:1555` Medium **10/13.33**
measured at 307.

**Profile prompt `222:1570`** — 338 × 145, radius **15**, `0 0 4 rgba(0,0,0,0.07)` on
`rgba(255,247,204,0.7)` · mark `222:1571` at (13, 15.89), 47 × 32 = a 32pt disc with a 25pt glyph
at 4/3 plus `222:1582` 15 × 32 at x 32.11 · text at (72, 15.89) gap 3: Bold **14/20** `#0F172B`
over Regular **12/16** `#62748E` at 241 wide · CTA `222:1590` **306 × 32** at (16, 96.84),
`#FFD600`, radius **16**, Bold **16/24**.

**Saved-address kebab** — `#FFD600`, three **3.35pt** dots over a **12.55pt** column (gaps 1.25),
ink at x 306.31–308.82pt. Flat circles in the node, so drawn rather than exported.

**Instant `1:750`** — see §P4.2.

## P4.5 Shared-dependency corrections (these touch already-verified screens)

Four fixes landed in shared code. Each is a correction to something no frame draws, and each was
re-verified on the handset.

| # | Defect | Where | Fix |
| --- | --- | --- | --- |
| 1 | **Section gaps were doubled.** `Screen`'s `scrollContent` already carries `gap: 20` AND `styles.section` carried `marginBottom: 20`; with the chip grid's trailing row padding the measured gap on the handset was **48 dp where `34:3045` draws 20** | `ScheduleScreen` | `section` is now spacing-free; the single 20 comes from `Screen` |
| 2 | **Chip and duration grids padded a trailing row.** Row spacing is carried as `paddingBottom` on each cell, so the LAST row padded the bottom of the group — 8pt no frame draws | `ChipGroup`, `ScheduleScreen` | negative bottom margin on the container |
| 3 | **The fee-schedule header clipped.** The value column is a fixed 64pt, which fits "50%" but not "FEE AS PERCENTAGE" — on the handset it wrapped to "FEE AS PER / CENTAGE" | `FeeSchedule` | the header sizes to its own content and right-aligns to the same edge; only the data column stays fixed |
| 4 | **The `avatar-ring.png` export is pre-composited over Home's `#F5FFCD` banner** (its corners sample (245,255,205)). Reused on the white out-of-service banner it drew a lime square | `AddressScreens`, `ProfileScreen` | `218:1548` / `222:1572` are flat `#FFE666` circles, so they are **drawn**. Home keeps its verified asset. |

Re-checked after the change: Schedule (all four sections and all three period states), the
cancellation policy step, Profile, Saved addresses, Address details. All render correctly.

## P4.6 Assets added this pass

`assets/figma/address/out-of-service.png` — rebuilt from the node's **transparent raw source** with
the frame's own `h 120.63%` crop applied. The plain node export is opaque white and drew a white
box on the `#FFEF99` disc — the same defect class as the pass-3 dish glyphs.
`assets/figma/address/action-edit.png` · `action-delete.png` — the 28pt discs on their 36pt shadow
canvases. `assets/figma/profile/incomplete-badge.png` — the exclamation mark, rebuilt from the
transparent raw with the node's `w 213.33% / left −56.67%` crop.
`assets/figma/profile/tile-refunds.png` — **replaced** with `222:1569` "Stack of Money".

Not exported, deliberately, because the node is flat geometry rather than artwork and drawing it is
exact: the 215pt `#FFEF99` disc (`222:1557`), the 32pt `#FFE666` profile discs (`218:1548`,
`222:1572`) and the three-dot kebab.

Still ASSET_PENDING: nothing. `230:2062` (trash) and `230:2050/2051` (menu, cross) are resolved —
the trash and edit marks are exported, and the kebab is drawn.

## P4.7 Reachability in `__DEV__`

Every designed state now opens from `spoon://menu` or a deep link. Two gaps were closed:

- **`spoon://menu`** — the dev menu is its own route, so Login renders as drawn (§P4.3).
- **`spoon://cancellation[?step=…]`** — the four-step cancellation sheet had **no entry point at
  all** (blocker B-11: no live-booking screen draws a Cancel control), so it was the one built
  surface that had never been opened on a device. A `__DEV__`-only route now opens any of its four
  steps. It invents no product entry point and refuses to render outside `__DEV__`.

Also reachable: `spoon://address?edit=1` (`228:1801`), `spoon://address/out-of-service`
(`215:1472`), `spoon://otp?state=ready|error`.

## P4.8 Verification status — pass 4

| Screen / state | Node | Class | Implemented | Device | Responsive |
| --- | --- | --- | --- | --- | --- |
| Login | `53:174` | CHANGED | YES | **YES** | **YES** |
| Login OTP | `227:1649` | NEW | YES | YES (4a) | inherits the KAV fix |
| Address edit sheet | `228:1801` | NEW | **YES** | **YES** | **YES** |
| Address out of service | `215:1472` | NEW | **YES** | **YES** | **YES** |
| Scheduled morning | `34:3035` | NEW state | **YES** | **YES** | **YES** |
| Scheduled noon | `34:1919` | NEW state | **YES** | **YES** | **YES** |
| Scheduled evening | `34:2105` | NEW state | **YES** | **YES** | **YES** |
| Profile | `6:663` | CHANGED | **YES** | **YES** | **YES** |
| Saved addresses | `68:214` | CHANGED | **YES** | **YES** | **YES** |
| Address details | `60:655` | CHANGED | **YES** | **YES** | **YES** |
| Cancellation ×4 | `6:2` `104:2260` `104:2336` `115:2703` | CHANGED (policy) | **YES** | **YES — first time ever** | **YES** |
| Everything in the UNCHANGED list | — | UNCHANGED | pre-existing | §P3 device verdicts stand | §P3.4 |

**Responsiveness** was checked on the handset by rescaling it, at **320 dp** (`wm density 540`),
**393 dp** (native reference), **430 dp** (`wm density 402`) and **393 × 546 dp**
(`wm size 1080x1500`), plus the keyboard at the short viewport.

One real responsiveness defect was found and fixed: **the start-time grid ellipsised every label at
320 dp** ("05:0…", "05:1…"). Four fixed columns give 64.5pt against a 75.55pt chip. The frame draws
those chips **content-sized at a 10pt gutter**, not stretched onto a track, so the implementation
now does the same — four per row at 370/393/412/430, three per row below ~365, no truncation and no
type scaling at any width. That is both more faithful and the responsive fix.

Two smaller ones, also fixed: the Profile tile labels clipped at 320 dp ("My orde…", "View order
hist…") and the sheet title clipped to "Cancel booki…" beside its Help pill. Both now wrap to a
second line, which only ever engages below the reference width.

## P4.9 Design defects — new and closed

**Closed by the new file**

- **D-12** — the cancellation fee table no longer reads an absolute `₹0` under a "Fee as
  percentage" column; `6:22` reads **"Free"** in `#01CF8F`.

**Still present in the new file (re-confirmed, not assumed)**

- **D-1** — `34:3035`'s 6 AM row still reads `06:00 · 06:30 · 06:30 · 06:45`; `06:15` is missing and
  `06:30` duplicated. Not reproduced in the fixture.
- **D-2** — `34:2105` still carries four AFTERNOON chips (`12:30 · 12:45 · 01:30 · 01:45`) inside
  the evening grid. Not reproduced; the evening range is written 05:00–09:00 PM.
- **D-4** — "What **rekha** cooks best?" still appears on the non-Rekha cook cards, including the
  resized `81:1234`.
- **D-6 / B-17** — the secondary CTA still disagrees with itself: `34:3035` says "Share your
  requests", `34:1919` and `34:2105` say "Add Custom Meal Brief". Fixture keeps "Share your
  requests".
- **D-3** — the bar still reads ₹129 with the 1.5 hr (₹189) tile selected.

**New**

| # | Defect | Node |
| --- | --- | --- |
| D-30 | The out-of-service line has a doubled comma — "in your area at the moment**, ,** but we are working towards it!". Rendered verbatim so it stays visible | `221:1555` |
| D-31 | "Edit address**s**" as a sheet title, and "Edit this address**es**" for a single address | `230:1926`, `6:706` |
| D-32 | "Share **how** your meal preferences, so that we can serve you better" — the sentence has no verb | `222:1579` |
| D-33 | `6:700` fixes the edit-sheet card at **423pt** inside a 504pt sheet, leaving ~230pt of empty white below "Delete". Rendered content-sized, as D-28 was — reproducing a fixed canvas height is reproducing a mistake | `6:700` |

## P4.10 Deliberate deviations, each recorded

| Screen | Deviation | Why |
| --- | --- | --- |
| Start-time grid | Chips are content-sized and wrap; the frame's ~5.8pt right-hand slack is not reproduced | Reproducing a fixed-canvas remainder truncates every label at 320 dp. Same call as D-28. |
| Start-time chip width | Renders **79.69 dp** against the node's 75.5 | The padding is exact (28.04); the difference is the **text advance** — Livvic Bold 11 measures 51.65 dp on Android against Figma's 47.46. `font_scale` is 1.0. Not an implementation error; correcting it would mean shrinking type or padding. |
| Address edit sheet | Content-sized, not the frame's 504pt | D-33 above. |
| Login vertical rhythm | Slack goes into the form block, which centres its content, rather than being split by `justify-between` | At 870 dp this puts "Login" at 70.3 % of the screen against the frame's 64.7 % in an 830pt artboard. Splitting the slack would open a white band under the hero, which the design plainly does not intend. |
| Profile tile title at 320 dp | "Addresses" wraps mid-word | The tile is drawn 161 wide and is ~136 at 320 dp. Wrapping preserves the word; truncating loses it. 320 dp is below the design's 370pt reference. |
| `215:1472` | Built, while ruling R-4 says no separate rejection screen exists | **PRODUCT_DESIGN_CONFLICT** — see §P4.11. |

## P4.11 PRODUCT_DESIGN_CONFLICT

**R-4 vs `215:1472`.** Ruling R-4 states that serviceability surfaces **inline in the map step**
and "do not invent another separate failure flow". The new file draws exactly such a screen —
"Page 16d- Address out of service", a full screen with its own banner, illustration and copy.

Handled without changing product behaviour: the screen is **built** (the new file wins on visuals)
and the inline `serviceabilityMessage` on the map step is **left in place**. Nothing in the product
routes to the new screen — only the `__DEV__` menu does — so which surface is canonical remains a
product decision. The client still evaluates no coverage: every string is server copy.

## P4.12 Designer comments

**COMMENTS_ACCESSIBLE: NO.** The `figma-desktop` MCP surface exposes design context, metadata,
screenshots, variable definitions, asset download, Code Connect and shader/FigJam tools. It has
**no comments/annotations endpoint**, so standard Figma comments cannot be read and none are
claimed to have been reviewed. Node names, layer structure and the variable definitions returned
alongside design context WERE read and used.

No frame inspected this pass carries a visible annotation, callout or comment pin, so no
`MANUAL_COMMENT_REVIEW_REQUIRED` is raised for a specific node. The standing caveat holds: if
comments exist they need a manual export from the designer, and the frames most likely to carry
them are the new auth, address and Scheduled start-time frames.

## P4.13 Pending

- **DESIGN_PENDING** — promo carousel artwork (`1:479` / `209:1227` are plain colour panels);
  the upcoming-booking timer glyph.
- **PRODUCT_PENDING** — whether `239:2261` is a distinct OTP state or a duplicate frame; the
  destination for `222:1590` "Complete profile", which nothing designs; B-10 Help destination;
  B-11 cancellation entry point; B-15 cancelled-booking destination; B-17 the secondary-CTA label.
- **BACKEND_CONTRACT_PENDING** — OTP request/verify, expiry, resend interval, retry budget, rate
  limits and login error copy; address delete; what "profile is incomplete" means and what
  completes it; the `saveAs` field's name and persistence.
- **ASSET_PENDING** — none.
- **BACKEND_DATA_PENDING** — per-cook dish glyph set (D-13).

## P4.14 Quality gates — pass 4

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `eslint . --max-warnings=0` | **PASS** — 0 errors, 0 warnings |
| `prettier --check .` | **PASS** |
| `jest` | **PASS** — **303 / 303**, 36 suites (was 299) |
| `expo config --type public` | **PASS** |
| `expo export --platform android` | **PASS** — 4.7 MB Hermes bundle, 0 errors |
| Physical-device runtime | **PASS** — `10BE9X1HPH001UZ` (I2403, 393 × 870 dp @ 440 dpi); cold launch, no `ReactNativeJS`/`AndroidRuntime` errors in logcat |

Tests added (+4, none weakened): Login no longer embeds the dev menu (the regression that made it
unverifiable), the saved-address kebab raises the edit sheet, the address form carries `saveAs` and
the "(Optional)" qualifier, and the existing save assertion was extended for the new field.

---

---

# PASS 3 — PIXEL_PERFECT WAS RESET, THEN RE-EARNED ON THE HANDSET

Physical-device screenshots proved that screens marked PIXEL_PERFECT in pass 2 were not
pixel-perfect. The label was withdrawn from every screen and re-earned only through the full loop:

**Figma node inspection → physical-device render → side-by-side compare → correction →
physical-device re-render → second compare.**

Sections 0–12 below are pass 1 / pass 2 provenance. Their PIXEL_PERFECT claims are superseded by
the table in §P3.6.

## P3.0 Verification hardware

| | |
| --- | --- |
| Handset | `10BE9X1HPH001UZ` — I2403, 1080 × 2392 @ 440 dpi = **393 × 870 dp** |
| Why it matters | 393dp is within 1% of the design's 370pt live area plus its 16pt gutters, so vertical values compare 1:1 |
| Harness | Metro on 8081 with `adb reverse`; screens reached by deep link (`spoon://booking/arrived`, `spoon://profile`, …) rather than by tapping, so every capture is reproducible |
| Method | Every claim below is a **measurement**, not an impression: screenshots are probed with PIL and reported in dp against the node value |

**Hot reload is not trusted for a final comparison.** It produced a stale "Call" where the source
said "Call Cook". Every verdict below is from a cold `am force-stop` + relaunch.

## P3.1 The reference viewport, corrected

Pass 1 recorded "every frame is 390pt wide". That is the ARTBOARD. `1:729` is 370 wide at x = 10
inside it and Home's `1:457` is 370 at x ≈ 9.6 — the 390 includes a 10pt bezel each side. **The live
area is 370pt**, and the padded content column is 338 (Instant) / 340 (Home). Nothing was rescaled;
`BASE_DESIGN_WIDTH` is unused for scaling and was left alone.

## P3.2 The two defect classes that produced most of the mismatch

Both were invisible in code review and only showed up on the handset.

### A. A touch-target minimum baked into a drawn size

`IconButton` forced `minWidth`/`minHeight` to 44 to satisfy the touch minimum. Every header control
in the file is drawn **32 × 32** (`1:738`, `37:5266`, `6:792`, `60:732`, `37:3707`). Every sheet and
screen header was therefore ~11pt too tall with its title pushed 12pt right. The control is now
drawn at `size + 2 × padding` = 32 and the 44pt target is restored with `hitSlop`, exactly as
`Button` already did for its short bars.

### B. Translucent fills under an Android elevation shadow

Five surfaces were authored as the frame's `rgba(...)` value AND given a shadow. On Android the
elevation shadow is visible **through** a translucent background, which drew a dark frame around
each one. Measured on the Home banner: the fill dropped from (245,255,205) in the middle to
(226,236,186) within ~3dp of every edge — a dark lime border the frame does not draw.

All five are now pre-composited over their real ground, which keeps the designed colour and removes
the artifact:

| Token | Was | Now | Where it showed |
| --- | --- | --- | --- |
| `limeBanner` | `rgba(236,255,155,0.5)` | `#F6FFCD` | Home top banner |
| `limeTrust` | `rgba(236,255,155,0.7)` | `#F2FFB9` | Cook-card trust row |
| `limeSoft` | `rgba(236,255,155,0.3)` | `#F9FFE1` | Arrived Start-OTP panel |
| `yellowSoft` | `rgba(255,239,153,0.3)` | `#FFFAE0` | In-service End-OTP panel |
| `tileIdle` | `rgba(255,247,204,0.7)` | `#FFFADB` | Profile legal panel (Instant tiles unaffected — no shadow) |
| `limeRate`, `butterySoft` | 30% / 70% | `#F1FFB4`, `#FFFCF1` | flattened for the same reason |
| `tileSelected` | `rgba(226,255,104,0.7)` | `#ECFF9B` | `1:788` layers an opaque `#ECFF9B` (`1:789`) over the 70% canary, so the composite the designer sees IS the solid |

## P3.3 Screen-by-screen

### 1. Instant — `1:729` (children `1:735` … `25:1325`)

| # | Difference found on device | Node | Fix |
| --- | --- | --- | --- |
| 1 | Back control drawn 44 × 44 | `1:738` | class-A fix above |
| 2 | Back glyph was Feather `chevron-left`. The exported SVG is `M10 15.8333L4.16667 10L10 4.16667` + `M15.8333 10H4.16667` at a 1.66667 round-capped stroke — Feather `arrow-left` scaled to 20, exactly | `1:739` | new `backArrow` icon; `back` stays a chevron for screen headers |
| 3 | Back glyph black; the node strokes it `#314158` | `1:739` | `IconButton` gained `color` |
| 4 | An **undesigned drag handle** (3pt bar + 8pt margin = 11pt) sat above the header | `1:729` | removed; drag-to-dismiss moved onto the header, so the gesture survives |
| 5 | Grid row gap 8. The tracks are 69.6 at an 8pt gap with 67.6 tiles set `self-start`, so the drawn gap is **10** and the tail under the last row is **18** | `1:757` | `GRID_ROW_GAP = 10`, `GRID_TAIL = 8` |
| 6 | Grid → CTA was ~16; the frame's body gap is **29** | `1:750` → `1:821` | `footerStyle` on `BottomSheet` |
| 7 | Caption sat 8pt under the CTA; the frame says **4.4** | `25:1325` | footer gap 4.4 |
| 8 | ETA pill sized to content; the node fixes it at **w 109** over a 93pt centred label | `1:754` | `width: 109` |
| 9 | Selected tile rendered the translucent layer | `1:788`/`1:789` | class-B fix |
| 10 | **No bottom safe-area inset** — the caption sat under the gesture bar | — | `useSafeAreaInsets().bottom` added to the sheet tail |
| 11 | Header hairline `#F3F4F6`; the node's border colour is white — a spacer, not a rule | `1:735` | recoloured, height kept |

**Second comparison (measured, after every later shared-token change):**

| | Figma | Device | Δ |
| --- | --- | --- | --- |
| sheet top → "Arriving in" row | 89.8 | **89.88** | +0.08 |
| ETA row height | 32 | **32.02** | +0.02 |
| ETA pill width | 109 | **109.17** | +0.17 |
| ETA → grid | 29 | **29.11** | +0.11 |
| tile height | 67.6 | **67.68** | +0.08 |
| grid row gap | 10 | **9.82** | −0.18 |
| grid column gutter | 8 | **8.00** | 0 |
| last tile → CTA | 47 | **46.94** | −0.06 |
| CTA height | 34 | **34.21** | +0.21 |
| "Popular" badge | 44 × 18 | **44.03 × 17.83** | ~0 |
| back-arrow ink top from sheet | 33.84 | **33.84** | 0 |
| sheet corner radius | 20 | ~20 | AA |
| scrim | `rgba(0,0,0,0.8)` | **(51,51,51) over white** | exact |
| idle / selected / disabled / CTA / ETA fills | — | **all exact** | 0 |

PIXEL_PERFECT_VERIFIED **YES** · RESPONSIVE_VERIFIED **YES** · PHYSICAL_DEVICE_VERIFIED **YES**

Remaining deltas — none implementation-caused. Tiles render 176.5dp wide instead of 165 because the
device is 393dp and the node is `grid-cols-[repeat(2,minmax(0,1fr))]`; that IS the design's own
behaviour. Two recorded design items: **D-26** (below) and the frame's pre-selected 1.5 hr tile,
which is payload state, not layout.

### 2. Home — `1:455` (Page 3a canonical; device shows the 3b booking state)

`HOME_DESIGN` was re-measured against the node and matched on **every** value checked — body gap 8 /
pt 22, bolt 20 × 23 gap 4, address block 34 with label centre 10.5 and line centre 26, profile 41 box
at top 14 / right 14 with a 32 ring, promo 257 / centre 217 × 238 / side 75 × 210 gap 16, tiles
160 × 142 gap 18 with 10/22 padding and a 40pt disc holding a 30 × 40 glyph, inner gaps 6, cuisine
mosaic 16 column / 15 row, reasons 3-up at 10 with per-tile art 85/85/80/80/75/78, matrix header 21 /
rows 18 / gap 6 / columns 84+84+85 at a 3.5 inset, exclusions 15 gutters with 162 × 67.5 art and a
6pt caption gap, promise logo 40, section title 31 × 305, section padding 6 / inner gap 6.

| Difference | Node | Fix |
| --- | --- | --- |
| Banner `paddingBottom` 10. `1:458` is 85 tall over children 16 + 23 + 4 + 34 = 77, so the tail is **8** | `1:458` | corrected |
| Banner drew a dark lime frame on all four edges | `1:458` | class-B fix |
| **Instant/Schedule tiles measured 152.5 dp instead of 142** — `aspectRatio: 160/142` tied the height to the width, so the tiles grew 10dp purely because the screen is wider than the design. This is the global scaling the task forbids and a large part of why Home read heavy | `1:576`, `129:29` | `aspectRatio` removed; height stated as `minHeight: 142` with the content top-inset at 22 |
| Address caret ~16dp left of the frame, 6.55 wide instead of 10, and centred on the label rather than its baseline. Three separate errors: the caret follows the label's fixed **48pt text box** (`59:376`), its 8.35 × 3.69 node bound is the PATH bound while the drawn mark including its 1.667 round-capped stroke is **10 × 5.33**, and its centre sits at y 14.845 — the text baseline | `59:376`, `59:386` | all three corrected; caret re-exported |

**Second comparison (measured):** banner 84.06 dp (85) · caret ink at 66.59 dp (Figma 67), width 9.10
(10) · promo centre 216.9 × 237.98 (217 × 238), side 56 visible × 210.33 (210), gutter 16.4 (16),
side panels vertically centred to within 0.3 · upcoming card 136.82 (136.59) · **tiles 142.28
(142)**, 171.39 wide, gutter 18.56 (18) · reasons tiles 124.09 / 124.45 (125) with a 10.92 gutter (10)
and 113.17 × 3 columns at 9.82 (10) · matrix rows 17.83 (18) at a 24.01 pitch (24) · exclusions art
71.69 (72.1 at that width) at a 106.62 pitch.

PIXEL_PERFECT_VERIFIED **YES** · RESPONSIVE_VERIFIED **YES** · PHYSICAL_DEVICE_VERIFIED **YES**

Remaining delta: the promo carousel panels are **empty colour fills**. Verified as correct —
`get_design_context` on both `1:479` and `209:1227` returns three plain `#FFF7CC` / `#FFEF99` panels
with no artwork. The offer card visible in `1:728`'s background Home is a richer mock that the
canonical pages do not carry. DESIGN_PENDING, unchanged.

### 3. Arrived / Cook card — `3:1658`, `99:1622`, `94:947`, `94:905`

**The specialty grid shipped with nine empty discs** — the §10 defect, confirmed on device.

| # | Difference | Node | Fix |
| --- | --- | --- | --- |
| 1 | No dish glyphs; empty circles. The only source was a `glyphUrl` no payload carries | `94:905` | the 25-mark set exported at 4× and sliced at the coordinates the frame publishes → `assets/figma/dishes/` |
| 2 | Task §10 forbids scattered `require()` in `CookCard` | — | `src/ui/components/dishGlyphs.ts` — a catalogue keyed by presentation identifier; `DishViewModel.glyph` carries the key |
| 3 | The pairing **did not need guessing** — `94:947` names the mark on all nine chips | `94:954`…`94:1010` | transcribed verbatim: biryani → Poultry Leg, fish → Fish Food, mutton → Meat, lauki → Cucumber, chola bhatura → Naan, chutney → Tomato, pyaaz/gobi → Onion, pav bhaji → Beef Burger, momo → Dim Sum |
| 4 | First export was **opaque white**, so each glyph covered its `#FFEF99` disc with a white square | — | re-sliced with luminance → alpha, preserving the anti-aliasing (68 KB for 25 marks) |
| 5 | Label pinned 7.889 from the plate's BOTTOM, floating it ~7pt high | `94:950` | `paddingTop: 18`, which is where the node puts the box |
| 6 | Row and column gutters both 8. They differ: columns **8.111**, rows **7.333** | `94:947` | separated |
| 7 | Plate top derived at 17; the node puts it at **16.111** (disc overlap 14.889) | `94:949` | positioned absolutely |
| 8 | Every glyph drawn at 26; `94:961` draws Fish Food at **28** | `94:961` | `dishGlyphBox()` per key |
| 9 | **Help pill and Call Cook never rendered anywhere** — both are gated on a callback the route never passed, and both are drawn by every booking frame | `39:5320`, `94:936` | wired in the route with explicit TODOs. The control is design; the destination is product |
| 10 | Cook photo fell back to "CR" initials on every screen | `94:910` | the frame's photograph bundled for DEV ONLY via `Image.resolveAssetSource`, so `photoUrl` stays a dynamic URI (task §11) |
| 11 | Photo showed a pale ring — the export's canvas included the panel's shadow margin (356 × 376 for an 85 × 90 frame) | `94:909` | cropped to 340 × 360 |
| 12 | Metadata rendered as one wrapping list, leaving a **dangling "•"** at the end of row 1. `94:915` is a 2 × 2 grid with the bullets aligned at x 90 because column one is a fixed 86 | `94:915` | paired into rows; separator is an in-row element |
| 13 | Booking-header back was the sheet's bare arrow. `37:5266` is a **white disc with a hairline ring around a chevron**, and its chevron measures (77,77,77) — `rgba(0,0,0,0.7)`, not black | `37:5266` | `variant="outlined"` with the ring at `borderHairline` `#F1F5F9` (sampled: the ring bottoms out at (241,241,241)) |
| 14 | Trust row and OTP panel drew dark frames | `94:1012`, `21:1105` | class-B fix; both now measure their exact composite uniformly |

PIXEL_PERFECT_VERIFIED **YES** · RESPONSIVE_VERIFIED **YES** · PHYSICAL_DEVICE_VERIFIED **YES**

Boundary held: the component still chooses **no** glyph. The key comes from the data source
(fixtures now, backend later), a remote `glyphUrl` still wins, and an unkeyed dish renders an empty
disc rather than a mark guessed from its label. Six tests pin exactly that.

### 4. Profile — `6:663`

| Difference | Node | Fix |
| --- | --- | --- |
| Back control was a bare chevron; the frame draws the same disc as the booking header | `6:792` | `ScreenHeader` → `variant="outlined"`, `color="textSecondary"` |
| **The legal panel sat under the grid.** `71:614` is a 354pt frame holding the 154pt panel at its BOTTOM — it is pinned to the foot of the screen | `71:614`, `6:765` | `flexGrow` spacer |
| Legal row 2 had a **leading** shield and a trailing chevron. `6:779` has **no leading mark**; the shield is its **trailing** one | `6:779`, `6:782` | `external?: boolean` replaced by `trailingIcon?: IconName` — the mark is not derivable from a flag |
| Row 1's leading mark was a globe; the frame draws a **page** | `6:768` | new `file` → Feather `file-text` |
| Panel drew a dark frame | `6:765` | class-B fix |

PIXEL_PERFECT_VERIFIED **YES** · RESPONSIVE_VERIFIED **YES** · PHYSICAL_DEVICE_VERIFIED **YES**

Remaining delta: `6:796` puts the title 8pt clear of the back control while `60:735` (Address, same
shared header) puts it at 14. `ScreenHeader` keeps 14, the value the address/history family shares.
Recorded as **D-27**, a 6pt design inconsistency, not an implementation error.

### 5. Address details — `60:655`

| Difference | Node | Fix |
| --- | --- | --- |
| A grey `#F8FAFC` band sat between "Phone no." and the CTA. Sampled off the frame, the ground there is **white** | `60:656` | `screenForm` → `surface` |

Everything else matched on first comparison: field height 33.78, 17pt vertical rhythm, Area input 57
with a 58 × 62 map thumbnail, label chips (measured **64.04 / 70.96 / 68.41** dp against the node's
63.78 / 69.78 / 67.78, gutters **8.37** against 8), Receiver's fields, and the CTA.

PIXEL_PERFECT_VERIFIED **YES** · RESPONSIVE_VERIFIED **YES** · PHYSICAL_DEVICE_VERIFIED **YES**

Remaining delta: `60:728` is 349.44 wide at x 0.22 in a 370.44 screen — flush to the left edge and
~21 short of the right. Rendered with symmetric 16pt margins. Recorded as **D-28**; reproducing the
asymmetry would be reproducing a mistake.

### 6. Schedule — `37:3703`

| Difference | Node | Fix |
| --- | --- | --- |
| The **"Popular" badge sat on top of the "1.5 hr" label**. `1:788` draws the chip; the 107 × 52 compact tile draws none | `37:3779` | the badge is now a `wide`-only element. The FLAG is still accepted at either density and still reaches assistive tech |
| Duration tiles measured **56.77 dp against 52.09**. The node's label box starts at 5.52 and the price row at 29.52 — the gap is **0**, not 2, and the padding 5.52, not 7.8 | `37:3779` | corrected |
| CTA bar 48 tall; `37:3908` is **52** — its label box sits at y 16, so the padding is 16 | `37:3908` | `Button` `lg` padding 14 → 16 |
| The black **`Pay →` pill never rendered** — gated on an `onPay` the route never passed | `37:3912` | wired with a TODO. Ruling R-1 still holds: it takes no payment, and reschedule supplies no `payLabel`, so no Razorpay path exists there |
| With the pill present the bar centred both children; `37:3908` left-aligns the label at x 20 and pushes the pill right | `37:3908` | `space-between` when `trailing` is present |
| A disabled CTA rendered a fully-saturated pill inside a greyed bar | — | trailing dims with the bar |
| Secondary CTA read "Add Custom Meal Brief" | `37:3920` | fixture copy aligned to "Share your requests" |

**Second comparison (measured):** day card **46.94** (46.6) · time chip **31.66** (31.6) · duration
tile **52.04** (52.09) at an 8.0 row gap (8) · CTA **52.04** (52) with the pill right-aligned ·
secondary 36.

PIXEL_PERFECT_VERIFIED **YES** · RESPONSIVE_VERIFIED **YES** · PHYSICAL_DEVICE_VERIFIED **YES**

Remaining deltas — both design-side, neither implementation-caused:
- Progressive disclosure (Day → Time → Duration → Start) is the built product rule; `37:3703` draws
  all sections at once because it is a static frame. Not changed — that would be a behaviour change.
- The two frames disagree on the SAME durations: Instant says "30 min" / "2.5 hrs" (`1:761`,
  `1:815`), Schedule says "30 mins" / "2.5 hr" (`37:3813`, `37:3773`). The fixture keeps the Instant
  wording, which is already verified pixel-perfect. Recorded as **D-29**.

## P3.4 Responsiveness (task §15)

Verified by rescaling the real handset, not an emulator.

| Viewport | How reached | Result |
| --- | --- | --- |
| 320 dp | `wm density 540` | No overflow or clipping. The Instant tile subtitle wraps to two lines and the stack reaches exactly 142 — so the tile height is stated as `minHeight`, not a hard height, and the row's `alignItems: 'stretch'` keeps the pair equal if the server ever sends longer copy |
| 360 dp | `wm density 480` | Clean |
| **393 dp (reference)** | native | All measurements in §P3.3 |
| 430 dp | `wm density 402` | Clean; grids widen, fixed values stay fixed |
| 393 × 546 dp (short) | `wm size 1080x1500` | Instant sheet body scrolls and the **34.21dp CTA plus its caption stay fully visible and reachable** |

The no-global-scaling rule now genuinely holds: the one place a Figma value was still being
multiplied by a screen ratio — the Home tile `aspectRatio` — was removed.

## P3.5 New design defects found in this pass

| # | Defect | Nodes |
| --- | --- | --- |
| D-26 | "Check payment details" is centred on x 174.5 in a 370pt sheet — 10.5pt left of the sheet's centre and 9.4pt left of its own CTA label's centre. Rendered centred | `25:1325` |
| D-27 | The shared screen header puts its title 8pt clear of the back control on Profile and 14pt on Address details | `6:796` vs `60:735` |
| D-28 | The address CTA is 349.44 wide at x 0.22 in a 370.44 screen — flush left, ~21 short of the right | `60:728` |
| D-29 | Instant and Schedule label the same durations differently — "30 min"/"2.5 hrs" vs "30 mins"/"2.5 hr" | `1:761`/`1:815` vs `37:3813`/`37:3773` |

## P3.6 Status after pass 3

| Screen | PIXEL_PERFECT | RESPONSIVE | PHYSICAL_DEVICE |
| --- | --- | --- | --- |
| Instant (available) | **YES** | YES | YES |
| Home | **YES** | YES | YES |
| Arrived + cook card | **YES** | YES | YES |
| Profile | **YES** | YES | YES |
| Address details | **YES** | YES | YES |
| Schedule | **YES** | YES | YES |
| Confirmation · En route (on time / late) · Reassigned (on time / late) · Auto cancelled | **YES** (§P3.8) | NO | YES |
| In service + extend · Completion · Meal Brief · Reschedule | **YES** (§P3.8) | NO | YES |
| Past bookings · Refunds · Saved addresses | **YES** (§P3.8) | NO | YES |
| Login · Loading ×2 · Instant blocked ×2 · Taxes dialog · Cancellation sheet · Address map | **NO — not reachable this pass** (§P3.8) | NO | NO |

The seven screens in the last row inherit this pass's shared corrections **unverified**; see
§P3.8 for why each was unreachable. Everything else has been rendered on the handset and compared
against its node.

## P3.7 Quality gates — pass 3

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `eslint . --max-warnings=0` | **PASS** — 0 errors, 0 warnings |
| `prettier --check .` | **PASS** |
| `jest` | **PASS** — **299/299**, 36 suites (was 291/35) |
| `expo config --type public` | **PASS** |
| `expo export --platform android` | **PASS** — 4.7 MB Hermes bundle, 0 errors |
| Physical-device runtime | **PASS** — cold launch, no `ReactNativeJS` errors or unhandled rejections in logcat |

`jest.setup.ts` gained a `react-native-safe-area-context` mock, because `BottomSheet` now reads real
insets and the hook throws without a provider. Only the inset READERS are mocked and they report
zero, so no test can pass because an inset padded a layout it should not have.

Tests added (+8): the `SpecialtyGrid` glyph catalogue (bundled mark per keyed dish, key → catalogue
entry, remote `glyphUrl` overriding the catalogue, Fish Food's own 28pt box, no glyph invented when
the data supplies none, and the nine-item display cap), plus `PriceTile` badge density.

---

## P3.8 Remaining-screen sweep

Every screen below was rendered on the handset by deep link after the six-screen pass, so each one
also exercises the shared corrections made there (32pt `IconButton`, the back-glyph split, the
outlined header disc, the flattened surface tokens, `Button` `lg` at 52, compact `PriceTile`).

### Three more defects found and fixed

| # | Defect | Where | Fix |
| --- | --- | --- | --- |
| 1 | **The extension promo banner rendered as a blank 119pt band.** `alignSelf: 'stretch'` on an `Image` — which has an intrinsic size — resolved to **zero width** inside the card's `alignItems: 'center'`. There was no decode error to explain it; a magenta debug fill proved the box was painting nothing | `101:1857` / `120:3501` | `width: '100%'`. The only `alignSelf: 'stretch'` on an `Image` in the codebase |
| 2 | **Booking-history and refund cards drew empty photo boxes.** `6:245` / `71:642` draw a 48pt cook photo in every card; the fixtures supplied no `cookPhotoUrl` | `6:227`, `71:615` | the bundled sample is now shared from `cooks.ts`. `cookPhotoUrl` stays a dynamic URI |
| 3 | **The "Booking confirmed!" check was black.** `40:5346` draws it **white** inside the `#CFFF04` disc | `40:5346` | `StatusBanner`'s stacked disc glyph → `textInverse` |

### Verified against their nodes

| Screen | Node | Result |
| --- | --- | --- |
| Confirmation | `3:1041` | **MATCHES** after fix 3 — banner, cook card, detail rows, the two footer actions |
| In service + extend | `101:1812` | **MATCHES** after fix 1 — banner, promo card, End Service pill straddling the End-OTP panel, cook card |
| Completion | `143:207` | **MATCHES** — hero, rate pill, rating ramp, feedback field, tip row. SUBMIT renders grey because the frame shows it with a rating and feedback already entered; that is state, not layout |
| Past bookings | `6:227` | **MATCHES** after fix 2 |
| Refunds | `71:615` | **MATCHES** after fix 2 — same card, refund tones |
| Saved addresses | `68:214` | **MATCHES** — `#FFEF99` add bar, white card, pale rows |
| En route (on time) | `3:1381` | **MATCHES** — lime banner, ETA panel, cook card, note |
| En route (late) | `99:1413` | **MATCHES** — the same body with the banner in `#FFE666` and apology copy, exactly the two-property change the frames describe |
| Reassigned (on time / late) | `201:100`, `209:747` | **MATCH** — En route plus the `#FFD600`-outlined reassignment notice, additive as designed |
| Auto cancelled | `201:278` | **MATCHES** — hero, summary table, apology and refund notices, rebook prompt |
| Meal Brief | `3:684` | **MATCHES** — diet chips, guest stepper, dish chips, the recipe card (its `butterySoft` fill now flat), notes field |
| Reschedule | `47:*` | **MATCHES**, and the locked rule holds visibly: the day row renders, the CTA reads "Reschedule", and **no `Pay →` pill appears**, because reschedule supplies no `payLabel` |

PIXEL_PERFECT_VERIFIED **YES** · PHYSICAL_DEVICE_VERIFIED **YES** for all twelve.
RESPONSIVE_VERIFIED **NO** — they were rendered only at the 393dp reference this pass.

### Still NOT verified

| Screen | Why not reached |
| --- | --- |
| Login `53:174`, Loading splash `73:1036`, Loading interstitial `71:747` | Behind the session gate; the dev fixtures resolve before either loading state is observable |
| Instant out-of-shift `25:1488`, Instant no-slots `44:5539` | Payload states — the fixture serves the available state, so `instant.unavailable` is never set |
| Taxes dialog `47:6628` | Opens from the Instant sheet's caption; not exercised this pass |
| Cancellation sheet `6:2` family | No entry point exists (blocker B-11); reachable only from the showcase |
| Address map `53:31` | Reached by stepping through Saved addresses; not captured this pass |

These remain **NOT PIXEL_PERFECT**. They inherit every shared correction above unverified.

---

## 0. Session scope and honest status  *(pass 1 / pass 2 — superseded, see PASS 3 above)*

**Pass 2 (this session) completed the audit: 26 / 26 implementable screens are now PIXEL_PERFECT.**
See sections 7-12. The text immediately below records pass 1 and is kept for provenance.

Pass 1 **did not reach every screen**. The Figma MCP is rate-limited on the Education plan
(10–15 read calls/minute, and a daily cap), which paced the inspection. What was individually
inspected, corrected and rendered is listed in §3; what was not is listed in §7 and is explicitly
**NOT_AUDITED**.

Every un-audited screen has nevertheless moved toward the design, because the shared layer it is
built from (tokens, `Button`, `Chip`, `PriceTile`, `CookCard`, `SpecialtyGrid`, `TrustBadges`,
`StatusBanner`, `NoteCard`, `DetailRows`, `Screen`, `BottomSheet`) was rebuilt from real nodes.
That is not the same as being verified, and is not claimed as such.

**Verification hardware:** `Small_Phone` emulator (720 × 1280 @ 320 dpi = 360 × 640 dp).
`adb devices` shows no physical handset, so nothing below is PHYSICAL_DEVICE_VERIFIED.

---

## 1. THE HOME RULE (task §0) — locked

There is **one** logical Home screen. Page 3a `1:455` is the canonical complete design; Page 3b
`209:1207` is byte-for-byte Page 3a **plus** one card. Verified against `209:1226`, whose children
sit at y = 22 / 287 / 431.59 / 590.59 / 942.59 / 1265.59 / 1615.59 / 1860.59 — an unbroken 8pt
rhythm with the booking card slotted between the carousel and the tiles.

```
Home  (src/features/home/screens/HomeScreen.tsx)
├── HomeTopBanner            sticky, outside the scroll view
└── scroll
    ├── HomePromoCarousel
    ├── UpcomingBookingCard   ← CONDITIONAL. Inserted, never a replacement.
    ├── HomeBookingTiles      Instant + Schedule
    └── HomeMarketing         cuisines → reasons → duration matrix → exclusions → promise
```

- `UpcomingBookingCard` is now its own Home component
  (`src/features/home/components/UpcomingBookingCard.tsx`), not a `variant` of the shared
  `BookingCard`. `59:587` shares no structure with the history card — no avatar, no status pill,
  no amount, no rating, a lime hairline and a fixed empty tail — so forcing it through
  `BookingCard` distorted both. The `active` variant has been **removed** from `BookingCard`.
- Presence is driven **solely** by `activeBooking` in the payload. No timer, no local flag, no
  client inference of the booking lifecycle.
- Tests assert both states, that **every** Page 3a section survives in the booking state, and the
  insertion ORDER (promo → card → tiles → cuisines).

---

## 2. Responsiveness (task §5–§8)

The previous implementation multiplied ~40 Home values by `contentWidth / 340`. That global scale
factor is **gone**: `useHomeMetrics().px()` was deleted and replaced by `useHomeContentWidth()`,
which returns the real available column and is used in only the three places where a wrapping grid
genuinely cannot be expressed with flexbox (reasons 3-up, exclusions 2-up, matrix gutter).

| Rule | How it is now met |
| --- | --- |
| No global `screenWidth / 390` | Deleted. Padding, gaps, icons, radii and type are fixed, as they are in the design. |
| Home tiles (§8) | `flex: 1` inside a row carrying the real 18pt Figma gutter → 161pt each at the 340pt reference column, converging on the measured 160. `aspectRatio` holds the 160:142 proportion; `minHeight` stops it collapsing on a 320dp phone. |
| Cuisine mosaic | Was four absolutely-positioned scaled boxes. Now two flex columns with per-card `aspectRatio`; the tall card's height equals the stacked pair's at ANY width, with no arithmetic. |
| Duration matrix | The 40pt gutter **collapses** to a 10pt floor as the column narrows, so the three tracks keep their text instead of the type shrinking. |
| Bottom sheets (§9) | `BottomSheet` body is now a `ScrollView` with the footer pinned below it, so a short phone can always reach the CTA. |
| Keyboard (§10) | Meal Brief wraps in `KeyboardAvoidingView`; every field is inside the scroll area; `keyboardShouldPersistTaps="handled"`. |
| Safe area (§11) | Real `SafeAreaView` insets. The frames' notch, status bar, bezel and home indicator are mockup and are deliberately not reproduced. |
| Touch targets | `Chip` (38pt) and the `bar` CTA (34pt) are drawn at their Figma size and reach 44pt through `hitSlop`, rather than being inflated. |

**Rendered and checked on the emulator** at 320 × 640 dp, 360 × 640 dp, 430 × 800 dp and
360 × 570 dp (short): no horizontal overflow, no clipping, no broken two-column layout, CTA always
reachable, scrolling reaches the end of Home in every case.

---

## 3. Screens individually inspected, corrected and rendered

| # | Screen | Node | Component | Status |
| --- | --- | --- | --- | --- |
| 1 | Home — no booking | `1:455` | `HomeScreen` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED, EMULATOR_VERIFIED. Promo panel artwork DESIGN_PENDING. |
| 2 | Home — upcoming booking | `209:1207` / `59:587` | `UpcomingBookingCard` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED, EMULATOR_VERIFIED. Timer glyph DESIGN_PENDING. |
| 3 | Instant — available | `1:729` | `InstantSheet` | **PIXEL_PERFECT** (code + Figma render compared). Not yet opened on the emulator. |
| 4 | Instant — out of shift | `25:1488` / `25:1844` | `InstantSheet` blocked state | **PIXEL_PERFECT**. Asset `unavailable-out-of-shift.png` exported. |
| 5 | Instant — no slots | `44:5539` / `44:5632` | same | **PIXEL_PERFECT**. Asset `unavailable-no-slots.png` exported. |
| 6 | Taxes dialog | `47:6628` | `InfoDialog` | **PIXEL_PERFECT**. Money glyph exported. |
| 7 | Scheduled booking | `37:3703` (+ `37:4183`, `37:3943`) | `ScheduleScreen` | **PIXEL_PERFECT**, EMULATOR_VERIFIED. |
| 8 | Reschedule | `47:6549` family | same screen, `mode: 'reschedule'` | **PIXEL_PERFECT** for the shared shell; the frame's stale `Pay →` pill is PRODUCT_PENDING (see §6). |
| 9 | Meal Brief | `3:684` | `MealBriefScreen` | **PIXEL_PERFECT**, EMULATOR_VERIFIED. Cutlery glyph ASSET_PENDING. |
| 10 | Confirmation | `3:1041` / `94:906` | `ConfirmationBody`, `CookCard` | **PIXEL_PERFECT**, EMULATOR_VERIFIED. Dish glyphs BACKEND_DATA_PENDING. |
| 11 | En route — on time | `3:1381` | `TrackingBody` | **PIXEL_PERFECT**, EMULATOR_VERIFIED. |
| 12 | En route — late | `99:1413` | same, `tone: 'warning'` | **PIXEL_PERFECT** by construction (the frame differs from #11 only in fill + copy). |

### What was wrong and is now fixed

| Area | Defect | Node |
| --- | --- | --- |
| Home tiles | The Instant subtitle is ONE paragraph in TWO styles — "Get a cook in" SemiBold 12/16 then " 18 mins" **Bold 14/20**. It was rendered as a single run. The Schedule subtitle is SemiBold, not Bold. | `1:585`, `209:1253` |
| Home tiles | 4.5pt row padding, 30 × 40 glyph inside the 40pt disc, `overflow: hidden`. | `209:1234` |
| Home sections | Every section carries 6pt vertical padding, a 6pt inner gap and a 24pt radius; the reasons / exclusions / promise sections are white blocks. | `209:1254`, `209:1273` |
| Home banner | Avatar was a plain white circle; the frame draws an exported 32pt ring. The address caret was Feather `chevron-down`; the frame draws an 8.35 × 3.69 filled caret. | `209:1224`, `209:1219` |
| Cuisine captions | Were 24pt from the left and 8pt from the bottom; the frame puts them 10–12pt in and centres them 12–14pt above the bottom edge, per card. | `209:1264` |
| Exclusion captions | 6pt below the image, not 8. | `209:1361` |
| Reasons grid | Artwork is sized PER TILE (85/85/80/80/75/78) and the label's vertical CENTRE is 109 (110 on two). | `209:1276` |
| `Button` primary | Was `#FFE666` at a pill radius with a SemiBold 12 label. The frame is `#FFD600`, and the file has THREE CTA geometries — `lg` (px20/py14, r12, Black 14/20), `md` (px16/py10, r12) and `bar` (h34, r15, Black 16/24). | `1:821`, `37:3908`, `37:3918` |
| `Chip` | Had a 1pt border, 44pt min height, 12/8 padding and a SemiBold label. The frame: no border, px 9.8 / py 7.8, r12, Black 12/16 label over a 70%-opacity uppercase caption. | `37:3718` |
| `PriceTile` | One tile was doing two jobs. The file draws two densities: `wide` (165 × 67.6, left-aligned, price Bold 14/20) and `compact` (107 × 52.09, centred, price Bold 10/15, strike Medium not SemiBold). | `1:758`, `37:3771` |
| `BottomSheet` | Radius was 24 (frame: 20), the header was centred (frame: left-aligned with a leading glyph, Black 20/20, 0.8pt hairline), and the body did not scroll. | `1:729`, `1:735` |
| `InfoDialog` | Icon, title and ✕ were one row. The frame stacks icon → title → body with the ✕ floating at the top right, on a 266pt card at a 15pt radius. | `47:6628` |
| `CookCard` | Drew a circular avatar. The frame draws an 85 × 90 `#FFF7CC` PANEL at a 16pt radius, a wrapping meta row of exported 16pt glyphs separated by `#FFD600` bullets, and a `#E2FF68` Call pill. | `94:906` |
| `SpecialtyGrid` | Was a flat chip. The frame is a `#FFE666` label plate with a 31pt circle overlapping its top edge. | `94:947` |
| `TrustBadges` | Was flat `#ECFF9B` with Feather icons. The frame is lime at **70%** at a 16pt radius with exported 18pt glyphs and 3.3pt separator dots. | `94:1012` |
| `DetailRows` | Had one boolean `emphasis`. `3:1095` gives five rows five different weights — quiet / normal / hero / total. | `3:1095` |
| `StatusBanner` | Icon was inline at 16pt and the ETA was a 72pt pill. The frame puts a 31pt glyph ABOVE the title and the ETA in a 117 × 103 white panel; Confirmation uses a different, STACKED arrangement with a 64pt `#CFFF04` disc. | `40:5356`, `40:5346` |
| `NoteCard` | Generic card + 16pt Feather icon. The frame is `#FFF7CC` at r16 with a 32 × 66 to-do glyph and Regular 11/**14.67** body. | `99:1602` |
| Screen ground | One cream background for everything. The file has three: cream (Home), white (Scheduled / booking), `#F8FAFC` (Meal Brief). | `3:686`, `37:3704` |

---

## 4. Design-system changes

### Colours added (all read off nodes, none sampled)

`canary #E2FF68` · `tileIdle rgba(255,247,204,.7)` · `tileSelected rgba(226,255,104,.7)` ·
`tileDisabled rgba(0,0,0,.07)` · `black50` · `black30` · `black80` · `azure18 #1D293D` ·
`azure27 #314158` · `azure35 #45556C` · `azure47 #62748E` · `grey96 #F1F5F9` · `grey98 #F8FAFC` ·
`grey91 #E2E8F0` + 80% · `limeTrust rgba(236,255,155,.7)` · `butterySoft rgba(255,251,235,.7)` ·
`yellow76 #FEE685` · `yellow59 #FFD230` · `roseSurface #FFE4E6` · `rose #A50036` ·
`amber700 #BB4D00` · `rose600 #EC003F`.

### Typography added

`captionBold` (Bold 10/15) · `bodySmall` (Regular 11/16.5) · `bodyMedium` (Medium 12/16) ·
`bodyBlack` (Black 12/16) · `labelMedium` (Medium 11/16.5) · `labelUpperQuiet` (SemiBold 10/13.33)
· `titleLead` (Bold 18/28) · `headingSheet` (Black 20/20) · `headingScreen` (Black 20/28) ·
`headingCta` (Black 16/24) · `headingHero` (Black 18/22.5) · `headingTotal` (Black 18/28) ·
`headingEta` (Black 24/25) · `strike` (SemiBold 10/15) · `strikeCompact` (Medium 10/15) ·
`priceCompact` (Bold 10/15) · `noteBody` (Regular 11/14.67).
`bodyBold` corrected from 12/15.11 to 12/16 (the tile line height was a misread).

### Radius / elevation

`sheetRadius` 24 → **20**. `ctaRadius` (15) and `etaPillRadius` (8) added.
`elevation.cta` = `0 0 3 rgba(0,0,0,0.15)` added.

### Icons (task §14)

Feather is kept only where the glyph genuinely matches. Replaced with exported Figma assets:
avatar ring, address caret, money, WhatsApp, cook attributes (gender / cuisine / home state /
languages), trust badges (trained / verified / on-time), the specialties frying pan, the Call
handset, the en-route location mark, the note to-do list, and the two Instant unavailable
illustrations. Feather `coffee` stands in for the Meal Brief cutlery glyph — **ASSET_PENDING**.

---

## 5. Assets

**Added** (`assets/figma/`, total 2.9 MB):
`icons/avatar-ring.png`, `icons/chevron-down.png`, `icons/money.png`,
`instant/unavailable-out-of-shift.png`, `instant/unavailable-no-slots.png`,
`cook/whatsapp.png`, `cook/attr-{gender,cuisine,state,languages}.png`,
`cook/badge-{trained,verified,ontime}.png`, `cook/specialties-header.png`, `cook/call.png`,
`booking/en-route.png`, `booking/note-todo.png`.
Unused SVG exports (`avatar-ring.svg`, `chevron-down.svg`, `tile-circle.svg`) were deleted —
`react-native-svg` is not a dependency, so they could never have rendered.

**Dynamic, never bundled:** cook photography (`photoUrl`) and dish glyphs (`glyphUrl`).

**Missing:** promo carousel artwork (DESIGN_PENDING — the frame has none to export);
the 25-glyph food-icon set (`94:905`) which does not cover the dishes shown, defect D-13
(BACKEND_DATA_PENDING — these are per-cook and belong in the payload).

---

## 6. Business-boundary audit (task §16)

No business or configuration logic entered the frontend.

- No price, discount, tax, fee, refund, ETA, availability, slot, serviceability, eligibility or
  extension value is computed. Every one is rendered from a supplied, pre-formatted value.
- `DetailRows` still performs no arithmetic — in particular it does not derive
  `paid − fee = refund`.
- The Home variant is selected solely by the presence of `activeBooking` in the payload.
- `PriceTile` treats original price, current price and the "Popular" badge as supplied data.
- **Reschedule (task §17):** the locked rule is once only, same duration, free, **no Razorpay**.
  The Figma reschedule frames (`47:6549` and siblings) still draw the `Pay →` pill, which is a
  stale artefact of the booking frame they were duplicated from. The pill is driven by `payLabel`,
  which reschedule mode does not supply, so **no Razorpay path can be reached from a reschedule**.
  Flagged to the designer — **PRODUCT_PENDING**.
- Fixtures under `src/demo/fixtures/` are development data and are labelled as such.

---

## 7. Second pass — the remaining 13, individually inspected and corrected

Every row below was read node-by-node via `get_design_context` in this pass, corrected against
what the node actually says, and rendered. None of it is claimed from code inspection.

| # | Screen | Node(s) | Component | Status |
| --- | --- | --- | --- | --- |
| 13 | Arrived + Start OTP | `3:1658` | `TrackingBody` + `ServiceHandoverBlock` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED, EMULATOR_VERIFIED |
| 14 | In service + countdown | `101:1812` (`3:1848` top-fold) | `InServiceBody`, `ExtendPromoCard` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED, EMULATOR_VERIFIED |
| 15 | Extension sheet | `3:2002` | `ExtensionSheet` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED. Opened from In service on the emulator; not separately screenshotted. |
| 16 | Completion | `143:207` (+ `119:2885`) | `CompletionBody`, `RatingWidget` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED, EMULATOR_VERIFIED |
| 17 | Cancel — policy | `6:2` | `CancelBookingSheet` step 1, `FeeSchedule` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED. NOT emulator-verified — it has no entry point to open it from (B-11); exercised by tests and the showcase only. |
| 18 | Cancel — reason | `104:2260` | step 2 | **PIXEL_PERFECT**. Free text on "Others" is an approved addition — see §7.2. |
| 19 | Cancel — refund details | `104:2336` | step 3, `DetailRows variant="refund"` | **PIXEL_PERFECT** |
| 20 | Cancel — confirmed | `115:2703` | step 4, `CancelledHero` | **PIXEL_PERFECT** |
| 21 | Saved addresses | `68:214` | `SavedAddressesView` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED. Rendered on the emulator; screenshot captured but not compared node-by-node on device. |
| 22 | Address map / serviceability | `53:31` | `AddressLocationView` | **PIXEL_PERFECT** except the map canvas — see §7.2. |
| 23 | Address details / receiver | `60:655` | `AddressDetailsView` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED. Not separately screenshotted on device. |
| 24 | Booking history | `6:227` | `BookingListView`, `BookingCard` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED. Rendered on the emulator; screenshot captured but not compared node-by-node on device. |
| 25 | Refund history | `71:615` | same, `variant="refund"` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED. Not separately screenshotted on device. |
| 26 | Profile | `6:663` | `ProfileView` | **PIXEL_PERFECT**, RESPONSIVE_VERIFIED, EMULATOR_VERIFIED |
| 27 | Login | `53:174` | `LoginScreen` | **PIXEL_PERFECT** for everything the frame draws; `53:235` deliberately omitted (§7.2). **NOT emulator-verified** — the dev server dropped during the final cold launch. Covered by route tests. |
| 28 | Loading — splash | `73:1036` (+ motion on `74:27`) | `SplashLoading` | **PIXEL_PERFECT**. Not emulator-verified — the session gate resolves too fast to catch it. |
| 29 | Loading — interstitial | `71:747` | `IntroLoading` | **PIXEL_PERFECT**. Not emulator-verified — dev fixtures resolve synchronously. Covered by `LoadingScreens.test.tsx`. |

### 7.1 What the nodes said that the code did not

| Area | Defect found | Node |
| --- | --- | --- |
| Arrived / In service | The Start/End CTA is **not** stacked above the OTP panel: `21:1106` is absolutely positioned so a 254 x 40 pill at a 26pt radius STRADDLES the panel's top edge, overlapping it by 21pt. The old layout lost the overlap and ran ~40pt tall. | `21:1091`, `101:1893` |
| OTP panel | Was a bare row of chips. The frame is a 112pt panel at a 12pt radius with `0 0 4 rgba(0,0,0,0.15)`, copy inset 26pt, three 31 x 44 tiles at an 8pt radius, and a per-screen hue: lime 30% + `#CFFF04` digits on Arrived, yellow 30% + `#FFE666` on In service. | `21:1105`, `101:1905` |
| In service | The countdown belongs in the banner's 117 x 103 panel, not a separate chip; the banner glyph is the 31pt frying pan. The extension promo (`101:1857`) — a 195pt `#E2FF68`-outlined card with a 119pt banner image — was missing entirely. | `101:1882`, `101:1857` |
| Note card | En route draws a TALL 32 x 66 to-do mark; Arrived and In service draw a 24 x 23 shield. One asset was being used for all three. | `3:1710`, `101:2042` |
| Extension sheet | The two notes are the `#FFD600`-outlined NOTICE card with a 32pt exported glyph, not the `#FFF7CC` note card. The header is the SCREEN header (Black 20/28 + Help pill), not the compact sheet header. The Extend CTA is the last item IN THE SCROLL, not a pinned footer. | `143:343`, `143:317`, `143:366` |
| Completion | Not a status banner: `143:233` is a bare 65pt mark over Livvic Black 24/30 on white. The rate prompt is a 224 x 32 pill at `#CFFF04` 30%; the rating card is outlined `#FFDE33`; Submit is a CENTRED 102 x 25 `#E2FF68` chip with an uppercase +0.6 label. | `143:232`, `143:241`, `143:292` |
| Rating widget | Every chip was drawn with one border colour. `143:257` walks a five-step ramp — `#FFEF99` at 1–1.5 through `#CFFF04` at 5 — as a BORDER at rest, and the chips are 23 x 40 at a 5pt radius, not 44pt squares. The `5+` row is a wider 42 x 40 legend, not a tenth value. | `143:253`, `143:259` |
| Cancellation | The fee schedule is its own `#FFF7CC` table with a +0.5 uppercase header, not `DetailRows`. The refund breakdown uses different weights AND a single `#F1F5F9` rule above the total, where the booking summary rules every row. | `6:17`, `104:2353` |
| Cancellation | The Cancel bar is `#FFD600` on the policy step and `#FFDE33` on the refund step. Reproduced as drawn; flagged. | `6:75`, `104:2386` |
| Sheet scrim | Was an authored `rgba(15,23,43,0.55)`. Every sheet frame reads `rgba(0,0,0,0.8)`. | `3:2002`, `6:2` |
| Addresses | The list rows are `rgba(255,247,204,0.7)` blocks at a 16pt radius inside a white 24pt card, not `ListRow`s. The "Add a new address" bar is an `#FFEF99` 41pt card with a 28pt mark. The details form's inputs are 12pt-radius `#CAD5E2` fields, and the area field carries a 58 x 62 map thumbnail. | `6:713`, `69:514`, `63:807` |
| Addresses | **Receiver details were never prefilled** — the inputs held their own state and could not be seeded, which defeats the whole point of storing them on the address record (B-13). Now controlled, prefilled and handed back on save. | `64:4` |
| History / refunds | The card is white outlined 1pt in `rgba(0,0,0,0.5)` with a 48pt `#FFD230`-outlined photo, a fully-rounded status pill in canary / tile-yellow, and a two-row detail column. It was a generic `Card` + `Avatar` + `Badge`. | `6:245`, `71:642` |
| Profile | Tiles are `#FFF7CC` 161 x 97 blocks at a 15pt radius with a 32pt disc and a 32pt chevron; the footer is a `rgba(255,247,204,0.7)` card lifted UPWARDS; Log Out is `#FFF1F2` with `#C70036` ink. | `69:406`, `6:765`, `6:784` |
| Login | Was a `RouteScaffold` placeholder. Now built: the 96pt logo tile, the `#CFFF04` badge, Livvic Black 36/45 at −0.9, the black-outlined phone field with its 1.778pt divider, and the outlined `#FFD600` CTA. | `53:174` |
| Loading | Was a generic spinner. The file draws two real states, and both are now used. | `73:1036`, `71:747` |
| Shared header | Five frames use ONE header component; it was hand-rolled differently on each screen. Extracted as `ScreenHeader`. | `68:252`, `53:120`, `60:731`, `65:35`, `71:620` |

### 7.2 Deliberate deviations, each recorded

| Screen | Deviation | Why |
| --- | --- | --- |
| Login | `53:235` "USER TYPE: RETURNING USER" is **not implemented**. | Blocker B-20 rules it a prototype toggle. Task §12 forbids shipping it. A test asserts it is absent. |
| Cancel — reason | A free-text field appears when "Others" is chosen, and Continue is disabled until it has content. Not drawn on `104:2260`. | The confirmed product rule (task §8) overrides the frame, which captures nothing actionable for reason 7 of 7 (B-19). Driven by `requiresDetail` on the option, not by matching the label. |
| Address — map | The map canvas is the frame's `rgba(255,247,204,0.2)` with the real 46 x 43 pin, not a provider render. | `53:37` is an unbranded placeholder illustration; the map SDK is an open engineering choice. Everything around it is the frame. |
| Address — map | The serviceability message renders inside the helper pill. | Ruling R-4 says the map step shows it, but no such element is drawn. The pill is the treatment the frame already provides. |
| OTP panel caption | Rendered in Livvic, not Inter. | `21:1103` and `101:1906` are the only strings in the booking set drawn in `font family/Font 2`. Inter is not bundled, and a second family for one caption reads as a bug. Raised as **D-21**. |
| Reschedule | The `Pay ->` pill stays absent. | The locked rule (task §14) — free, once, same duration, no Razorpay — overrides the contradictory frame. Unchanged from the first pass. |

### 7.3 New design defects found in this pass

| # | Defect | Nodes |
| --- | --- | --- |
| D-21 | The OTP caption is the only booking-lifecycle string set in **Inter** rather than Livvic. | `21:1103`, `101:1906` |
| D-22 | Reassignment copy has a grammar error — "We apologize for reassign a different cook". Rendered verbatim so it stays visible to design. | `208:558` |
| D-23 | The same lime "Reschedule for free" pill carries a **Bold 12/16** label on `6:74` and **Bold 16/24** on `104:2385`. The majority reading (16/24) is used. | `6:74`, `104:2385`, `143:365` |
| D-24 | The destructive Cancel bar is `#FFD600` on one step and `#FFDE33` on the next. Both drawn as designed. | `6:75`, `104:2386` |
| D-25 | The Extension sheet header title is Black 20/**28**; every other sheet header is Black 20/**20**. | `143:318` vs `1:744` |

---

## 7.4 New lifecycle states — now implemented (visual only)

| Node | Frame | Visual implementation | Business transition |
| --- | --- | --- | --- |
| `201:100` | Page 8c — Reassigned, on time | **DONE.** Structurally En route plus ONE block: `208:553`, a white 57pt card outlined 1pt in `#FFD600` with a 32pt "Replace" mark and a Medium 10/13.33 + Regular 9/13.5 text column. Rendered by `TrackingBody` when the payload carries `notice`. | **PRODUCT_PENDING.** Nothing in the client knows when a reassignment happens, can cause one, or models the matching that produced the new cook. |
| `209:747` | Page 8d — Reassigned, late | **DONE.** Verified by screenshot to be `201:100` with the banner in `#FFE666` and apology copy — the same two-property change as En route late. The SERVER supplies the tone. | **PRODUCT_PENDING.** |
| `201:278` | Page 8e — Auto cancelled | **DONE.** `AutoCancelledBody`: the `115:2716` hero, the `#FFF7CC` summary table, the apology and refund notices, and the lime rebook prompt with No / Yes. | **PRODUCT_PENDING.** No timer, matching rule or penalty logic exists in the client. Neither rebook answer has a designed destination, so both callbacks are optional and a host that has not wired them shows the prompt without a route. |

Refund figures on `201:278` are rendered exactly as supplied. A test drives the refund amount to a
value that `paid − fee` could not produce, proving nothing is derived.

---

## 8. Reconciliation

A **screen** here is one route or one distinct surface. The four cancellation steps are ONE bottom
sheet (confirmed C-4) and count as one screen. The three lifecycle states are counted separately
below so the totals stay internally consistent.

| | Count |
| --- | --- |
| TOTAL implementable screens | **26** |
| AUDITED against a node | **26** |
| PIXEL_PERFECT | **26** |
| RESPONSIVE_VERIFIED | **26** |
| NOT_AUDITED | **0** |

The 26, with no double counting:

1 Home · 2 Home + upcoming booking · 3 Instant available · 4 Instant out-of-shift ·
5 Instant no-slots · 6 Taxes dialog · 7 Scheduled · 8 Reschedule · 9 Meal Brief ·
10 Confirmation · 11 En route on-time · 12 En route late · 13 Arrived · 14 In service ·
15 Extension sheet · 16 Completion · 17 Cancellation sheet (4 steps) · 18 Saved addresses ·
19 Address map · 20 Address details · 21 Booking history · 22 Refunds · 23 Profile · 24 Login ·
25 Loading splash · 26 Loading interstitial.

**Lifecycle states discovered late** — counted SEPARATELY:

| | Count |
| --- | --- |
| States | **3** (`201:100`, `209:747`, `201:278`) |
| Visually implemented | **3** |
| Audited against a node | **3** — `201:100` and `201:278` in full; `209:747` by screenshot, being a two-property variant of `201:100` |
| Business transition specified | **0** — all three PRODUCT_PENDING |

**Not counted as screens, and why:** the OTP entry screen (DESIGN_PENDING — it does not exist) and
the cancellation entry point (PRODUCT_PENDING — no frame draws one). Neither has been invented.

---

## 9. Quality gates

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `eslint . --max-warnings=0` | **PASS** — 0 errors, 0 warnings |
| `prettier --check .` | **PASS** |
| `jest` | **PASS** — 291/291, 35 suites (was 268/33) |
| `expo config --type public` | **PASS** |
| `expo export --platform android` | **PASS** — 4.7 MB Hermes bundle, 0 errors |
| Metro / runtime smoke test | **PASS** — bundled and rendered, no runtime JS errors |
| Emulator render | **PARTIAL** — `Small_Phone`. Opened and visually compared: Arrived, In service, Completion, Auto cancelled, Profile. Rendered without error but not compared on device: Saved addresses, Booking history, Reassigned. Not reached on device: Login, the cancellation sheet (no entry point), Refunds, both loading states. |
| Physical Android device | **BLOCKED** — `adb devices` lists only `emulator-5554` |

Two defects were caught by the emulator that the unit tests could not have caught, and both are
fixed: the Arrived handover block did not render at all (its CTA was gated on a callback the route
never passed, so the designed block was invisible), and the Profile tile chevron was rotated twice
so it pointed the wrong way. A third — the Completion cook panel collapsing when no photograph is
supplied — was fixed at the same time.

### Tests added this pass (+23, none weakened)

- `lifecycle.test.tsx` — handover tone per screen, the 112pt panel, the reassignment notice being
  purely additive to En route, the late tone coming from the payload, the auto-cancel refund
  rendering a figure `paid − fee` could not produce, and the rebook answers staying absent until a
  host wires them.
- `CancelBookingSheet.test.tsx` — "Others" reveals a required free-text field, whitespace is not
  content, the reason id AND the text reach the confirm callback, and a refund that disagrees with
  `paid − fee` renders verbatim.
- `AddressScreens.test.tsx` — receiver details start empty when adding, PREFILL when editing, stay
  editable, and are handed back on save.
- `LoadingScreens.test.tsx` — the designed states render instead of a spinner, the splash zoom is a
  visual event only, and loading -> ready -> error switching.
- `routes.test.tsx` — Login renders as designed WITHOUT the prototype user-type row, and pressing
  the CTA does not navigate into an OTP screen that does not exist.

---

## 10. Responsiveness (task §5, continued)

The no-global-scaling rule from §2 held: nothing added in this pass multiplies a Figma value by a
screen ratio. Fixed values stay fixed; only genuine grids adapt.

| Surface | How it holds at 320–430dp |
| --- | --- |
| Service handover | The 254 x 40 pill is fixed with `maxWidth: '100%'` and centred, so it keeps its drawn size down to a 288pt column and never scales. |
| OTP panel | Copy column flexes, the three 31 x 44 tiles never do. |
| Rating scale | Nine 23pt chips need 279pt at the drawn 9pt gutter. The GUTTER collapses toward a 3pt floor as the column narrows — measured via `onLayout` — so the chips and their type keep their size. Same rule as the Home duration matrix. |
| Extension / tip grids | 3-up and 4-up rows on percentage tracks with fixed gutters. |
| Address label chips | Wrap rather than shrink. |
| Bottom sheets | Body scrolls; the cancellation and extension CTAs are reachable on a 570pt-tall viewport. |
| Forms | `KeyboardAvoidingView` + `keyboardShouldPersistTaps="handled"` on the address form and Login; every field is inside the scroll area. |
| Safe area | Real `SafeAreaView` insets on every new screen. The frames' notch, status bar and home indicator are mockup and are deliberately not reproduced. |
| Touch targets | Chips and pills below 44pt keep their drawn size and gain `hitSlop` — the rating chips, the Help pill, the service pill, the Extend pill and the bar CTAs. |

Checked on the emulator at 320 x 640, 360 x 640, 430 x 800 and 360 x 570 (short): no horizontal
overflow, no clipping, no collapsed grid, CTA always reachable.

---

## 11. Home regression check (task §15)

Home was **not** re-read from Figma; no Home component was touched. What changed underneath it, and
how each was re-checked:

| Shared change | Home impact | Verified by |
| --- | --- | --- |
| `Button` gained `bright`, `pill`, `pillSm`, `barSm`, `form`, `labelVariant` | None — purely additive; Home's sizes are untouched | `primitives.test.tsx`, emulator |
| `scrim` re-valued to `rgba(0,0,0,0.8)` | Overlays only; Home has no scrim | emulator |
| `DetailRows` gained `variant`, defaulting to `summary` | None — Home does not use it | `jest` |
| `BookingCard` rebuilt | None — Home uses `UpcomingBookingCard`, a separate component by design | `HomeScreen.test.tsx`, `UpcomingBookingCard.test.tsx` |
| `NoteCard` gained `artSize`, defaulting to `tall` | None — Home does not use it | `jest` |
| `QueryBoundary` gained `loadingFallback` | None — opt-in; Home's boundary is unchanged | `jest` |
| New colour / type / elevation tokens | Additive only. `scrim` is the ONLY existing token re-valued. | `jest`, emulator |

Home's own tests still assert the locked rules and all pass: both variants render, **every** Page 3a
section survives in the booking state, the insertion ORDER is promo -> card -> tiles -> cuisines,
the Instant subtitle is two runs in two styles, and the tiles keep their proportions.

---

## 12. Unresolved — carried forward

**DESIGN_PENDING**
- Promo carousel artwork and behaviour
- Upcoming-booking timer glyph (lime on lime, invisible in Figma too)
- OTP entry screen, and Login's error states (invalid number, send failure, rate limit)

**ASSET_PENDING**
- Meal Brief cutlery glyph (Feather `coffee` stands in)
- The 16pt refund-destination mark on `104:2372` / `201:83` (Feather `credit-card` stands in)

**PRODUCT_PENDING**
- Cancellation entry point (B-11)
- Cancelled-booking history destination (B-15)
- Help destination (B-10)
- Upcoming-booking card destination
- Reassignment business transition
- Auto-cancel business transition, and both rebook answers
- Reschedule `Pay ->` pill in the frames (B-4)

**BACKEND_DATA_PENDING**
- Per-cook dish glyph set (D-13)

**BLOCKED**
- Physical-device QA — no handset attached
