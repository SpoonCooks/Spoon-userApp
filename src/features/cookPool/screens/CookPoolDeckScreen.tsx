import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, ErrorState, LoadingState, ScreenHeader, useBottomGutter } from '@ui';
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
 * Opened from the landing's "Add". One card per candidate — a cook who has served the household
 * and is not in its pool — in the backend's order. A right swipe (or Add) puts the cook in the
 * pool there and then (`POST /v1/me/cooks`) and takes them out of the deck; a left swipe (or
 * Skip) stores nothing and sends the cook to the back: the cards loop, and after the last the
 * first comes round again, with no reload. Undo skip brings back the last one skipped.
 *
 * The deck is the cooks as they were when it opened. "Continue" — or back — returns to the
 * landing, which shows the pool as it now is.
 *
 * A household with no candidates — no completed booking yet, or every cook it has had already
 * pooled — gets an empty state. NO FRAME DESIGNS IT: the copy says what the backend's rule is
 * (only cooks who have cooked for you can be added) and, where the route can, offers a one-time
 * booking. Replace it when design lands.
 *
 * `755:2333` also draws a "Pick your days" header with a back button above the nav bar; the
 * later `848:*` frames drop it, and so does this screen.
 */
export interface CookPoolDeckScreenProps {
  readonly onDone: () => void;
  /** The empty state's way to meet a cook. Omit for no button (the dev preview). */
  readonly onBookVisit?: (() => void) | undefined;
  readonly testID?: string;
}

export function CookPoolDeckScreen({
  onDone,
  onBookVisit,
  testID = 'cook-pool-deck',
}: CookPoolDeckScreenProps) {
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
      ) : state.data.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            title="No cooks to add yet"
            description="Only cooks who have cooked for you can join your Cook Pool. Book a one-time visit to meet one."
            {...(onBookVisit === undefined
              ? {}
              : { actionLabel: 'Book a one-time visit', onAction: onBookVisit })}
            testID={`${testID}-empty`}
          />
        </View>
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

  // Only cooks the latest candidates still offer are dealt: one added (or paused by Operations)
  // since the deck opened drops out as the read refreshes.
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
  empty: { flex: 1, justifyContent: 'center' },
  footer: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.md,
    backgroundColor: lightTheme.colors.surface,
  },
});
