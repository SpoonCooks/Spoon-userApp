import { createKeyFactory } from '@core/query';

const factory = createKeyFactory('catalogue');

export const catalogueKeys = {
  all: factory.all,
  current: (addressId?: string | null) =>
    factory.collection('current', {
      addressId: addressId === undefined || addressId === null ? 'global' : addressId,
    }),
} as const;
