import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QueryBoundary, ScreenHeader } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { BAND_CURVE_PAGE, TRASH_ICON } from '../art';
import { CookMenu } from '../components/CookMenu';
import { CookProfileHeader } from '../components/CookProfileHeader';
import { RemoveCookDialog } from '../components/RemoveCookDialog';
import { YellowBand } from '../components/YellowBand';
import { useCookPoolActions, useCookProfile, useFavouriteDishIds } from '../data';

/**
 * Cook Profile — Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User): `719:1568`, and the remove
 * dialog `848:7494`.
 *
 * Opened from a cook's photo on the pool landing, from Home, and from the assigned cook in a
 * booking. The cook's header, then their menu: sections scroll down the page, each section's
 * dishes sideways, from 16 in on the left to the screen's edge on the right. A dish's heart
 * favourites it. For a cook in the pool, the bin asks before taking them out; "Remove" applies it
 * and leaves (`onRemoved`), "Keep" stays.
 */
export interface CookProfileScreenProps {
  readonly cookId: string;
  readonly onBack: () => void;
  /** After the cook is taken out of the pool — back to the landing, which shows the change. */
  readonly onRemoved: () => void;
  readonly testID?: string;
}

export function CookProfileScreen({
  cookId,
  onBack,
  onRemoved,
  testID = 'cook-profile-screen',
}: CookProfileScreenProps) {
  const { state, refetch } = useCookProfile(cookId);
  const favourites = useFavouriteDishIds();
  const actions = useCookPoolActions();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [bandTop, setBandTop] = useState(DEFAULT_BAND_TOP);
  const inPool = state.status === 'ready' && state.data.inPool;

  // `719:1569` — the band starts at the header's foot (244 on a 54 + 60 + 130 frame).
  const onHeaderLayout = (event: LayoutChangeEvent) => setBandTop(event.nativeEvent.layout.height);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      {/* `848:7478` — Nav header 3: back, "Cook Profile", the bin in a 44pt target. */}
      <ScreenHeader
        density="nav"
        title="Cook Profile"
        onBack={onBack}
        trailing={
          inPool ? (
            <Pressable
              onPress={() => setConfirmingRemove(true)}
              accessibilityRole="button"
              accessibilityLabel="Remove from your Cook Pool"
              style={styles.trash}
              testID={`${testID}-remove`}
            >
              <Image source={TRASH_ICON} style={styles.trashIcon} />
            </Pressable>
          ) : null
        }
        testID={`${testID}-header`}
      />
      <QueryBoundary state={state} onRetry={refetch}>
        {(profile) => (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <YellowBand curve={BAND_CURVE_PAGE} top={bandTop} />
              <CookProfileHeader profile={profile} onLayout={onHeaderLayout} />
              <CookMenu
                sections={profile.menu}
                tone="page"
                favourites={favourites}
                onToggleFavourite={actions.toggleFavouriteDish}
                testID={`${testID}-menu`}
              />
            </ScrollView>
            <RemoveCookDialog
              visible={confirmingRemove}
              cookName={profile.name}
              onKeep={() => setConfirmingRemove(false)}
              onRemove={() => {
                setConfirmingRemove(false);
                actions.removeCook(profile.cookId);
                onRemoved();
              }}
              testID={`${testID}-dialog`}
            />
          </>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

/** A 130pt header — what one name, one caption and two stats measure. */
const DEFAULT_BAND_TOP = 130;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  scroll: { flex: 1 },
  /** The band reaches the bottom of the screen even under a short menu. */
  content: { flexGrow: 1 },
  /** `848:7478` — the bin's 44pt hit area sits 6 from the frame's right edge, past the gutter. */
  trash: {
    marginLeft: 'auto',
    marginRight: -10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashIcon: { width: 24, height: 24 },
});
