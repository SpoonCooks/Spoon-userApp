import { StyleSheet, View } from 'react-native';

import { Button } from '@ui/primitives/Button';
import { Icon } from '@ui/primitives/Icon';
import type { IconName } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Empty state.
 *
 * No empty state is designed anywhere in the file — including for Saved addresses, which every
 * new user sees immediately after login (docs/FIGMA_FINAL_BLOCKERS.md, appendix). This is the
 * neutral convention until design lands; copy is always supplied by the caller.
 */

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: IconName;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly testID?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'empty',
  actionLabel,
  onAction,
  testID = 'empty-state',
}: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Icon name={icon} size={28} color="textDisabled" />
      <Text variant="title" color="textPrimary" align="center" accessibilityRole="header">
        {title}
      </Text>
      {description === undefined ? null : (
        <Text variant="body" color="textSecondary" align="center">
          {description}
        </Text>
      )}
      {actionLabel === undefined || onAction === undefined ? null : (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          fullWidth={false}
          testID={`${testID}-action`}
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
