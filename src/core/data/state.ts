import type { AppError } from '@core/errors';

/**
 * Screen data state.
 *
 * These are CLIENT query states — loading / error / ready. They are not backend statuses and
 * must never be confused with booking lifecycle state, which the backend owns exclusively.
 *
 * Every screen renders from one of these three, so loading and error surfaces exist from the
 * start rather than being retrofitted when the API layer lands.
 */
export type DataState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: AppError }
  | { readonly status: 'ready'; readonly data: T };

export interface ScreenQuery<T> {
  readonly state: DataState<T>;
  /** Re-reads authoritative state. A countdown reaching zero calls this — it never transitions. */
  readonly refetch: () => void;
}

export const LOADING: DataState<never> = { status: 'loading' };

export function ready<T>(data: T): DataState<T> {
  return { status: 'ready', data };
}

export function failed<T>(error: AppError): DataState<T> {
  return { status: 'error', error };
}
