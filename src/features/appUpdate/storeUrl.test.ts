import { ANDROID_STORE_PACKAGE, storeUrlsFor } from './storeUrl';

describe('storeUrlsFor', () => {
  it('sends iOS to the App Store listing by id', () => {
    expect(storeUrlsFor({ platform: 'ios', iosAppStoreId: '123456' })).toEqual([
      'https://apps.apple.com/app/id123456',
    ]);
  });

  it('has no iOS link without an id, rather than a wrong one', () => {
    expect(storeUrlsFor({ platform: 'ios', iosAppStoreId: '' })).toEqual([]);
    expect(storeUrlsFor({ platform: 'ios', iosAppStoreId: undefined })).toEqual([]);
  });

  it('sends Android to the Play Store: the app first, the web page as the fallback', () => {
    expect(storeUrlsFor({ platform: 'android', iosAppStoreId: undefined })).toEqual([
      'market://details?id=com.spoonhelp.customer',
      'https://play.google.com/store/apps/details?id=com.spoonhelp.customer',
    ]);
  });

  it('never links one platform to the other store', () => {
    const ios = storeUrlsFor({ platform: 'ios', iosAppStoreId: '123456' }).join(' ');
    const android = storeUrlsFor({ platform: 'android', iosAppStoreId: '123456' }).join(' ');
    expect(ios).not.toMatch(/play\.google|market:/);
    expect(android).not.toMatch(/apple\.com/);
  });

  it('points Android at the production listing, which has no per-environment variant', () => {
    expect(ANDROID_STORE_PACKAGE).toBe('com.spoonhelp.customer');
  });
});
