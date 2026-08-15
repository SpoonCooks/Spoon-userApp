import { Image, StyleSheet, View } from 'react-native';

import { BOOKING_CANCELLED_ART } from '@ui/components/cookAssets';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The cancelled-booking hero — Figma `115:2716` (cancel confirm) and `201:66` (auto cancelled).
 * The two frames are byte-identical apart from the sentence.
 *
 * A white card at a 24pt radius lifted by `0 0 1 rgba(0,0,0,0.15)`, 15.889pt in with a 6pt gap:
 * the 116 × 72 calendar-and-cross mark (`115:2809`) over a 44pt row carrying the title in Livvic
 * Bold 18/28, centred.
 */
export interface CancelledHeroProps {
  readonly title: string;
  readonly testID?: string;
}

export function CancelledHero({ title, testID = 'cancelled-hero' }: CancelledHeroProps) {
  return (
    <View style={styles.card} testID={testID}>
      <Image
        source={BOOKING_CANCELLED_ART}
        style={styles.art}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.titleRow}>
        <Text variant="titleLead" color="textPrimary" align="center" accessibilityRole="header">
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingTop: 15.889,
    paddingHorizontal: 15.889,
    paddingBottom: lightTheme.space.s6,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.hairline,
  },
  /** `115:2809` — a 116 × 72 band. */
  art: { width: 116, height: 72 },
  /** `115:2717` — a 44pt row, 6pt vertical padding, 9.889pt of trailing inset. */
  titleRow: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: lightTheme.space.s6,
    paddingRight: 9.889,
  },
});
