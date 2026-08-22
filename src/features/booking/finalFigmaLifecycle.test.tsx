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

  it('draws NEITHER for an instant booking, even with both handlers and the server saying yes', () => {
    render(
      <BookingDetailView
        state={ready(INSTANT)}
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
