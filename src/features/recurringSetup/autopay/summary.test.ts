import { autopaySummary, summaryFromPlans } from './summary';

describe('autopaySummary', () => {
  it('reads as the frames do, with the ₹1 refunded authorisation and no em dash', () => {
    const summary = autopaySummary({
      plansCount: 2,
      visitsCount: 12,
      prices: [{ pricePaise: 29_900, gstPaise: 1_495 }],
      maxChargePaise: 100_000,
    });
    expect(summary).toEqual({
      plansLine: '2 plans · 12 visits',
      chargeLine: 'Charged 3 hrs before your first visit of the day',
      price: '₹299',
      priceWithTax: '₹299 + 5% tax',
      subtitle: '₹1 to approve, refunded · up to ₹1,000 per charge',
    });
    expect(JSON.stringify(summary)).not.toContain('—');
  });

  it('shows a range when visits are priced differently, and singular counts', () => {
    const summary = autopaySummary({
      plansCount: 1,
      visitsCount: 1,
      prices: [
        { pricePaise: 19_900, gstPaise: 995 },
        { pricePaise: 29_900, gstPaise: 1_495 },
      ],
      maxChargePaise: 100_000,
    });
    expect(summary.plansLine).toBe('1 plan · 1 visit');
    expect(summary.price).toBe('₹199–₹299');
  });

  it('counts each visit on its own days and prices it by its duration', () => {
    const summary = summaryFromPlans(
      [
        {
          id: 'p1',
          dayIds: ['2026-10-20', '2026-10-21', '2026-10-22'],
          visits: [
            { timeOfDay: 'morning', durationId: 'd60', startMinutes: 540 },
            { timeOfDay: 'evening', durationId: 'd60', startMinutes: 1080, dayIds: ['2026-10-21'] },
          ],
        },
      ],
      {
        durations: [
          {
            durationMinutes: 60,
            basePricePaise: 30_000,
            pricePaise: 29_900,
            gstPaise: 1_495,
            totalPaise: 31_395,
            pricingVersion: 'p',
          },
        ],
        charging: {
          notifyLeadHours: 27,
          debitLeadHours: 3,
          mandateMaxChargePaise: 100_000,
          mandateFlow: 'upi_intent',
        },
      },
    );
    expect(summary.plansLine).toBe('1 plan · 4 visits');
    expect(summary.price).toBe('₹299');
  });
});
