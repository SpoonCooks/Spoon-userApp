import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorState, LoadingState, ScreenHeader, useBottomGutter } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { SwipeDeck } from '../components/SwipeDeck';
import type { SwipeDirection } from '../components/SwipeDeck';
import { useCookPoolActions, useCookPoolDeck } from '../data';
import { addCook, skipCook, startDeck, undoSkip } from '../deck';
import type { CookProfile } from '../types';

/**
 * Create your Cook Pool — the selection deck. Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User):
 * `755:2333`, `848:6318`, `848:6611`.
 *
 * Opened from the landing's "Add". One card per cook who has served the household — in the pool
 * or not — in the backend's order. A right swipe (or Add) puts the cook in the pool there and
 * then; a left swipe (or Skip) does nothing to the cook. Either way the cook goes to the back:
 * the cards loop, and after the last the first comes round again, with no reload. Undo skip
 * brings back the last one skipped.
 *
 * The deck is the cooks as they were when it opened. "Continue" — or back — returns to the
 * landing, which shows the pool as it now is.
 *
 * `755:2333` also draws a "Pick your days" header with a back button above the nav bar; the
 * later `848:*` frames drop it, and so does this screen.
 */
export interface CookPoolDeckScreenProps {
  readonly onDone: () => void;
  readonly testID?: string;
}

export function CookPoolDeckScreen({ onDone, testID = 'cook-pool-deck' }: CookPoolDeckScreenProps) {
  const { state, refetch } = useCookPoolDeck();
  const footerGutter = useBottomGutter(lightTheme.space.md);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      {/* `848:7705` — a 48pt bar, px 16, the title alone, over the deck's glow (`755:2339`). */}
      <View style={styles.nav}>
        <ScreenHeader
          density="nav"
          title="Create your Cook Pool"
          transparent
          testID={`${testID}-header`}
        />
      </View>
      {state.status === 'loading' ? (
        <LoadingState variant="screen" />
      ) : state.status === 'error' ? (
        <ErrorState error={state.error} onRetry={refetch} />
      ) : (
        <Deck cooks={state.data} testID={testID} />
      )}
      {/* `755:2490` — a 72pt footer, px 16 / py 12, around the Continue pill. */}
      <View style={[styles.footer, { paddingBottom: footerGutter }]}>
        <Button
          label="Continue"
          onPress={onDone}
          size="pillLg"
          flat
          labelColor="textPrimary"
          testID={`${testID}-continue`}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Holds the cards as they were on arrival, in a loop (`deck.ts`); mounted once the deck has
 * loaded.
 */
function Deck({
  cooks,
  testID,
}: {
  readonly cooks: readonly CookProfile[];
  readonly testID: string;
}) {
  const actions = useCookPoolActions();
  const profiles = useMemo(() => new Map(cooks.map((cook) => [cook.cookId, cook])), [cooks]);
  const [deck, setDeck] = useState(() => startDeck(cooks.map((cook) => cook.cookId)));

  // A cook in the pool is never dealt, even before the loop has caught up with the add.
  const cards = useMemo(
    () => deck.ring.flatMap((cookId) => profiles.get(cookId) ?? []),
    [deck.ring, profiles],
  );
  const topId = cards[0]?.cookId;

  const onSwiped = useCallback(
    (cookId: string, direction: SwipeDirection) => {
      // A card already undone or decided (a fly-off finishing late) changes nothing.
      if (cookId !== topId) return;
      setDeck((current) =>
        direction === 'add' ? addCook(current, cookId) : skipCook(current, cookId),
      );
      if (direction === 'add') actions.addCook(cookId);
    },
    [actions, topId],
  );

  const onUndo = useCallback(() => setDeck(undoSkip), []);

  return (
    <SwipeDeck
      cards={cards}
      turn={deck.turn}
      enteringId={deck.enteringId}
      canUndo={deck.skipped.length > 0}
      onSwiped={onSwiped}
      onUndo={onUndo}
      testID={`${testID}-swipes`}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  nav: { height: 48, justifyContent: 'center', zIndex: 1 },
  footer: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.md,
    backgroundColor: lightTheme.colors.surface,
  },
});
