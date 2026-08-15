import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type { DataState } from '@core/data';
import { Icon, IconButton, QueryBoundary, Screen, Text, lightTheme } from '@ui';

import type { MealBriefDraft, MealBriefViewModel } from '../types';

/**
 * Meal Brief & Recipe Link — Figma `3:684`.
 *
 * Skippable by design. Dish selection is MULTI-select (black + ✓ when chosen); dietary preference
 * is single-select. Everything offered comes from the payload.
 *
 * Geometry, verbatim from the frame:
 *   screen  `3:686`  background `#F8FAFC` — a COOL off-white, not the app's warm cream
 *   header  `3:807`  sticky, white, 0.889pt `#E2E8F0` hairline, px 16 / py 12;
 *                    title Livvic Bold 16/24 black, "Skip" Livvic Bold 12/16 `#62748E`
 *   body    `3:687`  p 16, 20pt between blocks
 *   card    `3:688`  white, 1pt `rgba(226,232,240,0.8)`, radius 24, p 15.889, gap 15.99
 *   diet    `3:693`  selected: BLACK chip with `#FFD600` Livvic Bold 10/15 capitalised ink;
 *                    idle: `#F1F5F9` on `#E2E8F0` with `#45556C` ink
 *   guests  `3:711`  a `#F1F5F9` stepper at radius 12 holding two 28pt white 8pt-radius buttons
 *   dishes  `3:726`  selected: black chip, 14pt ✓, white Livvic SemiBold 12/16;
 *                    idle: white on `#E2E8F0` with a 14pt +
 *   recipe  `3:769`  `rgba(255,251,235,0.7)` on a `#FEE685` border at radius 24, with an
 *                    "Optional" rose pill and a `#FFD230`-bordered input
 *   notes   `3:792`  white, `#CAD5E2` border, radius **16**
 *   CTA     `3:795`  `#FFD600` at radius 16 with a yellow `#FEE685` glow and an inset black
 *                    Razorpay pill. It SCROLLS with the content — the frame does not pin it.
 *
 * The recipe field accepts an arbitrary user URL — captured as text, neither fetched nor rendered.
 * Validation and sanitisation belong at the boundary once a contract exists.
 *
 * KEYBOARD (task §10): the form is the app's longest text-entry surface. `KeyboardAvoidingView`
 * wraps the whole screen, the scroll view keeps taps alive while the keyboard is up, and every
 * field sits inside the scroll area, so the active field and the CTA can always be reached.
 */

export interface MealBriefActions {
  readonly onBack: () => void;
  readonly onSkip: () => void;
  readonly onSubmit: (draft: MealBriefDraft) => void;
}

export interface MealBriefViewProps extends MealBriefActions {
  readonly state: DataState<MealBriefViewModel>;
  readonly onRetry: () => void;
}

/** UI floor only — a booking cannot have zero guests. Real bounds arrive as data. */
const UI_GUEST_FLOOR = 1;

export function MealBriefView({ state, onRetry, ...actions }: MealBriefViewProps) {
  return (
    <QueryBoundary state={state} onRetry={onRetry}>
      {(brief) => <MealBriefForm brief={brief} {...actions} />}
    </QueryBoundary>
  );
}

function MealBriefForm({
  brief,
  onBack,
  onSkip,
  onSubmit,
}: MealBriefActions & { brief: MealBriefViewModel }) {
  const [dietaryId, setDietaryId] = useState<string | null>(null);
  const [guests, setGuests] = useState(brief.guestsInitial);
  const [dishIds, setDishIds] = useState<readonly string[]>(
    brief.dishOptions.filter((dish) => dish.preselected === true).map((dish) => dish.id),
  );
  const [customDish, setCustomDish] = useState('');
  const [customDishes, setCustomDishes] = useState<readonly string[]>([]);
  const [recipeUrl, setRecipeUrl] = useState('');
  const [notes, setNotes] = useState('');

  const minGuests = brief.guestsMin ?? UI_GUEST_FLOOR;
  const maxGuests = brief.guestsMax;

  const toggleDish = (id: string) =>
    setDishIds((current) =>
      current.includes(id) ? current.filter((dish) => dish !== id) : [...current, id],
    );

  const addCustomDish = () => {
    const trimmed = customDish.trim();
    if (trimmed.length === 0) return;
    setCustomDishes((current) => [...current, trimmed]);
    setCustomDish('');
  };

  const submit = () => onSubmit({ dietaryId, guests, dishIds, customDishes, recipeUrl, notes });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen
        scroll
        tone="form"
        testID="meal-brief-screen"
        header={
          <View style={styles.header}>
            <View style={styles.headerLead}>
              <IconButton name="back" label="Back" onPress={onBack} />
              <Text
                variant="headingCta"
                color="textPrimary"
                accessibilityRole="header"
                numberOfLines={1}
                style={styles.flexShrink}
              >
                {brief.title}
              </Text>
            </View>
            <Pressable
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel={brief.skipLabel}
              hitSlop={12}
              style={styles.skip}
              testID="meal-brief-skip"
            >
              <Text variant="bodyBold" color="textQuiet">
                {brief.skipLabel}
              </Text>
            </Pressable>
          </View>
        }
      >
        {/* `3:688` — preference card. */}
        <View style={styles.card} testID="meal-brief-preferences">
          <View style={styles.cardRow}>
            {/* `3:691` sets this label on two lines; it must never break mid-word to make room. */}
            <Text variant="bodyBold" color="textField" style={styles.dietLabel}>
              {brief.dietaryTitle}
            </Text>
            <View style={styles.dietRow}>
              {brief.dietaryOptions.map((option) => {
                const selected = dietaryId === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setDietaryId(option.id)}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected }}
                    hitSlop={6}
                    style={[styles.dietChip, selected ? styles.dietChipOn : styles.dietChipOff]}
                    testID={`meal-brief-diet-${option.id}`}
                  >
                    <Text
                      variant="captionBold"
                      color={selected ? 'surfaceCta' : 'textFieldLabel'}
                      align="center"
                      style={styles.capitalize}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.guestsRow}>
            <View style={styles.guestsLead}>
              <Icon name="users" size={16} color="textField" />
              <Text
                variant="bodyBold"
                color="textField"
                numberOfLines={1}
                style={styles.flexShrink}
              >
                {brief.guestsTitle}
              </Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setGuests((value) => Math.max(minGuests, value - 1))}
                disabled={guests <= minGuests}
                accessibilityRole="button"
                accessibilityLabel="Fewer guests"
                style={styles.stepperButton}
                testID="meal-brief-guests-minus"
              >
                <Text variant="title" color="textField">
                  −
                </Text>
              </Pressable>
              <Text
                variant="bodyBold"
                color="textPrimary"
                align="center"
                style={styles.stepperValue}
                testID="meal-brief-guests-value"
              >
                {String(guests)}
              </Text>
              <Pressable
                onPress={() =>
                  setGuests((value) =>
                    maxGuests === undefined ? value + 1 : Math.min(maxGuests, value + 1),
                  )
                }
                disabled={maxGuests !== undefined && guests >= maxGuests}
                accessibilityRole="button"
                accessibilityLabel="More guests"
                style={styles.stepperButton}
                testID="meal-brief-guests-plus"
              >
                <Text variant="title" color="textField">
                  +
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* `3:718` — dish selection. */}
        <View style={styles.block}>
          <View style={styles.fieldLabelRow}>
            <Icon name="utensils" size={16} color="textSecondaryStrong" />
            <Text variant="bodyStrong" color="textSecondaryStrong" style={styles.flexShrink}>
              {brief.dishesTitle}
            </Text>
          </View>

          <View style={styles.dishes} testID="meal-brief-dishes">
            {brief.dishOptions.map((dish) => {
              const selected = dishIds.includes(dish.id);
              return (
                <Pressable
                  key={dish.id}
                  onPress={() => toggleDish(dish.id)}
                  accessibilityRole="button"
                  accessibilityLabel={dish.label}
                  accessibilityState={{ selected }}
                  hitSlop={6}
                  style={[styles.dishChip, selected ? styles.dishChipOn : styles.dishChipOff]}
                  testID={`meal-brief-dish-${dish.id}`}
                >
                  <Icon
                    name={selected ? 'check' : 'plus'}
                    size={14}
                    color={selected ? 'textInverse' : 'textSecondaryStrong'}
                  />
                  <Text
                    variant="bodyStrong"
                    color={selected ? 'textInverse' : 'textSecondaryStrong'}
                  >
                    {dish.label}
                  </Text>
                </Pressable>
              );
            })}

            {customDishes.map((dish) => (
              <View
                key={dish}
                style={[styles.dishChip, styles.dishChipOn]}
                testID={`meal-brief-custom-${dish}`}
              >
                <Icon name="check" size={14} color="textInverse" />
                <Text variant="bodyStrong" color="textInverse">
                  {dish}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.customRow}>
            <TextInput
              value={customDish}
              onChangeText={setCustomDish}
              onSubmitEditing={addCustomDish}
              placeholder={brief.customDishPlaceholder}
              placeholderTextColor={lightTheme.colors.textPlaceholder}
              accessibilityLabel={brief.customDishPlaceholder}
              returnKeyType="done"
              style={[styles.input, styles.flexOne]}
              testID="meal-brief-custom-dish"
            />
            <Pressable
              onPress={addCustomDish}
              accessibilityRole="button"
              accessibilityLabel={brief.customDishAddLabel}
              style={styles.addButton}
              testID="meal-brief-add-dish"
            >
              <Text variant="bodyBold" color="textInverse">
                {brief.customDishAddLabel}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* `3:769` — recipe link. */}
        <View style={styles.recipeCard} testID="meal-brief-recipe">
          <View style={styles.cardRow}>
            <View style={styles.fieldLabelRow}>
              <Icon name="video" size={16} color="textStrong" />
              <Text variant="bodyBold" color="textStrong" style={styles.flexShrink}>
                {brief.recipeTitle}
              </Text>
            </View>
            <View style={styles.optionalBadge}>
              <Text variant="captionBold" color="textOptional">
                {brief.recipeOptionalLabel}
              </Text>
            </View>
          </View>

          <Text variant="bodySmall" color="textFieldLabel">
            {brief.recipeDescription}
          </Text>

          <View style={styles.recipeInputRow}>
            <Icon name="link" size={16} color="textField" />
            <TextInput
              value={recipeUrl}
              onChangeText={setRecipeUrl}
              placeholder={brief.recipePlaceholder}
              placeholderTextColor={lightTheme.colors.textPlaceholder}
              accessibilityLabel={brief.recipeTitle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[styles.recipeInput, styles.flexOne]}
              testID="meal-brief-recipe-url"
            />
          </View>
        </View>

        {/* `3:789` — custom notes. */}
        <View style={styles.notesBlock}>
          <Text variant="bodyStrong" color="textSecondaryStrong">
            {brief.notesTitle}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={brief.notesPlaceholder}
            placeholderTextColor={lightTheme.colors.textPlaceholder}
            accessibilityLabel={brief.notesTitle}
            multiline
            style={styles.notes}
            testID="meal-brief-notes"
          />
        </View>

        {/* `3:795` — the CTA scrolls with the form; the frame does not pin it. */}
        <Pressable
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel={brief.ctaLabel}
          style={styles.cta}
          testID="meal-brief-submit"
        >
          <Text variant="headingCta" color="textOnAccent" align="center" style={styles.flexShrink}>
            {brief.ctaLabel}
          </Text>
          {brief.ctaBadgeLabel === undefined ? null : (
            <View style={styles.ctaBadge}>
              <Text variant="bodyBlack" color="surfaceCta">
                {brief.ctaBadgeLabel}
              </Text>
              <Icon name="arrowRight" size={16} color="surfaceCta" />
            </View>
          )}
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** `3:688` — the frame's odd 15.889 / 11.889 / 5.889 values are real, not rounding noise. */
const CARD_PADDING = 15.889;
const FIELD_PADDING_H = 11.889;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexOne: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  capitalize: { textTransform: 'capitalize' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    backgroundColor: lightTheme.colors.surface,
    borderBottomWidth: lightTheme.stroke.hairline,
    borderBottomColor: lightTheme.colors.borderField,
  },
  headerLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    flexShrink: 1,
  },
  skip: { paddingHorizontal: lightTheme.space.sm, paddingVertical: lightTheme.space.xs },

  block: { gap: lightTheme.space.sm },
  card: {
    gap: 15.99,
    padding: CARD_PADDING,
    borderRadius: lightTheme.layout.cardRadius,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderFieldSoft,
    backgroundColor: lightTheme.colors.surface,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 1,
  },
  /**
   * `3:689` fits the label and all four chips on one row at the 390pt reference. Below that the
   * ROW wraps — the chip group drops under the label — rather than the label breaking mid-word
   * or the chips running off the edge.
   */
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
  },

  /** The label holds its measure; the chips wrap instead — `3:692` only fits four in a row at 390. */
  dietLabel: { flexShrink: 0 },
  dietRow: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: lightTheme.space.s6,
  },
  dietChip: {
    flexShrink: 1,
    paddingHorizontal: 9.889,
    paddingVertical: 3.889,
    borderRadius: lightTheme.layout.optionRadius,
    borderWidth: lightTheme.stroke.thin,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
  },
  dietChipOn: {
    backgroundColor: lightTheme.colors.surfaceInverse,
    borderColor: lightTheme.colors.surfaceInverse,
  },
  dietChipOff: {
    backgroundColor: lightTheme.colors.surfaceSubtle,
    borderColor: lightTheme.colors.borderField,
  },

  /** `3:702` — a 0.889pt rule above the guests row, then 12pt of padding. */
  guestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    paddingTop: lightTheme.space.md,
    borderTopWidth: lightTheme.stroke.hairline,
    borderTopColor: lightTheme.colors.borderHairline,
  },
  guestsLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    flexShrink: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: 3.889,
    borderRadius: lightTheme.layout.optionRadius,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surfaceSubtle,
  },
  stepperButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.xs,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderControl,
    backgroundColor: lightTheme.colors.surface,
  },
  stepperValue: { minWidth: lightTheme.space.lg },

  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: lightTheme.space.s6,
  },

  dishes: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  dishChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: FIELD_PADDING_H,
    paddingVertical: 5.889,
    borderRadius: lightTheme.layout.optionRadius,
    borderWidth: lightTheme.stroke.thin,
  },
  dishChipOn: {
    backgroundColor: lightTheme.colors.surfaceInverse,
    borderColor: lightTheme.colors.surfaceInverse,
  },
  dishChipOff: {
    backgroundColor: lightTheme.colors.surface,
    borderColor: lightTheme.colors.borderField,
  },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingTop: lightTheme.space.xs,
  },
  input: {
    minHeight: lightTheme.layout.minTouchTarget,
    paddingHorizontal: FIELD_PADDING_H,
    borderRadius: lightTheme.layout.optionRadius,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderControl,
    backgroundColor: lightTheme.colors.surface,
    color: lightTheme.colors.textField,
    fontFamily: lightTheme.typography.bodyStrong.fontFamily,
    fontSize: lightTheme.typography.bodyStrong.fontSize,
  },
  addButton: {
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    minHeight: lightTheme.layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.layout.optionRadius,
    backgroundColor: lightTheme.colors.textField,
  },

  recipeCard: {
    gap: 7.3,
    padding: CARD_PADDING,
    borderRadius: lightTheme.layout.cardRadius,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderNote,
    backgroundColor: lightTheme.colors.surfaceNote,
  },
  optionalBadge: {
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xxs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceOptional,
  },
  recipeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: FIELD_PADDING_H,
    borderRadius: lightTheme.layout.optionRadius,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderNoteStrong,
    backgroundColor: lightTheme.colors.surface,
  },
  recipeInput: {
    minHeight: lightTheme.layout.minTouchTarget,
    color: lightTheme.colors.textField,
    fontFamily: lightTheme.typography.bodyMedium.fontFamily,
    fontSize: lightTheme.typography.bodyMedium.fontSize,
  },

  notesBlock: { gap: lightTheme.space.s6 },
  /** `3:792` — a 16pt radius, unlike every other control on this screen. */
  notes: {
    minHeight: 96,
    padding: FIELD_PADDING_H,
    textAlignVertical: 'top',
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderControl,
    backgroundColor: lightTheme.colors.surface,
    color: lightTheme.colors.textField,
    fontFamily: lightTheme.typography.bodyMedium.fontFamily,
    fontSize: lightTheme.typography.bodyMedium.fontSize,
  },

  /** `3:795` — a `#FFD600` bar at radius 16 lifted by a YELLOW glow, not a grey shadow. */
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.xl,
    paddingVertical: 14,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceCta,
    shadowColor: lightTheme.colors.borderNote,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.layout.optionRadius,
    backgroundColor: lightTheme.colors.surfaceInverse,
  },
});
