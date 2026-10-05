import { Image, StyleSheet, Text, View } from 'react-native';

import { ART } from '../assets';
import { C, F } from '../theme';

/**
 * `1117:295` — the 104pt cook-at-the-stove scene.
 *
 * The illustration is a flattened export of the scene's artwork (the cook, steam and stove),
 * cropped to the right 205pt; the headline is live text over the left. The steam animation in
 * Figma is not reproduced.
 */
export function HeroBanner() {
  return (
    <View style={styles.wrap}>
      <View style={styles.scene}>
        <Image source={ART.hero} style={styles.art} resizeMode="cover" />
        <Text style={styles.headline}>
          All your meal worries now <Text style={styles.underline}>gone</Text>!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 12 },
  scene: {
    height: 104,
    borderRadius: 24,
    backgroundColor: C.soft,
    overflow: 'hidden',
  },
  art: { position: 'absolute', right: 0, top: 0, width: 205, height: 104 },
  headline: {
    position: 'absolute',
    left: 16,
    top: 30,
    width: 154,
    fontFamily: F.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: C.text,
  },
  underline: { textDecorationLine: 'underline' },
});
