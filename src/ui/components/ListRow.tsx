import { Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { Icon } from '@ui/primitives/Icon';
import type { IconName } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Repeating row — saved addresses (`68:214`), the Profile footer links, and the "Change" row on
 * the address form.
 *
 * The audit notes saved-address rows have no per-row edit/delete affordance and no selected
 * state drawn; `trailing` and `selected` exist so those can be added without a new component
 * when design provides them.
 */

export interface ListRowProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: IconName;
  readonly trailing?: ReactNode;
  readonly onPress?: () => void;
  readonly selected?: boolean;
  readonly destructive?: boolean;
  readonly testID?: string;
}

export function ListRow({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  selected = false,
  destructive = false,
  testID,
}: ListRowProps) {
  const content = (
    <View style={[styles.row, selected ? styles.selected : null]}>
      {icon === undefined ? null : (
        <Icon name={icon} size={18} color={destructive ? 'danger' : 'textSecondary'} />
      )}

      <View style={styles.text}>
        <Text variant="bodyStrong" color={destructive ? 'danger' : 'textPrimary'}>
          {title}
        </Text>
        {subtitle === undefined ? null : (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {trailing ??
        (onPress === undefined ? null : <Icon name="forward" size={16} color="textSecondary" />)}
    </View>
  );

  if (onPress === undefined) {
    return (
      <View testID={testID} accessible accessibilityLabel={labelOf(title, subtitle)}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={labelOf(title, subtitle)}
      accessibilityState={{ selected }}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {content}
    </Pressable>
  );
}

function labelOf(title: string, subtitle?: string): string {
  return subtitle === undefined ? title : `${title}, ${subtitle}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    minHeight: lightTheme.layout.minTouchTarget,
    paddingVertical: lightTheme.space.md,
  },
  selected: { opacity: 1 },
  text: { flex: 1, gap: lightTheme.space.xxs },
  pressed: { opacity: 0.7 },
});
