import type { CookPoolListDto, CookProfile, PoolCookProfileDto } from '@features/cookPool';
import type {
  RecurringBookingDto,
  VisitCancellationQuoteDto,
  VisitDetailDto,
} from '@features/recurringSetup';

import {
  dayLabel,
  rateVisitInfo,
  ratingRequestFor,
  visitDetailsFrom,
  visitWhatsAppLink,
} from './visitDetails';
import type { VisitDetailsSources } from './visitDetails';

/**
 * Visit details on a real visit. Today is Thu 8 Oct 2026; the visit is Wed 14 Oct, 9:00 AM, 1 hr,
 * its cook confirmed by Wed 6 AM (T−3h, 00:30 UTC).
 */

const TODAY = '2026-10-08';

const PRICE = {
  basePricePaise: 33814,
  pricePaise: 25339,
  gstPaise: 4561,
  totalPaise: 29900,
  pricingVersion: 'v1',
};

function visit(overrides: Partial<VisitDetailDto> = {}): VisitDetailDto {
  return {
    visitId: 'visit-1',
    recurringBookingId: 'rb-1',
    planNumber: 1,
    visitNumber: 1,
    date: '2026-10-14',
    timeOfDay: 'morning',
    startTime: '09:00',
    start: '2026-10-14T03:30:00.000Z',
    durationMinutes: 60,
    status: 'scheduled',
    displayState: 'cook_pending',
    cookConfirmBy: '2026-10-14T00:30:00.000Z',
    cook: null,
    bookingId: null,
    totalPaise: 29900,
    cancelledBy: null,
    price: PRICE,
    payment: null,
    cancellation: null,
    mandate: {
      mandateId: 'm-1',
      method: 'upi',
      status: 'active',
      handleMasked: 'ra••••@okhdfc',
      maxAmountPaise: 100000,
    },
    prep: null,
    support: { whatsappUrl: 'https://wa.me/910000000000' },
    ...overrides,
  } as VisitDetailDto;
}

const COOK = {
  cookId: 'cook-1',
  displayName: 'Cook Meera',
  profileImageUrl: 'https://img/meera.jpg',
  rating: { average: 4.8, count: 12 },
};

const PROFILE = {
  cook: {
    cookId: 'cook-1',
    displayName: 'Cook Meera',
    region: 'West Bengal',
    languages: ['Hindi', 'Bengali'],
    visitsWithYou: 7,
    rating: { average: 4.8, count: 12 },
    profileImageUrl: 'https://img/meera.jpg',
  },
  available: true,
  inPool: true,
  addedAt: null,
  dishesByCategory: [],
} as unknown as PoolCookProfileDto;

const CARD = {
  cookId: 'cook-1',
  name: 'Cook Meera',
  details: [],
  stats: [],
  inPool: true,
  menu: [{ id: 'veg', title: 'Veg', dishes: [{ id: 'dal', name: 'Dal tadka' }] }],
} as CookProfile;

function sources(overrides: Partial<VisitDetailsSources> = {}): VisitDetailsSources {
  return {
    visit: visit(),
    booking: null,
    cookProfile: null,
    cookCard: null,
    pool: null,
    quote: null,
    todayId: TODAY,
    ...overrides,
  };
}

describe('visitDetailsFrom', () => {
  it('writes the banner as the frames do, with days to go while the cook is pending', () => {
    const model = visitDetailsFrom(sources());
    expect(model.variant).toBe('pending');
    expect(model.banner).toEqual({
      date: 'Wed, 14 Oct',
      slot: '9:00 AM – 10:00 AM · 1 hr',
      daysToGo: '6',
    });
  });

  it('confirms the cook by the visit’s T−3h, over pool cooks that are available', () => {
    const pool = {
      cooks: [
        { cook: { cookId: 'a', displayName: 'Cook Asha', profileImageUrl: null }, available: true },
        {
          cook: { cookId: 'b', displayName: 'Cook Bina', profileImageUrl: 'https://img/b' },
          available: false,
        },
        {
          cook: { cookId: 'c', displayName: 'Cook Chitra', profileImageUrl: 'https://img/c' },
          available: true,
        },
      ],
      count: 3,
    } as unknown as CookPoolListDto;
    const { pending } = visitDetailsFrom(sources({ pool }));
    // 00:30 UTC is 6 AM in Kolkata.
    expect(pending.title).toBe('Cook confirmed by Wed, 6 AM');
    expect(pending.pool).toEqual([
      { id: 'a', name: 'Asha' },
      { id: 'c', name: 'Chitra', photo: { uri: 'https://img/c' } },
    ]);
    // No "92% match" is invented.
    expect(pending.pool.every((cook) => cook.match === undefined)).toBe(true);
  });

  it('builds the assigned cook from the visit and their Cook Pool profile', () => {
    const model = visitDetailsFrom(
      sources({
        visit: visit({ displayState: 'cook_assigned', cook: COOK, bookingId: 'b-1' }),
        cookProfile: PROFILE,
        cookCard: CARD,
      }),
    );
    expect(model.variant).toBe('assigned');
    expect(model.cook).toMatchObject({
      name: 'Cook Meera',
      origin: 'West Bengal · Speaks Hindi, Bengali',
      visits: 'Visits with you: 7',
      rating: 'Rating: 4.8',
      photo: { uri: 'https://img/meera.jpg' },
    });
    expect(model.menu).toEqual([
      { id: 'veg', title: 'Veg', dishes: [{ id: 'dal', name: 'Dal tadka' }] },
    ]);
  });

  it('leaves out what is not known yet rather than drawing sample copy', () => {
    const model = visitDetailsFrom(
      sources({
        visit: visit({
          displayState: 'cook_assigned',
          cook: { ...COOK, rating: { average: 0, count: 0 } },
        }),
      }),
    );
    expect(model.cook.origin).toBeUndefined();
    expect(model.cook.visits).toBeUndefined();
    expect(model.cook.rating).toBeUndefined();
    expect(model.menu).toEqual([]);
  });

  it('offers the checklist only once there is a booking to save it against', () => {
    expect(visitDetailsFrom(sources()).prep).toBeNull();
    const model = visitDetailsFrom(
      sources({
        visit: visit({
          displayState: 'cook_assigned',
          cook: COOK,
          bookingId: 'b-1',
          prep: { entryApproved: true, groceriesReady: false, utensilsReady: true },
        }),
      }),
    );
    expect(model.prep?.allSet).toBe('Kitchen’s ready! Meera can start cooking right away.');
    expect(model.prepChecked).toEqual(['entry', 'utensils']);
  });

  it('prices the visit: list price struck when discounted, the total incl. GST', () => {
    const { charge, paymentSheet } = visitDetailsFrom(sources());
    expect(charge).toMatchObject({
      was: '₹399',
      amount: '₹299',
      body: expect.stringMatching(/27 hrs/),
    });
    expect(paymentSheet).toMatchObject({
      subtitle: 'Wed, 14 Oct · 9:00 AM',
      visitLine: {
        label: 'Cook visit · 1 hr',
        caption: 'Recurring · Plan 1, Visit 1',
        was: '₹338.14',
        amount: '₹253.39',
      },
      taxLine: { label: 'GST', amount: '₹45.61' },
      total: '₹299',
      methodDetail: 'ra••••@okhdfc · Mandate active',
    });
  });

  it('opens Modify booking from the quote while the visit can be cancelled free', () => {
    const quote = {
      visitId: 'visit-1',
      cancellable: true,
      window: 1,
      feePercent: 0,
      feePaise: 0,
      refundPaise: 0,
      chargedPaise: 0,
      nothingCharged: true,
    } as VisitCancellationQuoteDto;
    const { modifySheet } = visitDetailsFrom(sources({ quote }));
    expect(modifySheet).toMatchObject({
      subtitle: 'Wed, 14 Oct · 9:00 AM · Cook pending',
      windowTitle: 'Free changes till Wed, 14 Oct · 6:00 AM',
      note: 'Your other visits in Plan 1 stay as they are.',
    });
    expect(
      visitDetailsFrom(sources({ quote: { ...quote, cancellable: false } })).modifySheet,
    ).toBeNull();
    expect(visitDetailsFrom(sources()).modifySheet).toBeNull();
  });

  it('shows the refund for a visit cancelled after its charge', () => {
    const model = visitDetailsFrom(
      sources({
        visit: visit({
          displayState: 'cancelled',
          status: 'cancelled',
          cancelledBy: 'customer',
          payment: {
            bookingId: 'b-1',
            pricePaise: 25339,
            gstPaise: 4561,
            totalPaise: 29900,
            chargedAt: '2026-10-14T00:30:00.000Z',
            mode: 'upi_autopay',
          },
          cancellation: {
            cancelledBy: 'customer',
            cancelledAt: '2026-10-14T01:10:00.000Z',
            window: 3,
            reasonCode: 'URGENT_CHANGE',
            feePercent: 50,
            feePaise: 14950,
            refundPaise: 14950,
            refundStatus: 'refunded',
            nothingCharged: false,
          },
        }),
      }),
    );
    expect(model.cancelled.byline).toBe('By you · Wed, 14 Oct, 6:40 AM');
    expect(model.refund).toMatchObject({
      badge: 'Refunded',
      lines: [
        { label: 'Amount paid', amount: '₹299', was: '₹399' },
        { label: 'Cancellation fee (50%)', amount: '– ₹149.50', minor: true },
      ],
      total: { label: 'Refund amount', amount: '₹149.50' },
      mode: 'UPI · ra••••@okhdfc',
      steps: [
        { title: 'Refund initiated', when: 'Wed, 14 Oct' },
        { title: 'It takes 5-7 working days for the amount to get credited to source', note: true },
      ],
    });
    expect(model.refund?.refundId).toBeUndefined();
    expect(model.refund?.booking).toBeUndefined();
  });

  it('says nothing was charged for a visit cancelled before its charge', () => {
    const model = visitDetailsFrom(
      sources({
        visit: visit({
          displayState: 'cancelled',
          status: 'cancelled',
          cancelledBy: 'customer',
          cancellation: {
            cancelledBy: 'customer',
            cancelledAt: '2026-10-09T05:00:00.000Z',
            window: 1,
            reasonCode: 'URGENT_CHANGE',
            feePercent: 0,
            feePaise: 0,
            refundPaise: 0,
            refundStatus: null,
            nothingCharged: true,
          },
        }),
      }),
    );
    expect(model.refund).toBeNull();
    expect(model.charge).toMatchObject({
      amount: '₹0',
      body: expect.stringMatching(/nothing was charged/),
    });
    expect(model.charge.was).toBeUndefined();
  });

  it('points "Your plan continues" at the plan’s next visit, or leaves it out', () => {
    const cancelled = visit({ displayState: 'cancelled', status: 'cancelled' });
    const booking = {
      upNext: { visitId: 'visit-2', date: '2026-10-16', startTime: '09:00' },
    } as unknown as RecurringBookingDto;
    expect(visitDetailsFrom(sources({ visit: cancelled, booking })).cancelled.nextVisit).toBe(
      'Next visit · Fri, 16 Oct, 9:00 AM',
    );
    expect(visitDetailsFrom(sources({ visit: cancelled })).cancelled.nextVisit).toBeNull();
  });

  it('notes GST at the rate priced in', () => {
    // ₹45.61 on ₹253.39 is 18%; the frames' "+ 5% GST" is sample copy.
    expect(visitDetailsFrom(sources()).charge.taxNote).toBe('+ 18% GST');
  });

  it('hides the recipe row without a WhatsApp link to share on', () => {
    expect(visitDetailsFrom(sources()).recipe).not.toBeNull();
    expect(
      visitDetailsFrom(sources({ visit: visit({ support: { whatsappUrl: null } }) })).recipe,
    ).toBeNull();
  });
});

describe('visitWhatsAppLink', () => {
  const text = (link: string | null) =>
    link === null ? null : decodeURIComponent(link.split('?text=')[1] ?? '');

  it('prefills Help the way the note writes it, on the backend’s number', () => {
    const link = visitWhatsAppLink(
      visit({
        cook: COOK,
        support: { whatsappUrl: 'https://wa.me/910000000000?text=Hi%20Spoon' },
      }),
      'help',
    );
    expect(link?.startsWith('https://wa.me/910000000000?text=')).toBe(true);
    expect(text(link)).toBe(
      'Hi Spoon, I need help with my visit · Wed, 14 Oct, 9:00 AM · Cook Meera.',
    );
  });

  it('names the booking once the visit has one', () => {
    const link = visitWhatsAppLink(
      visit({ cook: COOK, bookingId: 'bk-42', support: { whatsappUrl: 'https://wa.me/91' } }),
      'help',
    );
    expect(text(link)).toBe(
      'Hi Spoon, I need help with booking bk-42 · Wed, 14 Oct, 9:00 AM · Cook Meera.',
    );
  });

  it('leaves out a cook not yet assigned, and words Share for the recipe', () => {
    expect(text(visitWhatsAppLink(visit(), 'recipe'))).toBe(
      'Hi Spoon, I have a recipe/dish in mind for my visit · Wed, 14 Oct, 9:00 AM.',
    );
  });

  it('gives no link when no support number is configured', () => {
    expect(visitWhatsAppLink(visit({ support: { whatsappUrl: null } }), 'help')).toBeNull();
  });
});

describe('dayLabel', () => {
  it('writes a date the way the frames do', () => {
    expect(['2026-10-14', '2026-09-28', '2026-10-01'].map(dayLabel)).toEqual([
      'Wed, 14 Oct',
      'Mon, 28 Sept',
      'Thu, 1 Oct',
    ]);
  });
});

describe('rating a visit', () => {
  it('heads the card with the meal, the cook and the slot', () => {
    expect(rateVisitInfo(visit({ cook: COOK, timeOfDay: 'afternoon' }))).toEqual({
      title: 'Lunch with Cook Meera',
      meta: 'Wed, 14 Oct · 9:00 AM · 1 hr',
      cookName: 'Meera',
      photoUri: 'https://img/meera.jpg',
    });
    expect(rateVisitInfo(visit())).toBeNull();
  });

  it('sends 5+ as five stars marked exceptional', () => {
    expect(ratingRequestFor({ rating: '5+', chips: [] }, '')).toEqual({
      stars: 5,
      exceptional: true,
    });
    expect(ratingRequestFor({ rating: 4.5, chips: [] }, '')).toEqual({ stars: 4.5 });
  });

  it('carries the note, then the picked chips under the card’s own question', () => {
    expect(ratingRequestFor({ rating: 4.5, chips: ['taste', 'onTime'] }, '  Lovely dal ')).toEqual({
      stars: 4.5,
      feedback: 'Lovely dal\n\nWhat stood out? Taste, On time',
    });
    expect(ratingRequestFor({ rating: 2, chips: ['slow', 'oil'] }, '')).toEqual({
      stars: 2,
      feedback: 'What went wrong? Slow, Too much oil',
    });
  });
});
