import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { ReactNode } from 'react';

import { Icon } from '@ui/primitives/Icon';
import type { IconName } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The lifecycle status banner. The file draws it in two arrangements:
 *
 *  `stacked` — `40:5346` Confirmation. Centred: a 64pt `#CFFF04` disc holding a 40pt check, then
 *              a Livvic Black 20/28 title, on `#ECFF9B` at a 24pt radius.
 *
 *  `row`     — `40:5356` En route / `3:1658` Arrived. A 338 × 134 card, 16pt padding, 20pt gap:
 *              LEFT a 168pt column with a 31pt glyph, a Livvic Bold 14/20 title and a Livvic
 *              Medium 12/16 message; RIGHT a 117 × 103 white box at a 15pt radius carrying the
 *              ETA at Livvic Black 24/25.
 *
 *              The glyph sits ABOVE the title, not beside it — the previous banner drew a 16pt
 *              Feather icon inline, and the ETA box was a 72pt pill rather than a 117 × 103 panel.
 *
 * On-time vs late is exactly two property changes (fill + copy): `99:1413` is `40:5356` in yellow
 * with apology copy, which is why this is one component with a `tone`, not several banners.
 *
 * BOUNDARY: the tone is chosen by the screen from SERVER state. The client never compares an ETA
 * to the clock to decide that a cook is late — the server says so
 * (FRONTEND_FOUNDATION_PLAN.md §18 rule 4, §20).
 */

export type StatusBannerTone = 'positive' | 'warning';
export type StatusBannerLayout = 'row' | 'stacked';

export interface StatusBannerProps {
  readonly title: string;
  readonly message?: string;
  readonly tone?: StatusBannerTone;
  readonly layout?: StatusBannerLayout;
  /** `stacked` only — the glyph inside the 64pt disc. */
  readonly icon?: IconName;
  /** `row` only — the 31pt exported glyph above the title (`99:1241`). */
  readonly art?: ImageSourcePropType;
  /** The boxed figure on the right — "16 mins". Server-provided; never computed. */
  readonly highlight?: string;
  readonly trailing?: ReactNode;
  readonly testID?: string;
}

export function StatusBanner({
  title,
  message,
  tone = 'positive',
  layout = 'row',
  icon,
  art,
  highlight,
  trailing,
  testID = 'status-banner',
}: StatusBannerProps) {
  const stacked = layout === 'stacked';

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={[title, message, highlight]
        .filter((part): part is string => part !== undefined)
        .join('. ')}
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        stacked ? styles.stacked : styles.row,
        tone === 'warning' ? styles.warning : styles.positive,
      ]}
    >
      {stacked && icon !== undefined ? (
        <View style={styles.disc} testID={`${testID}-disc`}>
          {/* `40:5346` draws the check WHITE inside the `#CFFF04` disc, not black. */}
          <Icon name={icon} size={40} color="textInverse" />
        </View>
      ) : null}

      <View style={stacked ? styles.stackedText : styles.text}>
        {!stacked && art !== undefined ? (
          <Image
            source={art}
            style={styles.art}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : null}

        <View style={stacked ? styles.stackedTitleRow : styles.rowText}>
          <Text
            variant={stacked ? 'headingScreen' : 'titleBlack'}
            color="textStrong"
            align={stacked ? 'center' : 'left'}
          >
            {title}
          </Text>
          {message === undefined ? null : (
            <Text variant="bodyMedium" color="textStrong" align={stacked ? 'center' : 'left'}>
              {message}
            </Text>
          )}
        </View>
      </View>

      {highlight === undefined ? null : (
        <View style={styles.highlight} testID={`${testID}-highlight`}>
          <Text variant="headingEta" color="textStrong" align="center" numberOfLines={1}>
            {highlight}
          </Text>
        </View>
      )}

      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  /** `40:5356` / `40:5346` — 16pt padding, 24pt radius, `0 0 2 rgba(0,0,0,0.15)`. */
  container: {
    alignSelf: 'stretch',
    padding: lightTheme.layout.cardPadding,
    borderRadius: lightTheme.layout.cardRadius,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  stacked: { alignItems: 'center', gap: 7 },
  positive: { backgroundColor: lightTheme.colors.surfacePositive },
  warning: { backgroundColor: lightTheme.colors.surfaceAccentStrong },
  /** `3:1047` — a 64pt `#CFFF04` disc with a soft `0 20 25 -5` lift. */
  disc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: lightTheme.space.sm,
    backgroundColor: lightTheme.colors.surfacePositiveBright,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  text: { flex: 1, minWidth: 0, gap: lightTheme.space.xs },
  stackedText: { alignSelf: 'stretch', gap: lightTheme.space.xs },
  rowText: { gap: lightTheme.space.s6, paddingVertical: 5 },
  stackedTitleRow: { alignSelf: 'stretch', gap: lightTheme.space.xs },
  art: { width: 31, height: 31 },
  /** `97:1231` — a 117 × 103 white panel at a 15pt radius with a hairline edge. */
  highlight: {
    width: 117,
    height: 103,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: lightTheme.space.sm,
    borderRadius: lightTheme.radius.r15,
    borderWidth: lightTheme.stroke.hairline,
    borderColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surface,
  },
});
