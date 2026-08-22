import { createIdempotencyKey, createIdempotencyScope, idempotencyHeader } from './idempotency';

/**
 * The property these tests protect is the one that prevents a double charge: the SAME user
 * intent must produce the SAME key across retries, and a NEW intent must produce a new one.
 */
describe('idempotency scope', () => {
  it('returns a stable key for the same intent', () => {
    const scope = createIdempotencyScope();

    const first = scope.keyFor('booking:create:draft-1');
    const second = scope.keyFor('booking:create:draft-1');

    // This is the retry case: an ambiguous timeout, then the same button pressed again.
    expect(second).toBe(first);
  });

  it('gives different intents different keys', () => {
    const scope = createIdempotencyScope();

    expect(scope.keyFor('booking:create:draft-1')).not.toBe(scope.keyFor('booking:create:draft-2'));
  });

  it('mints a genuinely new key after release', () => {
    const scope = createIdempotencyScope();

    const first = scope.keyFor('booking:cancel:booking-1');
    scope.release('booking:cancel:booking-1');
    const second = scope.keyFor('booking:cancel:booking-1');

    // Release marks the intent finished. Reusing the key here would make the server replay the
    // COMPLETED cancellation instead of performing a new one.
    expect(second).not.toBe(first);
    expect(scope.has('booking:cancel:booking-1')).toBe(true);
  });

  it('builds the header the backend reads', () => {
    const scope = createIdempotencyScope(() => 'fixed-key');

    expect(idempotencyHeader('any', scope)).toEqual({ 'Idempotency-Key': 'fixed-key' });
  });

  it('does not collide across a realistic burst of intents', () => {
    // Not a cryptographic claim — just enough that a customer tapping around cannot collide.
    const keys = new Set(Array.from({ length: 5000 }, () => createIdempotencyKey()));
    expect(keys.size).toBe(5000);
  });
});
