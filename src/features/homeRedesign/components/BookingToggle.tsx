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
  /** "Now" is off when instant is unavailable; "Recurring" is locked until the pool qualifies. */
  readonly disabled?: Partial<Record<BookingMode, boolean>>;
}

/** Figma draws children from the frame's outer edge; React Native from inside the 1pt border. */
const BORDER = 1;
const CELL = 88;

/**
 * `1290:2328` / `1290:2363` — 274 × 48 pill. Labels sit in 88pt cells from x 4, y 11; the active
 * 88 × 40 fill sits at x 4 + 88·i, y 3.
 */
export function BookingToggle({ value, onChange, disabled = {} }: BookingToggleProps) {
  const index = Math.max(
    0,
    TABS.findIndex((tab) => tab.id === value),
  );
  return (
    <View style={styles.track} accessibilityRole="tablist">
      <View style={[styles.pill, { left: 4 - BORDER + index * CELL }]} />
      <View style={styles.cells}>
        {TABS.map((tab) => {
          const active = tab.id === value;
          const off = disabled[tab.id] === true;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: off }}
              disabled={off}
              onPress={() => onChange(tab.id)}
              style={styles.cell}
            >
              <Text
                style={[
                  styles.label,
                  active ? styles.labelActive : null,
                  off ? styles.labelDisabled : null,
                ]}
              >
                {tab.label}
              </Text>
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
  labelDisabled: { color: C.textDisabled },
});
