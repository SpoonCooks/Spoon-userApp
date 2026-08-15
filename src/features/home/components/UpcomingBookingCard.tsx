import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text, lightTheme } from '@ui';
import type { BookingCardViewModel } from '@ui';

import { HOME_ICON_TIMER } from '../assets';
import { HOME_DESIGN } from '../layout';

const { upcoming: DESIGN } = HOME_DESIGN;

/** Fixed UI copy in `59:595`, not server content. */
const UPCOMING_BOOKING_LABEL = 'Upcoming booking';

/**
 * Upcoming booking — Figma `59:587`, as placed on Page 3b `209:1207`.
 *
 * RULING (task §0): there is ONE logical Home. Page 3a is the canonical complete Home, and this
 * card is a CONDITIONAL component INSERTED into it between the promo carousel and the
 * Instant/Schedule tiles — exactly where `59:587` sits in `209:1226`. It never replaces the Home
 * screen and never removes the below-fold content; Page 3b is byte-for-byte Page 3a plus this
 * card.
 *
 * Geometry, verbatim from the node:
 *   card    340 × 136.59, white, 1pt `#CFFF04` hairline, 24pt radius, `0 0 4 rgba(0,0,0,0.08)`
 *   header  `59:589`  top 16, left/right 16, 25pt tall — "Upcoming booking" Livvic Black 14/20
 *                     and a right-aligned date, Livvic Bold 12/16
 *   timer   `59:601`  a 20pt `#CFFF04` chip at a 5pt radius, 6pt gap, duration at SemiBold 12/16
 *                     in `#0F172B`. Its 74.4pt band starts at 47 and centres the row at 74.2.
 *
 * This REPLACES the previous black "cook en-route" card with an avatar, ETA pill and circular →
 * control: the new file draws none of those on Home.
 *
 * RESPONSIVENESS: the card stretches to the content column and keeps the designed 136.59pt height
 * as a `minHeight` rather than an aspect ratio, because everything inside it is fixed-size type —
 * growing the empty tail on a 412dp phone would not be more faithful, only taller. Longer dates
 * and durations shrink and ellipsise rather than wrap the header onto two lines.
 *
 * BOUNDARY: every value shown is supplied. Nothing here knows what "upcoming" means, when the
 * booking starts, or whether it is still valid.
 */
export interface UpcomingBookingCardProps {
  readonly booking: BookingCardViewModel;
  readonly onOpen?: () => void;
  readonly testID?: string;
}

export function UpcomingBookingCard({
  booking,
  onOpen,
  testID = 'home-upcoming-booking',
}: UpcomingBookingCardProps) {
  const body = (
    <>
      <View style={styles.header}>
        <Text variant="titleBlack" color="textPrimary" numberOfLines={1} style={styles.title}>
          {UPCOMING_BOOKING_LABEL}
        </Text>
        {booking.subtitle === undefined ? null : (
          <Text
            variant="bodyBold"
            color="textPrimary"
            align="right"
            numberOfLines={1}
            style={styles.date}
          >
            {booking.subtitle}
          </Text>
        )}
      </View>

      {booking.durationLabel === undefined ? null : (
        <View style={styles.duration}>
          <View style={styles.timerChip}>
            <Image
              source={HOME_ICON_TIMER}
              style={styles.timerIcon}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <Text variant="bodyStrong" color="textStrong" numberOfLines={1} style={styles.title}>
            {booking.durationLabel}
          </Text>
        </View>
      )}
    </>
  );

  if (onOpen === undefined) {
    return (
      <View style={styles.card} testID={testID}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={[UPCOMING_BOOKING_LABEL, booking.subtitle, booking.durationLabel]
        .filter((part): part is string => part !== undefined)
        .join('. ')}
      testID={testID}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    minHeight: DESIGN.height,
    padding: DESIGN.padding,
    gap: DESIGN.headerToDuration,
    borderRadius: lightTheme.layout.cardRadius,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderPositive,
    backgroundColor: lightTheme.colors.surface,
    /** `59:587` carries a softer 8% shadow than the 15% used by the tiles. */
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: DESIGN.headerHeight,
    gap: lightTheme.space.sm,
  },
  title: { flexShrink: 1 },
  date: { flexShrink: 1, flexGrow: 1 },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    height: DESIGN.durationHeight,
    gap: DESIGN.timerGap,
  },
  /** `209:1403` — a 20pt lime square at a 5pt radius holding the timer glyph. */
  timerChip: {
    width: DESIGN.timerChip,
    height: DESIGN.timerChip,
    borderRadius: lightTheme.radius.r5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfacePositiveBright,
  },
  timerIcon: { width: DESIGN.timerChip, height: DESIGN.timerChip },
  pressed: { opacity: 0.9 },
});
