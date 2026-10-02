import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  CategoryRail,
  DishTileGrid,
  EmptyState,
  Icon,
  IconButton,
  PillTabs,
  Screen,
  SegmentedToggle,
  Text,
} from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { defaultDietFor } from '../diet';
import type { DishDiet, LibraryDish, LibraryIngredient, MealSlot } from '../types';

/**
 * Meal Library — Figma `cCQlzTeiObQkpVBzwI8mZi` frame `1:519`.
 *
 * A sticky header (back, title, search, Book Now) over a horizontal strip of meals; below it a
 * vertical rail of ingredients beside a two-column grid of that ingredient's dishes. The rail and
 * the grid scroll independently, as in quick-commerce category pages.
 *
 * DATA-DRIVEN. The screen owns no catalogue: it draws exactly the `meals`, `ingredients` and
 * `dishes` it is handed, so their counts are whatever the backend returns. The selection is
 * CONTROLLED — the caller holds the selected meal and ingredient and supplies the dishes for
 * them — because changing either is a new fetch, and the fetch belongs to the caller. The same
 * goes for search: the screen reports the query, and draws `searchResults`.
 *
 * What the screen does own is presentation state: whether search is open, its text, and the
 * Veg / Non-Veg filter, which is applied here to whichever list is showing.
 *
 * STATIC ONLY, per task: linked from nowhere in the app, and back, Book Now and add-dish are
 * unwired callbacks. The frame's status bar, notch and home indicator are device mockup, and its
 * bottom nav (`1:770`) is deliberately left out: the app has no tab shell, and it belongs to one.
 *
 * NOT IN THE FRAME, built per the brief:
 *  - the search bar the search icon opens. It takes the title's place in the header row; its
 *    back arrow closes it.
 *  - the Veg / Non-Veg SELECTED state — see `SegmentedToggle`. Tapping it again clears it.
 *
 * The filter OPENS on the customer's profile answer (`dietaryPreference`, see `defaultDietFor`):
 * Veg for vegan and vegetarian, Non-Veg for everyone else. It follows that answer until the
 * customer touches the toggle, so a profile that loads after the first render still lands.
 */
export interface MealLibraryScreenProps {
  readonly meals: readonly MealSlot[];
  readonly selectedMealId: string | null;
  readonly onSelectMeal: (id: string) => void;
  readonly ingredients: readonly LibraryIngredient[];
  readonly selectedIngredientId: string | null;
  readonly onSelectIngredient: (id: string) => void;
  /** The dishes for the selected meal and ingredient. */
  readonly dishes: readonly LibraryDish[];
  /** Called with the trimmed query as it changes, and with `''` when search closes. */
  readonly onSearchChange?: (query: string) => void;
  /** The dishes matching the current query; drawn in place of `dishes` while one is typed. */
  readonly searchResults?: readonly LibraryDish[];
  /** The profile's `dietaryPreference` from `GET /v1/me`; picks the Veg / Non-Veg default. */
  readonly dietaryPreference?: string | null | undefined;
  readonly onBack?: () => void;
  /** Book Now — the booking flow or Home; the caller decides. */
  readonly onBookNow?: () => void;
  readonly onAddDish?: (dish: LibraryDish) => void;
  readonly testID?: string;
}

const DIETS: readonly { id: DishDiet; label: string }[] = [
  { id: 'veg', label: 'Veg' },
  { id: 'nonVeg', label: 'Non-Veg' },
];

const NO_RESULTS: readonly LibraryDish[] = [];

export function MealLibraryScreen({
  meals,
  selectedMealId,
  onSelectMeal,
  ingredients,
  selectedIngredientId,
  onSelectIngredient,
  dishes,
  onSearchChange,
  searchResults = NO_RESULTS,
  dietaryPreference,
  onBack,
  onBookNow,
  onAddDish,
  testID = 'meal-library-screen',
}: MealLibraryScreenProps) {
  /** `undefined` until the customer touches the toggle; `null` is their "show both". */
  const [dietChoice, setDiet] = useState<DishDiet | null | undefined>(undefined);
  const diet = dietChoice === undefined ? defaultDietFor(dietaryPreference) : dietChoice;
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const { bottom: bottomInset } = useSafeAreaInsets();

  const trimmed = query.trim();
  const searchActive = searching && trimmed.length > 0;

  useEffect(() => {
    onSearchChange?.(trimmed);
    // Report the QUERY, not every re-render of a caller that passes a fresh callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  const ingredient = ingredients.find((item) => item.id === selectedIngredientId);
  const source = searchActive ? searchResults : dishes;
  const shown = diet === null ? source : source.filter((dish) => dish.diet === diet);
  const title = searchActive
    ? `Results for “${trimmed}”`
    : (ingredient?.title ?? ingredient?.label);

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {searching ? (
          <View style={styles.searchRow}>
            <IconButton
              name="backArrow"
              label="Close search"
              onPress={closeSearch}
              color="textWarmInk"
              testID={`${testID}-search-close`}
            />
            <View style={styles.searchField}>
              <Icon name="search" size={16} color="textWarmQuiet" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search dishes"
                placeholderTextColor={lightTheme.colors.textWarmQuiet}
                autoFocus
                autoCorrect={false}
                returnKeyType="search"
                style={styles.searchInput}
                accessibilityLabel="Search dishes"
                testID={`${testID}-search-input`}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.headerGroup}>
              <IconButton
                name="backArrow"
                label="Back"
                onPress={() => onBack?.()}
                color="textWarmInk"
                testID={`${testID}-back`}
              />
              <Text
                variant="headingLibrary"
                color="textWarmInk"
                accessibilityRole="header"
                numberOfLines={1}
              >
                Meal Library
              </Text>
            </View>
            <IconButton
              name="search"
              label="Search dishes"
              onPress={() => setSearching(true)}
              color="textWarmInk"
              testID={`${testID}-search`}
            />
          </>
        )}
        <Button
          label="Book Now"
          onPress={() => onBookNow?.()}
          variant="bright"
          size="md"
          fullWidth={false}
          labelVariant="bodyBlack"
          style={styles.bookNow}
          testID={`${testID}-book-now`}
        />
      </View>

      <PillTabs
        items={meals}
        selectedId={selectedMealId}
        onSelect={onSelectMeal}
        bleed={HEADER_GUTTER}
        testID={`${testID}-meals`}
      />
    </View>
  );

  return (
    <Screen padded={false} header={header} testID={testID}>
      <View style={styles.body}>
        {ingredients.length === 0 ? null : (
          <CategoryRail
            items={ingredients}
            selectedId={selectedIngredientId}
            bottomInset={bottomInset}
            onSelect={(id) => {
              closeSearch();
              onSelectIngredient(id);
            }}
            testID={`${testID}-ingredients`}
          />
        )}

        <ScrollView
          style={styles.main}
          contentContainerStyle={[styles.mainContent, { paddingBottom: 64 + bottomInset }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          testID={`${testID}-dishes`}
        >
          <View style={styles.sectionHeader}>
            <Text
              variant="heading"
              color="textWarmInk"
              accessibilityRole="header"
              numberOfLines={1}
              style={styles.sectionTitle}
            >
              {title ?? ''}
            </Text>
            <SegmentedToggle
              options={DIETS}
              selectedId={diet}
              onSelect={(id) => setDiet(id as DishDiet | null)}
              allowDeselect
              accessibilityLabel="Diet"
              testID={`${testID}-diet`}
            />
          </View>

          {shown.length === 0 ? (
            <EmptyState
              icon="search"
              title="No dishes here yet"
              description={
                searchActive ? 'Try another name.' : 'Pick another ingredient to see its dishes.'
              }
              testID={`${testID}-empty`}
            />
          ) : (
            <DishTileGrid
              dishes={shown}
              // Always drawn, as the frame draws it, even before a caller handles the press.
              onAdd={(dish) => onAddDish?.(dish)}
              testID={`${testID}-dish`}
            />
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

/** `1:522` — the header's 12pt gutter, which the meal strip bleeds through. */
const HEADER_GUTTER = lightTheme.space.md;

const styles = StyleSheet.create({
  /** `1:522` — cream at 95%, 12 / 8 inside. */
  header: {
    paddingHorizontal: HEADER_GUTTER,
    paddingVertical: lightTheme.space.sm,
    backgroundColor: lightTheme.colors.surfaceHeaderGlass,
  },
  /** `1:523` — the two groups pushed apart; each group's items 8 apart. */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
  },
  headerGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
  },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
  /** Not drawn: a white 32pt field at the header's 12pt radius, with the cards' 1pt ledge. */
  searchField: {
    flex: 1,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.s10,
    borderRadius: lightTheme.radius.r12,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.ledge,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: lightTheme.colors.textWarmInk,
    ...lightTheme.typography.bodyMedium,
  },
  /** `1:537` — `#CFFF04`, 12 / 6 inside a 12pt radius, `0 1 0 rgba(0,0,0,0.05)`. */
  bookNow: {
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.r12,
    ...lightTheme.elevation.ledge,
  },
  body: { flex: 1, flexDirection: 'row' },
  /** `1:643` — the cream ground, 10 inside. */
  main: { flex: 1, backgroundColor: lightTheme.colors.background },
  /** `1:654` — the grid closes on 64 of padding (plus the bottom inset, applied inline). */
  mainContent: { padding: lightTheme.space.s10 },
  /** `1:644` / `1:645` — title and toggle pushed apart, 16 in all below them (8 + 8). */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    paddingBottom: lightTheme.space.lg,
  },
  sectionTitle: { flexShrink: 1 },
});
