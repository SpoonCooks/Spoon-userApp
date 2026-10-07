import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CALENDAR_DEMO_DATES,
  ModifyBookingSheet,
  PaymentDetailsSheet,
  RateVisitCard,
  RecurringLiveScreen,
  RecurringPlansScreen,
  TellUsMoreSheet,
  VisitDetailsScreen,
} from '@features/recurringLive';
import type { RecurringTab, VisitPrepReady, VisitRatingValue } from '@features/recurringLive';
import { RouteScaffold } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Recurring live booking — DEV PREVIEW, DEVELOPMENT ONLY, the same arrangement as
 * `recurring-setup.tsx`: the screens are static UI with fixture data and no real route yet, so
 * this is where they can be looked at on a device. Query params pick the Figma state:
 *
 *   ?screen=live    [&date=past|today|upcoming]       `1005:132`, `1354:1543`, `1006:*` pop-ups
 *   ?screen=plans   [&visit=2] [&edited=1]             `1017:433` / `1017:5997` / `1017:6054`
 *   ?screen=visit   &variant=assigned|pending|completed|cancelled [&prep=0|1|3]
 *                   [&sheet=modify|payment]            `1008:5398`, `1466:*`, `1441:*`, `1433:1537`,
 *                                                      `1434:1678`
 *   ?screen=rating  [&rating=4.5|5plus|3.5|2.5|1] [&sheet=more]   `1501:*`
 *
 * The tabs, the pop-ups and the dock buttons are live within the preview so the flow can be
 * clicked through; none of it is the real navigation.
 */
type Screen = 'live' | 'plans' | 'visit' | 'rating';

const DATE_PRESETS: Record<string, string> = CALENDAR_DEMO_DATES;
const VISIT_VARIANTS = ['assigned', 'pending', 'completed', 'cancelled'] as const;
const RATINGS: readonly VisitRatingValue[] = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, '5+'];

function parseRating(raw: string | undefined): VisitRatingValue | null {
  if (raw === undefined) return null;
  // A query decodes `5%2B` to "5 " (the `+` reads as a space), so take that, "5+" and "5plus".
  const value = raw === '5 ' || raw === '5plus' ? '5+' : raw;
  return RATINGS.find((rating) => String(rating) === value) ?? null;
}

function parsePrep(raw: string | undefined): VisitPrepReady {
  return raw === '1' ? 1 : raw === '2' ? 2 : raw === '3' ? 3 : 0;
}

type PreviewParams = {
  screen?: string;
  date?: string;
  visit?: string;
  edited?: string;
  variant?: string;
  prep?: string;
  sheet?: string;
  rating?: string;
};

/**
 * Re-keyed on its query so a second deep link into the same route remounts the preview: expo-router
 * keeps the mounted screen, and the screens below only read their `initial*` props once.
 */
export default function RecurringLivePreviewRoute() {
  const params = useLocalSearchParams<PreviewParams>();
  return <RecurringLivePreview key={JSON.stringify(params)} params={params} />;
}

function RecurringLivePreview({ params }: { readonly params: PreviewParams }) {
  const router = useRouter();
  const goBack = () => router.back();

  const [screen, setScreen] = useState<Screen>(
    params.screen === 'plans' || params.screen === 'visit' || params.screen === 'rating'
      ? params.screen
      : 'live',
  );
  const [sheet, setSheet] = useState<string | undefined>(params.sheet);

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Recurring live booking preview"
        status="foundation"
        notes={['This preview is available in development builds only']}
      />
    );
  }

  const onTabChange = (tab: RecurringTab) => setScreen(tab === 'plans' ? 'plans' : 'live');
  const closeSheet = () => setSheet(undefined);

  switch (screen) {
    case 'plans':
      return (
        <RecurringPlansScreen
          onBack={goBack}
          onTabChange={onTabChange}
          initialVisit={params.visit === '2' ? 2 : 1}
          edited={params.edited === '1'}
        />
      );
    case 'visit': {
      const variant = VISIT_VARIANTS.find((value) => value === params.variant) ?? 'assigned';
      return (
        <>
          <VisitDetailsScreen
            variant={variant}
            onBack={goBack}
            prepState={parsePrep(params.prep)}
            onModifyBooking={() => setSheet('modify')}
            onPaymentDetails={() => setSheet('payment')}
            // Nothing to dial or open in the preview; these draw Call and the WhatsApp toast.
            onCall={() => undefined}
            onHelp={() => undefined}
            onShareRecipe={() => undefined}
            ratingSlot={
              variant === 'completed' ? (
                <RateVisitCard initialRating={parseRating(params.rating) ?? 4.5} />
              ) : undefined
            }
          />
          <ModifyBookingSheet visible={sheet === 'modify'} onClose={closeSheet} />
          <PaymentDetailsSheet
            visible={sheet === 'payment'}
            onClose={closeSheet}
            onManageAutopay={() => undefined}
          />
        </>
      );
    }
    case 'rating':
      return (
        <SafeAreaView style={styles.ratingGround} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.ratingContent}>
            <RateVisitCard
              initialRating={parseRating(params.rating)}
              onTellUsMore={() => setSheet('more')}
            />
          </ScrollView>
          <TellUsMoreSheet visible={sheet === 'more'} onClose={closeSheet} />
        </SafeAreaView>
      );
    default:
      return (
        <RecurringLiveScreen
          onBack={goBack}
          onTabChange={onTabChange}
          onOpenVisit={() => setScreen('visit')}
          {...(params.date !== undefined && DATE_PRESETS[params.date] !== undefined
            ? { initialSelectedDate: DATE_PRESETS[params.date] }
            : {})}
        />
      );
  }
}

const styles = StyleSheet.create({
  ratingGround: { flex: 1, backgroundColor: lightTheme.colors.surfaceSunken },
  ratingContent: { padding: lightTheme.space.lg },
});
