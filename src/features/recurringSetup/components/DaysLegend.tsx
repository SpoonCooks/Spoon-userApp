import { StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The key under Step 1's calendar — Figma `cCQlzTeiObQkpVBzwI8mZi`, `Legend` `1366:2944`: a 10pt
 * dot and a Micro caption twice over, 12 apart, centred — "Selected" in `#FFEF99` and "Start/ End
 * date" in `#FFD600`. The copy is the file's, spacing and all. The dots are plain circles, so
 * they are drawn rather than exported.
 */
export function DaysLegend({ testID = 'recurring-days-legend' }: { readonly testID?: string }) {
  return (
    <View style={styles.legend} testID={testID} accessibilityElementsHidden>
      <LegendItem label="Selected" color={lightTheme.colors.surfaceLegendSelected} />
      <LegendItem label="Start/ End date" color={lightTheme.colors.surfaceBrand} />
    </View>
  );
}

function LegendItem({ label, color }: { readonly label: string; readonly color: string }) {
  return (
    <View style={styles.item}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="microRegular" color="textLegend">
        {label}
      </Text>
    </View>
  );
}

const DOT = 10;

const styles = StyleSheet.create({
  /** `1366:2944` — 12 between the two entries. */
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.md,
  },
  /** `1351:4410` — 4 between the dot and its caption. */
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.xs,
  },
  /** `1351:4411` — a 10pt circle. */
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
});
