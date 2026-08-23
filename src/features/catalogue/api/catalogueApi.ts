import type { ApiClient } from '@core/api';

import { catalogueSchema } from './schemas';
import type { Catalogue } from './schemas';

/** `GET /v1/catalogue`. Authenticated like every other customer read. */
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
