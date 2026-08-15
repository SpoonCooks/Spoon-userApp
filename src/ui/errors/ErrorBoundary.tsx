import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { getUserMessage, normalizeError } from '@core/errors';
import { getLogger } from '@core/logging';
import { Button } from '@ui/primitives/Button';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Error boundary. Used at three levels: root, per-navigator, and around the booking-lifecycle
 * host specifically, where an unexpected server state must degrade rather than white-screen.
 * (FRONTEND_FOUNDATION_PLAN.md §11)
 *
 * FIGMA_PENDING: no error-state layout or copy exists. This is a deliberately neutral fallback
 * built from tokens.
 */

interface Props {
  readonly scope: string;
  readonly children: ReactNode;
  readonly fallback?: (reset: () => void, message: string) => ReactNode;
}

interface State {
  readonly message: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: getUserMessage(normalizeError(error)) };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    getLogger('error-boundary').error('Render failed', {
      scope: this.props.scope,
      error: normalizeError(error),
      componentStack: info.componentStack,
    });
  }

  private readonly reset = () => {
    this.setState({ message: null });
  };

  override render(): ReactNode {
    const { message } = this.state;

    if (message === null) {
      return this.props.children;
    }

    if (this.props.fallback !== undefined) {
      return this.props.fallback(this.reset, message);
    }

    return (
      <View style={styles.container} testID="error-boundary-fallback">
        <Text variant="heading" color="textPrimary" accessibilityRole="header">
          Something went wrong
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {message}
        </Text>
        <Button
          label="Try again"
          onPress={this.reset}
          variant="primary"
          size="md"
          fullWidth={false}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.md,
    padding: lightTheme.layout.screenPaddingHorizontal,
    backgroundColor: lightTheme.colors.background,
  },
});
