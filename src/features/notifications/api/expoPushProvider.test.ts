import * as Notifications from 'expo-notifications';

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
describe('createExpoPushTokenProvider — says why there is no token', () => {
  const notifications = jest.mocked(Notifications);

  const capture = async () => {
    const reasons: { reason: PushTokenUnavailable; error?: unknown }[] = [];
    const token = await createExpoPushTokenProvider((reason, error) => {
      reasons.push(error === undefined ? { reason } : { reason, error });
    }).getToken();
    return { token, reasons };
  };

  beforeEach(() => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as never);
    notifications.getDevicePushTokenAsync.mockRejectedValue(new TypeError('no native module'));
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
});
