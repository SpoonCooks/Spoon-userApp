import { Image, Pressable, StyleSheet } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { CALENDAR_ADD_ICON } from '../art';

/**
 * "Top CTA" — `983:6074`: the lime "Schedule Now" tag that hangs off the thread's knot at the top
 * of the page. A pill (`#CFFF04`, pl 12 / pr 14 / py 10, 6 between a 24pt calendar-plus and a
 * Livvic Bold 16/24 label) with `Elevation/2` under it. It is the page's one "schedule" button
 * while it is on screen; once it has scrolled away the sticky footer takes over (`stickyFooter.ts`).
 */
export interface ScheduleTagProps {
  readonly onPress: () => void;
  readonly testID?: string;
}

export function ScheduleTag({ onPress, testID = 'schedule-tag' }: ScheduleTagProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Schedule now"
      style={styles.pill}
      testID={testID}
    >
      <Image source={CALENDAR_ADD_ICON} style={styles.icon} />
      <Text variant="headingBold" color="textPrimary">
        Schedule Now
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingLeft: lightTheme.space.md,
    paddingRight: 14,
    paddingVertical: lightTheme.space.s10,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfacePositiveBright,
    ...lightTheme.elevation.tag,
  },
  icon: { width: 24, height: 24 },
});
