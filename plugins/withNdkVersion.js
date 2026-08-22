const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Pins the Android NDK revision the project builds against.
 *
 * ## Why this exists
 *
 * Expo's `expo-root-project` Gradle plugin resolves the NDK with
 * `extra.setIfNotExist("ndkVersion") { ... default "27.1.12297006" }`
 * (`ExpoRootProjectPlugin.kt`). `setIfNotExist` means a value already present on `ext` WINS — so
 * setting `ext.ndkVersion` before that plugin is applied is the project's own sanctioned
 * override seam, not a new build mechanism invented here.
 *
 * ## Why it is a config plugin rather than an edit to `android/build.gradle`
 *
 * `android/` is generated and gitignored. Editing it directly works until the next
 * `expo prebuild`, which silently discards the pin and reintroduces a build failure that looks
 * unrelated to whatever prompted the regeneration. A plugin is re-applied by every prebuild, so
 * the pin is reproducible on any dev machine and in CI.
 *
 * ## Why 27.2 and not the default
 *
 * `27.1.12297006` as INSTALLED on the original build machine is a damaged package: its
 * `clang++ --version` reports **17.0.2** with build id `10552028 / r487747d` — byte-identical to
 * what NDK 26.1.10909125 reports — rather than the clang 18 that revision ships. A sibling
 * `27.1.12297006_corrupt` directory in the SDK is the earlier evidence of the same damage.
 *
 * Clang 17 rejects two things this project needs, and clang 18 accepts both:
 *
 *  - out-of-line member definitions for a CONCEPT-CONSTRAINED PARTIAL SPECIALIZATION, which is
 *    the pattern `react-native-reanimated@4.5.1` uses in `TransformOperationInterpolator`
 *    ("type constraint differs in template redeclaration");
 *  - `std::format`, which `react-native@0.86.2` uses in `graphicsConversions.h`.
 *
 * Both were verified with standalone minimal reproductions against each installed NDK, so the
 * pin rests on measurement rather than on inference from a build log.
 *
 * ## Replacing it
 *
 * Repair or reinstall `27.1.12297006` and this can go back to the Expo default — the revision
 * itself is fine, only this machine's copy of it is not. Any NDK whose clang is 18 or newer
 * satisfies both requirements.
 */

/** The revision to pin. Must be installed under `$ANDROID_HOME/ndk/`. */
const NDK_VERSION = '27.2.12479018';

const ANCHOR = 'apply plugin: "expo-root-project"';

module.exports = function withNdkVersion(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error(
        'withNdkVersion: android/build.gradle is not Groovy; the NDK pin was not applied.',
      );
    }

    // Idempotent: prebuild can run repeatedly, and a second copy of the block would be harmless
    // but confusing.
    if (mod.modResults.contents.includes('ndkVersion =')) {
      return mod;
    }

    if (!mod.modResults.contents.includes(ANCHOR)) {
      // Fail loudly. Silently skipping would hand back a project that builds with the default
      // NDK and fails deep inside a third-party CMake task, which is exactly the failure this
      // plugin exists to prevent.
      throw new Error(
        `withNdkVersion: could not find \`${ANCHOR}\` in android/build.gradle. ` +
          'Expo may have changed the template; re-check where ext.ndkVersion must be set.',
      );
    }

    // Inserted BEFORE `expo-root-project` is applied, because that plugin only fills the value
    // in when it is absent.
    mod.modResults.contents = mod.modResults.contents.replace(
      ANCHOR,
      [
        '// Set by plugins/withNdkVersion.js — see that file for why this revision is pinned.',
        '// `expo-root-project` fills ndkVersion in only if it is not already set, so this',
        '// assignment must stay ABOVE the `apply plugin` line below.',
        'ext {',
        `  ndkVersion = "${NDK_VERSION}"`,
        '}',
        '',
        ANCHOR,
      ].join('\n'),
    );

    return mod;
  });
};

module.exports.NDK_VERSION = NDK_VERSION;
