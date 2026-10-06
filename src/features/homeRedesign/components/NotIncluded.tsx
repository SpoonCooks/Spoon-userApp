import { Image, StyleSheet, Text, View } from 'react-native';

import { ART } from '../assets';
import { EXCLUSIONS } from '../content';
import { C, F } from '../theme';

/** `1186:749` "Not included · Off the clock". */
export function NotIncluded() {
  return (
    <View style={styles.section}>
      <View style={styles.titles}>
        <Text style={styles.eyebrow}>WHAT’S NOT INCLUDED?</Text>
        <Text style={styles.title}>{'Your cook cooks.\nThe rest stays off the clock.'}</Text>
        <Text style={styles.sub}>So that every minute you book goes into your food!</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.chips}>
          {EXCLUSIONS.map((label) => (
            <View key={label} style={styles.chip}>
              <Image source={ART.notIncluded} style={styles.icon} />
              <Text style={styles.chipLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16, paddingHorizontal: 16, paddingBottom: 24, width: '100%' },
  titles: { gap: 4 },
  eyebrow: {
    fontFamily: F.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: C.textSecondary,
  },
  title: { fontFamily: F.bold, fontSize: 20, lineHeight: 28, color: C.text },
  sub: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary },
  card: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.soft,
    backgroundColor: C.base,
    overflow: 'hidden',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.softer,
  },
  icon: { width: 16, height: 16 },
  chipLabel: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.textSecondary },
});
