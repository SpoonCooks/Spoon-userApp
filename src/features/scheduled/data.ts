import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { DEMO_SCHEDULE_BOOK, DEMO_SCHEDULE_RESCHEDULE } from '@/demo/fixtures/booking';
import type { ScheduleMode, ScheduleViewModel } from './types';

/**
 * TODO(backend-contract): days, periods, durations, slots and their availability are all server
 * data. **No booking horizon is encoded** — whatever days the payload carries are the days shown
 * (blocker B-8).
 */
export function useScheduleData(mode: ScheduleMode): ScreenQuery<ScheduleViewModel> {
  return useDevFixture(mode === 'reschedule' ? DEMO_SCHEDULE_RESCHEDULE : DEMO_SCHEDULE_BOOK);
}
