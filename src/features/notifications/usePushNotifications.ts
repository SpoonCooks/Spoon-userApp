import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';

import { useSessionStore } from '@core/store';
import { useRuntime } from '@core/runtimeContext';
import { bookingKeys } from '@features/booking';

import { createExpoPushTokenProvider } from './api/expoPushProvider';
import { readNotificationsEnabled, useRegisterPushToken } from './api';
import type { PushRegistration, PushRegistrationOutcome } from './api';
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
 * A denied prompt, a build with no Firebase config and a device that cannot produce a token all
 * return null: registration is skipped, no token is fabricated and no error is shown. The REASON
 * is logged, because those three are identical to the customer and completely different to fix.
 *
 * ## Telling the server whether notifications are on
 *
 * Every registration carries `notificationsEnabled`, read (never requested) from the OS. A
 * customer who switches notifications off in Settings is still re-registered — with the token
 * this install last registered and `false` — because the backend otherwise keeps a token marked
 * enabled and sends a push nobody sees where it would have sent an SMS.
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
  /*
   * Memoised on `logger` alone: a provider rebuilt every render would be a new seam on each one,
   * and `useRegisterPushToken` treats it as the source of the token.
   */
  const provider = useMemo(
    () =>
      createExpoPushTokenProvider((reason, error) => {
        logger.warn('notifications.token.unavailable', {
          feature: 'notifications',
          operation: 'getToken',
          reason,
          ...(error instanceof Error ? { error: error.name } : {}),
        });
      }),
    [logger],
  );
  const register = useRegisterPushToken(provider);

  /**
   * What the backend was last told in this app session — token and flag — or null when nothing
   * has reached it yet (fresh launch, or a new sign-in).
   *
   * Only a registration that REACHED the backend sets it. This used to be a "done" flag that closed
   * after the first attempt, which quietly made a failure permanent: a customer who had not
   * granted the OS permission at sign-in produced no token, the attempt was recorded as done, and
   * turning notifications on in Settings afterwards changed nothing for the life of the install.
   *
   * It is also what keeps foregrounding quiet: a foreground re-sends only when the permission has
   * changed since the last successful send. A rotated token is caught by the listener below.
   */
  const lastSentRef = useRef<PushRegistration | null>(null);
  /** One attempt at a time. Foregrounding twice in a second must not send two registrations. */
  const inFlightRef = useRef(false);

  /** Records what reached the backend. `no-token` / `unsupported` leave the door open. */
  const remember = useCallback((outcome: PushRegistrationOutcome) => {
    if (outcome.kind === 'sent' || outcome.kind === 'unchanged') {
      lastSentRef.current = outcome.registration;
    }
  }, []);

  const attemptRegistration = useCallback(() => {
    if (status !== 'authenticated' || inFlightRef.current) return;
    inFlightRef.current = true;

    void (async () => {
      const previous = lastSentRef.current;
      // Already told the backend this session, and the permission has not moved: nothing to say.
      if (
        previous !== null &&
        (await readNotificationsEnabled()) === previous.notificationsEnabled
      ) {
        return;
      }

      const outcome = await register.mutateAsync({ previous });
      remember(outcome);
      if (outcome.kind !== 'unchanged') {
        // `registered: false` means no token was available — permission, config or platform.
        logger.info('notifications.register', {
          feature: 'notifications',
          registered: outcome.kind === 'sent',
          ...(outcome.kind === 'sent'
            ? { notificationsEnabled: outcome.registration.notificationsEnabled }
            : {}),
        });
      }
    })()
      .catch((error: unknown) => {
        // Push is an enhancement. A failed registration is logged and dropped, never surfaced.
        logger.warn('notifications.register.failed', {
          feature: 'notifications',
          operation: 'registerToken',
          error: error instanceof Error ? error.name : 'unknown',
        });
      })
      .finally(() => {
        inFlightRef.current = false;
      });
    // `register` is a new mutation object each render; depending on it would re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, logger, remember]);

  /**
   * Registration runs on sign-in, and again whenever the app comes back to the foreground — which
   * sends only if there is still no token on the backend, or the permission has changed since.
   *
   * Foreground is the moment that matters: granting OR revoking the permission means LEAVING the
   * app for Settings and coming back, so it is exactly when a previously impossible registration
   * becomes possible, or a registered token stops being shown. It does not re-prompt anybody — `getToken` asks the OS first and only raises a
   * dialog where `canAskAgain` is true, so a customer who declined is asked once, not on every
   * switch back.
   */
  useEffect(() => {
    if (status !== 'authenticated') {
      // A sign-out invalidates the association; the next sign-in registers again, which is what
      // moves the token to the new account on a shared handset.
      lastSentRef.current = null;
      return undefined;
    }

    attemptRegistration();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') attemptRegistration();
    });

    return () => subscription.remove();
  }, [status, attemptRegistration]);

  /**
   * FCM and APNs ROTATE a device token — on reinstall, on a data restore, and on their own
   * schedule. A rotation is not an error and produces no failure anywhere in the app; it simply
   * means the value the backend holds stops delivering, silently, forever.
   *
   * So the rotation is registered as it happens, with the current permission flag. It is skipped
   * only if the backend already holds exactly this token and flag; the OS is telling us rather
   * than us asking it — there is no permission prompt to re-raise.
   *
   * Gated on an authenticated session for the same reason the first registration is: a token has
   * to attach to an account, and `PUT /v1/me/push-token` is a bearer route.
   */
  useEffect(() => {
    if (status !== 'authenticated') return undefined;

    const rotated = Notifications.addPushTokenListener((token) => {
      if (typeof token.data !== 'string' || token.data.length === 0) return;
      register
        .mutateAsync({ token: token.data, previous: lastSentRef.current })
        .then(remember)
        .catch((error: unknown) => {
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
  }, [status, logger, remember]);

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
