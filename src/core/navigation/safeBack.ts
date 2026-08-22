import { useCallback, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';

/**
 * Back that is always handled.
 *
 * ## The defect this closes
 *
 * Every screen used to call `router.back()` directly. That is correct only while there is
 * something to pop, and several screens are reachable with an EMPTY history:
 *
 *   - `53:31` is the first-run destination, entered by a `<Redirect>` from Home, which is itself
 *     entered by a `<Redirect>` from `/`. Both replace, so the map is the only entry in the stack
 *     and its header chevron produced React Navigation's "The action 'GO_BACK' was not handled by
 *     any navigator" — a dead end on the one screen onboarding cannot skip.
 *   - `/booking/:id` opened from a push notification (`routeForNotification`) has the same shape:
 *     the app was launched INTO it, so there is nothing behind it.
 *   - any `spoon://` deep link into a child route.
 *
 * A no-op back button is worse than no back button: the customer presses it, nothing moves, and
 * the app reads as broken. So back is defined as "pop if there is a history, otherwise go to the
 * screen this one belongs under" — a deterministic fallback per route, never a guess.
 *
 * ## Why `replace` and not `push` for the fallback
 *
 * The fallback is what the popped-to screen WOULD have been. Pushing it would leave the screen the
 * customer is leaving underneath it, so pressing back again would return to the screen they just
 * backed out of — a two-screen loop. Replacing ends the current entry, which is what a pop does.
 *
 * ## Scope
 *
 * This handles the DRAWN back control. Android's hardware back is handled by React Navigation
 * itself, which pops when it can and lets the OS finish the activity when it cannot — the correct
 * platform behaviour at a root screen, and the reason `useSafeBack` never registers a
 * `BackHandler` of its own. `useAndroidBackHandler` below exists for the narrower case of a screen
 * with dismissible local state (an open suggestion list, an inline overlay) that must be closed
 * BEFORE the stack is touched.
 */

/**
 * Returns a handler for a screen's back control.
 *
 * `fallback` is the route this screen sits under — where a pop would have landed had the screen
 * been reached by a push. Pass the parent, never the child.
 */
export function useSafeBack(fallback: Href): () => void {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallback);
  }, [router, fallback]);
}

/**
 * Back that always lands on ONE named screen, whatever the customer walked through to get here.
 *
 * ## Why this exists alongside `useSafeBack`
 *
 * `useSafeBack` pops. Popping is right when the stack behind a screen is a truthful record of
 * where the customer came from. On the service lifecycle it is not: a booking moves through
 * confirm -> arriving -> reassigned -> arrived -> in-service, and the customer can arrive at any
 * of those from Home, from a push notification, from history, or by the SERVER advancing the
 * state under a screen they were already on. Popping there re-exposes a lifecycle state the
 * booking has already left — an "Arriving" screen for a cook who has arrived — which is a lie
 * about a live booking rather than a navigation nicety.
 *
 * The founder's V7 comments settle every one of those on the same destination: "all these back
 * buttons take the user to the home page". This is that, expressed as one deterministic move
 * rather than as a guess about history.
 *
 * ## What it does
 *
 * `dismissAll()` drops everything pushed on top of the stack's first entry, and `replace` then
 * makes the target that first entry. The stack ends up holding exactly one screen, so a second
 * back press behaves like a root screen (Android finishes the activity) instead of walking back
 * into the flow the customer just left.
 *
 * Use it where the DESTINATION is the product decision. Where "the screen underneath" is the
 * product decision, `useSafeBack` is still the right call.
 */
export function useDeterministicBack(target: Href): () => void {
  const router = useRouter();

  return useCallback(() => {
    // Guarded: a route entered by a deep link is an only child, and dismissing one throws.
    if (router.canDismiss()) router.dismissAll();
    router.replace(target);
  }, [router, target]);
}

/**
 * Runs `handler` on Android's hardware back while the screen is focused, and lets the event fall
 * through to the navigator when it returns `false`.
 *
 * Used only where the screen owns dismissible state that is NOT a native modal — React Native's
 * `Modal` already routes hardware back to `onRequestClose`, which is how every bottom sheet in the
 * app closes itself, so sheets must not be handled here as well.
 *
 * The handler is kept in a ref so a changing closure never re-subscribes: an unsubscribe/subscribe
 * pair on every render would put this listener BEHIND React Navigation's in the queue, and back
 * would pop the screen instead of closing what is open on it.
 */
export function useAndroidBackHandler(handler: () => boolean): void {
  const latest = useRef(handler);

  useEffect(() => {
    latest.current = handler;
  }, [handler]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () =>
        latest.current(),
      );
      return () => subscription.remove();
    }, []),
  );
}
