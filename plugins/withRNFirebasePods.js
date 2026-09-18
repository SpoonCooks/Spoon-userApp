const { withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Makes react-native-firebase resolve the Firebase SDK through CocoaPods instead of SPM.
 *
 * ## Why this exists
 *
 * `use_frameworks! :linkage => :static` is required by react-native-firebase, and
 * react-native-firebase ALSO resolves firebase-ios-sdk through Swift Package Manager by default.
 * The two are incompatible, and it says so itself rather than failing obscurely:
 *
 *   [!] [react-native-firebase] SPM + static linkage is not supported (target(s): Pods-Spoon).
 *
 * firebase-ios-sdk's SPM products are automatic libraries rather than `type: .dynamic`, so each
 * react-native-firebase pod embeds its own copy of them and the copies collide at link time as
 * duplicate symbols. It offers two ways out: link dynamically, or opt out of SPM.
 *
 * ## Why opting out of SPM, and not dynamic linkage
 *
 * `useFrameworks` is a project-wide switch. Prebuild reports it disabling `USE_FRAMEWORKS` for 82
 * pods already, and this tree carries `react-native-maps`, `react-native-razorpay`,
 * `react-native-reanimated` and `react-native-webview` — relinking all of them dynamically to
 * satisfy one dependency is a far larger change than confining the fix to Firebase, and dynamic
 * frameworks also cost startup time on every launch.
 *
 * `$RNFirebaseDisableSPM` is react-native-firebase's own documented seam for exactly this, and
 * the Firebase version it then resolves is the one its podspecs pin. Nothing else moves.
 *
 * ## Why a config plugin rather than an edit to `ios/Podfile`
 *
 * `ios/` is generated and gitignored, so an edit there survives until the next `expo prebuild`
 * and then vanishes — reintroducing a build failure that looks unrelated to whatever prompted the
 * regeneration. Same reasoning as `withNdkVersion`, and the same trap that put
 * `SYSTEM_ALERT_WINDOW` into the first production AAB.
 *
 * The global has to be set BEFORE any target block, which is why it is prepended rather than
 * appended.
 */
const MARKER = '$RNFirebaseDisableSPM';

module.exports = function withRNFirebasePods(config) {
  return withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const podfile = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfile, 'utf8');

      // Prebuild runs this on an already-generated Podfile; a second application must not stack.
      if (contents.includes(MARKER)) return modConfig;

      fs.writeFileSync(
        podfile,
        `# Set by plugins/withRNFirebasePods.js — see that file for why.\n${MARKER} = true\n\n${contents}`,
        'utf8',
      );

      return modConfig;
    },
  ]);
};
