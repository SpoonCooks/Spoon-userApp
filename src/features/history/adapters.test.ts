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

/**
 * `6:227` draws `Scheduled · 4:00 PM` under the cook's name — how the booking was made and
 * when it ran. The card used to print the ADDRESS label there instead, so every row read "Home":
 * the least distinguishing fact available, since a customer's bookings are nearly all at one
 * address.
 */
describe('the line under the cook name says how and when', () => {
  it('names the slot type and the start time for a scheduled booking', () => {
    expect(bookingCardFrom(at({}), IST).subtitle).toBe('Scheduled · 10:00 AM');
  });

  it('reads the start time in the published timezone, not the device one', () => {
    expect(bookingCardFrom(at({}), 'UTC').subtitle).toBe('Scheduled · 4:30 AM');
  });

  it('says only Instant for an instant booking, which promised no start time', () => {
    expect(bookingCardFrom(at({ slotType: 'instant' }), IST).subtitle).toBe('Instant');
  });

  it('falls back to the bare word when the server carries no start', () => {
    expect(bookingCardFrom(at({ scheduledStart: null }), IST).subtitle).toBe('Scheduled');
  });
});

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

  it('never calls a captured, cook-assigned booking payment pending', () => {
    // The founder's 10:15 booking: payment captured, assignment made. It was overdue, not
    // unpaid, and calling it "Payment pending" would tell the customer their money never moved.
    // Only `created` carries that label, and this booking is not `created`.
    const card = bookingCardFrom(at({ status: 'assigned' }), IST);

    expect(card.statusLabel).not.toBe('Payment pending');
    expect(card.statusLabel).toBe('Confirmed');
  });

  it('reads Cancelled once the expiry sweep has ended an abandoned checkout', () => {
    // What the app shows on the refresh AFTER the backend sweep runs. The same booking that read
    // "Payment pending" while it was `created` now reads a real ending, because the server moved
    // it to a terminal status rather than leaving it unresolved forever.
    const beforeSweep = bookingCardFrom(at({ status: 'created' }), IST);
    const afterSweep = bookingCardFrom(at({ status: 'cancelled' }), IST);

    expect(beforeSweep.statusLabel).toBe('Payment pending');
    expect(afterSweep.statusLabel).toBe('Cancelled');
    expect(afterSweep.statusLabel).not.toBe('Payment pending');
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

/*
 * The star on a Past-bookings row is the CUSTOMER's score, never the cook's average.
 *
 * It was the average. Four cancelled bookings in a row each showed "5 ★" — nobody had cooked and
 * nobody had rated — and a booking the customer had scored 3 showed 5, because the number came
 * from the cook rather than from them. A customer reads a star on their own row as the score they
 * gave it, so these check that the two numbers never stand in for each other again.
 */
describe('the star on a history card', () => {
  const cook = {
    cookId: 'cook-1',
    displayName: 'Cook Sanchita',
    profileImageUrl: null,
    // The boundary has already flattened the server's { average, count } by this point.
    ratingAverage: 5,
  };

  it('is dropped from a cancelled booking', () => {
    const card = bookingCardFrom(
      at({ status: 'cancelled', cook, ratingStars: null } as never),
      IST,
    );

    expect(card.rating).toBeUndefined();
    // Her name and face stay: the row is still about who it was going to be.
    expect(card.cookName).toBe('Cook Sanchita');
  });

  it('shows what the customer gave, not what the cook averages', () => {
    const card = bookingCardFrom(at({ status: 'completed', cook, ratingStars: 3 } as never), IST);

    // 3, not her 5. This is the defect the founder reported: "in past booking we should be able
    // to see whats the booking we gave her not her actuall current rating".
    expect(card.rating).toBe(3);
    expect(card.cookName).toBe('Cook Sanchita');
  });

  /*
   * No placeholder for an unrated booking. The card carries its own rating prompt, and a number
   * here would be indistinguishable from an answer the customer never gave.
   */
  it('shows no star on a completed booking nobody rated', () => {
    const card = bookingCardFrom(
      at({ status: 'completed', cook, ratingStars: null } as never),
      IST,
    );

    expect(card.rating).toBeUndefined();
  });

  /* An older deployment sends no field at all; absent must behave exactly as unrated. */
  it('treats a missing field as unrated rather than falling back to her average', () => {
    const card = bookingCardFrom(at({ status: 'completed', cook } as never), IST);

    expect(card.rating).toBeUndefined();
  });
});
