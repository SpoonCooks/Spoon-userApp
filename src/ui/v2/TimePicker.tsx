import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '../primitives/Text';
import { lightTheme } from '../theme/ThemeProvider';

/**
 * The time-of-day tabs and the start-time grid shared by Recurring's Schedule (`340:7539`) and
 * Schedule for Later (`2466:19025`): the same tabs over a rule and the same 44pt start times, three
 * to a row. Moved here from Recurring's `VisitChoices` so both screens draw one component.
 */

export type TimeOfDayId = 'morning' | 'afternoon' | 'evening';

/** `340:7539` / `1094:132` — the 18pt yellow sunrise / noon / sunset on the tabs. */
export const TIME_OF_DAY_TAB_ICONS: Readonly<Record<TimeOfDayId, ImageSourcePropType>> = {
  morning: require('../../../assets/figma/recurring/tab-morning.png') as ImageSourcePropType,
  afternoon: require('../../../assets/figma/recurring/tab-afternoon.png') as ImageSourcePropType,
  evening: require('../../../assets/figma/recurring/tab-evening.png') as ImageSourcePropType,
};

/** Rows of `columns` equal cells, `gap` apart both ways; a short last row keeps cell widths. */
export function TimeGrid({
  columns,
  gap = SLOT_GAP,
  children,
}: {
  readonly columns: number;
  readonly gap?: number;
  readonly children: ReactNode[];
}) {
  const rows: ReactNode[][] = [];
  children.forEach((child, index) => {
    const row = Math.floor(index / columns);
    (rows[row] ??= []).push(child);
  });
  return (
    <View style={{ gap }}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}>
          {Array.from({ length: columns }, (_, column) => (
            <View key={`cell-${column}`} style={styles.cell}>
              {row[column] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

interface ChoiceProps {
  readonly selected: boolean;
  /** Nothing to choose: `color/surface/disabled`, not pressable. */
  readonly disabled?: boolean;
  readonly onPress: () => void;
  readonly testID?: string;
}

/** `340:7539` "Time of day" — the row of tabs over a 1pt rule. */
export function TimeOfDayTabs({ children }: { readonly children: ReactNode }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {children}
    </View>
  );
}

/**
 * `340:7539` / `2466:19043` "Period" — a third of the row: the 18pt yellow pictogram 6 from a
 * 14/20 label, 4 below. The tab in use is SemiBold black over a 2pt `#FFD600` underline; the rest
 * Regular at 60 %. A time of day with nothing left is greyed and does not respond.
 */
export function TimeTab({
  id,
  label,
  selected,
  disabled = false,
  onPress,
  testID,
}: ChoiceProps & { readonly id: TimeOfDayId; readonly label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      disabled={disabled}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={[styles.tab, selected ? styles.tabSelected : null, disabled ? styles.dim : null]}
      testID={testID}
    >
      {/* Full colour on the tab in use, half on the others (`340:7539`). The Morning and Evening
          exports had the half baked in, so they stayed faded when chosen (owner, 2026-10-16). */}
      <Image
        source={TIME_OF_DAY_TAB_ICONS[id]}
        style={[styles.tabIcon, selected ? null : styles.tabIconIdle]}
      />
      <Text
        variant={selected ? 'bodyLargeStrong' : 'bodyLarge'}
        color={selected ? 'textPrimary' : 'textSubdued'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * `340:7539` / `2466:19056` "Slot" — 44 tall at a 16pt radius, a 14/20 time. Open: white with a
 * 1.5pt `#FFEF99` edge. Picked: `#E2FF68`, a 1.5pt black-25 % edge and a soft lift, the time
 * SemiBold. Taken: black at 3 %, the time at 25 %.
 */
export function SlotChip({
  label,
  selected,
  disabled = false,
  onPress,
  testID,
}: ChoiceProps & { readonly label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      disabled={disabled}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={[
        styles.slot,
        disabled ? styles.slotTaken : selected ? styles.slotPicked : styles.slotOpen,
      ]}
      testID={testID}
    >
      <Text
        variant={selected && !disabled ? 'bodyLargeStrong' : 'bodyLarge'}
        color={disabled ? 'textDisabledSoft' : 'textPrimary'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** `340:7539` — three 118pt slots across 370: 8 apart, both ways. */
export const SLOT_GAP = 8;

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.borderTimeTabs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: lightTheme.space.xs,
    paddingBottom: lightTheme.space.s10,
  },
  /** The 2pt underline sits on the 1pt rule: pulled down by 1 so the two overlap. */
  tabSelected: {
    borderBottomWidth: 2,
    borderBottomColor: lightTheme.colors.borderTimeTabSelected,
    marginBottom: -1,
  },
  tabIcon: { width: 18, height: 18 },
  tabIconIdle: { opacity: 0.5 },
  dim: { opacity: 0.4 },
  slot: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.md,
  },
  slotOpen: {
    borderWidth: 1.5,
    borderColor: lightTheme.colors.borderStartTime,
    backgroundColor: lightTheme.colors.surface,
  },
  slotPicked: {
    borderWidth: 1.5,
    borderColor: lightTheme.colors.borderDurationFocus,
    backgroundColor: lightTheme.colors.surfaceStartTimeSelected,
    boxShadow: '0 0 12px rgba(0,0,0,0.1)',
  },
  slotTaken: { backgroundColor: lightTheme.colors.surfaceStartTimeUnavailable },
});
