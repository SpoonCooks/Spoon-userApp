import { Image, StyleSheet, Text, View } from 'react-native';

import { ART } from '../assets';
import { C, F } from '../theme';

/**
 * `1171:20613` "Closing", plus the frame-level wave beneath it.
 *
 * The wave (445 × 33.67) is drawn on the artboard, not in the body: its top sits 2.8pt above the
 * end of "Closing" and its left edge 22pt off-screen. The frame then runs 62.8pt past the body,
 * of which the bottom 34 is the home indicator — the screen supplies that as its safe area.
 */
export function PromiseFooter() {
  return (
    <View style={styles.section}>
      <View style={styles.closing}>
        <Text style={styles.statement}>{'Cooked to\nyour taste,\nneeds & moods.'}</Text>
        <Text style={styles.caption}>Spoon’s promise.</Text>
      </View>
      <View style={styles.tail}>
        <Image source={ART.promiseWave} style={styles.wave} resizeMode="stretch" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { width: '100%' },
  closing: { gap: 16, paddingHorizontal: 16, paddingBottom: 8 },
  statement: { fontFamily: F.bold, fontSize: 24, lineHeight: 32, color: C.brand },
  caption: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.text },
  tail: { height: 62.8 - 34 },
  wave: { position: 'absolute', left: -22, top: -2.8, width: 445, height: 33.67 },
});
