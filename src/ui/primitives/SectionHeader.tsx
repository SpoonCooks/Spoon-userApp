import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Section label with an optional trailing action.
 *
 * Covers "Day" / "Time" / "Duration" / "Start time" on Scheduled (`37:3715`), "Duration" on the
 * Extension sheet, "Share Feedback for Cook" on Completion, and "Saved Addresses" on the address
 * list.
 *
 * `37:3716` sets the label at Livvic **Medium 11/16.5** in `#45556C` with a 6pt gap to the
 * content below — not the SemiBold `textSecondary` the previous version used.
 */

export interface SectionHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly testID?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  testID,
}: SectionHeaderProps) {
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.text}>
        <Text variant="labelMedium" color="textFieldLabel" accessibilityRole="header">
          {title}
        </Text>
        {subtitle === undefined ? null : (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        )}
      </View>

      {actionLabel === undefined || onAction === undefined ? null : (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={lightTheme.space.sm}
          style={styles.action}
        >
          {/*
            TEXT ALONE. `333:3622` — the one label row in the file that carries an action — holds
            exactly two text nodes, "Duration" at x 0 and "Help me pick" right-aligned at x 232.
            There is no chevron beside it, so none is drawn.
          */}
          <Text variant="label" color="textFree" style={styles.actionLabel}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    marginBottom: lightTheme.space.s6,
  },
  text: { flexShrink: 1, gap: lightTheme.space.xxs },
  action: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xxs },
  /**
   * `348:4804` / `333:3624` — the action is drawn as a LINK, not as a second label: `#01CF8F`
   * and underlined. Sampled off the node, which renders it in exactly that emerald the file
   * already uses for "Free" on the cancellation policy.
   */
  actionLabel: { textDecorationLine: 'underline' },
});
