import type { ReactNode } from 'react';

import type { DataState } from '@core/data';

import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import type { LoadingVariant } from './LoadingState';

/**
 * Renders the loading and error surfaces for a screen so every screen gets all three states
 * without repeating the switch.
 *
 * The error copy comes from the Phase-1 taxonomy via `ErrorState`; no backend error codes are
 * involved, because no error envelope exists in any contract.
 */
export interface QueryBoundaryProps<T> {
  readonly state: DataState<T>;
  readonly onRetry?: () => void;
  readonly loadingVariant?: LoadingVariant;
  readonly loadingLabel?: string;
  /**
   * A DESIGNED loading surface to render instead of the token-layer variants — `71:747` for a
   * boundary that owns the whole screen (task §13). Takes precedence over `loadingVariant`.
   */
  readonly loadingFallback?: ReactNode;
  readonly children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({
  state,
  onRetry,
  loadingVariant = 'screen',
  loadingLabel,
  loadingFallback,
  children,
}: QueryBoundaryProps<T>) {
  if (state.status === 'loading') {
    if (loadingFallback !== undefined) return <>{loadingFallback}</>;

    return (
      <LoadingState
        variant={loadingVariant}
        {...(loadingLabel === undefined ? {} : { label: loadingLabel })}
      />
    );
  }

  if (state.status === 'error') {
    return <ErrorState error={state.error} {...(onRetry === undefined ? {} : { onRetry })} />;
  }

  return <>{children(state.data)}</>;
}
