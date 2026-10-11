/**
 * Feature: the redesigned visit details through the service — Figma "Service flow" (`2165:11841`).
 * `/booking/[id]` renders it for the drawn phases (assigned → completed); every other booking
 * state keeps the established booking detail screen.
 */
export { ServiceVisitHost } from './ServiceVisitHost';
export type { ServiceVisitHostProps } from './ServiceVisitHost';
export { ServiceVisitScreen } from './ServiceVisitScreen';
export type { ServiceVisitModel, ServiceVisitScreenProps } from './ServiceVisitScreen';
export { servicePhaseOf } from './model';
export type { ServicePhase } from './model';
export { CancelledVisitHost } from './CancelledVisitHost';
export type { CancelledVisitHostProps } from './CancelledVisitHost';
export { cancelledVisitModelFrom } from './cancelledVisit';
export { paidTipOf, paymentSheetFrom } from './model';
