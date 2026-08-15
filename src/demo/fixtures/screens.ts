import type {
  AddressDetailsViewModel,
  AddressEditViewModel,
  AddressListViewModel,
  AddressLocationViewModel,
  AddressOutOfServiceViewModel,
} from '@features/address';
import type { LoginViewModel, OtpViewModel } from '@features/auth';
import type { CancellationViewModel } from '@features/cancellation';
import type { BookingListViewModel } from '@features/history';
import type { MealBriefViewModel } from '@features/mealBrief';
import type { ProfileViewModel } from '@features/profile';

import {
  DEMO_BOOKING_COMPLETED,
  DEMO_BOOKING_UNFULFILLED,
  DEMO_REFUND_COMPLETED,
  DEMO_REFUND_PROCESSING,
} from './bookings';

/**
 * DEMO / TEST FIXTURES — NOT PRODUCTION DATA.
 *
 * Copy and option lists are transcribed from the audited frames so screens can be compared
 * against the design. All of it stands in for server payloads.
 */

/* ---------------------------------------------------------------------- address */

export const DEMO_ADDRESS_LIST: AddressListViewModel = {
  title: 'Saved addresses',
  // Figma reads "Add a new addresses" (copy defect D-10); the corrected string is used.
  addCtaLabel: 'Add a new address',
  sectionTitle: 'Saved Addresses',
  addresses: [
    { id: 'addr-1', label: 'Home', line: 'B-402, Green Meadows, Indiranagar 100ft Road, Kora…' },
    { id: 'addr-2', label: 'Parents', line: '12, 5th Cross, Jayanagar 4th Block' },
  ],
  emptyTitle: 'No saved addresses yet',
  emptyDescription: 'Add an address so your cook knows where to go.',
};

export const DEMO_ADDRESS_LIST_EMPTY: AddressListViewModel = {
  ...DEMO_ADDRESS_LIST,
  addresses: [],
};

export const DEMO_ADDRESS_LOCATION: AddressLocationViewModel = {
  title: 'Select service location',
  searchLabel: 'Area, Street or Building Name',
  searchPlaceholder: 'Area, Street or Building Name',
  searchValue: 'Indiranagar 100ft Road, Bengaluru',
  helperText: 'Move pin to help the cook reach accurately',
  resolvedTitle: 'Street Name',
  resolvedLine: 'Area 124, subarea 2 xyz, city efg',
  confirmLabel: 'Confirm',
};

/** Ruling R-4: the map step is where an out-of-area result surfaces. */
export const DEMO_ADDRESS_LOCATION_UNSERVICEABLE: AddressLocationViewModel = {
  ...DEMO_ADDRESS_LOCATION,
  serviceabilityMessage: 'This area is outside our serviceable area right now.',
};

/**
 * `228:1801` — the Edit / Delete sheet.
 *
 * Both titles are the FRAME's own strings, including "Edit addresss" and "Edit this addresses".
 * They are rendered verbatim so the copy defect (D-31) stays visible to design rather than being
 * quietly corrected here, the same treatment D-22's reassignment grammar already gets.
 */
export const DEMO_ADDRESS_EDIT: AddressEditViewModel = {
  title: 'Edit addresss',
  cardTitle: 'Edit this addresses',
  address: {
    id: 'addr-1',
    label: 'Home',
    line: 'B-402, Green Meadows, Indiranagar 100feet Roa…',
  },
  editLabel: 'Edit',
  deleteLabel: 'Delete',
};

/**
 * `215:1472` — Address out of service.
 *
 * The message keeps the frame's own double comma (D-30). Every string is a server value; nothing
 * here is a rule about where Spoon operates.
 */
export const DEMO_ADDRESS_OUT_OF_SERVICE: AddressOutOfServiceViewModel = {
  addressLabel: 'Home',
  addressLine: 'E102, Purva Skydale, Silver Count…',
  title: 'Coming soon to your area!',
  message: 'We are not operational in your area at the moment, , but we are working towards it!',
};

export const DEMO_ADDRESS_DETAILS: AddressDetailsViewModel = {
  title: 'Add address details',
  flatPlaceholder: 'Flat no./ House no.',
  buildingPlaceholder: 'Building/ Tower name or Plot no.',
  areaTitle: 'Area',
  areaValue: 'Street name, Area 124, subarea xyz, city',
  changeLabel: 'Change',
  labelTitle: 'Add label',
  labelOptions: [
    { id: 'home', label: 'Home' },
    { id: 'parents', label: 'Parents' },
    { id: 'friends', label: 'Friends' },
    { id: 'others', label: 'Others' },
  ],
  saveAsPlaceholder: 'Save as',
  receiverTitle: "Receiver's details",
  receiverOptionalLabel: '(Optional)',
  receiverNamePlaceholder: 'Name',
  receiverPhonePlaceholder: 'Phone no.',
  ctaLabel: 'Check Availability & Save',
};

/**
 * EDITING a saved address (B-13). Receiver details live on the address record, so the form opens
 * prefilled and every field stays editable.
 */
export const DEMO_ADDRESS_DETAILS_EDIT: AddressDetailsViewModel = {
  ...DEMO_ADDRESS_DETAILS,
  title: 'Edit address details',
  flatValue: 'B-402',
  buildingValue: 'Green Meadows',
  selectedLabelId: 'parents',
  receiverName: 'Anita Sharma',
  receiverPhone: '98765 43210',
};

/* -------------------------------------------------------------------- meal brief */

export const DEMO_MEAL_BRIEF: MealBriefViewModel = {
  title: 'Meal Brief & Recipe Link',
  skipLabel: 'Skip',
  dietaryTitle: 'Dietary Preference',
  dietaryOptions: [
    { id: 'veg', label: 'Veg' },
    { id: 'non-veg', label: 'Non-Veg' },
    { id: 'jain', label: 'Jain' },
    { id: 'eggetarian', label: 'Eggetarian' },
  ],
  guestsTitle: 'Number of Guests',
  guestsInitial: 2,
  guestsMin: 1,
  guestsMax: 12,
  dishesTitle: 'Select Dishes for Cook',
  dishOptions: [
    { id: 'dal-tadka', label: 'Homestyle Dal Tadka', preselected: true },
    { id: 'phulka', label: 'Phulka (Soft Roti)', preselected: true },
    { id: 'jeera-rice', label: 'Jeera Rice', preselected: true },
    { id: 'paneer-butter-masala', label: 'Paneer Butter Masala' },
    { id: 'aloo-gobi', label: 'Aloo Gobi Dry' },
    { id: 'rajma', label: 'Ghar Ka Rajma' },
    { id: 'kadai-chicken', label: 'Kadai Chicken Curry' },
    { id: 'rasam', label: 'South Indian Rasam' },
  ],
  customDishPlaceholder: 'Add custom dish (e.g., Baingan Bharta)…',
  customDishAddLabel: 'Add',
  recipeTitle: 'Reel / YT Video Recipe Link',
  recipeOptionalLabel: 'Optional',
  recipeDescription:
    'Have a specific recipe Reel or YouTube Short you want your cook to follow? Paste the link below!',
  recipePlaceholder: 'https://…',
  notesTitle: 'Custom Cooking Notes & Spice Preferences',
  notesPlaceholder: 'Tell the cook about oil, spice level and portion sizes…',
  /** `3:798` — the frame's CTA is a two-line label with an inset gateway pill (`3:799`). */
  ctaLabel: 'Book Now • Pay via Razorpay',
  ctaBadgeLabel: 'Razorpay',
};

/* ---------------------------------------------------------------------- profile */

export const DEMO_PROFILE: ProfileViewModel = {
  title: 'Profile',
  user: { name: 'Aarav Mehta', contactLine: '+91 98765 00000' },
  /**
   * `222:1570`. Present only because the sample payload says so — the client never works out
   * that a profile is incomplete. The message keeps the frame's own wording, which reads
   * "Share how your meal preferences…" (recorded as D-33).
   */
  incomplete: {
    title: 'Your profile is incomplete',
    message: 'Share how your meal preferences, so that we can serve you better',
    ctaLabel: 'Complete profile',
  },
  tiles: [
    { id: 'orders', title: 'My orders', subtitle: 'View order history', icon: 'clock' },
    { id: 'addresses', title: 'Addresses', subtitle: 'View or add addresses', icon: 'pin' },
    { id: 'refunds', title: 'My refunds', subtitle: 'View refund status', icon: 'refresh' },
    { id: 'help', title: 'Help', subtitle: 'Get immediate help', icon: 'help' },
  ],
  links: [
    {
      id: 'website',
      title: 'Visit Live Website (spoonhelp.com)',
      icon: 'file',
      trailingIcon: 'externalLink',
    },
    // `6:779` has no leading mark; the shield is its TRAILING one.
    { id: 'legal', title: 'Terms of Service & Privacy Policy', trailingIcon: 'shield' },
  ],
  logoutLabel: 'Log Out of Account',
};

/* -------------------------------------------------------------------------- login */

/**
 * NEW Figma `53:174` "Page 17a- Login No.". Copy transcribed from the frame.
 *
 * `phoneMaxLength` is fixture data, not a rule: the frame shows a ten-digit Indian number beside a
 * `+91` cell, so the sample is ten. A contract that says otherwise changes this value only.
 */
export const DEMO_LOGIN: LoginViewModel = {
  title: 'Login',
  subtitle: 'Enter your phone number to proceed',
  taglineLead: 'Trained cooks in ',
  taglineAccent: 'minutes',
  taglineSub: 'Cooking dishes catered to your mood & taste',
  dialCode: '+91',
  phonePlaceholder: '9876543210',
  phoneMaxLength: 10,
  ctaLabel: 'Continue',
  legalLead: 'By continuing, I accept the',
  legalTerms: 'Terms of use',
  legalSeparator: ' & ',
  legalPrivacy: 'Privacy policy',
};

/**
 * NEW Figma `227:1649` "Page 17b- Login OTP" — a screen that did not exist before (blocker B-7).
 *
 * `resendLabel` is PRE-FORMATTED and `digitCount` is read from the frame's six boxes. The client
 * runs no timer: the "26s" here is the frame's sample copy, and a host that owns the countdown
 * simply supplies a different string.
 */
export const DEMO_OTP: OtpViewModel = {
  title: 'OTP verification',
  sentToLabel: 'OTP has been sent to +91 9876543210',
  taglineLead: 'Trained cooks in ',
  taglineAccent: 'minutes',
  taglineSub: 'Cooking dishes catered to your mood & taste',
  digitCount: 6,
  resendLabel: 'Resend OTP in 26s',
  resendEnabled: false,
  ctaLabel: 'Verify & Proceed',
};

/** The states the frames imply but do not separately draw. Reachable from the DEV menu. */
export const DEMO_OTP_RESEND_READY: OtpViewModel = {
  ...DEMO_OTP,
  resendLabel: 'Resend OTP',
  resendEnabled: true,
};

export const DEMO_OTP_ERROR: OtpViewModel = {
  ...DEMO_OTP,
  resendLabel: 'Resend OTP',
  resendEnabled: true,
  // Server copy. Nothing here decides what makes a code invalid.
  errorMessage: 'That code did not match. Please try again.',
};

export const DEMO_LOGIN_ERROR: LoginViewModel = {
  ...DEMO_LOGIN,
  errorMessage: 'We could not send an OTP to that number.',
};

/* ---------------------------------------------------------- history and refunds */

export const DEMO_BOOKING_HISTORY: BookingListViewModel = {
  title: 'Past bookings',
  bookings: [
    DEMO_BOOKING_COMPLETED,
    DEMO_BOOKING_UNFULFILLED,
    { ...DEMO_BOOKING_COMPLETED, id: 'demo-booking-3' },
  ],
  emptyTitle: 'No past bookings yet',
  emptyDescription: 'Your completed bookings will appear here.',
};

export const DEMO_BOOKING_HISTORY_EMPTY: BookingListViewModel = {
  ...DEMO_BOOKING_HISTORY,
  bookings: [],
};

export const DEMO_REFUND_HISTORY: BookingListViewModel = {
  title: 'Refunds',
  bookings: [DEMO_REFUND_PROCESSING, DEMO_REFUND_COMPLETED],
  emptyTitle: 'No refunds yet',
  emptyDescription: 'Refunds for cancelled bookings will appear here.',
};

/* ----------------------------------------------------------------- cancellation */

export const DEMO_CANCELLATION: CancellationViewModel = {
  title: 'Cancel booking',
  helpLabel: 'Help',
  feeColumns: ['Time', 'Fee as percentage'],
  feeSchedule: [
    // `6:22` now reads "Free" in `#01CF8F`, which closes defect D-12 (an absolute ₹0 under a
    // "Fee as percentage" column). The tone is carried on the row, not inferred from the text.
    { label: 'More than 3 hrs to start time', value: 'Free', free: true },
    { label: 'Between 3 hrs to 1 hr to start time', value: '25%' },
    { label: 'Within 1 hr to start time', value: '50%' },
  ],
  notes: [
    {
      id: 'compensation',
      title: 'This fee goes towards compensating the cook',
      body: "Their time is reserved & they won't be able to do another job",
    },
    {
      id: 'reschedule-once',
      title: 'Cancellation on rescheduled bookings',
      body: 'An original booking can be rescheduled only once',
    },
  ],
  reasonTitle: 'Why do you want to cancel?',
  reasons: [
    { id: 'urgent', label: 'Something urgent came up' },
    { id: 'delivery', label: 'Ordered from food delivered apps' },
    { id: 'family', label: 'Family members cooked food' },
    { id: 'elsewhere', label: 'Arranged a cook from elsewhere' },
    { id: 'mistake', label: 'Booked by mistake' },
    { id: 'cook', label: 'Did not like the assigned cook' },
    // B-19: this reason, and only this reason, requires a free-text detail.
    { id: 'others', label: 'Others', requiresDetail: true },
  ],
  reasonDetailPlaceholder: 'Tell us what went wrong',
  continueLabel: 'Continue',
  refundTitle: 'Refund details',
  refundRows: [
    { label: 'Original Booking Paid', value: '₹135' },
    { label: 'Cancellation Processing Fee', value: '₹0' },
    { label: 'Refund Amount', value: '₹135', emphasis: 'total' },
  ],
  refundMethodTitle: 'Refund to original payment source',
  refundMethodBody: 'Takes 3-5 business days',
  cancelCtaLabel: 'Cancel',
  confirmedTitle: 'Your booking has been cancelled',
  bookAgainTitle: 'Would you like to make another booking?',
  bookAgainYesLabel: 'Yes',
  bookAgainNoLabel: 'No',
  reschedulePromptTitle: "Don't cancel, reschedule instead",
  reschedulePromptBody: 'Reschedule your booking for free to a new slot!',
  rescheduleCtaLabel: 'Reschedule for free',
  rescheduleAllowed: true,
};
