# Google Maps / Places / Geocoding configuration

What is wired, where each key goes, and the one restriction change that is still outstanding.

---

## 1. What each API is used for

| Capability | Provider | Key delivered via | Called from |
| --- | --- | --- | --- |
| Map canvas + pin (`53:31`) | **Maps SDK for Android / iOS**, through `react-native-maps` | `AndroidManifest.xml` / `Info.plist`, written at **build time** by the library's own Expo config plugin | native |
| Address search (`53:63`) | **Places API (New)** — `places:autocomplete` + place details | `extra` in the JS bundle | `src/features/address/location/googlePlaces.ts` |
| Coordinates → readable address | **OS geocoder first**, **Geocoding API** as the fallback | as above (only the fallback needs a key) | same module |
| Travel time / ETA | **Google Routes — BACKEND ONLY** | never reaches this app | backend |

The Routes key is deliberately absent from the frontend and must stay that way.

`expo-location`'s `reverseGeocodeAsync` is tried **before** Google: it needs no key, no quota and no
round trip of ours. It is also empty on plenty of Android builds, which is why Google backs it up —
without the fallback the resolved row reads "Selected location" forever on those devices.

## 2. Where the keys come from

`.env` (gitignored, never committed):

```
GOOGLE_MAPS_ANDROID_API_KEY=...
GOOGLE_MAPS_IOS_API_KEY=...
ANDROID_SIGNING_SHA1=            # optional, see §4
```

`app.config.ts` reads them from the environment and hands them on. No key is ever written into
source. A **production** build throws if either is missing; development degrades gracefully — the
map and search report themselves unavailable and the rest of the address flow keeps working.

## 3. Why the Places key is in the JS bundle, and why that is acceptable

The native Maps SDKs read their key from the manifest and Info.plist. Places and Geocoding are
**HTTPS APIs called from JS**, so their key has to be readable at runtime — that is true of any
client calling Google's web services directly, and extracting it from an APK is trivial.

A Maps client key is therefore **not a secret**. It is a public identifier made safe by an
**application restriction** in Google Cloud, exactly like a Razorpay publishable key. The app sends
the headers that make such a restriction work:

| Platform | Headers sent on every Places / Geocoding request |
| --- | --- |
| Android | `X-Android-Package: <android.package>`, `X-Android-Cert: <signing SHA-1>` |
| iOS | `X-Ios-Bundle-Identifier: <ios.bundleIdentifier>` |

The native SDKs send these automatically; a REST caller has to send them itself, which
`googlePlaces.ts` does. They cost nothing while the key is unrestricted and are the difference
between working and `403` once it is locked down.

The alternative — proxying Places through the Spoon backend so no key ships at all — is the
stronger design and is worth doing if key abuse ever shows up in billing. It is backend work and
was out of scope for this pass.

## 4. Verified against this build

Measured, not assumed:

| Fact | Value |
| --- | --- |
| `android.package` | `com.spoonhelp.userapp.dev` |
| `ios.bundleIdentifier` | `com.spoonhelp.userapp.dev` |
| Debug signing SHA-1 | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| Confirmed on the APK | `apksigner verify --print-certs` → `5e8f16062ea3cd2c4a0d547876baa6f38cabf625` |

That SHA-1 is the **standard React Native / Expo debug keystore**, checked into `android/app` by
prebuild. The release keystore is different, and its fingerprint must be added to the key's
restriction (or given its own key) before a release build can render a map.

### Restriction status — ACTION REQUIRED

Both keys were probed directly against the live APIs:

| Probe | Result |
| --- | --- |
| Places (New) autocomplete, Android key, **with** app headers | `200 OK` |
| Places (New) autocomplete, Android key, **without** any app headers, from a desktop | **`200 OK`** |
| Geocoding reverse, Android key, from a desktop | `200 OK` |
| Places (New) autocomplete, iOS key, from a desktop | `200 OK` |

The middle rows are the finding: **the keys currently answer requests that carry no application
identity at all, from a machine that is not the app.** Functionally everything works — nothing is
blocked, and the map/search/geocoding all have the access they need. But the restriction that is
supposed to make a public client key safe is not being enforced for the web-service APIs.

Recommended, in Google Cloud Console → Credentials:

1. **Android key** → Application restrictions → *Android apps* → add
   `com.spoonhelp.userapp.dev` + `5E:8F:...:F6:25` (and the release package + its SHA-1).
2. **iOS key** → Application restrictions → *iOS apps* → add `com.spoonhelp.userapp.dev`.
3. **Both** → API restrictions → restrict to exactly: the platform's Maps SDK, **Places API (New)**,
   **Geocoding API**.
4. Set `ANDROID_SIGNING_SHA1` in `.env` and rebuild, so the app sends `X-Android-Cert`.

Step 4 matters: once step 1 is applied, REST calls **without** that header start failing. The app
already sends it whenever the variable is set, so setting it first makes the change seamless.

## 5. Build requirements

The Android Maps key is embedded in `AndroidManifest.xml` at build time, so **changing it requires a
rebuild** — restarting Metro does nothing. `android/` is generated and gitignored:

```sh
npx expo prebuild --platform android --clean
printf 'sdk.dir=C\\:/Users/<you>/AppData/Local/Android/Sdk\n' > android/local.properties
cd android && JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' \
  ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon --max-workers=2
```

`local.properties` does not survive prebuild and must use FORWARD slashes. Restricting the ABI to
the device's own keeps the native build inside this machine's memory budget.

## 6. Plugin order

`react-native-maps` is **appended** to `plugins`, never substituted. `./plugins/withNdkVersion` must
keep running before `expo-root-project` resolves the NDK, and `expo-router`, `expo-font`,
`expo-splash-screen` and `expo-location` are untouched. Verified after prebuild: the manifest carries
both `com.google.android.geo.API_KEY` and the pinned `ndkVersion = 27.2.12479018`.

## 7. iOS

Configured but **not run**. The plugin writes `Info.plist` and the `GMSServices.provideAPIKey`
AppDelegate init, and adds the GoogleMaps pod; `googlePlaces.ts` selects the iOS key and sends
`X-Ios-Bundle-Identifier`. No `ios/` project was generated and no simulator or device build was
attempted — `/ios` is gitignored and this pass had only an Android handset. iOS runtime QA is
outstanding.
