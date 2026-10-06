import { fireEvent, render, screen } from '@testing-library/react-native';

import type { MandateVerifyDto, RecurringBookingDto, VisitSummaryDto } from '../api';
import { RecurringBookedScreen } from './RecurringBookedScreen';

/** The confirmation after Autopay (DEC-086): the server's outcome, and no Cook named. */

const FIRST: VisitSummaryDto = {
  visitId: 'visit-1',
  planNumber: 1,
  visitNumber: 1,
  date: '2026-10-06',
  timeOfDay: 'morning',
  startTime: '09:00',
  start: '2026-10-06T03:30:00.000Z',
  durationMinutes: 60,
  status: 'scheduled',
  displayState: 'cook_pending',
  cookConfirmBy: '2026-10-06T00:30:00.000Z',
  cook: null,
  bookingId: null,
  totalPaise: 13545,
  cancelledBy: null,
};

const BOOKING = {
  recurringBookingId: 'rb-1',
  status: 'active',
  addressId: 'addr-1',
  window: { startDate: '2026-10-05', endDate: '2026-10-25' },
  policyVersion: 'p',
  mandate: null,
  banner: null,
  counts: { done: 0, cancelled: 0, toGo: 5 },
  plans: [
    {
      planNumber: 1,
      days: ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'],
      visits: [],
      history: [],
    },
  ],
  days: [],
  upNext: FIRST,
  chargeRange: { minPaise: 13545, maxPaise: 13545 },
  support: { whatsappUrl: null },
  createdAt: '2026-10-02T06:00:00.000Z',
  cancelledAt: null,
  cancelledBy: null,
} as RecurringBookingDto;

const mandate = (
  status: MandateVerifyDto['status'],
  bookingStatus: MandateVerifyDto['bookingStatus'],
) =>
  ({
    mandateId: 'm-1',
    recurringBookingId: 'rb-1',
    method: 'upi',
    status,
    bookingStatus,
    handleMasked: status === 'confirmed' ? 'ra••••@okhdfc' : null,
    confirmedAt: null,
  }) as MandateVerifyDto;

describe('RecurringBookedScreen', () => {
  it('confirms an approved mandate, with the masked handle and the reveal lead from the visit', () => {
    const onDone = jest.fn();
    render(
      <RecurringBookedScreen
        booking={BOOKING}
        mandate={mandate('confirmed', 'active')}
        onDone={onDone}
      />,
    );

    expect(screen.getByText('Your Recurring booking is confirmed')).toBeTruthy();
    expect(screen.getByText('Autopay from ra••••@okhdfc')).toBeTruthy();
    expect(screen.getByText(/confirmed 3 hours before it starts/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('recurring-booked-screen-done'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('says the bank is still confirming when UPI answered initiated', () => {
    render(
      <RecurringBookedScreen
        booking={{ ...BOOKING, status: 'pending_mandate' }}
        mandate={mandate('initiated', 'pending_mandate')}
        onDone={jest.fn()}
      />,
    );

    expect(screen.getByText('Waiting for your bank')).toBeTruthy();
  });
});
