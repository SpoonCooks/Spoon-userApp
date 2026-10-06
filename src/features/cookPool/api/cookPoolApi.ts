import type { ApiClient } from '@core/api';
import { expectNoContent, idempotencyHeader } from '@core/api';

import {
  addCookToPoolSchema,
  cookPoolCandidatesSchema,
  cookPoolListSchema,
  poolCookProfileSchema,
} from './schemas';
import type {
  AddCookToPoolDto,
  CookPoolCandidatesDto,
  CookPoolListDto,
  PoolCookProfileDto,
} from './schemas';

/**
 * Household Cook Pool endpoints — DEC-085.
 *
 * Only the add carries an Idempotency-Key, scoped to the cook: adding the same cook twice is
 * already a 200 on the backend, and the key makes a retried add after an ambiguous failure a
 * replay rather than a second write. The remove is a plain DELETE (204, 404 when the cook is not
 * in the pool).
 *
 * The add is refused with 403 `FORBIDDEN` (`reason` `COOK_NOT_TRIED`) for a cook who has never
 * completed a booking for the household, and 409 `INVALID_BOOKING_STATE` (`COOK_UNAVAILABLE`) for
 * one Operations has paused. The deck only ever offers candidates, so neither is expected there.
 */

export const COOK_POOL_PATHS = {
  pool: '/v1/me/cooks',
  candidates: '/v1/me/cooks/candidates',
  cook: (cookId: string) => `/v1/me/cooks/${cookId}`,
} as const;

/** The intent an add's Idempotency-Key belongs to: this cook, into this household's pool. */
export function cookPoolAddScope(cookId: string): string {
  return `cookPool.add:${cookId}`;
}

function withSignal(signal: AbortSignal | undefined): { signal?: AbortSignal } {
  return signal === undefined ? {} : { signal };
}

export function createCookPoolApi(api: ApiClient) {
  return {
    /** `GET /v1/me/cooks` — the pool, newest first, and how many it holds. */
    async list(signal?: AbortSignal): Promise<CookPoolListDto> {
      return api.request(COOK_POOL_PATHS.pool, {
        parse: (data) => cookPoolListSchema.parse(data),
        ...withSignal(signal),
      });
    },

    /** `GET /v1/me/cooks/candidates` — the cooks the deck may offer. */
    async candidates(signal?: AbortSignal): Promise<CookPoolCandidatesDto> {
      return api.request(COOK_POOL_PATHS.candidates, {
        parse: (data) => cookPoolCandidatesSchema.parse(data),
        ...withSignal(signal),
      });
    },

    /** `GET /v1/me/cooks/:cookId` — a tried or pooled cook's profile and menu. */
    async profile(cookId: string, signal?: AbortSignal): Promise<PoolCookProfileDto> {
      return api.request(COOK_POOL_PATHS.cook(cookId), {
        parse: (data) => poolCookProfileSchema.parse(data),
        ...withSignal(signal),
      });
    },

    /** `POST /v1/me/cooks` — the deck's swipe right or Add. */
    async add(cookId: string, scope: string): Promise<AddCookToPoolDto> {
      return api.request(COOK_POOL_PATHS.pool, {
        method: 'POST',
        headers: idempotencyHeader(scope),
        body: { cookId },
        parse: (data) => addCookToPoolSchema.parse(data),
      });
    },

    /** `DELETE /v1/me/cooks/:cookId` — 204. */
    async remove(cookId: string): Promise<void> {
      return api.request(COOK_POOL_PATHS.cook(cookId), {
        method: 'DELETE',
        parse: expectNoContent,
      });
    },
  };
}

export type CookPoolApi = ReturnType<typeof createCookPoolApi>;
