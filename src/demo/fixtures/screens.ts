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
  headerTitle: 'Choose another location',
  title: 'Coming soon to your area!',
  message: 'We are not operational in your area at the moment, , but we are working towards it!',
};

/**
 * `60:655` in the FINAL file (`8F7GqT4hEG2pEhtUGBYw7p`, "Page 18b- Address full").
 *
 * Three strings moved against the superseded copy and each is read off a node, not paraphrased:
 *   title      `275:4477` -> "Complete address"  (was "Add address details")
 *   labelTitle `339:4599` -> "Label as"          (was "Add label")
 *   ctaLabel   `275:4486` -> "Confirm"           (was "Check Availability & Save")
 *
 * The CTA matters beyond wording (V7 founder comment, task §7). "Check Availability" described a
 * screen that ran the serviceability check itself; it does not. `53:31` Confirm runs the ONE
 * check, and by the time `60:655` is on screen the point has already been approved. This CTA
 * completes and SAVES the address, which is what "Confirm" now says.
 */
export const DEMO_ADDRESS_DETAILS: AddressDetailsViewModel = {
  title: 'Complete address',
  flatPlaceholder: 'Flat no./ House no.',
  buildingPlaceholder: 'Building/ Tower name or Plot no.',
  areaTitle: 'Area',
  areaValue: 'Street name, Area 124, subarea xyz, city',
  changeLabel: 'Change',
  labelTitle: 'Label as',
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
  ctaLabel: 'Confirm',
};

/**
 * EDITING a saved address (B-13). Receiver details live on the address record, so the form opens
 * prefilled and every field stays editable.
 */
export const DEMO_ADDRESS_DETAILS_EDIT: AddressDetailsViewModel = {
  ...DEMO_ADDRESS_DETAILS,
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
   * Placeholder only. `profileFromMe` ALWAYS overwrites this with `GET /v1/me`'s verdict, so no
   * screen ever renders the fixture's answer — the completion card is server-driven (task §9).
   */
  profileComplete: false,
  tiles: [
    // `69:418` / `69:414`. The id stays `orders` — it is the route key, not display copy.
    { id: 'orders', title: 'My bookings', subtitle: 'View booking history', icon: 'clock' },
    { id: 'addresses', title: 'Addresses', subtitle: 'View or add addresses', icon: 'pin' },
    { id: 'refunds', title: 'My refunds', subtitle: 'View refund status', icon: 'refresh' },
    { id: 'help', title: 'Help', subtitle: 'Get immediate help', icon: 'help' },
  ],
  links: [
    // The "Visit Live Website (spoonhelp.com)" row (`6:766`) was REMOVED in the current file —
    // the footer panel dropped 154.43 → 110.43 with it. Nothing replaced it.
    // `6:779` in v4 carries the text ALONE — no leading mark and no trailing shield. The row is
    // a 28pt bar whose only child is the underlined label.
    { id: 'legal', title: 'Terms of Service & Privacy Policy' },
  ],
  // `6:789` reads exactly "Log Out".
  logoutLabel: 'Log Out',
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
 * Figma `fsgGIC4c6DJulb64TTt9yg` "Login flow" `275:4472` — the three finalized OTP frames:
 *
 *   `275:4289`  countdown        — "Resend OTP in **25s**", trailing token Bold, not underlined
 *   `250:2439`  resend offered   — "Resend OTP **via SMS**", underlined, boxes empty
 *   `275:4349`  rejected code    — "Incorrect OTP. Please try again" inside the digits panel, the
 *                                  boxes on the red tint, and resend OFFERED (not counting down)
 *
 * Both the resend and the error frame set "via SMS" in Bold against a SemiBold lead, so all three
 * states carry a lead + accent pair; only the countdown differs in what the accent says.
 *
 * `resendLabel` is PRE-FORMATTED and `digitCount` is read from the frame's six boxes. The client
 * runs no timer: the "25s" here is the frame's sample copy, and a host that owns the countdown
 * simply supplies a different string.
 */
const OTP_BASE = {
  title: 'OTP verification',
  sentToLabel: 'OTP has been sent to +91 9876543210',
  taglineLead: 'Trained cooks in ',
  taglineAccent: 'minutes',
  taglineSub: 'Cooking dishes catered to your mood & taste',
  digitCount: 6,
} as const satisfies Partial<OtpViewModel>;

/** `275:4289` — the countdown, whose trailing token the frame sets in Bold. */
export const DEMO_OTP: OtpViewModel = {
  ...OTP_BASE,
  resendLabel: 'Resend OTP in ',
  resendLabelAccent: '25s',
  resendEnabled: false,
};

/** `250:2439` — "Resend OTP " SemiBold + "via SMS" Bold, the whole line underlined. */
export const DEMO_OTP_RESEND_READY: OtpViewModel = {
  ...OTP_BASE,
  resendLabel: 'Resend OTP ',
  resendLabelAccent: 'via SMS',
  resendEnabled: true,
};

/**
 * `275:4349` — the error frame draws the resend link OFFERED, not a running countdown, so this
 * builds on `DEMO_OTP_RESEND_READY` rather than on the countdown state.
 */
export const DEMO_OTP_ERROR: OtpViewModel = {
  ...DEMO_OTP_RESEND_READY,
  // `275:4467`. Server copy — nothing here decides what makes a code invalid.
  errorMessage: 'Incorrect OTP. Please try again',
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
