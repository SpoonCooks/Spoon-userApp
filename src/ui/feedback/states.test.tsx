import { fireEvent, render, screen } from '@testing-library/react-native';

import type { AppError } from '@core/errors';

import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('announces busy progress', () => {
    render(<LoadingState testID="loading" />);

    const node = screen.getByTestId('loading');
    expect(node.props.accessibilityRole).toBe('progressbar');
    expect(node.props.accessibilityState.busy).toBe(true);
    expect(node.props.accessibilityLabel).toBe('Loading');
  });

  it('renders the requested number of card placeholders', () => {
    render(<LoadingState variant="card" count={2} testID="loading" />);

    expect(screen.getByTestId('loading-card-0')).toBeTruthy();
    expect(screen.getByTestId('loading-card-1')).toBeTruthy();
    expect(screen.queryByTestId('loading-card-2')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('renders copy and an optional action', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="No saved addresses"
        description="Add an address so a cook knows where to go."
        actionLabel="Add address"
        onAction={onAction}
      />,
    );

    expect(screen.getByText('No saved addresses')).toBeTruthy();
    fireEvent.press(screen.getByTestId('empty-state-action'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('omits the action when none is supplied', () => {
    render(<EmptyState title="Nothing here" />);

    expect(screen.queryByTestId('empty-state-action')).toBeNull();
  });
});

describe('ErrorState', () => {
  const networkError: AppError = { kind: 'network', message: 'offline' };

  it('renders copy from the Phase-1 error taxonomy, not a backend error code', () => {
    render(<ErrorState error={networkError} />);

    expect(
      screen.getByText('No internet connection. Check your network and try again.'),
    ).toBeTruthy();
  });

  it('maps each taxonomy kind to its own neutral message', () => {
    const { unmount } = render(<ErrorState error={{ kind: 'auth', message: 'x', status: 401 }} />);
    expect(screen.getByText('Your session has expired. Please sign in again.')).toBeTruthy();
    unmount();

    render(<ErrorState error={{ kind: 'server', message: 'x', status: 500 }} />);
    expect(
      screen.getByText('Something went wrong on our side. Please try again shortly.'),
    ).toBeTruthy();
  });

  it('retries through the callback', () => {
    const onRetry = jest.fn();
    render(<ErrorState error={networkError} onRetry={onRetry} />);

    fireEvent.press(screen.getByTestId('error-state-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to neutral copy with no error object', () => {
    render(<ErrorState />);

    expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy();
    expect(screen.queryByTestId('error-state-retry')).toBeNull();
  });

  it('is announced politely rather than silently replacing content', () => {
    render(<ErrorState error={networkError} testID="err" />);

    expect(screen.getByTestId('err').props.accessibilityLiveRegion).toBe('polite');
  });
});
