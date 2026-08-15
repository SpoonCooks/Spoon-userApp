import { StyleSheet, View } from 'react-native';

import { Card } from '@ui/primitives/Card';
import { ListRow } from '@ui/components/ListRow';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * DEVELOPMENT-ONLY navigation menu.
 *
 * No auth endpoint exists, so a device build cannot sign in and would otherwise stop at Login
 * with no way to reach the built screens. This menu is the review path. It renders only under
 * `__DEV__` and lives at its own route (`spoon://menu`) — it is deliberately NOT embedded in a
 * product screen, because a content-sized menu inside a `flex: 1` screen collapses that screen.
 *
 * It is navigation scaffolding, not product UI: no screen depends on it, and it disappears from
 * release builds.
 */

export interface DevRoute {
  readonly path: string;
  readonly label: string;
  readonly note: string;
}

/** Every built screen and state, in the order the product flows. */
export const DEV_ROUTES: readonly DevRoute[] = [
  { path: '/login', label: 'Login', note: '53:174 · redesigned in the new file' },
  { path: '/home', label: 'Home', note: 'Active-booking variant · 209:1207' },
  { path: '/scheduled', label: 'Schedule', note: 'Day → Time → Duration → Start · 37:* / 34:*' },
  { path: '/meal-brief', label: 'Meal Brief & Recipe Link', note: '3:684' },
  { path: '/booking/confirmation', label: 'Booking · Confirmation', note: '3:1041' },
  { path: '/booking/enRoute', label: 'Booking · En route (on time)', note: '3:1381' },
  { path: '/booking/enRouteLate', label: 'Booking · En route (late)', note: '99:1413' },
  { path: '/booking/arrived', label: 'Booking · Arrived + Start OTP', note: '3:1658' },
  { path: '/booking/inService', label: 'Booking · In service + Extend', note: '101:1812 / 3:2002' },
  { path: '/booking/reassigned', label: 'Booking · Reassigned (on time)', note: '201:100' },
  { path: '/booking/reassignedLate', label: 'Booking · Reassigned (late)', note: '209:747' },
  { path: '/booking/autoCancelled', label: 'Booking · Auto cancelled', note: '201:278' },
  { path: '/booking/completion', label: 'Booking · Completion', note: '143:207' },
  { path: '/reschedule/demo', label: 'Reschedule', note: '47:* · submit inert (B-4)' },
  { path: '/address', label: 'Saved addresses', note: '68:214 → 53:31 → 60:655' },
  { path: '/address?edit=1', label: 'Address · Edit / Delete sheet', note: 'NEW 228:1801' },
  { path: '/address/out-of-service', label: 'Address · Out of service', note: 'NEW 215:1472' },
  { path: '/history', label: 'Past bookings', note: '6:227' },
  { path: '/refunds', label: 'Refunds', note: '71:615' },
  { path: '/profile', label: 'Profile', note: '6:663' },
  { path: '/otp', label: 'Login · OTP (waiting)', note: 'NEW 227:1649' },
  { path: '/otp?state=ready', label: 'Login · OTP (resend ready)', note: 'NEW 227:1649 state' },
  { path: '/otp?state=error', label: 'Login · OTP (wrong code)', note: 'NEW 227:1649 state' },
  { path: '/cancellation', label: 'Cancel booking · Policy', note: '6:2 · no entry point (B-11)' },
  { path: '/cancellation?step=reason', label: 'Cancel booking · Reason', note: '104:2260' },
  { path: '/cancellation?step=refund', label: 'Cancel booking · Refund', note: '104:2336' },
  { path: '/cancellation?step=confirmed', label: 'Cancel booking · Confirmed', note: '115:2703' },
  { path: '/showcase', label: 'Component showcase', note: 'Design system' },
];

export interface DevRouteMenuProps {
  readonly onNavigate: (path: string) => void;
}

export function DevRouteMenu({ onNavigate }: DevRouteMenuProps) {
  if (!__DEV__) {
    return null;
  }

  return (
    <Card tone="surface" testID="dev-route-menu" style={styles.card}>
      <Text variant="labelUpper" color="textSecondary">
        Development navigation
      </Text>
      <Text variant="caption" color="textSecondary">
        No auth endpoint exists yet, so these open each designed screen and state directly.
      </Text>

      <View style={styles.list}>
        {DEV_ROUTES.map((route) => (
          <ListRow
            key={route.path}
            title={route.label}
            subtitle={route.note}
            icon="forward"
            onPress={() => onNavigate(route.path)}
            testID={`dev-route-${route.path}`}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: lightTheme.space.xxs },
  list: { paddingTop: lightTheme.space.sm },
});
