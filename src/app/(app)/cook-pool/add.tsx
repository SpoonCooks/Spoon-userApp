import { Stack } from 'expo-router';

import { useSafeBack } from '@core/navigation';
import { CookPoolDeckScreen } from '@features/cookPool';

/**
 * Create your Cook Pool — the selection deck. "Continue" and back both return to the landing,
 * which shows the pool as the deck left it: every swipe is saved as it happens.
 *
 * Swipe-back is off: a card dragged from near the left edge would otherwise start the stack's
 * back gesture instead of the swipe.
 */
export default function CookPoolDeckRoute() {
  const goBack = useSafeBack('/cook-pool');

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <CookPoolDeckScreen onDone={goBack} />
    </>
  );
}
