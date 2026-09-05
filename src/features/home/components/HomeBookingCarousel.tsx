import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { lightTheme } from '@ui';

import { HomeBookingBanner } from './HomeBookingBanner';
import { HOME_DESIGN } from '../layout';
import type { HomeBannerDestination, HomeBannerViewModel } from '../state/homeBannerView';

const { promo: PROMO_DESIGN } = HOME_DESIGN;

/**
 * Every booking the customer currently holds, one card at a time.
 *
 * ## Why this exists
 *
 * Home drew ONE card. `GET /v1/me/bookings/active` returns up to twenty, and the screen sorted
 * them, took the winner and dropped the rest — so a customer with an 11:30 and a 2:00 booking saw
 * one card and nothing to say the second existed. The data had been there all along.
 *
 * ## FIGMA_PENDING — no frame draws this
 *
 * There is no multi-booking frame, so nothing here is invented that the design could contradict.
 * The card is the SAME `HomeBookingBanner` at the same size; the only additions are paging and a
 * dot row, and both are borrowed from `HomePromoCarousel` — the same 7pt dots at the same 4pt gap
 * in the same two colours — so the screen gains no new vocabulary.
 *
 * ## One booking renders exactly as it did before
 *
 * The common case is one booking, and it must not pay for this. With a single card there is no
 * ScrollView, no dot row and no measurement: the banner is returned bare, which is byte-for-byte
 * what Home rendered before this component existed. The carousel only appears when there is
 * genuinely something to page through.
 *
 * ## Paging, not the promo carousel's loop
 *
 * `HomePromoCarousel` wraps infinitely with cloned edges because it autoplays through marketing
 * art. Bookings are a finite, ordered list — the server ranks them, most urgent first — and
 * wrapping from the last to the first would suggest a cycle where there is a sequence. It also
 * never autoplays: a card that moves on its own while the customer is reading their arrival time
 * is a card that gets missed.
 */
export interface HomeBookingCarouselProps {
  readonly bookings: readonly HomeBannerViewModel[];
  readonly onOpen: (destination: HomeBannerDestination) => void;
  readonly testID?: string;
}

export function HomeBookingCarousel({
  bookings,
  onOpen,
  testID = 'home-booking-carousel',
}: HomeBookingCarouselProps): React.ReactElement | null {
  // Measured rather than taken from the window: this sits inside the content column's padding, so
  // the window width would overshoot a page by exactly the gutters and drift the snap per card.
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent): void => {
    setPageWidth(event.nativeEvent.layout.width);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      if (pageWidth <= 0) return;
      const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      setIndex(Math.max(0, Math.min(bookings.length - 1, next)));
    },
    [bookings.length, pageWidth],
  );

  if (bookings.length === 0) return null;

  const [only] = bookings;
  if (bookings.length === 1 && only !== undefined) {
    return <HomeBookingBanner booking={only} onOpen={() => onOpen(only.destination)} />;
  }

  return (
    <View style={styles.block} onLayout={onLayout} testID={testID}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        testID={`${testID}-track`}
      >
        {bookings.map((booking) => (
          <View
            key={booking.bookingId}
            // Zero width until the first layout lands, which would collapse every page onto one
            // another. Rendering at the measured width only is the simplest way to avoid a frame
            // of overlapped cards on mount.
            style={pageWidth > 0 ? { width: pageWidth } : styles.unmeasured}
            testID={`${testID}-page-${booking.bookingId}`}
          >
            {/*
              A testID PER CARD. The banner's default is `home-upcoming-booking`, which was fine
              while Home drew exactly one; three cards sharing it would make every lookup
              ambiguous and let a test press whichever came first.
            */}
            <HomeBookingBanner
              booking={booking}
              onOpen={() => onOpen(booking.destination)}
              testID={`${testID}-card-${booking.bookingId}`}
            />
          </View>
        ))}
      </ScrollView>

      <View
        style={styles.dots}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Booking ${index + 1} of ${bookings.length}`}
        testID={`${testID}-dots`}
      >
        {bookings.map((booking, position) => (
          <View
            key={booking.bookingId}
            style={[styles.dot, position === index ? styles.dotActive : styles.dotIdle]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignSelf: 'stretch', gap: PROMO_DESIGN.dotsGap },
  // Before the first measurement. `width: 0` would stack every card at the same offset.
  unmeasured: { width: '100%' },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PROMO_DESIGN.dot.gap,
  },
  dot: {
    width: PROMO_DESIGN.dot.size,
    height: PROMO_DESIGN.dot.size,
    borderRadius: PROMO_DESIGN.dot.size / 2,
    opacity: PROMO_DESIGN.dot.opacity,
  },
  dotActive: { backgroundColor: lightTheme.colors.borderCtaSoft },
  dotIdle: { backgroundColor: lightTheme.colors.surfaceAccentStrong },
});
