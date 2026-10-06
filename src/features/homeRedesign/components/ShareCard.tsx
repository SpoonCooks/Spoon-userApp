import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ART } from '../assets';
import { C, F } from '../theme';

export interface ShareCardProps {
  readonly onPressShare: () => void;
}

/** `1302:4534` "Share · Spread the word" — not-live frame only, between exclusions and closing. */
export function ShareCard({ onPressShare }: ShareCardProps) {
  return (
    <View style={styles.section}>
      <LinearGradient
        colors={[C.limeSoft, '#F5FFCD', '#FAFFE6', C.base]}
        locations={[0, 0.20673, 0.42788, 1]}
        style={styles.card}
      >
        <View style={styles.top}>
          <Text style={styles.eyebrow}>SPREAD THE WORD</Text>
          <Pressable accessibilityRole="button" onPress={onPressShare} style={styles.button}>
            <Image source={ART.whatsappGlyph} style={styles.glyph} />
            <Text style={styles.buttonLabel}>Share Spoon</Text>
          </Pressable>
        </View>
        <View style={styles.titles}>
          <Text style={styles.title}>Love what Spoon does?</Text>
          <Text style={styles.sub}>
            Share the app with friends and family in HSR Layout or Harlur. The more people ask, the
            sooner we come to you!
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, width: '100%' },
  card: { gap: 16, padding: 20, borderRadius: 24, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  eyebrow: {
    width: 158,
    fontFamily: F.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: C.textSecondary,
  },
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#E2FF68',
  },
  glyph: { width: 24, height: 24 },
  buttonLabel: { fontFamily: F.bold, fontSize: 16, lineHeight: 24, color: C.text },
  titles: { gap: 4 },
  title: { fontFamily: F.bold, fontSize: 20, lineHeight: 28, color: C.text },
  sub: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.textSecondary },
});
