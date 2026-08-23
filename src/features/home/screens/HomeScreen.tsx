import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import { QueryBoundary, lightTheme } from '@ui';
import type { RatingSelection } from '@ui';

import { HomeBookingBanner } from '../components/HomeBookingBanner';
import { HomeBookingTiles } from '../components/HomeBookingTiles';
import { HomeMarketing } from '../components/HomeMarketing';
import { HomePromoCarousel } from '../components/HomePromoCarousel';
import { HomeTopBanner } from '../components/HomeTopBanner';
import { useHomeData } from '../data';
import { HOME_DESIGN } from '../layout';
import type { HomeBannerDestination } from '../state/homeBannerView';
import type { HomeViewModel } from '../types';

/**
 * Home — Figma Page 3a `1:455` (canonical) and Page 3b `333:3834` (with an active booking).
 *
 * THE HOME RULE (task §0). There is ONE logical Home screen. Page 3a is the canonical complete
 * design. Page 3b is Page 3a with ONE extra section inserted; it is not another route, not a
 * replacement, and not a shorter variant.
 *
 * ORDER CHANGED this pass. `333:3835` places the card SECOND — Book tiles at y 16, "Active
 * banner" at y 186, then the cuisine mosaic at 356. The superseded revision put it between the
 * carousel and the tiles, which is where the previous implementation drew it:
 *
 *   top banner (sticky)
 *   → promo carousel
 *   → Instant + Schedule tiles
 *   → [HomeBookingBanner]          ← conditional, data-driven, MOVED below the tiles
 *   → cuisine mosaic
 *   → reasons grid
 *   → duration matrix
 *   → exclusions
 *   → Spoon's promise
 *
 * The rhythm is an unbroken **16** — banner → 16 → carousel → 16 → every section — with 16 at the
 * head and tail of the scroll. (Page 3a places the same body 55pt lower on its artboard; see
 * `layout.ts` for why 3b's rhythm is the one taken.)
 *
 * Ruling R-2: the variant is selected SOLELY by the presence of `activeBooking` in the server
 * payload — never by a client guess, a timer, a local flag, or any inference about the booking
 * lifecycle. Ruling R-5: the active booking surfaces here; there is no Upcoming Bookings screen.
 *
 * The frame's phone chrome — the 9.78pt bezel, the 44pt device radius, the status bar (`1:615`),
 * the notch (`1:630`) and the grey home indicator (`156:48`) — is MOCKUP, not app UI, and is
 * deliberately not reproduced. Real safe-area insets are used instead.
 */

export interface HomeActions {
  readonly onPressInstant: () => void;
  readonly onPressSchedule: () => void;
  readonly onPressAddress: () => void;
  readonly onPressProfile: () => void;
  /**
   * Raised with the banner's OWN destination, so the host never has to guess which booking the
   * card was about. Passing it rather than letting the host re-read Home is what keeps the two
   * from disagreeing — and stops the host issuing a second copy of every Home query (§3).
   */
  readonly onOpenActiveBooking: (destination: HomeBannerDestination) => void;
  /**
   * `336:4235` — only the rate presentation raises this. Reports a choice; persists nothing.
   *
   * Carries the banner's OWN destination for the same reason `onOpenActiveBooking` does: the host
   * must not have to re-read Home to learn which booking the card was about. A second copy of
   * every Home query is the cost, and a host and a banner disagreeing about which booking is
   * being rated is the risk (§3).
   */
  readonly onRateActiveBooking?: (
    value: RatingSelection,
    destination: HomeBannerDestination,
  ) => void;
}

export interface HomeViewProps extends HomeActions {
  readonly state: DataState<HomeViewModel>;
  readonly onRetry?: () => void;
  /**
   * Whether Home is the FOCUSED route. Only the carousel reads it, to stop its autoplay while
   * the customer is somewhere else. Optional and defaulting to focused so the view stays
   * renderable on its own — `HomeScreen` is the one mounted under the navigator, so it is the
   * one that can answer this.
   */
  readonly focused?: boolean;
}

export function HomeView({ state, onRetry, focused, ...actions }: HomeViewProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']} testID="home-screen">
      <QueryBoundary state={state} {...(onRetry === undefined ? {} : { onRetry })}>
        {(home) => (
          <>
            <HomeTopBanner
              header={home.header}
              onPressAddress={actions.onPressAddress}
              onPressProfile={actions.onPressProfile}
            />

            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              testID="home-scroll"
            >
              <View style={styles.body}>
                <HomePromoCarousel
                  {...(home.promo === undefined ? {} : { promo: home.promo })}
                  {...(focused === undefined ? {} : { focused })}
                />

                <View style={styles.column}>
                  <HomeBookingTiles
                    tiles={home.tiles}
                    onPressInstant={actions.onPressInstant}
                    onPressSchedule={actions.onPressSchedule}
                  />

                  {/*
                    CONDITIONAL INSERT — never a second Home, never a replacement. Everything
                    below this point renders identically whether or not the card is present.
                  */}
                  {home.activeBooking === undefined ? null : (
                    <HomeBookingBanner
                      booking={home.activeBooking}
                      onOpen={bannerOpener(home.activeBooking, actions.onOpenActiveBooking)}
                      {...bannerRater(home.activeBooking, actions.onRateActiveBooking)}
                    />
                  )}

                  {home.marketing === undefined ? null : (
                    <HomeMarketing marketing={home.marketing} />
                  )}
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

/**
 * Binds the banner to its own destination.
 *
 * Extracted so the JSX carries no non-null assertion: narrowing `home.activeBooking` inside the
 * conditional does not survive into the arrow function's body, and asserting it there would be
 * asserting the one thing the conditional already proved.
 */
function bannerOpener(
  booking: NonNullable<HomeViewModel['activeBooking']>,
  onOpen: HomeActions['onOpenActiveBooking'],
): () => void {
  return () => onOpen(booking.destination);
}

/**
 * The same binding for the rating chips.
 *
 * Returns NO `onRate` when the host wires none, which is what leaves `RatingWidget` disabled —
 * the designed inert state — rather than drawing live chips over a handler that does not exist.
 */
function bannerRater(
  booking: NonNullable<HomeViewModel['activeBooking']>,
  onRate: HomeActions['onRateActiveBooking'],
): { onRate?: (value: RatingSelection) => void } {
  if (onRate === undefined) return {};
  return { onRate: (value) => onRate(value, booking.destination) };
}

export function HomeScreen(actions: HomeActions) {
  const { state, refetch } = useHomeData();
  /**
   * Home is not unmounted when the customer pushes Address or a booking on top of it, so
   * "focused" is the only thing that distinguishes "on screen" from "still mounted underneath".
   * The carousel needs that to stop animating for a screen nobody is looking at.
   */
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      void refetch();
      return () => setFocused(false);
    }, [refetch]),
  );

  return <HomeView state={state} onRetry={refetch} focused={focused} {...actions} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: lightTheme.colors.surface },
  scroll: { paddingBottom: HOME_DESIGN.body.paddingBottom },
  /**
   * The carousel is FULL-BLEED (`1:479` spans the viewport, not the 16pt column), so the gutter
   * lives on the column BELOW it rather than on the scroll body.
   */
  body: { gap: HOME_DESIGN.body.gap, paddingTop: HOME_DESIGN.body.paddingTop },
  column: {
    gap: HOME_DESIGN.body.gap,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
  },
});
