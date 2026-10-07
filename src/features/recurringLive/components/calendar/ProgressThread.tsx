import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { PROGRESS_KNOT } from './assets';

/**
 * `1005:168` "Progress" — the plan's tally over a "Thread bar" (`1005:173`): a 12pt-tall row
 * holding an 8pt `#FFF7CC` track, the `#FFD600` Done fill (154 of 370pt on the frame) and the
 * 12pt knot centred on the fill's end (`1005:176`, x 148 = 154 − 6).
 */
export interface ProgressThreadProps {
  readonly label: string;
  /** 0–1 share of the track the Done fill covers. */
  readonly fraction: number;
  readonly testID?: string;
}

export function ProgressThread({
  label,
  fraction,
  testID = 'progress-thread',
}: ProgressThreadProps) {
  const percent = `${Math.min(Math.max(fraction, 0), 1) * 100}%` as const;

  return (
    <View style={styles.block} testID={testID}>
      <Text variant="spoonEmphasis" color="textPrimary">
        {label}
      </Text>
      <View
        style={styles.bar}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      >
        <View style={styles.track} />
        <View style={[styles.doneSlot, { width: percent }]}>
          <View style={styles.done} />
          <Image source={PROGRESS_KNOT} style={styles.knot} />
        </View>
      </View>
    </View>
  );
}

const BAR = 12;
const LINE = 8;
const KNOT = 12;

const styles = StyleSheet.create({
  block: { gap: lightTheme.space.s10 },
  bar: { height: BAR },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (BAR - LINE) / 2,
    height: LINE,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  doneSlot: { position: 'absolute', left: 0, top: 0, height: BAR },
  done: {
    marginTop: (BAR - LINE) / 2,
    height: LINE,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  knot: { position: 'absolute', top: 0, right: -KNOT / 2, width: KNOT, height: KNOT },
});
