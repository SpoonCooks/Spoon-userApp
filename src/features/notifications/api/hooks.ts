import { useMutation } from '@tanstack/react-query';

import { useRuntime } from '@core/runtimeContext';

import { createPushApi, currentPushPlatform, unavailablePushTokenProvider } from './pushApi';
import type { PushTokenProvider } from './pushApi';

/**
 * Registers this device for push.
 *
 * Silently no-ops when there is no token — permission denied, no SDK installed, or an
 * unsupported platform. That is deliberate: push is an enhancement, and a customer who declines
 * it must still get a working app, not an error.
 */
export function useRegisterPushToken(provider: PushTokenProvider = unavailablePushTokenProvider) {
  const { api, logger } = useRuntime();
  const push = createPushApi(api);

  return useMutation<boolean, Error, { token?: string } | void>({
    async mutationFn(variables) {
      const platform = currentPushPlatform();
      if (platform === null) return false;

      /**
       * A token supplied by the caller is one FCM/APNs just rotated to.
       *
       * Registration is normally "ask the provider, then send", but a rotation arrives as a push
       * from the OS and the new value comes with it. Re-asking the provider would work and would
       * also race the rotation, so the supplied value wins where there is one.
       */
      const token = variables?.token ?? (await provider.getToken());
      if (token === null || token === undefined || token.length === 0) {
        logger.info('No push token available; registration skipped');
        return false;
      }

      await push.registerToken({ token, platform });
      return true;
    },
  });
}
