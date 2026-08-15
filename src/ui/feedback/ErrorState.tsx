import { StyleSheet, View } from 'react-native';

import { getUserMessage } from '@core/errors';
import type { AppError } from '@core/errors';
import { Button } from '@ui/primitives/Button';
import { Icon } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Error state with retry.
 *
 * Copy comes from the Phase-1 error layer (`getUserMessage`), which maps the CLIENT error
 * taxonomy — network / timeout / auth / validation / server / unknown — to neutral placeholder
 * strings. There is no backend-specific error copy here and no backend error codes: no error
 * envelope exists in any contract.
 *
 * FIGMA_PENDING: no error-state layout or copy is designed anywhere in the file.
 */

export interface ErrorStateProps {
  readonly error?: AppError;
  /** Overrides the taxonomy message when a screen has better context. */
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly testID?: string;
}

export function ErrorState({
  error,
  message,
  onRetry,
  retryLabel = 'Try again',
  testID = 'error-state',
}: ErrorStateProps) {
  const body =
    message ??
    (error === undefined ? 'Something went wrong. Please try again.' : getUserMessage(error));

  const icon = error?.kind === 'network' || error?.kind === 'timeout' ? 'offline' : 'alert';

  return (
    <View style={styles.container} testID={testID} accessible accessibilityLiveRegion="polite">
      <Icon name={icon} size={28} color="danger" />
      <Text variant="title" color="textPrimary" align="center" accessibilityRole="header">
        Something went wrong
      </Text>
      <Text variant="body" color="textSecondary" align="center">
        {body}
      </Text>
      {onRetry === undefined ? null : (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="primary"
          size="md"
          fullWidth={false}
          testID={`${testID}-retry`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xxl,
    paddingHorizontal: lightTheme.space.lg,
  },
});
