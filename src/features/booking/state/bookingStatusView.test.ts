import { resolveBookingView, viewForBooking } from './bookingStatusView';

/**
 * The booking status -> screen mapping.
 *
 * This table is the single place the backend's status strings appear in the app, so these tests
 * are the guard against two regressions: a status silently losing its screen, and the client
 * inventing a status the server never sends.
 */
describe('booking status view', () => {
  it.each([
    ['created', 'confirmation'],
    ['assigned', 'confirmation'],
    ['cook_en_route', 'enRoute'],
    ['cook_arrived', 'arrived'],
    ['cooking', 'inService'],
    ['completed', 'completion'],
    ['cancelled', 'cancelled'],
  ])('maps %s to %s', (status, expected) => {
    expect(resolveBookingView(status).view).toBe(expected);
  });

  it('falls back to unknown for a status this build has never heard of', () => {
    const onUnknown = jest.fn();
    const resolution = resolveBookingView('cook_teleported', onUnknown);

    // Degrading safely matters more than being right: the server WILL add states.
    expect(resolution.view).toBe('unknown');
    expect(onUnknown).toHaveBeenCalledWith('cook_teleported');
  });

  it('treats a null status as unknown rather than throwing', () => {
    expect(resolveBookingView(null).view).toBe('unknown');
  });

  describe('views that need the payload, not just the status', () => {
    it('shows the auto-cancelled screen when the SYSTEM cancelled it', () => {
      expect(viewForBooking({ status: 'cancelled', cancelledBy: 'system' }).view).toBe(
        'autoCancelled',
      );
    });

    it('shows the ordinary cancelled screen when the customer cancelled it', () => {
      expect(viewForBooking({ status: 'cancelled', cancelledBy: 'customer' }).view).toBe(
        'cancelled',
      );
    });

    it('shows the reassigned screen for a live booking whose assignment changed', () => {
      expect(viewForBooking({ status: 'cook_en_route', reassigned: true }).view).toBe('reassigned');
    });

    it('does not reassign a completed booking', () => {
      // Reassignment is only meaningful before service. A completed booking keeps its screen.
      expect(viewForBooking({ status: 'completed', reassigned: true }).view).toBe('completion');
    });
  });
});
