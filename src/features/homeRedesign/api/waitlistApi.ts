import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { idempotencyHeader } from '@core/api';
import type { ApiClient } from '@core/api';
import { useRuntime } from '@core/runtimeContext';

export const WAITLIST_PATHS = { me: '/v1/me/waitlist' } as const;

const waitlistEntrySchema = z.object({ id: z.string(), status: z.string() });
export type WaitlistEntryDto = z.infer<typeof waitlistEntrySchema>;

export interface JoinWaitlistInput {
  /** Required by the backend (1–120 chars). */
  readonly name: string;
  readonly addressId: string | null;
}

/**
 * `PUT /v1/me/waitlist` — an upsert keyed on the user (one active entry), refused for an address
 * in a live hub. Needs an `Idempotency-Key`, scoped to the payload so a retry replays.
 *
 * The backend keys it on user + address, not pincode, and takes no notification channel.
 */
export function createWaitlistApi(api: ApiClient) {
  return {
    async join(input: JoinWaitlistInput): Promise<WaitlistEntryDto> {
      return api.request(WAITLIST_PATHS.me, {
        method: 'PUT',
        headers: idempotencyHeader(`waitlist.ensure:${input.addressId ?? 'none'}:${input.name}`),
        body: { name: input.name, addressId: input.addressId },
        parse: (data) => waitlistEntrySchema.parse(data),
      });
    },
  };
}

export function useJoinWaitlist() {
  const { api } = useRuntime();
  const waitlist = createWaitlistApi(api);
  return useMutation<WaitlistEntryDto, Error, JoinWaitlistInput>({
    mutationFn: (input) => waitlist.join(input),
  });
}
