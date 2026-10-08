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
 *  - `/me/bookings/active` pages on `cursor` alone, and its FIRST page carries no parameters at
 *    all: a backend that predates paging answers 400 to any parameter on this route, so the app
 *    only ever sends `?cursor=` back once the server has handed one out.
 *
 * Pages after the first carry the server's opaque `nextCursor` — see the `paging` cases below.
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
   * The one that would break the app rather than merely limit it: against a backend that predates
   * paging, ANY parameter on this route is a 400, so Home's carousel and the Upcoming tab would
   * both fail outright.
   */
  it('sends no parameters at all for the first page of the active list', async () => {
    const { paths, bookings } = capturePath();

    await bookings.active();

    expect(paths[0]).toBe('/v1/me/bookings/active');
    expect(paths[0]).not.toContain('?');
  });

  it('sends only the cursor, exactly as given, for later pages of the active list', async () => {
    const { paths, bookings } = capturePath();
    const cursor =
      'eyJ2IjoxLCJrIjpbNSwiLTEiLCIwIiwiMCJdLCJ0IjoiMjAyNi0xMC0wN1QwOToxNTozMC4xMjM0NTZaIiwiaSI6IngifQ';

    await bookings.active(cursor);

    expect(paths[0]).toBe(`/v1/me/bookings/active?cursor=${cursor}`);
  });

  describe('paging', () => {
    it('sends the cursor back exactly as the server gave it', async () => {
      const { paths, bookings } = capturePath();
      const cursor = 'eyJ2IjoxLCJ0IjoiMjAyNi0xMC0wN1QwOToxNTozMC4xMjM0NTZaIiwiaSI6IngifQ';

      await bookings.history(cursor);
      await bookings.refunds(cursor);

      expect(paths).toEqual([
        `/v1/me/bookings?limit=50&cursor=${cursor}`,
        `/v1/me/refunds?limit=50&cursor=${cursor}`,
      ]);
    });

    it('escapes a cursor that is not URL-safe rather than trusting its alphabet', async () => {
      const { paths, bookings } = capturePath();

      await bookings.history('a+b/c=');

      expect(paths[0]).toBe('/v1/me/bookings?limit=50&cursor=a%2Bb%2Fc%3D');
    });

    it('reads nextCursor off a page, and treats an absent or null one as the last page', async () => {
      const respond = (body: unknown): ApiClient => ({
        request: (_path, options) => Promise.resolve(options.parse(body)),
      });

      await expect(
        createBookingApi(respond({ bookings: [], nextCursor: 'abc' })).history(),
      ).resolves.toEqual({ bookings: [], nextCursor: 'abc' });
      // A backend that predates the cursor sends no key at all.
      await expect(createBookingApi(respond({ bookings: [] })).history()).resolves.toEqual({
        bookings: [],
        nextCursor: null,
      });
      await expect(
        createBookingApi(respond({ refunds: [], nextCursor: null })).refunds(),
      ).resolves.toEqual({ refunds: [], nextCursor: null });
    });
  });
});
