import type { ApiClient } from '@core/api';

import { catalogueSchema } from './schemas';
import type { Catalogue } from './schemas';

/**
 * `GET /v1/catalogue`. Sent with the session's token like every other read; V0 also serves it
 * WITHOUT one, which is what lets a guest's Home (iOS "Skip") show real prices.
 */
export const CATALOGUE_PATH = '/v1/catalogue';

export function createCatalogueApi(api: ApiClient) {
  return {
    async get(signal?: AbortSignal): Promise<Catalogue> {
      return api.request(CATALOGUE_PATH, {
        parse: (data) => catalogueSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },
  };
}
