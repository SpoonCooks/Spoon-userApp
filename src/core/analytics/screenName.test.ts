import { screenNameFrom } from './screenName';

/**
 * No customer identifier may reach Firebase in a screen name.
 *
 * `usePathname` returns the RESOLVED route — `/booking/9f3c…` — and sending that would put a real
 * booking id into a third-party analytics system, permanently, with nobody having decided to. The
 * funnel needs to know that the booking screen was visited; it does not need to know which booking.
 *
 * Deliberately eager: collapsing two screens into one label costs a little precision, while
 * missing one id is a customer identifier that cannot be taken back.
 */
describe('screen names carry the route, never the record', () => {
  it('collapses a UUID booking id', () => {
    expect(screenNameFrom('/booking/9f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8')).toBe('/booking/:id');
  });

  it('collapses a long numeric id', () => {
    expect(screenNameFrom('/booking/20260902114500')).toBe('/booking/:id');
  });

  it('collapses a long hex id', () => {
    expect(screenNameFrom('/address/a1b2c3d4e5f6a7b8')).toBe('/address/:id');
  });

  it('leaves real route segments alone', () => {
    // Over-eager stripping would merge distinct screens and make the funnel meaningless.
    expect(screenNameFrom('/')).toBe('/');
    expect(screenNameFrom('/home')).toBe('/home');
    expect(screenNameFrom('/booking/instant')).toBe('/booking/instant');
    expect(screenNameFrom('/address/details')).toBe('/address/details');
    expect(screenNameFrom('/schedule')).toBe('/schedule');
  });

  it('leaves a short number alone, which is a step and not an id', () => {
    // `/onboarding/2` is a page number. Only runs long enough to be an identifier are collapsed.
    expect(screenNameFrom('/onboarding/2')).toBe('/onboarding/2');
  });

  it('strips every id in a nested route, not just the first', () => {
    expect(screenNameFrom('/booking/9f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8/refunds')).toBe(
      '/booking/:id/refunds',
    );
  });
});
