import type { ApiClient } from '@core/api';

import { createBookingApi } from './bookingApi';

/**
 * How much of a customer's history the app asks for, and from which endpoints.
 *
 * These are wire assertions because all three facts are contract, verified against the running
 * backend, and each fails in a way that is invisible from the screen:
 *
 *  - `/me/bookings` clamps `limit` to 50 instead of rejecting it, so asking for more silently
 *    returns 50. Asking for exactly 50 is the most it will ever give.
 *  - `/me/refunds` has the identical trio and the identical gap.
 *  - `/me/bookings/active` takes NO parameters — its schema is an empty object, so a `limit`
 *    there is a 400, not an ignored hint.
 *
 * Row 51 is unreachable in all cases: the cursor is `(created_at, id)`, `created_at` is
 * deliberately unpublished, and `cursorId` alone is rejected. See
 * `docs/FRONTEND_BACKEND_PENDING.md`.
 */

function capturePath() {
  const paths: string[] = [];
  const api: ApiClient = {
    async request(path, options) {
      paths.push(path);
      // Both list parsers read their own key off the same object, so one stub body serves all
      // three calls without the harness having to know which endpoint it is standing in for.
      return options.parse({ bookings: [], refunds: [] });
    },
  };
  return { paths, bookings: createBookingApi(api) };
}

describe('how much history the app asks for', () => {
  it('asks past bookings for the server’s maximum page', async () => {
    const { paths, bookings } = capturePath();

    await bookings.history();

    // Exactly 50: the clamp means a larger number is not an error but is not more rows either.
    expect(paths[0]).toBe('/v1/me/bookings?limit=50');
  });

  it('asks refunds for the same maximum, having the same gap', async () => {
    const { paths, bookings } = capturePath();

    await bookings.refunds();

    expect(paths[0]).toBe('/v1/me/refunds?limit=50');
  });

  /**
   * The one that would break the app rather than merely limit it: `?limit=` on this route is a
   * 400, so Home's carousel and the Upcoming tab would both fail outright.
   */
  it('sends no parameters at all to the active list', async () => {
    const { paths, bookings } = capturePath();

    await bookings.active();

    expect(paths[0]).toBe('/v1/me/bookings/active');
    expect(paths[0]).not.toContain('?');
  });
});
