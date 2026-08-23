import { createKeyFactory } from '@core/query';

/**
 * Booking cache keys.
 *
 * `all()` is what every lifecycle mutation invalidates: a cancel, a reschedule or an extension
 * changes the detail, the active list AND the history, and enumerating which ones is how a stale
 * Home card survives a cancellation.
 */
const factory = createKeyFactory('booking');

export const bookingKeys = {
  all: factory.all,
  detail: factory.detail,
  active: () => factory.collection('active'),
  history: () => factory.collection('history'),
  refunds: () => factory.collection('refunds'),
  bookingRefunds: (id: string) => factory.collection('bookingRefunds', { id }),
  cancellationPreview: (id: string) => factory.collection('cancellationPreview', { id }),
  rescheduleOptions: (id: string) => factory.collection('rescheduleOptions', { id }),
  extensionOptions: (id: string) => factory.collection('extensionOptions', { id }),
  tracking: (id: string) => factory.collection('tracking', { id }),
  /**
   * A quote is keyed by the whole request: change the address, the duration or the start and it
   * is a DIFFERENT quote, never a stale one reused because the ids happened to match.
   */
  quote: (input: {
    addressId: string;
    slotType: string;
    durationMinutes: number;
    scheduledStart?: string | null;
  }) => factory.collection('quote', { ...input, scheduledStart: input.scheduledStart ?? null }),
} as const;
