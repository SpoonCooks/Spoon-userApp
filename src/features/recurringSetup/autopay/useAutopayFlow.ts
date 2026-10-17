import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { readLastUpiApp, writeLastUpiApp } from '@core/auth';
import { isAppError } from '@core/errors';
import { razorpayCheckoutLauncher } from '@features/payment';
import type { CheckoutLauncher } from '@features/payment';

import {
  recurringKeys,
  useCreateRecurringBooking,
  useRecurringMandateStatus,
  useStartRecurringMandate,
} from '../api';
import type { RecurringBookingDto, RecurringDraftInput } from '../api';
import { useApproveRecurringMandate } from '../booking';
import { INITIAL_AUTOPAY_STATE, autopayReducer, isPolling } from './machine';
import type { AutopayState } from './machine';
import { listInstalledUpiApps, openUpiApp, sortUpiApps } from './upiApps';
import type { UpiApp } from './upiApps';
import { useServerUpiIntent } from './useAutopayIntentEnabled';

/**
 * Runs the UPI Autopay sheet (Figma 2316:3558 … 2317:4009): finds the UPI apps, saves the booking,
 * starts a UPI Intent attempt for the picked app, opens it, and polls the server until it says
 * how the approval ended. The state itself is `autopayReducer`'s.
 *
 * Two ways in:
 *   draft    from the Summary's "Book Now". The booking is saved (one pool Cook held per visit,
 *            `pending_mandate`) on the first app tap, with the same draft-scoped idempotency as
 *            `useBookRecurring`, so a retry can never hold Cooks twice.
 *   booking  a booking already saved: waiting for its first approval, or live with a lapsed
 *            mandate (the re-approve path).
 *
 * ## Falling back to Checkout
 *
 * When the backend refuses an Intent attempt (`PROVIDER_TEMPORARILY_UNAVAILABLE`: UPI Intent
 * switched off, or Razorpay not taking S2S payments), the same booking is approved through
 * Razorpay's Checkout instead (`useApproveRecurringMandate`), on the same authorisation order. The
 * customer sees Checkout open rather than an error.
 */
export type AutopaySource =
  | { readonly kind: 'draft'; readonly draft: RecurringDraftInput }
  | { readonly kind: 'booking'; readonly booking: RecurringBookingDto };

export interface AutopayFlow {
  readonly state: AutopayState;
  readonly apps: readonly UpiApp[];
  readonly lastUsedId: string | null;
  readonly showAllApps: boolean;
  readonly now: number;
  /** The saved booking, once there is one. */
  readonly bookingId: string | null;
  readonly pick: (app: UpiApp) => void;
  readonly showMoreApps: () => void;
  readonly openAgain: () => void;
  readonly cancel: () => void;
  readonly tryAgain: () => void;
  readonly chooseAnother: () => void;
  readonly rescan: () => void;
}

const TICK_MS = 1_000;

interface FoundApps {
  readonly apps: readonly UpiApp[];
  readonly lastUsedId: string | null;
}

/** The installed apps, and the last used one if it is still installed. */
async function findApps(userId: string | null): Promise<FoundApps> {
  const [apps, last] = await Promise.all([
    listInstalledUpiApps(),
    userId === null ? Promise.resolve(null) : readLastUpiApp(userId),
  ]);
  return { apps, lastUsedId: apps.some((app) => app.id === last) ? last : null };
}

export function useAutopayFlow({
  open,
  source,
  userId,
  launcher = razorpayCheckoutLauncher,
  onBookingSaved,
}: {
  readonly open: boolean;
  readonly source: AutopaySource;
  readonly userId: string | null;
  readonly launcher?: CheckoutLauncher;
  /**
   * The draft was saved. The caller keeps it, so reopening the sheet for the same plans reuses
   * the booking (the save's idempotency scope is spent once it succeeded).
   */
  readonly onBookingSaved?: (booking: RecurringBookingDto) => void;
}): AutopayFlow {
  const [state, dispatch] = useReducer(autopayReducer, INITIAL_AUTOPAY_STATE);
  const [apps, setApps] = useState<readonly UpiApp[]>([]);
  const [lastUsedId, setLastUsedId] = useState<string | null>(null);
  const [showAllApps, setShowAllApps] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [booking, setBooking] = useState<RecurringBookingDto | null>(
    source.kind === 'booking' ? source.booking : null,
  );
  const saved = useRef<{ key: string; booking: RecurringBookingDto } | null>(null);

  const queryClient = useQueryClient();
  const create = useCreateRecurringBooking();
  const startMandate = useStartRecurringMandate();
  const checkout = useApproveRecurringMandate(launcher);
  /** Off: a picked app goes straight to Checkout, not to an Intent request the server refuses. */
  const serverIntent = useServerUpiIntent();
  const bookingId = booking?.recurringBookingId ?? null;
  const status = useRecurringMandateStatus(isPolling(state) ? bookingId : null, {
    poll: isPolling(state),
  });

  const applyApps = useCallback((found: FoundApps) => {
    setApps(sortUpiApps(found.apps, found.lastUsedId));
    setLastUsedId(found.lastUsedId);
    dispatch({ type: 'APPS_FOUND', count: found.apps.length });
  }, []);

  const scan = useCallback(() => {
    void findApps(userId).then(applyApps);
  }, [userId, applyApps]);

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    void findApps(userId).then((found) => {
      if (live) applyApps(found);
    });
    return () => {
      live = false;
    };
  }, [open, userId, applyApps]);

  const ensureBooking = useCallback(async (): Promise<RecurringBookingDto> => {
    if (source.kind === 'booking') return source.booking;
    const key = JSON.stringify(source.draft);
    if (saved.current?.key === key) return saved.current.booking;
    const created = await create.mutateAsync({
      input: source.draft,
      scope: `recurring.booking.create:${key}`,
    });
    saved.current = { key, booking: created };
    onBookingSaved?.(created);
    return created;
  }, [source, create, onBookingSaved]);

  const viaCheckout = useCallback(
    async (target: RecurringBookingDto) => {
      try {
        const outcome = await checkout.approve(target);
        if (outcome.kind === 'cancelled') {
          dispatch({ type: 'CHECKOUT_CLOSED' });
          return;
        }
        dispatch({
          type: 'CHECKOUT_DONE',
          confirmed:
            outcome.mandate.status === 'confirmed' || outcome.mandate.bookingStatus === 'active',
          handleMasked: outcome.mandate.handleMasked,
        });
      } catch {
        dispatch({ type: 'START_FAILED', notice: 'error' });
      }
    },
    [checkout],
  );

  const pick = useCallback(
    (app: UpiApp) => {
      dispatch({ type: 'PICK', app });
      void (async () => {
        let target: RecurringBookingDto;
        try {
          target = await ensureBooking();
          setBooking(target);
        } catch (error) {
          dispatch({
            type: 'START_FAILED',
            notice: isAppError(error) && error.code === 'SLOT_UNAVAILABLE' ? 'slotTaken' : 'error',
          });
          return;
        }
        if (!serverIntent) {
          await viaCheckout(target);
          return;
        }
        try {
          const attempt = await startMandate.mutateAsync({
            id: target.recurringBookingId,
            scope: `recurring.mandate.intent:${target.recurringBookingId}`,
            flow: 'intent',
          });
          if (attempt.intentLink === undefined || attempt.attemptExpiresAt === undefined) {
            await viaCheckout(target);
            return;
          }
          // A cached read about an earlier attempt must not decide this one.
          queryClient.removeQueries({
            queryKey: recurringKeys.mandateStatus(target.recurringBookingId),
          });
          const opened = await openUpiApp(attempt.intentLink, app);
          setNow(Date.now());
          dispatch(
            opened
              ? {
                  type: 'OPENED',
                  link: attempt.intentLink,
                  expiresAt: Date.parse(attempt.attemptExpiresAt),
                  now: Date.now(),
                }
              : { type: 'OPEN_FAILED' },
          );
        } catch (error) {
          if (isAppError(error) && error.code === 'PROVIDER_TEMPORARILY_UNAVAILABLE') {
            await viaCheckout(target);
            return;
          }
          dispatch({ type: 'START_FAILED', notice: 'error' });
        }
      })();
    },
    [ensureBooking, startMandate, viaCheckout, queryClient, serverIntent],
  );

  // The server's word, as it arrives.
  const statusData = status.state.status === 'ready' ? status.state.data : null;
  useEffect(() => {
    if (statusData !== null) dispatch({ type: 'STATUS', status: statusData, now: Date.now() });
  }, [statusData]);

  // Back from the UPI app: ask at once rather than at the next 3s tick.
  const { refetch } = status;
  const polling = isPolling(state);
  useEffect(() => {
    if (!polling) return undefined;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') refetch();
    });
    return () => subscription.remove();
  }, [polling, refetch]);

  // The expiry chip's clock, and the waiting → left / confirming timeouts.
  const waiting = state.kind === 'waiting';
  useEffect(() => {
    if (!waiting) return undefined;
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      dispatch({ type: 'TICK', now: at });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [waiting]);

  // Remember the app once Autopay is on ("Last used"), and refresh every Recurring read.
  const activeAppId = state.kind === 'active' ? (state.app?.id ?? null) : null;
  const active = state.kind === 'active';
  useEffect(() => {
    if (!active) return;
    if (activeAppId !== null && userId !== null) void writeLastUpiApp(userId, activeAppId);
    void queryClient.invalidateQueries({ queryKey: recurringKeys.all() });
  }, [active, activeAppId, userId, queryClient]);

  // No UPI app yet: look again when the customer comes back (they may have installed one).
  const noApp = state.kind === 'noApp';
  useEffect(() => {
    if (!noApp) return undefined;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') scan();
    });
    return () => subscription.remove();
  }, [noApp, scan]);

  return {
    state,
    apps,
    lastUsedId,
    showAllApps,
    now,
    bookingId,
    pick,
    showMoreApps: () => setShowAllApps(true),
    openAgain: () => {
      if (state.kind === 'waiting') void openUpiApp(state.link, state.app);
    },
    cancel: () => dispatch({ type: 'CANCEL' }),
    tryAgain: () => {
      if ((state.kind === 'left' || state.kind === 'failed') && state.app !== null) {
        pick(state.app);
      } else {
        dispatch({ type: 'CHOOSE_ANOTHER' });
      }
    },
    chooseAnother: () => dispatch({ type: 'CHOOSE_ANOTHER' }),
    rescan: scan,
  };
}
