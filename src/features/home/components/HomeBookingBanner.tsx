import { Image, Pressable, StyleSheet, View } from 'react-native';

import { DirectionalDisc, RatingWidget, Text, lightTheme } from '@ui';

import { HOME_BANNER_SAD_CLOUD } from '../assets';
import { HOME_DESIGN } from '../layout';
import type { HomeBannerViewModel } from '../state/homeBannerView';

/** The strip is `pointerEvents="none"`, so this can never actually be called. */
const NO_OP = (): void => {};

const { activeBooking: DESIGN } = HOME_DESIGN;

/**
 * The Home active-booking card — Figma `337:4353` ("Active booking") and `336:4228` ("rate"), as
 * placed on Page 3b by `336:4260`.
 *
 * This REPLACES the superseded `59:587` entirely. That drawing was a header line, a right-aligned
 * date and a lime timer chip; nothing of it survives. The finalized card is:
 *
 *   card    330 × 142, white, **r24**, a 1pt `#FFD600` hairline, `0 0 4 rgba(0,0,0,0.08)`,
 *           px 12 / py 8 with a 5pt gap
 *   header  `337:4354`  a 37pt row — the title in Livvic Black 14/20 **`#FFD600`** at the left and
 *                       the shared 32pt chevron disc (`54:289`, facing forward) at the right
 *   body    `337:4361`  a 67 × 70 cook photo on `#FFF7CC` at r16 with `0 0 2 rgba(0,0,0,0.08)`,
 *                       8pt from a 117 × 70 three-line stack, then **16pt** to a 91pt badge column
 *
 * The badge column has two drawn forms, selected by the payload, never by the client:
 *   `337:4369`  no caption — one 91 × 82 `#FFEF99` block at r7 carrying Bold 12/15.11
 *   `337:4411`  a Bold 12/15.11 caption over a 91 × 58 `#FFEF99` pill at r7, Bold 14/20 inside
 *
 * `337:4495` "rate" is the same card at **r20** with a `#FFDE33` hairline and a flatter
 * `0 1 0 rgba(0,0,0,0.05)` lift, plus `336:4235` — the "5+" legend and the 9-chip scale — below
 * the body. Its badge is the caption-less form ("Completed!").
 *
 * `393:1072` "Cancelled" is the exception to all of it: it draws NO cook block and NO badge —
 * just the title, the chevron and one 305 x 57 apology row (`393:1202`) on a white ground with
 * the same `#FFD600` hairline at r16, carrying the 32pt Sad Cloud mark 10 from a Livvic Medium
 * 10/13.33 line in `#1D293D`. It is 129 tall where every other card is 154.
 *
 * WHICH card is drawn is decided in `state/homeBannerView.ts` from the server's payload, never
 * here. This component renders a view model; it does not know what "arriving" means.
 *
 * RESPONSIVENESS: the photo, the badge column and the type are fixed, because they are fixed in
 * the frame; only the three-line stack flexes, so a longer cook name ellipsises into the space
 * the frame gives it instead of pushing the badge off a 320dp screen.
 *
 * BOUNDARY: every value shown is supplied. Nothing here knows what "live" means, counts a
 * countdown down, or decides that a booking may be rated.
 */
export interface HomeBookingBannerProps {
  readonly booking: HomeBannerViewModel;
  readonly onOpen?: () => void;
  readonly testID?: string;
}

export function HomeBookingBanner({
  booking,
  onOpen,
  testID = 'home-upcoming-booking',
}: HomeBookingBannerProps) {
  const rate = booking.variant === 'rate';
  const cancelled = booking.variant === 'cancelled';

  const header = (
    <View style={styles.header}>
      <Text variant="titleBlack" color="textBrand" numberOfLines={1} style={styles.title}>
        {booking.title}
      </Text>
      <DirectionalDisc direction="forward" size={DESIGN.disc} />
    </View>
  );

  /** `393:1202` — the apology row. The cancelled card's entire body. */
  const notice =
    booking.notice === undefined ? null : (
      <View style={styles.notice} testID={`${testID}-notice`}>
        <Image
          source={HOME_BANNER_SAD_CLOUD}
          style={styles.noticeGlyph}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text variant="captionMedium" color="textField" style={styles.noticeText}>
          {booking.notice}
        </Text>
      </View>
    );

  const body = (
    <View style={styles.body}>
      <View style={styles.cook}>
        <View style={styles.photo}>
          {booking.cookPhotoUrl === undefined ? null : (
            <Image
              source={{ uri: booking.cookPhotoUrl }}
              style={styles.photoImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          )}
        </View>

        <View style={styles.lines}>
          <Text variant="bodyBold" color="textPrimary" numberOfLines={1}>
            {booking.dateLabel}
          </Text>
          <Text variant="label" color="textPrimary" numberOfLines={1}>
            {booking.timeLabel}
          </Text>
          <Text variant="bodyStrong" color="textPrimary" numberOfLines={1}>
            {booking.cookName}
          </Text>
        </View>
      </View>

      {booking.badgeCaption === undefined ? (
        <View style={styles.badgeBlock}>
          <Text variant="bodyBoldTight" color="textPrimary" align="center">
            {booking.badgeValue}
          </Text>
        </View>
      ) : (
        <View style={styles.badgeColumn}>
          <Text variant="bodyBoldTight" color="textPrimary" align="center" numberOfLines={1}>
            {booking.badgeCaption}
          </Text>
          <View style={styles.badgePill}>
            <Text variant="title" color="textPrimary" align="center" numberOfLines={1}>
              {booking.badgeValue}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  /**
   * `336:4235` — the scale on the "Share your rating!" card is a PREVIEW of page 14a, not a
   * second place to rate from.
   *
   * It used to submit: a tap on a chip fired a rating mutation straight from Home. That put the
   * one irreversible action in the flow — a rating cannot be changed once stored — behind a
   * single tap on a scrolling list, with no cook shown, no `5+` explanation, no feedback field
   * and no confirmation. Customers hit it by accident while scrolling, and a mis-tap was final.
   *
   * The documented tap target for this card is page 14a, and 14a is where the whole rating UI
   * actually lives. So the strip is drawn at full strength — it is the invitation — but takes no
   * touches: `pointerEvents="none"` lets every tap fall through to the card's own Pressable,
   * which opens the booking. `disabled` is deliberately NOT used, because that dims the chips to
   * `textDisabled` and the frame draws them live.
   */
  const rating =
    booking.rating === undefined ? null : (
      <View pointerEvents="none">
        <RatingWidget
          value={booking.rating.value ?? null}
          onChange={NO_OP}
          showExceptionalPrompt
          promptText={booking.rating.description}
          testID={`${testID}-rating`}
        />
      </View>
    );

  const content = (
    <>
      {header}
      {cancelled ? notice : body}
      {rating}
    </>
  );

  const cardStyle = [styles.card, rate ? styles.cardRate : styles.cardLive];

  if (onOpen === undefined) {
    return (
      <View style={cardStyle} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={[
        booking.title,
        booking.dateLabel,
        booking.timeLabel,
        booking.cookName,
        booking.badgeCaption,
        booking.badgeValue,
      ]
        .filter((part): part is string => part !== undefined)
        .join('. ')}
      testID={testID}
      style={({ pressed }) => [cardStyle, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    paddingHorizontal: DESIGN.paddingHorizontal,
    paddingVertical: DESIGN.paddingVertical,
    gap: DESIGN.gap,
    borderWidth: lightTheme.stroke.thin,
    backgroundColor: lightTheme.colors.surface,
    shadowColor: lightTheme.colors.textPrimary,
    elevation: 2,
  },
  /** `337:4353` — r24, `#FFD600`, `0 0 4 rgba(0,0,0,0.08)`. */
  cardLive: {
    borderRadius: lightTheme.layout.cardRadius,
    borderColor: lightTheme.colors.borderNotice,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  /** `336:4228` — r20, `#FFDE33`, `0 1 0 rgba(0,0,0,0.05)`. */
  cardRate: {
    borderRadius: lightTheme.layout.sheetRadius,
    borderColor: lightTheme.colors.borderCtaSoft,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    height: DESIGN.headerHeight,
  },
  title: { flex: 1, minWidth: 0 },
  body: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch' },
  /** `337:4362` — the photo and the lines, 8 apart, in a block padded 6 vertically. */
  cook: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DESIGN.cookGap,
    paddingVertical: DESIGN.cookPaddingVertical,
    marginRight: DESIGN.bodyGap,
  },
  /** `337:4363` — 67 × 70 on `#FFF7CC`, clipped at r16 under a 2pt lift. */
  photo: {
    width: DESIGN.photo.width,
    height: DESIGN.photo.height,
    borderRadius: DESIGN.photo.radius,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceAccent,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  /**
   * `337:4364` — the portrait is drawn 79 × 118.5 from x −4 / y −5.5, i.e. wider and taller than
   * the 67 × 70 box and lifted, so the crop lands on the face rather than centring the body.
   *
   * Stated as PERCENTAGES of the box (118 % × 169.29 % at −6 % / −7.857 %), which reproduce
   * −4 / −5.5 / 79 / 118.5 exactly at the drawn size and keep the same crop window for whatever
   * photo the server sends, at whatever aspect ratio, under `cover`.
   */
  photoImage: {
    position: 'absolute',
    left: '-6%',
    top: '-7.857%',
    width: '118%',
    height: '169.29%',
  },
  /** `337:4365` — 117 × 70, three lines at a 2pt gap, vertically centred. */
  lines: {
    flex: 1,
    minWidth: 0,
    maxWidth: DESIGN.lines.width,
    height: DESIGN.lines.height,
    justifyContent: 'center',
    gap: DESIGN.lines.gap,
  },
  /** `337:4369` — the caption-less badge: one 91 × 82 block. */
  badgeBlock: {
    width: DESIGN.badge.width,
    height: DESIGN.badge.height,
    borderRadius: DESIGN.badge.radius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
  /** `337:4411` — a caption over a 58pt pill, 8 apart, in the same 82pt column. */
  badgeColumn: {
    width: DESIGN.badge.width,
    height: DESIGN.badge.height,
    gap: DESIGN.badge.captionGap,
  },
  badgePill: {
    alignSelf: 'stretch',
    height: DESIGN.badge.pillHeight,
    borderRadius: DESIGN.badge.radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
  /**
   * `393:1202` — 305 x 57, white at r16 behind the same `#FFD600` hairline, padded 11.889 with a
   * 10pt gap. Stretched rather than pinned to 305 so it fills the card on any width; the drawn
   * 305 is simply 330 minus the card's 12pt side padding, which the stretch reproduces exactly.
   */
  notice: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 57,
    padding: 11.889,
    borderRadius: 16,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderNotice,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `393:1204` — a 32pt box; the mark is drawn `contain` inside it. */
  noticeGlyph: { width: 32, height: 32 },
  noticeText: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.9 },
});
