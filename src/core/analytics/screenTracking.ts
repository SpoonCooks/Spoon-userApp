import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { getAnalytics, logScreenView } from '@react-native-firebase/analytics';

import { screenNameFrom } from './screenName';

/**
 * Reports every screen the customer reaches to Firebase Analytics.
 *
 * ## Why a hook at the root rather than a call per screen
 *
 * A `logScreenView` on each screen is thirty edits that drift: a screen added later has no call,
 * a screen renamed keeps its old label, and nobody notices because a missing event looks exactly
 * like a screen nobody visited. `expo-router` already knows the route, so the route IS the name.
 *
 * ## What is sent, and what is deliberately not
 *
 * The PATTERN, never the resolved path. `/booking/[id]` is reported as `/booking/[id]`, so the
 * funnel counts visits to the booking screen without a booking id ever leaving the device.
 * `usePathname` returns the resolved path, so the id is stripped here rather than trusted not to
 * appear -- addresses, booking ids and phone numbers are not analytics data, and an id in an event
 * name is a customer identifier in a third-party system that nobody decided to put there.
 *
 * Nothing else is logged: no parameters, no user properties, no ids. Screen views only, which is
 * what a funnel needs and the least this can collect while still answering the question.
 */

export function useScreenTracking(): void {
  const pathname = usePathname();
  // The same screen re-rendering is not a new view. Only a CHANGE of route is reported.
  const lastReported = useRef<string | null>(null);

  useEffect(() => {
    const screenName = screenNameFrom(pathname);
    if (screenName === lastReported.current) return;
    lastReported.current = screenName;
    /*
     * Fire and forget: analytics must never delay a navigation or surface an error to a customer.
     *
     * The MODULAR api (`getAnalytics(...)`, `logScreenView(...)`), not the namespaced
     * `analytics().logScreenView(...)` that most guides still show -- v26 removed the default
     * export, so the old form does not compile.
     */
    void logScreenView(getAnalytics(), {
      screen_name: screenName,
      screen_class: screenName,
    }).catch(() => undefined);
  }, [pathname]);
}
