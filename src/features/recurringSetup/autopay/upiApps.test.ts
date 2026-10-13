import type { ConfigContext, ExpoConfig } from 'expo/config';

import { IOS_UPI_SCHEMES, fromNativeApps, iosLinkFor, sortUpiApps } from './upiApps';
import type { UpiApp } from './upiApps';

const app = (id: string, name: string): UpiApp => ({ id, name, packageName: null });

describe('UPI apps (Figma 2316:3592)', () => {
  it('lists known apps in the frame’s order, others by name, the last used first', () => {
    const apps = [
      app('com.example.zeta', 'Zeta UPI'),
      app('paytm', 'Paytm'),
      app('gpay', 'Google Pay'),
      app('com.example.alpha', 'Alpha Pay'),
      app('phonepe', 'PhonePe'),
    ];
    expect(sortUpiApps(apps, null).map((a) => a.id)).toEqual([
      'phonepe',
      'gpay',
      'paytm',
      'com.example.alpha',
      'com.example.zeta',
    ]);
    expect(sortUpiApps(apps, 'paytm').map((a) => a.id)).toEqual([
      'paytm',
      'phonepe',
      'gpay',
      'com.example.alpha',
      'com.example.zeta',
    ]);
  });

  it('maps Android packages onto the catalogue, keeping unknown apps by their label', () => {
    expect(
      fromNativeApps([
        { packageName: 'com.phonepe.app', label: 'PhonePe UPI', supportsMandate: true },
        { packageName: 'com.example.bank', label: 'My Bank', supportsMandate: false },
      ]),
    ).toEqual([
      { id: 'phonepe', name: 'PhonePe', packageName: 'com.phonepe.app' },
      { id: 'com.example.bank', name: 'My Bank', packageName: 'com.example.bank' },
    ]);
  });

  it('hands the link to an iOS app by its own scheme', () => {
    const link = 'upi://mandate?pa=x@razorpay&am=1.00';
    expect(iosLinkFor(link, 'phonepe')).toBe('phonepe://mandate?pa=x@razorpay&am=1.00');
    expect(iosLinkFor(link, 'gpay')).toBe('tez://upi/mandate?pa=x@razorpay&am=1.00');
    expect(iosLinkFor(link, 'amazonpay')).toBeNull();
    expect(iosLinkFor('https://evil.example', 'phonepe')).toBeNull();
  });

  it('declares exactly the schemes it probes in app.config.ts', () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appConfig = require('../../../../app.config') as {
      default: (context: ConfigContext) => ExpoConfig;
    };
    const config = appConfig.default({ config: {} } as unknown as ConfigContext);
    expect(config.ios?.infoPlist?.['LSApplicationQueriesSchemes']).toEqual(IOS_UPI_SCHEMES);
  });
});
