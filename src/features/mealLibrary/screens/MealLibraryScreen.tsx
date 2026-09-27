import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, EmptyState, Icon, IconButton, Screen, Text } from '@ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { DishCard } from '../components/DishCard';
import { IngredientRail } from '../components/IngredientRail';
import { MealTabs } from '../components/MealTabs';
import {
  DEMO_DEFAULT_INGREDIENT_ID,
  DEMO_DEFAULT_MEAL_ID,
  DEMO_DISHES_BY_INGREDIENT,
  DEMO_INGREDIENTS,
  DEMO_MEAL_SLOTS,
} from '../data';
import type { DishDiet, LibraryDish } from '../types';

/**
 * Meal Library — Figma `cCQlzTeiObQkpVBzwI8mZi` frame `1:519`.
 *
 * A sticky header (back, title, search, Book Now) over a horizontal strip of meals; below it a
 * vertical rail of ingredients beside a two-column grid of that ingredient's dishes. The rail and the grid scroll independently, as in quick-commerce category pages.
 *
 * STATIC ONLY, per task: renders fixture data (`data.ts`), is linked from nowhere in the app, and
 * every outward action — back, Book Now, add dish — is an unwired callback. The frame's status
 * bar, notch and home indicator are device mockup and are not reproduced, and its bottom nav
 * (`1:770`) is deliberately left out: the app has no tab shell, and it belongs to one.
 *
 * NOT IN THE FRAME, built per the brief:
 *  - the search bar the search icon opens. It takes the title's place in the header row and
 *    filters every ingredient's dishes by name; its back arrow closes it.
 *  - the Veg / Non-Veg SELECTED state. `1:649` draws both options idle; a selected option takes
 *    the meal strip's selected pill (`#FFD600`, `#1C1917`). Tapping it again clears the filter.
 */
export interface MealLibraryScreenProps {
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

const ALL_DISHES: readonly LibraryDish[] = Object.values(DEMO_DISHES_BY_INGREDIENT).flat();

/** Pairs the dishes into grid rows; a lone last dish keeps half the width, as a grid cell would. */
function toRows(dishes: readonly LibraryDish[]): (readonly [LibraryDish, LibraryDish | null])[] {
  const rows: (readonly [LibraryDish, LibraryDish | null])[] = [];
  for (let i = 0; i < dishes.length; i += 2) {
    rows.push([dishes[i] as LibraryDish, dishes[i + 1] ?? null]);
  }
  return rows;
}

export function MealLibraryScreen({
  onBack,
  onBookNow,
  onAddDish,
  testID = 'meal-library-screen',
}: MealLibraryScreenProps) {
  const [mealId, setMealId] = useState(DEMO_DEFAULT_MEAL_ID);
  const [ingredientId, setIngredientId] = useState(DEMO_DEFAULT_INGREDIENT_ID);
  const [diet, setDiet] = useState<DishDiet | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const { bottom: bottomInset } = useSafeAreaInsets();

  const ingredient = DEMO_INGREDIENTS.find((item) => item.id === ingredientId);
  const trimmed = query.trim().toLowerCase();
  const searchActive = searching && trimmed.length > 0;

  const dishes = useMemo(() => {
    const source = searchActive
      ? ALL_DISHES.filter((dish) => dish.name.toLowerCase().includes(trimmed))
      : (DEMO_DISHES_BY_INGREDIENT[ingredientId] ?? []);
    return diet === null ? source : source.filter((dish) => dish.diet === diet);
  }, [searchActive, trimmed, ingredientId, diet]);

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

      <MealTabs
        meals={DEMO_MEAL_SLOTS}
        selectedId={mealId}
        onSelect={setMealId}
        testID={`${testID}-meals`}
      />
    </View>
  );

  return (
    <Screen padded={false} header={header} testID={testID}>
      <View style={styles.body}>
        <IngredientRail
          ingredients={DEMO_INGREDIENTS}
          selectedId={ingredientId}
          bottomInset={bottomInset}
          onSelect={(id) => {
            closeSearch();
            setIngredientId(id);
          }}
          testID={`${testID}-ingredients`}
        />

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
              {searchActive ? `Results for “${query.trim()}”` : (ingredient?.title ?? '')}
            </Text>
            <View style={styles.dietToggle}>
              {DIETS.map((option) => {
                const selected = option.id === diet;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setDiet(selected ? null : option.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    testID={`${testID}-diet-${option.id}`}
                    style={[styles.dietOption, selected ? styles.dietOptionSelected : null]}
                  >
                    <Text variant="bodyBold" color={selected ? 'textWarmInk' : 'textWarmQuiet'}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {dishes.length === 0 ? (
            <EmptyState
              icon="search"
              title="No dishes here yet"
              description={
                searchActive ? 'Try another name.' : 'Pick another ingredient to see its dishes.'
              }
              testID={`${testID}-empty`}
            />
          ) : (
            <View style={styles.grid}>
              {toRows(dishes).map(([left, right]) => (
                <View key={left.id} style={styles.gridRow}>
                  <DishCard dish={left} onAdd={onAddDish} testID={`${testID}-dish-${left.id}`} />
                  {right === null ? (
                    <View style={styles.gridSpacer} />
                  ) : (
                    <DishCard
                      dish={right}
                      onAdd={onAddDish}
                      testID={`${testID}-dish-${right.id}`}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** `1:522` — cream at 95%, 12 / 8 inside. */
  header: {
    paddingHorizontal: lightTheme.space.md,
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
  /** `1:654` — the grid closes on 64 of padding. */
  mainContent: { padding: lightTheme.space.s10, paddingBottom: 64 },
  /** `1:644` / `1:645` — title and toggle pushed apart, 16 in all below them (8 + 8). */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    paddingBottom: lightTheme.space.lg,
  },
  sectionTitle: { flexShrink: 1 },
  /** `1:649` — white at 80%, 2 inside, options 4 apart, a 12pt radius and the 1pt ledge. */
  dietToggle: {
    flexDirection: 'row',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.xxs,
    borderRadius: lightTheme.radius.r12,
    backgroundColor: lightTheme.colors.surfaceToggleTrack,
    ...lightTheme.elevation.ledge,
  },
  /** `1:650` — 12 / 4 inside an 8pt radius. */
  dietOption: {
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.xs,
  },
  dietOptionSelected: { backgroundColor: lightTheme.colors.surfaceCta },
  /** `1:654` — two columns, 8 apart both ways. */
  grid: { gap: lightTheme.space.sm },
  gridRow: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.sm },
  gridSpacer: { flex: 1 },
});
