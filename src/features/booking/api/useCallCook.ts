import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { useRuntime } from '@core/runtimeContext';
import { getUserMessage, isAppError } from '@core/errors';

import { createServiceApi } from './bookingApi';

/**
 * Call Cook — `GET /v1/bookings/:id/cook-contact`, then the device dialer.
 *
 * ## Why this is not a query
 *
 * The response carries a cook's PERSONAL phone number. V0 dials it directly — the owner decided
 * on 2026-08-18 that Spoon operates no masking layer, no in-app VoIP and no WhatsApp call — so
 * the number is fetched at the instant the customer presses Call and is never held anywhere it
 * could outlive that press. It is not put in the React Query cache, not written to state, and
 * not logged: `logCallFailure` below records the outcome and the request id, never the number.
 *
 * ## Who decides the button is offered
 *
 * `allowedActions.canCallCook` on the booking detail, which is the SERVER's answer. This hook
 * does not re-derive eligibility from status, from assignment or from the clock. The endpoint
 * enforces the same rule again, so a button that should not have been offered fails closed here
 * rather than leaking a number.
 *
 * ## Why a 404 is not "no such booking"
 *
 * The server answers `RESOURCE_NOT_FOUND` for every ineligible case — someone else's booking, an
 * unassigned cook, a completed or cancelled booking — and deliberately does not distinguish
 * them, because saying which gate failed would confirm the booking exists. The client must
 * therefore render it as "contact currently unavailable" and must NOT tell the customer their
 * booking is missing, which would be both alarming and, in the common case, false.
 */

/** What the caller renders. `null` while nothing has gone wrong. */
export interface CallCookState {
  readonly calling: boolean;
  readonly errorMessage: string | null;
}

/**
 * FIGMA_PENDING — no frame draws a Call Cook failure.
 *
 * The two cases are deliberately different sentences. An ineligible/absent contact is a state of
 * the world the customer can wait out; a transport failure is worth retrying now.
 */
const UNAVAILABLE_MESSAGE = 'Your cook’s contact isn’t available right now.';

export function useCallCook(bookingId: string | null) {
  const { api, logger } = useRuntime();
  const [state, setState] = useState<CallCookState>({ calling: false, errorMessage: null });

  const clearError = useCallback(() => {
    setState((previous) =>
      previous.errorMessage === null ? previous : { ...previous, errorMessage: null },
    );
  }, []);

  const call = useCallback(async () => {
    if (bookingId === null) return;

    setState({ calling: true, errorMessage: null });
    try {
      const cook = await createServiceApi(api).cookContact(bookingId);

      // `tel:` is the approved direct-dial route (§31). `openURL` hands off to the dialer with
      // the number PREFILLED and does not place the call, so the customer still confirms — which
      // is both the platform behaviour and the one we want.
      const url = `tel:${cook.phone.replace(/[^\d+]/g, '')}`;
      await Linking.openURL(url);
      setState({ calling: false, errorMessage: null });
    } catch (error) {
      // RESOURCE_NOT_FOUND is the server's single answer for every ineligible case, so it is
      // reported as unavailability rather than as a missing booking.
      const unavailable = isAppError(error) && error.code === 'RESOURCE_NOT_FOUND';

      logger.warn('booking.callCook.failed', {
        feature: 'booking',
        operation: 'cookContact',
        bookingId,
        // The code and request id are what makes a failure traceable. The number never is.
        code: isAppError(error) ? error.code : null,
        requestId: isAppError(error) ? error.requestId : null,
      });

      setState({
        calling: false,
        errorMessage: unavailable
          ? UNAVAILABLE_MESSAGE
          : isAppError(error)
            ? getUserMessage(error)
            : UNAVAILABLE_MESSAGE,
      });
    }
  }, [api, bookingId, logger]);

  return { ...state, call, clearError, unavailableMessage: UNAVAILABLE_MESSAGE } as const;
}
