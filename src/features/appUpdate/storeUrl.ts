/**
 * Where the Update button goes.
 *
 * iOS opens the App Store listing; Android opens the Play Store listing. Both point at the
 * PRODUCTION listing whatever environment the build is: a staging or dev build has its own bundle
 * id / package name, which has no store page, so linking to it would send the tester nowhere.
 *
 * Android uses the `market://` scheme, which opens the Play Store app directly, with the web URL
 * as the fallback for a device that has no handler for it. iOS needs the numeric App Store id;
 * without one there is no correct link, so none is returned and the caller logs it rather than
 * sending the customer somewhere that is not Spoon.
 */

/** `applicationId` under `submit.android` in `eas.json` — the Play listing's identifier. */
export const ANDROID_STORE_PACKAGE = 'com.spoonhelp.customer';

export function storeUrlsFor(input: {
  readonly platform: 'ios' | 'android' | string;
  readonly iosAppStoreId: string | undefined;
}): readonly string[] {
  if (input.platform === 'ios') {
    const id = input.iosAppStoreId?.trim() ?? '';
    return id === '' ? [] : [`https://apps.apple.com/app/id${id}`];
  }
  if (input.platform === 'android') {
    return [
      `market://details?id=${ANDROID_STORE_PACKAGE}`,
      `https://play.google.com/store/apps/details?id=${ANDROID_STORE_PACKAGE}`,
    ];
  }
  return [];
}
