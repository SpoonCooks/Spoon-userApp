import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';
import { gradientAxis } from '@ui/tokens/semantic';

import { PLAN_CALENDAR } from '../art';

/**
 * The Schedule screen's Plan banner — Figma `364:520` ("Plan 1"), and its Plan 2 instance.
 *
 * A 370 × 88 gold card: the calendar illustration, "Plan N" over "D days · Nth Visit", and the
 * plan's number drawn huge in `#FFE666` behind the text as a ghost. Everything is dynamic — there
 * is no cap on plans — so the ghost is live text, not an image: "1", "2", "12" all draw the same
 * way, anchored where Figma anchors it and clipped by the card.
 */
export interface PlanBannerProps {
  /** 1-based. */
  readonly planNumber: number;
  readonly subtitle: string;
  readonly testID?: string;
}

export function PlanBanner({ planNumber, subtitle, testID }: PlanBannerProps) {
  const gradient = lightTheme.gradients.planBanner;
  const axis = gradientAxis(gradient.angleDeg, BANNER_WIDTH, BANNER_HEIGHT);
  return (
    <View style={styles.lift} testID={testID}>
      <View style={styles.card}>
        <LinearGradient
          colors={gradient.colors}
          locations={gradient.locations}
          start={axis.start}
          end={axis.end}
          style={StyleSheet.absoluteFill}
        />
        {/* `364:534` — Livvic Bold 140 in `#FFE666`, its left edge at x 237.5 and its line box
            33 above the card's top, so the numeral runs off the bottom edge. */}
        <Text style={styles.ghost} accessibilityElementsHidden importantForAccessibility="no">
          {String(planNumber)}
        </Text>
        <View style={styles.calendar}>
          <Image source={PLAN_CALENDAR} style={styles.calendarArt} resizeMode="stretch" />
        </View>
        <View style={styles.text}>
          <Text variant="headingSection" color="textPrimary" numberOfLines={1}>
            Plan {planNumber}
          </Text>
          <Text variant="body" color="textPrimary" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** `364:520` — drawn 370 × 88 in the 402 frame. */
const BANNER_WIDTH = 370;
const BANNER_HEIGHT = 88;
const RADIUS = 24;

const styles = StyleSheet.create({
  /** The drop shadow lives on an unclipped wrapper: the card clips its children, and its shadow. */
  lift: { borderRadius: RADIUS, boxShadow: innerShadows.planBanner },
  /** `364:520` — p 8, 16 between the calendar and the text, a 1.5pt `#FFF7CC` edge. */
  card: {
    height: BANNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.lg,
    padding: lightTheme.space.sm,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.borderPlanTile,
    overflow: 'hidden',
  },
  /**
   * Line height is set to Livvic Bold's own "normal" — (ascender 1005 + descender 250) / 1000 em =
   * 175.7 at 140 — because that is the box Figma's `leading-[normal]` positions; left to the
   * default `body` style the numeral would sit in a 16pt line and be drawn somewhere else.
   */
  ghost: {
    position: 'absolute',
    left: 237.5,
    top: -33,
    fontFamily: lightTheme.typography.titleNav.fontFamily,
    fontSize: 140,
    lineHeight: 175.7,
    color: lightTheme.colors.surfaceBrandTint,
  },
  /** `364:521` — 73 × 72, the art inset 10 % top and bottom, 11 % left, 10.97 % right. */
  calendar: { width: 73, height: 72 },
  calendarArt: {
    position: 'absolute',
    left: 73 * 0.11,
    top: 72 * 0.1,
    width: 56.96,
    height: 57.586,
  },
  /** `364:536` — 2 between the title and the subtitle. */
  text: { flex: 1, gap: 2 },
});
