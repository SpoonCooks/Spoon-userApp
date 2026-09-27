import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * A compact segmented toggle — first drawn as the Meal Library's Veg / Non-Veg switch (Figma
 * `cCQlzTeiObQkpVBzwI8mZi` `1:649`).
 *
 * White at 80%, 2 inside, options 4 apart, a 12pt radius and a `0 1 0 rgba(0,0,0,0.05)` ledge.
 * Each option is 12 / 4 inside an 8pt radius with a Livvic Bold 12/16 `#78716C` label.
 *
 * The frame draws every option IDLE. A selected option takes the pill-tab selected treatment
 * (`#FFD600` behind `#1C1917`) so the two controls on the screen agree.
 *
 * `selectedId` may be `null` — nothing selected. With `allowDeselect`, tapping the selected option
 * reports `null`, so the toggle can act as an optional filter.
 */
export interface SegmentedToggleOption {
  readonly id: string;
  readonly label: string;
}

export interface SegmentedToggleProps {
  readonly options: readonly SegmentedToggleOption[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
  readonly allowDeselect?: boolean;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

export function SegmentedToggle({
  options,
  selectedId,
  onSelect,
  allowDeselect = false,
  accessibilityLabel,
  testID,
}: SegmentedToggleProps) {
  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(selected && allowDeselect ? null : option.id)}
            hitSlop={8}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            testID={testID === undefined ? undefined : `${testID}-${option.id}`}
            style={[styles.option, selected ? styles.optionSelected : null]}
          >
            <Text variant="bodyBold" color={selected ? 'textWarmInk' : 'textWarmQuiet'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.xxs,
    borderRadius: lightTheme.radius.r12,
    backgroundColor: lightTheme.colors.surfaceToggleTrack,
    ...lightTheme.elevation.ledge,
  },
  option: {
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.xs,
  },
  optionSelected: { backgroundColor: lightTheme.colors.surfaceCta },
});
