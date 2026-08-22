import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useSessionStore } from '@core/store';
import { useRuntime } from '@core/runtimeContext';
import { bookingKeys } from '@features/booking';

import { expoPushTokenProvider } from './api/expoPushProvider';
import { useRegisterPushToken } from './api';
import { routeForNotification } from './deepLink';

/**
 * Push, end to end on the client: register, receive, tap, route.
 *
 * ## When permission is asked for
 *
 * After sign-in, and not before. §45 wants an appropriate product moment, and the honest one is
 * "you now have bookings we can tell you about" — asking on the splash, before the customer knows
 * what the app is, is the reliable way to get a permanent refusal. A customer who declines still
 * gets a fully working app; nothing here blocks or retries at them.
 *
 * ## What a received notification is allowed to do
 *
 * Nothing to the app's state. The payload carries `{ bookingId, eventType }` and no booking
 * fields, deliberately, so a push can never move a screen into a state the server has not
 * confirmed. What a tap does is NAVIGATE; what the destination screen does is READ. The one
 * exception is a cache invalidation on receipt, which asks the server again rather than
 * asserting anything — that is the whole difference between a hint and a source of truth.
 *
 * ## Fails closed
 *
 * With no `google-services.json` (CONFIGURATION_GAP) the provider returns null, registration is
 * skipped, and the listeners simply never fire. No token is fabricated and no error is shown.
 */

/**
 * Show notifications while the app is in the FOREGROUND too.
 *
 * Without this, Android silently drops a notification that arrives while the customer is looking
 * at the app — which is exactly when "your cook has arrived" matters most.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications(): void {
  const router = useRouter();
  const { logger, queryClient } = useRuntime();
  const status = useSessionStore((state) => state.status);
  const register = useRegisterPushToken(expoPushTokenProvider);

  // Registration is attempted once per authenticated session, not once per render and not on
  // every focus: the token is stable, and re-asking the OS on a loop is how a permission prompt
  // turns into a nuisance.
  const registeredRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      // A sign-out invalidates the association; the next sign-in registers again, which is what
      // moves the token to the new account on a shared handset.
      registeredRef.current = false;
      return;
    }
    if (registeredRef.current) return;
    registeredRef.current = true;

    register
      .mutateAsync(undefined)
      .then((registered) => {
        logger.info('notifications.register', { feature: 'notifications', registered });
      })
      .catch((error: unknown) => {
        // Push is an enhancement. A failed registration is logged and dropped, never surfaced.
        logger.warn('notifications.register.failed', {
          feature: 'notifications',
          operation: 'registerToken',
          error: error instanceof Error ? error.name : 'unknown',
        });
      });
    // `register` is a new mutation object each render; depending on it would re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, logger]);

  /**
   * FCM and APNs ROTATE a device token — on reinstall, on a data restore, and on their own
   * schedule. A rotation is not an error and produces no failure anywhere in the app; it simply
   * means the value the backend holds stops delivering, silently, forever.
   *
   * So the rotation is registered as it happens. `registeredRef` is deliberately not consulted:
   * this is a NEW token, not a repeat of the one already sent, and the OS is telling us rather
   * than us asking it — there is no permission prompt to re-raise.
   *
   * Gated on an authenticated session for the same reason the first registration is: a token has
   * to attach to an account, and `PUT /v1/me/push-token` is a bearer route.
   */
  useEffect(() => {
    if (status !== 'authenticated') return undefined;

    const rotated = Notifications.addPushTokenListener((token) => {
      if (typeof token.data !== 'string' || token.data.length === 0) return;
      register.mutateAsync({ token: token.data }).catch((error: unknown) => {
        logger.warn('notifications.register.rotated.failed', {
          feature: 'notifications',
          operation: 'registerToken',
          error: error instanceof Error ? error.name : 'unknown',
        });
      });
    });

    return () => rotated.remove();
    // `register` is a new mutation object each render; depending on it would re-subscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, logger]);

  // A notification that ARRIVES refreshes the booking reads rather than applying its contents.
  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => {
      // The feature's own key factory, not an inline array (§6): the blast radius of a push has
      // to be the same thing every booking mutation invalidates, or a notification refreshes a
      // cache entry the rest of the app has already moved on from.
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
    });

    const tapped = Notifications.addNotificationResponseReceivedListener((response) => {
      const path = routeForNotification(response.notification.request.content.data);
      // An unknown event, or one with no booking id, resolves to Home — never to a route built
      // from an unvalidated payload, and never to a crash.
      router.push(path as never);
    });

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [router, queryClient]);
}
