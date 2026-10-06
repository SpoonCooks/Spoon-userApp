import { useMutation, useQueryClient } from '@tanstack/react-query';
import { idempotency } from '@core/api';
import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { createRecurringApi } from './recurringApi';
import type { MandateVerifyInput, PlanCreateInput, PlanDraftInput } from './recurringApi';
import { recurringKeys } from './keys';
import type {
  MandateCheckoutDto,
  MandateMethod,
  MandateVerifyDto,
  RecurringCalendarDto,
  RecurringEligibilityDto,
  RecurringPlanDto,
  RecurringPlanQuoteDto,
  RecurringStartTimesDto,
} from './schemas';

/**
 * Recurring Plan reads and writes.
 *
 * Same rules as the booking hooks: reads go through `useApiQuery`, writes are mutations whose
 * idempotency scope names the INTENT and is released once that intent is spent, and the cache is
 * invalidated rather than written optimistically — every write returns the plan as the server
 * now has it, and that is what the screens should show.
 *
 * The planning reads are short-lived (15s) for the same reason availability is: a start time with
 * room when the step opened can be gone a minute later. The save is the authority, and refuses a
 * taken visit with 409 `SLOT_UNAVAILABLE`.
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

/** Disabled until there is an address — the calendar is a question about a specific one. */
export function useRecurringCalendar(input: {
  addressId: string | null;
  enabled?: boolean;
}): ScreenQuery<RecurringCalendarDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const { addressId } = input;
  return useApiQuery<RecurringCalendarDto>({
    queryKey: recurringKeys.calendar({ addressId: addressId ?? 'none' }),
    queryFn: ({ signal }) => recurring.calendar(addressId ?? '', signal),
    enabled: addressId !== null && input.enabled !== false,
    staleTime: PLANNING_STALE_MS,
  });
}

/** Disabled until there is an address, at least one picked day, and a chosen duration. */
export function useRecurringStartTimes(input: {
  addressId: string | null;
  dates: readonly string[];
  durationMinutes: number | null;
  enabled?: boolean;
}): ScreenQuery<RecurringStartTimesDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const { addressId, dates, durationMinutes } = input;
  return useApiQuery<RecurringStartTimesDto>({
    queryKey: recurringKeys.startTimes({
      addressId: addressId ?? 'none',
      dates,
      durationMinutes: durationMinutes ?? 0,
    }),
    queryFn: ({ signal }) =>
      recurring.startTimes(
        { addressId: addressId ?? '', dates, durationMinutes: durationMinutes ?? 0 },
        signal,
      ),
    enabled:
      addressId !== null && dates.length > 0 && durationMinutes !== null && input.enabled !== false,
    staleTime: PLANNING_STALE_MS,
  });
}

/**
 * A POST read, like the booking quote: it holds nothing, so it is cached by the whole draft and
 * re-asked when the draft changes. `null` keeps it disabled until a complete draft exists.
 */
export function useRecurringQuote(
  draft: PlanDraftInput | null,
): ScreenQuery<RecurringPlanQuoteDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringPlanQuoteDto>({
    queryKey:
      draft === null
        ? recurringKeys.quote({ addressId: 'none', dates: [], visits: [] })
        : recurringKeys.quote(draft),
    queryFn: ({ signal }) => {
      if (draft === null) throw new Error('useRecurringQuote ran without a draft');
      return recurring.quote(draft, signal);
    },
    enabled: draft !== null,
    staleTime: PLANNING_STALE_MS,
  });
}

export function useRecurringPlans(
  options: { enabled?: boolean } = {},
): ScreenQuery<RecurringPlanDto[]> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringPlanDto[]>({
    queryKey: recurringKeys.plans(),
    queryFn: ({ signal }) => recurring.list(signal),
    enabled: options.enabled !== false,
  });
}

export function useRecurringPlan(planId: string | null): ScreenQuery<RecurringPlanDto> {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useApiQuery<RecurringPlanDto>({
    queryKey: recurringKeys.plan(planId ?? 'none'),
    queryFn: ({ signal }) => recurring.detail(planId ?? '', signal),
    enabled: planId !== null,
  });
}

/** Invalidates the whole feature: a write changes the plan, the calendar and the start times. */
function useInvalidateRecurring(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: recurringKeys.all() });
  };
}

/** The scope names the DRAFT, so a retry after an ambiguous failure cannot save two plans. */
export function useCreateRecurringPlan() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<RecurringPlanDto, Error, { input: PlanCreateInput; scope: string }>({
    mutationFn: ({ input, scope }) => recurring.create(input, scope),
    onSuccess(_plan, variables) {
      idempotency.release(variables.scope);
      invalidate();
    },
  });
}

export function useCancelRecurringPlan() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<RecurringPlanDto, Error, { planId: string; scope: string }>({
    mutationFn: ({ planId, scope }) => recurring.cancel(planId, scope),
    onSuccess(_plan, variables) {
      idempotency.release(variables.scope);
      invalidate();
    },
  });
}

export function useSetRecurringKeepGoing() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<RecurringPlanDto, Error, { planId: string; keepGoing: boolean }>({
    mutationFn: ({ planId, keepGoing }) => recurring.setKeepGoing(planId, keepGoing),
    onSuccess: invalidate,
  });
}

export function useCancelPlanVisit() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<RecurringPlanDto, Error, { planId: string; visitId: string; scope: string }>({
    mutationFn: ({ planId, visitId, scope }) => recurring.cancelVisit(planId, visitId, scope),
    onSuccess(_plan, variables) {
      idempotency.release(variables.scope);
      invalidate();
    },
  });
}

export function useReschedulePlanVisit() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<
    RecurringPlanDto,
    Error,
    { planId: string; visitId: string; date: string; startTime: string; scope: string }
  >({
    mutationFn: ({ planId, visitId, date, startTime, scope }) =>
      recurring.rescheduleVisit(planId, visitId, { date, startTime }, scope),
    onSuccess(_plan, variables) {
      idempotency.release(variables.scope);
      invalidate();
    },
  });
}

/**
 * Starting autopay returns the checkout to open. The scope is released on every outcome: asking
 * again with the same method is answered with the same order by the backend, and a different
 * method is a different body, which a reused key would refuse with `IDEMPOTENCY_CONFLICT`.
 */
export function useStartRecurringMandate() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  return useMutation<
    MandateCheckoutDto,
    Error,
    { planId: string; method: MandateMethod; scope: string }
  >({
    mutationFn: ({ planId, method, scope }) => recurring.startMandate(planId, method, scope),
    onSettled(_result, _error, variables) {
      idempotency.release(variables.scope);
    },
  });
}

export function useVerifyRecurringMandate() {
  const { api } = useRuntime();
  const recurring = createRecurringApi(api);
  const invalidate = useInvalidateRecurring();
  return useMutation<MandateVerifyDto, Error, { planId: string; result: MandateVerifyInput }>({
    mutationFn: ({ planId, result }) => recurring.verifyMandate(planId, result),
    onSettled: invalidate,
  });
}
