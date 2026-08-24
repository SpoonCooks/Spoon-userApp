import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import type { ApiClient } from '@core/api';
import { createLogger, noopSink } from '@core/logging';
import type { AppRuntime } from '@core/runtime';
import { RuntimeProvider } from '@core/runtimeContext';

/**
 * Test harness for anything that reaches the composition root.
 *
 * Every route is now a thin wrapper over query/mutation hooks, so mounting one requires both a
 * `QueryClientProvider` and a `RuntimeProvider`. Doing that inline in each test would put the
 * same six lines in a dozen files and make the API client hard to stub, so it lives here.
 *
 * ## Defaults fail loudly
 *
 * The stub API client REJECTS every request unless the test supplies a handler. A test that
 * accidentally depends on a real endpoint therefore fails with "no stub for GET /v1/me" rather
 * than hanging, timing out, or — worst — quietly passing against `undefined`.
 *
 * Retries are off and there is no cache between tests: a retrying query turns one deliberate
 * failure into three and makes assertions about call counts meaningless.
 */

export interface StubHandlers {
  /** Keyed by `"<METHOD> <path>"`, e.g. `"GET /v1/me"`. Values may throw to simulate failure. */
  readonly [route: string]: (body: unknown) => unknown;
}

export function createStubApi(handlers: StubHandlers = {}): ApiClient {
  return {
    async request(path, options) {
      const method = options.method ?? 'GET';
      const key = `${method} ${path}`;
      // Query-string reads (availability) are stubbed by PATH: a test asserting on slots should
      // not have to reproduce the exact parameter order the api module happens to emit.
      const handler = handlers[key] ?? handlers[`${method} ${path.split('?')[0]}`];
      if (handler === undefined) {
        throw new Error(`No stub for ${key}`);
      }
      // The stub stands in for the transport, which has ALREADY unwrapped the `{ data }`
      // envelope — so a handler returns the payload, exactly as a real parser would receive it.
      return options.parse(handler(options.body));
    },
  };
}

export function createTestRuntime(overrides: Partial<AppRuntime> = {}): AppRuntime {
  const api = overrides.api ?? createStubApi();
  return {
    config: {
      appEnv: 'development',
      apiBaseUrl: 'https://api.test.invalid',
      apiTimeoutMs: 1000,
      logLevel: 'silent',
    },
    logger: createLogger({ level: 'silent', sink: noopSink }),
    queryClient: new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    }),
    api,
    authApi: overrides.authApi ?? api,
    session: {
      getAccessToken: async () => 'test-token',
      refreshAccessToken: async () => 'test-token',
      onSessionExpired: () => undefined,
      bootstrap: async () => undefined,
      signIn: async () => undefined,
      signOut: async () => undefined,
    },
    ...overrides,
  };
}

export function renderWithRuntime(
  ui: ReactElement,
  options: { runtime?: AppRuntime } & Omit<RenderOptions, 'wrapper'> = {},
) {
  const runtime = options.runtime ?? createTestRuntime();
  const queryClient = runtime.queryClient;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <RuntimeProvider runtime={runtime}>{children}</RuntimeProvider>
      </QueryClientProvider>
    );
  }

  return { runtime, queryClient, ...render(ui, { wrapper: Wrapper }) };
}

/**
 * The reads the wired screens perform on mount, with realistic payloads.
 *
 * Values are transcribed from a live backend response (2026-08-18), so a test that renders a
 * price is rendering the real contract's shape and not a shape invented for the test. Anything a
 * screen asks for that is NOT listed here still fails loudly through `createStubApi`.
 */
export const DEFAULT_API_STUBS: StubHandlers = {
  'GET /v1/catalogue': () => ({
    currency: 'INR',
    taxRateBps: 500,
    pricingVersion: 'pricing-policy-v0',
    bookingPolicyVersion: 'booking-policy-v0',
    durations: [
      {
        durationMinutes: 30,
        serviceAmountPaise: 6900,
        taxAmountPaise: 345,
        totalAmountPaise: 7245,
        latestStartLocalMinute: 1290,
      },
      {
        durationMinutes: 60,
        serviceAmountPaise: 12900,
        taxAmountPaise: 645,
        totalAmountPaise: 13545,
        latestStartLocalMinute: 1260,
      },
    ],
    operatingWindow: { timeZone: 'Asia/Kolkata', openLocalMinute: 300, closeLocalMinute: 1320 },
    scheduled: {
      horizonDays: 3,
      slotIntervalMinutes: 15,
      periods: [
        { id: 'MORNING', startMinute: 300, endMinute: 720 },
        { id: 'NOON', startMinute: 720, endMinute: 960 },
        { id: 'EVENING', startMinute: 960, endMinute: 1320 },
      ],
    },
    instant: { arrivalPromiseMinutes: 30 },
    extension: {
      currency: 'INR',
      pricingVersion: 'extension-pricing-owner-skus-v1',
      taxRateBps: 500,
      options: [
        { minutes: 10, pricePaise: 1500, taxAmountPaise: 75, totalAmountPaise: 1575 },
        { minutes: 20, pricePaise: 3500, taxAmountPaise: 175, totalAmountPaise: 3675 },
      ],
    },
    cancellation: {
      policyVersion: 'cancellation-policy-v0',
      refundBasis: 'service_amount',
      bands: [
        { band: 'SCHEDULED_FULL_REFUND', minMinutesToStart: 180, refundPercent: 100 },
        { band: 'SCHEDULED_NO_REFUND', maxMinutesToStart: 60, refundPercent: 0 },
      ],
      reasons: [
        { code: 'URGENT_CHANGE', label: 'Something urgent came up', requiresDetail: false },
        { code: 'OTHER', label: 'Others', requiresDetail: true },
      ],
      reasonCatalogueVersion: 'cancellation-reasons-v1',
    },
    tips: { suggestedAmountsPaise: [2000, 5000, 10000, 15000], currency: 'INR' },
    mealBrief: { minGuests: 1, maxGuests: 12, dietPreferences: ['veg', 'non_veg'] },
    support: {},
  }),
  /**
   * The Schedule and Reschedule screens BOTH read this on mount, for today and the first published
   * duration, before the customer touches anything.
   *
   * It was missing, and used to go unnoticed: the data seam turned a failed availability read into
   * a successful screen with an empty Start time grid, so "no stub for GET /v1/availability/
   * scheduled" rendered as a perfectly normal screen. It now surfaces as the designed error state,
   * which is what made the omission visible.
   *
   * The payload is deliberately MIXED — 05:00 is offered, 05:15 is not — so the default harness
   * renders both the live and the grey card, exactly as an ordinary day does.
   */
  'GET /v1/availability/scheduled': () => ({
    date: '2026-08-18',
    durationMinutes: 30,
    slots: [
      // 05:00 / 05:15 IST (MORNING), 12:00 IST (NOON), 18:00 IST (EVENING).
      { start: '2026-08-17T23:30:00.000Z', available: true, reason: 'AVAILABLE' },
      { start: '2026-08-17T23:45:00.000Z', available: false, reason: 'NO_PRESENT_COOK' },
      { start: '2026-08-18T06:30:00.000Z', available: true, reason: 'AVAILABLE' },
      { start: '2026-08-18T12:30:00.000Z', available: false, reason: 'NO_SHIFT_COVERAGE' },
    ],
    validUntil: '2026-08-18T09:00:30.000Z',
  }),
  'GET /v1/me': () => ({
    id: 'user-1',
    role: 'user',
    status: 'active',
    phone: '+919876543210',
    name: 'Aarav Mehta',
    // The seven questionnaire answers are REQUIRED by the contract and by `meResponseSchema`:
    // a stub that omits them fails to parse, which is a screen-wide error state rather than a
    // missing chip. Null is the honest default — an account that has answered nothing.
    householdStructure: null,
    mealStructure: null,
    pressingIssue: null,
    dietaryPreference: null,
    grownUpEating: null,
    regionPreference: null,
    genderPreference: null,
    profileComplete: true,
  }),
  'GET /v1/me/addresses': () => [
    {
      id: 'addr-1',
      label: 'Home',
      flat: 'E102',
      tower: null,
      society: 'Purva Skydale',
      street: 'Silver County Road',
      pincode: '560102',
      city: 'Bengaluru',
      state: 'Karnataka',
      hub_id: 'hub-1',
      receiverName: null,
      receiverPhone: null,
      isDefault: true,
      latitude: 12.902746,
      longitude: 77.648817,
      serviceability: {
        status: 'serviceable',
        reason: 'AVAILABLE',
        hub: { id: 'hub-1', name: 'Bengaluru Hub' },
      },
    },
  ],
};

/**
 * `renderWithRuntime` with the default stubs already wired.
 *
 * Most component tests only need the providers to exist and the mounting reads to resolve — they
 * are asserting layout and copy, not transport. This is that case, in one call.
 */
export function renderWithDefaultRuntime(
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> = {},
) {
  return renderWithRuntime(ui, {
    ...options,
    runtime: createTestRuntime({ api: createStubApi(DEFAULT_API_STUBS) }),
  });
}
