const {
  AndroidConfig,
  IOSConfig,
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
  withXcodeProject,
} = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

/**
 * App shortcuts: Instant, Schedule and Recurring, offered by the OS OUTSIDE the app.
 *
 * Searching "Spoon" in Spotlight (iOS) or the launcher's search (Android) shows these as buttons
 * beside the app icon, the way Instagram shows Reels / Messages / Profile and Amazon shows
 * Search / Your Orders / Cart. Android also shows them on a long-press of the launcher icon.
 *
 * ## One list, two mechanisms
 *
 * The platforms have nothing in common here, so the list below is the only shared part:
 *
 *   Android  STATIC shortcuts: `res/xml/spoon_shortcuts.xml`, referenced from MainActivity by
 *            `android.app.shortcuts` meta-data. Pixel and Samsung launcher search both surface
 *            them, and so does the icon's long-press menu.
 *   iOS      App Shortcuts: an `AppShortcutsProvider` in the app target (App Intents, iOS 16+).
 *            That provider is what Spotlight's "Top Hit" buttons are made from. Home-screen
 *            quick actions (`UIApplicationShortcutItems`) are a different feature and do NOT
 *            appear in Spotlight.
 *
 * ## How a tap reaches a screen
 *
 * Both end in an ordinary `spoon://` deep link, so Expo Router routes the tap and the session
 * guard in `(app)/_layout.tsx` applies to it exactly as it does to any other link: a signed-out
 * customer lands on `/login`, not inside the flow.
 *
 *   Android  The shortcut's intent names this package AND MainActivity explicitly, so a Dev,
 *            Staging and Production build installed side by side (all on `spoon://`) cannot
 *            open each other.
 *   iOS      The intent hands the URL to THIS app's own `application(_:open:options:)` rather
 *            than calling `UIApplication.open`, for the same reason: asking iOS to open a
 *            scheme three installed apps share lets iOS pick any of them. Calling the delegate
 *            directly feeds `expo-linking`'s `ExpoLinkingRegistry`, which records the URL even
 *            while the JS bundle is still loading -- and Expo Router reads its iOS initial URL
 *            from that registry -- so a cold launch from Spotlight still lands on the screen.
 *
 * ## Why a config plugin rather than files under `ios/` and `android/`
 *
 * Both are generated and gitignored -- same reasoning as `withNdkVersion.js`. Everything here is
 * rewritten by every prebuild, so the shortcuts and the routes they point at stay in one place.
 *
 * ## Not designed yet
 *
 * There is no Figma frame for these. The labels reuse the Home tiles' words, the iOS glyphs are
 * SF Symbols (the convention Spotlight's other buttons follow), and the Android glyphs are
 * Material icons on the brand yellow. All of it is a placeholder until design specifies it.
 */

/** Spoon's brand yellow, `palette.yellow500` -- a literal, as in app.config.ts. */
const BRAND_YELLOW = '#FFD600';
const GLYPH_COLOUR = '#000000';

/**
 * Material icon paths (Apache 2.0), on a 24-unit grid: `flash_on`, `calendar_today`, `repeat`.
 */
const SHORTCUTS = [
  {
    id: 'instant',
    shortLabel: 'Instant',
    longLabel: 'Book an instant cook',
    // Home, whose redesign leads with Instant's "Book now". `open=instant` is kept on the route so
    // the shortcut can again open something more specific without a native rebuild; the
    // redesigned Home does not read it yet.
    route: 'home?open=instant',
    intentName: 'OpenSpoonInstantIntent',
    iosPhrases: ['Book an instant cook in ${app}', '${app} instant'],
    sfSymbol: 'bolt.fill',
    androidGlyph: 'M7,2v11h3v9l7,-12h-4l4,-8z',
  },
  {
    id: 'schedule',
    shortLabel: 'Schedule',
    longLabel: 'Schedule a cook',
    route: 'scheduled',
    intentName: 'OpenSpoonScheduleIntent',
    iosPhrases: ['Schedule a cook in ${app}', '${app} schedule'],
    sfSymbol: 'calendar',
    androidGlyph:
      'M20,3h-1V1h-2v2H7V1H5v2H4C2.9,3 2,3.9 2,5v16c0,1.1 0.9,2 2,2h16c1.1,0 2,-0.9 2,-2V5c0,-1.1 -0.9,-2 -2,-2zM20,21H4V8h16v13z',
  },
  {
    id: 'recurring',
    shortLabel: 'Recurring',
    longLabel: 'Set up a recurring cook',
    // Home for now: the Recurring flow (`recurring-setup/days`) is not open to customers yet. Point
    // this at it once it is.
    route: 'home',
    intentName: 'OpenSpoonRecurringIntent',
    iosPhrases: ['Set up a recurring cook in ${app}', '${app} recurring'],
    sfSymbol: 'repeat',
    androidGlyph: 'M7,7h10v3l4,-4 -4,-4v3H5v6h2V7zM17,17H7v-3l-4,4 4,4v-3h12v-6h-2v4z',
  },
];

const ANDROID_SHORTCUTS_RESOURCE = 'spoon_shortcuts';
const IOS_SWIFT_FILE = 'SpoonAppShortcuts.swift';

function deepLink(config, route) {
  const scheme = Array.isArray(config.scheme) ? config.scheme[0] : config.scheme;
  if (typeof scheme !== 'string' || scheme === '') {
    throw new Error('withAppShortcuts: `scheme` must be set in the app config.');
  }
  return `${scheme}://${route}`;
}

// ---------------------------------------------------------------------------------------------
// Android
// ---------------------------------------------------------------------------------------------

function androidShortcutsXml(config) {
  const pkg = config.android?.package;
  if (typeof pkg !== 'string' || pkg === '') {
    throw new Error('withAppShortcuts: `android.package` must be set in the app config.');
  }

  const entries = SHORTCUTS.map(
    (s) => `  <shortcut
    android:shortcutId="${s.id}"
    android:enabled="true"
    android:icon="@drawable/ic_shortcut_${s.id}"
    android:shortcutShortLabel="@string/shortcut_${s.id}_short"
    android:shortcutLongLabel="@string/shortcut_${s.id}_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="${pkg}"
      android:targetClass="${pkg}.MainActivity"
      android:data="${deepLink(config, s.route)}" />
  </shortcut>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by plugins/withAppShortcuts.js. Do not edit: android/ is regenerated. -->
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
${entries}
</shortcuts>
`;
}

/** A 48dp launcher-shortcut icon: a 44dp brand-yellow disc with the 24dp glyph centred on it. */
function androidIconXml(glyph) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by plugins/withAppShortcuts.js. Do not edit: android/ is regenerated. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="48dp"
  android:height="48dp"
  android:viewportWidth="48"
  android:viewportHeight="48">
  <path
    android:fillColor="${BRAND_YELLOW}"
    android:pathData="M24,2a22,22 0,1 1,0 44a22,22 0,1 1,0 -44z" />
  <group android:translateX="12" android:translateY="12">
    <path android:fillColor="${GLYPH_COLOUR}" android:pathData="${glyph}" />
  </group>
</vector>
`;
}

function withAndroidShortcutFiles(config) {
  return withDangerousMod(config, [
    'android',
    (modConfig) => {
      const res = path.join(modConfig.modRequest.platformProjectRoot, 'app/src/main/res');

      const xmlDir = path.join(res, 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, `${ANDROID_SHORTCUTS_RESOURCE}.xml`),
        androidShortcutsXml(modConfig),
      );

      const drawableDir = path.join(res, 'drawable');
      fs.mkdirSync(drawableDir, { recursive: true });
      for (const s of SHORTCUTS) {
        fs.writeFileSync(
          path.join(drawableDir, `ic_shortcut_${s.id}.xml`),
          androidIconXml(s.androidGlyph),
        );
      }

      return modConfig;
    },
  ]);
}

/** Android requires shortcut labels to be string RESOURCES, not literals. */
function withAndroidShortcutStrings(config) {
  return withStringsXml(config, (modConfig) => {
    const items = SHORTCUTS.flatMap((s) => [
      AndroidConfig.Resources.buildResourceItem({
        name: `shortcut_${s.id}_short`,
        value: s.shortLabel,
      }),
      AndroidConfig.Resources.buildResourceItem({
        name: `shortcut_${s.id}_long`,
        value: s.longLabel,
      }),
    ]);
    modConfig.modResults = AndroidConfig.Strings.setStringItem(items, modConfig.modResults);
    return modConfig;
  });
}

function withAndroidShortcutMetaData(config) {
  return withAndroidManifest(config, (modConfig) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(modConfig.modResults);
    activity['meta-data'] = (activity['meta-data'] ?? []).filter(
      (entry) => entry.$?.['android:name'] !== 'android.app.shortcuts',
    );
    activity['meta-data'].push({
      $: {
        'android:name': 'android.app.shortcuts',
        'android:resource': `@xml/${ANDROID_SHORTCUTS_RESOURCE}`,
      },
    });
    return modConfig;
  });
}

// ---------------------------------------------------------------------------------------------
// iOS
// ---------------------------------------------------------------------------------------------

function swiftString(value) {
  return JSON.stringify(value);
}

function iosSwiftSource(config) {
  const intents = SHORTCUTS.map(
    (s) => `struct ${s.intentName}: AppIntent {
  static let title: LocalizedStringResource = ${swiftString(s.longLabel)}
  static let openAppWhenRun = true

  @MainActor
  func perform() async throws -> some IntentResult {
    openInThisApp(${swiftString(deepLink(config, s.route))})
    return .result()
  }
}`,
  ).join('\n\n');

  const shortcuts = SHORTCUTS.map((s) => {
    const phrases = s.iosPhrases
      .map((p) => swiftString(p).replace('${app}', '\\(.applicationName)'))
      .join(', ');
    return `    AppShortcut(
      intent: ${s.intentName}(),
      phrases: [${phrases}],
      shortTitle: ${swiftString(s.shortLabel)},
      systemImageName: ${swiftString(s.sfSymbol)}
    )`;
  }).join('\n');

  return `// Generated by plugins/withAppShortcuts.js. Do not edit: ios/ is regenerated.

import AppIntents
import UIKit

/// Delivers a deep link to THIS app's delegate, never to \`UIApplication.open\`: every Spoon build
/// shares the scheme, and iOS may hand a shared scheme to any of them.
@MainActor
private func openInThisApp(_ link: String) {
  guard let url = URL(string: link) else { return }
  let app = UIApplication.shared
  _ = app.delegate?.application?(app, open: url, options: [:])
}

${intents}

/// Spotlight's "Top Hit" buttons, and the app's entries in the Shortcuts app.
struct SpoonAppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
${shortcuts}
  }
}
`;
}

function withIosShortcutSource(config) {
  return withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const { platformProjectRoot, projectName } = modConfig.modRequest;
      fs.writeFileSync(
        path.join(platformProjectRoot, projectName, IOS_SWIFT_FILE),
        iosSwiftSource(modConfig),
      );
      return modConfig;
    },
  ]);
}

function withIosShortcutBuildFile(config) {
  return withXcodeProject(config, (modConfig) => {
    const { projectName } = modConfig.modRequest;
    const filepath = `${projectName}/${IOS_SWIFT_FILE}`;
    if (!modConfig.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath,
        groupName: projectName,
        project: modConfig.modResults,
      });
    }
    return modConfig;
  });
}

module.exports = function withAppShortcuts(config) {
  config = withAndroidShortcutFiles(config);
  config = withAndroidShortcutStrings(config);
  config = withAndroidShortcutMetaData(config);
  config = withIosShortcutSource(config);
  config = withIosShortcutBuildFile(config);
  return config;
};
