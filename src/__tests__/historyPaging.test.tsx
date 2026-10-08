import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { ApiClient } from '@core/api';
import { createTestRuntime, renderWithRuntime } from '@/test/renderWithRuntime';

import HistoryRoute from '@/app/(app)/history';
import RefundsRoute from '@/app/(app)/refunds';

/**
 * My bookings → Past and Refunds past the first page, end to end through the route.
 *
 * The router is mocked (a real navigator needs the whole app); everything between the route and
 * the wire is real: the infinite query, the cursor going back unchanged, the card adapters, the
 * list's end-reached handler and its footer.
 */

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: jest.fn(() => true),
    canDismiss: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(effect, [effect]);
  },
  Redirect: () => null,
  Stack: () => null,
}));

const PRICE = {
  amountPaise: 12900,
  durationMinutes: 60,
  serviceAmountPaise: 12900,
  taxRateBps: 500,
  taxAmountPaise: 645,
  totalAmountPaise: 13545,
  currency: 'INR',
  pricingVersion: 'pricing-policy-v0',
};

const booking = (id: string, day: number) => ({
  id,
  status: 'completed',
  slotType: 'scheduled',
  scheduledStart: `2026-09-${String(day).padStart(2, '0')}T08:00:00.000Z`,
  durationMinutes: 60,
  price: PRICE,
  addressLabel: 'Home',
});

const refund = (id: string, day: number) => ({
  refundId: id,
  bookingId: `b-${id}`,
  amountPaise: 5000,
  currency: 'INR',
  state: 'succeeded',
  reason: 'scheduled_cancellation',
  requestedAt: `2026-09-${String(day).padStart(2, '0')}T08:00:00.000Z`,
  completedAt: `2026-09-${String(day).padStart(2, '0')}T09:00:00.000Z`,
  serviceStart: `2026-09-${String(day).padStart(2, '0')}T08:00:00.000Z`,
  durationMinutes: 60,
});

/** Three pages: [a, b] → [c, d] → [e], and the paths asked for, in order. */
function pagedApi(kind: 'bookings' | 'refunds', options: { failSecondPageOnce?: boolean } = {}) {
  const paths: string[] = [];
  let failing = options.failSecondPageOnce === true;
  const make = kind === 'bookings' ? booking : refund;
  const api: ApiClient = {
    async request(path, requestOptions) {
      paths.push(path);
      const [route, search = ''] = path.split('?');
      if (route === '/v1/me/bookings/active') return requestOptions.parse({ bookings: [] });
      if (route !== `/v1/me/${kind}`) throw new Error(`No stub for GET ${path}`);
      const cursor = new URLSearchParams(search).get('cursor');
      if (cursor === 'cursor-2' && failing) {
        failing = false;
        throw new Error('network');
      }
      const page =
        cursor === null
          ? { rows: [make('a', 9), make('b', 8)], nextCursor: 'cursor-2' }
          : cursor === 'cursor-2'
            ? { rows: [make('c', 7), make('d', 6)], nextCursor: 'cursor-3' }
            : { rows: [make('e', 5)], nextCursor: null };
      return requestOptions.parse({ [kind]: page.rows, nextCursor: page.nextCursor });
    },
  };
  return { api, paths };
}

const reachEnd = (testID: string) =>
  fireEvent(screen.getByTestId(testID), 'endReached', { distanceFromEnd: 0 });

describe('My bookings → Past', () => {
  async function openPast(api: ApiClient) {
    renderWithRuntime(<HistoryRoute />, { runtime: createTestRuntime({ api }) });
    fireEvent.press(await screen.findByRole('radio', { name: 'Past' }));
    await screen.findByTestId('history-screen-card-a');
  }

  it('loads the next pages as the end is reached, newest first, sending the cursor back as given', async () => {
    const { api, paths } = pagedApi('bookings');
    await openPast(api);

    expect(screen.queryByTestId('history-screen-card-c')).toBeNull();

    reachEnd('history-screen-list');
    await screen.findByTestId('history-screen-card-c');
    expect(screen.getByTestId('history-screen-card-d')).toBeTruthy();

    reachEnd('history-screen-list');
    await screen.findByTestId('history-screen-card-e');

    expect(paths.filter((path) => path.startsWith('/v1/me/bookings?'))).toEqual([
      '/v1/me/bookings?limit=50',
      '/v1/me/bookings?limit=50&cursor=cursor-2',
      '/v1/me/bookings?limit=50&cursor=cursor-3',
    ]);

    // The last page said `null`: reaching the end again asks for nothing.
    reachEnd('history-screen-list');
    expect(paths.filter((path) => path.startsWith('/v1/me/bookings?'))).toHaveLength(3);
  });

  it('keeps the cards and offers a retry when a later page fails', async () => {
    const { api } = pagedApi('bookings', { failSecondPageOnce: true });
    await openPast(api);

    reachEnd('history-screen-list');
    await screen.findByText('Couldn’t load more');
    expect(screen.getByTestId('history-screen-card-a')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Retry loading more' }));
    await screen.findByTestId('history-screen-card-c');
    await waitFor(() => expect(screen.queryByText('Couldn’t load more')).toBeNull());
  });
});

/** The in-flight list: three pages [a, b] → [c, d] → [e], every row an unpaid future booking. */
const upcoming = (id: string, day: number) => ({
  ...booking(id, day),
  status: 'created',
  scheduledStart: `2099-01-${String(day).padStart(2, '0')}T08:00:00.000Z`,
});

function upcomingApi(pages: Record<string, { rows: object[]; nextCursor: string | null }>) {
  const paths: string[] = [];
  const api: ApiClient = {
    async request(path, requestOptions) {
      paths.push(path);
      const [route, search = ''] = path.split('?');
      if (route === '/v1/me/bookings') return requestOptions.parse({ bookings: [] });
      if (route !== '/v1/me/bookings/active') throw new Error(`No stub for GET ${path}`);
      const page = pages[new URLSearchParams(search).get('cursor') ?? ''];
      if (page === undefined) throw new Error(`No page for ${path}`);
      return requestOptions.parse({ bookings: page.rows, nextCursor: page.nextCursor });
    },
  };
  return { api, paths };
}

describe('My bookings → Upcoming', () => {
  it('loads the next pages as the end is reached, sending only the cursor', async () => {
    const { api, paths } = upcomingApi({
      '': { rows: [upcoming('a', 9), upcoming('b', 8)], nextCursor: 'cursor-2' },
      'cursor-2': { rows: [upcoming('c', 7), upcoming('d', 6)], nextCursor: 'cursor-3' },
      'cursor-3': { rows: [upcoming('e', 5)], nextCursor: null },
    });
    renderWithRuntime(<HistoryRoute />, { runtime: createTestRuntime({ api }) });
    await screen.findByTestId('history-screen-card-a');
    expect(screen.queryByTestId('history-screen-card-c')).toBeNull();

    reachEnd('history-screen-list');
    await screen.findByTestId('history-screen-card-c');

    reachEnd('history-screen-list');
    await screen.findByTestId('history-screen-card-e');

    // The first request has no parameters (an older backend would 400 on any); the rest carry
    // the cursor alone.
    expect(paths.filter((path) => path.startsWith('/v1/me/bookings/active'))).toEqual([
      '/v1/me/bookings/active',
      '/v1/me/bookings/active?cursor=cursor-2',
      '/v1/me/bookings/active?cursor=cursor-3',
    ]);

    reachEnd('history-screen-list');
    expect(paths.filter((path) => path.startsWith('/v1/me/bookings/active'))).toHaveLength(3);
  });

  it('keeps asking when every row so far is one the tab filters out', async () => {
    // Finished bookings whose slot has passed belong under Past, not Upcoming. A first page made
    // only of those leaves nothing to draw — no list, so nothing to scroll to the end of — and the
    // next page, which holds the live booking, has to be requested without the customer's help.
    const { api } = upcomingApi({
      '': { rows: [booking('old-1', 2), booking('old-2', 1)], nextCursor: 'cursor-2' },
      'cursor-2': { rows: [upcoming('live', 9)], nextCursor: null },
    });
    renderWithRuntime(<HistoryRoute />, { runtime: createTestRuntime({ api }) });

    await screen.findByTestId('history-screen-card-live');
    expect(screen.queryByTestId('history-screen-card-old-1')).toBeNull();
  });

  it('degrades to one page against a backend that sends no cursor', async () => {
    const { api, paths } = upcomingApi({ '': { rows: [upcoming('a', 9)], nextCursor: null } });
    renderWithRuntime(<HistoryRoute />, { runtime: createTestRuntime({ api }) });
    await screen.findByTestId('history-screen-card-a');

    reachEnd('history-screen-list');
    expect(paths.filter((path) => path.startsWith('/v1/me/bookings/active'))).toEqual([
      '/v1/me/bookings/active',
    ]);
  });
});

describe('Refunds', () => {
  it('pages the same way', async () => {
    const { api, paths } = pagedApi('refunds');
    renderWithRuntime(<RefundsRoute />, { runtime: createTestRuntime({ api }) });
    await screen.findByTestId('refunds-screen-card-a');

    reachEnd('refunds-screen-list');
    await screen.findByTestId('refunds-screen-card-c');

    expect(paths.filter((path) => path.startsWith('/v1/me/refunds'))).toEqual([
      '/v1/me/refunds?limit=50',
      '/v1/me/refunds?limit=50&cursor=cursor-2',
    ]);
  });
});
