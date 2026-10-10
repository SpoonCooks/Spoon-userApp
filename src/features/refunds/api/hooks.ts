import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';

import { refundKeys } from './keys';
import { createRefundsApi } from './refundsApi';
import type { CustomerRefundDto } from './schemas';

/** One refund for the tracker. `null` (or an empty id) asks for nothing. */
export function useRefund(refundId: string | null): ScreenQuery<CustomerRefundDto> {
  const { api } = useRuntime();
  const refunds = createRefundsApi(api);
  const validId = refundId !== null && refundId !== '' ? refundId : null;
  return useApiQuery<CustomerRefundDto>({
    queryKey: refundKeys.detail(validId ?? 'none'),
    queryFn: ({ signal }) => refunds.refund(validId ?? '', signal),
    enabled: validId !== null,
  });
}
