import type {
  BookingDetailViewModel,
  ExtensionViewModel,
  InstantViewModel,
} from '@features/booking';
import type { ScheduleViewModel } from '@features/scheduled';

import { DEMO_COOK_REKHA } from './cooks';

/**
 * DEMO / TEST FIXTURES — NOT PRODUCTION DATA.
 *
 * Transcribed from the audited frames. Every price, slot, duration, ETA and OTP here is SAMPLE
 * DATA standing in for a server payload — none of it is a rule, a default or a constant. In
 * particular the three days below are not a booking horizon (blocker B-8), and the disabled
 * slots are not an availability rule.
 */

/** `1:728` Instant sheet — available. */
export const DEMO_INSTANT_AVAILABLE: InstantViewModel = {
  title: 'Instant',
  etaCaption: 'Arriving in',
  etaLabel: '18 mins',
  durations: [
    { id: 'dur-30', label: '30 min', price: '₹69', strikePrice: '₹150' },
    { id: 'dur-45', label: '45 min', price: '₹99', strikePrice: '₹225' },
    { id: 'dur-60', label: '1 hr', price: '₹129', strikePrice: '₹300' },
    { id: 'dur-90', label: '1.5 hr', price: '₹189', strikePrice: '₹450', badge: 'Popular' },
    { id: 'dur-120', label: '2 hr', price: '₹259', strikePrice: '₹600' },
    { id: 'dur-150', label: '2.5 hrs', price: '₹319', strikePrice: '₹750', disabled: true },
  ],
  ctaLabel: 'Book Now • ₹198',
  paymentDetailsLabel: 'Check payment details',
  taxesInfo: {
    title: 'What is Taxes?',
    body: 'Taxes levied as per Govt. regulations, subject to change basis final service value. This includes a 2.5% CGST and 2.5% SGST.',
  },
};

/** `25:1327` Instant — outside serving hours. */
export const DEMO_INSTANT_OUT_OF_SHIFT: InstantViewModel = {
  ...DEMO_INSTANT_AVAILABLE,
  unavailable: {
    icon: 'moon',
    message: 'Slots open at 6 AM today',
    ctaLabel: 'Schedule',
    ctaTone: 'primary',
  },
};

/** `44:5378` Instant — no slots. */
export const DEMO_INSTANT_NO_SLOTS: InstantViewModel = {
  ...DEMO_INSTANT_AVAILABLE,
  unavailable: {
    icon: 'calendar',
    message: 'Sorry, all sold out!',
    ctaLabel: 'Schedule',
    ctaTone: 'accent',
  },
};

const PERIODS = [
  { id: 'morning', label: 'Morning', icon: 'sunrise' as const },
  { id: 'afternoon', label: 'Afternoon', icon: 'sun' as const },
  { id: 'evening', label: 'Evening', icon: 'moon' as const },
];

function slots(prefix: string, labels: readonly string[], disabledLabels: readonly string[] = []) {
  return labels.map((label) => ({
    id: `${prefix}-${label.replace(/[^0-9A-Za-z]/g, '')}`,
    label,
    ...(disabledLabels.includes(label) ? { disabled: true } : {}),
  }));
}

/**
 * Start-time grids transcribed from `34:3035` (morning), `34:1919` (noon) and `34:2105` (evening).
 *
 * These are SAMPLE PAYLOADS, not generated sequences — the client neither derives times from a
 * period range nor decides which are unavailable; both are server data (see ScheduleViewModel).
 * The three frames publish their own ranges: 05:00–11:45 AM, 12:00–04:45 PM and 05:00–09:00 PM.
 *
 * Two recorded design defects are NOT reproduced, because copying them would ship bad data:
 *  - **D-1** — `34:3035`'s 6 AM row reads `06:00 · 06:30 · 06:30 · 06:45`; `06:15` is written here.
 *    Still present in the new file, so the defect stands.
 *  - **D-2** — `34:2105` still carries four AFTERNOON chips (`12:30 · 12:45 · 01:30 · 01:45`)
 *    inside the evening grid. The evening range is written out as the audit already rules it.
 * The disabled pattern in each grid IS transcribed verbatim from its frame.
 */
const SLOTS_BY_PERIOD = {
  morning: slots(
    'am',
    [
      '05:00 AM',
      '05:15 AM',
      '05:30 AM',
      '05:45 AM',
      '06:00 AM',
      '06:15 AM',
      '06:30 AM',
      '06:45 AM',
      '07:00 AM',
      '07:15 AM',
      '07:30 AM',
      '07:45 AM',
      '08:00 AM',
      '08:15 AM',
      '08:30 AM',
      '08:45 AM',
      '09:00 AM',
      '09:15 AM',
      '09:30 AM',
      '09:45 AM',
      '10:00 AM',
      '10:15 AM',
      '10:30 AM',
      '10:45 AM',
      '11:00 AM',
      '11:15 AM',
      '11:30 AM',
      '11:45 AM',
    ],
    ['05:00 AM', '05:15 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'],
  ),
  afternoon: slots(
    'pm',
    [
      '12:00 PM',
      '12:15 PM',
      '12:30 PM',
      '12:45 PM',
      '01:00 PM',
      '01:15 PM',
      '01:30 PM',
      '01:45 PM',
      '02:00 PM',
      '02:15 PM',
      '02:30 PM',
      '02:45 PM',
      '03:00 PM',
      '03:15 PM',
      '03:30 PM',
      '03:45 PM',
      '04:00 PM',
      '04:15 PM',
      '04:30 PM',
      '04:45 PM',
    ],
    [
      '12:00 PM',
      '12:15 PM',
      '02:00 PM',
      '02:30 PM',
      '02:45 PM',
      '03:00 PM',
      '03:30 PM',
      '03:45 PM',
      '04:00 PM',
      '04:30 PM',
      '04:45 PM',
    ],
  ),
  evening: slots(
    'eve',
    [
      '05:00 PM',
      '05:15 PM',
      '05:30 PM',
      '05:45 PM',
      '06:00 PM',
      '06:15 PM',
      '06:30 PM',
      '06:45 PM',
      '07:00 PM',
      '07:15 PM',
      '07:30 PM',
      '07:45 PM',
      '08:00 PM',
      '08:15 PM',
      '08:30 PM',
      '08:45 PM',
      '09:00 PM',
    ],
    [
      '05:00 PM',
      '05:15 PM',
      '07:00 PM',
      '07:30 PM',
      '07:45 PM',
      '08:00 PM',
      '08:30 PM',
      '08:45 PM',
      '09:00 PM',
    ],
  ),
};

/** `37:*` / `34:*` — Schedule. */
export const DEMO_SCHEDULE_BOOK: ScheduleViewModel = {
  mode: 'book',
  title: 'Schedule',
  sectionTitles: { day: 'Day', time: 'Time', duration: 'Duration', startTime: 'Start time' },
  days: [
    { id: 'day-1', caption: 'Today', label: 'Aug 5' },
    { id: 'day-2', caption: 'Tomorrow', label: 'Aug 6' },
    { id: 'day-3', caption: 'Fri', label: 'Aug 7' },
  ],
  periods: PERIODS,
  durations: DEMO_INSTANT_AVAILABLE.durations,
  slotsByPeriod: SLOTS_BY_PERIOD,
  primaryCtaLabel: 'Book Now • ₹129',
  payLabel: 'Pay',
  secondaryCtaLabel: 'Share your requests',
};

/** `47:*` — Reschedule: same screen, no Duration section, no price on the bar (C-2/C-3). */
export const DEMO_SCHEDULE_RESCHEDULE: ScheduleViewModel = {
  mode: 'reschedule',
  title: 'Reschedule',
  sectionTitles: DEMO_SCHEDULE_BOOK.sectionTitles,
  days: DEMO_SCHEDULE_BOOK.days,
  periods: PERIODS,
  slotsByPeriod: SLOTS_BY_PERIOD,
  primaryCtaLabel: 'Reschedule',
  secondaryCtaLabel: 'Share your requests',
};

/** Ruling R-3: the server says the single reschedule has been used. */
export const DEMO_SCHEDULE_RESCHEDULE_BLOCKED: ScheduleViewModel = {
  ...DEMO_SCHEDULE_RESCHEDULE,
  blockedMessage: 'This booking has already been rescheduled once.',
};

const HEADER = {
  headerTitle: 'Home',
  headerSubtitle: 'E102, Purva Skydale, Silver Count…',
  helpLabel: 'Help',
};

/** `3:1041` Confirmation. */
export const DEMO_BOOKING_CONFIRMATION: BookingDetailViewModel = {
  ...HEADER,
  view: 'confirmation',
  cook: DEMO_COOK_REKHA,
  statusTone: 'positive',
  summary: {
    bannerTitle: 'Booking confirmed!',
    rows: [
      // `3:1095` gives each row its own weight; the emphasis level IS the design, not decoration.
      { label: 'Date', value: 'Today, Aug 5' },
      { label: 'Start time', value: '5:30 PM', emphasis: 'hero' },
      { label: 'Duration', value: '1 hr' },
      { label: 'End Time', value: '8:00 PM', emphasis: 'quiet' },
      { label: 'Total', value: '₹135', emphasis: 'total' },
    ],
    rescheduleLabel: 'Reschedule Booking',
    cancelLabel: 'Cancel Booking & Refund',
    rescheduleAllowed: true,
  },
};

const TRACKING_ON_TIME = {
  bannerTitle: 'Cook Rekha is arriving',
  bannerMessage: 'The cook will reach your location on time!',
  tone: 'positive',
  etaLabel: '16 mins',
  noteTitle: 'Note before starting',
  noteBody:
    "Please approve gate entry and ensure groceries and gas are available before cook's arrival to avoid disrupted, extended service and related charges.",
} as const;

/** `3:1381` En route — on time. */
export const DEMO_BOOKING_EN_ROUTE: BookingDetailViewModel = {
  ...HEADER,
  view: 'enRoute',
  cook: DEMO_COOK_REKHA,
  tracking: TRACKING_ON_TIME,
};

/** `99:1413` En route — late. Two properties differ; the SERVER decides which is shown. */
export const DEMO_BOOKING_EN_ROUTE_LATE: BookingDetailViewModel = {
  ...HEADER,
  view: 'enRoute',
  cook: DEMO_COOK_REKHA,
  tracking: {
    ...TRACKING_ON_TIME,
    bannerMessage: "We're sorry for the delay, the cook is running late",
    tone: 'warning',
    etaLabel: '21 mins',
  },
};

/**
 * `201:100` Page 8c — Reassigned, on time. Structurally En route plus the `208:553` notice.
 *
 * The copy is the frame's, typos included, so the discrepancy stays visible to design rather than
 * being silently corrected here (defect D-22).
 */
const REASSIGNMENT_NOTICE = {
  title: 'We apologize for reassign a different cook at this moment',
  body: 'We have assigned a different cook as the previously assigned cook won’t be able to service to this booking due to operational reasons',
} as const;

export const DEMO_BOOKING_REASSIGNED: BookingDetailViewModel = {
  ...HEADER,
  view: 'reassigned',
  cook: DEMO_COOK_REKHA,
  reassigned: {
    ...TRACKING_ON_TIME,
    bannerTitle: 'Cook Jyoti is arriving',
    etaLabel: '21 mins',
    notice: REASSIGNMENT_NOTICE,
  },
};

/** `209:747` Page 8d — the same state at `tone: 'warning'`. The SERVER picks the tone. */
export const DEMO_BOOKING_REASSIGNED_LATE: BookingDetailViewModel = {
  ...HEADER,
  view: 'reassigned',
  cook: DEMO_COOK_REKHA,
  reassigned: {
    ...TRACKING_ON_TIME,
    bannerTitle: 'Cook Jyoti is arriving',
    bannerMessage: "We're sorry for the delay, the cook is running late",
    tone: 'warning',
    etaLabel: '21 mins',
    notice: REASSIGNMENT_NOTICE,
  },
};

/**
 * `201:278` Page 8e — Auto cancelled. A terminal state.
 *
 * `refundAmount` is a SUPPLIED value. It deliberately is not `Total` minus anything: the client
 * never computes a refund (task §10, FRONTEND_FOUNDATION_PLAN.md §20).
 */
export const DEMO_BOOKING_AUTO_CANCELLED: BookingDetailViewModel = {
  ...HEADER,
  view: 'autoCancelled',
  autoCancelled: {
    title: 'This booking has been cancelled',
    rows: [
      { label: 'Date', value: 'Today, Aug 5' },
      { label: 'Start time', value: '5:30 PM', emphasis: 'hero' },
      { label: 'Duration', value: '1 hr' },
      { label: 'Total', value: '₹135', emphasis: 'total' },
    ],
    apologyTitle: 'We sincerely apologize for cancelling this booking',
    apologyBody:
      'We regret that we could not serve you this time due to operational constraints & sincerely apologize for related inconveniences caused.',
    refundTitle: 'Amount shall be refunded to original source',
    refundBody:
      'The amount paid against this booking shall be refunded back to your source. And we promise to not let you down again!',
    refundAmountLabel: 'Refund Amount',
    refundAmount: '₹135',
    refundDestination: 'Refund to original payment source',
    refundTimeframe: 'Takes 5-7 business days',
    rebookPrompt: 'Give us another chance, book again!',
    rebookAcceptLabel: 'Yes',
    rebookDeclineLabel: 'No',
  },
};

/** `3:1658` Arrived. */
export const DEMO_BOOKING_ARRIVED: BookingDetailViewModel = {
  ...HEADER,
  view: 'arrived',
  cook: DEMO_COOK_REKHA,
  arrived: {
    bannerTitle: 'Cook Rekha has arrived',
    bannerMessage: 'The cook will be at your doorstep very soon!',
    tone: 'positive',
    etaLabel: '16 mins',
    noteTitle: 'Note before starting',
    noteBody:
      "Please ensure groceries and gas are available before cook's arrival to avoid any extension or related charges.",
    startCtaLabel: 'Start Service',
    otpTitle: 'Start OTP',
    otpCaption: 'Share this to start the service',
    otpCode: '111',
  },
};

/**
 * `101:1812` In service.
 *
 * `endsAtMs` must be an ABSOLUTE server timestamp — the countdown renders it and corrects for
 * clock skew (FRONTEND_FOUNDATION_PLAN.md §19). The factory takes `nowMs` so the development
 * sample is live rather than a stale module-load constant; a real payload supplies the value.
 */
export function demoInServiceBooking(
  nowMs: number,
  remainingMs = 48 * 60 * 1000,
): BookingDetailViewModel {
  return {
    ...HEADER,
    view: 'inService',
    cook: DEMO_COOK_REKHA,
    inService: {
      statusTitle: 'Cook Rekha is cooking',
      statusMessage: 'Cooking in progress as per your given instructions',
      endsAtMs: nowMs + remainingMs,
      // The server would report its own clock; zero means "device and server agree".
      clockSkewMs: 0,
      extendCtaLabel: 'Extend Time',
      endCtaLabel: 'End Service',
      otpTitle: 'End OTP',
      otpCaption: 'Share this to end the service',
      otpCode: '111',
      noteTitle: 'Note before starting',
      noteBody:
        "Please ensure groceries and gas are available before cook's arrival to avoid any extension or related charges.",
      extendPrompt: 'Need more food prepared?',
    },
  };
}

/** `143:207` Completion. */
export const DEMO_BOOKING_COMPLETION: BookingDetailViewModel = {
  ...HEADER,
  view: 'completion',
  cook: DEMO_COOK_REKHA,
  completion: {
    bannerTitle: 'Booking Complete!',
    ratePrompt: 'Please rate this service!',
    rateCaption: 'Your rating helps us assign suitable cooks to you!',
    ratingCaption:
      'Reward the cook if the service exceeded your expectations to keep them motivated!',
    bookingHeadline: '12th April • 1:15 PM • 1 hr',
    feedbackTitle: 'Share Feedback for Cook',
    feedbackPlaceholder: 'Tell us about the service…',
    submitLabel: 'Submit',
    tipTitle: 'Tip Cook Ramesh Kumar',
    tipCaption: '100% goes directly to cook',
    tipOptions: [
      { id: 'tip-20', label: '₹20' },
      { id: 'tip-50', label: '₹50' },
      { id: 'tip-100', label: '₹100' },
      { id: 'tip-150', label: '₹150' },
    ],
  },
};

/** `3:2002` Extension sheet. Options and prices are server-owned. */
export const DEMO_EXTENSION: ExtensionViewModel = {
  title: 'Extend booking',
  sectionTitle: 'Duration',
  options: [
    { id: 'ext-10', label: '10 mins', price: '₹15' },
    { id: 'ext-20', label: '20 mins', price: '₹35' },
    { id: 'ext-30', label: '30 mins', price: '₹69', disabled: true },
  ],
  notes: [
    {
      id: 'quality',
      title: 'Extensions ensure the cook delivers all your expectations',
      body: 'Sometimes it might take longer for a less frequent cook, but they always intend to complete your asks & deliver a delightful service!',
    },
    {
      id: 'schedule',
      title: "Extensions are contingent on assigned cook's schedule",
      body: "Availability of duration ensures the cook's next booking doesn't clash",
    },
  ],
  fallbackTitle: 'Not able to extend at the moment?',
  fallbackBody: 'We are very sorry for that, but you can make another booking',
  fallbackCtaLabel: 'Book NOW',
  ctaLabel: 'Extend',
};
