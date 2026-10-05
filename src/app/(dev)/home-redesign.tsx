import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { HomeRedesignScreen, joinWaitlist } from '@features/homeRedesign';
import type { BookingMode, HomeModel } from '@features/homeRedesign';
import { formatPaise } from '@core/format';
import { RouteScaffold } from '@ui';
import {
  DEMO_HOME_FIRST_TIME,
  DEMO_HOME_NO_INSTANT,
  DEMO_HOME_NOT_LIVE,
  DEMO_HOME_NOT_LIVE_JOINED,
  DEMO_HOME_RETURNING,
  DEMO_HOME_RETURNING_PLAN,
  DEMO_HOME_RETURNING_SMALL_POOL,
} from '@/demo/fixtures/homeRedesign';

const FIXTURES: Record<string, HomeModel> = {
  first: DEMO_HOME_FIRST_TIME,
  returning: DEMO_HOME_RETURNING,
  plan: DEMO_HOME_RETURNING_PLAN,
  smallPool: DEMO_HOME_RETURNING_SMALL_POOL,
  noInstant: DEMO_HOME_NO_INSTANT,
  notLive: DEMO_HOME_NOT_LIVE,
  notLiveJoined: DEMO_HOME_NOT_LIVE_JOINED,
};

/** Destinations that do not exist yet say so instead of doing nothing. */
const pending = (destination: string, detail?: string) =>
  Alert.alert(`→ ${destination}`, detail ?? 'Not built yet in this preview.');

/**
 * The redesigned Home — DEVELOPMENT ONLY. Reachable at `spoon://home-redesign`.
 *
 * No backend, so it lives outside the authenticated shell and refuses to render outside
 * `__DEV__`. `?state=` picks the payload; the variant is then RESOLVED from it, as on the real
 * Home:
 *
 *   first (default)  `941:4884`     returning  `1255:2973`     notLive  `1302:3539`
 *   plan             returning with a live recurring plan
 *   smallPool        returning with one pooled cook (Recurring locked)
 *   noInstant        instant unavailable (Now disabled)
 *   notLiveJoined    already on the waitlist
 *
 * `?tab=recurring` opens the Recurring tab (`1290:1280`, with `state=returning`).
 * `?returning=1` and `?notLive=1` are kept as shorthands.
 */
export default function HomeRedesignDevRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    state?: string;
    returning?: string;
    notLive?: string;
    tab?: string;
  }>();

  if (!__DEV__) {
    return <RouteScaffold title="Not available" status="blocked" />;
  }

  const key =
    params.state ??
    (params.notLive === '1' ? 'notLive' : params.returning === '1' ? 'returning' : 'first');
  const sample = FIXTURES[key] ?? DEMO_HOME_FIRST_TIME;
  const mode: BookingMode | undefined =
    params.tab === 'now' || params.tab === 'later' || params.tab === 'recurring'
      ? params.tab
      : undefined;

  return (
    <HomeRedesignScreen
      // Remount on a new link so each case opens fresh rather than keeping the last one's state.
      key={`${key}-${mode ?? ''}`}
      sample={sample}
      {...(mode === undefined ? {} : { initialMode: mode })}
      onPressAddress={() => router.push('/address?from=home')}
      onPressProfile={() => router.push('/profile')}
      onBookNow={(r) =>
        pending(
          'Confirm step',
          `${r.duration.label} · ${formatPaise(r.duration.pricePaise)} · ${r.dishes} dishes · ${r.people} people · ${r.complexity}`,
        )
      }
      onPickSlot={() => router.push('/scheduled')}
      onPressPaymentDetails={(d) =>
        pending('Tax dialog', `${d.label} · ${formatPaise(d.pricePaise)}`)
      }
      onPressRecurring={(target) =>
        pending(
          {
            recurringFlow: 'Recurring flow',
            planTracker: 'Plan tracker',
            explainer: 'Recurring explainer',
          }[target],
        )
      }
      onPressCookPool={() => pending('Cook pool screen')}
      onPressPoolCook={(cook) => pending('Cook profile', cook.name)}
      onJoinWaitlist={async (pincode) => {
        await joinWaitlist(
          { pincode, alreadyJoined: sample.waitlist?.joined === true },
          {
            requestPushPermission: async () => {
              const existing = await Notifications.getPermissionsAsync();
              if (existing.granted) return true;
              return (await Notifications.requestPermissionsAsync()).granted;
            },
            // TODO(backend-contract): idempotent `{userId, pincode}` register. Simulated here.
            register: () => new Promise((resolve) => setTimeout(resolve, 600)),
          },
        );
      }}
    />
  );
}
