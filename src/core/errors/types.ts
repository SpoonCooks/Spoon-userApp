/**
 * Error taxonomy. (FRONTEND_FOUNDATION_PLAN.md §11)
 *
 * Every failure crossing the API boundary is normalized into this union — feature code never
 * sees a raw fetch rejection.
 *
 * `kind` is the CLIENT-side category, derived from transport behaviour, and is what decides
 * retry and generic presentation. `code` is the BACKEND's own error code, carried verbatim
 * alongside it and never collapsed into the kind — `ADDRESS_NOT_SERVICEABLE` and
 * `SLOT_UNAVAILABLE` are both 4xx `validation` errors to the transport, but they select two
 * different designed screens. Feature code branches on `code`; the transport never does.
 */

export type AppErrorKind = 'network' | 'timeout' | 'auth' | 'validation' | 'server' | 'unknown';

interface BaseAppError {
  readonly kind: AppErrorKind;
  /** Non-user-facing. Safe to log (already redacted by the logger). */
  readonly message: string;
  readonly cause?: unknown;
  /** Correlation id of the originating request, when there was one. */
  readonly correlationId?: string;
  /**
   * The backend's `error.code`, verbatim, when the failure carried an error envelope.
   *
   * Deliberately typed as a plain `string` and not `BackendErrorCode`: a code this build does
   * not know is still the server's answer, and must survive to the logs. Use
   * `isKnownErrorCode` at the point of matching.
   */
  readonly code?: string;
  /** The backend's `error.requestId`, for support and log correlation. */
  readonly requestId?: string;
}

export interface NetworkError extends BaseAppError {
  readonly kind: 'network';
}

export interface TimeoutError extends BaseAppError {
  readonly kind: 'timeout';
  readonly timeoutMs: number;
}

export interface AuthError extends BaseAppError {
  readonly kind: 'auth';
  readonly status: number;
}

export interface ValidationError extends BaseAppError {
  readonly kind: 'validation';
  readonly status: number;
}

export interface ServerError extends BaseAppError {
  readonly kind: 'server';
  readonly status: number;
}

export interface UnknownError extends BaseAppError {
  readonly kind: 'unknown';
}

export type AppError =
  NetworkError | TimeoutError | AuthError | ValidationError | ServerError | UnknownError;

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof (value as { kind: unknown }).kind === 'string' &&
    'message' in value
  );
}

/**
 * Codes that are transport-level 4xx but are nonetheless worth retrying.
 *
 * `RATE_LIMITED` is a 429, so the transport categorises it `validation` — but it is explicitly
 * a "try again later" answer, and the OTP cooldown is the main way a real user meets it.
 * `IDEMPOTENCY_CONFLICT` means the same key is mid-flight; the correct response is to retry the
 * SAME key, which is exactly what the idempotency store makes safe.
 */
const RETRYABLE_CODES: ReadonlySet<string> = new Set(['RATE_LIMITED', 'IDEMPOTENCY_CONFLICT']);

/**
 * Codes that are transport-level 5xx but must NOT be retried automatically.
 *
 * A genuine `INTERNAL_ERROR` will not fix itself within a retry window, and retrying it three
 * times only multiplies load on an already-failing server. The two 503s — dependency and
 * provider — are the ones a retry actually helps, so they stay retryable.
 */
const NON_RETRYABLE_CODES: ReadonlySet<string> = new Set(['INTERNAL_ERROR']);

/** True when retrying could plausibly succeed. Used by the query layer's retry policy. */
export function isRetryable(error: AppError): boolean {
  if (error.code !== undefined) {
    if (RETRYABLE_CODES.has(error.code)) return true;
    if (NON_RETRYABLE_CODES.has(error.code)) return false;
  }

  switch (error.kind) {
    case 'network':
    case 'timeout':
    case 'server':
      return true;
    case 'auth':
    case 'validation':
    case 'unknown':
      return false;
  }
}
