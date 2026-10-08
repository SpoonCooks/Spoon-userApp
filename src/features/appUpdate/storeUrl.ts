/**
 * Where the Update button goes.
 *
 * Android uses the `market://` scheme, which opens the Play Store app directly, with the web URL
 * as the fallback for a device that has no handler for it. iOS needs the numeric App Store id;
 * without one there is no correct link, so `null` is returned and the screen says so in words
 * rather than sending the customer somewhere that is not Spoon.
 */
export function storeUrlsFor(input: {
  readonly platform: 'ios' | 'android' | string;
  readonly androidPackage: string | undefined;
  readonly iosAppStoreId: string | undefined;
}): readonly string[] {
  if (input.platform === 'ios') {
    const id = input.iosAppStoreId?.trim() ?? '';
    return id === '' ? [] : [`https://apps.apple.com/app/id${id}`];
  }
  if (input.platform === 'android') {
    const pkg = input.androidPackage?.trim() ?? '';
    return pkg === ''
      ? []
      : [`market://details?id=${pkg}`, `https://play.google.com/store/apps/details?id=${pkg}`];
  }
  return [];
}
