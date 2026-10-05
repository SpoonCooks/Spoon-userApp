import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * "Steppers" — `983:6071` / `970:5395`: a 38pt white square that sits on the thread's rail beside
 * a section's heading, with a 24pt glyph in it. It hides the rail behind it, so the thread seems
 * to be tied off at each stop. The content column starts 40 in from the page's edge and the
 * marker sits 1 in, so it hangs 39 off the column's left, centred on the heading it is placed in.
 */
export interface RailMarkerProps {
  readonly source: ImageSourcePropType;
  /** The heading's line height, which the marker is centred on. */
  readonly headingHeight: number;
}

export function RailMarker({ source, headingHeight }: RailMarkerProps) {
  return (
    <View
      style={[styles.marker, { top: (headingHeight - MARKER) / 2 }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image source={source} style={styles.glyph} />
    </View>
  );
}

const MARKER = 38;

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    left: -39,
    width: MARKER,
    height: MARKER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  glyph: { width: 24, height: 24 },
});
