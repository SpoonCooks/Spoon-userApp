import { catalogueDurationSchema, priceForSlot } from './schemas';

const BASE = {
  durationMinutes: 60,
  serviceAmountPaise: 12_900,
  taxAmountPaise: 645,
  totalAmountPaise: 13_545,
  latestStartLocalMinute: 1260,
};

describe('priceForSlot', () => {
  it('reads each booking type its own price when the backend sends them', () => {
    const duration = catalogueDurationSchema.parse({
      ...BASE,
      bySlotType: {
        instant: { serviceAmountPaise: 14_900, taxAmountPaise: 745, totalAmountPaise: 15_645 },
        scheduled: { serviceAmountPaise: 9_900, taxAmountPaise: 495, totalAmountPaise: 10_395 },
      },
    });

    expect(priceForSlot(duration, 'instant').serviceAmountPaise).toBe(14_900);
    expect(priceForSlot(duration, 'scheduled').totalAmountPaise).toBe(10_395);
  });

  it('falls back to the top-level price from a backend that predates per-type prices', () => {
    const duration = catalogueDurationSchema.parse(BASE);

    expect(duration.bySlotType).toBeUndefined();
    expect(priceForSlot(duration, 'instant')).toEqual({
      serviceAmountPaise: 12_900,
      taxAmountPaise: 645,
      totalAmountPaise: 13_545,
    });
    expect(priceForSlot(duration, 'scheduled').serviceAmountPaise).toBe(12_900);
  });
});

describe('strikePricePaise', () => {
  it('passes the backend strike through per booking type, null included', () => {
    const duration = catalogueDurationSchema.parse({
      ...BASE,
      strikePricePaise: 30_000,
      bySlotType: {
        instant: {
          serviceAmountPaise: 14_900,
          taxAmountPaise: 745,
          totalAmountPaise: 15_645,
          strikePricePaise: null,
        },
        scheduled: {
          serviceAmountPaise: 12_900,
          taxAmountPaise: 645,
          totalAmountPaise: 13_545,
          strikePricePaise: 30_000,
        },
      },
    });

    expect(priceForSlot(duration, 'instant').strikePricePaise).toBeNull();
    expect(priceForSlot(duration, 'scheduled').strikePricePaise).toBe(30_000);
  });

  it('leaves it absent for a backend that predates it', () => {
    expect(priceForSlot(catalogueDurationSchema.parse(BASE), 'instant')).not.toHaveProperty(
      'strikePricePaise',
    );
  });
});
