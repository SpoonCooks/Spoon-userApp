import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { BookingCardViewModel, StatusTone } from '@ui/types/viewModels';

/**
 * One booking card, two variants — the same card the audit identified across two screens:
 *
 *  - `history` — `6:245` Past bookings: headline, status pill, cook, time range, amount, rating.
 *  - `refund`  — `71:642` Refunds: byte-identical except that the second row carries only the
 *                refund line (no rating) and the status pills are the refund set.
 *
 * Geometry, verbatim from `6:245`: white at a 24pt radius outlined 1pt in `rgba(0,0,0,0.5)` with
 * `0 0 2 rgba(0,0,0,0.15)`, px 15.889 / pt 15.889 / pb 13 and a 10pt gap. The header row pairs a
 * Livvic Bold 14/20 headline with a fully-rounded pill (px 9.889 / py 1.889, Livvic Bold 10/15 at
 * 70% black, capitalised). The body row is a 48pt photo outlined 1pt in `#FFD230` at a 16pt
 * radius, then a 2pt-gap column: name (Bold 14/20 `#0F172B`) against a right-aligned amount
 * (Bold 12/16), over the subtitle (Medium 11/16.5 black) against the right-aligned rating.
 *
 * The Home upcoming-booking card is NOT a variant of this component. `59:587` shares no structure
 * with the history card — no photo, no status pill, no amount, no rating, a lime hairline and a
 * fixed empty tail — so forcing it through this card distorted both. It lives in the Home feature
 * as `UpcomingBookingCard` (task §22: do not distort the Figma design merely to force reuse).
 *
 * BOUNDARY: `statusLabel` + `statusTone` are PRESENTATION inputs. This component has no knowledge
 * of backend status values — the drawn set has no `Cancelled` (B-15) and no `Failed` (D-15), and
 * no enum exists to map. Amounts and ratings are pre-formatted server values; nothing is computed.
 */

export type BookingCardVariant = 'history' | 'refund';

/**
 * `6:252` / `66:148` / `71:627` / `71:647` — the pill uses the CANARY lime and the tile yellow,
 * not the softer surfaces the shared `Badge` maps a tone to. Four fills across both screens.
 */
const PILL_SURFACE: Record<StatusTone, string> = {
  positive: lightTheme.colors.surfaceEta,
  warning: lightTheme.colors.surfaceAccentBold,
  info: lightTheme.colors.surfaceAccent,
  danger: lightTheme.colors.dangerSurface,
  neutral: lightTheme.colors.surfaceMuted,
};

export interface BookingCardProps {
  readonly booking: BookingCardViewModel;
  readonly variant?: BookingCardVariant;
  readonly onPress?: () => void;
  readonly testID?: string;
}

export function BookingCard({
  booking,
  variant = 'history',
  onPress,
  testID = 'booking-card',
}: BookingCardProps) {
  const showRating = variant === 'history' && booking.rating !== undefined;

  const body = (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <Text variant="title" color="textPrimary" style={styles.headline} numberOfLines={1}>
          {booking.headline}
        </Text>
        {booking.statusLabel === undefined ? null : (
          <View
            style={[
              styles.pill,
              { backgroundColor: PILL_SURFACE[booking.statusTone ?? 'neutral'] },
            ]}
            testID={`${testID}-status`}
          >
            <Text variant="pillLabel" color="textSecondary" numberOfLines={1}>
              {booking.statusLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        {booking.cookPhotoUrl === undefined ? (
          <View style={styles.photo} />
        ) : (
          <Image
            source={{ uri: booking.cookPhotoUrl }}
            style={styles.photo}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            testID={`${testID}-photo`}
          />
        )}

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text variant="title" color="textStrong" style={styles.grow} numberOfLines={1}>
              {booking.cookName ?? ''}
            </Text>
            {booking.amount === undefined ? null : (
              <Text variant="bodyBold" color="textStrong" align="right" testID={`${testID}-amount`}>
                {booking.amount}
              </Text>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text variant="labelMedium" color="textPrimary" style={styles.grow} numberOfLines={1}>
              {booking.subtitle ?? ''}
            </Text>
            {showRating ? (
              <Text
                variant="bodyBold"
                color="textStrong"
                align="right"
                accessibilityLabel={`Rated ${String(booking.rating)}`}
                testID={`${testID}-rating`}
              >
                {String(booking.rating)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );

  if (onPress === undefined) {
    return body;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[booking.headline, booking.cookName, booking.statusLabel]
        .filter((part): part is string => part !== undefined)
        .join(', ')}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
      testID={`${testID}-pressable`}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** `6:245` — 1pt `rgba(0,0,0,0.5)`, 24pt radius, px 15.889 / pt 15.889 / pb 13, 10pt gap. */
  card: {
    alignSelf: 'stretch',
    gap: lightTheme.space.s10,
    paddingHorizontal: 15.889,
    paddingTop: 15.889,
    paddingBottom: 13,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.textPlaceholder,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
  },
  headline: { flexShrink: 1 },
  /** `6:252` — px 9.889 / py 1.889, fully rounded. */
  pill: {
    paddingHorizontal: 9.889,
    paddingVertical: 1.889,
    borderRadius: lightTheme.radius.pill,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  /** `6:255` — a 48pt square outlined 1pt in `#FFD230` at a 16pt radius. */
  photo: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderNoteStrong,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** `6:256` — the two rows sit 2pt apart. */
  details: { flex: 1, minWidth: 0, gap: lightTheme.space.xxs },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
  },
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.85 },
});
