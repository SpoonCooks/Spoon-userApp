import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BookingMode } from '../state/bookingDraft';
import { C, F } from '../theme';

const TABS: readonly { id: BookingMode; label: string }[] = [
  { id: 'now', label: 'Now' },
  { id: 'later', label: 'Later' },
  { id: 'recurring', label: 'Recurring' },
];

export interface BookingToggleProps {
  readonly value: BookingMode;
  readonly onChange: (mode: BookingMode) => void;
  /**
   * `1303:1423` — on Now while instant is unavailable the fill turns grey to signal it; the tab
   * stays tappable and shows the same SKUs with a Schedule CTA.
   */
  readonly muted?: boolean;
}

const WIDTH = 274;
const HEIGHT = 48;
const BORDER = 1;
/** The active fill's inset from the border, the same on every side. */
const INSET = 3;
const PILL_HEIGHT = HEIGHT - 2 * BORDER - 2 * INSET;
const CELL = (WIDTH - 2 * BORDER - 2 * INSET) / 3;

/**
 * `1297:1415` "Toggle/ booking" — 274 × 48 pill with a state per tab (Now / Later / Recurring).
 * The frame puts the 88 × 40 fill at y 3 and x 4, which leaves 5pt under it and 6pt right of the
 * last tab; here the fill is inset an even 3pt inside the 1pt border on every side (40 tall, three
 * equal cells), and each label is centred in its cell.
 *
 * Per the component's dev note, no tab is ever unclickable or deactivated — what a mode can do is
 * decided by the content below it — and the group is a radio group for accessibility. Switching
 * keeps the chosen duration (the draft owns it, not this control).
 */
export function BookingToggle({ value, onChange, muted = false }: BookingToggleProps) {
  const index = Math.max(
    0,
    TABS.findIndex((tab) => tab.id === value),
  );
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel="Booking type">
      <View
        style={[styles.pill, muted ? styles.pillMuted : null, { left: INSET + index * CELL }]}
      />
      <View style={styles.cells}>
        {TABS.map((tab) => {
          const active = tab.id === value;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="radio"
              accessibilityLabel={tab.label}
              accessibilityState={{ checked: active }}
              onPress={() => onChange(tab.id)}
              style={styles.cell}
            >
              <Text style={[styles.label, active ? styles.labelActive : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: 9999,
    borderWidth: BORDER,
    borderColor: C.brand,
    alignSelf: 'center',
  },
  pill: {
    position: 'absolute',
    top: INSET,
    width: CELL,
    height: PILL_HEIGHT,
    borderRadius: 9999,
    backgroundColor: C.brand,
  },
  pillMuted: { backgroundColor: C.textDisabled },
  cells: {
    position: 'absolute',
    left: INSET,
    top: INSET,
    height: PILL_HEIGHT,
    flexDirection: 'row',
  },
  cell: { width: CELL, height: PILL_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  label: {
    width: CELL,
    textAlign: 'center',
    fontFamily: F.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: C.textSecondary,
  },
  labelActive: { fontFamily: F.bold, color: C.text },
});
