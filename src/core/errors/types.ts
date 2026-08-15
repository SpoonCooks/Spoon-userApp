/**
 * Error taxonomy. (FRONTEND_FOUNDATION_PLAN.md §11)
 *
 * Every failure crossing the API boundary is normalized into this union — feature code never
 * sees a raw fetch rejection.
 *
 * NOTE: these are CLIENT-side categories derived from transport behaviour. They are not backend
 * error codes or enums; no backend contract exists to derive those from.
 */

export type AppErrorKind = 'network' | 'timeout' | 'auth' | 'validation' | 'server' | 'unknown';

interface BaseAppError {
  readonly kind: AppErrorKind;
  /** Non-user-facing. Safe to log (already redacted by the logger). */
  readonly message: string;
  readonly cause?: unknown;
  /** Correlation id of the originating request, when there was one. */
  readonly correlationId?: string;
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

/** True when retrying could plausibly succeed. Used by the query layer's retry policy. */
export function isRetryable(error: AppError): boolean {
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
