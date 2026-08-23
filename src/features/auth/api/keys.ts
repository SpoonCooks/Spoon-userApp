import { createKeyFactory } from '@core/query';

/**
 * Auth/identity cache keys.
 *
 * `me` is a collection rather than a detail because the app never reads another user's identity —
 * there is exactly one, scoped by the bearer token, and keying it by id would invite a stale
 * entry from a previous account to survive a sign-out.
 */
const factory = createKeyFactory('auth');

export const authKeys = {
  all: factory.all,
  me: () => factory.collection('me'),
} as const;
