import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Messaging from '@react-native-firebase/messaging';

import { createExpoPushTokenProvider } from './expoPushProvider';
import type { PushTokenUnavailable } from './expoPushProvider';

/**
 * Push failing and push being switched off looked identical from the outside.
 *
 * The provider returns null for a declined prompt, a build with no Firebase config and a device
 * that cannot produce a token — correctly, because none of the three is the customer's problem.
 * What was missing was any way to tell them apart afterwards, which is what left "notifications
 * don't work" undiagnosable. These tests pin the REASON, not the null.
 */
/** The platform the provider branches on. Restored after each test so nothing leaks. */
function runningOn(os: 'ios' | 'android'): void {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
}

describe('createExpoPushTokenProvider — says why there is no token', () => {
  const notifications = jest.mocked(Notifications);
  const messaging = jest.mocked(Messaging);
  const originalOs = Platform.OS;

  afterEach(() => runningOn(originalOs as 'ios' | 'android'));

  const capture = async () => {
    const reasons: { reason: PushTokenUnavailable; error?: unknown }[] = [];
    const token = await createExpoPushTokenProvider((reason, error) => {
      reasons.push(error === undefined ? { reason } : { reason, error });
    }).getToken();
    return { token, reasons };
  };

  beforeEach(() => {
    runningOn('android');
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as never);
    notifications.getDevicePushTokenAsync.mockRejectedValue(new TypeError('no native module'));
    messaging.getToken.mockResolvedValue('fcm-ios-token');
    messaging.isDeviceRegisteredForRemoteMessages.mockReturnValue(true);
  });

  it('reports a declined prompt without asking again', async () => {
    const { token, reasons } = await capture();

    expect(token).toBeNull();
    expect(reasons).toEqual([{ reason: 'permission-denied' }]);
    // `canAskAgain: false` — re-prompting does nothing on both platforms.
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('reports a build that cannot produce a token, with the error name only', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);

    const { token, reasons } = await capture();

    expect(token).toBeNull();
    expect(reasons[0]?.reason).toBe('native-unavailable');
    expect(reasons[0]?.error).toBeInstanceOf(TypeError);
  });

  it('reports an empty token as its own cause, not as a failure', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    notifications.getDevicePushTokenAsync.mockResolvedValue({ type: 'android', data: '' } as never);

    const { token, reasons } = await capture();

    expect(token).toBeNull();
    expect(reasons).toEqual([{ reason: 'empty-token' }]);
  });

  it('reports nothing at all when a real token comes back', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    notifications.getDevicePushTokenAsync.mockResolvedValue({
      type: 'android',
      data: 'fcm-token-value',
    } as never);

    const { token, reasons } = await capture();

    expect(token).toBe('fcm-token-value');
    expect(reasons).toEqual([]);
  });

  /**
   * The whole reason iOS push had never worked.
   *
   * `getDevicePushTokenAsync` returns a raw APNs device token on iOS -- a different identifier for
   * a different service, which the backend's FCM-only send path cannot address. Tokens registered
   * successfully and every send failed. iOS therefore takes its token from Firebase, and Android
   * keeps the path that already works. Neither may silently become the other.
   */
  describe('the token source is the one the platform can actually deliver to', () => {
    beforeEach(() => {
      notifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
      notifications.getDevicePushTokenAsync.mockResolvedValue({
        type: 'android',
        data: 'android-device-token',
      } as never);
    });

    it('takes the iOS token from Firebase, never from expo-notifications', async () => {
      runningOn('ios');

      const { token } = await capture();

      expect(token).toBe('fcm-ios-token');
      expect(notifications.getDevicePushTokenAsync).not.toHaveBeenCalled();
    });

    it('registers the device with APNs first when Firebase has not yet done so', async () => {
      runningOn('ios');
      messaging.isDeviceRegisteredForRemoteMessages.mockReturnValue(false);

      await capture();

      expect(messaging.registerDeviceForRemoteMessages).toHaveBeenCalled();
    });

    it('does not re-register a device Firebase already registered', async () => {
      runningOn('ios');
      messaging.isDeviceRegisteredForRemoteMessages.mockReturnValue(true);

      await capture();

      expect(messaging.registerDeviceForRemoteMessages).not.toHaveBeenCalled();
    });

    it('leaves Android taking its token from expo-notifications', async () => {
      runningOn('android');

      const { token } = await capture();

      expect(token).toBe('android-device-token');
      expect(messaging.getToken).not.toHaveBeenCalled();
    });
  });
});
