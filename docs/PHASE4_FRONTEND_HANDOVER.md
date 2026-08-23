# Phase 4 frontend handover

**Read this first if you are picking the work up.** It says what is real, what is not, and what
the exact next step is. The endpoint-by-endpoint detail lives in
[`BACKEND_INTEGRATION_MAP.md`](./BACKEND_INTEGRATION_MAP.md); §8 there is this session's record.

**Nothing is committed.** The working tree carries all of it, deliberately (§69 of the task).

---

## 1. Where the work stands

The app is no longer fixture-driven. Every production screen reads real server state; the demo
fixtures survive as STATIC SCREEN COPY (titles, placeholders, marketing content) and as explicit
`__DEV__`-only routes for visual QA.

| Flow | State |
| --- | --- |
| Auth (send/verify/refresh/restore/logout) | Real, verified on a physical device in an earlier pass and live-tested every run since |
| Profile, catalogue | Real |
| Addresses — list/create/update/delete | Real. Creation now works: coordinates come from the device |
| Serviceability | Real, server-decided |
| Home | Real (address, active booking, arrival promise); marketing content is static by product decision |
| Instant / Scheduled availability, quote, create | Real. Scheduled verified end to end; instant blocked by PROV-2 |
| Payment | Integrated. Order verified live (201, sandbox); checkout itself needs a device and a person |
| Booking detail, tracking, service OTP, allowedActions | Real |
| Call Cook | Real, newly wired this pass |
| Cancellation, reschedule, extension, rating, tip, history, refunds | Wired; several only contract-read |
| Push | Client complete; delivery blocked by PROV-1 |

## 2. What is genuinely blocked, and by whom

None of these is a frontend defect. Each names exactly what would close it.

| Id | Blocked | What it needs | Whose |
| --- | --- | --- | --- |
| **DEP-4** | Every deployed-environment check | Render redeployed from `origin/main` (`6497589`). It is healthy but serving a build with no `/v1/catalogue` | Backend/ops |
| **DEP-1** | Sign-in on Render | MSG91 credentials on Render — `otp/send` answers 503 there | Backend/ops |
| **PROV-1** | Push DELIVERY on Android | `google-services.json` from the Firebase console for `com.spoonhelp.userapp.dev` (and the release package), referenced as `android.googleServicesFile` | Owner/ops |
| **PROV-2** | Instant booking, locally | Reachable Google Routes API. Instant answers `TRAVEL_ESTIMATE_UNAVAILABLE`; scheduled is unaffected | Ops |
| **CONFIG** | Map canvas + address search | A tile/Places vendor decision (`FRONTEND_FOUNDATION_PLAN.md` §305) — key, billing, vendor | Product/owner |
| **B-10** | The Help pill's destination | `catalogue.support` is `{}` | Product |
| **B-11** | ~~Cancel from a live booking screen~~ | **CLOSED this session.** The current file DOES draw the control — `3:1041` under the summary, `292:241` on en route/reassigned. Wired and gated by `allowedActions.canCancel` | — |

## 3. The exact next step

**Run the device pass.** The Android build blocker (BUILD-1) is FIXED — see §7 — and a debug APK
is installed on `10BE9X1HPH001UZ` and cold launches cleanly to Login. What has not been done is
exercising the new native integrations on hardware.

Rebuild pointing at whichever API you want the device to reach (the value is embedded at build
time):

```sh
# the API must be reachable from the phone — LAN, not localhost
cd android
JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' \
  EXPO_PUBLIC_API_BASE_URL=http://<host-lan-ip>:3000 ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Then, in order — each one exercises code that has never run on hardware:

1. **Location permission and address creation.** The prompt, a real fix, the OS geocode, the
   server's serviceability verdict, then Save. This is the first time `expo-location` runs.
2. **Razorpay checkout.** Book a scheduled slot; the sheet should open on the sandbox order.
   Test all four outcomes: pay, dismiss, fail, and background the app mid-checkout. None may
   produce a duplicate payment or a "paid" screen the server disagrees with.
3. **Push permission and token registration.** Expect registration to be SKIPPED (PROV-1) and the
   app to behave normally — that is the fail-closed path, and it is worth seeing.
4. **Call Cook**, once a booking has a cook assigned. The button must be absent before that.
5. **UI regression** on real data: long backend addresses, real cook names, real prices, the
   error dialogs.

`docs/IOS_QA_CHECKLIST.md` carries the iOS-side requirements for the same native additions.

## 4. Things that will bite you

- **The APK embeds the API base URL at build time.** Changing `EXPO_PUBLIC_API_BASE_URL` and
  restarting Metro changes nothing. Rebuild. (This is defect FE-5; it cost a full session once.)
- **`android/` is generated and gitignored.** After a config-plugin change run
  `npx expo prebuild --platform android --clean` — and recreate `local.properties` afterwards,
  with FORWARD slashes (`sdk.dir=C\:/Users/.../Android/Sdk`). A backslash path is silently
  mangled by Java properties escaping and fails with "Invalid file path".
- **`adb shell cat` is mangled by Git Bash path conversion** and silently returns nothing, which
  makes every marker assertion pass vacuously. `MSYS_NO_PATHCONV=1` is required.
- **Never run `wm size` / `wm density`** on the physical handset.
- **The local database needs a cook on duty**, or availability answers `NO_PRESENT_COOK`. See
  `scripts/local-dev/README.md`.

## 5. Quality gates at handover

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS, clean |
| `npx eslint . --max-warnings=0` | PASS, clean |
| `npx prettier --check .` | PASS |
| `npx jest` | PASS — 47 suites, 452 tests |
| `SPOON_E2E=1 npx jest --config jest.e2e.config.js` | PASS — 6 tests against the local backend |
| `npx expo config` | PASS |
| Gradle `assembleDebug` | **PASS** — clean, 4 ABIs, 0 errors (§7) |
| Physical device | **PASS** — installed and cold launched on `10BE9X1HPH001UZ`; reaches Login, logcat clean |

## 6. Rules that were not bent

Recorded because the temptation is real and a later session will meet it:

- No coordinate is ever defaulted. A device that cannot produce a fix reports a REASON.
- No payment id or signature is ever fabricated. The SDK-missing path throws; it does not stub.
- `allowedActions` is the only source of whether Cancel, Reschedule, Extend, Rate, Tip or Call
  Cook is offered. Nothing re-derives them from status or the clock.
- No monetary value is computed on the client.
- The cook's phone number is fetched on press, never cached, never logged, never a prop.
- A countdown reaching zero refetches. It never advances a booking's state.

---

## 7. ANDROID_BUILD — FIXED (was BUILD-1)

**Resolved.** Clean `assembleDebug`, all four ABIs, zero compile errors, installed and cold
launched on the physical handset. The previous revision of this section said NDK 28 was required.
**That was wrong**, and the correction is the useful part of this entry.

### Root cause: one damaged NDK install, not a version incompatibility

`expo-root-project` defaults `ndkVersion` to `27.1.12297006`. This machine's copy of that revision
is damaged — it contains the wrong toolchain:

| NDK | `clang++ --version` | reanimated pattern | RN `std::format` |
| --- | --- | --- | --- |
| 26.1.10909125 | 17.0.2 (`10552028`, `r487747d`) | fails | fails |
| 27.1.12297006 | **17.0.2 (`10552028`, `r487747d`)** | fails | fails |
| 27.2.12479018 | 18.0.3 (`12470979`, `r522817c`) | **compiles** | **compiles** |

27.1 is supposed to ship clang 18; it reports version output byte-identical to 26.1. The SDK also
carries a sibling `27.1.12297006_corrupt` directory — the earlier trace of the same damage.

Both build failures were symptoms of that one install:

- **reanimated 4.5.1** — out-of-line member definitions for a concept-constrained partial
  specialization (`TransformOperationInterpolator`): "type constraint differs in template
  redeclaration". Clang 17 rejects the pattern; clang 18 accepts it.
- **react-native 0.86.2** — `std::format` in `graphicsConversions.h`.
  `_LIBCPP_HAS_NO_INCOMPLETE_FORMAT` appears once in 27.1's libc++ `__config` and **zero times**
  in 27.2's.

### How it was proven, rather than inferred

A ~20-line standalone reproduction of the constrained-partial-specialization pattern — no
reanimated, no React Native, no CMake, no PCH — was compiled directly against each installed NDK.
It reproduces the exact error signature on 26.1 and 27.1 and compiles cleanly on 27.2. The same
was done for the upstream `std::format` expression. This is why the earlier "clang 18 is broken,
NDK 28 required" conclusion could be discarded with confidence: the earlier standalone test had
been run with 27.1's compiler, which is clang 17 wearing a clang 18 version number.

### The fix

`plugins/withNdkVersion.js` — a local Expo config plugin that sets `ext.ndkVersion` in
`android/build.gradle` **above** `apply plugin: "expo-root-project"`. That plugin resolves the NDK
with `setIfNotExist`, so a pre-set value wins; this is the project's own override seam, not a new
build mechanism. It is a config plugin rather than an edit to `android/` because `android/` is
generated and gitignored — a direct edit is silently discarded by the next `expo prebuild`.

Registered as `'./plugins/withNdkVersion'` in `app.config.ts`.

### If you are on a different machine

Repair or reinstall `27.1.12297006` and the pin can be dropped entirely — the revision is fine,
only this machine's copy is not. Any NDK whose clang is 18 or newer satisfies both requirements.
If `27.2.12479018` is not installed, either install it or change `NDK_VERSION` in the plugin to
another installed revision with clang >= 18.

### Notes for the next build

- **JDK:** Gradle must run under JDK 17+. The machine default is JRE 8, which fails at
  configuration. Android Studio's bundled JBR 21 works:
  `JAVA_HOME='C:/Program Files/Android/Android Studio/jbr'`.
- **`local.properties` does not survive `expo prebuild`** (with or without `--clean`). Recreate it
  with FORWARD slashes — `sdk.dir=C\:/Users/<you>/AppData/Local/Android/Sdk` — because Java
  properties treat a lone backslash as an escape and the path silently becomes `C:UsersYou...`,
  failing with "Invalid file path". Setting `ANDROID_HOME` avoids the file entirely.
- **A debug APK needs Metro.** Launched without it, the app shows the dev redbox
  ("loadJSBundleFromAssets") — that is expected, not a build defect. `adb reverse tcp:8081 tcp:8081`
  then `npx expo start --dev-client`.
