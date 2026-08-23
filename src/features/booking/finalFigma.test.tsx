import { render, screen } from '@testing-library/react-native';

import { durationLabelFor } from './data';
import { tipAmountPaiseFrom, tipIdFor, tipSheetFrom } from './adapters';
import { ConfirmationBody } from './components/ConfirmationBody';
import { DEMO_BOOKING_CONFIRMATION } from '@/demo/fixtures/booking';
import type { BookingSummaryViewModel } from './types';

/**
 * The behaviours the FINAL Figma pass introduced, pinned so they cannot silently regress.
 *
 * Each block names the task section it enforces, because several of them look like arbitrary
 * formatting until you know which frame they came from.
 */

/* ------------------------------------------------------------------ §2 / §9 duration labels */

describe('durationLabelFor — `1:728` writes hours, not minutes, from an hour up', () => {
  it('keeps sub-hour durations in minutes', () => {
    expect(durationLabelFor(30)).toBe('30 min');
    expect(durationLabelFor(45)).toBe('45 min');
  });

  it('writes the HALF hours as hours, which is the defect this pass fixed', () => {
    // The previous rule converted only exact multiples of 60, so the server's 90 and 150 minute
    // options were drawn "90 min" / "150 min" against the frame's "1.5 hr" / "2.5 hrs".
    expect(durationLabelFor(90)).toBe('1.5 hr');
    expect(durationLabelFor(150)).toBe('2.5 hrs');
  });

  it('writes whole hours without a decimal', () => {
    expect(durationLabelFor(60)).toBe('1 hr');
    expect(durationLabelFor(120)).toBe('2 hr');
  });
});

/* ------------------------------------------------------------------ §14 tip amounts */

describe('tip amounts — the catalogue owns them (§14, §16)', () => {
  const base = {
    title: 'Tip Cook',
    sectionTitle: 'Share an amount',
    options: [{ id: 'tip-2500', label: '₹25' }],
    ctaLabel: 'Tip',
    note: { title: 'n', body: 'b' },
  } as const;

  it('offers exactly the amounts the catalogue publishes', () => {
    const sheet = tipSheetFrom({
      base,
      suggestedAmountsPaise: [2000, 5000, 10000, 15000],
      formatAmount: (paise) => `₹${paise / 100}`,
    });

    expect(sheet.options.map((option) => option.label)).toEqual(['₹20', '₹50', '₹100', '₹150']);
  });

  it('preselects the DRAWN default only when the server still offers it', () => {
    const withFifty = tipSheetFrom({
      base,
      suggestedAmountsPaise: [2000, 5000],
      formatAmount: (paise) => `₹${paise / 100}`,
    });
    expect(withFifty.defaultOptionId).toBe(tipIdFor(5000));
    // The CTA names the same figure it preselected — it can never quote an amount not offered.
    expect(withFifty.ctaLabel).toBe('Tip • ₹50');

    const withoutFifty = tipSheetFrom({
      base,
      suggestedAmountsPaise: [2000, 7000],
      formatAmount: (paise) => `₹${paise / 100}`,
    });
    expect(withoutFifty.defaultOptionId).toBeUndefined();
  });

  it('keeps the designed copy when the catalogue publishes no amounts', () => {
    const sheet = tipSheetFrom({
      base,
      suggestedAmountsPaise: [],
      formatAmount: (paise) => `₹${paise / 100}`,
    });
    expect(sheet).toBe(base);
  });

  it('round-trips an id back to the paise that will be sent', () => {
    expect(tipAmountPaiseFrom(tipIdFor(5000))).toBe(5000);
    expect(tipAmountPaiseFrom('not-a-tip')).toBeNull();
    expect(tipAmountPaiseFrom(null)).toBeNull();
  });
});

/* ------------------------------------------------------------------ §15 share recipe */

describe('Confirmation — the `383:743` share-recipe row (§15)', () => {
  const summary = DEMO_BOOKING_CONFIRMATION.summary as BookingSummaryViewModel;

  it('draws the row, with its WhatsApp affordance, when a handler is supplied', () => {
    render(<ConfirmationBody summary={summary} onShareRecipe={() => undefined} />);

    expect(screen.getByTestId('confirmation-share-recipe')).toBeTruthy();
    expect(screen.getByText('Share recipe/ special requests')).toBeTruthy();
  });

  it('draws NOTHING without one — a chat row that cannot open a chat is the inert Help §15 forbids', () => {
    render(<ConfirmationBody summary={summary} />);

    expect(screen.queryByTestId('confirmation-share-recipe')).toBeNull();
  });
});
