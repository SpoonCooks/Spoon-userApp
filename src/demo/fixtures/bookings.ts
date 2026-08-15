import type { BookingCardViewModel } from '@ui/types/viewModels';

import { REKHA_SAMPLE_PHOTO } from './cooks';

/**
 * DEMO / TEST FIXTURES — NOT PRODUCTION DATA. See `./cooks.ts`.
 *
 * `statusLabel` / `statusTone` are the PRESENTATION values a screen would derive once a status
 * enum exists. They are not backend values, and no mapping is implied.
 */

export const DEMO_BOOKING_COMPLETED: BookingCardViewModel = {
  id: 'demo-booking-1',
  headline: '12th April • 1 hr',
  subtitle: '12:30 PM - 01:45 PM',
  statusLabel: 'Completed',
  statusTone: 'positive',
  cookName: 'Cook Rekha',
  cookPhotoUrl: REKHA_SAMPLE_PHOTO,
  amount: '₹188',
  rating: 4.5,
};

export const DEMO_BOOKING_UNFULFILLED: BookingCardViewModel = {
  id: 'demo-booking-2',
  headline: '12th April • 1:15 PM',
  subtitle: '12:30 PM - 01:45 PM',
  statusLabel: 'Unfulfilled',
  statusTone: 'warning',
  cookName: 'Cook Rekha',
  cookPhotoUrl: REKHA_SAMPLE_PHOTO,
  amount: '₹188',
};

export const DEMO_REFUND_PROCESSING: BookingCardViewModel = {
  id: 'demo-refund-1',
  headline: '12th April • 1:15 PM',
  subtitle: 'Refund expected by 15th Apr',
  statusLabel: 'Processing',
  statusTone: 'warning',
  cookName: 'Cook Rekha',
  cookPhotoUrl: REKHA_SAMPLE_PHOTO,
  amount: '₹188',
};

export const DEMO_REFUND_COMPLETED: BookingCardViewModel = {
  id: 'demo-refund-2',
  headline: '12th April • 1:15 PM',
  subtitle: 'Refund completed on 15th Apr',
  statusLabel: 'Refunded',
  statusTone: 'positive',
  cookName: 'Cook Rekha',
  cookPhotoUrl: REKHA_SAMPLE_PHOTO,
  amount: '₹188',
};

/**
 * The Home active-booking card as Page 3b `59:587` draws it: a server-formatted date on the
 * right and a duration beside the timer chip. The new frame shows no cook name and no ETA pill
 * on Home, so neither is supplied here.
 */
export const DEMO_BOOKING_ACTIVE: BookingCardViewModel = {
  id: 'demo-booking-active',
  headline: 'Upcoming booking',
  subtitle: 'Tomorrow, Aug 5',
  durationLabel: '60 mins',
};

/** Duration options as the Scheduled screen would receive them — opaque ids, server prices. */
export const DEMO_DURATION_OPTIONS = [
  { id: 'dur-30', label: '30 mins', price: '₹69', strikePrice: '₹150' },
  { id: 'dur-45', label: '45 mins', price: '₹99', strikePrice: '₹225' },
  { id: 'dur-60', label: '1 hr', price: '₹129', strikePrice: '₹300' },
  { id: 'dur-90', label: '1.5 hr', price: '₹189', strikePrice: '₹450', badge: 'Popular' },
  { id: 'dur-120', label: '2 hr', price: '₹259', strikePrice: '₹600' },
  { id: 'dur-150', label: '2.5 hrs', price: '₹319', strikePrice: '₹750', disabled: true },
] as const;

/** Start-time slots. Availability is a server decision; `disabled` is simply rendered. */
export const DEMO_SLOT_OPTIONS = [
  { id: 'slot-0500', label: '05:00 AM', disabled: true },
  { id: 'slot-0515', label: '05:15 AM', disabled: true },
  { id: 'slot-0530', label: '05:30 AM' },
  { id: 'slot-0545', label: '05:45 AM' },
  { id: 'slot-0600', label: '06:00 AM' },
  { id: 'slot-0615', label: '06:15 AM' },
  { id: 'slot-0630', label: '06:30 AM' },
  { id: 'slot-0645', label: '06:45 AM' },
] as const;
