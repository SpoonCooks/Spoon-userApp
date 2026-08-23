# iOS runtime QA checklist

**Status: `IOS_SIMULATOR_VERIFIED: NO` — `IOS_RUNTIME_QA_PENDING: YES`.**

The development machine is Windows. Xcode and the iOS Simulator require macOS, so no line in this
document has been executed. Everything below is what a macOS pass must confirm, written now so the
Mac session is a checklist rather than a re-derivation.

What HAS been done on Windows is a code-level audit (`docs/FIGMA_PIXEL_PERFECT_AUDIT.md` §P5.8):
no `.android.*` / `.ios.*` split files, no Android-only imports in shared code, every `elevation`
paired with an iOS `shadow*`, explicit `KeyboardAvoidingView` behaviour at all four call sites,
34 SafeArea call sites, no hardcoded Android paths. That establishes the code *can* run on iOS. It
does not establish that it *looks* right.

## 0. Before anything

```bash
npx expo prebuild --platform ios --clean
npx pod-install
npx expo run:ios --device "iPhone 15 Pro"
```

Devices to cover: **iPhone SE (3rd gen)** — smallest + shortest, the analogue of the Small_Phone
defect; **iPhone 15/16** — reference-like at 393pt; **iPhone 15/16 Pro Max** — 430pt.

## 1. Fonts — highest risk on iOS

Livvic is registered at runtime through `expo-font` under explicit keys (`Livvic_400Regular` …
`Livvic_900Black`), NOT through the `expo-font` config plugin's `fonts:` array. That choice is
deliberate: the plugin path embeds faces under their internal PostScript names, which would change
every `fontFamily` string the tokens emit. iOS is stricter than Android about family naming, so
this is the first thing to check.

- [ ] All five weights render as Livvic, not San Francisco. Compare Black 20/28 against Bold 14/20
      on Confirmation's hero — if both look identical, registration silently failed.
- [ ] No flash of system font before the splash releases (`RootLayout` holds on `fontsLoaded`).
- [ ] Livvic Black 900 actually renders at 900 — iOS sometimes falls back to the nearest available
      face rather than erroring.
- [ ] Text baselines: iOS and Android differ on line-height distribution. Check the 9/13.5 micro
      captions and the 10/13.33 quiet labels, which have the least slack.

## 2. Shadows and depth

Android reads `elevation`; iOS reads `shadowColor` / `shadowOffset` / `shadowOpacity` /
`shadowRadius`. Every token emits both, but only Android has been seen.

- [ ] `elevation.soft` / `softer` / `tile` / `banner` / `raised` / `cta` / `badge` / `subtle` all
      visible and not doubled.
- [ ] The `#FEE685` **yellow glow** on the address CTA (`elevations.glow`) — a coloured shadow,
      which iOS renders differently to Android.
- [ ] **ETA panel inner shadow** (`innerShadows.etaPanel`, `97:1231`) — `boxShadow` with `inset`.
      Verified rendering on Android under the New Architecture; iOS is unproven. If it does not
      render, the fallback is border + radius + fill, which is already in the style.
- [ ] Pre-composited fills (`limeBanner`, `limeTrust`, `limeSoft`, `yellowSoft`, `tileIdle`) exist
      because Android bleeds elevation shadows through translucent backgrounds. **iOS may not have
      that artefact** — confirm the flattened values still look correct rather than subtly flat.
- [ ] `shadowRequiresBackground` (`Platform.OS === 'android'`) — confirm no iOS surface relies on it.

## 3. Safe areas

- [ ] Notch / Dynamic Island: no content under the island on 15 Pro.
- [ ] Home indicator: bottom-pinned CTAs (Instant sheet, Schedule footer, address CTA) clear it.
- [ ] `SafeAreaView edges={['top','left','right']}` on Login / OTP / Profile / address / history —
      bottom deliberately excluded; confirm that is right on a home-indicator device.
- [ ] `BottomSheet` adds `insets.bottom` to its padding — check on SE (no indicator) and 15 Pro.
- [ ] Landscape is not supported (`orientation: 'portrait'`); confirm it is actually locked.

## 4. Keyboard

`behavior="padding"` is used on BOTH platforms. On Android that is a deliberate workaround for
`adjustResize` being inert under edge-to-edge; on iOS `padding` is the conventional choice, so the
shared value should be correct — but it has never been observed on iOS.

- [ ] **Login** on iPhone SE: field focused, CTA and legal reachable. This is the exact defect that
      was found and fixed on Android; SE is its iOS analogue.
- [ ] **OTP** on SE: digit boxes and "Verify & Proceed" reachable with the keypad up.
- [ ] Add address / edit address — multi-field forms.
- [ ] Meal Brief free-text.
- [ ] Completion feedback textarea.
- [ ] Cancellation "Others" reason detail field.
- [ ] No double avoidance (KeyboardAvoidingView + automatic ScrollView inset) causing a jump.
- [ ] `keyboardShouldPersistTaps="handled"` — tapping a CTA with the keyboard open works first tap.
- [ ] OTP autofill: `textContentType="oneTimeCode"` is the iOS path and cannot be tested on Android.

## 5. Adaptive Login hero

`heroHeight = clamp(available − 167 − 237, 160, 364)`.

- [ ] iPhone SE resolves BELOW 364 and the whole form is reachable.
- [ ] iPhone 15 Pro Max resolves to exactly 364 — the reference must not grow.
- [ ] The crop still reads as an intentional composition, not a beheaded photo.

## 6. Sheets and modals

- [ ] `BottomSheet` `maxHeight: '92%'` behaves on SE.
- [ ] Scrim `rgba(0,0,0,0.8)` over the correct layer.
- [ ] 20pt top radius, drag-to-dismiss.
- [ ] Instant sheet, Booking details sheet, Extension sheet, cancellation stack, address sheets.
- [ ] Dialog-above-sheet layering (taxes over Instant): iOS back-gesture equivalent of Android back.

## 7. Images and assets

- [ ] `resizeMode="cover"` crops identically (Login hero, cook photo, cuisine mosaic).
- [ ] `@2x`/`@3x` density selection — assets are single-density PNGs; check for softness on 3x.
- [ ] `accessibilityIgnoresInvertColors` respected under Smart Invert.
- [ ] The 32 × 66 to-do mark and 35pt details glyph are not letterboxed.

## 8. Platform-conditional code

Only two `Platform.OS` uses exist. Confirm both:

- [ ] `src/core/runtime.ts` — logging only, no behaviour.
- [ ] `MealBriefScreen` — `Platform.OS === 'ios' ? 'padding' : 'height'`. This is the ONE screen
      that takes a different keyboard behaviour on iOS; it needs explicit attention.

## 9. Gates on macOS

- [ ] `npx expo run:ios` builds clean.
- [ ] No redbox on any DEV route.
- [ ] Xcode console free of layout-constraint or font warnings.
- [ ] Re-run the full responsiveness matrix from the audit doc on the three simulators above.

## 10. Known iOS-specific unknowns

| Item | Why it cannot be settled on Windows |
| --- | --- |
| Inner shadow (`boxShadow` inset) | Implemented per-platform in RN; Android observed, iOS not |
| Coloured shadow (`#FEE685` glow) | iOS composites coloured shadows differently |
| Livvic 900 resolution | iOS font matching differs from Android's |
| Dynamic Island insets | No Android analogue |
| OTP `oneTimeCode` autofill | iOS-only API |
| Pre-composited fills | Compensate for an Android-only artefact |

---

## 12. Native dependencies added 2026-08-18 — the newest and least-audited surface

Three native modules were added after the section above was written. None has run on iOS. They
are listed first for a Mac session because they are the only parts of the app whose iOS behaviour
is not merely *unverified* but genuinely *unconfigured*.

### 12.1 `react-native-razorpay@3.0.0` — payment

Chosen because it is Razorpay's official package and, at 3.0.0, ships a `codegenConfig`
TurboModule spec, so it works under the New Architecture this app builds with. Android is
verified (codegen runs, the debug APK links and builds).

**iOS setup required before it will build:**

- [ ] `npx expo prebuild --platform ios` then `npx pod-install` — the pod comes from
      `react-native-razorpay.podspec`.
- [ ] Razorpay's iOS SDK needs `LSApplicationQueriesSchemes` in `Info.plist` for UPI app handoff.
      The package's README names exactly three permitted values: `tez`, `phonepe`, `paytmmp`.
      Without them the UPI intent flow silently fails to offer installed apps.
- [ ] A URL scheme for the app so the bank/UPI app can return to it. The app already declares
      `scheme: 'spoon'` in `app.config.ts`; confirm it survives prebuild into `CFBundleURLTypes`.

**Behaviour to verify (the same four outcomes as Android):**

- [ ] A completed sandbox payment returns `razorpay_payment_id` AND `razorpay_signature`. The
      launcher REFUSES a result with no signature — if iOS omits it for a flow Android includes
      it for, that surfaces here as a failed payment rather than a wrong one, which is the safe
      direction but needs to be understood.
- [ ] Dismissing the sheet is classified as CANCELLED, not failed. `razorpayLauncher.ts` keys
      that off Razorpay's numeric code `2`, taken from the **Android** SDK's constants. **If iOS
      numbers its cancellation differently, a cancel will read as a failure.** This is the single
      most likely iOS-specific defect in the new code. Check it explicitly, and if it differs,
      the fix is to widen the classification, never to trust the code blindly.
- [ ] Backgrounding the app mid-checkout and returning does not duplicate a payment.

### 12.2 `expo-location` — address coordinates

- [ ] `NSLocationWhenInUseUsageDescription` is present and reads sensibly. It comes from the
      `expo-location` plugin config in `app.config.ts` (`locationWhenInUsePermission`).
- [ ] `NSLocationAlwaysAndWhenInUseUsageDescription` must NOT be present. Background location is
      explicitly disabled in the plugin config; an unnecessary always-permission string is an App
      Store review risk for no feature.
- [ ] The prompt appears when the address map step opens, not at launch.
- [ ] Declining shows the designed message and the retry works after granting in Settings.
- [ ] `reverseGeocodeAsync` on iOS uses Apple's geocoder, NOT Android's. It fills different
      fields. Check the resolved row and the Area line on `60:655` — `deviceLocation.ts` picks
      parts in order of specificity precisely so a different geocoder degrades rather than
      producing an empty or absurd line, but this is the first time Apple's output is seen.

### 12.3 `expo-notifications` — push

- [ ] APNs, not FCM, on iOS. `getDevicePushTokenAsync` returns an APNs token; the backend's
      `PUT /v1/me/push-token` takes `platform: 'ios'`, which the client already sends.
      **Confirm the backend's worker can actually dispatch to an APNs token** — it sends through
      FCM, and FCM can relay to APNs only if the APNs key is uploaded to the Firebase project.
      Until that is confirmed this is an unverified assumption, not a working path.
- [ ] Push Notifications capability + an APNs key in the Apple developer account.
- [ ] `GoogleService-Info.plist` if delivery goes through Firebase — the iOS counterpart of
      PROV-1, and equally absent today.
- [ ] Permission is requested only after sign-in (it is mounted in the authenticated layout).
- [ ] A foreground notification is shown — `setNotificationHandler` returns
      `shouldShowBanner: true`, which matters more on iOS, where the default is to suppress.
- [ ] Tapping routes to the booking; an unknown payload opens Home rather than crashing.

### 12.4 Regression risk from the same change

- [ ] The **address flow** now has a real permission prompt in the middle of it. Check the sheet
      and keyboard behaviour on `60:655` after returning from the system dialog.
- [ ] The **booking CTA** now opens a native modal (Razorpay). Confirm the app's own bottom
      sheets are dismissed or correctly layered beneath it, and that SafeArea insets recover
      after it closes.


## 13. V8 profile onboarding — added 2026-08-20, unverified on iOS

The newest surface, and the one a first-time customer cannot get past. `338:4508`
(`ProfileDetailsScreen`) is form-heavy — eight inputs, twenty chips, a keyboard-driven
multi-select — so it concentrates most of the risks the earlier sections spread out.

### 13.1 Code audit performed on Windows

What was checked, and what it establishes:

- **No platform split.** No `.ios.*` / `.android.*` variant of any new file; one implementation.
- **`BackHandler`.** `useAndroidBackHandler` is the existing shared helper. On iOS
  `BackHandler.addEventListener` is a no-op stub, so the onboarding guard simply does nothing
  there — which is correct: iOS has no hardware back. The screen is entered by a `Redirect`
  (i.e. `replace`) from the boot gate, so the stack holds ONE entry and there is no swipe-back
  target either. The EDIT context is `push`ed and therefore *is* swipe-dismissible, which is the
  intended behaviour: an edit may be abandoned, onboarding may not.
- **Keyboard.** The page uses the measured-IME shrink (`useKeyboardHeight` + `marginBottom`), the
  same approach `AddressDetailsView` already carries, rather than `KeyboardAvoidingView`. That was
  adopted for an Android 15 edge-to-edge defect; on iOS `keyboardDidShow` reports the same
  `endCoordinates.height`, so the mechanism is platform-neutral. It still needs looking at.
- **Elevation.** Every new surface pairs `elevation` with iOS `shadow*` — they all come from the
  `elevations` factory (`badge`, `disc`), which emits both.
- **Safe area.** `SafeAreaView edges={['top','left','right']}`, matching every other stacked screen;
  the bottom gutter comes from `useBottomGutter`.
- **Assets.** Two new PNGs (`profile/chip-remove.png` 64², `profile/incomplete-mark.png` 60×127),
  both 4× node exports with explicit leaf dimensions — no `auto`, no intrinsic-size fallback.

### 13.2 What a macOS pass must confirm

- [ ] **CTA reachability with the keyboard up.** `338:4558` is IN FLOW (the frame draws it at
      y 898 of a 1025pt page), not pinned. With the Name field focused on an **iPhone SE**, scroll
      to the bottom: Confirm must be reachable and fully tappable above the IME.
- [ ] **`keyboardDismissMode="on-drag"`** behaves on iOS — it is a no-op on some RN versions.
- [ ] **The multi-select search field.** `returnKeyType="done"` + `blurOnSubmit={false}`: typing a
      cuisine and pressing Done must add a chip and KEEP focus, so three can be added without
      re-tapping. iOS is the platform where `blurOnSubmit={false}` most often misbehaves.
- [ ] **Chip wrapping.** "Office meals + food delivery" and "Daily cook with 2x visits" wrap rather
      than ellipsize on a 320pt-class width. iOS measures text slightly differently from Android,
      so this is the most likely place to see a one-line clamp appear.
- [ ] **`hitSlop` on a 21pt chip.** The chips are drawn 21pt tall and rely on 12pt of slop each way
      to clear 44pt. Confirm on-device that adjacent chips in a 2-up grid do not steal each other's
      taps — the slop is larger than the 8pt row gutter, so overlapping targets are possible.
- [ ] **The 15pt remove cross.** Its press target is the WHOLE chip; verify a tap anywhere on a
      selected cuisine chip removes it, and that the 8pt slop does not swallow taps meant for the
      chip beside it.
- [ ] **Livvic SemiBold 13/16 (`fieldSection`).** A new type token, 13pt — off the scale and used
      by five section labels. Check it is not falling back to a system face.
- [ ] **`222:1570` / `456:3467` on Page 16.** The card uses absolute offsets inside a flow parent
      (mark at 13/15.89, CTA 26.11 below the copy). Verify nothing overlaps at 430pt or at 320pt.
- [ ] **Boot gate.** Cold-launch a signed-in account with an incomplete profile: the splash must
      hold, then land DIRECTLY on `338:4508`. No flash of Home, no second loading screen.
