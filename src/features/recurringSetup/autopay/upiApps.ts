import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

import { loadUpiAppsModule } from '@core/native/upiApps';

/**
 * The UPI apps the "Choose your UPI app" list offers (Figma 2316:3558, note 2317:13580: "UPI
 * apps installed on the device (intent query), last used first with a 'Last used' tag").
 *
 * ## How an app is found and opened
 *
 *   Android  the `SpoonUpiApps` module asks the package manager which apps answer `upi://`
 *            links, and opens the picked one with Razorpay's `upi://mandate?…` link UNMODIFIED,
 *            aimed at its package so no system chooser appears.
 *   iOS      apps cannot be listed, only asked about: `Linking.canOpenURL` on each known app's
 *            own scheme, which iOS answers only for schemes declared in `LSApplicationQueriesSchemes`
 *            (app.config.ts). The link is handed to the app by swapping `upi://` for that app's
 *            scheme, the way Razorpay's iOS intent guide does. NOT VERIFIED on a device: S2S
 *            payments are not enabled on Spoon's Razorpay account yet.
 *
 * ## When it cannot work
 *
 * `upiIntentSupported` is false on a build without the native module (Android) or without the
 * declared schemes (iOS): every store build made before this change. The flow then uses Razorpay's
 * Checkout, exactly as before, rather than showing an empty list.
 */
export interface UpiApp {
  /** The catalogue id for a known app; the package name for any other Android app. */
  readonly id: string;
  readonly name: string;
  /** Android only: the package the intent is aimed at. */
  readonly packageName: string | null;
}

interface KnownUpiApp {
  readonly id: string;
  readonly name: string;
  readonly androidPackage: string;
  /** The iOS scheme probed with `canOpenURL`, and what replaces `upi://` in the link. */
  readonly iosScheme: string | null;
  readonly iosLinkPrefix: string | null;
}

/** In the order the list shows them after the last used one (Figma: PhonePe, Google Pay, Paytm). */
export const KNOWN_UPI_APPS: readonly KnownUpiApp[] = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    androidPackage: 'com.phonepe.app',
    iosScheme: 'phonepe',
    iosLinkPrefix: 'phonepe://',
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    androidPackage: 'com.google.android.apps.nbu.paisa.user',
    iosScheme: 'tez',
    iosLinkPrefix: 'tez://upi/',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    androidPackage: 'net.one97.paytm',
    iosScheme: 'paytmmp',
    iosLinkPrefix: 'paytmmp://',
  },
  {
    id: 'cred',
    name: 'CRED',
    androidPackage: 'com.dreamplug.androidapp',
    iosScheme: 'credpay',
    iosLinkPrefix: 'credpay://',
  },
  {
    id: 'bhim',
    name: 'BHIM',
    androidPackage: 'in.org.npci.upiapp',
    iosScheme: 'bhim',
    iosLinkPrefix: 'bhim://',
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    androidPackage: 'in.amazon.mShop.android.shopping',
    iosScheme: null,
    iosLinkPrefix: null,
  },
];

/** The schemes app.config.ts declares; kept here so the two cannot drift (see the test). */
export const IOS_UPI_SCHEMES: readonly string[] = KNOWN_UPI_APPS.flatMap((app) =>
  app.iosScheme === null ? [] : [app.iosScheme],
);

/** How many apps show before "More UPI apps" (Figma 2316:3592 draws three). */
export const VISIBLE_UPI_APPS = 3;

/** Whether this build can list UPI apps and open one with an intent link. */
export function upiIntentSupported(): boolean {
  if (Platform.OS === 'android') return loadUpiAppsModule() !== null;
  if (Platform.OS === 'ios') {
    const declared = (
      Constants.expoConfig?.ios?.infoPlist as { LSApplicationQueriesSchemes?: unknown } | undefined
    )?.LSApplicationQueriesSchemes;
    return Array.isArray(declared) && declared.includes('phonepe');
  }
  return false;
}

/**
 * Known apps first in catalogue order, then any other Android UPI app by name; the last used one
 * (when still installed) moves to the top.
 */
export function sortUpiApps(apps: readonly UpiApp[], lastUsedId: string | null): UpiApp[] {
  const rank = (app: UpiApp) => {
    const known = KNOWN_UPI_APPS.findIndex((entry) => entry.id === app.id);
    return known === -1 ? KNOWN_UPI_APPS.length : known;
  };
  return [...apps].sort((a, b) => {
    if (a.id === lastUsedId) return -1;
    if (b.id === lastUsedId) return 1;
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
}

/** Android: the package manager's answer, mapped onto the catalogue's ids and names. */
export function fromNativeApps(
  native: readonly { packageName: string; label: string; supportsMandate: boolean }[],
): UpiApp[] {
  return native.map((app) => {
    const known = KNOWN_UPI_APPS.find((entry) => entry.androidPackage === app.packageName);
    return {
      id: known?.id ?? app.packageName,
      name: known?.name ?? app.label,
      packageName: app.packageName,
    };
  });
}

/** The installed UPI apps, unsorted. Empty when none (the "No UPI app found" state). */
export async function listInstalledUpiApps(): Promise<UpiApp[]> {
  if (Platform.OS === 'android') {
    const module = loadUpiAppsModule();
    if (module === null) return [];
    try {
      return fromNativeApps(module.listUpiApps());
    } catch {
      return [];
    }
  }
  if (Platform.OS === 'ios') {
    const found = await Promise.all(
      KNOWN_UPI_APPS.map(async (app) => {
        if (app.iosScheme === null) return null;
        try {
          return (await Linking.canOpenURL(`${app.iosScheme}://`)) ? app : null;
        } catch {
          return null;
        }
      }),
    );
    return found.flatMap((app) =>
      app === null ? [] : [{ id: app.id, name: app.name, packageName: null }],
    );
  }
  return [];
}

/** iOS: Razorpay's `upi://mandate?…` handed to one app by its own scheme. */
export function iosLinkFor(link: string, appId: string): string | null {
  const known = KNOWN_UPI_APPS.find((entry) => entry.id === appId);
  if (known?.iosLinkPrefix == null || !link.startsWith('upi://')) return null;
  return `${known.iosLinkPrefix}${link.slice('upi://'.length)}`;
}

/** Opens the picked app with the attempt's link. False when it could not be opened. */
export async function openUpiApp(link: string, app: UpiApp): Promise<boolean> {
  if (Platform.OS === 'android') {
    const module = loadUpiAppsModule();
    if (module === null || app.packageName === null) return false;
    try {
      return module.openUpiApp(link, app.packageName);
    } catch {
      return false;
    }
  }
  const url = iosLinkFor(link, app.id);
  if (url === null) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
