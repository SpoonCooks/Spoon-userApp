import type { AppError, AppErrorKind } from './types';

/**
 * User-facing message mapping — one place, keyed by error kind.
 *
 * FIGMA_PENDING: all error copy, error-state layouts and the login error region are undesigned
 * (docs/FIGMA_FINAL_BLOCKERS.md). These are neutral placeholders, clearly marked, and are
 * expected to be replaced wholesale once copy lands.
 */

const PLACEHOLDER_COPY: Record<AppErrorKind, string> = {
  network: 'No internet connection. Check your network and try again.',
  timeout: 'That took too long. Please try again.',
  auth: 'Your session has expired. Please sign in again.',
  validation: 'Something in that request was not accepted. Please check and try again.',
  server: 'Something went wrong on our side. Please try again shortly.',
  unknown: 'Something went wrong. Please try again.',
};

export function getUserMessage(error: AppError): string {
  return PLACEHOLDER_COPY[error.kind];
}
