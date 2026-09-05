import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Button } from '@ui/primitives/Button';
import { Icon } from '@ui/primitives/Icon';
import type { IconName } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Empty state.
 *
 * Two of these ARE designed, as of v16: `679:1050` Booking empty and `679:1147` Refund empty,
 * each a 150pt illustration over a single centred line. Pass `illustration` to get that; it
 * replaces the small icon and the caller then supplies no `description`, because the designed
 * ones have no second line.
 *
 * Everywhere else — Saved addresses most visibly, which every new user meets right after login —
 * is still undesigned, so the 28pt icon remains the neutral convention. Copy is always the
 * caller's.
 */

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: IconName;
  /** The designed artwork. When present it replaces `icon` entirely. */
  readonly illustration?: ImageSourcePropType;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly testID?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'empty',
  illustration,
  actionLabel,
  onAction,
  testID = 'empty-state',
}: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      {illustration === undefined ? (
        <Icon name={icon} size={28} color="textDisabled" />
      ) : (
        <Image
          source={illustration}
          style={styles.illustration}
          resizeMode="contain"
          accessibilityRole="image"
          // Decorative: the line beneath already says what the screen means.
          accessible={false}
          testID={`${testID}-illustration`}
        />
      )}
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
  /** `683:65` / `684:71` — 150pt square, and the frames are exported at that size. */
  illustration: {
    width: 150,
    height: 150,
  },
});
