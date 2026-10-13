/**
 * Feature: the redesigned visit details through the service — Figma "Service flow" (`2165:11841`).
 * `/booking/[id]` renders it for the drawn phases (assigned → completed) — a one-time visit whose
 * cook was reassigned included (`2353:17562`); every other booking state keeps the established
 * booking detail screen.
 */
export { ServiceVisitHost } from './ServiceVisitHost';
export type { ServiceVisitHostProps } from './ServiceVisitHost';
export { ServiceVisitScreen } from './ServiceVisitScreen';
export type { ServiceVisitModel, ServiceVisitScreenProps } from './ServiceVisitScreen';
export { servicePhaseOf } from './model';
export type { ServicePhase } from './model';
export { CancelledVisitHost } from './CancelledVisitHost';
export type { CancelledVisitHostProps } from './CancelledVisitHost';
export {
  cancelledVisitModelFrom,
  isSpoonCancellation,
  spoonCancelHelpMessage,
  spoonCancelledFrom,
} from './cancelledVisit';
export type { SpoonCancelledData } from './cancelledVisit';
export { CookReassignedNote, SpoonCancelledCard } from './notices';
export type { SpoonCancelledCardProps } from './notices';
export { paidTipOf, paymentSheetFrom } from './model';
