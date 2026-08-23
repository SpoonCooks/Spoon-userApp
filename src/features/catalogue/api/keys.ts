import { createKeyFactory } from '@core/query';

const factory = createKeyFactory('catalogue');

export const catalogueKeys = {
  all: factory.all,
  current: () => factory.collection('current'),
} as const;
