/**
 * Feature: recurring live booking — the screens a customer sees once a recurring plan is running.
 * Figma `cCQlzTeiObQkpVBzwI8mZi`, page `1005:131` ("Recurring: Live booking").
 *
 *  - Live booking tab: the visits calendar, its date pop-ups and the Up-next card
 *  - Manage plans tab: the plan Summary (per plan, per visit), with an edited/unsaved state
 *  - Visit details: upcoming (cook assigned / cook pending), completed and cancelled, with the
 *    Before-arrival prep card and the Modify booking / Payment details sheets
 *  - Rate card (inline on a completed visit) and the "Tell us more" sheet
 *
 * STATIC UI ONLY for now: every screen reads fixture data from `data/` and leaves its actions as
 * callbacks. Nothing is wired to the backend or to the real routes yet.
 */
export { RecurringTabsHeader } from './components/RecurringTabsHeader';
export type { RecurringTab, RecurringTabsHeaderProps } from './components/RecurringTabsHeader';

export { RecurringLiveScreen } from './screens/RecurringLiveScreen';
export type { RecurringLiveScreenProps, VisitRef } from './screens/RecurringLiveScreen';
export { CALENDAR_DEMO_DATES } from './data/calendar';

export { RecurringPlansScreen } from './screens/RecurringPlansScreen';
export type { RecurringPlansScreenProps } from './screens/RecurringPlansScreen';

export { VisitDetailsScreen } from './screens/VisitDetailsScreen';
export type { VisitDetailsScreenProps } from './screens/VisitDetailsScreen';
export type { VisitPrepReady, VisitVariant } from './data/visit';

export { ModifyBookingSheet } from './components/sheets/ModifyBookingSheet';
export type { ModifyBookingSheetProps } from './components/sheets/ModifyBookingSheet';
export { PaymentDetailsSheet } from './components/sheets/PaymentDetailsSheet';
export type { PaymentDetailsSheetProps } from './components/sheets/PaymentDetailsSheet';

export { RateVisitCard } from './components/rating/RateVisitCard';
export type { RateVisitCardProps, RateVisitSubmission } from './components/rating/RateVisitCard';
export { TellUsMoreSheet } from './components/rating/TellUsMoreSheet';
export type { TellUsMoreSheetProps } from './components/rating/TellUsMoreSheet';
export type { VisitRatingValue } from './data/rating';
