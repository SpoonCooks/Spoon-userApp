# Running the app locally on an Android device

## `npm run android` reverses the Metro port first

```
"android": "adb reverse tcp:8081 tcp:8081 || true; expo run:android"
```

`expo run:android` points the dev build at the Mac's LAN address — the launch line reads
`url=http://192.168.1.4:8081`. Everything the JS bundle does NOT contain is then fetched over
WiFi at runtime, fonts and icons included, and a debug APK contains no fonts at all:

```
production AAB   base/res/raw/…reactnativevectoricons_fonts_feather.ttf   55,596 bytes
debug APK        font files: 0
```

So when the LAN fetch fails, `@expo/vector-icons` renders nothing and every Feather glyph in the
app disappears — the bottom sheet's back arrow, the Schedule period chips, the Instant bolt, the
Profile card icons. The app keeps working; it simply loses its icons, and the only clue is a dev
toast reading `Call to function 'ExpoAsset.downloadAsync' has been rejected`, which does not
obviously mean "your icons are gone".

This was mistaken for a missing back button on 2026-09-17, and took a production-AAB comparison to
rule out as a code change.

`adb reverse` makes the device reach Metro at `localhost:8081` over the USB cable instead, which
removes the WiFi dependency entirely.

`|| true` rather than `&&`: `adb` may be absent from PATH, or no device attached (an emulator, a
CI run), and none of those should stop a build. Verified — with `adb` missing, `expo run:android`
still runs.

## If icons vanish anyway

Check Metro is actually serving the font before assuming the app is at fault:

```
curl -o /dev/null -w "%{http_code}\n" \
  "http://localhost:8081/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf?platform=android&hash=1"
```

A `200` means Metro is fine and the device could not reach it. A production build cannot hit this
at all: the font is inside the APK.

## Building locally at all

The Android build needs **JDK 17**, not Android Studio's bundled JDK.

```
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_HOME=$HOME/Library/Android/sdk
```

Android Studio 27 ships JDK 25, and the Android Gradle Plugin's CMake step fails on it:

```
Execution failed for task ':react-native-worklets:configureCMakeDebug[arm64-v8a]'.
> WARNING: A restricted method in java.lang.System has been called
```

EAS cloud builds are unaffected — their builders use a supported JDK, which is why production
builds succeed while a local one fails.
