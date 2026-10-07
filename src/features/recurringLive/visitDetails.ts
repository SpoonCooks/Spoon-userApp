import type { ImageSourcePropType } from 'react-native';

import { formatPaise } from '@core/format';
import type { CookPoolListDto, CookProfile, PoolCookProfileDto } from '@features/cookPool';
import type {
  RecurringBookingDto,
  VisitCancellationQuoteDto,
  VisitDetailDto,
} from '@features/recurringSetup';

import { clockText, durationText } from './adapters';
import type { RateVisitInfo, RateVisitSubmission } from './components/rating/RateVisitCard';
import {
  RATING_CHIPS_NEGATIVE,
  RATING_CHIPS_POSITIVE,
  VISIT_RATING_PLUS,
  ratingTier,
  ratingTierCopy,
} from './data/rating';
import { REFUND_CREDIT_NOTE, VISIT_FIXTURE } from './data/visit';
import type {
  VisitDetailsModel,
  VisitMenuSection,
  VisitPrepKey,
  VisitRefundData,
  VisitVariant,
} from './data/visit';

/**
 * One Recurring visit (`GET /v1/me/recurring-bookings/{id}/visits/{visitId}`) → Visit details.
 * Pure, so every rule is testable without a network.
 *
 *   variant      the backend's `displayState`: cook_assigned / cook_pending / completed / cancelled
 *   banner       "Wed, 14 Oct" · "9:00 AM – 10:00 AM · 1 hr"; days to go while the cook is pending
 *   cook         the assigned cook from the visit, with region, languages, visits with you and the
 *                menu from their Cook Pool profile when it has loaded
 *   pending      "Cook confirmed by Mon, 8 PM" (the visit's T−3h) over up to three pool cooks
 *   cancelled    who cancelled and when, and the plan's next visit
 *   checklist    only once the visit has a booking to save it against (`prep`)
 *   charge       the visit's price incl. GST; what Autopay does, or did, with it
 *   refund       cancelled after the charge: paid, fee, refund, refund status and where it goes
 *   sheets       Payment details from the price and mandate; Modify booking from the cancellation
 *                quote, only while the visit can still be cancelled
 *
 * Nothing the backend does not give is filled with sample copy: no dish photos it cannot match,
 * no cook "match %", no refund id or booking reference, no Call button.
 */
export interface VisitDetailsSources {
  readonly visit: VisitDetailDto;
  /** For the plan's next visit; `null` while it loads. */
  readonly booking: RecurringBookingDto | null;
  /** The assigned cook's Cook Pool profile; `null` while it loads or for a cook no longer pooled. */
  readonly cookProfile: PoolCookProfileDto | null;
  /** `cookProfileFrom(cookProfile)` — the profile as the app draws it, for the menu. */
  readonly cookCard: CookProfile | null;
  /** The household's pool, for the faces under "Cook confirmed by". */
  readonly pool: CookPoolListDto | null;
  readonly quote: VisitCancellationQuoteDto | null;
  /** Asia/Kolkata `YYYY-MM-DD`. */
  readonly todayId: string;
}

const VARIANTS: Record<VisitDetailDto['displayState'], VisitVariant> = {
  cook_assigned: 'assigned',
  cook_pending: 'pending',
  completed: 'completed',
  cancelled: 'cancelled',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
] as const;

const KOLKATA_OFFSET_MS = 330 * 60_000;

/** An instant as its Asia/Kolkata date id and `HH:MM`. */
function kolkata(instant: string): { dateId: string; hhmm: string } {
  const iso = new Date(new Date(instant).getTime() + KOLKATA_OFFSET_MS).toISOString();
  return { dateId: iso.slice(0, 10), hhmm: iso.slice(11, 16) };
}

/** `2026-10-14` → "Wed, 14 Oct". */
export function dayLabel(dateId: string): string {
  const [year, month, day] = dateId.split('-').map(Number) as [number, number, number];
  const weekday = WEEKDAYS[(new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7];
  return `${weekday}, ${day} ${MONTHS[month - 1]}`;
}

/** "9:00 AM" → "9 AM" on the hour, as the frames write a deadline. */
const shortClock = (hhmm: string) => clockText(hhmm).replace(':00 ', ' ');

function plusMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function daysBetween(fromId: string, toId: string): number {
  return Math.round(
    (Date.parse(`${toId}T00:00:00Z`) - Date.parse(`${fromId}T00:00:00Z`)) / 86_400_000,
  );
}

/** The list price incl. GST, in proportion, when the price is discounted; else none. */
function listTotal(price: VisitDetailDto['price']): string | undefined {
  if (price.basePricePaise <= price.pricePaise || price.pricePaise === 0) return undefined;
  return formatPaise(Math.round((price.basePricePaise * price.totalPaise) / price.pricePaise));
}

const PREP_KEYS: readonly {
  key: VisitPrepKey;
  field: 'entryApproved' | 'groceriesReady' | 'utensilsReady';
}[] = [
  { key: 'entry', field: 'entryApproved' },
  { key: 'groceries', field: 'groceriesReady' },
  { key: 'utensils', field: 'utensilsReady' },
];

const NOTICE_BODY =
  'You’d be notified 27 hrs before & payment is auto-debited 3 hrs before the service time.';

export function visitDetailsFrom(sources: VisitDetailsSources): VisitDetailsModel {
  const { visit, booking, cookProfile, cookCard, pool, quote, todayId } = sources;
  const variant = VARIANTS[visit.displayState];
  const start = visit.startTime;
  const end = plusMinutes(start, visit.durationMinutes);
  const date = dayLabel(visit.date);
  const duration = durationText(visit.durationMinutes);
  const cookName = visit.cook?.displayName ?? null;
  const fixture = VISIT_FIXTURE;

  // ─── Cook (assigned) ───────────────────────────────────────────────────────────────────────
  const card = cookProfile?.cook ?? null;
  const origin = [
    card?.region ?? null,
    card !== null && card.languages.length > 0 ? `Speaks ${card.languages.join(', ')}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
  const rating = visit.cook?.rating ?? card?.rating ?? null;
  const photoUrl = visit.cook?.profileImageUrl ?? card?.profileImageUrl ?? null;
  const menu: readonly VisitMenuSection[] = (cookCard?.menu ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    dishes: section.dishes.map((dish) => ({
      id: dish.id,
      name: dish.name,
      ...(dish.image === undefined ? {} : { image: dish.image as ImageSourcePropType }),
    })),
  }));

  // ─── Pending ───────────────────────────────────────────────────────────────────────────────
  const confirmBy = kolkata(visit.cookConfirmBy);
  const poolCooks = (pool?.cooks ?? [])
    .filter((row) => row.available)
    .slice(0, 3)
    .map((row) => ({
      id: row.cook.cookId,
      name: row.cook.displayName.replace(/^Cook\s+/, ''),
      ...(row.cook.profileImageUrl === null ? {} : { photo: { uri: row.cook.profileImageUrl } }),
    }));

  // ─── Cancelled ─────────────────────────────────────────────────────────────────────────────
  const cancellation = visit.cancellation;
  const cancelledAt = cancellation === null ? null : kolkata(cancellation.cancelledAt);
  const by =
    cancellation === null
      ? ''
      : cancellation.cancelledBy === 'customer'
        ? 'By you'
        : cancellation.cancelledBy === 'payment_failed'
          ? 'Payment failed'
          : 'By Spoon';
  const next = booking?.upNext ?? null;
  const nextVisit =
    next === null || next.visitId === visit.visitId
      ? null
      : `Next visit · ${dayLabel(next.date)}, ${clockText(next.startTime)}`;

  // ─── Money ─────────────────────────────────────────────────────────────────────────────────
  const payment = visit.payment;
  const total = payment?.totalPaise ?? visit.price.totalPaise;
  const was = listTotal(visit.price);
  const chargedAt =
    payment?.chargedAt === undefined || payment.chargedAt === null
      ? null
      : kolkata(payment.chargedAt);
  const charged = cancellation !== null && !cancellation.nothingCharged;
  const chargeBody =
    variant === 'cancelled'
      ? 'Cancelled before the charge — nothing was charged for this visit.'
      : chargedAt !== null
        ? `Charged via UPI Autopay on ${dayLabel(chargedAt.dateId)}, ${clockText(chargedAt.hhmm)}.`
        : NOTICE_BODY;

  const mandate = visit.mandate;
  const refund: VisitRefundData | null =
    variant === 'cancelled' && cancellation !== null && charged
      ? {
          title: 'Payment & refund',
          badge:
            cancellation.refundStatus === 'refunded'
              ? 'Refunded'
              : cancellation.refundStatus === 'failed'
                ? 'Refund failed'
                : 'Processing',
          lines: [
            {
              label: 'Amount paid',
              detail: `Cook visit ${duration} ${formatPaise(payment?.pricePaise ?? visit.price.pricePaise)} + GST ${formatPaise(payment?.gstPaise ?? visit.price.gstPaise)}`,
              ...(was === undefined ? {} : { was }),
              amount: formatPaise(total),
            },
            {
              label:
                cancellation.feePaise === 0
                  ? 'Cancellation fee'
                  : `Cancellation fee (${cancellation.feePercent}%)`,
              amount: `– ${formatPaise(cancellation.feePaise)}`,
              minor: true,
            },
          ],
          total: {
            label: 'Refund amount',
            detail:
              cancellation.feePaise === 0
                ? 'Full refund, inclusive of taxes'
                : 'Inclusive of taxes',
            amount: formatPaise(cancellation.refundPaise),
          },
          modeEyebrow: 'REFUND TO',
          ...(mandate?.handleMasked === null || mandate === null
            ? {}
            : { mode: `UPI · ${mandate.handleMasked}` }),
          idEyebrow: 'REFUND ID',
          steps: [
            {
              title: 'Refund initiated',
              ...(cancelledAt === null ? {} : { when: dayLabel(cancelledAt.dateId) }),
            },
            ...(cancellation.refundStatus === 'failed'
              ? []
              : [{ title: REFUND_CREDIT_NOTE, note: true }]),
          ],
        }
      : null;

  const upcoming = variant === 'assigned' || variant === 'pending';
  const feeAt = confirmBy;

  return {
    variant,
    banner: {
      date,
      slot: `${clockText(start)} – ${clockText(end)} · ${duration}`,
      ...(variant === 'pending'
        ? { daysToGo: String(Math.max(0, daysBetween(todayId, visit.date))) }
        : {}),
    },
    cook: {
      eyebrow: fixture.cook.eyebrow,
      name: cookName ?? card?.displayName ?? '',
      ...(origin === '' ? {} : { origin }),
      ...(card === null ? {} : { visits: `Visits with you: ${card.visitsWithYou}` }),
      ...(rating === null || rating.count === 0
        ? {}
        : { rating: `Rating: ${rating.average.toFixed(1)}` }),
      note: fixture.cook.note,
      ...(photoUrl === null ? {} : { photo: { uri: photoUrl } }),
    },
    menu,
    pending: {
      note: fixture.pending.note,
      eyebrow: fixture.pending.eyebrow,
      title: `Cook confirmed by ${dayLabel(confirmBy.dateId).split(',')[0]}, ${shortClock(confirmBy.hhmm)}`,
      body: fixture.pending.body,
      pool: poolCooks,
      cta: fixture.pending.cta,
    },
    cancelled: {
      title: fixture.cancelled.title,
      byline:
        cancelledAt === null
          ? by
          : `${by} · ${dayLabel(cancelledAt.dateId)}, ${clockText(cancelledAt.hhmm)}`,
      eyebrow: fixture.cancelled.eyebrow,
      nextVisit,
    },
    recipe: upcoming && visit.support.whatsappUrl !== null ? { ...fixture.recipe } : null,
    prep:
      upcoming && visit.prep !== null
        ? {
            ...fixture.prep,
            allSet:
              cookName === null
                ? 'Kitchen’s ready! Your cook can start cooking the moment they arrive.'
                : `Kitchen’s ready! ${cookName.replace(/^Cook\s+/, '')} can start cooking right away.`,
          }
        : null,
    prepChecked:
      visit.prep === null ? [] : PREP_KEYS.filter((p) => visit.prep![p.field]).map((p) => p.key),
    charge: {
      eyebrow: fixture.charge.eyebrow,
      ...(was === undefined || variant === 'cancelled' ? {} : { was }),
      amount: variant === 'cancelled' && !charged ? formatPaise(0) : formatPaise(total),
      // The frames' "+ 5% GST", at the rate actually priced in.
      taxNote:
        visit.price.pricePaise > 0
          ? `+ ${Math.round((visit.price.gstPaise / visit.price.pricePaise) * 100)}% GST`
          : fixture.charge.taxNote,
      title: fixture.charge.title,
      body: chargeBody,
    },
    refund,
    paymentSheet: {
      title: 'Payment details',
      subtitle: `${date} · ${clockText(start)}`,
      visitLine: {
        label: `Cook visit · ${duration}`,
        caption: `Recurring · Plan ${visit.planNumber}, Visit ${visit.visitNumber}`,
        ...(visit.price.basePricePaise > visit.price.pricePaise
          ? { was: formatPaise(visit.price.basePricePaise) }
          : {}),
        amount: formatPaise(payment?.pricePaise ?? visit.price.pricePaise),
      },
      taxLine: { label: 'GST', amount: formatPaise(payment?.gstPaise ?? visit.price.gstPaise) },
      totalLabel: 'Total',
      totalCaption: 'Inclusive of all taxes',
      total: formatPaise(total),
      methodEyebrow: 'MODE OF PAYMENT',
      methodName: 'UPI Autopay',
      methodDetail:
        mandate === null
          ? 'Mandate pending'
          : `${mandate.handleMasked ?? 'UPI'} · Mandate ${mandate.status}`,
      manageLabel: 'Manage',
      reminder:
        'Mandate is shared 27 hrs before & payment is auto-debited 3 hrs before the service time.',
    },
    modifySheet:
      upcoming && quote !== null && quote.cancellable
        ? {
            title: 'Modify booking',
            subtitle: `${date} · ${clockText(start)} · ${cookName ?? 'Cook pending'}`,
            windowTitle:
              quote.feePaise === 0
                ? `Free changes till ${dayLabel(feeAt.dateId)} · ${clockText(feeAt.hhmm)}`
                : `Cancelling now costs ${formatPaise(quote.feePaise)}`,
            steps: [
              { kind: 'now', title: 'Now', caption: 'Today' },
              {
                kind: 'fee',
                title: 'Cancellation fee',
                caption: `${dayLabel(feeAt.dateId).split(',')[0]}, ${clockText(feeAt.hhmm)}`,
              },
              {
                kind: 'visit',
                title: 'Visit',
                caption: `${dayLabel(visit.date).split(',')[0]}, ${clockText(start)}`,
              },
            ],
            note: `Your other visits in Plan ${visit.planNumber} stay as they are.`,
            cancelLabel: 'Cancel this visit',
          }
        : null,
  };
}

/**
 * `Note · Help deep link` — Help (and Share on the recipe row) go straight to WhatsApp with Spoon,
 * prefilled: "Hi Spoon, I need help with booking #SP24817 · Wed, 14 Oct, 9:00 AM · Cook Sanchita."
 * The number is the backend's (`support.whatsappUrl`, null when none is configured); the message is
 * written here in the note's shape. There is no customer-facing booking reference, so "my visit"
 * stands in for "booking #…", and a visit with no cook yet leaves the cook out.
 */
export function visitWhatsAppLink(
  visit: VisitDetailDto,
  purpose: 'help' | 'recipe',
): string | null {
  const url = visit.support.whatsappUrl;
  if (url === null) return null;
  const opening =
    purpose === 'help'
      ? 'Hi Spoon, I need help with my visit'
      : 'Hi Spoon, I have a recipe/dish in mind for my visit';
  const parts = [opening, `${dayLabel(visit.date)}, ${clockText(visit.startTime)}`];
  if (visit.cook !== null) parts.push(visit.cook.displayName);
  return `${url.split('?')[0] ?? url}?text=${encodeURIComponent(`${parts.join(' · ')}.`)}`;
}

const MEALS = { morning: 'Breakfast', afternoon: 'Lunch', evening: 'Dinner' } as const;

/**
 * The rate card's header for a real visit (`1501:6631`: "Lunch with Cook Rekha" over
 * "Sun, 12 Apr · 1:15 PM · 1 hr"). Null with no cook — there is no one to rate.
 */
export function rateVisitInfo(visit: VisitDetailDto): RateVisitInfo | null {
  if (visit.cook === null) return null;
  return {
    title: `${MEALS[visit.timeOfDay]} with ${visit.cook.displayName}`,
    meta: `${dayLabel(visit.date)} · ${clockText(visit.startTime)} · ${durationText(visit.durationMinutes)}`,
    cookName: visit.cook.displayName.replace(/^Cook\s+/, ''),
    photoUri: visit.cook.profileImageUrl,
  };
}

const FEEDBACK_MAX = 2000;

/**
 * What `PUT /v1/bookings/:id/rating` is sent for a rate-card submission. The endpoint takes stars
 * (1–5 in halves), `exceptional` for 5+ — which is 5 stars, never a sixth — and free text. The
 * card's chips have no field of their own yet, so they ride in the text after the customer's
 * note, under the card's own question: "What stood out? Taste, On time".
 */
export function ratingRequestFor(
  submission: RateVisitSubmission,
  note: string,
): { readonly stars: number; readonly exceptional?: true; readonly feedback?: string } {
  const plus = submission.rating === VISIT_RATING_PLUS;
  const stars = plus ? 5 : (submission.rating as number);
  const tier = ratingTier(submission.rating);
  const low = tier === 'belowPar' || tier === 'disappointing' || tier === 'veryPoor';
  const chips = (low ? RATING_CHIPS_NEGATIVE : RATING_CHIPS_POSITIVE)
    .filter((chip) => submission.chips.includes(chip.key))
    .map((chip) => chip.label);
  const question = tier === 'idle' ? '' : ratingTierCopy('')[tier].chipsLabel;
  const parts = [
    note.trim(),
    chips.length === 0 ? '' : `${question} ${chips.join(', ')}`.trim(),
  ].filter((part) => part !== '');
  const feedback = parts.join('\n\n').slice(0, FEEDBACK_MAX);
  return {
    stars,
    ...(plus ? { exceptional: true as const } : {}),
    ...(feedback === '' ? {} : { feedback }),
  };
}
