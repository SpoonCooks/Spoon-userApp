import { formatPaise, formatPaiseGrouped } from '@core/format';

import type { RecurringBookingDto, RecurringEligibilityDto } from '../api';
import { durationMinutes } from '../data';
import type { RecurringPlanDraft } from '../types';
import type { AutopaySheetSummary } from './AutopaySheet';

/**
 * What the Autopay sheet says about the booking (Figma `2316:3581` plan card, `2316:3580`
 * subtitle, `2317:4089` Active's "Per visit"), from the quote (Book Now) or the saved booking
 * (re-approve). Every amount is the server's; only the display is made here.
 */

/**
 * V0 recurring policy `mandateAuthAmountPaise`: the ₹1 authorisation UPI Autopay takes on
 * approval and Spoon refunds once the mandate is confirmed. The quote does not carry it; the
 * mandate response does (`amountPaise`), after the sheet has opened.
 */
export const MANDATE_AUTH_PAISE = 100;

export interface AutopayPriceInput {
  readonly pricePaise: number;
  readonly gstPaise: number;
}

function plural(count: number, one: string, many: string): string {
  return `${String(count)} ${count === 1 ? one : many}`;
}

export function autopaySummary(input: {
  readonly plansCount: number;
  readonly visitsCount: number;
  readonly prices: readonly AutopayPriceInput[];
  readonly maxChargePaise: number;
  readonly authAmountPaise?: number;
}): AutopaySheetSummary {
  const amounts = input.prices.map((price) => price.pricePaise);
  const min = amounts.length === 0 ? 0 : Math.min(...amounts);
  const max = amounts.length === 0 ? 0 : Math.max(...amounts);
  const price = min === max ? formatPaise(min) : `${formatPaise(min)}–${formatPaise(max)}`;
  const first = input.prices[0];
  // The GST rate as the server applied it, read off the first visit (one rate for the booking).
  const rate =
    first === undefined || first.pricePaise === 0
      ? null
      : Math.round((first.gstPaise / first.pricePaise) * 100);
  return {
    plansLine: `${plural(input.plansCount, 'plan', 'plans')} · ${plural(input.visitsCount, 'visit', 'visits')}`,
    // Figma 2316:3587 reworded: same-day visits are combined into one debit (user, 2026-10-13).
    chargeLine: 'Charged 3 hrs before your first visit of the day',
    price,
    priceWithTax: rate === null || rate === 0 ? price : `${price} + ${String(rate)}% tax`,
    subtitle: `${formatPaise(input.authAmountPaise ?? MANDATE_AUTH_PAISE)} to approve, refunded · up to ${formatPaiseGrouped(input.maxChargePaise)} per charge`,
  };
}

/** Book Now: the plans as drafted, priced with the eligibility read's per-duration prices. */
export function summaryFromPlans(
  plans: readonly RecurringPlanDraft[],
  eligibility: Pick<RecurringEligibilityDto, 'durations' | 'charging'> | null,
): AutopaySheetSummary {
  const prices: AutopayPriceInput[] = [];
  let visitsCount = 0;
  for (const plan of plans) {
    plan.visits.forEach((visit, index) => {
      visitsCount +=
        index === 0 || visit.dayIds === undefined ? plan.dayIds.length : visit.dayIds.length;
      const price = eligibility?.durations.find(
        (duration) => duration.durationMinutes === durationMinutes(visit.durationId),
      );
      if (price !== undefined) prices.push(price);
    });
  }
  return autopaySummary({
    plansCount: plans.length,
    visitsCount,
    prices,
    maxChargePaise: eligibility?.charging.mandateMaxChargePaise ?? DEFAULT_MAX_CHARGE_PAISE,
  });
}

/** Re-approve: the saved booking's own plans and prices. */
export function summaryFromBooking(booking: RecurringBookingDto): AutopaySheetSummary {
  return autopaySummary({
    plansCount: booking.plans.length,
    visitsCount: booking.counts.toGo,
    prices: booking.plans.flatMap((plan) => plan.visits.map((visit) => visit.price)),
    maxChargePaise: booking.mandate?.maxAmountPaise ?? DEFAULT_MAX_CHARGE_PAISE,
  });
}

/** The spec's ₹1,000 per-debit ceiling, until the eligibility read has answered. */
const DEFAULT_MAX_CHARGE_PAISE = 100_000;
