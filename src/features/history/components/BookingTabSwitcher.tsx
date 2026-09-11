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
 * Each segment is a fixed 34pt tall (the Figma inspector's own measured value for the "Past"
 * layer) — short of the 44pt touch target by 10, the same gap `Chip`'s own `TOUCH_SLOP` closes.
 * Vertical-only, unlike `Chip`'s uniform slop: the two segments sit only `space.s6` (6pt) apart
 * horizontally (the shell's own Figma-measured gap), so an equal left/right expansion of 6pt
 * would fully close that gap and make a tap right on the shared edge resolve to either segment.
 * Nothing else borders a segment vertically, so that direction can close the full gap with no
 * such conflict (34 + 6 + 6 = 46, comfortably past the 44pt minimum).
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
            {/* Both states read black and at the same weight/size — only the pill fill behind
              the text is what tells idle from active, never the text treatment itself. */}
            <Text variant="titleBlack" color="textPrimary" align="center" numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Read directly off the Figma layer inspector, not estimated: `338.44 Fill x 46 Hug` overall —
   * `alignSelf: 'stretch'` covers the Fill width, `height: 46` the Hug height explicitly rather
   * than trusting padding-plus-line-height arithmetic to land on the same number RN's own font
   * metrics might round slightly differently. Fill is a 100%-opaque `#FFF7CC`
   * (`surfaceAccent`/`yellow200`, not a translucent wash), padding 6, gap 6 (`space.s6` — the same
   * "exact non-scale Figma value" token `ChipGroup` already uses for its own 6pt gutter), corner
   * radius 20. Effects panel shows Drop shadow UNCHECKED — the soft edge visible in a flat
   * screenshot is compression/anti-aliasing between two close pale colours, not an actual glow.
   */
  shell: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    height: 46,
    backgroundColor: lightTheme.colors.surfaceAccent,
    borderRadius: lightTheme.layout.pillRadius,
    padding: lightTheme.space.s6,
    gap: lightTheme.space.s6,
  },
  /** `155.22 Fill x 34` per the inspector, for the "Past" (active) layer specifically — applied to
   * every segment, active or not, so idle and active are the same size and only the fill differs. */
  segment: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: lightTheme.space.md,
    borderRadius: lightTheme.layout.pillRadius,
    // Idle carries NO fill of its own — it reads directly on the shell's shared track colour,
    // which is what makes only the active segment stand out as its own distinct pill.
  },
  /**
   * `surfaceCta` (`#FFD600`) — confirmed against a second real reference: the Profile completion
   * card's own "View profile" button (`ProfileCompletionCard.tsx`) uses this exact token, and the
   * user pointed at it directly as the match, rather than `surfaceAccentBold` (`#FFE666`,
   * noticeably paler) this was using before. A modest card-lift shadow gives it the "raised" look
   * the design reference shows.
   */
  segmentActive: {
    backgroundColor: lightTheme.colors.surfaceCta,
    ...lightTheme.elevation.soft,
  },
  pressed: { opacity: 0.85 },
});
