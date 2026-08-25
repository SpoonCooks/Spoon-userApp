import { bookingCardFrom, headlineFor } from './adapters';
import type { BookingSummaryDto } from '@features/booking';

/**
 * What a booking card is allowed to claim.
 *
 * Two defects lived here, and both were visible on a real device. A booking whose payment had not
 * been finalized was labelled "Confirmed", and the date was read on the DEVICE clock, so the same
 * instant printed as two different days depending on the handset's timezone.
 */

const BASE: BookingSummaryDto = {
  id: 'booking-1',
  status: 'assigned',
  slotType: 'scheduled',
  // 26 August 2026, 10:00 IST — the real booking.
  scheduledStart: '2026-08-26T04:30:00.000Z',
  durationMinutes: 30,
  price: {
    amountPaise: 7245,
    durationMinutes: 30,
    serviceAmountPaise: 6900,
    taxRateBps: 500,
    taxAmountPaise: 345,
    totalAmountPaise: 7245,
    currency: 'INR',
    pricingVersion: 'pricing-policy-v0',
  },
};

const IST = 'Asia/Kolkata';

const at = (over: Partial<BookingSummaryDto>): BookingSummaryDto => ({ ...BASE, ...over });

describe('the status pill states what actually happened', () => {
  it('calls a paid, cook-assigned booking Confirmed', () => {
    expect(bookingCardFrom(at({ status: 'assigned' }), IST).statusLabel).toBe('Confirmed');
  });

  it('does NOT call an unfinalized payment Confirmed', () => {
    // `created` means the payment never completed. Labelling it "Confirmed" told the customer
    // their money had moved and a cook was coming, when neither had happened.
    const card = bookingCardFrom(at({ status: 'created' }), IST);

    expect(card.statusLabel).not.toBe('Confirmed');
    expect(card.statusLabel).toBe('Payment pending');
  });

  it.each([
    ['cook_en_route', 'On the way'],
    ['cook_arrived', 'Arrived'],
    ['cooking', 'In service'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
  ] as const)('leaves %s reading %s', (status, label) => {
    expect(bookingCardFrom(at({ status }), IST).statusLabel).toBe(label);
  });
});

describe('the date is read on the service clock, not the device', () => {
  it('writes the India day for a booking just after IST midnight', () => {
    // 2026-08-26T00:30+05:30 is 2026-08-25T19:00Z. A device reading would call this the 25th —
    // which is precisely how tomorrow's booking came to look like yesterday's.
    const headline = headlineFor(at({ scheduledStart: '2026-08-25T19:00:00.000Z' }), IST);

    expect(headline).toContain('26');
    expect(headline).not.toContain('25');
  });

  it('writes the India day for a booking just before IST midnight', () => {
    // 2026-08-25T23:30+05:30 is 2026-08-25T18:00Z — still the 25th in India.
    const headline = headlineFor(at({ scheduledStart: '2026-08-25T18:00:00.000Z' }), IST);

    expect(headline).toContain('25');
  });

  it('gives the same answer whatever timezone the reader passes, for the same instant', () => {
    // The service clock is the authority, so the label cannot vary by caller.
    expect(headlineFor(BASE, IST)).toBe(headlineFor(BASE, IST));
    expect(headlineFor(BASE, IST)).toContain('26');
  });

  it('still renders when the catalogue has not published a timezone yet', () => {
    // Degrades to the device reading rather than blanking the label, which is what it did
    // everywhere before the service clock was threaded in.
    expect(headlineFor(BASE, undefined)).toMatch(/\d/);
  });

  it('keeps the duration half of the headline', () => {
    expect(headlineFor(at({ durationMinutes: 60 }), IST)).toContain('1 hr');
    expect(headlineFor(at({ durationMinutes: 30 }), IST)).toContain('30 mins');
  });

  it('falls back to the duration alone for an instant booking with no scheduled start', () => {
    expect(headlineFor(at({ scheduledStart: null, durationMinutes: 60 }), IST)).toBe('1 hr');
  });
});
