import { createKeyFactory } from '@core/query';

/**
 * Feature: scheduled booking.
 *
 * Confirmed C-1 — ONE screen with progressive disclosure, not a wizard:
 *   Day → Time (period) → Duration → Start time.
 * Eleven Figma frames collapse to one route; cluster B is the same screen in reschedule mode.
 *
 * Boundary: the day list, duration options and 15-minute start slots — including which slots are
 * disabled — are all SERVER-PROVIDED. The client performs no slot generation, no availability
 * evaluation and no price arithmetic; the bottom-bar amount is rendered from server values.
 *
 * TODO(backend-contract): no slot, duration or pricing endpoints exist.
 * TODO(product B-8): whether the 3-day Day row is the real booking horizon is unanswered — it
 * decides whether the day selector is a fixed row or scrollable/calendar-backed.
 */
export const scheduledKeys = createKeyFactory('scheduled');

export { useScheduleData } from './data';
/**
 * Service-clock helpers, published because the service timezone is not the Schedule screen's
 * private concern. Any surface that prints a booking's calendar day — the history list, for one —
 * has to read it on the same clock the backend published, or the same instant is drawn as two
 * different dates on two devices.
 */
export { formatServiceDate, serviceDateIn } from './serviceTime';
export { devScheduleSelection } from './devSteps';
export { ScheduleView } from './screens/ScheduleScreen';
export type { ScheduleActions, ScheduleViewProps } from './screens/ScheduleScreen';
export type * from './types';
