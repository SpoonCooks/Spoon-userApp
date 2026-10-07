import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { gradientAxis } from '@ui/tokens/semantic';

import {
  VISIT_BADGE_CANCELLED,
  VISIT_BADGE_CONFIRMED,
  VISIT_SKY_AFTERNOON,
  VISIT_SKY_MORNING,
} from './assets';

/**
 * The Visit details booking header — two Figma components:
 *
 * - `Status banner/ recurring/ past` (`1461:6083`): the MORNING sky, a `#FFF9DB → #FFD9A8` wash
 *   top to bottom under halos, sun and clouds. State `Confirmed` (`1461:6149`) puts the lime tick
 *   and "CONFIRMED" in the 72pt countdown slot; `Cancelled` (`1461:6217`) lays an
 *   `rgba(244,243,239,0.8)` mute over the sky, drops the ink to 45 % black, strikes the slot and
 *   swaps in the dashed cross.
 * - `Status banner/ recurring/ future` (`1444:8837`): the AFTERNOON sky, `#FFF3A6 → #FFD600` at
 *   157.14°, with the days-to-go count in that slot.
 *
 * Both are 16 padded, 24pt corners, `Elevation/1` (`0 0 3 rgba(0,0,0,0.08)`). The sky art is ONE
 * export per time of day, 370×104, pinned to the banner's right edge where the sun sits behind
 * the countdown.
 */
export type VisitBannerState = 'upcoming' | 'confirmed' | 'cancelled';

export interface VisitStatusBannerProps {
  readonly state: VisitBannerState;
  readonly date: string;
  readonly slot: string;
  /** Upcoming only — the "10" over "DAYS TO GO". */
  readonly daysToGo?: string | undefined;
  readonly testID?: string | undefined;
}

/** `1444:8837` — the afternoon wash's CSS angle. */
const AFTERNOON_ANGLE = 157.13865950691002;
/** The frame's own banner box, used until the real one is measured. */
const FRAME_BOX = { width: 370, height: 104 };

export function VisitStatusBanner({
  state,
  date,
  slot,
  daysToGo,
  testID = 'visit-status-banner',
}: VisitStatusBannerProps) {
  const [box, setBox] = useState(FRAME_BOX);
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== box.width || height !== box.height) setBox({ width, height });
  };

  const upcoming = state === 'upcoming';
  const cancelled = state === 'cancelled';
  const ink = cancelled ? 'textVisitMuted' : 'textPrimary';
  const axis = upcoming
    ? gradientAxis(AFTERNOON_ANGLE, box.width, box.height)
    : { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } };

  return (
    <View style={styles.shadow} testID={testID}>
      <View style={styles.clip} onLayout={onLayout}>
        <LinearGradient
          colors={
            upcoming
              ? [lightTheme.colors.surfaceVisitSkyAfternoonLead, lightTheme.colors.surfaceCta]
              : [
                  lightTheme.colors.surfaceVisitSkyMorningTop,
                  lightTheme.colors.surfaceVisitSkyMorningBottom,
                ]
          }
          start={axis.start}
          end={axis.end}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={upcoming ? VISIT_SKY_AFTERNOON : VISIT_SKY_MORNING}
          style={styles.sky}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        {cancelled ? <View style={styles.mute} /> : null}

        {/* `1461:6162` — the date row: when on the left, the 72pt countdown slot on the right. */}
        <View style={styles.row}>
          <View style={styles.when}>
            <Text variant="spoonDisplayLarge" color={ink} numberOfLines={1}>
              {date}
            </Text>
            <Text
              variant="spoonBodyStrong"
              color={ink}
              style={cancelled ? styles.struck : null}
              numberOfLines={1}
            >
              {slot}
            </Text>
          </View>

          {upcoming ? (
            <View style={styles.countdown} testID={`${testID}-countdown`}>
              <Text variant="spoonDisplay" color="textPrimary" align="center">
                {daysToGo}
              </Text>
              <Text variant="spoonMicro" color="textPrimary" align="center">
                DAYS TO GO
              </Text>
            </View>
          ) : (
            <View style={[styles.countdown, styles.badgeSlot]} testID={`${testID}-badge`}>
              <Image
                source={cancelled ? VISIT_BADGE_CANCELLED : VISIT_BADGE_CONFIRMED}
                style={styles.badge}
              />
              <Text variant="visitBannerBadge" color={ink} align="center" numberOfLines={1}>
                {cancelled ? 'CANCELLED' : 'CONFIRMED'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `Elevation/1` — kept on an outer view so the clip below doesn't swallow it. */
  shadow: {
    borderRadius: lightTheme.radius.lg,
    boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 3, color: 'rgba(0,0,0,0.08)' }],
  },
  clip: {
    borderRadius: lightTheme.radius.lg,
    overflow: 'hidden',
    padding: lightTheme.space.lg,
  },
  /** `1461:6150` / `1444:464` — the 370×104 sky plate, right-anchored. */
  sky: { position: 'absolute', top: 0, right: 0, width: 370, height: 104 },
  /** `1461:6230` — the cancelled mute, over the sky and under the text. */
  mute: { ...StyleSheet.absoluteFill, backgroundColor: lightTheme.colors.surfaceVisitMute },
  row: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  when: { flex: 1, gap: lightTheme.space.xs },
  struck: { textDecorationLine: 'line-through' },
  /** `1461:6167` / `1443:477` — the 72pt slot, 8pt corners. */
  countdown: {
    width: 72,
    height: 72,
    borderRadius: lightTheme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSlot: { gap: lightTheme.space.s6 },
  badge: { width: 36, height: 36 },
});
