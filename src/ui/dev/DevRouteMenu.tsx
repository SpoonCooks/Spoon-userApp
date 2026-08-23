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
  { path: '/login', label: 'Login', note: 'FINAL · Login flow 275:4472 · 250:2383' },
  { path: '/home', label: 'Home', note: 'Active-booking variant · 209:1207' },
  {
    path: '/home?instant=available',
    label: 'Instant · Available',
    note: 'FINAL · Instant booking 267:3520 · 1:728',
  },
  {
    path: '/home?instant=taxes',
    label: 'Instant · Taxes dialog',
    note: 'FINAL · 25:1585 — dialog layered over the sheet',
  },
  {
    path: '/home?instant=outOfShift',
    label: 'Instant · Out of shift',
    note: 'FINAL · 25:1327 — moon art, "Schedule NOW"',
  },
  {
    path: '/home?instant=noSlots',
    label: 'Instant · No slots',
    note: 'FINAL · 44:5378 — calendar art, "Schedule NOW"',
  },
  { path: '/scheduled', label: 'Schedule · 1 Day', note: 'FINAL · 267:3521 · 275:4488' },
  { path: '/scheduled?step=2', label: 'Schedule · 2 + Time', note: 'FINAL · 275:4713' },
  { path: '/scheduled?step=3', label: 'Schedule · 3 + Duration', note: 'FINAL · 275:4938' },
  { path: '/scheduled?step=4', label: 'Schedule · 4 + Start time', note: 'FINAL · 34:3035' },
  { path: '/reschedule/demo', label: 'Reschedule · 1 Day', note: 'FINAL · 275:5217 · 275:5442' },
  { path: '/reschedule/demo?step=2', label: 'Reschedule · 2 + Time', note: 'FINAL · 275:5490' },
  {
    path: '/reschedule/demo?step=3',
    label: 'Reschedule · 3 + Start time',
    note: 'FINAL · 275:5218 · CTA "Reschedule"',
  },
  { path: '/address/location', label: 'Address · Select location', note: 'FINAL · 53:31' },
  { path: '/address/details', label: 'Address · Complete address', note: 'FINAL · 60:655' },
  { path: '/meal-brief', label: 'Meal Brief & Recipe Link', note: '3:684' },
  {
    path: '/booking/confirmation',
    label: 'Booking · Confirmation',
    note: '3:1041 · tap "View booking details" for NEW 250:2861',
  },
  {
    path: '/booking/confirmReassign',
    label: 'Booking · Confirm reassign',
    note: '289:6607',
  },
  { path: '/booking/enRoute', label: 'Booking · En route (on time)', note: '3:1381' },
  { path: '/booking/enRouteLate', label: 'Booking · En route (late)', note: '292:469' },
  { path: '/booking/arrived', label: 'Booking · Arrived + Start OTP', note: '3:1658' },
  {
    path: '/booking/inService',
    label: 'Booking · In service + Extend',
    note: '101:1812 · "Extend Time" opens 3:2002; its "Check payment details" opens NEW 275:4189',
  },
  {
    path: '/booking/cookingExtended',
    label: 'Booking · Cooking extended',
    note: '292:1197',
  },
  { path: '/booking/reassigned', label: 'Booking · Reassigned (on time)', note: '201:100' },
  { path: '/booking/reassignedLate', label: 'Booking · Reassigned (late)', note: '292:657' },
  { path: '/booking/autoCancelled', label: 'Booking · Auto cancelled', note: '201:278' },
  {
    path: '/booking/completion',
    label: 'Booking · Completion',
    note: '299:1424 · tap the tip row for NEW 306:2885',
  },
  {
    path: '/booking/feedbackSubmitted',
    label: 'Booking · Feedback submitted',
    note: '319:3191',
  },
  { path: '/address', label: 'Saved addresses', note: 'FINAL · Address 275:4473 · 68:214' },
  { path: '/address?edit=1', label: 'Address · Edit / Delete sheet', note: 'NEW 228:1801' },
  { path: '/address/out-of-service', label: 'Address · Out of service', note: 'FINAL · 215:1472' },
  { path: '/profile', label: 'Profile', note: 'FINAL · Profile 275:6021 · 6:663' },
  { path: '/history', label: 'Past bookings', note: 'FINAL · 6:227' },
  { path: '/refunds', label: 'Refunds', note: 'FINAL · 71:615' },
  { path: '/otp', label: 'Login · OTP (countdown)', note: 'FINAL · 275:4289' },
  { path: '/otp?state=ready', label: 'Login · OTP (resend ready)', note: 'FINAL · 250:2439' },
  { path: '/otp?state=error', label: 'Login · OTP (wrong code)', note: 'FINAL · 275:4349' },
  {
    path: '/cancellation',
    label: 'Cancel booking · Policy',
    note: 'FINAL · Cancellation flow 115:2821 · 6:2 · no entry point (B-11)',
  },
  { path: '/cancellation?step=reason', label: 'Cancel booking · Reason', note: 'FINAL · 104:2260' },
  { path: '/cancellation?step=refund', label: 'Cancel booking · Refund', note: 'FINAL · 104:2336' },
  {
    path: '/cancellation?step=confirmed',
    label: 'Cancel booking · Confirmed',
    note: 'FINAL · 115:2703',
  },
  { path: '/showcase', label: 'Component showcase', note: 'Design system' },
  { path: '/splash', label: 'Login · Loading page', note: '73:1036' },
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
