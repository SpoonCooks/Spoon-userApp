import type { ApiClient } from '@core/api';

import { catalogueSchema } from './schemas';
import type { Catalogue } from './schemas';

/** `GET /v1/catalogue`. Authenticated like every other customer read. */
export const CATALOGUE_PATH = '/v1/catalogue';

export function createCatalogueApi(api: ApiClient) {
  return {
    async get(
      input: { readonly addressId?: string | null | undefined } = {},
      signal?: AbortSignal,
    ): Promise<Catalogue> {
      const path =
        input.addressId === undefined || input.addressId === null
          ? CATALOGUE_PATH
          : `${CATALOGUE_PATH}?addressId=${encodeURIComponent(input.addressId)}`;
      return api.request(path, {
        parse: (data) => catalogueSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
    },
  };
}
