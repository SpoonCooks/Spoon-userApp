import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { DEMO_MEAL_BRIEF } from '@/demo/fixtures/screens';
import type { MealBriefViewModel } from './types';

/**
 * TODO(backend-contract): the dish catalogue is a backend resource with user-authored custom
 * dishes; dietary options and guest bounds are equally server-owned.
 */
export function useMealBriefData(): ScreenQuery<MealBriefViewModel> {
  return useDevFixture(DEMO_MEAL_BRIEF);
}
