import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  DEFAULT_API_STUBS,
  createStubApi,
  createTestRuntime,
  renderWithRuntime,
} from '@/test/renderWithRuntime';
import RecurringVisitRoute from '@/app/(app)/recurring/[bookingId]/visits/[visitId]';

/**
 * The Visit details route on a real visit: what it draws comes from the backend, and cancelling
 * goes Modify booking → reason → confirm → `POST …/visits/{visitId}/cancel`.
 *
 * Reanimated and worklets are native runtimes with no headless implementation; the route loads the
 * Cook Pool module, so they run against their own jest mocks, as the Cook Pool's own tests do.
 */
jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/lib/module/mock'),
);
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
    dismissTo: jest.fn(),
  }),
  useLocalSearchParams: () => ({ bookingId: 'rb-1', visitId: 'visit-1' }),
  useFocusEffect: () => undefined,
}));

const PRICE = {
  basePricePaise: 33814,
  pricePaise: 25339,
  gstPaise: 4561,
  totalPaise: 29900,
  pricingVersion: 'v1',
};

const VISIT = {
  visitId: 'visit-1',
  recurringBookingId: 'rb-1',
  planNumber: 1,
  visitNumber: 1,
  date: '2026-10-14',
  timeOfDay: 'morning',
  startTime: '09:00',
  start: '2026-10-14T03:30:00.000Z',
  durationMinutes: 60,
  status: 'scheduled',
  displayState: 'cook_pending',
  cookConfirmBy: '2026-10-14T00:30:00.000Z',
  cook: null,
  bookingId: null,
  totalPaise: 29900,
  cancelledBy: null,
  price: PRICE,
  payment: null,
  cancellation: null,
  mandate: null,
  prep: null,
  support: { whatsappUrl: null },
};

const BOOKING = {
  recurringBookingId: 'rb-1',
  status: 'active',
  addressId: 'addr-1',
  window: { startDate: '2026-10-10', endDate: '2026-10-30' },
  policyVersion: 'recurring-v2-spec-1',
  mandate: null,
  banner: null,
  counts: { done: 0, cancelled: 0, toGo: 5 },
  plans: [],
  days: [],
  upNext: null,
  chargeRange: { minPaise: 29900, maxPaise: 29900 },
  support: { whatsappUrl: null },
  createdAt: '2026-10-07T06:00:00.000Z',
  cancelledAt: null,
  cancelledBy: null,
};

const QUOTE = {
  visitId: 'visit-1',
  cancellable: true,
  window: 1,
  feePercent: 0,
  feePaise: 0,
  refundPaise: 0,
  chargedPaise: 0,
  nothingCharged: true,
};

function render(onCancel = jest.fn()) {
  renderWithRuntime(<RecurringVisitRoute />, {
    runtime: createTestRuntime({
      api: createStubApi({
        ...DEFAULT_API_STUBS,
        'GET /v1/me/recurring-bookings/rb-1/visits/visit-1': () => VISIT,
        'GET /v1/me/recurring-bookings/rb-1': () => BOOKING,
        'GET /v1/me/recurring-bookings/rb-1/visits/visit-1/cancellation-quote': () => QUOTE,
        'GET /v1/me/cooks': () => ({ cooks: [], count: 0 }),
        'POST /v1/me/recurring-bookings/rb-1/visits/visit-1/cancel': (body) => {
          onCancel(body);
          return {
            ...VISIT,
            status: 'cancelled',
            displayState: 'cancelled',
            cancelledBy: 'customer',
          };
        },
      }),
    }),
  });
  return onCancel;
}

describe('Recurring Visit details route', () => {
  beforeEach(() => mockPush.mockClear());

  it('draws the visit from the backend, not the Figma sample', async () => {
    render();

    expect(await screen.findByTestId('visit-details-screen')).toBeTruthy();
    expect(screen.getByText('Wed, 14 Oct')).toBeTruthy();
    expect(screen.getByText('9:00 AM – 10:00 AM · 1 hr')).toBeTruthy();
    expect(screen.getByText('Cook confirmed by Wed, 6 AM')).toBeTruthy();
    // No sample cook, dish, match score or booking reference.
    expect(screen.queryByText(/Sanchita|Jyoti|Rekha|Dahi bhindi|% match|#SP/)).toBeNull();
    // No checklist before the visit has a booking to save it against.
    expect(screen.queryByText('Before the Cook arrives')).toBeNull();
  });

  it('cancels the visit with the reason the customer picks', async () => {
    const onCancel = render();
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await screen.findByTestId('visit-details-screen');

    fireEvent.press(await screen.findByTestId('visit-details-screen-dock-modify'));
    fireEvent.press(await screen.findByText('Cancel this visit'));
    fireEvent.press(await screen.findByTestId('cancel-reason-URGENT_CHANGE'));
    fireEvent.press(screen.getByTestId('cancel-continue-reason'));
    fireEvent.press(await screen.findByTestId('cancel-confirm'));

    await waitFor(() => expect(onCancel).toHaveBeenCalledWith({ reasonCode: 'URGENT_CHANGE' }));
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith('Visit cancelled', 'Your other visits stay as they are.'),
    );
    alert.mockRestore();
  });
});
