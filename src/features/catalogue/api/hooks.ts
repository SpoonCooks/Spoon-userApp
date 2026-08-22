import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { createCatalogueApi } from './catalogueApi';
import { catalogueKeys } from './keys';
import type { Catalogue } from './schemas';

/**
 * The published policy projection.
 *
 * Cached hard — a 15-minute `staleTime` — because it is versioned configuration, not live state:
 * prices, the tax rate, the cancellation schedule and the meal periods do not change between two
 * taps. Every authoritative per-booking number still comes from `quote`, `cancellation-preview`
 * and `extension-options`, so a stale catalogue can never produce a wrong charge; it would at
 * worst show a stale price on a browse screen, which the quote then corrects.
 */
export function useCatalogue(options: { enabled?: boolean } = {}): ScreenQuery<Catalogue> {
  const { api } = useRuntime();
  const catalogue = createCatalogueApi(api);

  return useApiQuery<Catalogue>({
    queryKey: catalogueKeys.current(),
    queryFn: ({ signal }) => catalogue.get(signal),
    enabled: options.enabled ?? true,
    staleTime: 15 * 60_000,
  });
}
