import { createKeyFactory } from '@core/query';

/**
 * Cook Pool cache keys. `all()` is the blast radius every write invalidates: an add or a remove
 * changes the pool, the candidates (which exclude pooled cooks) and the profile's `inPool`.
 */
const factory = createKeyFactory('cookPool');

export const cookPoolKeys = {
  all: factory.all,
  pool: () => factory.collection('pool'),
  candidates: () => factory.collection('candidates'),
  profile: (cookId: string) => factory.detail(cookId),
} as const;
