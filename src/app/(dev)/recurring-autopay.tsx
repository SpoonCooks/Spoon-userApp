import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AutopaySheet,
  autopaySummary,
  ConfirmingAutopayBanner,
  RecurringPlanFlow,
} from '@features/recurringSetup';
import type { AutopayState, RecurringPlanDraft, UpiApp } from '@features/recurringSetup';
import { RouteScaffold } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Recurring UPI Autopay — DEV PREVIEW, DEVELOPMENT ONLY. Every state of the Autopay sheet over the
 * Summary, with sample data, so each can be laid beside its Figma frame (`cCQlzTeiObQkpVBzwI8mZi`,
 * page "Recurring: booking creation"):
 *
 *   ?state=choose       `2316:3558` Choose UPI app (PhonePe last used)
 *   ?state=more         `2316:3558` after "More UPI apps"
 *   ?state=creating     the list with PhonePe busy (no frame)
 *   ?state=waiting      `2317:3577` Waiting for approval ("Request expires in 4:52")
 *   ?state=left         `2317:3667` Left without approving
 *   ?state=failed       `2317:3753` Didn't go through
 *   ?state=confirming   `2317:3839` Still confirming
 *   ?state=active       `2317:4009` Active
 *   ?state=noApp        No UPI app found (no frame)
 *   ?state=banner       Home's "Confirming Autopay" banner (no frame)
 *
 * The sheet's buttons move between the states so the flow can be clicked through; nothing is
 * sent anywhere.
 */

/** The Summary behind it: `1079:3207`'s two plans, pinned to the frames' date. */
const FIGMA_TODAY = new Date(2026, 8, 25);
const PLANS: readonly RecurringPlanDraft[] = [
  {
    id: 'plan-1',
    dayIds: ['2026-09-28', '2026-09-30', '2026-10-05'],
    visits: [{ timeOfDay: 'morning', durationId: 'd90', startMinutes: 9 * 60 }],
  },
  {
    id: 'plan-2',
    dayIds: ['2026-10-02', '2026-10-07', '2026-10-17', '2026-10-18'],
    visits: [
      { timeOfDay: 'afternoon', durationId: 'd60', startMinutes: 9 * 60 },
      {
        timeOfDay: 'evening',
        durationId: 'd45',
        startMinutes: 18 * 60,
        dayIds: ['2026-10-07', '2026-10-17'],
      },
    ],
  },
];

/** The frames' data: 2 plans, 12 visits, ₹299 a visit (+5% GST), ₹1,000 a charge. */
const SUMMARY = autopaySummary({
  plansCount: 2,
  visitsCount: 12,
  prices: [{ pricePaise: 29_900, gstPaise: 1_495 }],
  maxChargePaise: 100_000,
});

const APPS: readonly UpiApp[] = [
  { id: 'phonepe', name: 'PhonePe', packageName: 'com.phonepe.app' },
  { id: 'gpay', name: 'Google Pay', packageName: 'com.google.android.apps.nbu.paisa.user' },
  { id: 'paytm', name: 'Paytm', packageName: 'net.one97.paytm' },
  { id: 'cred', name: 'CRED', packageName: 'com.dreamplug.androidapp' },
  { id: 'bhim', name: 'BHIM', packageName: 'in.org.npci.upiapp' },
];
const PHONEPE = APPS[0]!;

/** A fixed clock, so the chip reads the frame's "4:52". */
const NOW = Date.UTC(2026, 8, 25, 6, 0, 0);
const EXPIRES = NOW + (4 * 60 + 52) * 1000;

function stateFor(name: string | undefined): AutopayState {
  switch (name) {
    case 'creating':
      return { kind: 'creating', app: PHONEPE };
    case 'waiting':
      return {
        kind: 'waiting',
        app: PHONEPE,
        link: 'upi://mandate?preview',
        startedAt: NOW - 8_000,
        expiresAt: EXPIRES,
        authorizedAt: null,
      };
    case 'left':
      return { kind: 'left', app: PHONEPE };
    case 'failed':
      return { kind: 'failed', app: PHONEPE };
    case 'confirming':
      return { kind: 'confirming', app: PHONEPE };
    case 'active':
      return { kind: 'active', app: PHONEPE, handleMasked: '••••@ybl' };
    case 'noApp':
      return { kind: 'noApp' };
    default:
      return { kind: 'choose', notice: null };
  }
}

export default function RecurringAutopayPreviewRoute() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  return <Preview key={state ?? 'choose'} initial={state} />;
}

function Preview({ initial }: { readonly initial: string | undefined }) {
  const router = useRouter();
  const [state, setState] = useState<AutopayState>(() => stateFor(initial));
  const [showAll, setShowAll] = useState(initial === 'more');
  const goBack = () => router.back();

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Recurring Autopay preview"
        status="foundation"
        notes={['This preview is available in development builds only']}
      />
    );
  }

  if (initial === 'banner') {
    return (
      <SafeAreaView style={styles.bannerScreen}>
        <View style={styles.bannerBody}>
          <ConfirmingAutopayBanner onPress={goBack} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <RecurringPlanFlow
        onExit={goBack}
        onOpenInfo={() => undefined}
        today={FIGMA_TODAY}
        seed={{ plans: PLANS, stage: { kind: 'summary', planIndex: 1, visitIndex: 0 } }}
        onComplete={() => setState({ kind: 'choose', notice: null })}
      />
      <AutopaySheet
        visible
        state={state}
        summary={SUMMARY}
        apps={APPS}
        lastUsedId="phonepe"
        showAllApps={showAll}
        now={NOW}
        onPick={(app) =>
          setState({
            kind: 'waiting',
            app,
            link: 'upi://mandate?preview',
            startedAt: NOW,
            expiresAt: EXPIRES,
            authorizedAt: null,
          })
        }
        onMoreApps={() => setShowAll(true)}
        onClose={goBack}
        onOpenAgain={() => setState({ kind: 'confirming', app: PHONEPE })}
        onCancel={() => setState({ kind: 'choose', notice: null })}
        onTryAgain={() => setState(stateFor('waiting'))}
        onChooseAnother={() => setState({ kind: 'choose', notice: null })}
        onBackToHome={goBack}
        onViewPlan={goBack}
        onRescan={() => setState({ kind: 'choose', notice: null })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bannerScreen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  bannerBody: { padding: lightTheme.space.lg },
});
