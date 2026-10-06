import { useMutation, useQueryClient } from '@tanstack/react-query';
import { idempotency } from '@core/api';
import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { createRecurringApi } from './recurringApi';
import type {
  BookingPrepInput,
  CancelReasonInput,
  MandateVerifyInput,
  RecurringDraftInput,
  StartTimesInput,
} from './recurringApi';
import { recurringKeys } from './keys';
import type {
  BookingCancellationDto,
  BookingCancellationQuoteDto,
  BookingPrepDto,
  MandateCheckoutDto,
  MandateVerifyDto,
  RecurringBookingDto,
  RecurringCalendarDto,
  RecurringEligibilityDto,
  RecurringQuoteDto,
  RecurringStartTimesDto,
  VisitCancellationQuoteDto,
  VisitDetailDto,
} from './schemas';

/**
 * Recurring booking reads and writes — DEC-086.
 *
 * Same rules as the booking hooks: reads go through `useApiQuery`, writes are mutations whose
 * idempotency scope names the INTENT and is released once that intent is spent, and the cache is
 * invalidated rather than written optimistically — every write returns what the server now has,
 * and that is what the screens should show.
 *
 * The planning reads are short-lived (15s) for the same reason availability is: a start time with
 * room when the step opened can be gone a minute later. The save is the authority, and refuses a
 * taken visit with 409 `SLOT_UNAVAILABLE`. Cancellation quotes are short-lived too: the window
 * moves with the clock.
 */

const PLANNING_STALE_MS = 15_000;

export function useRecurringEligibility(
  options: { enabled?: boolean } = {},
): ScreenQuery<RecurringEligibilityDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringEligibilityDto>({
    queryKey: recurringKeys.eligibility(),
    queryFn: ({ signal }) => recurring.eligibility(signal),
    enabled: options.enabled !== false,
  });
}

export function useRecurringCalendar(
  options: { enabled?: boolean } = {},
): ScreenQuery<RecurringCalendarDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringCalendarDto>({
    queryKey: recurringKeys.calendar(),
    queryFn: ({ signal }) => recurring.calendar(signal),
    enabled: options.enabled !== false,
    staleTime: PLANNING_STALE_MS,
  });
}

/** Disabled until there is an address, at least one date and a chosen duration (`null`). */
export function useRecurringStartTimes(
  input: StartTimesInput | null,
): ScreenQuery<RecurringStartTimesDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringStartTimesDto>({
    queryKey: recurringKeys.startTimes(
      input ?? { addressId: 'none', dates: [], durationMinutes: 0 },
    ),
    queryFn: ({ signal }) => {
      if (input === null) throw new Error('useRecurringStartTimes ran without input');
      return recurring.startTimes(input, signal);
    },
    enabled: input !== null && input.dates.length > 0,
    staleTime: PLANNING_STALE_MS,
  });
}

/**
 * A POST read, like the booking quote: it holds nothing, so it is cached by the whole draft and
 * re-asked when the draft changes. `null` keeps it disabled until a complete draft exists.
 */
export function useRecurringQuote(
  draft: RecurringDraftInput | null,
): ScreenQuery<RecurringQuoteDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringQuoteDto>({
    queryKey: recurringKeys.quote(draft ?? { addressId: 'none', plans: [] }),
    queryFn: ({ signal }) => {
      if (draft === null) throw new Error('useRecurringQuote ran without a draft');
      return recurring.quote(draft, signal);
    },
    enabled: draft !== null,
    staleTime: PLANNING_STALE_MS,
  });
}

export function useRecurringBookings(
  options: { enabled?: boolean } = {},
): ScreenQuery<RecurringBookingDto[]> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringBookingDto[]>({
    queryKey: recurringKeys.bookings(),
    queryFn: ({ signal }) => recurring.list(signal),
    enabled: options.enabled !== false,
  });
}

export function useRecurringBooking(id: string | null): ScreenQuery<RecurringBookingDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringBookingDto>({
    queryKey: recurringKeys.booking(id ?? 'none'),
    queryFn: ({ signal }) => recurring.detail(id ?? '', signal),
    enabled: id !== null,
  });
}

export function useRecurringVisit(
  id: string | null,
  visitId: string | null,
): ScreenQuery<VisitDetailDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<VisitDetailDto>({
    queryKey: recurringKeys.visit(id ?? 'none', visitId ?? 'none'),
    queryFn: ({ signal }) => recurring.visit(id ?? '', visitId ?? '', signal),
    enabled: id !== null && visitId !== null,
  });
}

export function useRecurringVisitCancellationQuote(
  id: string | null,
  visitId: string | null,
): ScreenQuery<VisitCancellationQuoteDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<VisitCancellationQuoteDto>({
    queryKey: recurringKeys.visitCancellationQuote(id ?? 'none', visitId ?? 'none'),
    queryFn: ({ signal }) => recurring.visitCancellationQuote(id ?? '', visitId ?? '', signal),
    enabled: id !== null && visitId !== null,
    staleTime: PLANNING_STALE_MS,
  });
}

export function useRecurringBookingCancellationQuote(
  id: string | null,
): ScreenQuery<BookingCancellationQuoteDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<BookingCancellationQuoteDto>({
    queryKey: recurringKeys.cancellationQuote(id ?? 'none'),
    queryFn: ({ signal }) => recurring.cancellationQuote(id ?? '', signal),
    enabled: id !== null,
    staleTime: PLANNING_STALE_MS,
  });
}

export function useBookingPrep(bookingId: string | null): ScreenQuery<BookingPrepDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<BookingPrepDto>({
    queryKey: recurringKeys.prep(bookingId ?? 'none'),
    queryFn: ({ signal }) => recurring.prep(bookingId ?? '', signal),
    enabled: bookingId !== null,
  });
}

/** Invalidates the whole feature: a write changes bookings, visits, the calendar and the quotes. */
function useInvalidateRecurring(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: recurringKeys.all() });
  };
}

/** The scope names the DRAFT, so a retry after an ambiguous failure cannot save two bookings. */
export function useCreateRecurringBooking() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<RecurringBookingDto, Error, { input: RecurringDraftInput; scope: string }>({
    mutationFn: ({ input, scope }) => recurring.create(input, scope),
    onSuccess(_booking, variables) {
      idempotency.release(variables.scope);
      invalidate();
    },
  });
}

export function useCancelRecurringVisit() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<
    VisitDetailDto,
    Error,
    { id: string; visitId: string; reason: CancelReasonInput; scope: string }
  >({
    mutationFn: ({ id, visitId, reason, scope }) =>
      recurring.cancelVisit(id, visitId, reason, scope),
    onSuccess(_visit, variables) {
      idempotency.release(variables.scope);
      invalidate();
    },
  });
}

export function useCancelRecurringBooking() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<
    BookingCancellationDto,
    Error,
    { id: string; reason: CancelReasonInput; scope: string }
  >({
    mutationFn: ({ id, reason, scope }) => recurring.cancel(id, reason, scope),
    onSuccess(_result, variables) {
      idempotency.release(variables.scope);
      invalidate();
    },
  });
}

/**
 * Starting Autopay returns the checkout to open. The scope is released on every outcome: asking
 * again is answered with the same order by the backend.
 */
export function useStartRecurringMandate() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useMutation<MandateCheckoutDto, Error, { id: string; scope: string }>({
    mutationFn: ({ id, scope }) => recurring.startMandate(id, scope),
    onSettled(_result, _error, variables) {
      idempotency.release(variables.scope);
    },
  });
}

export function useVerifyRecurringMandate() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<MandateVerifyDto, Error, { id: string; result: MandateVerifyInput }>({
    mutationFn: ({ id, result }) => recurring.verifyMandate(id, result),
    onSettled: invalidate,
  });
}

export function useUpdateBookingPrep() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const queryClient = useQueryClient();
  return useMutation<BookingPrepDto, Error, { bookingId: string; input: BookingPrepInput }>({
    mutationFn: ({ bookingId, input }) => recurring.updatePrep(bookingId, input),
    onSuccess(prep) {
      void queryClient.invalidateQueries({ queryKey: recurringKeys.prep(prep.bookingId) });
    },
  });
}
