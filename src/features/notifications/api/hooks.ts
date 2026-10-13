import { useMutation } from '@tanstack/react-query';

import { readLastPushToken, writeLastPushToken } from '@core/auth';
import { useRuntime } from '@core/runtimeContext';

import { readNotificationsEnabled } from './permission';
import { createPushApi, currentPushPlatform, unavailablePushTokenProvider } from './pushApi';
import type { PushTokenProvider } from './pushApi';

/** What the backend was last told about this device: the token, and whether it shows pushes. */
export interface PushRegistration {
  token: string;
  notificationsEnabled: boolean;
}

export type PushRegistrationOutcome =
  /** `PUT /v1/me/push-token` was called and succeeded. */
  | { kind: 'sent'; registration: PushRegistration }
  /** The backend already holds exactly this; nothing was sent. */
  | { kind: 'unchanged'; registration: PushRegistration }
  /** No token now and none ever registered from this install — nothing on the server to correct. */
  | { kind: 'no-token' }
  /** Not Android or iOS. */
  | { kind: 'unsupported' };

export interface RegisterPushTokenVariables {
  /** A token FCM/APNs just rotated to (see below). */
  token?: string;
  /** What this app session last sent successfully, or null on a fresh launch / new sign-in. */
  previous?: PushRegistration | null;
}

/** Storage is a convenience here: a keychain that cannot be read is "no stored token". */
async function storedToken(): Promise<string | null> {
  try {
    return await readLastPushToken();
  } catch {
    return null;
  }
}

/**
 * Registers this device for push, with whether the phone shows notifications at all.
 *
 * Silently no-ops when there is no token to register — permission denied on a device that never
 * registered, no SDK installed, or an unsupported platform. That is deliberate: push is an
 * enhancement, and a customer who declines it must still get a working app, not an error.
 *
 * ## Where the token comes from
 *
 * - A rotated token supplied by the caller wins (below).
 * - Notifications ON: the provider, as always — falling back to the last registered token only if
 *   the provider produces none, so the server still learns the flag.
 * - Notifications OFF and a token was registered before (this session, or stored from an earlier
 *   launch): that token, re-sent with `notificationsEnabled: false`. The provider is NOT asked:
 *   it would return null anyway, and on a platform that still allows asking it would re-prompt a
 *   customer who has just switched notifications off.
 * - Notifications OFF and nothing ever registered: the provider, exactly as before — this is the
 *   first-registration path, and the provider's one prompt lives there.
 */
export function useRegisterPushToken(provider: PushTokenProvider = unavailablePushTokenProvider) {
  const { api, logger } = useRuntime();
  const push = createPushApi(api);

  return useMutation<PushRegistrationOutcome, Error, RegisterPushTokenVariables | void>({
    async mutationFn(variables) {
      const platform = currentPushPlatform();
      if (platform === null) return { kind: 'unsupported' };

      const previous = variables?.previous ?? null;
      let notificationsEnabled = await readNotificationsEnabled();
      const known = previous?.token ?? (await storedToken());

      /**
       * A token supplied by the caller is one FCM/APNs just rotated to.
       *
       * Registration is normally "ask the provider, then send", but a rotation arrives as a push
       * from the OS and the new value comes with it. Re-asking the provider would work and would
       * also race the rotation, so the supplied value wins where there is one.
       */
      let token: string | null = variables?.token ?? null;
      if (token === null && (notificationsEnabled || known === null)) {
        token = await provider.getToken();
        // The provider may just have shown the prompt; the flag is whatever the customer answered.
        notificationsEnabled = await readNotificationsEnabled();
      }
      if (token === null || token.length === 0) token = known;

      if (token === null || token.length === 0) {
        logger.info('No push token available; registration skipped');
        return { kind: 'no-token' };
      }

      const registration: PushRegistration = { token, notificationsEnabled };
      if (
        previous !== null &&
        previous.token === registration.token &&
        previous.notificationsEnabled === registration.notificationsEnabled
      ) {
        return { kind: 'unchanged', registration };
      }

      await push.registerToken({ token, platform, notificationsEnabled });

      if (token !== known) {
        // Kept for the next launch's "notifications were switched off while the app was closed".
        await writeLastPushToken(token).catch(() => undefined);
      }
      return { kind: 'sent', registration };
    },
  });
}
