import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { Text, lightTheme } from '@ui';

import { PROFILE_CHIP_REMOVE } from '../assets';
import type { ProfileChipTone, ProfileOption } from '../fields';

/**
 * `338:4511` — the profile page's option chips.
 *
 * ## Why these are not `@ui/primitives/Chip`
 *
 * The shared `Chip` is the booking-flow chip (`37:3718`): px 9.8 / py 7.8, a 12pt radius, NO
 * border, and a Livvic Black 12/16 label on a filled ground. The profile chip differs in six of
 * those properties at once — px **15.889** / py **5.889**, a **7pt** radius, a **1pt border**, a
 * fixed **21pt** height and a Livvic **Regular 11/16.5 at −0.275** label on WHITE. A third
 * `density` on `Chip` would have to override every one of them, which is not a density; it is a
 * different component wearing the same name. `Chip` already split `slot` out for three
 * divergences, so the precedent is to separate rather than to parameterise.
 *
 * ## The two families
 *
 * The frame draws these chips in two treatments, and it is consistent about which group gets
 * which — see `fields.ts`. `tone` carries the choice so no screen picks a colour:
 *
 *   lime  `#CFFF04` edge, `#ECFF9B` at 70 % selected — Household, Region, Gender
 *   gold  `#FFD600` edge, `#FFEF99` selected          — Daily meal structure, Dietary preference
 *
 * ## Touch target
 *
 * 21pt is less than half the 44pt minimum, and the chip's drawn height is not negotiable, so the
 * target is restored with `hitSlop` — the same trade `Chip` and `Button size="bar"` already make.
 * 12pt of slop on each axis takes a 21 × ~100 chip past 44 vertically without redrawing it.
 */

/** `456:3406` — 21 tall, px 15.889 / py 5.889, 7pt radius, 1pt edge. */
const CHIP_HEIGHT = 21;
const CHIP_RADIUS = 7;
const CHIP_PADDING_X = 15.889;
const CHIP_PADDING_Y = 5.889;
/** `341:4648` — the 3-column groups pad 4 all round instead, so a 3-up row still fits 320dp. */
const CHIP_PADDING_X_TIGHT = lightTheme.space.xs;
/** (44 − 21) / 2 = 11.5, rounded up. */
const TOUCH_SLOP = 12;

export interface PreferenceChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly tone: ProfileChipTone;
  /** 3-column groups (`341:4647`, `341:4630`) draw the tighter 4pt horizontal padding. */
  readonly tight?: boolean;
  readonly onPress: () => void;
  readonly testID?: string;
}

export function PreferenceChip({
  label,
  selected,
  tone,
  tight = false,
  onPress,
  testID,
}: PreferenceChipProps) {
  const surface: ViewStyle = selected
    ? tone === 'gold'
      ? styles.selectedGold
      : styles.selectedLime
    : styles.idle;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={TOUCH_SLOP}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        tight ? styles.chipTight : null,
        tone === 'gold' ? styles.edgeGold : styles.edgeLime,
        surface,
        pressed ? styles.pressed : null,
      ]}
    >
      {/*
        `456:3407` — Livvic Regular 11/16.5 at −0.275, centred.

        NOT `numberOfLines={1}`. "Office meals + food delivery" is 130pt of type in a chip that is
        159pt at the reference width and ~135pt at 320dp; clamped to one line it ellipsizes to
        "Office meals + food deliv…" on a small handset. Allowed to wrap, the chip grows instead —
        which is why the height below is a MINIMUM rather than the frame's fixed 21.
      */}
      <Text variant="chipLabel" color="textPrimary" align="center">
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------- the grid */

export interface PreferenceGridProps {
  readonly options: readonly ProfileOption[];
  readonly selectedId: string | null;
  readonly tone: ProfileChipTone;
  /** `456:3405` is 2; `341:4647` and `341:4630` are 3. */
  readonly columns: number;
  readonly onSelect: (id: string) => void;
  readonly accessibilityLabel?: string;
  readonly testID: string;
}

/**
 * The chip grid — `456:3405` (2 × 2) and `341:4647` (3 × 1).
 *
 * Both draw `gap-x 12 / gap-y 8` over equal-width tracks. The gutters are carried as cell padding
 * with the container pulled back by the same amount, which is how `ChipGroup` already does it: a
 * percentage-width track plus a margin would not add up to 100 %.
 */
export function PreferenceGrid({
  options,
  selectedId,
  tone,
  columns,
  onSelect,
  accessibilityLabel,
  testID,
}: PreferenceGridProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="radiogroup"
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      style={styles.grid}
    >
      {options.map((option) => (
        <View key={option.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
          <PreferenceChip
            label={option.label}
            selected={selectedId === option.id}
            tone={tone}
            tight={columns > 2}
            onPress={() => onSelect(option.id)}
            testID={`${testID}-${option.id}`}
          />
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------------------------------- removable (341:4655) */

export interface RemovableChipProps {
  readonly label: string;
  readonly onRemove: () => void;
  readonly testID?: string;
}

/**
 * `341:4652` — a chip the customer has ADDED to `341:4655`, with its own remove control.
 *
 * Geometry is its own: px 8 / py 4, a **15pt** radius, a 6pt gap and the 15pt `408:1382` cross.
 * Selection here is not a fill — presence in the list IS the selection — so the chip stays white
 * behind its lime edge however many are chosen.
 *
 * The cross is the whole chip's press target rather than a nested button: a 15pt control inside a
 * 27pt chip is below any reasonable touch minimum, and there is nothing else the chip could do.
 */
export function RemovableChip({ label, onRemove, testID }: RemovableChipProps) {
  return (
    <Pressable
      onPress={onRemove}
      testID={testID}
      hitSlop={lightTheme.space.sm}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label}`}
      style={({ pressed }) => [styles.removable, pressed ? styles.pressed : null]}
    >
      <Text variant="chipLabel" color="textPrimary" align="center">
        {label}
      </Text>
      <Image
        source={PROFILE_CHIP_REMOVE}
        style={styles.removeMark}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: CHIP_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: CHIP_PADDING_X,
    paddingVertical: CHIP_PADDING_Y,
    borderRadius: CHIP_RADIUS,
    borderWidth: lightTheme.stroke.thin,
    backgroundColor: lightTheme.colors.surface,
    /**
     * `456:3406` — `0 1 1 rgba(0,0,0,0.05)`, which is `elevation.badge` exactly.
     *
     * FIGMA INCONSISTENCY recorded: the twenty option chips do not agree with each other. Most
     * carry `0 1 1` at 5 %, the two SELECTED lime chips (`456:3408`, `341:4650`) carry `0 1 2`,
     * and two idle chips (`456:3426`, `338:4542`) carry none at all — the same chip in the same
     * grid, drawn three ways. The dominant value is taken for all of them rather than reproducing
     * mock noise as a per-chip rule.
     */
    ...lightTheme.elevation.badge,
  },
  chipTight: { paddingHorizontal: CHIP_PADDING_X_TIGHT },
  /** `456:3406` — `#CFFF04`. */
  edgeLime: { borderColor: lightTheme.colors.borderPositive },
  /** `456:3420` — `#FFD600`. */
  edgeGold: { borderColor: lightTheme.colors.borderNotice },
  idle: { backgroundColor: lightTheme.colors.surface },
  /** `456:3408` — `lime300` at 70 %, pre-composited. */
  selectedLime: { backgroundColor: lightTheme.colors.surfaceOptionSelected },
  /** `456:3422` — `#FFEF99`. */
  selectedGold: { backgroundColor: lightTheme.colors.surfaceAccentStrong },
  pressed: { opacity: 0.8 },

  /** `456:3405` — gap-x 12 / gap-y 8, carried as cell padding and pulled back off the container. */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -lightTheme.space.s6,
    marginBottom: -lightTheme.space.sm,
  },
  cell: { paddingHorizontal: lightTheme.space.s6, paddingBottom: lightTheme.space.sm },

  /** `341:4652` — px 8 / py 4, r15, 6pt gap. */
  removable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.r15,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderPositive,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  /** `408:1382` — 15 × 15. */
  removeMark: { width: 15, height: 15 },
});
