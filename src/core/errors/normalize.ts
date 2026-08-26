import type { AppError } from './types';

/**
 * Normalization of arbitrary throwables into the error taxonomy.
 *
 * Status-code mapping is transport-level only (HTTP semantics). The backend's own `error.code`
 * is carried through `fromStatus`'s options and preserved verbatim on the resulting error, so
 * feature code can branch on the contract rather than on HTTP.
 */

export function fromStatus(
  status: number,
  options: {
    message?: string;
    correlationId?: string;
    cause?: unknown;
    /** The backend's `error.code`, when the response carried an error envelope. */
    code?: string;
    /** The backend's `error.requestId`. */
    requestId?: string;
    /** Bounded backend context from the error envelope. */
    details?: { readonly reason?: string | undefined };
  } = {},
): AppError {
  const message = options.message ?? `Request failed with status ${status}`;
  const shared = {
    message,
    ...(options.correlationId === undefined ? {} : { correlationId: options.correlationId }),
    ...(options.cause === undefined ? {} : { cause: options.cause }),
    ...(options.code === undefined ? {} : { code: options.code }),
    ...(options.requestId === undefined ? {} : { requestId: options.requestId }),
    ...(options.details === undefined ? {} : { details: options.details }),
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

/**
 * A failure of the transport itself — the request produced no response at all.
 *
 * This exists because `normalizeError` cannot classify these reliably: it decides "network" from
 * `cause instanceof TypeError`, which is what a browser and Node's undici throw, but NOT what
 * React Native throws. On Android the rejection is a plain `Error` whose message is
 * `fetch failed: java.net.UnknownHostException: ...`, so it fell through to `unknown` and a real
 * offline device was told "Something went wrong. Please try again." instead of that its network
 * was unreachable.
 *
 * The fix is structural rather than a list of per-platform message patterns: if `fetch` rejects
 * and the request was not aborted, then no response exists, and "no response" IS the network
 * kind — whatever the platform named the exception. The original cause is retained.
 */
export function toNetworkError(cause: unknown, correlationId?: string): AppError {
  const message =
    cause instanceof Error && cause.message.length > 0 ? cause.message : 'Network request failed';

  return {
    kind: 'network',
    message,
    cause,
    ...(correlationId === undefined ? {} : { correlationId }),
  };
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
