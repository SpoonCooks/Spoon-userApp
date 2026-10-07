import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { VISIT_FIXTURE } from '../../data/visit';
import { VISIT_DISH_GLYPH, VISIT_WHATSAPP_20 } from './assets';

/**
 * `Special requests` — Figma `1454:7956`. A white row (py 8, 16pt corners): a 44pt `#FFE666`
 * well with the dish glyph, the two-line prompt in a 247pt column, and the yellow WhatsApp
 * "Share" pill (`1454:7949`: px 12 / py 8, 4 gap).
 */
export interface RecipeShareRowProps {
  readonly onShare?: (() => void) | undefined;
  readonly testID?: string | undefined;
}

const { recipe } = VISIT_FIXTURE;

export function RecipeShareRow({ onShare, testID = 'visit-recipe-share' }: RecipeShareRowProps) {
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.lead}>
        <View style={styles.well}>
          <Image source={VISIT_DISH_GLYPH} style={styles.glyph} />
        </View>
        <View style={styles.text}>
          <Text variant="spoonBodyStrong" color="textPrimary">
            {recipe.title}
          </Text>
          <Text variant="spoonCaption" color="textSecondarySoft">
            {recipe.body}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Share a recipe on WhatsApp"
        style={styles.share}
        testID={`${testID}-share`}
      >
        <Image source={VISIT_WHATSAPP_20} style={styles.wa} />
        <Text variant="spoonCaptionStrong" color="textPrimary">
          {recipe.cta}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `1454:7943` — 247 wide, 12 gap. */
  lead: { width: 247, flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  well: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  glyph: { width: 24, height: 24 },
  text: { flex: 1, gap: lightTheme.space.xs },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  wa: { width: 20, height: 20 },
});
