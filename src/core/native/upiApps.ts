import { requireOptionalNativeModule } from 'expo';

/**
 * The local `SpoonUpiApps` module (`modules/spoon-upi-apps`, Android only): which UPI apps are
 * installed, and opening one of them with a UPI Intent link aimed at its package.
 *
 * Looked up without importing anything, like `optionalNative.ts`: a build made before the module
 * existed (every store build up to now) has no such native module, and the caller then falls back
 * to Razorpay's Checkout rather than failing. iOS has no module: it asks `Linking.canOpenURL`
 * about each app's scheme instead (see `features/recurringSetup/autopay/upiApps.ts`).
 */
export interface NativeUpiApp {
  readonly packageName: string;
  readonly label: string;
  /** True when the app answers `upi://mandate`, not only `upi://pay`. */
  readonly supportsMandate: boolean;
}

interface SpoonUpiAppsModule {
  listUpiApps(): NativeUpiApp[];
  openUpiApp(url: string, packageName: string): boolean;
}

let loaded: SpoonUpiAppsModule | null | undefined;

export function loadUpiAppsModule(): SpoonUpiAppsModule | null {
  if (loaded === undefined) {
    loaded = requireOptionalNativeModule<SpoonUpiAppsModule>('SpoonUpiApps');
  }
  return loaded;
}
