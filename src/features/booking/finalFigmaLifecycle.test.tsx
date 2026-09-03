import { screen } from '@testing-library/react-native';

import { renderWithDefaultRuntime as render } from '@/test/renderWithRuntime';
import { ready } from '@core/data';

import { DEMO_BOOKING_CONFIRMATION } from '@/demo/fixtures/booking';
import { BookingDetailView } from './screens/BookingDetailScreen';
import type { BookingDetailViewModel } from './types';

/**
 * §11 — Instant bookings draw NO Cancel and NO Reschedule.
 *
 * The distinction the task draws is between "disabled" and "absent", so these assert absence.
 * A disabled control still tells the customer the action exists for this booking; for an instant
 * booking, with a cook already on the way, it does not.
 */

const SCHEDULED: BookingDetailViewModel = {
  ...DEMO_BOOKING_CONFIRMATION,
  slotType: 'scheduled',
  cancelAllowed: true,
  summary: { ...DEMO_BOOKING_CONFIRMATION.summary!, rescheduleAllowed: true },
};

const INSTANT: BookingDetailViewModel = { ...SCHEDULED, slotType: 'instant' };

describe('Confirmation CTAs — scheduled vs instant (§11)', () => {
  it('offers BOTH controls for a scheduled booking the server permits', () => {
    render(
      <BookingDetailView
        state={ready(SCHEDULED)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
      />,
    );

    expect(screen.getByTestId('confirmation-cancel')).toBeTruthy();
    expect(screen.getByTestId('confirmation-reschedule')).toBeTruthy();
  });

  /*
   * The instant case is no longer decided here.
   *
   * §11 removed both controls from an instant booking client-side. The owner reopened
   * cancellation for instant on 2026-09-03 (an instant booking is the only kind the Delhi pilot
   * places, so "cannot cancel" meant nobody could cancel anything), and this screen kept its own
   * copy of the old rule and drew nothing regardless. The slot type is now the server's business
   * on both controls, so this asserts the screen follows the flags rather than the slot type.
   */
  it('follows the server on an instant booking rather than deciding the slot type itself', () => {
    render(
      <BookingDetailView
        state={ready(INSTANT)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
      />,
    );

    expect(screen.getByTestId('confirmation-cancel')).toBeTruthy();
    expect(screen.getByTestId('confirmation-reschedule')).toBeTruthy();
  });

  it('draws neither control when the server withholds both, whatever the slot type', () => {
    const refused: BookingDetailViewModel = {
      ...INSTANT,
      cancelAllowed: false,
      ...(INSTANT.summary === undefined
        ? {}
        : { summary: { ...INSTANT.summary, rescheduleAllowed: false } }),
    };

    render(
      <BookingDetailView
        state={ready(refused)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('confirmation-cancel')).toBeNull();
    expect(screen.queryByTestId('confirmation-reschedule')).toBeNull();
  });

  it('keeps obeying the server when the slot type is absent — an unknown type is NOT instant', () => {
    const unknown: BookingDetailViewModel = { ...SCHEDULED };
    delete (unknown as { slotType?: unknown }).slotType;

    render(
      <BookingDetailView
        state={ready(unknown)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
      />,
    );

    expect(screen.getByTestId('confirmation-cancel')).toBeTruthy();
  });

  it('still hides Cancel when the SERVER refuses it, scheduled or not', () => {
    render(
      <BookingDetailView
        state={ready({ ...SCHEDULED, cancelAllowed: false })}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('confirmation-cancel')).toBeNull();
  });
});
