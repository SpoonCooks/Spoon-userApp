/**
 * Fixture data for the recurring live booking "Visit details" screen, read verbatim off Figma
 * `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`: `1008:5398` (Cook assigned), `1466:8275` (Cook
 * pending), `1466:8639` (Completed), `1466:8446` (Cancelled) and the before-arrival prep states
 * `1441:1808` / `1441:1853` / `1441:1898`. STATIC ONLY — nothing here comes from a backend.
 */

/** Which of the four Visit details frames the screen draws. */
export type VisitVariant = 'assigned' | 'pending' | 'completed' | 'cancelled';

/** How many of the three prep checks start ticked — the frames draw 0, 1 and 3. */
export type VisitPrepReady = 0 | 1 | 2 | 3;

export type VisitPrepKey = 'entry' | 'groceries' | 'utensils';

export interface VisitPrepItem {
  readonly key: VisitPrepKey;
  readonly label: string;
}

export interface VisitPoolCook {
  readonly key: 'sanchita' | 'jyoti' | 'rekha';
  readonly name: string;
  readonly match: string;
}

export interface VisitRefundLine {
  readonly label: string;
  readonly detail: string;
  readonly was?: string;
  readonly amount: string;
}

export interface VisitRefundStep {
  readonly title: string;
  readonly when: string;
}

export const VISIT_FIXTURE = {
  /** `1461:6164` / `1461:6166` — the banner's date and slot. */
  date: 'Wed, 14 Oct',
  slot: '9:00 AM – 10:00 AM · 1 hr',
  /** `1443:478` — the pending banner's countdown. */
  daysToGo: '10',

  /** `1463:7966` — the assigned cook. */
  cook: {
    eyebrow: 'SPOON TRAINED · VERIFIED',
    name: 'Cook Sanchita',
    origin: 'West Bengal · Speaks Hindi, Bengali',
    visits: 'Visits with you: 45',
    rating: 'Your rating: 4.5',
    note: 'Cook from your Pool. If plans change, we’ll notify you',
  },
  /** `1380:3076` — five carousels, each the same section and three of the same dish. */
  menu: {
    sections: ['veg-1', 'veg-2', 'veg-3', 'veg-4', 'veg-5'] as const,
    sectionTitle: 'Curries/ sabzis- Veg',
    dishName: 'Dahi bhindi',
    dishesPerSection: 3,
  },

  /** `1466:8280` — the pending cook pool. */
  pending: {
    note: 'We’ll notify you the moment your cook is confirmed',
    eyebrow: 'FROM YOUR COOK POOL',
    title: 'Cook confirmed by Mon, 8 PM',
    body: 'We’re picking the best fit for your kitchen from cooks who’ve cooked for you before.',
    pool: [
      { key: 'sanchita', name: 'Sanchita', match: '92% match' },
      { key: 'jyoti', name: 'Jyoti', match: '88% match' },
      { key: 'rekha', name: 'Rekha', match: '85% match' },
    ] as readonly VisitPoolCook[],
    cta: 'View Cook Pool',
  },

  /** `1466:8451` — the cancelled visit. */
  cancelled: {
    title: 'Visit cancelled',
    byline: 'By you · Thu, 1 Oct, 6:40 PM',
    eyebrow: 'YOUR PLAN CONTINUES',
    nextVisit: 'Next visit · Fri, 16 Oct, 9:00 AM',
  },

  /** `1454:7956` — the recipe share row. */
  recipe: {
    title: 'Have a recipe/dish in mind?',
    body: 'Share with us & we’ll brief her before the visit on your behalf!',
    cta: 'Share',
  },

  /** `1444:718` — the before-arrival checklist. */
  prep: {
    title: 'Before the Cook arrives',
    items: [
      { key: 'entry', label: 'Entry approved' },
      { key: 'groceries', label: 'Groceries ready' },
      { key: 'utensils', label: 'Utensils handy' },
    ] as readonly VisitPrepItem[],
    idleHint: 'Tap when done',
    doneHint: 'Done',
    why: 'Your slot begins the moment your cook checks in, having essentials ready means more time for cooking and more dishes on the table',
    allSet: 'Kitchen’s ready! Sanchita can start cooking the moment she walks in.',
  },

  /** `1374:1409` — the visit charge. */
  charge: {
    eyebrow: 'VISIT CHARGE',
    was: '₹399',
    amount: '₹299',
    taxNote: 'incl. taxes',
    title: 'Pay per visit',
    /** `1374:1421` — Cook assigned. */
    bodyAssigned: 'Auto-charged via UPI AutoPay once cooking is done. Nothing is charged today.',
    /** `1466:8294` — Cook pending and Completed. */
    bodyNotice:
      'You’d be notified 27 hrs before & payment is auto-debited 3 hrs before the service time.',
  },

  /** `1468:807` — Payment summary · Cancelled · Refunded. */
  refund: {
    title: 'Payment & refund',
    booking: 'Booking #SP24817',
    badge: 'Refunded',
    lines: [
      {
        label: 'Amount paid',
        detail: 'Cook visit 1 hr ₹253.39 + GST ₹45.61',
        was: '₹399',
        amount: '₹299',
      },
      {
        label: 'Cancellation fee',
        detail: 'Cancelled more than 3 hrs before the visit',
        amount: '– ₹0',
      },
    ] as readonly VisitRefundLine[],
    total: {
      label: 'Refund amount',
      detail: 'Full refund, inclusive of taxes',
      was: '₹399',
      amount: '₹299',
    } as VisitRefundLine,
    modeEyebrow: 'REFUND TO',
    mode: 'UPI · ••••@okhdfcbank',
    idEyebrow: 'REFUND ID',
    refundId: 'RFD24817',
    steps: [
      { title: 'Refund initiated', when: 'Thu, 1 Oct · 6:41 PM' },
      { title: 'Credited to ••••@okhdfcbank', when: 'Sat, 3 Oct · 11:20 AM' },
    ] as readonly VisitRefundStep[],
  },
} as const;
