# Figma pixel-perfect audit

**Source of truth:** Figma `sbIXeBfaMzUFUz2NYJIJTm` — "V0_-user-app (4)", page `0:1` ("User App"),
and within it **only the seven finalized sections** listed in §P7.1. Superseded revisions, newest
first: `fsgGIC4c6DJulb64TTt9yg`, `IT5DnVMAO750PzuYaC2rxo`, `1kd1u3WEc00SENkToIPloW`,
`QMgajesW22fQcUbs7TKspS`, `BTPW14a7M69ySPZxdkc2yn`. Where any of those disagree with the current file, **the current file
wins** for every visual decision. They remain valid only for backend rulings and history.
Access via `figma-desktop` MCP, student Full seat (`lakshay58csea24@bpitindia.edu.in`).

> **Scope ruling (pass 6).** The file contains 9 sections and 3552 frames, including iterations,
> experiments and duplicates. Only the six sections in §P6.1 are authoritative. Everything else is
> `NON_FINAL_FIGMA_ITERATIONS = OUT_OF_SCOPE` — recorded, not implemented, and not permitted to
> block the pass verdict. Where a screen exists both inside a finalized section and elsewhere, the
> **in-section frame wins**, and measurements are never mixed between the two.

Status vocabulary: **PIXEL_PERFECT** · **RESPONSIVE_VERIFIED** · **ASSET_PENDING** ·
**DESIGN_PENDING** · **PRODUCT_PENDING** · **BACKEND_DATA_PENDING** · **NEEDS_FIX** ·
**NOT_AUDITED**.

> A screen is only marked PIXEL_PERFECT when structure, dimensions, typography, colours, radii,
> borders, shadows, icons, imagery and alignment have each been compared against its node AND the
> result has been rendered and looked at. Nothing here is marked PIXEL_PERFECT from code
> inspection alone.

---

# PASS 8 — THE REMAINING 12 STATES, NODE-BY-NODE

Scope: **only** the 12 states pass 7 left at `NO — partial`. The other 14 were not re-opened except
where a shared component changed, and each of those consumers was regression-checked (§P8.7).
No responsiveness re-run, no redesign, no backend work.

## P8.0 A measurement defect found before any comparison

The first capture showed the map pin (`63:782`) rendering at ~25 % red and the location mark
(`63:769`) washed from `#FFD600` to `#FFEF99`, while flat `View` fills measured **exact**
(`#FFD600` came back `255,214,0`). Both assets decode as fully saturated on disk, so the obvious
reading — a bad export — was wrong.

Cause: **`wm size 1080x2392` on an emulator whose panel is 720 × 1280.** The app renders at the
override size, the compositor scales to the panel, and `screencap` round-trips back up. Large flat
areas survive; fine bitmap detail loses saturation. Resetting `wm size` and re-capturing at native
resolution returned `255,0,0` and `255,214,0` exactly.

**Every colour measurement in this pass therefore uses `wm size reset` with a density-only
override — `wm density 293`, giving 393 × 699 dp.** Density changes the dp mapping without
rescaling the framebuffer, so the reference width is preserved and colour is exact. Geometry is
read from `uiautomator` bounds, which are layout values and were never affected.

**No asset defect existed.** `map-pin.png` and `location-pin.png` were already correct, and
`out-of-service.png` matches its Figma export colour-for-colour at lower resolution.

A second harness fix: a force-stopped app still leaves its **task**, and expo-router treats a link
differing only by query string as the same route, so `?step=confirmed` returned the previous step.
Launches now carry `-S --activity-clear-task --activity-clear-top`.

## P8.1 The systematic finding — the 16pt gutter column

Every finalized frame draws its content inside a **370pt viewport** (390 frame − 2 × 9pt mockup
bezel − 2 × 1pt inset) with a **16pt gutter**, and the header is INSIDE that column: `63:783` and
its instances all measure **338 × 38 at x 16**, not edge to edge. The implementation placed every
header full-bleed, so the back disc sat at x 4 where the frames put it at **x 20**.

This was true of all 12 states and is the single largest correction in the pass. It is applied per
consumer (each screen pads its own column) rather than inside `ScreenHeader`, so the component's
own `px 4` still matches `63:783` and nothing outside these sections moved.

## P8.2 Address ×4

| Node | State | Old implementation | Correction | Figma evidence | Device result |
| --- | --- | --- | --- | --- | --- |
| `53:31` | Select location | map + panel FULL-BLEED, no radii; CTA **inside** the tinted panel; helper pill stretched; search bar px 16 / py 12 under an `#E2E8F0` rule; resolved row gap 14; CTA 44 tall, r16, Bold 14/20, `#FEE685` glow | body column px 16 / pt 16 / gap 16 with the header inside; search bar px 4 / py 6, rule removed; map inset at **r15**; panel inset at **r20**, px 12 / pt 16 / pb 11, gap 8; pill fixed **247 × 20** left-aligned in a 250 × 25 box with no inner padding; CTA moved OUT as the panel's sibling 16 below; glow removed | `53:32` gap-16 px-16; `53:33` `rounded-[15px]` h422; `53:58` `rounded-[20px]` px12 py16 h105; `63:779` w247 h20 in `63:780` 250 × 25; `53:110` h34 r30 px12 py6; `53:112` Black 16/24 −0.4; **no shadow**, and `53:111` no longer exists | header x15.8 h38.2, back x19.7, title x63.3 h28.4; pill **247.4 × 20.2** with the full line; CTA h33.9 |
| `60:655` | Complete address | form px 16 / pt 21; chips outlined `#FFDE33`, selected `#FFF7CC`; "Save as" a sibling at the 17pt gap; labels `#314158`; "(Optional)" in `azure47`; "Change" Medium; areaRow gap 12 | same gutter column; form block px 4 / py 6 gap 17; chips **`#CFFF04`**, selected **`rgba(236,255,155,0.7)`**; "Save as" moved INSIDE the `60:707` group at its 10pt gap; labels **black**; "(Optional)" black Regular; "Change" **SemiBold 11/16.5** at top 31; areaRow gap **19** | `60:678` px4 py6 gap17; `63:799` border `#cfff04`; `64:11` bg `rgba(236,255,155,0.7)`; `64:7` is the third child of `60:707`; `60:702`/`60:709`/`64:6` black; `63:808` SemiBold; `63:807` at x280 against a 261 column | fields at 17pt, chips lime-outlined, CTA h33.9 |
| `215:1472` | Out of service | a **45pt banner** (`218:1536`) carrying the rejected address and a 41pt avatar; body vertically centred, gap 30 / pt 40; disc unlit | banner **REPLACED** by the shared header instance titled "Choose another location"; `addressLabel` / `addressLine` / `avatarUrl` dropped from the view model AND fixture; body px 16 / pt 16 / pb 80 with a **50pt** gap; content group gap **21**; disc gains `0 0 2 rgba(0,0,0,0.07)`; copy block stretches | `275:5179` is a plain `63:783` instance — the address pair and avatar are **absent from the frame**; `221:1553` gap-50 pt-16 pb-80; `275:5707` gap-21; `222:1558` drop-shadow 0 0 2 0.07 | header x15.8; headline y373.5 **h25.1**; message h27.3 (2 × 13.33) |
| `68:214` | Saved addresses | block gaps 12, px 16.22; add glyph 28-in-28; rows at the card's 12pt gap; kebab **drawn** as three dots | header inside the column, pt 16, block gaps **21**; add bar pinned 41 tall (pt 6) around a 28pt row, glyph **36-in-28**, lift `0 0 1 rgba(0,0,0,0.1)`; rows wrapped at their own **8pt** gap; kebab replaced by the **exported** `230:1969` asset | `275:5187` y16 → `69:514` y75 → `230:1955` y137 = 21pt gaps; `69:533` `inset -14.29%`; `230:1959` 8pt; `230:1969` is a PNG export, not dots | add bar y74.8 h41; card y137.1; rows 8.2 apart; kebab 20.2 × 31.7 |

## P8.3 Profile ×2

`6:227` and `71:615` share one screen and one card, and the two frames disagree in a way that is
real: **`65:35` on Past bookings is overridden to 45 and sits flush at y 0**, while **`71:620` on
Refunds keeps the component's 38 and opens 16pt down**. Both are now drawn.

| Node | Old | Correction | Evidence | Device |
| --- | --- | --- | --- | --- |
| `6:227` | header outside the column; list padding 16; status pill hugging; detail rows gap 12; rating rendered as **text only** | 16pt column with the header inside at y 0; card block px 4 / py 6 gap 16; pill fixed **94** wide, centred; detail rows gap **30**; the **exported 13pt star** added 3pt after the score | `65:35` y0 h45; `6:239` y61 px4 py6, cards 16 apart; `6:252` `w-[94px]`; `6:257`/`6:262` gap-30; `275:5708` gap-3 + `275:5710` 13 × 13 | header h44.8 at y24; first card y67.2; pill 93.9; rating group **33.9 = 18 + 3 + 13** |
| `71:615` | as above | same column, `bodyRefund` opens 16 down and keeps the 38pt header; refund cards carry no rating | `71:620` x16 y16 h38; `71:621` y70 | header y39.9 h38.2; first card y75.9; no rating |

## P8.4 Instant taxes `25:1585` — the scrim was doubled

The dialog layer painted its own `rgba(0,0,0,0.8)` **on top of** the one `Overlay` already draws,
so two 0.8 scrims stacked: the screen behind the sheet measured **`10,10,8`** (96 % black) where
the frame computes `#333333`, and the sheet measured `#333` where the frame computes `~#595959`.

`25:1585` models it differently: **one** full-screen scrim (`25:1745`), and the sheet dims *itself*
— `47:6615` at 50 % layer opacity over a `29:1858` 50 % black wash.

**Reproduced literally, that broke the screen.** At 50 % layer opacity the real Home screen read
straight through the sheet — "Upcoming Booking" and the tiles were legible through it — because the
artboard's background is blank and the device's is not. The wash is therefore flattened to a single
opaque `black65`, which lands the same measured colour with the sheet still opaque.

| Check | Frame computes | Device |
| --- | --- | --- |
| above the sheet | `#333333` | `49,51,41` |
| white sheet area | `~89,89,89` | **`89,89,89`** |
| dialog card | white | `255,255,255` |
| card size | `47:6617` **266 × 152** | **266.5 × 152.9** |
| title / body top | 62 / 88 | **61.7 / 88.0** |

The icon block was also 35 × 35 against `47:6621`'s **36 × 40**, which is what set the title's
baseline; with that and the frame's 19pt bottom padding the card now measures its drawn height.

## P8.5 Schedule ×2 and Reschedule ×1

`275:4713` and `34:3035` share a system the implementation was not expressing: sections at
**px 4 / py 6** spaced **21** apart, each holding a label 6pt above a grid of **equal columns** at
an 8pt gutter.

| Old | Correction | Evidence | Device |
| --- | --- | --- | --- |
| header full-bleed at x 4, no top gap | header inside the 16pt column, 16pt down | `275:4715` / `289:6817` x16 w338 h38 | x15.8, back x19.7, title x63.3 |
| sections unpadded, inheriting `Screen`'s 20pt gap | `Screen` gained an **additive** `contentStyle`; Schedule passes pt 16 + gap **21**; sections px 4 / py 6 | `34:3045` sections at y6 / 108.6 / 196.2 / 364.2 → 21 | section gaps 21.0; label→grid **6** |
| Day / Time chips **content-sized** (105.9 / 136 / 104.3) | `columns={3}` | `289:6221` `grid-cols-[repeat(3,1fr)]` gap 8 | **111.9 / 112.5 / 111.9**, gutters 8.2 |
| slot gutters 10 / 8.9 | corrected to **8 / 8** | `34:3485` chips at x 0 / 84.5 / 169 / 253.5 w76.5; rows y 6 / 50 / 95 | 4-up at 8.2 |

`SectionHeader` already carries the frame's 6pt label margin, so the section adds no `gap` — doing
both drew 12.

**`275:5490` Reschedule** needed no reschedule-specific code: it inherits the same screen. The
locked rules were re-checked on the render — **three steps with no Duration, CTA "Reschedule", no
payment line, no Razorpay path** (`schedule-submit` reads "Reschedule" at h34.4 and no
`schedule-payment-details` node exists).

**Recorded, not changed:** `275:5163` (step 2's CTA block) is button-only at h50 with the label
"Book Now" and **no** payment link, while `34:3035` carries "Book NOW • ₹198" **and** the link. The
screen already renders the link only when the view model supplies a label, so the boundary is
correct; the DEV fixture simply supplies one at every step. No step-dependent pricing logic was
added to the UI.

## P8.6 Cancellation ×2 — including a product conflict

| Node | Old | Correction | Evidence | Device |
| --- | --- | --- | --- | --- |
| `104:2336` | sheet banner at x 4; Help 12pt after the title with 70pt dead to its right; destination box 58.4 tall | `headerBanner` gutter **16 + 4 = 20**; the title takes the slack so a `headerAction` lands flush right; `boxed` pinned to **52** | `104:2337` `p-16` around `115:2786` `px-4`; `289:6823` ends at 333 of a 334 inner width; `104:2370` `h-[52px]` | back **x20.2**, title x63.9, method **h52.4** |
| `115:2703` | a refund-**amount** row the frame does not draw; destination row unboxed; prompt→buttons 23; No/Yes capped at 162, leaving 27pt dead | amount row **removed**; destination row `boxed`; top group gap **12**; bottom group gap **10**; buttons `flex: 1` | `115:2715` holds only the hero + `289:6827`; `289:6838` prompt y6 h68 → buttons y84; `115:2814` = 158 + 10 + 158, its full track | hero h143.6; destination h51.9, **12** below it; prompt→buttons **9.8**; buttons 177 / 174.7 |

> ### PRODUCT_DESIGN_CONFLICT — `289:6815` on `104:2336`
>
> The frame labels the bottom CTA of a **cancellation** step **"Book Now"** (disabled,
> `rgba(0,0,0,0.07)` fill, 50 % ink). Shipping that would put a booking action on the screen whose
> only purpose is cancelling. **The implementation keeps "Cancel".** Recorded for the designer
> rather than silently shipped; the disabled treatment is not reproduced either, because the app's
> control is the live one.

`104:2370`'s own numbers are self-contradictory — 11.889 padding around a 31.6pt block measures
57.4, but the node is fixed at **52** and Figma lets the content overflow. The frame's drawn height
wins (the ruling `ScreenHeader` established), with the vertical padding taken to 9.2 so the
"Takes …" line is not clipped.

## P8.7 Shared components — what changed and what was re-checked

| Component | Change | Finalized consumers | Re-checked |
| --- | --- | --- | --- |
| `Button` size `form` | 44 → **34**, r16 → **r30**, px24/py12 → px12/py6, Bold 14/20 → **Black 16/24 −0.4**, added to `SHORT_SIZES` | Address ×2 only | both |
| `BottomSheet` `headerBanner` | px 4 → **20**; `title` `flexShrink` → `flex: 1` | Instant ×4, Cancellation ×4 | all 8 |
| `BottomSheet` dialog layer | second scrim removed; sheet dims itself | Instant taxes only (sole `dialog` consumer) | `25:1585` + the 3 other Instant states |
| `RefundDestinationRow` `boxed` | pinned to 52 | Cancellation ×2 (`boxed` is passed nowhere else) | both |
| `ChipGroup` slot gutters | 10 / 8.9 → **8 / 8** | Schedule ×4, Reschedule ×3 | all 7 |
| `Screen` | **additive** `contentStyle` prop | Schedule / Reschedule only | all 7 |
| `BookingCard` | pill fixed 94, rows gap 30, exported star | History, Refunds | both |
| tokens | added `r30`, `pill`, `disc`, `hairlineSoft`, `scrimSheet`, `black65` — all **additive**; no existing value re-pointed | — | — |

`ScreenHeader` was deliberately **not** changed: its `px 4` is `63:783`'s own padding, and the
missing 16 is the screen column's, so it is applied by each consumer.

## P8.8 Final sweep — 22 states, cold, marker-asserted

The 12 targets plus the 10 finalized states touched by a shared change, each cold-launched, marker-
asserted, and rejected if a single colour covered > 98.5 % of a 4-px sample grid.

**Result: 22 / 22 PASS.** `44:5378` failed the blank gate on its first attempt at 0.996 and passed
on re-capture at **0.359** — the first frame was caught mid-transition; the state itself renders its
calendar art, "Instant slots are unavailable, but schedule ones are!" and "Schedule NOW" correctly.

## P8.8b Quality gates

| Gate | Result |
| --- | --- |
| `tsc --noEmit` | **PASS** |
| `eslint . --max-warnings=0` | **PASS** |
| `prettier --check .` | **PASS** |
| `jest` (full) | **PASS** — 37 suites, 312 tests |
| `expo config --type public` | **PASS** — SDK 57, scheme `spoon` |
| Android export | **PASS** — one 4.8 MB Hermes bundle |
| `gradlew assembleDebug` | **PASS** — see the JDK note below |
| Runtime smoke | **PASS** — 22 / 22, §P8.8 |
| logcat / crash | **PASS** — no `FATAL EXCEPTION`, no `AndroidRuntime` crash |

> **Toolchain note.** `gradlew assembleDebug` fails out of the box here with *"Gradle requires JVM
> 17 or later … currently configured to use JVM 8"*: the machine's default `java` is
> `jre1.8.0_431`. Building with Android Studio's bundled JBR succeeds —
> `JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"` (OpenJDK 21.0.9), `BUILD SUCCESSFUL`.
> This is an environment configuration, not a project defect.

## P8.9 Outstanding — what is NOT claimed

1. **`PHYSICAL_ANDROID_VERIFIED` is NOT re-asserted for this build.** `adb devices` reported only
   `emulator-5554` for the whole session; the I2403 handset of pass 7 was never attached. Pass 7's
   handset run predates every change here, so the 12 corrected states and the 8 shared-component
   consumers are verified on an **emulator at the reference width**, not on hardware. This is the
   one gate in the brief's final target that cannot honestly be closed from this session.
2. **`IOS_SIMULATOR_VERIFIED: NO`** — Windows. Nothing added this pass has a `Platform.OS` branch.
3. **`COMMENTS_ACCESSIBLE: NO`** — the MCP surface still exposes no comments API.
4. **`PRODUCT_DESIGN_CONFLICT`** — `289:6815`, §P8.6. Open for the designer.
5. **Copy deltas, recorded not replicated** (server-owned): `104:2356` "Original Amount Paid" vs the
   app's "Original Booking Paid"; `104:2377` "Takes 5-6 business days" vs "Takes 3-5"; `69:517`
   "Add a new addresses"; `221:1555`'s double comma.
6. **Deliberate deviations kept**, each because literal reproduction is worse on a device:
   `219:1551`'s inner shadow (Figma clips to layer alpha, RN to the view box — it would draw a
   rectangle the frame does not show); `47:6615`'s layer opacity (flattened, §P8.4); the start-time
   chips staying content-sized so a 320dp screen wraps instead of truncating every label; and the
   map placeholder, since the map SDK is still an open engineering choice.
7. **Figma internal inconsistencies, not forked into code:** `275:4488` instances `63:783`
   (`px 4 / py 6`) while `275:4713` and `34:3035` draw the same lockup as a `p 6` "top banner";
   `60:655` places its CTA at x 12 where every other block in that column sits at x 16.
8. **`MEAL_BRIEF_ENTRY_POINT: PRODUCT_PENDING`** — carried from pass 6, unchanged.

## P8.10 Status

| Gate | Result |
| --- | --- |
| `TOTAL_FINAL_STATES` | 26 |
| `TOTAL_IMPLEMENTED` | 26 |
| `TOTAL_DEV_REACHABLE` | 26 |
| `TOTAL_PIXEL_VERIFIED` | **26** |
| `TOTAL_RESPONSIVE_VERIFIED` | 26 (pass 7; not re-run, per scope) |
| `TOTAL_PHYSICAL_ANDROID_VERIFIED` | **14** — see §P8.9 #1 |
| `FOUNDER_COLOR_COMPLIANCE` | YES |
| `FOUNDER_FONT_COMPLIANCE` | YES |
| `ASSET_COMPLIANCE` | YES — 2 assets added from their exports (`230:1969`, `275:5710`) |
| `ICON_COMPLIANCE` | YES |
| `SHADOW_LAYERING_COMPLIANCE` | **YES** — closed this pass, §P8.4 / §P8.11 |
| `SAFE_AREA_COMPLIANCE` | YES |
| `KEYBOARD_COMPLIANCE` | YES (pass 7; no keyboard geometry changed) |
| `ANDROID_RESPONSIVENESS_COMPLETE` | YES |
| `IOS_CODE_COMPATIBLE` | YES |
| `IOS_SIMULATOR_VERIFIED` | NO |
| `IOS_RUNTIME_QA_PENDING` | YES |
| `COMMENTS_ACCESSIBLE` | NO |
| `NON_FINAL_FIGMA_ITERATIONS` | OUT_OF_SCOPE |
| `FINAL_SECTION_UI_COMPLETE` | YES |

## P8.11 Shadow / layering — the PARTIAL is closed

Every one of the 12 nodes was read for shadow, inner shadow, scrim, z-order and gradient:

- **Outer shadows** now token-backed at their measured values: `63:779` `0 0 4 rgba(0,0,0,0.1)`
  (`pill`), `222:1558` `0 0 2 rgba(0,0,0,0.07)` (`disc`), `69:514` `0 0 1 rgba(0,0,0,0.1)`
  (`hairlineSoft`), `6:245` `0 0 2 rgba(0,0,0,0.15)` (`soft`, already correct).
- **Shadows removed** where the finalized file drops them: the `#FEE685` glow under both address
  CTAs — `53:111` and `60:729` no longer exist, and neither `53:110` nor `275:4485` carries one.
- **Inner shadows:** the file contains two in scope. `219:1551`'s is omitted with cause (§P8.9 #6);
  the Profile tiles' `69:406` was already handled through `innerShadows.profileTile`.
- **Scrim / z-order:** corrected and measured in §P8.4 — one host scrim, the sheet dimming itself,
  the dialog above both. `dialogScrim` is now a transparent tap target.
- **Gradients:** none of the 12 states draws one; the only two in the file are the Home cuisine
  mosaic's, outside this scope.

---

# PASS 7 — SEVEN FINALIZED SECTIONS, FIGMA `sbIXeBfaMzUFUz2NYJIJTm`, ON A PHYSICAL HANDSET

First pass with a real Android device attached: **I2403 (vivo), Android 16, 1080 × 2392 @ 440dpi
= 393 × 870dp** — natively the reference viewport. `adb devices` confirmed it at the start of the
session and again at the end.

## P7.0 What changed from v3 to v4

The seven target names each resolve to exactly one section; no name is ambiguous this time.

| Section | Node | Frames | vs v3 |
| --- | --- | --- | --- |
| Login flow | `275:4472` | 4 | unchanged |
| Address | `275:4473` | 4 | unchanged |
| Profile | `275:6021` | 3 | unchanged |
| Instant booking | `267:3520` | 4 | **changed** |
| Scheduled flow | `267:3521` | 4 | **changed** |
| Cancellation flow | `115:2821` | 4 | **changed** |
| **Rescheduled flow** | `275:5217` | **3** | **renamed + one frame removed** |

`87:119` "Cook profiles- pure veg" is the only out-of-scope section left (v3's `81:447` "Cook
profiles" is gone). `NON_FINAL_FIGMA_ITERATIONS = OUT_OF_SCOPE`.

**The v3 "duplicate Scheduled flow" is resolved by the file itself.** Pass 6 recorded `275:5217`
as a byte-identical copy of `267:3521` and picked the latter as canonical. v4 renames it
**"Rescheduled flow"** — the frames were identical because reschedule reuses the Schedule screen,
not because anyone pasted a section twice. The pass-6 reading was structurally right and the
conclusion ("no competing design") still holds; the intent is now explicit.

It also **drops one frame**: Reschedule has three states, not four, and the missing one is
**Duration**. That is the locked product rule made visible — a reschedule moves *when*, never
*how long*. The implementation already produced exactly that shape from `mode: 'reschedule'` plus
an absent `durations`, so no reschedule-specific layout was needed or added.

Rather than trust matching node ids, every in-scope frame was diffed v3 → v4 on an id-independent
signature (tag + name + w×h + x,y at matching depth):

- **UNCHANGED (11):** all of Login, Address and Profile. Pass-6 work on those carries over intact.
- **CHANGED (15):** Instant ×4, Schedule ×4, Cancellation ×4, Reschedule ×3.

## P7.1 The v4 deltas, and what each cost

| Area | Node | v4 value | Action |
| --- | --- | --- | --- |
| **Instant sheet header** | `289:6866` | adopted the shared `63:783` bar: **338 × 38**, px 4, gap 12, Black 20/28 | new `banner` header variant |
| Instant bolt | `289:6871` | **38 × 38** (was 25 × 33) | fixed |
| Instant back control | `289:6867` | the 32pt **disc**, not the bare arrow `1:739` | fixed — confirmed by rendering the header node |
| Instant CTA copy | `289:6939` | "Book **NOW** • ₹198" | fixed |
| **Cancellation header** | `289:6848` | same 338 × 38 shared bar (was a 45pt band in a 61pt wrapper) | `banner` variant |
| Cancellation gaps | `6:16` | table → notice → notice at **8pt** (v3 said 12) | fixed |
| Schedule body column | `34:3045` | **338** wide, inset 16 (v3 said 346 / inset 12) | already correct — `screenPaddingHorizontal` is 16, so v3 was the outlier |
| Reschedule CTA | `275:5218` | "Reschedule", no payment line | already correct |

`banner` was added as its own `BottomSheet` variant rather than by re-valuing `screen`, because
three of `screen`'s four consumers (Extension, Booking details, address edit) are outside this
pass's scope (§16).

`ScreenHeader` now **pins** its drawn heights (38 / 45) instead of deriving them from padding:
`63:783`'s own `py-6` around a 32pt control measures 44 in RN, missing the frame by 6. Figma's
autolayout lets the control overflow its padding; RN does not, so the frame's height wins.

## P7.2 Physical-device verification — 26 / 26

Run on the handset at its native 393 × 870, using the same validated harness as pass 6 (marker
assertion, decoded-pixel blank check, sha256 duplicate check, node-bounds overflow check).

**Result: 26 / 26 PASS. 0 blank frames, 0 duplicates, 0 horizontal overflow.**

Two things had to be fixed before the run produced anything:

1. **Metro was pathologically slow.** `metro:cache_write_error: Cache write failed for store(s):
   BinaryFileStore` meant nothing was cached, and Metro was taking **200–500 seconds** to serve
   even a one-module delta (`Android Bundled 508928ms`). The handset appeared to hang on the
   splash; it was actually waiting. Clearing the cache and restarting took a full 10.67 MB bundle
   from ~500 s to **19 s**, and handset first paint from 219 s to 23 s.
2. **Warm deep links are no-ops when only the query changes.** On a warm process, nine routes
   whose links differ from the previous one only by `?step=` / `?instant=` / `?state=` never
   navigated — expo-router treats them as the same route. The marker assertion caught all nine
   (identical node counts proved the screen never changed); re-running them cold passed all nine.
   Recorded because the *previous* harness would have scored them as passes.

The step progression is visible in the hierarchies, which is the cleanest evidence that the
progressive-disclosure states are genuinely distinct:

```
Schedule    42 → 53 → 78 → 136 nodes   (Day → +Time → +Duration → +Start time)
Reschedule  40 → 51 → 109 nodes        (Day → +Time → +Start time; no Duration step)
```

### PRIVACY — captures withheld

The handset is a personal phone. The first capture of the session returned a WhatsApp
conversation with contact names and message content; it was deleted immediately and no handset
capture was retained from that attempt. The harness now refuses to call `screencap` unless
`mCurrentFocus` belongs to our package, and it records `SKIPPED — foreign window focused` rather
than capturing. It also never resizes the handset: `wm size` / `wm density` are emulator-only.

## P7.3 Keyboard on the physical handset — one real defect found and fixed

`dumpsys input_method` confirmed `mInputShown=true` in the same frame as every capture.

| Screen | Field | Result |
| --- | --- | --- |
| Login `250:2383` | phone | **PASS** |
| OTP `275:4289` | digits panel | **PASS** |
| Address form `60:655` | flat no. | **PASS** |
| Cancellation "Others" `104:2260` | reason detail | **PASS after fix** |
| Address edit sheet | — | not tested — out of scope (`228:1801` is not in a finalized section) |

**Defect: the bottom sheet had no keyboard avoidance at all.** With the IME up, the sheet kept its
bottom-anchored position, so on the cancellation "Others" step the field being typed into *and*
the Continue CTA were both behind the keyboard, and the sheet never scrolled. Fixed by lifting the
sheet by the measured keyboard height (`Keyboard` events, not `KeyboardAvoidingView` — the sheet
lives inside a native modal where that component does not receive the same insets). With the
keyboard closed the lift is 0, so every already-verified sheet is byte-identical.

Re-verified on the handset: all seven reason rows, the focused field and the Continue bar are on
screen together, with Continue correctly still disabled until the detail text is non-empty.

**The locked "Others" product rule was confirmed on real hardware**, not from code: selecting
Others revealed the field with `cancel-continue-reason` at `enabled="false"`, and typing flipped
it to `enabled="true"`.

## P7.4 Final matrix — 26 states across 7 finalized sections

`PIXEL_VERIFIED` means the v4 node was read AND the handset render was compared against it. A
screen that merely renders cleanly is NOT marked pixel-verified. `RESPONSIVE` = PASS at all six
emulator viewports (320 / 360 / 393 / 411 / 430 / short).

| SECTION | STATE | NODE | IMPL | DEV_REACHABLE | PIXEL_VERIFIED | ANDROID_DEVICE | RESPONSIVE | KEYBOARD | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login `275:4472` | Login No. | `250:2383` | YES | YES | **YES** | YES | YES | **YES** | unchanged v3→v4 |
| Login | OTP countdown | `275:4289` | YES | YES | **YES** | YES | YES | **YES** | no CTA by design |
| Login | OTP resend | `250:2439` | YES | YES | **YES** | YES | YES | n/a | |
| Login | OTP wrong | `275:4349` | YES | YES | **YES** | YES | YES | n/a | |
| Address `275:4473` | Select location | `53:31` | YES | YES | NO — partial | YES | YES | n/a | map placeholder deviation stands |
| Address | Complete address | `60:655` | YES | YES | NO — partial | YES | YES | **YES** | |
| Address | Out of service | `215:1472` | YES | YES | NO — partial | YES | YES | n/a | |
| Address | Saved addresses | `68:214` | YES | YES | NO — partial | YES | YES | n/a | 1-line truncation fixed in pass 6 |
| Profile `275:6021` | Profile | `6:663` | YES | YES | NO — partial | YES | YES | n/a | structure matches; footer copy delta |
| Profile | Booking history | `6:227` | YES | YES | NO — partial | YES | YES | n/a | |
| Profile | Refund history | `71:615` | YES | YES | NO — partial | YES | YES | n/a | |
| Instant `267:3520` | Available | `1:728` | YES | YES | **YES** | YES | YES | n/a | banner header + 38pt bolt + disc |
| Instant | Taxes pop up | `25:1585` | YES | YES | NO — partial | YES | YES | n/a | dialog layering verified, node not re-read |
| Instant | NA out of shift | `25:1327` | YES | YES | **YES** | YES | YES | n/a | |
| Instant | No slots | `44:5378` | YES | YES | **YES** | YES | YES | n/a | |
| Schedule `267:3521` | 1 Day | `275:4488` | YES | YES | **YES** | YES | YES | n/a | |
| Schedule | 2 + Time | `275:4713` | YES | **YES (new)** | NO — partial | YES | YES | n/a | `?step=2` |
| Schedule | 3 + Duration | `275:4938` | YES | **YES (new)** | NO — partial | YES | YES | n/a | `?step=3` |
| Schedule | 4 + Start time | `34:3035` | YES | **YES (new)** | NO — partial | YES | YES | n/a | `?step=4` |
| Cancellation `115:2821` | Policy | `6:2` | YES | YES | **YES** | YES | YES | n/a | banner header, 8pt gaps |
| Cancellation | Reason | `104:2260` | YES | YES | NO — partial | YES | YES | **YES** | Others rule verified on device |
| Cancellation | Refund details | `104:2336` | YES | YES | NO — partial | YES | YES | n/a | |
| Cancellation | Confirm | `115:2703` | YES | YES | NO — partial | YES | YES | n/a | v4 dropped 6 nodes; not re-read |
| Reschedule `275:5217` | 1 Day | `275:5442` | YES | YES | **YES** | YES | YES | n/a | |
| Reschedule | 2 + Time | `275:5490` | YES | **YES (new)** | NO — partial | YES | YES | n/a | |
| Reschedule | 3 + Start time | `275:5218` | YES | **YES (new)** | **YES** | YES | YES | n/a | no Duration, CTA "Reschedule" |

**Emulator responsiveness: 156 captures (26 × 6). 154 PASS on the first attempt; the two w411
misses (`sched-4start`, `cancel-policy`) were load-timing flakes that PASS on retry — 11 nodes
means the bundle had not painted, not a layout defect. 0 duplicate frames, 0 horizontal overflow
anywhere.**

## P7.5 Outstanding — what is NOT claimed

1. **`TOTAL_PIXEL_VERIFIED: 11 / 26`.** Every state was rendered and compared structurally on the
   handset, but only 11 had their v4 node read AND the render compared against it. The 15 marked
   "partial" are honest gaps, not soft passes.
2. **`CANCEL_SHEET_HEIGHT: NEEDS_FIX`** — the sheet renders taller than `6:3`'s 520. Part is the
   handset's bottom safe-area inset (correct behaviour, not in the frame); the remainder is sheet
   chrome. All content matches its nodes and is reachable.
3. **Profile footer copy** — the frame reads "Log Out"; the app renders "Log Out of Account", and
   the Terms line is not underlined. Copy is server-owned; recorded, not silently changed.
4. **Address edit sheet `228:1801` keyboard** — not tested; that sheet is not inside a finalized
   section. It does inherit the new sheet keyboard avoidance.
5. **`MEAL_BRIEF_ENTRY_POINT: PRODUCT_PENDING`** — carried from pass 6, unchanged.
6. **`IOS_SIMULATOR_VERIFIED: NO`** — Windows. `docs/IOS_QA_CHECKLIST.md` remains the plan. The
   two changes this pass that touch platform behaviour — the `Keyboard`-event sheet lift and the
   `ScreenHeader` fixed heights — are both cross-platform APIs with no `Platform.OS` branch.
7. **`COMMENTS_ACCESSIBLE: NO`** — the MCP surface still exposes no comments API.
8. **No `PRODUCT_DESIGN_CONFLICT` found.** The Rescheduled section agrees with every locked rule:
   three steps (no Duration), CTA "Reschedule", no payment line, no Razorpay path.

---

# PASS 6 — FINALIZED-SECTION SCOPE, FIGMA `fsgGIC4c6DJulb64TTt9yg`

A new file arrived together with a **product/design scope ruling**: only six explicitly grouped
sections are finalized and authoritative. This pass re-bases the audit onto those sections.

## P6.0 How the sections were identified (not by name alone)

`get_metadata` on page `0:1` returns 820 427 characters describing **3552 frames, 1451 text nodes
and 9 sections**. The 9 sections were extracted mechanically from that dump rather than by
browsing, so nothing was missed and nothing was guessed:

| Section node | Name | Canvas x / y | In scope |
| --- | --- | --- | --- |
| `275:4472` | Login flow | 5579 / −5957 | **YES** |
| `275:4473` | Address | 8322 / −5957 | **YES** |
| `275:6021` | Profile | 11267 / −5957 | **YES** |
| `267:3520` | Instant booking | 5579 / −4333 | **YES** |
| `267:3521` | Scheduled flow | 5579 / −2643 | **YES — canonical** |
| `115:2821` | Cancellation flow | 8422 / −2643 | **YES** |
| `275:5217` | Scheduled flow | 10825 / −2643 | duplicate — see below |
| `81:447` | Cook profiles | 10541 / 4042 | OUT_OF_SCOPE |
| `87:119` | Cook profiles- pure veg | 11182 / 4042 | OUT_OF_SCOPE |

Five of the six names resolve to exactly one section. **"Scheduled flow" resolves to two.**

### The duplicate Scheduled section — resolved, not guessed

`267:3521` and `275:5217` each hold four frames, all named "Page 5b- Scheduled morning", all
390 × 949, at identical in-section offsets (x = 116, 597, 1078, 1559). Name and shape cannot
separate them, so both subtrees were diffed node-by-node on an id-independent signature
(tag + name + width × height + x,y at matching relative depth):

| Step | `267:3521` | `275:5217` | Nodes | Geometry |
| --- | --- | --- | --- | --- |
| 1 Day | `275:4488` | `275:5442` | 46 / 46 | identical but one 0.1pt status-bar x |
| 2 + Time | `275:4713` | `275:5490` | 62 / 62 | **byte-identical** |
| 3 + Duration | `275:4938` | `275:5572` | 114 / 114 | identical to <0.001pt float noise |
| 4 + Start time | `34:3035` | `275:5218` | 204 / 204 | identical to <0.001pt float noise |

Rendered side by side at 1600px the two sections are indistinguishable. **`275:5217` is a
duplicate paste of `267:3521`, not a competing design.**

`267:3521` is taken as canonical because it sits in the canvas's main flow grid — same x as
"Instant booking" (5579), directly below it, and its section id is consecutive with it
(`267:3520` / `267:3521`). `275:5217` sits off to the right with no flow neighbours. Because the
two are visually and structurally identical, **this choice carries no design risk**: implementing
either produces the same pixels.

> **This retires `SCHEDULE_DESIGN_AUTHORITY: PRODUCT_DESIGN_PENDING`.** Schedule was frozen in
> pass 5 because the previous file contained two *contradicting* Scheduled designs. In the new
> file the only duplication is an exact copy, so the contradiction no longer exists and the
> freeze has no subject. Schedule is unfrozen for this pass and is implemented from `267:3521`.

## P6.1 Authoritative finalized-state table

23 user-facing states across 6 sections. Order is the left-to-right order shown in each section.

`RESPONSIVE_VERIFIED` = PASS at all six viewports in §P6.4. `PIXEL_VERIFIED` = the node was
re-read in this file AND the render was compared against it; a screen that merely renders cleanly
is NOT marked pixel-verified.

| FINAL_SECTION | # | SCREEN/STATE | FIGMA_NODE | IMPLEMENTED | DEV_REACHABLE | PIXEL_VERIFIED | RESPONSIVE_VERIFIED | ANDROID_VERIFIED | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login flow `275:4472` | 1 | Page 1 — Login No. | `250:2383` | YES | YES | **YES** | YES | YES | 9 values re-read and fixed |
| Login flow | 2 | Page 2a — Login OTP (countdown) | `275:4289` | YES | YES | **YES** | YES | YES | node changed; CTA removed |
| Login flow | 3 | Page 2b — OTP resend | `250:2439` | YES | YES | **YES** | YES | YES | resend line now underlined |
| Login flow | 4 | Page 2c — OTP wrong | `275:4349` | YES | YES | **YES** | YES | YES | node changed; error moved inside panel |
| Address `275:4473` | 5 | Page 3a — Address location | `53:31` | YES | YES | NO — partial | YES | YES | header only; map step not re-read |
| Address | 6 | Page 3b — Address full | `60:655` | YES | YES | NO — partial | YES | YES | header only; form not re-read |
| Address | 7 | Page 3c — Address out of service | `215:1472` | YES | YES | NO — partial | YES | YES | not re-read this pass |
| Address | 8 | Page 3 — Saved addresses | `68:214` | YES | YES | NO — partial | YES | YES | header + 1-line truncation fixed |
| Profile `275:6021` | 9 | Page 15 — Profile | `6:663` | YES | YES | NO — partial | YES | YES | header only |
| Profile | 10 | Page 14 — Booking history | `6:227` | YES | YES | NO — partial | YES | YES | header only |
| Profile | 11 | Page 18 — Refund history | `71:615` | YES | YES | NO — partial | YES | YES | header only |
| Instant booking `267:3520` | 12 | Page 4b — Instant taxes pop up | `25:1585` | YES | **YES (new)** | NO — partial | YES | YES | `?instant=taxes` |
| Instant booking | 13 | Page 4a — Instant available | `1:728` | YES | **YES (new)** | **YES** | YES | YES | compared against `1:728` |
| Instant booking | 14 | Page 4c — Instant NA out of shift | `25:1327` | YES | **YES (new)** | **YES** | YES | YES | copy + CTA + ETA pill fixed |
| Instant booking | 15 | Page 4c — Instant no slots | `44:5378` | YES | **YES (new)** | **YES** | YES | YES | copy + tone + ETA pill fixed |
| Cancellation `115:2821` | 16 | Page 12a — Cancel policy | `6:2` | YES | YES | NO — see §P6.5 #1 | YES | YES | 3 defects fixed; height residual |
| Cancellation | 17 | Page 12b — Cancel reason | `104:2260` | YES | YES | NO — partial | YES | YES | not re-read this pass |
| Cancellation | 18 | Page 12c — Refund details | `104:2336` | YES | YES | NO — partial | YES | YES | not re-read this pass |
| Cancellation | 19 | Page 12d — Cancel confirm | `115:2703` | YES | YES | NO — partial | YES | YES | not re-read this pass |
| Scheduled flow `267:3521` | 20 | Step 1 — Day | `275:4488` | YES | YES | **YES** | YES | YES | unfrozen; footer + header rebuilt |
| Scheduled flow | 21 | Step 2 — + Time | `275:4713` | YES | tap-through | NO — partial | YES (via step 1) | YES | same screen, progressive |
| Scheduled flow | 22 | Step 3 — + Duration | `275:4938` | YES | tap-through | NO — partial | YES (via step 1) | YES | same screen, progressive |
| Scheduled flow | 23 | Step 4 — + Start time / Book NOW | `34:3035` | YES | tap-through | NO — partial | YES (via step 1) | YES | footer verified against `275:4177` |

Screens implemented in the repo but **not** inside a finalized section — Home, Meal Brief, the
whole Booking-lifecycle set (confirmation / en route / arrived / in service / reassigned /
auto-cancelled / completion), Reschedule, the address edit-delete sheet `228:1801`, and the
booking-details sheet `250:2861` — are `NON_FINAL_FIGMA_ITERATIONS = OUT_OF_SCOPE` for this pass.
They remain in the codebase and are not modified except where a shared component forces it.

## P6.2 Runtime blocker found and fixed before any QA

The pass-5 sweep produced blank frames, duplicate captures and misleading "0 JS errors" results.
The cause was found this pass and it was **not** a harness bug:

The Android emulator's user-mode NAT path (`10.0.2.2`) corrupts Metro's large chunked
`multipart/mixed` bundle response. `okhttp` fails inside
`MultipartStreamReader.readAllParts` with
`java.net.ProtocolException: Expected leading [0-9a-fA-F] character but was 0x2d`, the JS bundle
never executes, Hermes never registers (`/json/list` returns `[]`), and the app paints a black
screen. Every screenshot was therefore the same blank frame — and because no JS ever ran, no JS
error was ever reported, which is exactly how "jsErr=0" came to mean nothing.

Metro itself was proven healthy: the same request over `127.0.0.1` with `Accept: multipart/mixed`
returns a well-formed 10 746 912-byte body with correct boundaries and terminator.

**Fix (host-side only, no app code changed):**

```
adb reverse tcp:8081 tcp:8081
# RN reads PREFS_DEBUG_SERVER_HOST_KEY from the default SharedPreferences
adb shell run-as com.spoonhelp.userapp.dev \
  'cat > shared_prefs/com.spoonhelp.userapp.dev_preferences.xml'   # debug_http_host=localhost:8081
```

This routes the bundle over the adb transport instead of the emulator NAT. The app then renders.

**Consequence for evidence quality:** `testID` surfaces as `resource-id` in `uiautomator dump`,
so every capture in this pass is validated by asserting the screen's root marker is present
(`EXPECTED_ROUTE_OR_SCREEN_MARKER_FOUND`) rather than by absence of an error.

## P6.3 Delta against the current app, section by section

Classification per §3 of the brief. Old PIXEL_PERFECT verdicts were **not** carried over: every
row below was re-read from the finalized node in `fsgGIC4c6DJulb64TTt9yg`, and several values that
pass 5 recorded correctly against the *superseded* file have since moved.

### Login flow `275:4472` — MAJOR_MISMATCH, remediated

`250:2383` kept its node id but not its contents. Read off `250:2384` this pass:

| Element | Node | Superseded value | Finalized value | Action |
| --- | --- | --- | --- | --- |
| Hero height | `250:2434` | 364 | **329** (the 362 band is 33 status-bar mockup + 329 photo) | fixed |
| Content column | `250:2384` | — | p 16, gap 16 (brand + form now share a padded column) | added |
| Brand block | `250:2400` | px 16, pt 12 / pb 6 | 167, **px 12**, py 6 | fixed |
| Form block | `250:2406` | 237 | **228**, px 4, py 6 | fixed |
| Field radius | `250:2415` | 24 | **15** | fixed |
| Field height | `250:2415` | implicit (~42) | **43** explicit | fixed |
| Field type | `250:2417` / `250:2420` | SemiBold 14/16, tracking 0 | **Bold 16/24, tracking +1.6** | fixed |
| Login subtitle | `250:2414` | Regular 12/15 | Regular **12/16** | fixed |
| CTA shadow | `250:2421` | none | `0 0 2 rgba(0,0,0,0.15)` | added |

`letterSpacing.wider = 1.6` was added to the primitives; `bodyQuiet` and `fieldValue` were changed
in place after confirming **LoginScreen is their only consumer** (§16).

**OTP — the largest single change in the pass.** All three states lost their submit control:

| Element | Node | Superseded | Finalized | Action |
| --- | --- | --- | --- | --- |
| **CTA "Verify & Proceed"** | `227:1687` | present, 34pt bar | **absent** | **removed** |
| Title | `275:4315` | Bold 12/16 | Bold **14/20** | fixed |
| "OTP has been sent to…" | `275:4317` | Regular 10/15 | Regular **12/16** | fixed |
| Body padding | `275:4312` | py 6 | px 4 / py **12** | fixed |
| Error line position | `275:4467` | sibling below the boxes | **inside** the white panel | fixed |
| Error type | `275:4467` | Medium 11/16.5 | Medium **12/16** at `#FF0404` | fixed |
| Resend line | `275:4340` | Medium 11/16.5 | **SemiBold 14/16**, accent Bold 14/20 | fixed |
| Resend underline | `250:2439` / `275:4349` | none | underlined when offered | added |
| Error-state resend | `275:4349` | countdown still running | **resend offered** | fixed |
| Tagline measure | `275:4308` | unconstrained | 268 | fixed |

The CTA's absence was established from geometry, not from the render: the body block ends at
y = 407 and nothing follows before the home indicator at y = 810. Because the design leaves no
other affordance, **the last digit is now the submit gesture** — `onChangeCode` raises `onVerify`
once when the code reaches `digitCount`. That is a UI behaviour, not a business rule: the screen
still verifies nothing and `onVerify` remains the seam. Three new tokens carry the new ramps
(`otpResend`, `otpResendStrong`, `otpError`); `otpTagline` was left alone because the tagline sub
still measures Medium 11/16.5.

`danger` / `dangerSurface` were already `#FF0404` / `rgba(255,4,4,0.07)` in the token layer, which
is exactly what `275:4467` / `275:4449` specify — the pass-5 `NEEDS_FIX` on their provenance is
closed by the finalized nodes.

### The screen header `63:783` — MAJOR_MISMATCH, remediated (shared, 6 consumers)

The finalized file introduces the header as a real component and instances it across four of the
six sections. **Five of its values moved at once**, so the old `default` density was removed
rather than kept alongside:

| Property | Superseded | Finalized `63:783` |
| --- | --- | --- |
| Height | 56 | **38** |
| Horizontal padding | 16 | **4** |
| Vertical padding | 12 | **6** |
| Gap | 14 | **12** |
| Title | Bold 16/24 | **Black 20/28** (`headingScreen`) |
| Underline | 0.889pt `#E2E8F0` | **none** |

Instance heights confirm it: Address ×3, Profile `257:3504` and Refunds `71:620` all measure
338 × 38; only History `65:35` overrides to 45, which the surviving `band` density carries.
`divider` now defaults to **false** and the three explicit `divider={false}` call sites were
dropped as redundant. The `compact` density is gone — it *was* the finalized geometry, so Profile
simply stopped overriding.

### Back icon `54:289` — ASSET deviation resolved

Figma exports one control and both affordances are that same drawing: a 32 × 32 box holding a
white `r = 14` circle under `0 0 2 rgba(0,0,0,0.15)`, with a chevron stroked black at 70 %,
1.667pt wide, round caps. The repo held it at `assets/figma/icons/back.png` (129 × 129).

Two things were wrong, and the second was a live defect:

1. `ScreenHeader` did not use the asset at all — it drew Feather's `chevron-left` through
   `IconButton`, so the designed disc, its ring and its shadow were absent.
2. `ConfirmationBody` used the asset under `transform: rotate('179.55deg')`. **The exported asset
   points right.** Measured rather than eyeballed: decoding the PNG and taking the dark-pixel
   span across the vertical middle gives x = 72…83 of 129, i.e. the vertex sits right of centre.
   Rotating it ~180° therefore made a *forward* navigation row point backwards.

Both now go through one component, `DirectionalDisc`, which renders the exported asset as-is for
`forward` and mirrors it (`scaleX: -1`, not a rotation) for `back`. `IconButton` is untouched and
still serves the sheet's bare `backArrow` (`1:739`), which is a different control.

### Address `275:4473` — MINOR_MISMATCH, remediated

- header, as above;
- `230:1955` truncates each saved address to **one** line; the implementation allowed two.

The map placeholder deviation recorded in earlier passes still stands — `53:37` is an unbranded
illustration in Figma and the map SDK is still an open engineering choice.

### Instant booking `267:3520` — MINOR_MISMATCH + reachability, remediated

All four states were already built with real exported illustrations, and the frame ids carried
over unchanged. Two fixture values were wrong against the finalized frames, and one was a
behaviour change:

| State | Element | Was | Finalized | Action |
| --- | --- | --- | --- | --- |
| `44:5378` | message | "Sorry, all sold out!" | "Instant slots are unavailable, but schedule ones are!" | fixed |
| `44:5378` | CTA tone | lime `accent` | **yellow `primary`** | fixed |
| both | CTA label | "Schedule" | **"Schedule NOW"** | fixed |

**DEV reachability** was the real gap: the sheet only opened by tapping the Home tile and the two
blocked states had no entry point at all, so three of the four finalized states could not be
reviewed. `spoon://home?instant=available|taxes|outOfShift|noSlots` now opens each one;
`initialTaxesOpen` exists solely so `25:1585` can be deep-linked. `__DEV__`-only.

### Scheduled flow `267:3521` — MAJOR_MISMATCH, remediated

Schedule was built against the superseded `37:3703`, whose footer the finalized section does not
draw. Per §10 of the brief, the delta is recorded before the change:

```
OLD_IMPLEMENTATION_NODE : 37:3703  (footer 37:3907)
FINAL_SECTION_NODE      : 267:3521 (steps 275:4488 / 275:4713 / 275:4938 / 34:3035; footer 275:4177)
EXACT_VISUAL_DELTA      : the 37:3912 inset black "Pay ->" pill and the #F1F5F9 "Share your
                          requests" bar are absent from all four finalized frames. 275:4177 is a
                          338 x 67 block holding ONE 330 x 34 bar at y 6.5 and a 14pt underlined
                          "Check payment details" line at y 46.5 — the same footer the Instant
                          sheet carries. The header is also the shared 338 x 38 63:783 instance
                          (275:3804), not the 56pt hairlined bar this screen drew.
```

`payLabel` / `secondaryCtaLabel` were replaced by `paymentDetailsLabel`; `onPay` /
`onOpenMealBrief` by `onOpenPaymentDetails`. Business rules were not touched — reschedule still
supplies no payment line, so no Razorpay path can be reached from it (B-4 stands).

> **Consequence that needs a product decision.** The removed second bar was Schedule's Meal Brief
> entry point. Meal Brief is outside the six finalized sections and no finalized frame links to
> it, so it is now unreachable in the product flow (still reachable in development at
> `spoon://meal-brief`). Recorded as `MEAL_BRIEF_ENTRY_POINT: PRODUCT_PENDING` rather than
> silently re-adding a control the finalized design does not draw.

### Cancellation `115:2821` — MINOR_MISMATCH, remediated

`6:2` was re-read at node level. Three defects, one of them a plain wiring bug:

1. **Both policy notices rendered the same glyph.** `CANCEL_NOTE_ART` was keyed `fee` /
   `reschedule`, but the payload supplies `compensation` / `reschedule-once`. Neither key matched,
   so both notices fell through to the fallback and the `110:2621` "Synchronize" mark never
   rendered at all — despite `assets/figma/cancel/note-sync.png` already being in the repo. Keys
   corrected.
2. **The sheet's back control was a bare arrow.** `111:2640` draws the 32 × 32 disc. `BottomSheet`
   already had a `backVariant="outlined"` path, but the cancellation sheet did not use it and the
   path itself still drew a Feather chevron. It now renders `DirectionalDisc`, and the sheet asks
   for it. The `plain` path still draws `1:739`, the Instant sheet's genuinely different bare
   20pt arrow.
3. **The notices were 66 tall against a drawn 45.** `NoticeCard`'s `minHeight: 66` is a real
   measurement — of `208:553` / `201:458`, which are different frames with longer copy.
   `107:2587` / `107:2613` measure **45**. Added as a `density="tight"` prop rather than changed
   globally (§16), so the reassignment and auto-cancel notices are untouched.

Verified as already correct against `6:16`: the `#FFF7CC` fee table at radius 24 / p 15.889 with
its SemiBold 10/15 +0.5 uppercase header, Medium 11/16.5 row labels and Bold 12/16 values with
"Free" at `#01CF8F`; the notice cards' white fill, 1pt `#FFD600` edge, 16pt radius, 32pt art and
Medium 11/16.5 over Regular 10/15 ramp.

**Residual, not fixed:** at 393dp the rendered sheet measures ~652dp against the frame's 520. The
notice fix accounts for ~42 of the 132pt gap; the rest is distributed across inter-block gaps
(measured ~21 where `6:16` specifies 12). Recorded as `CANCEL_SHEET_HEIGHT: NEEDS_FIX` rather
than claimed — see §P6.5.

### Profile `275:6021`

Inherits the header change (and stops overriding density, because `257:3504` *is* the shared
geometry). Its own frame ids carried over unchanged from the superseded file, and no per-node
re-read of the identity card, tile grid or footer has been completed this pass — see §P6.5.

## P6.4 Android runtime matrix — finalized sections only

Captured with the repaired harness (§P6.2). **16 routes × 6 viewports = 96 captures**, each one
validated before it was allowed to count:

| Gate | Rule | Result |
| --- | --- | --- |
| Route reached | the screen's root `testID` present as `resource-id` in the dump | 95 / 96 |
| Non-blank | PNG decoded; rejected if one colour covers > 98.5 % of a 4-px grid | **0 blank** |
| Not a duplicate | sha256 of the frame compared across every route at that viewport | **0 duplicates** |
| Real content | > 8 nodes in the hierarchy | 96 / 96 |
| Horizontal overflow | any node with `x2 > screenWidth` or `x1 < 0` | **0 across all 96** |

`EXPECTED_ROUTE_OR_SCREEN_MARKER_FOUND` is the gate that carries the verdict; "no JS error" is not
recorded anywhere, because §P6.2 shows it means nothing.

| route | node | 320 | 360 | 393 | 411 | 430 | short | ovf | trunc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| login | `250:2383` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| otp-wait | `275:4289` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| otp-ready | `250:2439` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| otp-error | `275:4349` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| addr-location | `53:31` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| addr-details | `60:655` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| addr-oos | `215:1472` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 6* |
| addr-saved | `68:214` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 6* |
| profile | `6:663` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| history | `6:227` | RETRY→PASS | PASS | PASS | PASS | PASS | PASS | 0 | 1* |
| refunds | `71:615` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| cancel-policy | `6:2` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| cancel-reason | `104:2260` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| cancel-refund | `104:2336` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| cancel-done | `115:2703` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |
| schedule | `275:4488` | PASS | PASS | PASS | PASS | PASS | PASS | 0 | 0 |

\* Every recorded truncation is an ADDRESS LINE that Figma itself draws truncated
(`230:1955` — "B-402, Green Meadows, Indiranagar 100feet Roa…"). None is a layout defect.

`history@w320` failed its first attempt — the marker never appeared and the frame showed Home, so
the harness recorded FAIL rather than a capture. Re-run on the same viewport it passes, and it
passed at the other five widths on the first attempt, so it is a transient deep-link race on a
cold start, not a routing defect. **The value of this row is that the old harness would have
recorded it as a pass**: the frame was non-blank, unique and error-free — it was simply the wrong
screen.

A second run covered the four Instant states plus every screen changed after the main sweep, at
393 and 320 — **18 / 18 PASS**, including all four `?instant=` deep links.

### Keyboard — observed, not inferred

Both screens tested on the hardest viewport, **360 × 568**, with `dumpsys input_method` confirming
`mInputShown=true` in the same frame as the capture:

| Screen | Closed | Open | Focused field visible | CTA / actions reachable | Result |
| --- | --- | --- | --- | --- | --- |
| Login `250:2383` | PASS | PASS | yes | Continue **and** the legal footer both on screen | **PASS** |
| OTP `275:4289` | PASS | PASS | yes | all six boxes **and** the resend line on screen | **PASS after fix** |

**OTP defect found and fixed (two causes, both measured on device):**

1. The real input sat at `position: absolute; top: 0; left: 0` as a 1 × 1 box. Android scrolls a
   focused input into view on its own, so focusing it pulled the scroll to the TOP — fighting
   `revealInput` and leaving the boxes half under the IME. The input now covers the digits panel
   (transparent, `caretHidden`), so the platform's own auto-reveal targets the boxes.
2. The short-height clamp could never fire. It derived available height from
   `useWindowDimensions`, but under this app's edge-to-edge display Android never resizes the
   window, so `windowHeight` is identical with the keyboard up and down. The clamp now subtracts a
   `Keyboard`-event height explicitly.

A third, cosmetic issue surfaced from the fix: at the 96pt floor the 93pt lockup was sliced,
leaving a stray yellow fragment. The lockup is now **dropped** below 138 (93 + 6 + 39) rather than
clipped. Every viewport that can afford the designed 172 is unchanged — verified by re-capturing
the keyboard-closed state at 360 × 568, which still draws the full lockup.

## P6.5 Outstanding — what is NOT claimed

1. **`CANCEL_SHEET_HEIGHT: NEEDS_FIX`.** After the notice-height and gap fixes the sheet still
   measures taller than `6:3`'s 520 at 393dp. All content is reachable and every block matches its
   node, but the composition is not yet the drawn one.
2. **Profile `6:663` — per-node re-read NOT done.** The header is corrected and the screen renders
   clean at all six viewports, but the identity card, the 2 × 2 tile grid and the footer have not
   been compared against their nodes in the finalized file. Not claimed as pixel-verified.
3. **Address `53:31` / `60:655` — partial.** Header and the saved-list truncation are fixed; the
   map step and the multi-field form have not had a per-node re-read this pass.
4. **Cancellation steps 2–4** (`104:2260`, `104:2336`, `115:2703`) — rendered and responsive at all
   six viewports, but only step 1 (`6:2`) had a per-node comparison.
5. **Keyboard matrix is partial.** Login and OTP are done. Add-address, edit-address and the
   cancellation "Others" reason field are inside finalized sections and have NOT been keyboard-
   tested. Meal Brief and completion feedback are outside the finalized scope.
6. **`MEAL_BRIEF_ENTRY_POINT: PRODUCT_PENDING`** — see §P6.3.
7. **`PHYSICAL_ANDROID_VERIFIED: NO`** — `adb devices` reported only `emulator-5554` at the start
   of the session and again at the end. No handset was attached at any point.
8. **`IOS_SIMULATOR_VERIFIED: NO`** — Windows. `docs/IOS_QA_CHECKLIST.md` remains the plan.
9. **`COMMENTS_ACCESSIBLE: NO`** — the MCP surface still exposes no comments API.
10. **Copy deviation, deliberate:** `68:214` labels the add bar "Add a new addresses". The
    implementation says "Add a new address". Copy is server-owned and the frame's plural is a
    typo; recorded rather than replicated.

---

# PASS 5 — FOUNDER COMPLIANCE + FIGMA `IT5DnVMAO750PzuYaC2rxo`

Two things arrived together: an explicit founder brand standard (palette, family, weights) and a
new Figma revision. This pass audits the repository against **both**, before any screen is edited.

**Pass 5 status: audit complete, remediation in progress.** §P5.1–§P5.4 are finished and are
evidence-backed. §P5.5 lists what remains.

## Founder Design Compliance

### Colors

The founder-locked palette is ten values. Every one of them is already present in
`src/ui/tokens/primitives.ts` at the **exact** hex — there are no brand-colour mismatches.

| Current token | Current value | Expected founder value | Match | Files / components affected |
| --- | --- | --- | --- | --- |
| `palette.yellow500` | `#FFD600` | `#FFD600` | **MATCH** | `Button` (primary CTA), `PriceTile` badge, `semantic.surfaceCta` / `surfaceBadge` / `borderNotice`, Profile "Complete profile", Address CTA, `CookCard` bullets |
| `palette.yellow33` | `#FFDE33` | `#FFDE33` | **MATCH** | `semantic.borderCtaSoft` — auto-cancel "No" outline, cancellation step-3 bar, `ratingBorder.mid` |
| `palette.yellow400` | `#FFE666` | `#FFE666` | **MATCH** | `semantic.surfaceAccentBold` — Schedule tile, duration-matrix header, `InfoDialog` disc, `toneColors.warning`, `ratingFill.mid` |
| `palette.yellow300` | `#FFEF99` | `#FFEF99` | **MATCH** | `semantic.surfaceAccentStrong` — promo centre panel, trust tiles, `borderAccent`, `ratingFill.low` |
| `palette.yellow200` | `#FFF7CC` | `#FFF7CC` | **MATCH** | `semantic.surfaceAccent` — promo side panels, `NoteCard`, `FeeSchedule`, `toneColors.info`, `ratingFill.lowest` |
| `palette.lime500` | `#CFFF04` | `#CFFF04` | **MATCH** | `semantic.borderPositive` / `surfacePositiveBright` — `UpcomingBookingCard` hairline, timer chip, `StatusBanner` disc, `Button` accentBright, `ratingBorder.highest` |
| `palette.canary` | `#E2FF68` | `#E2FF68` | **MATCH** | `semantic.surfaceEta` — Instant ETA pill, splash wash, `ratingBorder.high` |
| `palette.lime300` | `#ECFF9B` | `#ECFF9B` | **MATCH** | `semantic.surfacePositive` — Instant tile, `tileSelected`, `toneColors.positive`, `accentSecondary`, `ratingFill.high`/`highest` |
| `palette.black` | `#000000` | `#000000` | **MATCH** | `textPrimary`, `textOnAccent`, `surfaceInverse`, every elevation `shadowColor` |
| `palette.white` | `#FFFFFF` | `#FFFFFF` | **MATCH** | `surface`, `textInverse` |

**FOUNDER_COLOR_COMPLIANCE (brand ten): YES.** No token carried a sampled or approximate brand
value; the ramp was already corrected in an earlier pass and the founder list confirms it.

#### Derived brand values — legitimate, kept

These are not additional brand colours. Each is a founder colour composited at a stated alpha over
its ground and flattened, because Android renders an elevation shadow *through* a translucent fill
and drew visible dark frames on device. The arithmetic was re-verified this pass and all seven are
exact:

| Token | Value | Derivation | Verified |
| --- | --- | --- | --- |
| `limeBanner` | `#F6FFCD` | 0.5 × `#ECFF9B` over white → (245.5, 255, 205) | ✓ |
| `limeTrust` | `#F2FFB9` | 0.7 × `#ECFF9B` over white → (241.7, 255, 185) | ✓ |
| `limeSoft` | `#F9FFE1` | 0.3 × `#ECFF9B` over white → (249.3, 255, 225) | ✓ |
| `limeRate` | `#F1FFB4` | 0.3 × `#CFFF04` over white → (240.6, 255, 179.7) | ✓ |
| `yellowSoft` | `#FFFAE0` | 0.3 × `#FFEF99` over white → (255, 250.2, 224.4) | ✓ |
| `tileIdle` | `#FFFADB` | 0.7 × `#FFF7CC` over white → (255, 249.6, 219.3) | ✓ |
| `butterySoft` | `#FFFCF1` | 0.7 × `rgba(255,251,235)` over white → (255, 252.2, 241) | ✓ |

#### Non-founder values that need a ruling

Brand-adjacent values that are **not** in the founder list. All but the last two cite a real node,
so they are the file's own semantic colours rather than invented ones — but they are yellows and
limes outside the approved ramp, and the founder should confirm them:

| Token | Value | Cited node | Role | Status |
| --- | --- | --- | --- | --- |
| `yellow76` | `#FEE685` | `color/yellow/76`, `3:769` / `3:796` | Recipe-card border, address-CTA glow | `MANUAL_COMMENT_REVIEW_REQUIRED` |
| `yellow59` | `#FFD230` | `color/yellow/59`, `3:780` | Recipe input border | `MANUAL_COMMENT_REVIEW_REQUIRED` |
| `limeWash` | `#EAF086` | `71:887` | Loading-interstitial ground | `MANUAL_COMMENT_REVIEW_REQUIRED` |
| `danger` | `#D92D20` | **none** | Generic error ink | **NEEDS_FIX — authored, not measured** |
| `dangerSurface` | `#FEE4E2` | **none** | Generic error surface | **NEEDS_FIX — authored, not measured** |

`danger` / `dangerSurface` are the only two colour tokens in the file with **no node provenance**.
Every other entry names the node it was read from. They must be re-read from a real error state in
`IT5DnVMAO750PzuYaC2rxo` (the OTP error frame `239:2261` is the first genuine error state the
design has ever contained — see §P5.3) or deleted.

Semantic non-brand inks (`springGreen`, `emerald`, `amber700`, `rose600`, `rose39`, `rose`,
`roseSurface`, `roseLogout`) and the slate/grey ramps all cite nodes and are outside the brand
question.

#### Raw-hex leakage

The token layer holds essentially all colour. A scan of every `.ts`/`.tsx` under `src/`, excluding
comments and the token files themselves, found **three** raw values in executable code:

| File | Line | Value | Note |
| --- | --- | --- | --- |
| `src/features/home/components/HomeCuisines.tsx` | 34 | `rgba(236,255,155,0.35)` + two `rgba(0,0,0,0.5)` | Gradient stops — `#ECFF9B` at 35 % |
| `src/features/home/components/HomeCuisines.tsx` | 35 | `rgba(255,214,0,0.1)` + two `rgba(0,0,0,0.5)` | Gradient stops — `#FFD600` at 10 % |
| `src/features/booking/components/InstantSheet.tsx` | 277 | `rgba(255,255,255,0.45)` | Sheet wash |

All three are founder colours at an alpha, so they are correct *values* in the wrong *place*.
Scheduled for promotion into the token layer as gradient/wash tokens.

### Fonts

**Audited state (before this pass)**

| Question | Finding |
| --- | --- |
| Which Livvic files were bundled? | **None in the project.** The app resolved all five faces out of `node_modules/@expo-google-fonts/livvic/*/`. |
| Which weights exist? | 400, 500, 600, 700, 900 — all five present in that package (which ships 16 faces including italics). |
| Which weights missing? | None. |
| Fallback/system fonts rendering? | No silent fallback in the token layer — every one of the 60+ typography tokens emits an explicit `fontFamily`. `_layout.tsx` does fall through to the system face if loading *errors*, which is deliberate (a font failure must not strand the user on the splash). |
| Android/iOS family mapping correct? | Yes in principle — tokens emit `fontFamily` and never `fontWeight`, which is the only correct approach on Android, where a custom family plus `fontWeight` silently renders the base face. |
| Does loading block render? | Yes, correctly. The splash is held until *both* the session resolves and fonts load; `RootLayout` returns `null` while `!fontsLoaded && fontError === null`. |

**The one real violation:** founder requirement §2 forbids referencing fonts from `node_modules`
internals. That is exactly where every face was coming from.

**Remediated this pass**

1. The five approved faces were copied — unmodified, verified genuine (valid `0x00010000` sfnt
   header, SIL Open Font License in the name table) — into `assets/fonts/`:
   `Livvic-Regular.ttf`, `Livvic-Medium.ttf`, `Livvic-SemiBold.ttf`, `Livvic-Bold.ttf`,
   `Livvic-Black.ttf`.
2. `src/app/_layout.tsx` now registers them through `expo-font`'s `useFonts` with `require()`
   against those asset paths.
3. Registration keys are **unchanged**, so no typography token moved:

   | Asset | Registered family | Weight |
   | --- | --- | --- |
   | `assets/fonts/Livvic-Regular.ttf` | `Livvic_400Regular` | 400 |
   | `assets/fonts/Livvic-Medium.ttf` | `Livvic_500Medium` | 500 |
   | `assets/fonts/Livvic-SemiBold.ttf` | `Livvic_600SemiBold` | 600 |
   | `assets/fonts/Livvic-Bold.ttf` | `Livvic_700Bold` | 700 |
   | `assets/fonts/Livvic-Black.ttf` | `Livvic_900Black` | 900 |

   Registering by explicit key rather than letting each platform infer a PostScript name is what
   keeps the mapping byte-identical on Android and iOS.
4. `@expo-google-fonts/livvic` removed from `package.json` and `package-lock.json`; the Jest mock
   moved from that package to `expo-font`.
5. `expo-font` is already in `app.config.ts` `plugins`, which is what registers the native module
   on both platforms. Fonts are **not** declared in the plugin's `fonts:` array on purpose — that
   path embeds faces under their internal PostScript names, which would silently change every
   `fontFamily` string the tokens emit.

Verified after the change: `tsc --noEmit` clean, **303/303 Jest tests pass**.

**FOUNDER_FONT_COMPLIANCE: YES** for bundling, weights and mapping. Android/iOS *runtime* render
verification is still outstanding — see §P5.5.

## P5.1 Delta method

`get_metadata` on `0:1` returns ~797 k characters for the new file, past the tool's limit, so both
the new file and its predecessor were pulled to disk and compared programmatically rather than by
eye.

Child coordinates in the metadata XML are **parent-relative**, which makes a subtree directly
comparable between files once the top-level frame's own absolute `x`/`y` is stripped. Each
top-level frame was therefore reduced to a normalised body and hashed; equal hash ⇒ byte-identical
subtree ⇒ `UNCHANGED`. Anything that differed was line-diffed to locate the exact nodes.

**Baseline correction.** The first run diffed against `QMgajesW22fQcUbs7TKspS` and produced a
misleadingly large delta (17 changed frames). That is the *pass-2* file, not the baseline the
shipped code was written against. Re-run against `1kd1u3WEc00SENkToIPloW` — the pass-4 source of
truth, and the revision the current implementation actually targets — the delta is far tighter and
is the one recorded below. Node IDs are carried across all three revisions, so a matching ID is
evidence of lineage only, never of equivalence.

## P5.2 Classification — 43 top-level frames

Previous file: 49 top-level frames. Current file: 43.

| Class | Count |
| --- | --- |
| UNCHANGED | 27 |
| CHANGED | 12 |
| NEW | 4 |
| REMOVED / OBSOLETE | 11 (from the previous file) |

### NEW

| Node | Name | Nodes | Note |
| --- | --- | --- | --- |
| `250:2861` | Page 7b- Booking details | 109 | No predecessor. Screen does not exist in the app. |
| `250:2383` | Page 17a- Login No. | 79 | Replaces removed `53:174` (also 79 nodes) — relocated and re-authored. |
| `250:2439` | Page 17b- Login OTP | 86 | A **third** OTP frame. Variant not yet identified. |
| `267:3520` | Instant booking | 1106 | Flow board. Absorbs the four removed standalone Instant frames. |
| `267:3521` | Scheduled flow | 1262 | Flow board. Absorbs the six removed standalone Scheduled frames. |

### CHANGED

| Node | Name | Node count | What moved |
| --- | --- | --- | --- |
| `3:1041` | Page 7- Confirmation | 315 → 268 | 47 nodes removed — largest structural reduction in the file. |
| `3:1381` | Page 8a- En route on time | 270 → 277 | +7 nodes. |
| `3:1658` | Page 9- Arrived | 297 → 288 | −9 nodes. |
| `101:1812` | Page 10- In service | 309 → 284 | −25 nodes. |
| `6:663` | Page 15- Profile | 200 → 184 | −16 nodes. |
| `201:100` | Page 8c- Reassigned on time | 281 → 281 | Notice copy rewritten; card 57 → 66 tall; body text 14 → 17 and 27 → 30; everything below shifts +9. |
| `201:278` | Page 8e- Auto cancelled | 158 → 158 | `rebook` block 126 → 138 tall. |
| `3:2002` | Page 11- Extension | 125 → 125 | Both notice cards rewritten; 57 → 60 and text 14 → 17 / 27 → 30; "Not able to extend at the moment?" 204 → 238 wide, re-centred (x 50.83 → 33.83), 16 → 20 tall. |
| `6:227` | Page 14- Booking history | 200 → 200 | Header instance 370.44 × 56 → **370 × 45**; body origin follows. |
| `115:2821` | Cancellation flow | 408 → 408 | `104:2281` reason list 167 → 201 tall. |
| `227:1649` | Page 17b- Login OTP | 86 → 86 | Resend block 330 → 338 wide; row x −4 → 0. Full-width correction. |
| `239:2261` | Page 17b- Login OTP | 86 → 87 | **Now an error state**: adds `239:2312` "Incorrect OTP. Please try again" at y 56; resend demoted to new `250:2437` at y 79; container 78 → 99; CTA 153 → 174. |
| `54:280` | Icons | 26 → 27 | Adds `250:2970` "back", 32.25 × 32.25. |

The recurring `14 → 17` / `27 → 30` / `16 → 20` text-height shifts across `201:100`, `3:2002` and
`6:663` are a **typography change, not a copy reflow** — the same nodes grew in height at unchanged
width. Exact family/size/line-height must be read per node before these screens are touched.

### RE-PARENTED (corrected)

A first pass classified eleven frames as REMOVED because they stopped being *top-level*. That was
wrong, and the correction matters: re-indexing every element at **any depth** (7011 old / 6727 new)
shows ten of them still exist, moved inside the two new flow boards with their node IDs intact.

| Node | Name | Now lives in | Class | Subtree |
| --- | --- | --- | --- | --- |
| `1:728` | Page 4a- Instant- available | `267:3520` | CHANGED | 382 → 155 lines |
| `25:1327` | Page 4c- Instant- NA out of shift | `267:3520` | CHANGED | 383 → 389 |
| `44:5378` | Page 4c- Instant- No slots | `267:3520` | CHANGED | 383 → 389 |
| `25:1585` | Page 4b- Instant taxes pop up | `267:3520` | CHANGED | 396 → 167 |
| `34:2105` | Page 5c- Scheduled eve | `267:3521` | CHANGED | 294 → 274 |
| `34:1919` | Page 5b- Scheduled noon | `267:3521` | CHANGED | 309 → 289 |
| `34:3035` | Page 5b- Scheduled morning | `267:3521` | CHANGED | 349 → 329 |
| `37:3703` | Page 5b- Scheduled duration | `267:3521` | CHANGED | 203 → 183 |
| `37:3943` | Page 5b- Scheduled time | `267:3521` | CHANGED | 117 → 102 |
| `37:4183` | Page 5b- Scheduled day | `267:3521` | CHANGED | 92 → 77 |

The large drops on `1:728` and `25:1585` are not deletions of the sheet — they are the removal of
the full Home-screen backdrop each frame used to carry behind it. The sheet itself was re-authored:
`1:729` is gone, replaced by `267:3532`.

### REMOVED / OBSOLETE — one frame

| Node | Name | Superseded by |
| --- | --- | --- |
| `53:174` | Page 17a- Login No. | `250:2383` |

So only the old Login node is genuinely gone, and the "~35 obsolete citations" figure below is
correspondingly narrower than first stated: the Instant and Scheduled citations still resolve, they
simply resolve to re-authored content that must be re-read rather than to nothing.

### DESIGN CONTRADICTION — Scheduled exists twice

**`DESIGN_PENDING` — needs a designer ruling before Schedule is touched.**

The current file contains two incompatible Scheduled designs:

| | Top-level `47:*` | Inside flow board `37:*` |
| --- | --- | --- |
| Frames | `47:6549` day, `47:6450` time, `47:6059`/`47:5844`/`47:5638` slots | `37:4183` day, `37:3943` time, `37:3703` duration |
| Delta vs previous file | **UNCHANGED** | **CHANGED** |
| Section width | 338, inset 16 | 338 (day/time) but **370, full-bleed** on `37:3703` |
| Footer | `div.pt-2`, **104pt**: a 52pt bar with an inset `Pay →` pill, then a 36pt "Share your requests" bar | `267:3522` "CTA inactive", **53pt**: one 34pt `rgba(0,0,0,0.07)` bar reading "Book NOW", Livvic Black 16/24 — no Pay pill, no secondary bar |
| `37:3703` footer | — | **none at all** |

The shipped `ScheduleScreen` implements the `47:*` design. Adopting the flow-board version would
delete the Pay pill and the "Share your requests" bar; adopting neither leaves Schedule stale if the
flow board is the intent. The two cannot both be right, and `37:3703` having no CTA at all suggests
the flow board is still in progress.

**`SCHEDULE_DESIGN_AUTHORITY: PRODUCT_DESIGN_PENDING`** — ruled by the product owner on this pass.
Schedule stays exactly as it is until a design authority is named. The unchanged `47:*` frames are
what it currently matches, so leaving it is the non-destructive option.

Blocked on that ruling, and on nothing else: **Schedule (day / time / duration / morning / noon /
eve)** and the **Scheduled CTA footer**. Reschedule is NOT blocked — its eligibility rules
(free, once, same duration) are backend-owned and were not touched.

## P5.6 Remediation applied

### Instant sheet — `267:3532`

Geometry re-read node by node. The implementation was already close (2-column grid, canary ETA
pill, pinned CTA); five values were off:

| Value | Was | Now | Evidence |
| --- | --- | --- | --- |
| `PriceTile` badge `right` | 6.1 | **5.6** | `267:3586` is 44 wide at x 114.9 on a 164.5 tile |
| Body block gap | 29 | **16** | `267:3543` ends at 32, `267:3548` starts at 48 |
| Body `paddingTop` | 20 (shared) | **16** (restated locally) | header ends 73.8, body starts 89.8 |
| CTA gap | 29 | **46.4** | grid box ends 288.8, CTA box at 326.2, button 9 in |
| Caption gap | 4.4 | **6** | button ends 43, `267:3609` at 49 |

Confirmed already exact and left alone: grid column gap 8, row gap 10, tile 164.5 × 67.6 at
padding 9.8 / gap 4 / radius 12, idle `#FFFADB`, selected `#ECFF9B` + `0 0 4 rgba(0,0,0,0.15)`,
disabled `rgba(0,0,0,0.07)`, title Black 16/24 −0.4, strike SemiBold 10/15 at 70 %, price Bold
14/20, badge px 6 / py 2 / radius 6 / `#FFD600`, ETA pill 109 wide at radius 8, header px 16 /
py 12 / gap 3 / hairline 0.8, title Black 20/20.

### Login — `250:2383`

The screen was already built against this design. One mismatch: the rule closing the `+91` cell
(`250:2416`) is **1.778**, not 1.67. `stroke.base` had exactly one consumer, so it was re-valued
rather than forked.

### OTP — `227:1649` / `250:2439` / `239:2261`

The error frame is new, and it supplies the file's only real error colours:

- `danger` `#D92D20` → **`#FF0404`** (`239:2312`)
- `dangerSurface` `#FEE4E2` → **`rgba(255,4,4,0.07)`** (`239:2294`)

These were the only two colour tokens in the repository with no node provenance; §"Non-founder
values that need a ruling" above is closed for both. Re-valuing was safe: `dangerSurface`'s only
visual consumer is a booking-status pill tone the file never draws (`6:252` draws four fills, none
of them danger).

Screen changes:
- the error line moved **inside** the digits block, between the boxes and the resend line, at the
  block's own 6pt rhythm — it was previously a sibling below the block;
- its type ramp corrected from Regular 10/15 to **Livvic Medium 11/16.5**;
- every digit box now swaps `#FFEF99` → the red tint while errored, as `239:2294` draws;
- the resend line gained `resendLabelAccent`, because `250:2437` sets the trailing token ("26s")
  in Bold against a Medium lead — one text node, two runs. New token `typography.otpTaglineStrong`.
- fixtures for all three states re-aligned to the frames' exact copy, including `250:2439`'s
  "Resend OTP via SMS", which is a single run and so carries no accent token.

## P5.3 Consequence — revoked PIXEL_PERFECT status

Node IDs cited throughout the implementation as provenance now point at **deleted** frames. Any
`PIXEL_PERFECT` claim resting on them is void until re-verified against the flow boards.

Affected citations found in source, by owning obsolete frame:

- `1:728` (Instant): `1:729`, `1:744`, `1:753`, `1:754`, `1:755`, `1:758`, `1:766`, `1:788`,
  `1:789`, `1:798`, `1:812`, `1:815`, `1:818`, `1:820`, `1:821`, `1:829` — consumed by
  `InstantSheet`, `PriceTile`, `Button`, `BottomSheet`, `layout.etaPillRadius`, `layout.ctaRadius`,
  `layout.sheetRadius`, `elevations.subtle`/`cta`/`badge`.
- `37:3703` / `37:3943` (Scheduled): `37:3705`, `37:3712`, `37:3716`, `37:3722`, `37:3776`,
  `37:3778`, `37:3907`, `37:3918`, `37:3920` — consumed by `ScheduleScreen`, `typography.labelMedium`,
  `bodyBlack`, `strikeCompact`, `priceCompact`, `headingScreen`, `Button` secondary,
  `semantic.borderHairline`, `textFieldLabel`, `textSecondaryStrong`.
- `34:3035` (Scheduled morning): `34:3155`, `34:3157` — `Chip` disabled state, `typography.slotLabel`.
- `25:1585` (taxes pop-up): `47:6621`, `48:6634` — `InfoDialog`.
- `53:174` (old Login): `53:210`, `53:212`, `53:225`, `53:229`, `53:232`, `53:238`, `53:244` —
  `LoginScreen`, `typography.labelUpperBlack`, `labelUpperTight`, `displayHero`, `phoneValue`,
  `ctaUpper`, `fieldValue`, `headingCtaTight`, `elevations.glow`.

**Status revoked to `NOT_AUDITED` pending re-read:** Instant (all states), Instant taxes dialog,
Schedule (day/time/duration/morning/noon/eve), Login. **Status revoked to `NEEDS_FIX`:**
Confirmation, En route on time, Arrived, In service, Profile, Reassigned on time, Auto cancelled,
Extension, Booking history, Cancellation flow, OTP (both existing frames).

Values these tokens hold are not presumed wrong — the flow boards are a re-layout of the same
design language, and a value may well be carried over intact. They are presumed **unverified**.

## P5.4 Comments / designer notes

`COMMENTS_ACCESSIBLE: NO`

The `figma-desktop` MCP surface exposes `get_metadata`, `get_design_context`, `get_screenshot`,
`get_variable_defs`, `get_code_connect_map`, `get_design_system_context` and the Make/FigJam tools.
**No tool in the connected surface reads Figma comment threads**, and none returns annotations,
node descriptions or component descriptions as a separate channel. Standard Figma comments have
therefore **not** been reviewed, and no claim is made that they were.

Frames flagged `MANUAL_COMMENT_REVIEW_REQUIRED` — the ones most likely to carry designer notes,
being new, restructured, or carrying an unexplained value:

`267:3520` (Instant booking), `267:3521` (Scheduled flow), `250:2861` (Booking details),
`250:2383` (Login No.), `250:2439` + `239:2261` + `227:1649` (the three OTP frames),
`3:1041` (Confirmation), `101:1812` (In service), `6:663` (Profile), `54:280` (Icons).

Please supply screenshots or pasted comment text for these.

### Confirmation — `3:1041` (the largest rework in the file, 315 → 267 nodes)

| Element | Change |
| --- | --- |
| Hero `40:5346` | Was a CENTRED disc-above-title block. Now a ROW: Livvic Black 20/28 title over a NEW Livvic Bold 14/20 schedule line (`250:2951`) on the left, the 64pt `#CFFF04` disc on the right in a 73.885pt column with an 8pt bottom inset. The disc's `0 8 10 rgba(0,0,0,0.1)` lift is GONE — the node draws it flat. |
| Detail rows `3:1095` | REMOVED from this screen. The node moved to `250:2861`. |
| Note `250:2942` | NEW — "Note before starting", `#FFF7CC` at radius 16, 32 × 66 to-do mark, `0 0 2 rgba(0,0,0,0.07)`. |
| Details row `250:2966` | NEW — 39pt, 1pt `#FFD600` edge at radius 15, px 12 / py 6, a 35pt glyph, Livvic Bold 14/20 label, and `250:2970` rotated 179.55° into a forward chevron. |
| Actions `250:2978` | Two 34pt bars 12pt apart replace the single white bar holding two text links. "Cancel" = white behind a 1pt `#FFDE33` edge; "Reschedule" = flat `#FFD600`. Neither carries a lift. |

`StatusBanner`'s `stacked` layout was renamed `hero` and re-implemented — it had exactly one
consumer, this screen, and the node that defined it changed shape.

### En route / Arrived / In service — shared banner and cook card

Three screens, two shared components, all read off `40:5356` and `256:2986`:

| Component | Change |
| --- | --- |
| `StatusBanner` row gap | 20 → **16** |
| `StatusBanner` title | `titleBlack` (Black 14/20) → `title` (**Bold** 14/20) |
| `StatusBanner` glyph | The 31pt mark above the title (`99:1238` / `101:1884`) is **REMOVED**. `art` deleted from the component and from both call sites. |
| ETA panel `97:1231` | 117 × 103 → **122 × 103**; `#CAD5E2` hairline → **1pt `#CFFF04`**; gains an INNER `0 0 4 rgba(0,0,0,0.15)`. Drawn natively — the exported vector is a plain rounded rect, so rasterising it would only cost crispness. |
| `headingEta` | Black 24/25 → **23/25**. Sole consumer is that panel, so the token was re-valued. |
| `CookCard` attributes | The `#FFD600` bullet separators are **REMOVED**. Column one 86 → **94**, column gap 4, row gap 3.5 → **3**, icon-to-label 3 → **3.11**. |
| `CookCard` name | Left-aligned → **centred** across the column. |
| `CookCard` CTA | `alignSelf: flex-start` + `minWidth 90` → spans the column inside a 2pt-inset row (`257:3108`). Label `captionStrong` (Medium 10/13.33) → `slotLabel` (**Bold 11/16.5**). |

### Typography — the `14 → 17` ramp, resolved

Traced node by node to `NoticeCard` (`208:553`), and it is a **component-level** change, not a
token revalue:

| Line | Was | Now | Effect |
| --- | --- | --- | --- |
| Title `208:558` | Livvic Medium 10/13.33 | Livvic **Medium 11/16.5** | box 14 → 17 |
| Body `208:559` | Livvic Regular 9/13.5 | Livvic **Regular 10/15** | 2 lines 27 → 30 |
| Card | 57 tall, padding 11.889 all round | **66** tall, px 11.889 / **py 6** | — |

`labelMedium` and `caption` already carried the new values and are consumed by screens the file did
**not** touch, so **no token was re-valued**. The card now points at the correct two styles. This
single change explains every `14 → 17` / `27 → 30` / `16 → 20` shift seen on `201:100`, `3:2002`
and `6:663`.

### Gradients — exact, and now tokenised

Both gradients in the file were read off their nodes, not sampled:

| Token | Node | Angle | Stops | Colours |
| --- | --- | --- | --- | --- |
| `gradients.scrimLime` | `144:472` | 179.39916656010394° | 0.43512 % / 78.645 % / 99.565 % | `#ECFF9B` @ 35 %, black @ 50 %, black @ 50 % |
| `gradients.scrimYellow` | `144:463` | 179.72292373311646° | 0.43512 % / 78.645 % / 99.565 % | `#FFD600` @ 10 %, black @ 50 %, black @ 50 % |

The lead stop of each is a FOUNDER colour at an opacity, so both are built through a new
`withAlpha()` helper rather than written as fresh literals. **Angle:** both sit within 0.61° of CSS
180°, which is what `expo-linear-gradient` draws by default; across the widest card the file draws
(162pt) that tilt displaces the band by 1.7pt, below the width of the softest stop transition. The
measured angle is recorded on the token so the decision is visible rather than silently rounded.

**Raw-hex leakage is now zero.** The third value, `rgba(255,255,255,0.45)` in `InstantSheet`,
became `palette.white45` → `colors.surfaceVeil` (`44:5632`). A pre-existing test asserts every
semantic colour resolves to a primitive, which is what forced the veil onto the primitive layer
rather than being composed in the semantic one.

### Profile — `6:663`

| Element | Change |
| --- | --- |
| Header | The 57pt `6:790` bar is replaced by `257:3504`, a **45pt** band: px 4 / py 6, 12pt gap, no underline, same 32pt back disc and Livvic Bold 16/24 title. Added as a `density="compact"` on the shared `ScreenHeader` rather than a second component. |
| Footer `6:765` | 154.43 → **110.43** tall: the "Visit Live Website (spoonhelp.com)" row (`6:766`) is **REMOVED**. Nothing replaced it. |

The "Your profile is incomplete" card (`222:1570`) was already implemented — it entered in the
previous revision, not this one.

### Home — `1:455`

Only one change, and it is copy: three trust tiles were relabelled. **Amenable → Compliant**,
**Efficient → Reliable**, **Punctual → Verified**. The ids are identifiers that select the exported
glyph and are unchanged, because the file did not touch the glyphs. Home's structure, the
below-fold content and the conditional `UpcomingBookingCard` position are untouched.

### Booking details — `250:2861` (NEW)

Implemented as `BookingDetailsSheet`. It is a SHEET, not a screen: a 496pt white panel with 20pt
top corners over an `rgba(0,0,0,0.8)` scrim, opened from Confirmation's `250:2966` row.

- header `250:2879` — 45pt band, pt 16 / pb 6 / px 16, 32pt back disc, Livvic Black 20/28 title
- §1 `257:3499` — py 6, 12pt gap: heading at Livvic Bold 14/20, then `3:1095` — `#FFF7CC`,
  radius 16, padding 19.889, 6pt rows, `0 0 2 rgba(0,0,0,0.15)`, `#FFEF99` rules
- §2 `257:3501` — py 6, 10pt gap: heading, then `257:3439` — lime at 70 % (pre-composited),
  `0 0 4 rgba(0,0,0,0.15)`, **`#CFFF04`** rules

`3:1095`'s value ramp **flattened**: every value is now Livvic Bold 12/16, where the old table ran
Black 16/24 with a Black 18/22.5 hero row. Two `DetailRows` variants were added (`booking`,
`payment`) rather than re-pointing `summary`, whose remaining consumer is the auto-cancel refund
block (`201:550`) — a different node that has not been re-read.

**Business boundary:** every figure on both tables is a pre-formatted server string. The component
performs no arithmetic; "Taxes @5%" is the server's LABEL, not a rate the client applies, and the
total is the server's figure, not `189 + 9` computed on device.

### Icons

The only icon the current file ADDS is `250:2970` "back" (`54:280`, 26 → 27 nodes). It is exported
at 4× and bundled as `assets/figma/icons/back.png` (129 × 129), used unrotated as a back mark and
rotated 179.55° as the forward chevron — exactly how the file itself constructs `250:2974`.
`250:2968`, the 35pt glyph on the details row, is bundled from its raw source as
`assets/figma/booking/view-booking-details.png`. The address kebab, edit and delete marks were
already exported assets from the previous pass and the current file does not change them. No
Feather glyph substitutes for any of these.

## P5.7 Remaining non-Schedule screens

Six frames were re-read node by node this pass. **Two of them turned out not to have changed at
all**, and two of the "known deltas" that came into this pass were artefacts of the wrong-baseline
diff recorded in §P5.1 — they are corrected here rather than implemented.

| # | Screen | Node | Delta vs `1kd1u3…` | Correction applied |
| --- | --- | --- | --- | --- |
| 1 | Extension | `3:2002` | CHANGED (14 lines) | 3 fixes — below |
| 2 | Completion | `143:207` | **UNCHANGED** (150 lines identical) | none needed |
| 3 | Booking history | `6:227` | CHANGED (1 line) | header 56 → 45 |
| 4 | Refund history | `71:615` | **UNCHANGED** (98 lines identical) | none needed |
| 5 | Cancellation | `115:2821` | CHANGED (1 line) | reason typography only |
| 6 | Auto-cancelled | `201:278` | CHANGED (1 line) | rebook gap 10 → 17 |

### 1. Extension — `3:2002`

The NoticeCard ramp was already corrected via `208:553`. Full screen-level read of `143:358`
found three more, all confirmed by arithmetic against the panel's 119.78 → **114** close:

| Value | Was | Now | Evidence |
| --- | --- | --- | --- |
| Fallback panel gap | 12 | **6** | 31.78 padding + 44 text + gap + 32 CTA = 114 |
| Fallback line gap | 6 | **2** | `143:360` at y 0 is 20 tall; `143:362` starts at 22 |
| Fallback title | `bodyBold` (Bold 12/16) | `title` (**Bold 14/20**) | `143:361`; this IS the 16 → 20 growth |

Confirmed already exact: `#ECFF9B` fill, 24pt radius, 15.889 padding, body Regular 11/16.5 at
`rgba(0,0,0,0.8)`, CTA `#CFFF04` at 32pt / radius 15 with a Bold 16/24 label (`size="barSm"`).

### 2. Completion — `143:207` — UNCHANGED

Its subtree is **byte-identical** to the baseline the shipped code was written against (150 lines,
zero diff). No correction was applied and none is warranted; the previous pass's verification
carries over intact. The screen was NOT rebuilt.

### 3. Booking history — `6:227`

The only change in the frame: the `65:35` header instance is overridden 370.44 × 56 → **370 × 45**.

The `65:35` COMPONENT still defines px 16 / py 12 / gap 14 (= 56); the 45 is an instance override,
which compresses vertical padding to (45 − 32) / 2 = **6.5**. Horizontal padding and gap are
untouched. Added as `ScreenHeader density="band"`.

This header now has three measured heights across the file, and they are not interchangeable:

| Density | Height | Padding | Nodes |
| --- | --- | --- | --- |
| `default` | 56 | px 16 / py 12, gap 14 | `71:620` Refunds, the address frames |
| `band` | 45 | px 16 / py 6.5, gap 14 | `65:35` as instanced on `6:227` |
| `compact` | 45 | px 4 / py 6, gap 12 | `257:3504` Profile |

`band` and `compact` are both 45 but place the back control 12pt apart horizontally.

### 4. Refund history — `71:615` — UNCHANGED

Byte-identical (98 lines, zero diff). **The "56.89 → 56" delta carried into this pass does not
exist** against the correct baseline — it came from the discarded `QMgajes…` comparison. `71:620`
is 56 in both the previous file and the current one, so Refunds keeps `density="default"`.

### 5. Cancellation flow — `115:2821`

`104:2281` grew 167 → **201**, and the children are unchanged — same seven reasons. The growth is
entirely the row gap: 7 × 20 + 6 × gap + 12 padding = 201 gives **gap 8**, up from 2.5.

**The implementation already used gap 8 / py 6**, so the layout needed no change — the file caught
up to it. The full read did find one real mismatch:

| Value | Was | Now | Evidence |
| --- | --- | --- | --- |
| Reason label | `body` (Regular 12/16) | `optionLabel` (**Medium 13/16**) | `104:2284` |

13 appears nowhere else in the file, so it stays a literal inside the new token rather than joining
`fontSize`.

### 6. Auto-cancelled — `201:278`

`201:477` grew 126 → **138**, and the growth is entirely the gap: the `201:89` panel ends at 81.78
and `201:92` is pinned at 98.78, so the answers sit **17** clear of the prompt, not 10. Vertical
padding stays 6. The "No" button also moved from `variant="secondary"` plus a `borderColor`
override onto the shared `outlineSoft` variant — `201:93` and Confirmation's `250:2979` draw the
same white-behind-`#FFDE33` treatment.

### ETA inner shadow — verified, not assumed

`97:1231` carries an INNER `0 0 4 rgba(0,0,0,0.15)`, which `shadow*` cannot express (it only casts
outward). Checked against the installed runtime rather than assumed:

- React Native **0.86.2**
- `inset` is a first-class typed field on `BoxShadowValue` in `StyleSheetTypes.d.ts`
- `android/gradle.properties: newArchEnabled=true`, and inset `boxShadow` is implemented on both
  platforms under the New Architecture

So the effect is kept, and moved from the CSS-string form to the **typed array** form
(`innerShadows.etaPanel`) so it is type-checked rather than string-parsed. Border, radius and fill
remain real style properties, so the panel is still correct if a runtime drops the inner shadow.

### Shared-component regression surface

| Component | Changed | Consumers re-checked |
| --- | --- | --- |
| `ScreenHeader` | added `band` density | Booking history (changed), Refunds, 3 address screens, Profile — all still on their own measured density |
| `Button` | `outlineSoft` adopted by auto-cancel | Confirmation Cancel, auto-cancel No |
| `NoticeCard` | ramp (earlier in this pass) | Extension ×2, Reassigned, Auto-cancelled, cancellation policy ×2 |
| `typography` | added `optionLabel` | Cancellation reasons only |
| `primitives` | added `innerShadows` | `StatusBanner` highlight only |

Full suite re-run after each: **305/305**.

## P5.5 Outstanding

Closed during this pass: per-node `get_design_context` on every NEW/CHANGED non-Schedule frame;
the flow-board re-read; the `14 → 17` / `16 → 20` type ramp; `danger` / `dangerSurface`
provenance; the three raw gradient/wash values; the three OTP states; `250:2861` Booking details;
and the `250:2970` icon export.

Still open:

1. **`SCHEDULE_DESIGN_AUTHORITY: PRODUCT_DESIGN_PENDING`** — Schedule frozen by ruling. See the
   contradiction table above. Nothing else is blocked by it.
2. **Physical-device verification** — `adb devices` has reported none attached on every check this
   pass. Every geometry claim in §P5.6 / §P5.7 is code-level against node values, verified on the
   emulator, not on a handset. `PHYSICAL_DEVICE_VERIFICATION_PENDING`.
3. **`IOS_SIMULATOR_VERIFIED: NO`** — this is a Windows machine. The iOS *code* audit passes (see
   below); the simulator pass needs a macOS/Xcode runner.
4. **`COMMENTS_ACCESSIBLE: NO`** — unchanged. The MCP surface still exposes no comments API, and
   the `MANUAL_COMMENT_REVIEW_REQUIRED` flags stand.
5. **Founder ruling wanted** on the three brand-adjacent yellows outside the approved ten
   (`#FEE685`, `#FFD230`, `#EAF086`). All three cite real nodes; none is invented.

## P5.9 Emulator runtime verification

First real runtime pass of this project. `BUILD SUCCESSFUL in 7m 6s`; Metro bundled 2237 modules
in 43.8 s with no errors; the app reported
`Running "main" with {"rootTag":1,"initialProps":{},"fabric":true}` — `fabric: true` confirms the
New Architecture is live, which is what makes the inset `boxShadow` render.

Gradle needed `JAVA_HOME` pointed at Android Studio's bundled JBR (OpenJDK 21); the machine's
default `java` is JVM 8, which Gradle rejects. Scoped to the build command, not persisted.

### Responsive sweep — `spoon://booking/enRoute`

| Viewport | px / dpi | dp | App JS errors |
| --- | --- | --- | --- |
| small | 720×1280 @ 320 | 360 × 640 | 0 |
| reference | 1080×2340 @ 440 | 392.7 × 851 | 0 |
| large | 1080×2400 @ 420 | 411.4 × 914 | 0 |
| xlarge | 1080×2340 @ 400 | 432 × 936 | 0 |
| short | 720×1136 @ 320 | 360 × 568 | 0 |

Crash buffer empty throughout. A first count reported "5 errors" at two viewports; triage showed
every match was `SystemServiceRegistry: ServiceNotFoundException: No service published for:
ethernet` — an emulator platform message from pid 1040, not the app. App-scoped log: zero.

### What the device pass caught that static reading did not

1. **`94:1097` ETA label truncated to "16 mi…"** at 393dp and above. The panel is 122 wide and the
   label 112, so the inset is **5** a side; the code had `space.sm` (8), leaving only 106. Fixed.
2. **`40:5364` copy was stale** — "Cook Rekha is arriving" rather than "…arriving **in**". The
   current file ends the line on "in" because the ETA panel completes the sentence. Fixed, along
   with `101:1887` / `101:1889` ("Time left to service end" / "Cooking in progress", the message
   dropping from two lines to one — which is why that h1 block closed 35 → 19) and `99:1620`
   (Arrived's panel shows a clock time, "11:55 am", not a countdown).

A false positive was also ruled out rather than "fixed": at 393dp the cook attributes appeared to
truncate to "Fema…" / "West Beng…". Changing `wm density` under a live app leaves React Native
measuring against the old density. Force-stopping and relaunching at 440 dpi rendered both labels
in full, so the fixed 94pt column is correct and nothing was changed on the strength of a stale
frame.

### Verified on the emulator, per screen

| Screen | Route | Result |
| --- | --- | --- |
| En route `3:1381` | `spoon://booking/enRoute` | banner glyph gone, ETA panel with `#CFFF04` edge and visible inner shading, cook attributes in two bullet-less columns, centred name, full-width Call Cook |
| Auto-cancelled `201:278` | `spoon://booking/autoCancelled` | both notice cards at the corrected Medium 11/16.5 over Regular 10/15 ramp |
| Booking history `6:227` | `spoon://history` | rendered, no errors |

`PHYSICAL_DEVICE_VERIFICATION_PENDING` for every row above — `adb devices` reported no handset on
every check this pass. Emulator only.

## P5.10 Login / OTP short-height responsiveness

The Small_Phone emulator exposed a REAL defect that node-level reading could never have caught,
because it is not a discrepancy against any frame — the frame is 800pt tall and the handset is not.

**Symptom** (`login_before.png`, 360 × 640dp): the hero consumed ~60 % of the viewport, the phone
field was cut in half at the bottom edge, and the CTA and legal footer were entirely below the
fold.

**Cause** — arithmetic, not guesswork. `250:2384` is 800 tall and spends 364 on the hero, leaving
396 for the 167pt brand block and the 237pt form. Every one of those three was a FIXED height, so
the stack is always 768. A 360 × 640 handset has ~568 usable after the status and navigation bars,
which overruns by ~200 — and the overrun lands on the form, because the hero is first.

**Fix** — the hero is the only thing that adapts:

```
heroHeight = clamp(availableHeight − 167 − 237, 160, 364)
```

- Any viewport that can afford 768 resolves to exactly **364**, so the reference frame is
  untouched — this is why `LOGIN_PIXEL_PERFECT_REFERENCE` survives the change.
- A short viewport crops the hero instead of the form. `resizeMode="cover"` means cropping the box
  preserves the photograph's aspect ratio and framing rather than squashing it.
- **Nothing else scales.** Typography, the field, the CTA, the legal footer and every gap keep
  their Figma values at every width and height. No `screenWidth / 390` factor is involved.
- The `ScrollView` remains, and carries whatever still does not fit at the 160 floor.

**OTP** got the same treatment on its 172pt brand block, for the same structural reason. Its margin
is much wider (172 + 222 = 394 against Login's 768), so **at rest on a 360 × 640 handset it
resolves to the full 172 and the screen is visually unchanged**. The clamp only engages once the
keyboard has taken ~270pt — exactly when the CTA would otherwise be pushed out of reach. OTP also
gained the `onLayout` + `scrollToEnd` reveal that Login already had; it previously had no
keyboard-scroll handling at all, which was a latent version of the same defect.

Keyboard handling is unchanged in kind: `behavior="padding"` on BOTH platforms, because Android's
`adjustResize` is inert under the edge-to-edge display this app runs in. That stays iOS-correct —
`padding` is the recommended iOS behaviour — so the shared implementation still serves both.

### Verification

| Viewport | Result |
| --- | --- |
| 360 × 640dp (Small_Phone, short) | **PASS** — hero crops to the 160 floor and the whole form fits without scrolling: logo, tagline, "Login", subtitle, phone field, Continue and the legal footer are all on screen. Before the fix the field was cut in half at the bottom edge. |
| 393 × 851dp (reference) | **PASS, unregressed** — hero resolves to the full 364 and the composition matches `250:2383` exactly. |

**Keyboard: verified open on 360 × 640.** `dumpsys input_method` reported `mInputShown=true` with
the field focused, and in that same frame the phone field, the Continue CTA and the legal footer
were all still on screen — which is the requirement. It took several attempts: the IME only raises
once the bundle has actually painted, so earlier taps landed on an unloaded surface and reported
`mInputShown=false`. Those runs proved nothing about the keyboard and are not counted. Gboard was
in floating mode for the successful run, so the captured frame shows a floating panel rather than a
docked keyboard; the viewport shrink and the resulting scroll position are visible regardless.

Not reached, and therefore not claimed: the 430dp width and a short-height 393dp viewport were
scripted but not captured before this pass ended. `LOGIN_SHORT_HEIGHT_RESPONSIVE` rests on the
360 × 640 evidence above — the viewport the defect was actually reported on.

### Status flags

```
LOGIN_PIXEL_PERFECT_REFERENCE: YES
LOGIN_SHORT_HEIGHT_RESPONSIVE: YES
LOGIN_KEYBOARD_SAFE_ANDROID:   YES   (emulator-observed; mInputShown=true, CTA still reachable)
OTP_SHORT_HEIGHT_RESPONSIVE:   YES   (same clamp; unchanged at rest, engages under the keyboard)
```

## P5.8 iOS compatibility audit (code-level)

`IOS_SIMULATOR_VERIFIED: NO` — Windows. What CAN be checked was:

| Check | Result |
| --- | --- |
| `.android.*` / `.ios.*` split files | **none** — one shared implementation |
| Android-only package imports in shared code | **none** |
| `Platform.OS` uses | 2, both justified: `runtime.ts` (logging) and `MealBriefScreen` (keyboard behaviour) |
| Every `elevation` paired with an iOS `shadow*` | **yes**, all of them — the `elevation()` helper emits both |
| Inner shadow | `boxShadow` `inset`, typed and New-Architecture-backed on both platforms |
| `KeyboardAvoidingView` behaviour set explicitly | 4/4 call sites |
| SafeArea | 34 call sites |
| Hardcoded Android paths / `StatusBar.currentHeight` | **none** |
| Livvic mapping | registered by explicit key through `expo-font`, identical on both platforms |

---

# PASS 4 — SUPERSEDED FIGMA FILE `1kd1u3WEc00SENkToIPloW`

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
