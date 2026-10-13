import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { recurringKeys, useRecurringEligibility, useRecurringMandateStatus } from '../api';
import type { MandateStatusViewDto } from '../api';

/** Home re-reads a confirming mandate this often; the push says it sooner. */
const HOME_POLL_MS = 15_000;

/** The bank has the approval and has not answered yet (Figma note 2317:13605). */
export function isConfirming(status: MandateStatusViewDto | undefined): boolean {
  if (status === undefined || status.bookingStatus !== 'pending_mandate') return false;
  return status.status === 'initiated' || status.attempt?.state === 'authorized';
}

/**
 * The Recurring booking whose Autopay the bank is still confirming, for Home's "Confirming
 * Autopay" banner (note 2317:13605: "Home shows a 'Confirming Autopay' banner until resolved").
 * Null otherwise. Polls only while confirming; once the bank answers, every Recurring read is
 * refreshed so Home's chip and the booking move on with it.
 */
export function useConfirmingAutopay(): { readonly recurringBookingId: string } | null {
  const eligibility = useRecurringEligibility();
  const pending =
    eligibility.state.status === 'ready'
      ? (eligibility.state.data.liveBookings.find((booking) => booking.status === 'pending_mandate')
          ?.recurringBookingId ?? null)
      : null;
  const status = useRecurringMandateStatus(pending, {
    poll: isConfirming,
    intervalMs: HOME_POLL_MS,
  });
  const latest = status.state.status === 'ready' ? status.state.data : undefined;
  const confirming = isConfirming(latest);
  const resolved =
    latest !== undefined &&
    (latest.status === 'confirmed' ||
      latest.status === 'rejected' ||
      latest.bookingStatus !== 'pending_mandate');

  const queryClient = useQueryClient();
  useEffect(() => {
    if (resolved) void queryClient.invalidateQueries({ queryKey: recurringKeys.eligibility() });
  }, [resolved, queryClient]);

  return confirming && pending !== null ? { recurringBookingId: pending } : null;
}
