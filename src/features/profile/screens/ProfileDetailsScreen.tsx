import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Icon,
  ScreenHeader,
  Text,
  lightTheme,
  useBottomGutter,
  useKeyboardAwareScroll,
  useKeyboardHeight,
} from '@ui';

import { PreferenceGrid, RemovableChip } from '../components/PreferenceChips';
import {
  PROFILE_COOK_PREFERENCE_LABEL,
  PROFILE_DETAILS_CTA,
  PROFILE_DETAILS_INTRO,
  PROFILE_DETAILS_TITLE,
  profileChoiceField,
  profilePromptField,
} from '../fields';
import type { ProfileChoiceField } from '../fields';
import {
  EMPTY_PROFILE_DETAILS,
  addGrownUpEating,
  canSubmitProfileDetails,
  grownUpEatingSuggestions,
  matchGrownUpEating,
  removeGrownUpEating,
  toggleSingle,
} from '../validation';
import type { ProfileDetailsValues } from '../validation';

/**
 * `338:4508` "Page 17- profile" — the V8 profile-details form.
 *
 * Read off the frame:
 *   column    `338:4509` — a 370pt column with 16pt gutters; header, body and CTA are all 338 wide
 *                          and separated by 16 (header ends y 54, body starts y 70; body ends
 *                          y 882.33, CTA starts y 898.33).
 *   header    `338:4510` — the shared `63:783` component verbatim: a 38pt white bar, px 4, a 12pt
 *                          gap, the 32pt back disc and a Livvic Black 20/28 title.
 *   body      `338:4511` — flex column, **gap 17**, pb 6. Each block pads px 4 / py 6.
 *   CTA       `338:4558` — `#FFD600`, a 30pt radius, px 12 / py 6, Livvic Black 16/24 at −0.4.
 *                          Exactly `Button variant="primary" size="form"`.
 *
 * ## The CTA is IN FLOW, not pinned
 *
 * The frame is 1025 tall against an 830pt device frame, and `338:4558` sits at y 898 as the last
 * sibling of the body — it is below the fold and scrolls with the content. It is NOT the address
 * form's pinned footer (`275:4485`), and pinning it here would cover the Gender chips on a short
 * handset (task §24: do not pin the CTA over inputs unless Figma does).
 *
 * ## Keyboard
 *
 * The scroll area shrinks by the IME's MEASURED height rather than wrapping in a
 * `KeyboardAvoidingView`. That is the fix `AddressDetailsView` already carries and for the same
 * reason: on Android 15's edge-to-edge window `adjustResize` no longer shrinks anything, and
 * `KeyboardAvoidingView`'s parent-relative frame came up short by the status-bar inset. Shrinking
 * the block lets the ScrollView scroll the focused field — and, because the CTA is inside that
 * same ScrollView, Confirm stays reachable with the keyboard up.
 *
 * Shrinking it is necessary but NOT sufficient, which the handset showed on `341:4672`: the
 * grown-up-food search is the sixth block down, so it is tapped from a scrolled position where
 * it is already visible, Android therefore scrolls nothing when it takes focus, and the IME then
 * opens straight over it. `useKeyboardAwareScroll` closes that remaining overlap by measurement.
 * See its own note for why the correction is driven off `onLayout` rather than `keyboardDidShow`.
 *
 * BOUNDARY: this screen collects and validates. It does not save, does not navigate and does not
 * decide where Confirm leads — see `app/(app)/profile/details.tsx`, which owns all three.
 */

export interface ProfileDetailsViewProps {
  /**
   * The saved profile, when there is one. `EDIT_EXISTING_PROFILE` opens PREFILLED from this;
   * `FIRST_TIME_ONBOARDING` opens from the blank form.
   */
  readonly initialValues?: ProfileDetailsValues;
  /**
   * OMIT to draw no back control.
   *
   * The page is NON-SKIPPABLE on first run (founder ruling), so the disc is absent there for the
   * same reason it is absent on a first-time `53:31`: a control that either does nothing or
   * escapes the one step onboarding cannot skip. `ScreenHeader` already models this.
   */
  readonly onBack?: (() => void) | undefined;
  readonly onSubmit: (values: ProfileDetailsValues) => void;
  readonly submitting?: boolean;
  /** A REJECTED save. The customer stays on this screen and the form keeps every answer. */
  readonly errorMessage?: string;
  readonly testID?: string;
}

export function ProfileDetailsView({
  initialValues,
  onBack,
  onSubmit,
  submitting = false,
  errorMessage,
  testID = 'profile-details-screen',
}: ProfileDetailsViewProps) {
  const [values, setValues] = useState<ProfileDetailsValues>(
    initialValues ?? EMPTY_PROFILE_DETAILS,
  );
  /** `341:4678` — the search box's own text, which is NOT one of the collected values. */
  const [entry, setEntry] = useState('');
  /**
   * Whether the cuisine list is showing. Also not a collected value — it is the disclosure state
   * of one control, and it closes as soon as a choice is made so the blocks below come back up.
   */
  const [entryOpen, setEntryOpen] = useState(false);
  const entrySuggestions = grownUpEatingSuggestions(entry, values.grownUpEating);

  const keyboardHeight = useKeyboardHeight();
  const bottomGutter = useBottomGutter(lightTheme.space.lg);
  const { scrollRef, viewportRef, onViewportLayout, onScroll, onInputFocus } =
    useKeyboardAwareScroll(keyboardHeight);

  /**
   * The ONE gate (task §6). The CTA is drawn from it and the handler asks it again, so a grey
   * Confirm can neither navigate nor fire a write.
   */
  const canSubmit = canSubmitProfileDetails({ values, submitting });

  const setSingle = (id: keyof ProfileDetailsValues, optionId: string) => {
    setValues((current) => ({
      ...current,
      [id]: toggleSingle(current[id] as string | null, optionId),
    }));
  };

  const choice = profileChoiceField;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      {/* `338:4509` — the 16pt-gutter column, with the header inside it exactly as the frame
          draws it (x 16 / y 16, not flush to the safe area). */}
      <View style={styles.column}>
        <ScreenHeader
          title={PROFILE_DETAILS_TITLE}
          {...(onBack === undefined ? {} : { onBack })}
          testID="profile-details-header"
        />

        <View
          ref={viewportRef}
          onLayout={onViewportLayout}
          style={[styles.flex, keyboardHeight === 0 ? null : { marginBottom: keyboardHeight }]}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.body, { paddingBottom: bottomGutter }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={onScroll}
            scrollEventThrottle={16}
            testID="profile-details-scroll"
          >
            {/* `456:3389` — Livvic Bold 14/20. */}
            <Text variant="title" color="textPrimary">
              {PROFILE_DETAILS_INTRO}
            </Text>

            {/* `456:3386` — Name*. The one field the backend can store today. */}
            <View style={styles.block}>
              <FieldInput
                value={values.name}
                onChangeText={(name) => setValues((current) => ({ ...current, name }))}
                onFocus={onInputFocus}
                placeholder={profilePromptField('name').placeholder}
                tone="gold"
                testID="profile-name"
              />
            </View>

            {/* `456:3401` — Household structure (optional, lime, 2-up). */}
            <ChoiceBlock field={choice('householdStructure')}>
              <PreferenceGrid
                options={choice('householdStructure').options}
                selectedId={values.householdStructure}
                tone={choice('householdStructure').tone}
                columns={choice('householdStructure').columns}
                onSelect={(id) => setSingle('householdStructure', id)}
                accessibilityLabel={choice('householdStructure').label}
                testID="profile-household"
              />
            </ChoiceBlock>

            {/* `456:3415` — Daily meal structure* (REQUIRED, gold, 2-up). */}
            <ChoiceBlock field={choice('mealStructure')}>
              <PreferenceGrid
                options={choice('mealStructure').options}
                selectedId={values.mealStructure}
                tone={choice('mealStructure').tone}
                columns={choice('mealStructure').columns}
                onSelect={(id) => setSingle('mealStructure', id)}
                accessibilityLabel={choice('mealStructure').label}
                testID="profile-meal-structure"
              />
            </ChoiceBlock>

            {/* `456:3429` — the pressing-issue line. Its label is SemiBold **12** /16 where the
                other five section labels are 13; both are drawn, so both are transcribed. */}
            <View style={[styles.block, styles.blockTight]}>
              <Text variant="bodyStrong" color="textPrimary">
                {profilePromptField('pressingIssue').label}
              </Text>
              <FieldInput
                value={values.pressingIssue}
                onChangeText={(pressingIssue) =>
                  setValues((current) => ({ ...current, pressingIssue }))
                }
                onFocus={onInputFocus}
                placeholder={profilePromptField('pressingIssue').placeholder}
                tone="lime"
                testID="profile-pressing-issue"
              />
            </View>

            {/* `338:4531` — Dietary preference* (REQUIRED, gold, 2-up). */}
            <ChoiceBlock field={choice('dietaryPreference')}>
              <PreferenceGrid
                options={choice('dietaryPreference').options}
                selectedId={values.dietaryPreference}
                tone={choice('dietaryPreference').tone}
                columns={choice('dietaryPreference').columns}
                onSelect={(id) => setSingle('dietaryPreference', id)}
                accessibilityLabel={choice('dietaryPreference').label}
                testID="profile-dietary"
              />
            </ChoiceBlock>

            {/* `341:4655` — the MULTI-select. Adding is a submit on the search field; removing is
                the chip's own cross. Both go through `validation.ts`, so removing one value
                cannot disturb the others (founder rule, task §5). */}
            <View style={styles.block}>
              <Text variant="fieldSection" color="textPrimary">
                {profilePromptField('grownUpEating').label}
              </Text>

              {/* `341:4672` — a 24pt-radius field outlined in `#CAD5E2` with a 16pt magnifier
                  8pt clear of the input. The frame's `0 1 0` shadow has ZERO blur and renders as
                  nothing on device, so no elevation is applied. */}
              <View style={styles.search}>
                <Icon name="search" size={16} color="textSecondary" />
                <TextInput
                  value={entry}
                  onChangeText={(next) => {
                    setEntry(next);
                    setEntryOpen(true);
                  }}
                  onFocus={() => {
                    onInputFocus();
                    // Focus alone opens the WHOLE list. The vocabulary is closed, so a customer
                    // who does not already know what is in it has to be able to see it — typing
                    // first would mean guessing at a list they have never been shown.
                    setEntryOpen(true);
                  }}
                  onSubmitEditing={() => {
                    /**
                     * Done commits only an EXACT published name.
                     *
                     * `addGrownUpEating` refuses anything else, so a half-typed word or a sentence
                     * leaves the field alone rather than becoming a chip — and the list below is
                     * still open, showing what could be chosen instead.
                     */
                    const matched = matchGrownUpEating(entry);
                    if (matched === null) return;
                    setValues((current) => ({
                      ...current,
                      grownUpEating: addGrownUpEating(current.grownUpEating, matched),
                    }));
                    setEntry('');
                    setEntryOpen(false);
                  }}
                  placeholder={profilePromptField('grownUpEating').placeholder}
                  placeholderTextColor={lightTheme.colors.textSecondary}
                  accessibilityLabel={profilePromptField('grownUpEating').label}
                  style={styles.searchInput}
                  returnKeyType="done"
                  blurOnSubmit={false}
                  testID="profile-grown-up-entry"
                />
              </View>

              {/*
                FIGMA_PENDING — `341:4655` draws the field and the chosen chips, and no list
                between them. It has to exist regardless: the values are a closed vocabulary now,
                and a search box over a list nobody can see is a guessing game. Drawn in the
                field's own outline treatment so it reads as part of the control.

                In FLOW, not floating. The page is one long ScrollView with the CTA at the bottom
                of it, so an absolutely-positioned list would be clipped by the blocks below and
                could not be scrolled to; pushing the content down is what lets a customer reach
                the twenty-seventh option.
              */}
              {!entryOpen || entrySuggestions.length === 0 ? null : (
                <ScrollView
                  style={styles.entryList}
                  // The list scrolls INSIDE its own five-row window rather than growing the page
                  // by twenty-seven rows. `nestedScrollEnabled` is what makes that work on
                  // Android, where the outer ScrollView would otherwise swallow the gesture.
                  nestedScrollEnabled
                  // A tap while the IME is up must select the option, not merely dismiss the
                  // keyboard and leave the customer to tap again.
                  keyboardShouldPersistTaps="handled"
                  testID="profile-grown-up-options"
                >
                  {entrySuggestions.map((option) => (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        setValues((current) => ({
                          ...current,
                          grownUpEating: addGrownUpEating(current.grownUpEating, option.label),
                        }));
                        setEntry('');
                        setEntryOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      style={({ pressed }) => [
                        styles.entryOption,
                        pressed ? styles.entryOptionPressed : null,
                      ]}
                      testID={`profile-grown-up-option-${option.id}`}
                    >
                      <Text variant="bodyMedium" color="textPrimary">
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* Typed something the list does not contain. Said plainly, because the field
                  silently doing nothing on Done is what would otherwise read as a broken box. */}
              {!entryOpen || entry.trim() === '' || entrySuggestions.length > 0 ? null : (
                <Text
                  variant="bodyMedium"
                  color="textSecondary"
                  style={styles.entryNotice}
                  testID="profile-grown-up-empty"
                >
                  No matching cuisine. Try a region — Punjabi, Bengali, Kerala.
                </Text>
              )}

              {/* `408:1381` — the selected chips, at a 10pt gutter. Wraps rather than scrolls:
                  the frame draws three on one row at 390dp, and a fourth (or a long cuisine name
                  on a 320dp handset) has to go somewhere other than off the edge. */}
              {values.grownUpEating.length === 0 ? null : (
                <View style={styles.chipRow} testID="profile-grown-up-chips">
                  {values.grownUpEating.map((value) => (
                    <RemovableChip
                      key={value}
                      label={value}
                      onRemove={() =>
                        setValues((current) => ({
                          ...current,
                          grownUpEating: removeGrownUpEating(current.grownUpEating, value),
                        }))
                      }
                      testID={`profile-grown-up-${value}`}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* `341:4626` — Cook preference: a heading over two 3-up sub-groups. The heading
                collects nothing of its own. */}
            <View style={styles.cookBlock}>
              <Text variant="fieldSection" color="textPrimary">
                {PROFILE_COOK_PREFERENCE_LABEL}
              </Text>

              {/* `341:4644` / `341:4640` — py 6, 6pt gap, sub-label in Livvic Medium 12/16. */}
              <View style={styles.subBlock}>
                <Text variant="bodyMedium" color="textPrimary">
                  {choice('regionPreference').label}
                </Text>
                <PreferenceGrid
                  options={choice('regionPreference').options}
                  selectedId={values.regionPreference}
                  tone={choice('regionPreference').tone}
                  columns={choice('regionPreference').columns}
                  onSelect={(id) => setSingle('regionPreference', id)}
                  accessibilityLabel={choice('regionPreference').label}
                  testID="profile-region"
                />
              </View>

              <View style={styles.subBlock}>
                <Text variant="bodyMedium" color="textPrimary">
                  {choice('genderPreference').label}
                </Text>
                <PreferenceGrid
                  options={choice('genderPreference').options}
                  selectedId={values.genderPreference}
                  tone={choice('genderPreference').tone}
                  columns={choice('genderPreference').columns}
                  onSelect={(id) => setSingle('genderPreference', id)}
                  accessibilityLabel={choice('genderPreference').label}
                  testID="profile-gender"
                />
              </View>
            </View>

            {/* `338:4508` draws no error state — it has never been asked to show one. A REJECTED
                save still has to be visible, or Confirm looks broken, so the rejection is rendered
                in the same quiet destructive line Login and OTP already use. */}
            {errorMessage === undefined ? null : (
              <Text variant="bodyQuiet" color="textDestructive" testID="profile-details-error">
                {errorMessage}
              </Text>
            )}

            {/* `338:4558` — in flow, 16pt below the body. */}
            <Button
              label={PROFILE_DETAILS_CTA}
              onPress={() => {
                // The visual state is never the guard on its own: a press racing the state that
                // disabled it must still not write.
                if (!canSubmit) return;
                onSubmit({
                  ...values,
                  // TRIMMED, so what cleared the gate is exactly what is submitted.
                  name: values.name.trim(),
                  pressingIssue: values.pressingIssue.trim(),
                });
              }}
              variant="primary"
              size="form"
              // `338:4558` carries no lift.
              flat
              disabled={!canSubmit}
              loading={submitting}
              testID="profile-details-submit"
            />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* --------------------------------------------------------------------- pieces */

/** `456:3401` and friends — a 13/16 SemiBold label over its grid, at a 10pt gap. */
function ChoiceBlock({
  field,
  children,
}: {
  readonly field: ProfileChoiceField;
  readonly children: ReactNode;
}) {
  return (
    <View style={styles.block}>
      <Text variant="fieldSection" color="textPrimary">
        {field.label}
      </Text>
      {children}
    </View>
  );
}

/**
 * `456:3390` / `456:3433` — the two free-text fields.
 *
 * Same geometry, different edge: Name is outlined `#FFD600` and the pressing-issue line `#CFFF04`.
 * The tone is the frame's, so it is passed rather than inferred.
 */
function FieldInput({
  value,
  onChangeText,
  onFocus,
  placeholder,
  tone,
  testID,
}: {
  readonly value: string;
  readonly onChangeText: (next: string) => void;
  readonly onFocus: () => void;
  readonly placeholder: string;
  readonly tone: 'gold' | 'lime';
  readonly testID: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      placeholder={placeholder}
      placeholderTextColor={lightTheme.colors.textSecondary}
      accessibilityLabel={placeholder}
      style={[styles.input, tone === 'gold' ? styles.inputGold : styles.inputLime]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  flex: { flex: 1 },
  /** `338:4509` — 16pt gutters, 16pt above the header. */
  column: {
    flex: 1,
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.lg,
  },
  /**
   * `338:4511` — gap **17**, pb 6, and 16 clear of the header above it.
   *
   * 17 is the frame's own value and is not rounded to 16: the eight blocks accumulate the
   * difference, and at 16 the CTA lands 8pt above where `338:4558` is drawn.
   */
  body: {
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.s6,
    gap: 17,
  },
  /** Every block pads px 4 / py 6 inside the column, with a 10pt gap to its control. */
  block: {
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
    gap: lightTheme.space.s10,
  },
  /** `456:3430` — the pressing-issue block closes to 5. */
  blockTight: { gap: 5 },
  /** `341:4627` — the Cook preference block is a 12pt stack. */
  cookBlock: {
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
    gap: lightTheme.space.md,
  },
  /** `341:4644` — py 6, 6pt gap. */
  subBlock: { paddingVertical: lightTheme.space.s6, gap: lightTheme.space.s6 },

  /** `456:3390` — px 11.889 / py 7.889, 12pt radius, Livvic Medium 12/16 at 70 % black. */
  input: {
    paddingHorizontal: 11.889,
    paddingVertical: 7.889,
    borderRadius: lightTheme.radius.r12,
    borderWidth: lightTheme.stroke.thin,
    backgroundColor: lightTheme.colors.surface,
    color: lightTheme.colors.textSecondary,
    ...lightTheme.typography.bodyMedium,
  },
  inputGold: { borderColor: lightTheme.colors.borderNotice },
  inputLime: { borderColor: lightTheme.colors.borderPositive },

  /** `341:4672` — a 24pt-radius pill outlined `#CAD5E2`, the mark 8pt clear of the text. */
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: 11.889,
    paddingVertical: 7.889,
    borderRadius: lightTheme.radius.lg,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.border,
    backgroundColor: lightTheme.colors.surface,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: lightTheme.colors.textSecondary,
    ...lightTheme.typography.bodyMedium,
  },
  /**
   * FIGMA_PENDING — the cuisine list under `341:4672`.
   *
   * Given the field's own outline so the two read as one control: same `#CAD5E2` edge, same 24pt
   * family softened to `lg` for a block rather than a pill, on white. Capped at ~5 rows and
   * scrollable inside itself, so a 27-entry vocabulary cannot push Confirm off a short handset
   * while the keyboard is up.
   */
  entryList: {
    maxHeight: 200,
    marginTop: lightTheme.space.s6,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.border,
    backgroundColor: lightTheme.colors.surface,
    overflow: 'hidden',
  },
  entryOption: {
    paddingHorizontal: 11.889,
    paddingVertical: lightTheme.space.s10,
  },
  entryOptionPressed: { backgroundColor: lightTheme.colors.surfaceAccent },
  entryNotice: { marginTop: lightTheme.space.s6 },
  /** `408:1381` — a 10pt gutter, wrapping. */
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: lightTheme.space.s10,
  },
});
