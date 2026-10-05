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

/** Figma draws children from the frame's outer edge; React Native from inside the 1pt border. */
const BORDER = 1;
const CELL = 88;

/**
 * `1297:1415` "Toggle/ booking" — 274 × 48 pill with a state per tab (Now / Later / Recurring).
 * Labels sit in 88pt cells from x 4, y 11; the active 88 × 40 fill sits at x 4 + 88·i (4, 92,
 * 180), y 3.
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
        style={[styles.pill, muted ? styles.pillMuted : null, { left: 4 - BORDER + index * CELL }]}
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
    width: 274,
    height: 48,
    borderRadius: 9999,
    borderWidth: BORDER,
    borderColor: C.brand,
    alignSelf: 'center',
  },
  pill: {
    position: 'absolute',
    top: 3 - BORDER,
    width: CELL,
    height: 40,
    borderRadius: 9999,
    backgroundColor: C.brand,
  },
  pillMuted: { backgroundColor: C.textDisabled },
  cells: { position: 'absolute', left: 4 - BORDER, top: 0, bottom: 0, flexDirection: 'row' },
  cell: { width: CELL, paddingTop: 11 - BORDER, alignItems: 'center' },
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
