# Pass 9 — working notes

**Figma:** `LJa7JoMVhagLrDG4WNxSMy` — "V0- user app (Copy) (Copy)", page `0:1` ("User App").
Scope: the NEW/CHANGED areas only — Login loading, Home, Cook profiles, Service flow. The seven
sections banked by pass 8 (Login ×4, Address, Profile, Instant, Scheduled, Cancellation,
Rescheduled) are regression-checked, not re-audited.

**Device:** physical `I2403` (`10BE9X1HPH001UZ`), 1080 × 2392 @ 440dpi = **392.7 × 869.8 dp**,
Android 16. `wm size` / `wm density` are NEVER touched on this handset.

## Section inventory (page `0:1`)

| Section | Node | Frames |
| --- | --- | --- |
| Login flow | `275:4472` | `73:1036` loading · `250:2383` login · `275:4289` OTP · `250:2439` resend · `275:4349` wrong |
| Home page | `338:4507` | `1:455` 3a · `333:3834` 3b + 5 card frames (`337:4261/4284/4307/4330/4495`) |
| Cook profiles | `289:8515` | 8 cards: Jyoti/Rekha/Sanchita/Barsha × standard/pure-veg |
| Service flow | `308:3134` | 18 frames — see §Service flow |
| (banked) Address `275:4473`, Profile `275:6021`, Instant `267:3520`, Scheduled `267:3521`, Rescheduled `275:5217`, Cancellation `115:2821` | | |

## 1. LOGIN — done (code)

`73:1036` is the only change. Verified by geometry that `250:2383`, `275:4289`, `250:2439`,
`275:4349` are byte-identical to what pass 8 banked (`250:2434` h329, `250:2384` h438,
`250:2400` h167, `250:2406` h228, `250:2415` h43, `275:4308` w268, `275:4312` h160, and
`227:1687` still absent) → **UNCHANGED_CORRECT**.

`73:1036` **CHANGED**:
- `73:1040` flat `canaryWash` → `linear-gradient(154.26259710299553deg, rgba(255,214,0,0.7) 0%,
  rgba(207,255,4,0.7) 98.789%)` over white ⇒ drawn (255,226,77) → (221,255,79), measured on the
  node render.
- `74:27` (179 × 179 mark) **deleted**; `313:3159` is a **370 × 370** full-width brand logo,
  vertically centred (196.5 = (764 − 370)/2).
- `get_motion_context` → no animated nodes ⇒ v4's invented 1 → 6.4 zoom removed.

Code: `gradients.splash` + `gradientAxis()` (new, exported from `@ui`), `surfaceSplash` → white,
`SplashLoading` rewritten, `assets/figma/loading/splash-logo.png` replaced with the 1110² cut-out.

## 2. HOME — done (code)

Systematic: the viewport is **370** (not 372) and the column **338** (not 340); every section is
inset 4 and padded 6 vertically; the body rhythm is **16** throughout.

| Element | Was | Now (node) |
| --- | --- | --- |
| body | gap 8, pt 22 | gap **16**, pt 16, pb 16 (`333:3835`) |
| banner | pt 16 / pb 8, bolt 20 × 23 gap 4, 41pt avatar box + ring image, 8.35pt caret | pt **22** / pb **12**; `1:459` 33pt row px 4, bolt **24 × 33** gap **6**; `59:400` a 32pt **`#FFE666` disc**, no ring; `319:3341` px 4/py 6 with a 140 × 32 stack, **12pt**, then the **32pt chevron disc** `319:3343` |
| promo | h257, centre 217 × 238 | h**280** (py 6), centre 217 × **268**; full-bleed 369, side panels clipped 15 each |
| tiles | 4.5pt row padding | none — `59:654` is a section (px 4 / py 6); grid gap 18, tiles 156 × 142 |
| active booking | `59:587` header + date + lime timer chip | **rewritten** — see below |
| cuisines | gutters 16/15, 2 scrims, captions positioned by centre | gutters **14 / 5 / 11**, cards 158-wide, **4** scrims, captions px 10 / pb 6 |
| reasons | 125pt `#FFEF99` tiles, label BELOW art at y 109 | **67pt** tiles, **no fill**, label Bold 12/16 **above** the art; gutters 10 / **16**; 5 of 6 artworks + all labels + the order changed |
| matrix | — | UNCHANGED_CORRECT |
| exclusions | one 15pt gutter | **8** across / 15 down |
| promise | title Black 16/24, logo only | title **Bold 12/16** (`compact`), plus `319:3340` Regular 9/13.5 line 10pt right of the mark |
| card order | promo → card → tiles | promo → **tiles → card** → mosaic (`333:3835`) |

`ActiveBookingCard` (new, replaces `UpcomingBookingCard`): r24 / `#FFD600` hairline /
`0 0 4 rgba(0,0,0,0.08)`, px 12 py 8 gap 5; 37pt header (title Black 14/20 **`#FFD600`** + the
forward disc); 67 × 70 photo on `#FFF7CC` r16; 117 × 70 three-line stack; 91 × 82 `#FFEF99` badge.
Four presentations, selected by payload: **confirmed** (no caption), **arriving/arrived**
(caption + 58pt pill), **time left**, **rate** (r20 / `#FFDE33` + the 9-chip scale).
`337:4284` and `337:4307` are node-for-node IDENTICAL — recorded as a Figma duplicate.

FIGMA INCONSISTENCY recorded: Page 3a places its body 55pt lower than 3b for no structural reason
(gap 71 vs 16 where every other gap on the page is 16). 3b's rhythm is taken.

Assets: 6 `reason-*.png` added (node crops baked in), 6 `trust-*.png` deleted, 4 `excl-*.png`
re-cropped from the current nodes, `cook/rekha-cutout.png` added (transparent portrait).
`icons/chevron-down.png` + `icons/timer.png` are now unreferenced.

## 3. COOK PROFILES — done (code)

8 frames = ONE card × 4 cooks × 2 dish lists. Confirmed C-6 still holds.

Corrections against `289:7518` / `299:1794`:
- identity row: **105pt**, items **centred**, 2pt tail (was flex-start, no height)
- photo crop: the portrait is 89 × 133.5 at (−0.89, −12), not a centred `cover`
- name: Black 16/24 at tracking **0** (`headingCta`), not −0.4
- attributes: a wrapping grid of fixed **97pt** cells, 5 across / 3 down (was 94 + 107 pairs)
- "What X cooks best?": the 16pt frying pan **no longer exists** — removed, asset deleted
- specialty disc: **white with a 1pt `#FFE666` ring**, not a flat `#FFEF99` fill
- specialty grid gutters: **8 / 8** (were 8.111 / 7.333); cell 50 (was 51); no trailing row gap
- trust row: the third badge is **Hygienic** (Clean Hands), not On-time (clock); each glyph sits on
  an **18pt `rgba(0,0,0,0.8)` disc** that was missing entirely; labels SemiBold 10/13.33 at 80 %
  black; glyph sizes 16 / 15 / 13

Assets: `badge-hygienic.png` added, `badge-ontime.png` + `specialties-header.png` deleted,
`dishes/carrot.png` and `dishes/okra.png` added (`87:324` draws its okra as inline vector paths —
the one dish mark that is not an image fill).

`CookBadgesViewModel.onTime` → `hygienic`. Fixtures now carry all four cooks × both lists,
transcribed node by node; two glyph errors fixed on Rekha's pure-veg list (Aloo beans → Peas,
Raita variants → Onion).

## 4. SERVICE FLOW — done (code + device)

18 frames under `308:3134`:

| Node | Name | Size |
| --- | --- | --- |
| `3:1041` | Page 8a- Confirm | 390 × 1006 |
| `289:6607` | Page 8b- Confirm reassign | 390 × 1023 |
| `201:278` | Page 8c- Auto cancelled | 390 × 882 |
| `250:2861` | Page 8d- Booking details | 390 × 892 |
| `3:1381` | Page 9a- Arriving ontime | 390 × 1011 |
| `292:469` | Page 9b- Arriving late | 390 × 1011 |
| `201:100` | Page 10a- Reassigned on time | 390 × 1108 |
| `292:657` | Page 10b- Reassigned late | 390 × 1108 |
| `3:1658` | Page 11- Arrived | 390 × 1094 |
| `101:1812` | Page 12a- In service | 390 × 1176 |
| `292:1197` | Page 12b- Cooking extended | 390 × 1307 |
| `3:2002` | Page 13a- Extension | 390 × 892 |
| `275:4189` | Page 13b- Extension taxes | 390 × 892 |
| `299:1424` | Page 14a- Completion | 390 × 832 |
| `319:3191` | Page 14b- Feedback submission | 390 × 746 |
| `319:3284` | Rating (component) | 330 × 174 |
| `306:2885` | Page 15- Tip pop out | 390 × 890 |
| `119:2885` | Post rating UI guide | 358 × 567 (reference chart) |

`319:3284` read: no "5+" legend, 9 chips at a 6pt gutter in a 52pt row, chip lift
`0 0 2 rgba(0,0,0,0.15)` (Home's is `0 2 2 rgba(0,0,0,0.06)`) — carried as `RatingWidget`'s
`lift` prop. Value 5 drawn selected.

### What changed

Systematic: every block on every service frame is a **338pt section inset 4 / 6**, and the boxes
sit **16** apart — not the flat 22 with no inset the implementation used. `ServiceSection` +
`SERVICE_SECTION_GAP` carry it, and `ServiceLinkRow` extracts `250:2966` (the outlined row) so the
six frames that draw one share it.

| Frame | Verdict | Change |
| --- | --- | --- |
| `3:1041` Confirm | CHANGED | section rhythm; header replaced (below); action gap 12 → **16** |
| `289:6607` Confirm reassign | **NEW** | Confirmation + the `292:201` notice — `summary.reassignNotice` |
| `201:278` Auto cancelled | UNCHANGED_CORRECT | header only |
| `250:2861` Booking details | UNCHANGED_CORRECT | re-read, no delta |
| `3:1381` / `292:469` En route | CHANGED | + the `292:233` details row and the **`292:241` Cancel/Reschedule pair**, neither of which the superseded frames drew |
| `201:100` / `292:657` Reassigned | CHANGED | same two blocks |
| `3:1658` Arrived | CHANGED | + `292:1012` details row; still NO action pair |
| `101:1812` In service | CHANGED | the "Note before starting" card is **not drawn** — removed; + `292:1188` details row |
| `292:1197` Cooking extended | **NEW** | + `292:1399`, a compact `#FFEF99` status banner with a 40pt `#FFD600` disc — `StatusBanner layout="heroCompact"` |
| `3:2002` / `275:4189` Extension | UNCHANGED_CORRECT | re-read; the taxes dialog is the same `InfoDialog` pattern |
| `299:1424` Completion | CHANGED | prompt caption SemiBold 12/16 black; card r20 / p16; cook name Black 16/24 centred, line Bold 14/20; feedback label centred black; textarea edge **`#CFFF04`**; **the inline tip card `143:294` is gone** |
| `319:3191` Feedback submission | **NEW** | the same screen with `completion.submitted` — legend keeps, scale and Submit drop, textarea holds the acknowledgement |
| `306:2885` Tip pop out | **NEW** | `TipSheet` — "Share an amount", four 76 × 33 chips, the trust notice, the thank-you band, "Tip • ₹50" |
| `119:2885` Post rating UI guide | REFERENCE | the 9 × 9 state chart, not a screen |

Header: `289:9205` is NOT the `63:783` screen header. It is the Home address lockup with a back
disc in front and the Help pill behind — px 4 / py 6, 24pt between the groups, a 32pt
`DirectionalDisc` 12pt clear of a fixed **188 × 28** `AddressLines` (new, shared with Home).

## Device pass — physical `I2403`

Cold-launched per state with `-S --activity-clear-task --activity-clear-top`, focus asserted
against `com.spoonhelp.userapp.dev`, marker asserted from `uiautomator dump`.

Verified: splash · home · confirmation · confirm reassign · en route (+ scrolled tail) · arrived ·
in service · cooking extended · completion · feedback submitted · auto cancelled · the four Home
active-booking presentations · the cook profile cards · keyboard on the Completion feedback field.

### Defects found ON DEVICE and fixed

1. **Splash logo drew at ~3× the screen**, cropped to the fork and two tomatoes. An `Image`
   carries an intrinsic size; neither `width: '100%'` nor `alignSelf: 'stretch'` + `aspectRatio`
   constrained it inside the centred column, so the 1110px asset won. Now sized from the measured
   box (`box.width` on both axes).
2. **"Call Cook" read "Call"** on a narrow card — the label wrapped and "Cook" fell below the
   pill's 21pt box. `numberOfLines={1}`, which is what `299:1819` draws (a fixed 51 × 14 line).
3. **The Completion feedback field sat entirely behind the IME.** On Android 15+ the window is
   edge-to-edge and `adjustResize` no longer shrinks it, so the `ScrollView` never learned the
   keyboard had covered its lower half — there was no way to scroll to the focused field. `Screen`
   now shrinks the scroll VIEWPORT by the reported keyboard height, which also restores RN's
   built-in scroll-focused-input-into-view. Shared primitive; the six banked sections were
   re-smoked after it.

### Environment blocker

The responsive sweep could NOT be run on a second device: the only AVD (`Small_Phone`) refuses to
boot — *"Your device does not have enough disk space to run avd"* — and `wm size` / `wm density`
must never be changed on the handset. The sweep is therefore an automated render matrix
(`src/__tests__/responsive.test.tsx`) across 320 / 360 / 393 / 411 / 430dp, driving
`useWindowDimensions`, which is the only viewport input any of these screens reads. 35/35 pass.
That proves layout, not appearance; appearance is verified at 392.7dp on hardware only.

---

# Pass 10 — recovery continuation (session 2)

The pass-9 session was interrupted. Its working tree survived intact and was recovered, not
restarted. Recovery findings first, then the defects it had left behind.

## Recovery verdict

The Figma section and frame inventory was re-enumerated from `0:1` and is **byte-identical** to
what pass 9 recorded — 10 sections; Login 5 frames, Cook profiles 8, Service flow 18, Home 7.
Nothing in the design moved under the interrupted session, so its work stands.

Gates on the recovered tree, before any edit: **tsc clean · eslint --max-warnings=0 clean ·
prettier clean · jest 344/344**. The tree was sound, not half-applied.

Recovered as correct and BANKED (re-verified, not rewritten): splash `73:1036` (device + node
compared), Home, the cook-card geometry, `ServiceSection` rhythm, `ActiveBookingCard`, the
en-route / reassigned / arrived / in-service / cooking-extended / completion / feedback bodies,
`TipSheet`'s structure, `BookingDetailsSheet`, `ServiceLinkRow`, `AddressLines`,
`DirectionalDisc`, `Screen`'s keyboard-viewport fix.

## Defects the interrupted pass left behind — found and fixed here

1. **Cook profiles — three of four cooks drew the initials panel, not the portrait.**
   All EIGHT frames in `289:8515` (and the in-flow cards, e.g. `300:2632`) place the SAME image
   fill at the same 89 × 133.5 crop. Only `DEMO_COOK_REKHA` carried `photoUrl`, so Jyoti,
   Sanchita and Barsha rendered "CJ" / "CS" / "CB". Confirmed on device against the `289:7392`
   node render. `REKHA_SAMPLE_PHOTO` / `REKHA_CUTOUT_PHOTO` renamed to `COOK_SAMPLE_PHOTO` /
   `COOK_CUTOUT_PHOTO` — the asset is the card's, not Rekha's — and given to all four cooks.
   `DEMO_COOK_MINIMAL` remains the only path to the initials fallback, which is what it is for.

2. **Tip sheet `306:2885` — the art was drawn on a white block.**
   `assets/figma/booking/tip-thanks.png` had been exported with an OPAQUE WHITE background
   (corner alpha 255) and was stretched over the whole plate, so `308:3132` never showed. The
   node is a `#FFF7CC` 330 × 175 plate with a TRANSPARENT 303-wide band centred on it. Re-exported
   from the node's own image at its window (source rows 107–775 of 1156 × 1187 → 1156 × 668,
   alpha 0), plate recoloured `surfaceAccent`, band set to 303/330 and centred.

3. **Tip sheet — CTA was the wrong colour and dead on open.**
   `306:3042` is `#CFFF04` at r15 with a `0 0 2 rgba(0,0,0,0.15)` lift, not the `#FFD600` primary
   bar, and `306:3050` draws ₹50 SELECTED — which is what makes the pre-formatted "Tip • ₹50"
   label coherent. Was `variant="primary"`, no default, so it opened grey and disabled.
   Now `variant="bright"` + the node's lift, and `TipSheetViewModel.defaultOptionId` carries the
   server's default. Also missing: the Help pill (`306:2990`) and the outlined 32pt back disc
   (`306:2986`) — the sheet drew a bare arrow.

4. **Extension `3:2002` / `275:4189` were marked UNCHANGED_CORRECT but are NOT.** The largest
   miss of the pass. Against the current nodes:
   - note 1 copy is `143:348` / `143:349` "Cooks always intend to deliver all your asks on time" /
     "Sometimes the booked duration can be less to finish all asks" — the implementation carried
     entirely different prose.
   - `275:4265` the CTA is **"Extend • ₹16"**, pre-formatted; it read a bare "Extend".
   - `143:381` draws "10 mins" SELECTED, so the bar opens live — it opened grey and disabled.
   - `275:4267` **"Check payment details"** was absent, and with it the whole of **13b**:
     `275:4272` is a dialog layered over this sheet whose copy is its OWN — "What is Taxes and
     Fee?" and a flat **5% GST**, NOT the Instant sheet's "What is Taxes?" / 2.5% CGST + 2.5% SGST.
     Frame 13b had no implementation and no route to it at all.
   - `143:319` is a 32pt back disc; the sheet drew a bare arrow.
   `ExtensionViewModel` gained `defaultOptionId`, `paymentDetailsLabel` and `taxesInfo`;
   `ExtensionSheet` gained the link, the dialog and `backVariant="outlined"`; the screen now
   passes Help and the default through. `BookingDetailScreen.test.tsx`'s "opens disabled"
   assertion encoded the old wrong behaviour and was corrected, plus a new 13b test.

5. **`CookCard` comment understated the language quirk** — it named Rekha and Barsha; the orphan
   `Language` glyph with no label is on SIX of the eight cards (Rekha, Sanchita, Barsha × both
   variants). Only Jyoti labels it, "Hindi, Odiya". Behaviour was already right; the note was not.

## Device protocol note

`adb shell cat /sdcard/...` is mangled by Git Bash path conversion and silently returns nothing,
which makes every marker assertion pass vacuously. `MSYS_NO_PATHCONV=1` is required. Two captures
were rejected under the protocol and retaken: one black frame (display asleep) and one where focus
had drifted to WhatsApp after a stray tap.

## Verified on physical `I2403` this pass

Cold-launched per state, focus asserted against `com.spoonhelp.userapp.dev`, marker asserted from
`uiautomator dump`, every capture distinct by md5.

Splash `73:1036` (vs node render) · Home `333:3834` · Cook profiles (Jyoti + Rekha, vs `289:7392`)
· Confirmation `3:1041` · **Booking details `250:2861`** (row-for-row against the node: Date /
Start time 5:30 PM / Duration / End Time 8:00 PM / ₹189 / Taxes @5% ₹9 / Total ₹198) ·
Confirm reassign `289:6607` · En route late `292:469` · Reassigned `201:100` + late `292:657` ·
Arrived `3:1658` · In service `101:1812` · Cooking extended `292:1197` · **Extension `3:2002`** ·
**Extension taxes `275:4189`** · Completion `299:1424` · Feedback submitted `319:3191` ·
**Tip pop out `306:2885`** · Auto cancelled `201:278` · Login `250:2383` + OTP · Cancellation ·
Profile · Saved addresses.

Keyboard QA re-run on hardware: **Login phone field** — IME opens (`mInputShown=true`), the field
stays visible, the CTA moves 1904 → 1225 and stays fully on screen and tappable, BACK dismisses
and the layout restores to 1904 exactly. **Completion feedback** — the pass-9 `Screen` viewport
fix still holds: the field moves 1673 → 1239 and sits clear of the IME.

Gates after the fixes: **tsc clean · eslint --max-warnings=0 clean · prettier clean ·
jest 345/345** (was 344; +1 for the new `275:4189` case) · `expo config` OK · **`expo export
--platform android` OK** (4.8 MB bundle; all five Livvic weights and the re-exported
`tip-thanks.png` present) · logcat clean — no FATAL, no ANR, no redbox, no JS error.

## Still open

- **PRODUCT_DESIGN_CONFLICT (unchanged, recorded not resolved):** six of the eight cook cards draw
  the `Language` glyph with no label. Rendering a bare icon would state nothing, and the value is
  backend data, so the attribute is omitted when the payload carries no languages.
- **FIGMA INCONSISTENCY:** `333:3834` titles its active-booking card "Upcoming booking" while
  carrying "Arriving in / 12 mins"; the card component frames disagree — `337:4261` pairs
  "Upcoming booking" with "Confirmed!", and `337:4284` pairs "Live booking" with "Arriving in".
  The component frames are the more specific source and are what the implementation follows.
- **FIGMA INCONSISTENCY:** `250:2951` on `3:1041` says "12:00 PM" while its own booking-details
  sheet `3:1106` says "5:30 PM". Reproduced as drawn.
- **FIGMA CONTENT DEFECT:** `299:2237` / `299:2245` / `299:2253` on `3:1041` label all three trust
  badges "Background verified". The implementation draws the three distinct badges.
- **Cosmetic fixture difference (not a UI defect):** the service frames name different cooks per
  frame (`3:1041` Barsha, `201:100` Sanchita); the booking fixtures use Rekha throughout. The
  rendering path is identical and is proven by the cook-profile cards, and cook identity is
  backend data.
- iOS: code-compatible (the shadow tokens emit both `shadow*` and `elevation`; no `Platform.OS`
  branch was added). Host is Windows — NOT simulator-verified.

# Pass 11 — location-churn recovery (session 3)

The pass-10 session was interrupted by a broken VS Code terminal (mouse-reporting/control-sequence
state), not by an application failure. Its working tree survived and was recovered, not restarted.

## Recovery verdict

The location fix was **already written and already correct**. It was NOT rewritten. Gates on the
recovered tree, before any edit: **tsc clean · jest 73/73 across the six location suites**. What
the interrupted session had NOT finished was the cleanup after its own on-device diagnosis, which
is what failed the remaining gates.

Recovered as correct and BANKED (re-verified, not rewritten):

- `deviceLocation.ts` — the three-source chain (recent cached fix → fresh `Accuracy.Low` with an
  8s timeout → older cached fix → `unavailable`) is intact and unmodified. This is the fix for the
  infinite "Finding your location…" and it was not disturbed.
- `useAddressLocation.ts` — single-flight (`resolveInFlight`), the user-point generation guard
  (`userPointGeneration`), and the AppState background→foreground EDGE check. All three are the
  actual churn fix and all three were already in place.
- `useAddressLocation.test.tsx` — 11 of the 13 required cases were already written and passing.

## Root cause of the repeated resolutions — a real production loop, not harness churn

The suspicion was that the ~25 resolutions seen under deep-link testing were test-harness
remounts. They were not. There is no deep-link harness in the repo (`jest.e2e.config.js` is a
Node-hosted live-backend transport suite with no React and no location in it); the deep links had
been fired by hand. The interrupted session had already found the real defect, recorded in the
hook's own comment and measured at **128 resolutions from a SINGLE mount, still climbing**:

    AppState emits 'active'  ->  locate()  ->  `attempt` changes  ->  the effect re-runs
      ->  its cleanup cancels the fix already in flight  ->  that fix returns, sees it was
          cancelled, and skips `select`  ->  `latestPoint` is never set  ->  the listener's
          "nothing to lose" guard never engages  ->  the next 'active' repeats it.

Android re-emits `'active'` about eight times a second while the app is ALREADY foreground, so the
retry was cancelling the very work whose result would have stopped the retries. Single-flight plus
an edge-triggered listener closes it at the cause.

## What this pass actually had to finish

1. **Temporary `[MAPDBG]` diagnostic logging was still in production source** — 12 `console.log`
   statements across `useAddressLocation.ts`, `AddressScreens.tsx` and `app/(app)/address/
   location.tsx`, four of them printing exact customer coordinates. This was the only thing
   failing `eslint --max-warnings=0` (12 × `no-console`). Removed. One bounded line replaces them
   — `[location] resolving device fix { attempt }` — which is the per-resolution counter the
   device protocol below actually needs, and which logs no coordinate. `deviceLocation.ts`'s
   existing `[location] device fix { source }` was already correct and was kept.
2. **Three files had been rewritten as CRLF** by whatever editor the interrupted session used.
   `.gitattributes` pins the tree to `eol=lf` and `.prettierrc` sets `endOfLine: lf`, so
   `prettier --check .` failed on all three whole files. Converted back to LF. This was
   pre-existing damage, not a formatting opinion.
3. **Two of the fourteen required test cases were missing** — Confirm must not re-acquire, and
   the outside-area → "Choose another location" return must not re-acquire or loop. Both added;
   the suite is now 13 cases and covers all fourteen required behaviours.

## Navigation lifecycle — the chosen behaviour, as verified

- FIRST ENTER `53:31` → acquire once.
- Confirm serviceable → `router.push` `60:655`. The map is NOT unmounted, so Back returns to the
  same pin with no re-acquisition.
- Confirm `outside_service_area` → `router.push` `215:1472`. Same reason: "Choose another
  location" pops back onto the live map, keeping the pin, the search text and the refusal message.
- `useSafeBack` pops when there is a history and only `replace`s when there is genuinely nothing
  behind (a deep link into a child route), which is the one case where re-acquiring is correct.
- LEAVE the flow entirely and reopen → a new mount, so it acquires once again. Verified.

## Verified on physical `10BE9X1HPH001UZ` this pass

Driven through NORMAL navigation, not deep links. Debug build serving the current source from
Metro; `[MAPDBG]` absent from logcat confirms the new bundle was the one under test.
Resolutions counted from `[location] resolving device fix`:

| action | resolutions |
| --- | --- |
| Home → Saved addresses | 0 |
| → `53:31` first entry | **1** (`source: 'last-known'`, 649 ms — no `getCurrentPositionAsync`) |
| map tap | 0 |
| map pan | 0 |
| marker drag | 0 |
| Places search (typing) | 0 |
| Places suggestion select | 0 |
| Confirm | 0 |
| out-of-service → Choose another location → back | 0 |
| background → foreground WITH a pin placed | 0 |
| idle 45 s on the map | 0 |
| leave the flow, re-enter `53:31` | **1** |

The full chain ran against the live backend: Places returned real predictions, Connaught Place was
selected, Confirm returned `outside_service_area`, `215:1472` was shown, and Back restored the
Connaught Place pin with "We do not serve this area yet." still in the helper pill and Confirm
live again. Logcat clean — no FATAL, no ANR, no redbox, no JS error.

Gates after the fixes: **tsc clean · eslint --max-warnings=0 clean · prettier clean ·
jest 590/590 across 57 suites**.

## Device protocol note (adds to pass 10's)

Two things silently invalidate on-device assertions on this host and both bit this pass:

- The **soft keyboard** stays up after a Places search and covers `address-confirm`, but
  `uiautomator dump` reports the app window WITHOUT the IME, so the button still dumps at its
  normal bounds and a tap on it lands on the keyboard. Confirm read as "did nothing" three times.
  Dismiss the IME and re-screenshot before concluding a control is dead.
- The **LogBox "Open debugger to view warnings" toast** has an outer container spanning
  `[28,2031][1053,2337]` — far larger than the visible toast — and it swallows taps on the CTA
  beneath it. Dismiss it before driving the bottom of any screen.

`MSYS_NO_PATHCONV=1` (pass 10) is still required, or run adb from PowerShell, which is what this
pass did.

## Still open

- Copy defect on `215:1472`: "We are not operational in your area at the moment, , but we are
  working towards it!" — a doubled comma from an empty area name interpolated into the sentence.
  NOT touched this pass: it is a copy/formatting concern on a finalised screen, outside the
  location-churn scope.

# Pass 12 — final polish: infinite Home carousel + V0 profile cleanup

Two defects, one visual and one factual, plus a final reconciliation against the FINAL Figma
(`PsQEgznJ0uWH0MnZsS2Ffc`). Nothing else was reopened.

## Final-Figma section inventory (re-read this pass, not taken from the old audit)

Eleven sections. Ten are V0: Login flow (5 screens) · Address (5) · Home page (4) · Profile (3) ·
Instant booking (4) · Scheduled flow (5) · Rescheduled flow (3) · Cancellation flow (4) ·
Service flow (19) · Cook profiles (8). The eleventh is **`V1s`**, and what sits in it is the
finding that drove half this pass.

## 1. Home showcase carousel — it was not a loop

`378:189` "usecase sliders" holds EIGHT 217 x 268 cards, and all eight were already exported and
already in the right reading order (`absent · snacks · guests · tiffin · roti · mealprep ·
drysnacks · breakfast`). The assets were correct and were not touched.

The behaviour was not. `HomePromoCarousel` advanced with `(index + 1) % count`, which means
crossing the last card **animated the track backwards through all eight** to reach the first — the
visible rewind the design does not have. It was also finite in the other direction: a customer
swiping right from the first card hit a hard edge and stopped.

Replaced with a cloned-edge track:

    [ s6 s7 | s0 s1 s2 s3 s4 s5 s6 s7 | s0 s1 ]
      clones      the real slides       clones
       0  1    2  3  4  5  6  7  8  9   10 11

Stepping off either end lands on a clone showing identical artwork, and the scroller is then
re-anchored onto the matching real card WITHOUT animation. TWO clones per side, not one: at
position 10 the right-hand peek must still be a real card, and a single clone would slide an empty
gutter past on every wrap. `index` stays LOGICAL (0-7) throughout, so the dots and the
accessibility label never report a clone or a ninth slide.

Autoplay is now a lifecycle contract rather than a bare interval. One interval, in one effect,
alive only while the screen is FOCUSED (`useFocusEffect` in `HomeScreen`, passed down as an
optional `focused` prop so `HomeView` stays renderable bare in tests), the app is FOREGROUND, and
the platform is not asking for reduced motion. A manual swipe suspends it and then restarts the
dwell from where the customer landed — and only a DRAG restarts it, so an automatic step never
resets its own clock.

### Two defects found while verifying this, both on the handset

1. **Autoplay never started.** `AppState.currentState` is not `'active'` at first render — Android
   reports `'unknown'` briefly at startup, and iOS reports `'inactive'` during a system prompt.
   Testing for `'active'` left the carousel frozen until the first change event, which on a launch
   straight onto Home may be never. Now tested against the states that mean PAUSED.
2. **A drag with no momentum event froze it permanently.** `interacting` was only released inside
   the settle handler, and a release mid-snap that produces no `onMomentumScrollEnd` never got
   there. Measured: five deliberate right-swipes and the carousel never moved again. A 600 ms
   fallback timer now guarantees the settle — and therefore the release — in every case.

Both are covered by tests; the second by one that fires `scrollEndDrag` with no momentum after it.

## 2. Profile said "incomplete" to customers who were not

`profileFromMe` rendered `222:1570` whenever `GET /v1/me` reported `profileComplete: false`. The
client was already correct in the narrow sense — it read the server rather than deriving anything.
The problem was upstream of that: **`222:1570` is in the `V1s` section of the final file**, not on
`6:663`. So are `Page 17a- profile` and `Page 6- service brief`. V0 has no profile-completeness
surface at all.

Meanwhile the deployed backend reports `profileComplete: false` for any account without a name,
because its rule still counts preference fields V0 removed. Verified on the handset: the live
account has completed everything V0 asks — OTP, address, serviceability, saved address — and was
being told its profile was incomplete.

Removed entirely: `ProfileIncompleteViewModel`, the `incomplete` field, the JSX block and its
styles, the `onCompleteProfile` action, `PROFILE_INCOMPLETE_BADGE` and its `@ui` export, and the
demo fixture's prompt. `profileComplete` is left alone on the server and simply not consumed. The
removed preference onboarding was NOT reintroduced to satisfy the old flag.

`6:663` also names the first tile **"My bookings" / "View booking history"**; it read "My orders" /
"View order history". Copy corrected. The tile ID stays `orders` — it is the route key that
`navigation.test.tsx` asserts, not display text.

## Verified on physical `10BE9X1HPH001UZ` this pass

Driven through NORMAL navigation. Carousel state read from the dots' accessibility label and the
centred card's track position in the SAME `uiautomator` dump (reading them from two dumps races
against a 4 s autoplay and produces contradictory pairs — that cost one wrong diagnosis).

- **Autoplay:** sampled for ~2 minutes — `8 -> 1` five times, strictly monotonic 1..8, never a
  "Slide 9", never stalled on a clone.
- **Manual backward** (the direction that used to be impossible): `3 2 1 8 7 6 5 4 3 2`. The wrap
  moved track position 2 -> 9, which is the re-anchor doing its job.
- **Manual forward:** `8 1 2 3 4 5 6 7 8 1`. Two wraps.
- Every settled track position was in the REAL range 2..9. Never latched onto a clone.
- **Background 20 s** (5 dwells): advanced 1. **Off Home on Profile 20 s:** advanced 1. Both resume.
- **Profile:** "Add your name" + phone, the four tiles with the corrected copy, legal row, Log Out.
  `profile-incomplete` absent from the accessibility tree.
- **Navigation:** Home -> Schedule -> back -> Home · Home -> Profile -> My bookings -> back ->
  Profile · Profile -> My refunds -> back -> Profile · Instant sheet opens over Home and BACK
  closes the sheet rather than the screen. Back at root Home finishes the activity, which is the
  correct platform behaviour.
- Logcat clean — no FATAL, no ANR, no redbox. The one warning is a genuine backend
  `422 ADDRESS_NOT_SERVICEABLE` on `/v1/bookings/quote`, correctly redacted.

Gates: **tsc clean · eslint --max-warnings=0 clean · prettier clean · jest 612/612 across 59
suites** (was 590/57; +22 tests, +2 suites) · `expo config` OK · **`assembleRelease` SUCCESSFUL**.
The release bundle was checked directly: `My bookings` present, `Your profile is incomplete` and
`Complete profile` absent.

## Device protocol note (adds to passes 10 and 11)

- `adb shell input tap` needs INTEGER coordinates. A computed midpoint like `286.5` silently does
  the wrong thing, and the screen then looks like it ignored the press.
- Running `gradlew assembleRelease` while Metro is serving the handset starves Metro and leaves it
  wedged — listening on 8081 but answering nothing, so the app sits on the splash logo forever.
  Metro had to be killed and restarted twice. Do not build and drive the device at the same time.

## Still open

- **BACKEND_GAP — Home banner `reassigned`.** `394:1210` and `393:1050` draw "Reassigned" where
  `337:4261`/`337:4284` draw "Upcoming booking"/"Arriving". `homeBannerView.ts` declares both
  variants and maps them, but no endpoint publishes whether a booking's cook was reassigned, so
  they stay underivable. Not faked: the ordinary card is drawn, which is the safe direction.
  MINIMAL_CHANGE_REQUIRED: a boolean on the active-booking payload.
- **BACKEND_GAP — legal URL.** `6:779` names a terms document; `GET /v1/catalogue`'s `support`
  block carries no legal URL, so the row is drawn as plain text rather than as a dead button.
- **FIGMA INCONSISTENCY:** `394:1257` labels a "Live booking" card "Arrived at" over "16 mins" —
  a duration under a timestamp label. `337:4330` pairs "Live booking" with "Time left / 42 mins",
  which is the coherent one and is what the implementation follows.
- Copy defect on `215:1472` ("at the moment, , but") — carried over from pass 11, still not this
  pass's scope.
- `assets/figma/profile/incomplete-badge.png` is now unreferenced. Left on disk rather than
  deleted; nothing `require`s it, so it is not bundled.
