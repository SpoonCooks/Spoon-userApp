import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ErrorBoundary } from './ErrorBoundary';

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('render exploded');
  }
  return <Text>safe content</Text>;
}

/**
 * A child whose failure is controlled from outside React, so the retry path is deterministic.
 * (React retries a failed render, so "throw once" is not a reliable fixture.)
 */
function createControllableChild() {
  let failing = true;

  function ControllableChild() {
    if (failing) {
      throw new Error('transient render failure');
    }
    return <Text>recovered</Text>;
  }

  return { ControllableChild, recover: () => (failing = false) };
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the caught error; silence it so the suite output stays readable.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary scope="test">
        <Text>safe content</Text>
      </ErrorBoundary>,
    );

    expect(screen.getByText('safe content')).toBeTruthy();
  });

  it('degrades to a neutral fallback instead of white-screening', () => {
    render(
      <ErrorBoundary scope="test">
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('supports a custom fallback', () => {
    render(
      <ErrorBoundary scope="test" fallback={(_reset, message) => <Text>custom: {message}</Text>}>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/^custom:/)).toBeTruthy();
  });

  it('recovers when the retry action is pressed', () => {
    const { ControllableChild, recover } = createControllableChild();

    render(
      <ErrorBoundary scope="test">
        <ControllableChild />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeTruthy();

    recover();
    fireEvent.press(screen.getByText('Try again'));

    expect(screen.queryByTestId('error-boundary-fallback')).toBeNull();
    expect(screen.getByText('recovered')).toBeTruthy();
  });
});
