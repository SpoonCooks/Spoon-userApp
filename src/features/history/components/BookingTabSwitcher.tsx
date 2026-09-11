import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The Upcoming / Past segmented switcher on the My bookings screen.
 *
 * No existing component fits: `Chip`/`ChipGroup` (`@ui/primitives`) are built for a multi-option
 * wrapping row or grid at the 12pt `optionRadius`, not a full-width two-segment pill shell. Built
 * fresh, but mirroring `ChipGroup`'s established shape — a radiogroup, `selectedId`/`onSelect`,
 * `${testID}-${option.id}` per-segment testIDs — so this reads as the same FAMILY of control, not
 * an unrelated one-off.
 *
 * Feature-local rather than promoted to `@ui`: there is exactly one consumer today
 * (`BookingListScreen.tsx`), and this codebase's stated preference is against abstracting before a
 * second real consumer exists.
 */

export interface BookingTabOption {
  readonly id: string;
  readonly label: string;
}

export interface BookingTabSwitcherProps {
  readonly options: readonly BookingTabOption[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly testID?: string;
}

/**
 * `paddingVertical(sm=8)*2 + bodyBold's 16pt line height` draws each segment at ~32pt tall — short
 * of the 44pt touch target, the same gap `Chip`'s own `TOUCH_SLOP` closes. Vertical-only, unlike
 * `Chip`'s uniform slop: the two segments sit only `space.xxs` (2pt) apart horizontally, so an
 * equal left/right expansion would overlap the neighbouring segment's own hit area and make a tap
 * near the shared edge resolve to either one. Nothing else borders a segment vertically, so that
 * direction can close the full gap with no such conflict.
 */
const TOUCH_SLOP = { top: 6, bottom: 6, left: 0, right: 0 };

export function BookingTabSwitcher({
  options,
  selectedId,
  onSelect,
  testID = 'booking-tab-switcher',
}: BookingTabSwitcherProps) {
  return (
    <View style={styles.shell} accessibilityRole="radiogroup" testID={testID}>
      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            hitSlop={TOUCH_SLOP}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.segment,
              selected ? styles.segmentActive : null,
              pressed ? styles.pressed : null,
            ]}
            testID={`${testID}-${option.id}`}
          >
            <Text
              variant="bodyBold"
              color={selected ? 'textPrimary' : 'textSecondary'}
              align="center"
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: lightTheme.colors.surfaceTileIdle,
    borderRadius: lightTheme.layout.pillRadius,
    padding: lightTheme.space.xxs,
    gap: lightTheme.space.xxs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.layout.pillRadius,
  },
  segmentActive: {
    backgroundColor: lightTheme.colors.surfaceAccentBold,
    ...lightTheme.elevation.pill,
  },
  pressed: { opacity: 0.85 },
});
