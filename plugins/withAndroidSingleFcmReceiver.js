const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Stops `@react-native-firebase/messaging` from receiving FCM messages on Android, so
 * `expo-notifications` is the only thing that does.
 *
 * ## Why this exists
 *
 * Both libraries' native modules register their own service for `com.google.firebase
 * .MESSAGING_EVENT` — `io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService` and
 * `expo.modules.notifications.service.ExpoFirebaseMessagingService` — regardless of which one
 * the JS side actually calls. `expo.modules.notifications.service.ExpoFirebaseMessagingService`
 * declares itself lower priority (-1 vs the invertase service's default 0), and Firebase's
 * merged-manifest dispatch resolves a single target for that action rather than fanning it out
 * to every registered service, so invertase's higher-priority service wins the message.
 *
 * Nothing in this app's JS calls `@react-native-firebase/messaging`'s receive-side API
 * (`onMessage`, `setBackgroundMessageHandler`) on Android — see `expoPushProvider.ts`, which
 * uses it only to mint an FCM token on iOS. So invertase's service was capturing every push,
 * doing nothing observable with it (no JS listener was there to receive it), and never handing
 * it on to Expo's service — which is the one whose `setNotificationHandler` config actually
 * displays a banner. A push would arrive at the device's Firebase SDK (visible in logcat) and
 * never become a visible notification, on a build where it should have.
 *
 * ## The fix
 *
 * `tools:node="remove"` in the app's own manifest is the standard Android manifest-merger way to
 * delete a component a dependency's manifest contributes; it needs no code change in either
 * library. Removing these Android components does not touch `getMessaging()`/`getToken()`,
 * which is a JS-to-native call unrelated to manifest-registered broadcast targets, so the iOS
 * token path this plugin's neighbour (`withRNFirebasePods.js`) exists for is untouched.
 *
 * ## Why a config plugin rather than an edit to `android/app/src/main/AndroidManifest.xml`
 *
 * `android/` is generated and gitignored — same reasoning as `withNdkVersion.js` and
 * `withRNFirebasePods.js`.
 */
const TOOLS_NS = 'http://schemas.android.com/tools';
const REMOVED_COMPONENTS = [
  { tag: 'service', name: 'io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService' },
  {
    tag: 'service',
    name: 'io.invertase.firebase.messaging.ReactNativeFirebaseMessagingHeadlessService',
  },
  { tag: 'receiver', name: 'io.invertase.firebase.messaging.ReactNativeFirebaseMessagingReceiver' },
];

module.exports = function withAndroidSingleFcmReceiver(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;

    manifest.$['xmlns:tools'] = TOOLS_NS;

    const application = manifest.application?.[0];
    if (application === undefined) return modConfig;

    for (const { tag, name } of REMOVED_COMPONENTS) {
      application[tag] = application[tag] ?? [];
      const already = application[tag].some((entry) => entry.$?.['android:name'] === name);
      if (already) continue;

      application[tag].push({
        $: {
          'android:name': name,
          'tools:node': 'remove',
        },
      });
    }

    return modConfig;
  });
};
