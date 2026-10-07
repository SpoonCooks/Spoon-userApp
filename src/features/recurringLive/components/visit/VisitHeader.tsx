import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RECURRING_BACK_GLYPH } from '../../assets';

/**
 * `Nav header 2` — Figma `44:62`, instanced on every Visit details frame with title "Visit
 * details". A white bar (`pl 8 / pr 16 / py 8`, 4 gap): a 44pt back hit area holding the bare
 * 24pt chevron (`43:63`) and the title in `Spoon/Title` (Bold 20/28).
 */
export interface VisitHeaderProps {
  readonly title: string;
  readonly onBack: () => void;
  readonly testID?: string | undefined;
}

export function VisitHeader({ title, onBack, testID = 'visit-header' }: VisitHeaderProps) {
  return (
    <View style={styles.bar} testID={testID}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.back}
        testID={`${testID}-back`}
      >
        <Image source={RECURRING_BACK_GLYPH} style={styles.glyph} />
      </Pressable>
      <Text variant="spoonTitle" color="textPrimary" accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingLeft: lightTheme.space.sm,
    paddingRight: lightTheme.space.lg,
    paddingVertical: lightTheme.space.sm,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `44:63` — the 44pt back hit area. */
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  glyph: { width: 24, height: 24 },
});
