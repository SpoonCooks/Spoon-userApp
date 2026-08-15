import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import { QueryBoundary, lightTheme } from '@ui';

import { HomeBookingTiles } from '../components/HomeBookingTiles';
import { HomeMarketing } from '../components/HomeMarketing';
import { HomePromoCarousel } from '../components/HomePromoCarousel';
import { HomeTopBanner } from '../components/HomeTopBanner';
import { UpcomingBookingCard } from '../components/UpcomingBookingCard';
import { useHomeData } from '../data';
import { HOME_DESIGN } from '../layout';
import type { HomeViewModel } from '../types';

/**
 * Home — Figma Page 3a `1:455` (canonical) and Page 3b `209:1207` (with an upcoming booking).
 *
 * THE HOME RULE (task §0). There is ONE logical Home screen. Page 3a is the canonical complete
 * design. Page 3b is byte-for-byte Page 3a with ONE extra card inserted; it is not another route,
 * not a replacement, and not a shorter variant. Verified against `209:1226`, whose children sit
 * at y = 22 / 287 / 431.59 / 590.59 / 942.59 / 1265.59 / 1615.59 / 1860.59 — an unbroken 8pt
 * rhythm with the booking card slotted between the carousel and the tiles:
 *
 *   top banner (sticky)
 *   → promo carousel
 *   → [UpcomingBookingCard]        ← conditional, data-driven
 *   → Instant + Schedule tiles
 *   → cuisine mosaic
 *   → reasons grid
 *   → duration matrix
 *   → exclusions
 *   → Spoon's promise
 *
 * Ruling R-2: the variant is selected SOLELY by the presence of `activeBooking` in the server
 * payload — never by a client guess, a timer, a local flag, or any inference about the booking
 * lifecycle. Ruling R-5: the upcoming booking surfaces here; there is no Upcoming Bookings screen.
 *
 * The frame's phone chrome — the 9pt bezel, the 44pt device radius, the status bar (`209:1382`),
 * the notch (`209:1395`) and the grey scroll pills (`209:1211` / `209:1380`) — is MOCKUP, not app
 * UI, and is deliberately not reproduced. Real safe-area insets are used instead.
 */

export interface HomeActions {
  readonly onPressInstant: () => void;
  readonly onPressSchedule: () => void;
  readonly onPressAddress: () => void;
  readonly onPressProfile: () => void;
  readonly onOpenActiveBooking: () => void;
}

export interface HomeViewProps extends HomeActions {
  readonly state: DataState<HomeViewModel>;
  readonly onRetry?: () => void;
}

export function HomeView({ state, onRetry, ...actions }: HomeViewProps) {
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
                <HomePromoCarousel {...(home.promo === undefined ? {} : { promo: home.promo })} />

                {/*
                  CONDITIONAL INSERT — never a second Home, never a replacement. Everything below
                  this point renders identically whether or not the card is present.
                */}
                {home.activeBooking === undefined ? null : (
                  <UpcomingBookingCard
                    booking={home.activeBooking}
                    onOpen={actions.onOpenActiveBooking}
                  />
                )}

                <HomeBookingTiles
                  tiles={home.tiles}
                  onPressInstant={actions.onPressInstant}
                  onPressSchedule={actions.onPressSchedule}
                />

                {home.marketing === undefined ? null : <HomeMarketing marketing={home.marketing} />}
              </View>
            </ScrollView>
          </>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

export function HomeScreen(actions: HomeActions) {
  const { state, refetch } = useHomeData();
  return <HomeView state={state} onRetry={refetch} {...actions} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: lightTheme.colors.surface },
  scroll: { paddingBottom: HOME_DESIGN.body.paddingBottom },
  body: {
    alignItems: 'center',
    gap: HOME_DESIGN.body.gap,
    paddingTop: HOME_DESIGN.body.paddingTop,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
  },
});
