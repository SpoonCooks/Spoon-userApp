# Patches

Applied automatically by `patch-package` from the `postinstall` script. Do not hand-edit
`node_modules` — change the source there and re-run `npx patch-package <pkg>` so the fix survives
the next install.

## `react-native+0.86.2.patch` — `std::format` in `graphicsConversions.h`

**Status: RETAINED, but very probably unnecessary. Read this before touching it.**

`ReactCommon/react/renderer/core/graphicsConversions.h` serialises a percent dimension with
`std::format`. The patch replaces it with `folly::to<std::string>(...) + "%"`.

### Why it was written, and why that reasoning was wrong

It was written to fix:

```
graphicsConversions.h:71:14: error: no member named 'format' in namespace 'std';
                                    did you mean 'folly::format'?
```

which took down `:expo-modules-core:buildCMakeDebug` and `:react-native-reanimated:buildCMakeDebug`.
The diagnosis at the time was that NDK 27's libc++ classifies `<format>` as an incomplete feature
(`_LIBCPP_HAS_NO_INCOMPLETE_FORMAT`) and that this was inherent to the NDK.

**That was wrong.** The real cause was a single damaged NDK install. Measured, not inferred:

| NDK           | `clang++ --version`                 | upstream `std::format` line |
| ------------- | ----------------------------------- | --------------------------- |
| 26.1.10909125 | 17.0.2 (`10552028`, `r487747d`)     | fails                       |
| 27.1.12297006 | **17.0.2 (`10552028`, `r487747d`)** | fails                       |
| 27.2.12479018 | 18.0.3 (`12470979`, `r522817c`)     | **compiles**                |

Row two is the finding. NDK 27.1.12297006 is _supposed_ to ship clang 18; this machine's copy
reports byte-identical version output to NDK 26.1 — it contains the wrong toolchain. The SDK also
holds a sibling `27.1.12297006_corrupt` directory, which is the earlier trace of the same damage.

`_LIBCPP_HAS_NO_INCOMPLETE_FORMAT` appears once in 27.1's libc++ `__config` and **zero times** in
27.2's. So `std::format` is not gated on a correct NDK 27, and upstream React Native compiles as
written.

### Why it is still here

The project now pins NDK `27.2.12479018` (`plugins/withNdkVersion.js`), which removes the need
for this patch. Removing it was verified only by compiling the exact upstream expression
standalone against 27.2 — a full `assembleDebug` with the patch reverted was started but stopped
before it finished, so the removal is **not** yet proven end to end.

The APK currently on disk, and the clean `BUILD SUCCESSFUL` that fixed BUILD-1, were both
produced **with** this patch applied. It is retained so the verified state and the checked-in
state match.

### To remove it (recommended, once someone can spare a build)

```sh
rm patches/react-native+0.86.2.patch
rm -rf node_modules/expo-modules-core/android/.cxx node_modules/react-native-reanimated/android/.cxx
npm install                       # restores the pristine header
cd android && ./gradlew assembleDebug
```

Expect success. If it succeeds, also drop `patch-package` and the `postinstall` script from
`package.json` — this was the only patch. If it fails, restore the patch and record why here.

Removing it is worth doing: it is a divergence from React Native core carried for a reason that
turned out not to exist, and `folly::to<std::string>` and `std::format("{}")` are not guaranteed
to render every float identically.
