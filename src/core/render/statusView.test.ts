import { resolveBookingView, UNKNOWN_BOOKING_VIEW } from '@features/booking';

import { assertNever, resolveStatusView } from './statusView';

describe('resolveStatusView', () => {
  const registry = { EN_ROUTE: 'enRoute', ARRIVED: 'arrived' } as const;

  it('resolves a known status', () => {
    expect(resolveStatusView(registry, 'ARRIVED', 'fallback')).toEqual({
      view: 'arrived',
      isKnown: true,
      status: 'ARRIVED',
    });
  });

  it('falls back for a status the app has never heard of', () => {
    // The backend will add states, and older app versions must survive them.
    const onUnknown = jest.fn();
    const result = resolveStatusView(registry, 'COOK_REASSIGNED', 'fallback', onUnknown);

    expect(result).toEqual({ view: 'fallback', isKnown: false, status: 'COOK_REASSIGNED' });
    expect(onUnknown).toHaveBeenCalledWith('COOK_REASSIGNED');
  });

  it('falls back for null, undefined and empty statuses', () => {
    expect(resolveStatusView(registry, null, 'fallback').view).toBe('fallback');
    expect(resolveStatusView(registry, undefined, 'fallback').view).toBe('fallback');
    expect(resolveStatusView(registry, '', 'fallback').status).toBeNull();
  });

  it('does not resolve inherited object properties as statuses', () => {
    expect(resolveStatusView(registry, 'constructor', 'fallback').isKnown).toBe(false);
  });
});

describe('booking status registry', () => {
  it('is empty until the backend contract lands, so everything renders the safe fallback', () => {
    const result = resolveBookingView('ANYTHING_AT_ALL');

    expect(result.view).toBe(UNKNOWN_BOOKING_VIEW);
    expect(result.isKnown).toBe(false);
  });
});

describe('assertNever', () => {
  it('throws when an impossible variant is reached at runtime', () => {
    const value = 'surprise' as never;

    expect(() => assertNever(value)).toThrow(/Unexpected variant/);
  });
});
