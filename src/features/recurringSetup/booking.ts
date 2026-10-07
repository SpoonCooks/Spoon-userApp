import { useCallback, useRef, useState } from 'react';

import { razorpayCheckoutLauncher } from '@features/payment';
import type { CheckoutLauncher } from '@features/payment';

import {
  useCreateRecurringBooking,
  useStartRecurringMandate,
  useVerifyRecurringMandate,
} from './api';
import type {
  MandateVerifyDto,
  RecurringBookingDto,
  RecurringDraftInput,
  RecurringQuoteDto,
} from './api';
import { clockTime, durationMinutes } from './data';
import type { RecurringPlanDraft } from './types';

/**
 * From the flow's plans to the backend's booking — DEC-086.
 *
 * `draftFromPlans` is the one translation between what the screens hold and what
 * `POST /v1/recurring/bookings` takes: Plans numbered in the order the flow shows them, each
 * Plan's 1st visit on all its days (no `dates`), a later visit on its own days, starts as
 * Asia/Kolkata `HH:MM`.
 *
 * `useBookRecurring` runs the step after the Summary: save (holds one pool Cook per visit, the
 * booking `pending_mandate`), then UPI Autopay — the mandate's checkout order, Razorpay's recurring
 * checkout, and the verify call. As with one-time payments, nothing here concludes the booking is
 * live: verify forwards Razorpay's untrusted result, and the booking is read back from the server.
 * UPI often answers `initiated` (the bank confirms by webhook), which is a normal outcome.
 *
 * NOT YET RENDERED: the Autopay screen (per-visit charge range, debit 3 hours before each visit, the
 * bank's notice about 27 hours before, the per-debit ceiling, cancelled visits never charged) has
 * no Figma design, so "Book Now" is not wired to this yet.
 */
export function draftFromPlans(
  addressId: string,
  plans: readonly RecurringPlanDraft[],
): RecurringDraftInput {
  return {
    addressId,
    plans: plans.map((plan, planIndex) => ({
      planNumber: planIndex + 1,
      dates: [...plan.dayIds].sort(),
      visits: plan.visits.map((visit, visitIndex) => ({
        visitNumber: visitIndex + 1,
        timeOfDay: visit.timeOfDay,
        durationMinutes: durationMinutes(visit.durationId),
        startTime: clockTime(visit.startMinutes),
        ...(visitIndex === 0 || visit.dayIds === undefined
          ? {}
          : { dates: [...visit.dayIds].sort() }),
      })),
    })),
  };
}

/**
 * The quote's unavailable visits, keyed `plan id#day id` in the flow's own ids — the dates the
 * customer has to pick another time for after a save was refused (409 `VISIT_UNAVAILABLE`).
 */
export function unavailableVisitKeys(
  plans: readonly RecurringPlanDraft[],
  quote: RecurringQuoteDto,
): ReadonlySet<string> {
  return new Set(
    quote.visits
      .filter((visit) => !visit.available)
      .flatMap((visit) => {
        const plan = plans[visit.planNumber - 1];
        return plan === undefined ? [] : [`${plan.id}#${visit.date}`];
      }),
  );
}

export type BookRecurringOutcome =
  | {
      readonly kind: 'approved';
      readonly booking: RecurringBookingDto;
      readonly mandate: MandateVerifyDto;
    }
  /** Checkout was closed. The booking is saved and waits for approval until it expires. */
  | { readonly kind: 'cancelled'; readonly booking: RecurringBookingDto };

/**
 * Approve UPI Autopay for a booking that is already saved: the mandate's checkout order, Razorpay's
 * recurring checkout, and the verify call. Used right after saving, and again from the live
 * booking for one still waiting on approval, or whose mandate was paused, revoked or expired.
 * Closing checkout is `cancelled`, never an error: the booking stays saved either way.
 */
export function useApproveRecurringMandate(launcher: CheckoutLauncher = razorpayCheckoutLauncher) {
  const startMandate = useStartRecurringMandate();
  const verify = useVerifyRecurringMandate();
  const [pending, setPending] = useState(false);

  const approve = useCallback(
    async (booking: RecurringBookingDto): Promise<BookRecurringOutcome> => {
      setPending(true);
      try {
        const checkout = await startMandate.mutateAsync({
          id: booking.recurringBookingId,
          scope: `recurring.mandate:${booking.recurringBookingId}`,
        });
        if (checkout.keyId === null) throw new Error('Autopay is not available right now.');
        let result;
        try {
          result = await launcher.open({
            keyId: checkout.keyId,
            providerOrderId: checkout.providerOrderId,
            amountPaise: checkout.amountPaise,
            currency: checkout.currency,
            description: 'Approve UPI Autopay for your Recurring booking',
            recurring: { providerCustomerId: checkout.providerCustomerId },
          });
        } catch (error) {
          if (error instanceof Error && error.name === 'CheckoutCancelledError') {
            return { kind: 'cancelled', booking };
          }
          throw error;
        }
        const mandate = await verify.mutateAsync({
          id: booking.recurringBookingId,
          result: {
            providerOrderId: checkout.providerOrderId,
            providerPaymentId: result.providerPaymentId,
            signature: result.signature,
          },
        });
        return { kind: 'approved', booking, mandate };
      } finally {
        setPending(false);
      }
    },
    [startMandate, verify, launcher],
  );

  return { approve, pending };
}

/**
 * Save, then approve UPI Autopay. A retry after a failure re-uses the same save (its scope names
 * the draft), so it can never hold Cooks twice; checkout can be reopened for the saved booking.
 */
export function useBookRecurring(launcher: CheckoutLauncher = razorpayCheckoutLauncher) {
  const create = useCreateRecurringBooking();
  const mandate = useApproveRecurringMandate(launcher);
  const [saving, setSaving] = useState(false);
  const saved = useRef<{ key: string; booking: RecurringBookingDto } | null>(null);

  const book = useCallback(
    async (draft: RecurringDraftInput): Promise<BookRecurringOutcome> => {
      setSaving(true);
      try {
        const key = JSON.stringify(draft);
        let booking = saved.current?.key === key ? saved.current.booking : null;
        if (booking === null) {
          booking = await create.mutateAsync({
            input: draft,
            scope: `recurring.booking.create:${key}`,
          });
          saved.current = { key, booking };
        }
        return await mandate.approve(booking);
      } finally {
        setSaving(false);
      }
    },
    [create, mandate],
  );

  return { book, pending: saving || mandate.pending };
}
