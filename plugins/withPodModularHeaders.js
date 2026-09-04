const { withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Generates module maps for Objective-C pods, so Swift pods can import them under static linkage.
 *
 * ## The failure this fixes
 *
 * `pod install` stops with:
 *
 *     [!] The following Swift pods cannot yet be integrated as static libraries:
 *     The Swift pod `FirebaseCoreInternal` depends upon `GoogleUtilities`, which does not
 *     define modules.
 *
 * This project links pods as STATIC LIBRARIES -- not static frameworks. The error itself is the
 * proof: `use_frameworks! :linkage => :static` produces static *frameworks*, which carry module
 * maps of their own, and CocoaPods never raises this for them. So the assumption that
 * `use_frameworks!` was already set for react-native-maps was wrong; nothing in this repo sets it,
 * and the first Firebase failure (SPM + static linkage) was consistent with either, because
 * `build_type.static?` is true for both.
 *
 * A static library has no module map unless CocoaPods generates one, and Swift can only import
 * what it can see as a module. `FirebaseCoreInternal` is Swift and depends on `GoogleUtilities`,
 * which is plain Objective-C. Hence the wall.
 *
 * ## Why globally, having argued for the narrow fix last time
 *
 * `:modular_headers => true` on `GoogleUtilities` alone would clear this one message and probably
 * not the next: the Firebase chain also pulls `nanopb`, `PromisesObjC`, `GoogleDataTransport`,
 * `FirebaseInstallations` and `GoogleAppMeasurement`, all Objective-C, behind Swift pods that
 * import them. CocoaPods reports them ONE AT A TIME, and iOS pods cannot be resolved on the
 * Windows machine this is authored on -- `expo prebuild --platform ios` refuses outright. Each
 * guess would therefore cost a full remote build to test.
 *
 * So the choice is not "narrow vs broad", it is "one broad change, or an unknown number of
 * narrow ones discovered a build at a time". The blast radius here is also genuinely smaller
 * than the SPM decision it might look like: this changes how headers are EXPOSED, not how
 * anything links, and CocoaPods names it as the fix for exactly this error. A pod that cannot be
 * modularised fails loudly at compile time rather than quietly at runtime.
 *
 * ## If this is not enough
 *
 * The documented Expo path for react-native-firebase is `expo-build-properties` with
 * `ios: { useFrameworks: "static" }`, which makes every pod a static framework and removes this
 * error class by construction rather than by generating maps for it. That is the next step, not
 * this one: it changes linkage for every native module in the app, react-native-maps included.
 */

const DIRECTIVE = 'use_modular_headers!';

const BANNER = [
  '# Module maps for Objective-C pods.',
  '#',
  '# Required because pods link as static LIBRARIES here, which carry no module map, and Swift',
  '# pods in the Firebase chain (FirebaseCoreInternal and friends) import Objective-C ones',
  '# (GoogleUtilities, nanopb, PromisesObjC). Set by the withPodModularHeaders config plugin;',
  '# edit that, not this file, which prebuild regenerates.',
  DIRECTIVE,
].join('\n');

module.exports = function withPodModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfile, 'utf8');

      // Idempotent: prebuild may run repeatedly over one ios/ directory.
      if (contents.includes(DIRECTIVE)) return cfg;

      /*
       * Before the first target block. `use_modular_headers!` is a target-definition setting and
       * applies to the definition it is declared in, so one placed after the block it is meant to
       * affect changes nothing -- and produces the identical error, with the line sitting visibly
       * in the file.
       */
      const anchor = contents.search(/^target\s/m);
      if (anchor === -1) {
        throw new Error(
          'withPodModularHeaders: no target block found in the Podfile, so ' +
            `${DIRECTIVE} cannot be placed before the targets it must apply to.`,
        );
      }

      const updated = `${contents.slice(0, anchor)}${BANNER}\n\n${contents.slice(anchor)}`;
      fs.writeFileSync(podfile, updated);
      return cfg;
    },
  ]);
};
