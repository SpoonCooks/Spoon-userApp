import { DEMO_BANNER_DESTINATION_PAGE } from '@/demo/fixtures/home';
import { BANNER_DESTINATION_PAGE, homeBannerFor } from './homeBannerView';
import type { HomeBannerInput, HomeBannerVariant } from './homeBannerView';

const BASE: HomeBannerInput = {
  bookingId: 'bk_1',
  status: 'assigned',
  cookName: 'Rekha',
  cookPhotoUrl: 'https://cdn.example/rekha.png',
  dateLabel: 'Tomorrow, Aug 5',
  timeLabel: '1:15 PM • 1 hr',
};

const at = (over: Partial<HomeBannerInput>): HomeBannerInput => ({ ...BASE, ...over });

describe('state mapping — `367:71`', () => {
  it('draws the confirmed card once a cook is assigned and the payment is captured', () => {
    const banner = homeBannerFor(at({ status: 'assigned' }));

    expect(banner).toMatchObject({
      variant: 'confirmed',
      title: 'Upcoming booking',
      badgeValue: 'Confirmed!',
    });
    // `337:4261` has no caption — it is the 82pt block badge, not the caption-over-pill form.
    expect(banner?.badgeCaption).toBeUndefined();
  });

  it('shows attention copy when an assigned booking is handed to support', () => {
    expect(homeBannerFor(at({ recoveryHandoff: true }))).toMatchObject({
      variant: 'confirmed',
      title: 'Booking needs attention',
      badgeValue: 'Needs attention',
    });
    expect(homeBannerFor(at({ recoveryHandoff: true }))?.badgeValue).not.toBe('Confirmed!');
  });

  it('draws NO card for a booking whose payment has not been finalized', () => {
    // `created` is payment-pending. It shared the confirmed card until a real device showed the
    // consequence: "Confirmed!" over a booking nobody had paid for. There is no drawn
    // payment-pending card, so the honest answer is none at all.
    expect(homeBannerFor(at({ status: 'created' }))).toBeNull();
  });

  it('draws the arriving card with the server ETA', () => {
    expect(homeBannerFor(at({ status: 'cook_en_route', etaMinutes: 12 }))).toMatchObject({
      variant: 'arriving',
      title: 'Arriving',
      badgeCaption: 'Arriving in',
      badgeValue: '12 mins',
    });
  });

  it('shows no number when the server supplies no ETA', () => {
    // The alternative — counting down from `scheduledStart` — is exactly the client-side guess
    // §7 forbids.
    expect(homeBannerFor(at({ status: 'cook_en_route', etaMinutes: null }))?.badgeValue).toBe('—');
  });

  it('draws the arrived card', () => {
    expect(homeBannerFor(at({ status: 'cook_arrived' }))).toMatchObject({
      variant: 'arrived',
      title: 'Arrived',
      badgeCaption: 'Arrived at',
    });
  });

  it('falls back to the status word rather than printing a wrong arrival time', () => {
    // BACKEND_GAP: no arrival timestamp exists. `actualStart` is service start, a later moment.
    expect(homeBannerFor(at({ status: 'cook_arrived' }))?.badgeValue).toBe('Arrived');
    expect(
      homeBannerFor(at({ status: 'cook_arrived', arrivedAtLabel: '1:12 PM' }))?.badgeValue,
    ).toBe('1:12 PM');
  });

  it('draws the live card from the booking timing, not from the schedule', () => {
    expect(homeBannerFor(at({ status: 'cooking', minutesLeft: 42 }))).toMatchObject({
      variant: 'live',
      title: 'Live booking',
      badgeCaption: 'Time left',
      badgeValue: '42 mins',
    });
  });

  it('offers the rate card only when the server allows rating', () => {
    const rateable = homeBannerFor(at({ status: 'completed', canRate: true }));
    expect(rateable).toMatchObject({
      variant: 'rate',
      title: 'Share your rating!',
      badgeValue: 'Completed!',
    });
    expect(rateable?.rating?.description).toContain('5+');

    // Already rated: the server says no, so no banner — not a card with a dead scale.
    expect(homeBannerFor(at({ status: 'completed', canRate: false }))).toBeNull();
  });

  it('apologises only for a cancellation Spoon made', () => {
    const system = homeBannerFor(at({ status: 'cancelled', cancelledBy: 'system' }));
    expect(system).toMatchObject({ variant: 'cancelled', title: 'Cancelled' });
    expect(system?.notice).toContain('sincerely apologize');
    // `393:1072` draws no cook and no badge.
    expect(system?.cookName).toBeUndefined();
    expect(system?.badgeValue).toBeUndefined();

    // A customer's own cancellation must not apologise to them for their decision.
    expect(homeBannerFor(at({ status: 'cancelled', cancelledBy: 'customer' }))).toBeNull();
    expect(homeBannerFor(at({ status: 'cancelled' }))).toBeNull();
  });
});

describe('reassignment — the two titles that change', () => {
  it('retitles the confirmed and arriving cards when the server reports a reassignment', () => {
    expect(homeBannerFor(at({ status: 'assigned', reassigned: true }))).toMatchObject({
      variant: 'reassignedConfirmed',
      title: 'Reassigned',
      badgeValue: 'Confirmed!',
    });
    expect(
      homeBannerFor(at({ status: 'cook_en_route', reassigned: true, etaMinutes: 16 })),
    ).toMatchObject({
      variant: 'reassignedArriving',
      title: 'Reassigned',
      badgeValue: '16 mins',
    });
  });

  it('keeps support attention copy when the assigned booking was also reassigned', () => {
    expect(homeBannerFor(at({ reassigned: true, recoveryHandoff: true }))).toMatchObject({
      variant: 'reassignedConfirmed',
      title: 'Booking needs attention',
      badgeValue: 'Needs attention',
    });
  });

  it('leaves the later cards untitled by reassignment, as drawn', () => {
    // `394:1235`, `394:1257` and `394:1279` show the reassigned cook under the ORDINARY titles.
    expect(homeBannerFor(at({ status: 'cook_arrived', reassigned: true }))?.title).toBe('Arrived');
    expect(homeBannerFor(at({ status: 'cooking', reassigned: true }))?.title).toBe('Live booking');
    expect(homeBannerFor(at({ status: 'completed', canRate: true, reassigned: true }))?.title).toBe(
      'Share your rating!',
    );
  });

  it('never assumes a reassignment that was not reported', () => {
    // The flag is a BACKEND_GAP. Absent must mean "ordinary card", never "reassigned".
    expect(homeBannerFor(at({ status: 'assigned' }))?.variant).toBe('confirmed');
    expect(homeBannerFor(at({ status: 'assigned', reassigned: false }))?.variant).toBe('confirmed');
  });
});

describe('navigation mapping — task §7', () => {
  it('sends every banner to the one lifecycle route, carrying the real booking id', () => {
    const cases: readonly [HomeBannerInput, HomeBannerVariant][] = [
      [at({ status: 'assigned' }), 'confirmed'],
      [at({ status: 'assigned', reassigned: true }), 'reassignedConfirmed'],
      [at({ status: 'cancelled', cancelledBy: 'system' }), 'cancelled'],
      [at({ status: 'cook_en_route' }), 'arriving'],
      [at({ status: 'cook_en_route', reassigned: true }), 'reassignedArriving'],
      [at({ status: 'cook_arrived' }), 'arrived'],
      [at({ status: 'cooking' }), 'live'],
      [at({ status: 'completed', canRate: true }), 'rate'],
    ];

    for (const [input, variant] of cases) {
      const banner = homeBannerFor(input);
      expect(banner?.variant).toBe(variant);
      expect(banner?.destination).toEqual({
        route: '/booking/[id]',
        bookingId: 'bk_1',
        figmaPage: BANNER_DESTINATION_PAGE[variant],
      });
    }
  });

  it('pins the Figma page each state is expected to resolve to', () => {
    // Asserted so the table cannot drift from the brief without a failing test.
    expect(BANNER_DESTINATION_PAGE).toEqual({
      confirmed: '8a',
      reassignedConfirmed: '8b',
      cancelled: '8c',
      arriving: '9a/9b',
      reassignedArriving: '10a/10b',
      arrived: '11',
      live: '12a/12b',
      rate: '14a',
    });
  });
});

/**
 * `src/demo/fixtures/home.ts` transcribes this table rather than importing it, to break the
 * barrel -> data -> fixtures -> barrel cycle. This is the assertion that makes the transcription
 * safe: a variant added or repointed here fails until the fixture matches.
 */
describe('the demo fixtures quote the SAME destinations', () => {
  it('matches entry for entry', () => {
    expect(DEMO_BANNER_DESTINATION_PAGE).toEqual(BANNER_DESTINATION_PAGE);
  });
});
