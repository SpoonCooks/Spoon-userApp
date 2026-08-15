import { fromStatus, normalizeError, toTimeoutError } from './normalize';
import { isRetryable } from './types';

describe('fromStatus', () => {
  it.each([
    [401, 'auth'],
    [403, 'auth'],
    [400, 'validation'],
    [422, 'validation'],
    [500, 'server'],
    [503, 'server'],
    [302, 'unknown'],
  ])('maps HTTP %i to %s', (status, kind) => {
    expect(fromStatus(status).kind).toBe(kind);
  });

  it('carries the correlation id through', () => {
    expect(fromStatus(500, { correlationId: 'abc' }).correlationId).toBe('abc');
  });
});

describe('normalizeError', () => {
  it('classifies a fetch TypeError as a network failure', () => {
    const error = normalizeError(new TypeError('Network request failed'));

    expect(error.kind).toBe('network');
    expect(error.message).toBe('Network request failed');
  });

  it('classifies an AbortError as network', () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';

    expect(normalizeError(abort).kind).toBe('network');
  });

  it('passes an already-normalized error through unchanged', () => {
    const original = fromStatus(500, { correlationId: 'xyz' });

    expect(normalizeError(original)).toBe(original);
  });

  it('falls back to unknown for non-Error throwables', () => {
    expect(normalizeError('a string').kind).toBe('unknown');
    expect(normalizeError(null).kind).toBe('unknown');
  });
});

describe('retry policy', () => {
  it('retries transport failures but never auth or validation', () => {
    expect(isRetryable(normalizeError(new TypeError('offline')))).toBe(true);
    expect(isRetryable(toTimeoutError(15000))).toBe(true);
    expect(isRetryable(fromStatus(500))).toBe(true);
    expect(isRetryable(fromStatus(401))).toBe(false);
    expect(isRetryable(fromStatus(422))).toBe(false);
  });
});
