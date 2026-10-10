import type { ApiClient } from '@core/api';

import { customerRefundResponseSchema } from './schemas';
import type { CustomerRefundDto } from './schemas';

/** The refund tracker endpoint (DEC-090). Owner-scoped on the server: another's refund is 404. */
export const REFUND_PATHS = {
  refund: (refundId: string) => `/v1/me/refunds/${encodeURIComponent(refundId)}`,
} as const;

export function createRefundsApi(api: ApiClient) {
  return {
    async refund(refundId: string, signal?: AbortSignal): Promise<CustomerRefundDto> {
      const response = await api.request(REFUND_PATHS.refund(refundId), {
        parse: (data) => customerRefundResponseSchema.parse(data),
        ...(signal === undefined ? {} : { signal }),
      });
      return response.refund;
    },
  };
}

export type RefundsApi = ReturnType<typeof createRefundsApi>;
