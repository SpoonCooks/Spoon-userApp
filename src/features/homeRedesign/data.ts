import { useDevFixture } from '@core/data';
import type { ScreenQuery } from '@core/data';

import type { HomeModel } from './types';

/**
 * The redesigned Home's read.
 *
 * TODO(backend-contract): served from a fixture through the dev seam until the endpoint exists;
 * `useDevFixture` reports `loading` outside `__DEV__`, so no sample reaches a release build.
 * The screen refetches on every focus, which is what re-resolves the variant.
 */
export function useHomeRedesignData(sample: HomeModel): ScreenQuery<HomeModel> {
  return useDevFixture(sample);
}
