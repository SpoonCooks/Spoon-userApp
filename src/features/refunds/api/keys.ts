import { createKeyFactory } from '@core/query';

/** Refund tracker cache keys. A refund changes only server-side, so reads simply refetch. */
const factory = createKeyFactory('refunds');

export const refundKeys = {
  all: factory.all,
  detail: (refundId: string) => factory.detail(refundId),
} as const;
