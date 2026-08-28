import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { Icon } from '@ui/primitives/Icon';
import type { IconName } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

/**
 * The lifecycle status banner. The file draws it in two arrangements:
 *
 *  `hero`    — `40:5346` Confirmation. A 338 × 135 `#ECFF9B` card at a 24pt radius, 16pt padding,
 *              16pt gap, laid out as a ROW: the copy on the LEFT (Livvic Black 20/28 title over a
 *              Livvic Bold 14/20 schedule line, 6pt apart) and a 64pt `#CFFF04` disc holding a
 *              40pt check on the RIGHT, in a 73.885pt column with an 8pt bottom inset.
 *
 *              This replaces the CENTRED, disc-above-title arrangement the superseded node drew.
 *              The disc also carries NO shadow of its own in the current file; the previous
 *              `0 8 10 rgba(0,0,0,0.1)` lift was read off the old node and is gone.
 *
 *  `heroCompact` — `292:1399` "Booking extended!" on Cooking extended. The SAME arrangement one
 *              density down: `#FFEF99`, **12pt** padding, a Livvic Bold 14/20 title over a Livvic
 *              Medium 12/16 line, and a **40pt** `#FFD600` disc holding a 30pt check in a 48.145
 *              column padded 6. It is a second banner ON the same screen, under the live one.
 *
 *  `row`     — `40:5356` En route / `3:1658` Arrived / `101:1812` In service. A `#ECFF9B` card at
 *              a 24pt radius, 16pt padding, **16pt** gap, top-aligned:
 *              LEFT a 102pt column, vertically centred, holding a Livvic **Bold** 14/20 title and
 *              a Livvic Medium 12/16 message 6pt apart, inset 5pt vertically;
 *              RIGHT a **122 × 103** white panel at a 15pt radius outlined 1pt in `#CFFF04`,
 *              carrying the ETA at Livvic Black 23/25 (a point down from 24) over a 112pt measure.
 *
 *              Three things moved in the current file and none is cosmetic: the 31pt glyph that
 *              sat above the title (`99:1238` / `101:1884`) is GONE; the ETA panel grew 117 → 122
 *              and swapped its `#CAD5E2` hairline for a `#CFFF04` edge plus an INNER
 *              `0 0 4 rgba(0,0,0,0.15)` shadow (`97:1231`); and the title dropped from Black to
 *              Bold. The panel is drawn natively rather than bundled — the exported vector is a
 *              plain rounded rectangle, so rasterising it would only cost crispness.
 *
 * On-time vs late is exactly two property changes (fill + copy): `99:1413` is `40:5356` in yellow
 * with apology copy, which is why this is one component with a `tone`, not several banners.
 *
 * BOUNDARY: the tone is chosen by the screen from SERVER state. The client never compares an ETA
 * to the clock to decide that a cook is late — the server says so
 * (FRONTEND_FOUNDATION_PLAN.md §18 rule 4, §20).
 */

export type StatusBannerTone = 'positive' | 'warning' | 'neutral';
export type StatusBannerLayout = 'row' | 'hero' | 'heroCompact';

export interface StatusBannerProps {
  readonly title: string;
  /** `hero`: `250:2951`, the schedule line under the title. `row`: the message under the title. */
  readonly message?: string;
  readonly tone?: StatusBannerTone;
  readonly layout?: StatusBannerLayout;
  /** `hero` only — the glyph inside the 64pt disc. */
  readonly icon?: IconName;
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
  highlight,
  trailing,
  testID = 'status-banner',
}: StatusBannerProps) {
  const hero = layout === 'hero' || layout === 'heroCompact';
  const compact = layout === 'heroCompact';

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
        hero ? styles.hero : styles.row,
        compact ? styles.compact : null,
        tone === 'warning' ? styles.warning : tone === 'neutral' ? styles.neutral : styles.positive,
      ]}
    >
      <View style={hero ? styles.heroText : styles.text}>
        <View style={hero ? styles.heroTitleRow : styles.rowText}>
          <Text variant={compact ? 'title' : hero ? 'headingScreen' : 'title'} color="textStrong">
            {title}
          </Text>
          {message === undefined ? null : (
            <Text variant={hero && !compact ? 'title' : 'bodyMedium'} color="textStrong">
              {message}
            </Text>
          )}
        </View>
      </View>

      {/* `40:5347` — on `hero` the disc trails the copy, in its own 73.885pt column. */}
      {hero && icon !== undefined ? (
        <View style={compact ? styles.discColumnCompact : styles.discColumn}>
          <View
            style={[styles.disc, compact ? styles.discCompact : null]}
            testID={`${testID}-disc`}
          >
            {/* `3:1049` / `292:1406` draw the check WHITE inside the disc, not black. */}
            <Icon name={icon} size={compact ? 30 : 40} color="textInverse" />
          </View>
        </View>
      ) : null}

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
  /** `40:5356` — top-aligned, 16pt gap (the superseded node used 20). */
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.lg },
  /** `40:5346` — a row, 16pt gap, vertically centred. */
  hero: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.lg },
  /** `292:1399` — the same row at 12pt padding. */
  compact: { padding: lightTheme.space.md },
  positive: { backgroundColor: lightTheme.colors.surfacePositive },
  warning: { backgroundColor: lightTheme.colors.surfaceAccentStrong },
  neutral: { backgroundColor: lightTheme.colors.surfaceMuted },
  /**
   * `3:1047` — a flat 64pt `#CFFF04` disc. The current file gives it NO drop shadow; the previous
   * `0 8 10 rgba(0,0,0,0.1)` lift came off the superseded node and is removed.
   */
  disc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfacePositiveBright,
  },
  /** `292:1405` — a 40pt `#FFD600` disc, the compact banner's mark. */
  discCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  /** `40:5347` — a 73.885 column holding the disc, inset 8pt from the bottom. */
  discColumn: {
    width: 73.885,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: lightTheme.space.sm,
  },
  /** `292:1404` — a 48.145 column padded 6 all round. */
  discColumnCompact: {
    width: 48.145,
    alignItems: 'center',
    justifyContent: 'center',
    padding: lightTheme.space.s6,
  },
  /** `99:1239` — a 102pt column, vertically centred, taking the width left by the 122pt panel. */
  text: { flex: 1, minWidth: 0, height: 102, justifyContent: 'center' },
  /** `40:5353` — takes the remaining width beside the disc column. */
  heroText: { flex: 1, minWidth: 0 },
  /** `97:1229` — 6pt between the title and the message, inset 5pt vertically. */
  rowText: { gap: lightTheme.space.s6, paddingVertical: 5 },
  /** `40:5353` — 6pt between the title and the schedule line. */
  heroTitleRow: { alignSelf: 'stretch', gap: lightTheme.space.s6 },
  /**
   * `97:1231` — a 122 × 103 white panel at a 15pt radius behind a 1pt `#CFFF04` edge.
   *
   * The node also carries an INNER `0 0 4 rgba(0,0,0,0.15)` shadow, which `shadow*` cannot
   * express — it only ever casts outward. It comes from `innerShadows.etaPanel`, which uses
   * `boxShadow`'s typed `inset` field; that is implemented on both platforms under the New
   * Architecture this app runs. Border, radius and fill are set as real style properties, so the
   * panel is still correct even on a runtime that drops the inner shadow.
   */
  highlight: {
    width: 122,
    height: 103,
    alignItems: 'center',
    justifyContent: 'center',
    // `94:1097` is 112 wide inside the 122 panel, so the inset is 5 a side — not 8. At 8 the
    // label had only 106 to work with and "16 mins" truncated on a denser viewport.
    paddingHorizontal: 5,
    borderRadius: lightTheme.radius.r15,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfacePositiveBright,
    backgroundColor: lightTheme.colors.surface,
    boxShadow: innerShadows.etaPanel,
  },
});
