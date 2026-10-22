/**
 * Feature: Schedule for Later — Figma `cCQlzTeiObQkpVBzwI8mZi` `2466:18844` / `2466:18864` /
 * `2466:19025`, the one-time "Book for later" screen (DEC-094).
 *
 * Its own feature, apart from `@features/scheduled` (which keeps the reschedule screen and the
 * service-clock helpers): it draws Home's animated duration carousel, which the many surfaces that
 * only need `scheduled`'s date helpers must not load.
 */
export { ScheduleForLaterView } from './screens/ScheduleForLaterScreen';
export type { ScheduleForLaterViewProps } from './screens/ScheduleForLaterScreen';
export { useScheduleForLater } from './laterData';
export type { LaterSelection, ScheduleForLater } from './laterData';
export {
  firstOpenPeriodId,
  laterDurationLabel,
  laterModelFrom,
  laterSummaryWhen,
  minutesOfDurationId,
} from './later';
export type { LaterDay, LaterDuration, LaterModel, LaterPeriod, LaterSlot } from './later';
