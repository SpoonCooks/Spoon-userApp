import { storeUrlsFor } from './storeUrl';

describe('storeUrlsFor', () => {
  it('links iOS to the App Store listing by id', () => {
    expect(
      storeUrlsFor({ platform: 'ios', androidPackage: undefined, iosAppStoreId: '123456' }),
    ).toEqual(['https://apps.apple.com/app/id123456']);
  });

  it('has no iOS link without an id, rather than a wrong one', () => {
    expect(storeUrlsFor({ platform: 'ios', androidPackage: 'x', iosAppStoreId: '' })).toEqual([]);
  });

  it('tries the Play Store app first and the web page second on Android', () => {
    expect(
      storeUrlsFor({
        platform: 'android',
        androidPackage: 'com.spoonhelp.customer',
        iosAppStoreId: undefined,
      }),
    ).toEqual([
      'market://details?id=com.spoonhelp.customer',
      'https://play.google.com/store/apps/details?id=com.spoonhelp.customer',
    ]);
  });
});
