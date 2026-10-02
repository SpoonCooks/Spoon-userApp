import { Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { DirectionalDisc } from '@ui/primitives/DirectionalDisc';
import { Icon } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The stacked-screen header — Figma component `63:783`, instanced across the finalized sections:
 * `275:5187` Saved addresses, `63:783` Select service location, `275:4477` Complete address,
 * `257:3504` Profile, `65:35` Past bookings and `71:620` Refunds.
 *
 * Geometry re-read off `63:783` in `fsgGIC4c6DJulb64TTt9yg`: a **38pt** white bar, `px 4 / py 6`,
 * a **12pt** gap, a 32pt back disc and a Livvic **Black 20/28** title. The superseded file drew
 * this at 56 tall with `px 16 / py 12`, a 14pt gap and a Bold 16/24 title — every one of those
 * five values moved, which is why the old `default` density is gone rather than kept alongside.
 *
 * The back control is the real exported asset via `DirectionalDisc`, not a Feather
 * reconstruction — see that component for why the two used to disagree.
 *
 * This is NOT the booking-lifecycle header (`39:5324`), which carries an address pair and the Help
 * pill instead of a single title, nor the sheet header (`1:735`).
 */
export type ScreenHeaderDensity = 'default' | 'band' | 'step' | 'nav';

export interface ScreenHeaderProps {
  readonly title: string;
  /**
   * OMIT to draw no back control at all.
   *
   * `63:783` always draws the disc, because every frame it is instanced on is reachable from
   * somewhere. One screen is not: `53:31` on a FIRST-TIME customer, who arrives there straight
   * out of OTP with no address yet and therefore nothing behind them (V7 founder comment, task
   * §4). A disc there is either inert or an escape from the one step onboarding cannot skip.
   *
   * When it is absent the title takes the gutter rather than holding the disc's place — an empty
   * 32pt indent reads as a control that failed to render. The header's height, padding and type
   * are untouched, so the rest of the frame still measures as drawn.
   */
  readonly onBack?: (() => void) | undefined;
  /**
   * `63:783` carries NO underline — the finalized component is a plain white bar. The superseded
   * file drew a 0.889pt `#E2E8F0` rule under most instances, which is why this defaulted to true;
   * it now defaults to false and is kept only as an escape hatch for a frame that draws one.
   */
  readonly divider?: boolean;
  /**
   * The finalized file draws this header at two heights, and both are real measurements:
   *
   *   `default` — 38: `63:783` and its instances. Address ×3, Profile (`257:3504`) and Refunds
   *               (`71:620`) all measure 338 × 38 at the same in-frame offset.
   *   `band`    — 45: the `65:35` instance on `6:227` Past bookings is overridden to 45 tall,
   *               which opens the vertical padding to (45 − 32) / 2 = 6.5. Horizontal padding
   *               and gap are untouched.
   *   `step`    — the recurring-setup header (Figma `ZIJf639gTWHXshaa2YOeCT`, e.g. `4:299`): a
   *               36pt disc, a 12pt gap and a Livvic Black 22/28 `#1A1A1A` title, in its OWN 20pt
   *               gutter, 8 below the safe area and 6 above the content (the frame's pt 52 less
   *               its 44pt status bar). Drawn full-bleed — no wrapper supplies the gutter.
   *   `nav`     — `Nav header 2` (`44:62`) in the redesigned file (`cCQlzTeiObQkpVBzwI8mZi`): NO
   *               disc — a bare 24pt chevron (`43:63`) centred in a 44pt back button, a 4pt gap,
   *               pl 8 / pr 16 / py 8, and a Livvic Bold 20/28 black title. 60 tall.
   */
  readonly density?: ScreenHeaderDensity;
  readonly trailing?: ReactNode;
  /**
   * Drops the white fill, for a screen whose background art runs up behind the header — the Cook
   * Pool landing's glows (`844:5843`).
   */
  readonly transparent?: boolean;
  readonly testID?: string;
}

export function ScreenHeader({
  title,
  onBack,
  divider = false,
  density = 'default',
  trailing,
  transparent = false,
  testID = 'screen-header',
}: ScreenHeaderProps) {
  const step = density === 'step';
  const nav = density === 'nav';
  return (
    <View
      style={[
        styles.header,
        DENSITY_STYLE[density],
        nav && onBack === undefined ? styles.navNoBack : null,
        divider ? styles.divider : null,
        transparent ? styles.transparent : null,
      ]}
      testID={testID}
    >
      {/* `54:289` — the exported 32pt disc, mirrored to face back (36pt on `step`). Absent by
          design on a first-run `53:31`; see `onBack`. */}
      {onBack === undefined ? null : nav ? (
        // `43:63` is Feather's `chevron-left` exactly: M15 6 L9 12 L15 18, a 2pt round stroke in a
        // 24 box — which is the glyph `Icon`'s `back` already draws at 24.
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.navBack}
          testID={`${testID}-back`}
        >
          <Icon name="back" size={NAV_CHEVRON} color="textPrimary" />
        </Pressable>
      ) : (
        <DirectionalDisc
          direction="back"
          label="Back"
          onPress={onBack}
          {...(step ? { size: STEP_DISC } : {})}
          testID={`${testID}-back`}
        />
      )}
      <Text
        variant={step ? 'headingStep' : nav ? 'titleNav' : 'headingScreen'}
        color={step ? 'textInk' : 'textPrimary'}
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Text>
      {trailing ?? null}
    </View>
  );
}

/** `4:300` — the recurring-setup back disc. */
const STEP_DISC = 36;
/** `43:63` — the bare chevron inside `Nav header 2`'s 44pt back button (`44:63`). */
const NAV_CHEVRON = 24;

const styles = StyleSheet.create({
  /** Shared by every density: a white row, 12pt gap. */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    backgroundColor: lightTheme.colors.surface,
  },
  /**
   * `63:783` — **38** tall, px 4.
   *
   * The height is pinned rather than derived: the node's own `py-6` around a 32pt control would
   * measure 44, so honouring the padding would miss the drawn height by 6. Figma's autolayout
   * lets the control overflow its padding; RN does not, so the frame's height wins.
   */
  default: { height: 38, paddingHorizontal: lightTheme.space.xs },
  /** `65:35` as instanced on `6:227` — 45 tall. px and gap unchanged. */
  band: { height: 45, paddingHorizontal: lightTheme.space.xs },
  /** `4:299` — px 20, pt 8, pb 6 around the 36pt disc: 50 tall. */
  step: {
    paddingHorizontal: 20,
    paddingTop: lightTheme.space.sm,
    paddingBottom: lightTheme.space.s6,
  },
  /** `44:62` — pl 8 / pr 16 / py 8 around the 44pt button; a 4pt gap, not the shared 12. */
  nav: {
    gap: lightTheme.space.xs,
    paddingLeft: lightTheme.space.sm,
    paddingRight: lightTheme.space.lg,
    paddingVertical: lightTheme.space.sm,
  },
  /** `542:1341` (`Nav header 3`) — no back button, so the title takes the 16pt gutter. */
  navNoBack: { paddingLeft: lightTheme.space.lg },
  /** `44:63` — the 44pt back button, already a full touch target. */
  navBack: {
    width: lightTheme.layout.minTouchTarget,
    height: lightTheme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    borderBottomWidth: lightTheme.stroke.hairline,
    borderBottomColor: lightTheme.colors.borderField,
  },
  title: { flexShrink: 1 },
  transparent: { backgroundColor: 'transparent' },
});

const DENSITY_STYLE: Record<ScreenHeaderDensity, ViewStyle> = {
  default: styles.default,
  band: styles.band,
  step: styles.step,
  nav: styles.nav,
};
