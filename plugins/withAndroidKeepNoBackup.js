const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Keeps the app's `android:allowBackup="false"` when a dependency's manifest asks for `true`.
 *
 * ## Why this exists
 *
 * `react-native-compressor` (rating photos and videos, 6ee2f3c) pulls in
 * `com.github.kaushik-naik:TAndroidLame`, whose manifest sets `android:allowBackup="true"` on its
 * `<application>`. The app's own is `false`, and Android's manifest merger refuses two different
 * values on the same attribute, so every Android build, debug or release, stops at
 * `processDebugMainManifest` / `processReleaseMainManifest`.
 *
 * ## The fix
 *
 * `tools:replace="android:allowBackup"` on the app's `<application>` is the merger's standard way
 * to say the app's value wins. Backups stay off, as they were before the dependency arrived:
 * the session tokens in SecureStore must not be restored onto another device.
 *
 * ## Why a config plugin rather than an edit to `android/app/src/main/AndroidManifest.xml`
 *
 * `android/` is generated and gitignored — same reasoning as `withAndroidSingleFcmReceiver.js`.
 */
const TOOLS_NS = 'http://schemas.android.com/tools';
const REPLACED = 'android:allowBackup';

module.exports = function withAndroidKeepNoBackup(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    manifest.$['xmlns:tools'] = TOOLS_NS;

    const application = manifest.application?.[0];
    if (application === undefined) return modConfig;

    application.$ = application.$ ?? {};
    application.$['android:allowBackup'] = 'false';
    const replaced = (application.$['tools:replace'] ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry !== '');
    if (!replaced.includes(REPLACED)) replaced.push(REPLACED);
    application.$['tools:replace'] = replaced.join(',');

    return modConfig;
  });
};
