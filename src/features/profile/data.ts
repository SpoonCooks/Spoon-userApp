import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { DEMO_PROFILE } from '@/demo/fixtures/screens';
import type { ProfileViewModel } from './types';

/** TODO(backend-contract): no profile endpoint or payload exists. */
export function useProfileData(): ScreenQuery<ProfileViewModel> {
  return useDevFixture(DEMO_PROFILE);
}
