import { StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import type { IconName } from './Icon';
import { Text } from './Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { Tone } from '@ui/tokens/semantic';

/**
 * Status pill — "Completed", "Unfulfilled", "Processing", "Refunded", "SPECIAL OFFER", "Popular".
 *
 * BOUNDARY: takes a presentation `tone` and a display `label`. It does NOT know backend status
 * values, and there is no status→tone map in this layer — that mapping belongs to the screen,
 * once a contract exists. (docs/FIGMA_FINAL_BLOCKERS.md: the drawn set is
 * `Completed | Unfulfilled` and `Processing | Refunded`, with no `Cancelled` and no `Failed`.)
 */

/**
 * `sm` is every existing status pill. `md` is the recurring-setup day counter ("3 / 14"): px 12 /
 * py 6 and a Livvic Black 14/18 label (`4:318`, 30 tall).
 */
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  readonly label: string;
  readonly tone?: Tone;
  readonly icon?: IconName;
  readonly uppercase?: boolean;
  readonly size?: BadgeSize;
  readonly testID?: string;
}

export function Badge({
  label,
  tone = 'neutral',
  icon,
  uppercase = false,
  size = 'sm',
  testID,
}: BadgeProps) {
  const palette = lightTheme.tones[tone];
  const md = size === 'md';

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[styles.base, md ? styles.md : null, { backgroundColor: palette.surface }]}
    >
      {icon === undefined ? null : <Icon name={icon} size={12} />}
      <Text
        variant={md ? 'labelCounter' : uppercase ? 'labelUpper' : 'label'}
        style={{ color: palette.text }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: lightTheme.space.xs,
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.layout.pillRadius,
  },
  md: { paddingHorizontal: lightTheme.space.md, paddingVertical: lightTheme.space.s6 },
});
