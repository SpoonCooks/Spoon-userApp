import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

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

function render(
  onCancel = jest.fn(),
  visit: typeof VISIT = VISIT,
  extra: Record<string, (body: unknown) => unknown> = {},
) {
  renderWithRuntime(<RecurringVisitRoute />, {
    runtime: createTestRuntime({
      api: createStubApi({
        ...DEFAULT_API_STUBS,
        'GET /v1/me/recurring-bookings/rb-1/visits/visit-1': () => visit,
        'GET /v1/me/recurring-bookings/rb-1': () => BOOKING,
        'GET /v1/me/recurring-bookings/rb-1/visits/visit-1/cancellation-quote': () => QUOTE,
        'GET /v1/me/cooks': () => ({ cooks: [], count: 0 }),
        ...extra,
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

  it('opens Help on WhatsApp, prefilled, with a toast while it opens', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    render(jest.fn(), {
      ...VISIT,
      support: { whatsappUrl: 'https://wa.me/910000000000?text=Hi' },
    } as unknown as typeof VISIT);
    await screen.findByTestId('visit-details-screen');

    fireEvent.press(await screen.findByTestId('visit-details-screen-dock-help'));

    expect(open).toHaveBeenCalledWith(
      `https://wa.me/910000000000?text=${encodeURIComponent(
        'Hi Spoon, I need help with my visit · Wed, 14 Oct, 9:00 AM.',
      )}`,
    );
    expect(screen.getByText('Opening WhatsApp…')).toBeTruthy();
    open.mockRestore();
  });

  it('rates a completed visit through its own booking while it can still be rated', async () => {
    const onRate = jest.fn();
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(
      jest.fn(),
      {
        ...VISIT,
        status: 'completed',
        displayState: 'completed',
        bookingId: 'bk-9',
        cook: {
          cookId: 'c-1',
          displayName: 'Cook Meera',
          profileImageUrl: null,
          rating: { average: 4.8, count: 12 },
        },
      } as unknown as typeof VISIT,
      {
        'GET /v1/bookings/bk-9': () => ({
          booking: completedBooking({ canRate: true }),
          serverTime: '2026-10-14T06:00:00.000Z',
        }),
        'PUT /v1/bookings/bk-9/rating': (body) => {
          onRate(body);
          return {
            ratingId: 'r-1',
            bookingId: 'bk-9',
            cookId: 'c-1',
            stars: 4.5,
            isFivePlus: false,
            exceptional: false,
            created: true,
          };
        },
      },
    );

    // The real cook's name, not the frames' Rekha; no call-back toggle the backend can't act on.
    expect(await screen.findByText('Breakfast with Cook Meera')).toBeTruthy();
    // One tap on the 5th star is 4.5 (a fast second tap would make it 5).
    fireEvent.press(screen.getByTestId('rate-visit-card-stars-star-5'), {
      nativeEvent: { timestamp: 1_000 },
    });
    expect(
      await screen.findByText('Meera will be thrilled. Anything that made it special?'),
    ).toBeTruthy();
    expect(screen.queryByText(/Rekha/)).toBeNull();
    fireEvent.press(screen.getByTestId('rate-visit-card-chip-taste'));
    fireEvent.press(screen.getByTestId('rate-visit-card-submit'));

    await waitFor(() =>
      expect(onRate).toHaveBeenCalledWith({ stars: 4.5, feedback: 'What stood out? Taste' }),
    );
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith('Thanks for rating', expect.any(String)),
    );
    alert.mockRestore();
  });

  it('draws no rate card once the visit can no longer be rated', async () => {
    render(
      jest.fn(),
      {
        ...VISIT,
        status: 'completed',
        displayState: 'completed',
        bookingId: 'bk-9',
        cook: {
          cookId: 'c-1',
          displayName: 'Cook Meera',
          profileImageUrl: null,
          rating: { average: 4.8, count: 12 },
        },
      } as unknown as typeof VISIT,
      {
        'GET /v1/bookings/bk-9': () => ({
          booking: completedBooking({ canRate: false }),
          serverTime: '2026-10-14T06:00:00.000Z',
        }),
      },
    );
    await screen.findByTestId('visit-details-screen');
    await waitFor(() => expect(screen.queryByTestId('rate-visit-card')).toBeNull());
  });

  it('offers a one-time visit for the same slot, and Book again, after a failed debit', async () => {
    render(jest.fn(), {
      ...VISIT,
      status: 'cancelled',
      displayState: 'cancelled',
      cancelledBy: 'payment_failed',
    } as unknown as typeof VISIT);
    await screen.findByTestId('visit-details-screen');

    fireEvent.press(await screen.findByTestId('visit-details-screen-rebook-one-time'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/scheduled',
      params: { date: '2026-10-14', durationId: 'dur-60' },
    });
    fireEvent.press(screen.getByTestId('visit-details-screen-rebook-again'));
    expect(mockPush).toHaveBeenCalledWith('/recurring-setup/days');
  });

  it('offers only Book again on a visit the customer cancelled', async () => {
    render(jest.fn(), {
      ...VISIT,
      status: 'cancelled',
      displayState: 'cancelled',
      cancelledBy: 'customer',
    } as unknown as typeof VISIT);
    expect(await screen.findByTestId('visit-details-screen-rebook-again')).toBeTruthy();
    expect(screen.queryByTestId('visit-details-screen-rebook-one-time')).toBeNull();
  });

  it('cancels the whole booking from Payment details → Manage', async () => {
    const onCancelBooking = jest.fn();
    const alert = jest.spyOn(Alert, 'alert');
    render(jest.fn(), VISIT, {
      'GET /v1/me/recurring-bookings/rb-1/cancellation-quote': () => ({
        recurringBookingId: 'rb-1',
        cancellable: true,
        freeCount: 5,
        debited: [],
        startedCount: 0,
        totals: { feePaise: 0, refundPaise: 0 },
      }),
      'POST /v1/me/recurring-bookings/rb-1/cancel': (body) => {
        onCancelBooking(body);
        return {
          booking: { ...BOOKING, status: 'cancelled' },
          visitsCancelled: 5,
          totals: { feePaise: 0, refundPaise: 0 },
          whatsappUrl: null,
        };
      },
    });
    await screen.findByTestId('visit-details-screen');

    fireEvent.press(screen.getByTestId('visit-details-screen-dock-payment'));
    await waitFor(() => {
      fireEvent.press(screen.getByText('Manage'));
      expect(alert).toHaveBeenCalledWith(
        'Cancel this booking?',
        expect.any(String),
        expect.any(Array),
      );
    });
    const buttons = alert.mock.calls.find((call) => call[0] === 'Cancel this booking?')![2]!;
    alert.mockImplementation(() => undefined);
    buttons.find((button) => button.text === 'Cancel booking')!.onPress!();
    fireEvent.press(await screen.findByTestId('cancel-reason-URGENT_CHANGE'));
    fireEvent.press(screen.getByTestId('cancel-continue-reason'));
    fireEvent.press(await screen.findByTestId('cancel-confirm'));

    await waitFor(() =>
      expect(onCancelBooking).toHaveBeenCalledWith({ reasonCode: 'URGENT_CHANGE' }),
    );
    alert.mockRestore();
  });

  it('offers adding the cook to the Pool, and a tip, on a completed visit', async () => {
    const onAdd = jest.fn();
    render(jest.fn(), COMPLETED, {
      'GET /v1/bookings/bk-9': () => ({
        booking: {
          ...completedBooking({ canRate: false }),
          allowedActions: { ...completedBooking({ canRate: false }).allowedActions, canTip: true },
        },
        serverTime: '2026-10-14T06:00:00.000Z',
      }),
      'GET /v1/me/cooks/c-1': () => POOL_PROFILE(false),
      'POST /v1/me/cooks': (body) => {
        onAdd(body);
        return { cookId: 'c-1', added: true, addedAt: '2026-10-14T06:00:00.000Z', count: 3 };
      },
    });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    fireEvent.press(await screen.findByTestId('visit-details-screen-cook-actions-add-to-pool'));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ cookId: 'c-1' }));

    fireEvent.press(screen.getByTestId('visit-details-screen-cook-actions-tip'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/booking/[id]',
      params: { id: 'bk-9', tip: '1' },
    });
    alert.mockRestore();
  });

  it('does not offer adding a cook who is already in the Pool', async () => {
    render(jest.fn(), COMPLETED, {
      'GET /v1/bookings/bk-9': () => ({
        booking: completedBooking({ canRate: false }),
        serverTime: '2026-10-14T06:00:00.000Z',
      }),
      'GET /v1/me/cooks/c-1': () => POOL_PROFILE(true),
    });
    await screen.findByTestId('visit-details-screen');
    await waitFor(() =>
      expect(screen.queryByTestId('visit-details-screen-cook-actions')).toBeNull(),
    );
  });
});

/** The visit's one-time booking as `GET /v1/bookings/:id` returns it, completed. */
function completedBooking({ canRate }: { readonly canRate: boolean }) {
  return {
    id: 'bk-9',
    status: 'completed',
    slotType: 'scheduled',
    scheduledStart: '2026-10-14T03:30:00.000Z',
    durationMinutes: 60,
    price: {
      amountPaise: 25339,
      durationMinutes: 60,
      serviceAmountPaise: 25339,
      taxRateBps: 1800,
      taxAmountPaise: 4561,
      totalAmountPaise: 29900,
      currency: 'INR',
      pricingVersion: 'v1',
    },
    holdExpiresAt: null,
    address: {
      label: 'Home',
      latitude: 12.9,
      longitude: 77.6,
      flat: 'E102',
      tower: null,
      society: 'Purva Skydale',
      street: 'Silver County Road',
      pincode: '560102',
      city: 'Bengaluru',
      state: 'Karnataka',
      hubName: null,
      receiverName: null,
      receiverPhone: null,
    },
    mealNotes: null,
    referenceUrl: null,
    mealBrief: null,
    cook: null,
    timing: { arrivedAt: null, actualStart: null, expectedEnd: null, actualEnd: null },
    cancellation: null,
    allowedActions: {
      canCancel: false,
      canReschedule: false,
      canExtend: false,
      canRate,
      canTip: false,
      canCallCook: false,
    },
  };
}

const COMPLETED = {
  ...VISIT,
  status: 'completed',
  displayState: 'completed',
  bookingId: 'bk-9',
  cook: {
    cookId: 'c-1',
    displayName: 'Cook Meera',
    profileImageUrl: null,
    rating: { average: 4.8, count: 12 },
  },
} as unknown as typeof VISIT;

/** `GET /v1/me/cooks/:cookId` for Meera, in or out of the household's Pool. */
function POOL_PROFILE(inPool: boolean) {
  return {
    cook: {
      cookId: 'c-1',
      profileCode: null,
      displayName: 'Cook Meera',
      profileImageUrl: null,
      region: 'West Bengal',
      languages: ['Hindi'],
      cuisines: [],
      specialties: null,
      gender: null,
      spoonTrained: true,
      backgroundVerified: true,
      hygieneVerified: true,
      specialtyDishes: [],
      profileVariant: 'veg',
      rating: { average: 4.8, count: 12 },
      visitsWithYou: 1,
    },
    available: true,
    inPool,
    addedAt: null,
    dishesByCategory: [],
  };
}
