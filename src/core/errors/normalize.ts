import type { AppError } from './types';

/**
 * Normalization of arbitrary throwables into the error taxonomy.
 *
 * Status-code mapping is transport-level only (HTTP semantics), NOT a backend error contract.
 * TODO(backend-contract): when an error envelope exists, map its code/message here.
 */

export function fromStatus(
  status: number,
  options: { message?: string; correlationId?: string; cause?: unknown } = {},
): AppError {
  const message = options.message ?? `Request failed with status ${status}`;
  const shared = {
    message,
    ...(options.correlationId === undefined ? {} : { correlationId: options.correlationId }),
    ...(options.cause === undefined ? {} : { cause: options.cause }),
  };

  if (status === 401 || status === 403) {
    return { kind: 'auth', status, ...shared };
  }
  if (status >= 400 && status < 500) {
    return { kind: 'validation', status, ...shared };
  }
  if (status >= 500) {
    return { kind: 'server', status, ...shared };
  }
  return { kind: 'unknown', ...shared };
}

export function toTimeoutError(timeoutMs: number, correlationId?: string): AppError {
  return {
    kind: 'timeout',
    timeoutMs,
    message: `Request timed out after ${timeoutMs}ms`,
    ...(correlationId === undefined ? {} : { correlationId }),
  };
}

export function normalizeError(cause: unknown, correlationId?: string): AppError {
  const correlation = correlationId === undefined ? {} : { correlationId };

  if (typeof cause === 'object' && cause !== null && 'kind' in cause && 'message' in cause) {
    // Already normalized upstream.
    return cause as AppError;
  }

  if (cause instanceof TypeError) {
    // fetch() rejects with TypeError for DNS failures, offline, and CORS-style aborts.
    return { kind: 'network', message: cause.message, cause, ...correlation };
  }

  if (cause instanceof Error) {
    if (cause.name === 'AbortError') {
      return { kind: 'network', message: 'Request aborted', cause, ...correlation };
    }
    return { kind: 'unknown', message: cause.message, cause, ...correlation };
  }

  return { kind: 'unknown', message: 'Unknown error', cause, ...correlation };
}
