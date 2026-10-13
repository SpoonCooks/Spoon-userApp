import * as Notifications from 'expo-notifications';

import { isNotificationsEnabled, readNotificationsEnabled } from './permission';

/** What the backend is told decides push vs SMS, so every OS state has a pinned answer. */
describe('isNotificationsEnabled', () => {
  const status = (fields: object) => fields as Notifications.NotificationPermissionsStatus;

  it('is true when granted', () => {
    expect(isNotificationsEnabled(status({ granted: true }))).toBe(true);
  });

  it.each([
    ['provisional', Notifications.IosAuthorizationStatus.PROVISIONAL],
    ['ephemeral', Notifications.IosAuthorizationStatus.EPHEMERAL],
  ])('treats iOS %s as enabled — it still delivers', (_name, iosStatus) => {
    expect(isNotificationsEnabled(status({ granted: false, ios: { status: iosStatus } }))).toBe(
      true,
    );
  });

  it.each([
    ['denied', Notifications.IosAuthorizationStatus.DENIED],
    ['undetermined', Notifications.IosAuthorizationStatus.NOT_DETERMINED],
  ])('treats iOS %s as disabled', (_name, iosStatus) => {
    expect(isNotificationsEnabled(status({ granted: false, ios: { status: iosStatus } }))).toBe(
      false,
    );
  });

  it('treats a plain denial as disabled', () => {
    expect(isNotificationsEnabled(status({ granted: false, canAskAgain: false }))).toBe(false);
  });

  it('reads without ever requesting, and a failed read counts as disabled', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockRejectedValueOnce(new Error('no module'));

    await expect(readNotificationsEnabled()).resolves.toBe(false);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
