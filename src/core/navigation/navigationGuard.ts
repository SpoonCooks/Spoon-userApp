import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * How long a guarded action stays locked when nothing takes focus away — an action that opens
 * WhatsApp or a sheet, or a push the router refused. Long enough to swallow a double tap, short
 * enough that a second deliberate press still works.
 */
const RELOCK_MS = 800;

/**
 * One navigation per tap.
 *
 * A quick double (or triple) tap on a CTA used to push the same screen two or three times: every
 * press reached `router.push` before the first transition had taken the screen out of focus. The
 * guard runs the first press and ignores the rest until this screen is focused again — which is
 * exactly when the customer has come back and a press means something new — or `RELOCK_MS` has
 * passed, for actions that never leave the screen.
 *
 * Wrap every navigating handler on a screen with the one guard, so two DIFFERENT CTAs tapped
 * together also open only one screen.
 */
export function useNavigationGuard(): <A extends unknown[]>(
  action: (...args: A) => void,
) => (...args: A) => void {
  const lockedUntil = useRef(0);

  useFocusEffect(
    useCallback(() => {
      lockedUntil.current = 0;
      // Leaving the screen holds the lock until it is focused again, however long the
      // transition takes.
      return () => {
        lockedUntil.current = Number.POSITIVE_INFINITY;
      };
    }, []),
  );

  return useCallback(
    <A extends unknown[]>(action: (...args: A) => void) =>
      (...args: A) => {
        const now = Date.now();
        if (now < lockedUntil.current) return;
        lockedUntil.current = now + RELOCK_MS;
        action(...args);
      },
    [],
  );
}
