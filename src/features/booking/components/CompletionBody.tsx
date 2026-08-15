import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BOOKING_COMPLETE_ART, RatingWidget, Text, lightTheme } from '@ui';
import type { CookViewModel, RatingValue } from '@ui';

import type { CompletionViewModel } from '../types';

/**
 * Completion — Figma `143:207`.
 *
 * Read off the frame, top to bottom:
 *   hero      `143:232` — a 65pt check mark over "Booking Complete!" in Livvic Black 24/30
 *                         `#0F172B`, centred on the WHITE ground. Not a status banner: `143:207`
 *                         draws no card, no lime fill and no 64pt disc.
 *   prompt    `143:241` — a 224 × 32 pill, `#CFFF04` at 30% inside a 1pt `#CFFF04` outline, with
 *                         "Please rate this service!" in Livvic Bold 14/20, then a Livvic Medium
 *                         10/15 caption beneath.
 *   rating    `143:245` — a white 24pt-radius card outlined 1pt in `#FFDE33` holding the cook's
 *                         65 × 70 photo panel, name (Bold 14/20) and booking line (Regular 12/16),
 *                         then the `5+` legend and the nine-chip scale.
 *   feedback  `143:286` — a Livvic SemiBold 12/16 `#314158` label, a 103pt textarea outlined in
 *                         `#CAD5E2` at a 16pt radius, and a CENTRED 102 × 25 `#E2FF68` Submit chip
 *                         at a 5pt radius with an uppercase Livvic Bold 12/16 +0.6 label.
 *   tip       `143:294` — a white 24pt-radius card outlined in `#E2E8F0`: "Tip Cook …" in Livvic
 *                         Bold 12/16 beside "100% goes directly to cook" in `#009966`, over four
 *                         `#FFEF99` chips at a 12pt radius; the selected chip is `#E2FF68`.
 *
 * Boundary: nothing is submitted here. There is no rating, feedback or tip endpoint, so the
 * component collects input and hands it to callbacks. Tip amounts are server-supplied options,
 * not client-calculated values, and choosing one does not take payment (ruling R-1).
 */
export interface CompletionBodyProps {
  readonly completion: CompletionViewModel;
  readonly cook?: CookViewModel;
  readonly rating: RatingValue | null;
  readonly onChangeRating: (value: RatingValue) => void;
  readonly onSubmitFeedback: (feedback: string) => void;
  readonly onSelectTip: (tipId: string) => void;
}

export function CompletionBody({
  completion,
  cook,
  rating,
  onChangeRating,
  onSubmitFeedback,
  onSelectTip,
}: CompletionBodyProps) {
  const [feedback, setFeedback] = useState('');
  const [tipId, setTipId] = useState<string | null>(null);

  return (
    <View style={styles.container} testID="completion-body">
      {/* `143:233` — 65pt mark, 7pt gap, Livvic Black 24/30. */}
      <View style={styles.hero} testID="completion-hero">
        <Image
          source={BOOKING_COMPLETE_ART}
          style={styles.heroArt}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text variant="headingHero24" color="textStrong" align="center" accessibilityRole="header">
          {completion.bannerTitle}
        </Text>
      </View>

      {/* `143:240` — the rate prompt pill and its caption. */}
      <View style={styles.prompt}>
        <View style={styles.promptPill} testID="completion-rate-prompt">
          <Text variant="title" color="textStrong" align="center">
            {completion.ratePrompt}
          </Text>
        </View>
        <Text variant="captionMedium" color="textSecondary" align="center">
          {completion.rateCaption}
        </Text>
      </View>

      {/* `143:245` — the rating card. */}
      <View style={styles.ratingCard} testID="completion-rating-card">
        <View style={styles.cookRow}>
          {/* `143:247` — the `#FFF7CC` panel is a designed SURFACE, so it holds its 65 x 70 slot
              whether or not a photograph has been supplied. */}
          <View style={styles.cookPhoto}>
            {cook?.photoUrl === undefined ? null : (
              <Image
                source={{ uri: cook.photoUrl }}
                style={styles.cookPhotoImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            )}
          </View>
          <View style={styles.cookText}>
            <Text variant="title" color="textPrimary" numberOfLines={1}>
              {cook?.displayName ?? ''}
            </Text>
            <Text variant="body" color="textSecondary">
              {completion.bookingHeadline}
            </Text>
          </View>
        </View>

        <View style={styles.ratingScale}>
          <RatingWidget
            value={rating}
            onChange={onChangeRating}
            showExceptionalPrompt
            promptText={completion.ratingCaption}
            testID="completion-rating"
          />
        </View>
      </View>

      {/* `143:286` — feedback. */}
      <View style={styles.feedback}>
        <Text variant="bodyStrong" color="textSecondaryStrong">
          {completion.feedbackTitle}
        </Text>
        <TextInput
          value={feedback}
          onChangeText={setFeedback}
          placeholder={completion.feedbackPlaceholder}
          placeholderTextColor={lightTheme.colors.textPlaceholder}
          multiline
          style={styles.input}
          accessibilityLabel={completion.feedbackTitle}
          testID="completion-feedback"
        />
        <Pressable
          onPress={() => onSubmitFeedback(feedback)}
          disabled={feedback.trim().length === 0}
          accessibilityRole="button"
          accessibilityLabel={completion.submitLabel}
          accessibilityState={{ disabled: feedback.trim().length === 0 }}
          hitSlop={10}
          style={({ pressed }) => [
            styles.submit,
            feedback.trim().length === 0 ? styles.submitDisabled : null,
            pressed ? styles.pressed : null,
          ]}
          testID="completion-submit"
        >
          <Text variant="buttonUpper" color="textPrimary" align="center">
            {completion.submitLabel}
          </Text>
        </Pressable>
      </View>

      {/* `143:294` — the tip card. */}
      <View style={styles.tipCard} testID="completion-tips">
        <View style={styles.tipHeader}>
          <Text variant="bodyBold" color="textField" style={styles.tipTitle}>
            {completion.tipTitle}
          </Text>
          <Text variant="labelSuccess" color="textSuccess">
            {completion.tipCaption}
          </Text>
        </View>

        <View
          style={styles.tipChips}
          accessibilityRole="radiogroup"
          accessibilityLabel={completion.tipTitle}
        >
          {completion.tipOptions.map((option) => {
            const selected = tipId === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  setTipId(option.id);
                  onSelectTip(option.id);
                }}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected, checked: selected }}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.tipChip,
                  selected ? styles.tipChipSelected : styles.tipChipIdle,
                  pressed ? styles.pressed : null,
                ]}
                testID={`completion-tip-${option.id}`}
              >
                <Text
                  variant="bodyBold"
                  color={selected ? 'textPrimary' : 'textSecondaryStrong'}
                  align="center"
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `143:232` / `143:239` / `143:285` — the frame stacks the blocks 16pt apart. */
  container: { gap: lightTheme.space.lg },
  /** `143:233` — 7pt between the mark and the title. */
  hero: { alignItems: 'center', gap: 7, paddingVertical: lightTheme.space.lg },
  heroArt: { width: 65, height: 65 },
  /** `143:240` — pill then caption, 4pt apart. */
  prompt: { alignItems: 'center', gap: lightTheme.space.xs },
  /** `143:241` — 224 × 32, fully rounded, `#CFFF04` at 30% inside a 1pt `#CFFF04` outline. */
  promptPill: {
    width: 224,
    maxWidth: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11.889,
    borderRadius: lightTheme.radius.pill,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfacePositiveBright,
    backgroundColor: lightTheme.colors.surfaceRatePrompt,
  },
  /** `143:245` — white, 1pt `#FFDE33`, 24pt radius, px 15.889 / py 12, 6pt gap. */
  ratingCard: {
    alignSelf: 'stretch',
    gap: lightTheme.space.s6,
    paddingHorizontal: 15.889,
    paddingVertical: lightTheme.space.md,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderCtaSoft,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  /** `143:246` — 6pt gap, px 9 / py 6. */
  cookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: 9,
    paddingVertical: lightTheme.space.s6,
  },
  /** `143:247` — a 65 × 70 `#FFF7CC` panel at a 16pt radius. Smaller than the 85 × 90 cook card. */
  cookPhoto: {
    width: 65,
    height: 70,
    borderRadius: lightTheme.radius.md,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceAccent,
    ...lightTheme.elevation.softer,
  },
  cookPhotoImage: { width: '100%', height: '100%' },
  /** `143:249` — 5pt between the name and the booking line, 6pt padding. */
  cookText: { flex: 1, minWidth: 0, gap: 5, padding: lightTheme.space.s6 },
  /** `143:252` — px 9, pt 6, pb 12. */
  ratingScale: {
    paddingHorizontal: 9,
    paddingTop: lightTheme.space.s6,
    paddingBottom: lightTheme.space.md,
  },
  /** `143:286` — 10pt between the label, the field and the Submit chip. */
  feedback: { alignSelf: 'stretch', gap: lightTheme.space.s10 },
  /** `143:289` — 103pt, 1pt `#CAD5E2`, 16pt radius, px 11.889 / pt 13 / pb 12. */
  input: {
    alignSelf: 'stretch',
    height: 103,
    paddingHorizontal: 11.889,
    paddingTop: 13,
    paddingBottom: lightTheme.space.md,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderControl,
    backgroundColor: lightTheme.colors.surface,
    color: lightTheme.colors.textField,
    textAlignVertical: 'top',
    ...lightTheme.typography.bodyMedium,
    ...lightTheme.elevation.badge,
  },
  /** `143:292` — a CENTRED 102 × 25 `#E2FF68` chip at a 5pt radius. */
  submit: {
    alignSelf: 'center',
    width: 102,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r5,
    backgroundColor: lightTheme.colors.surfaceEta,
  },
  submitDisabled: { backgroundColor: lightTheme.colors.surfaceMuted },
  pressed: { opacity: 0.85 },
  /** `143:294` — white, 1pt `#E2E8F0`, 24pt radius, px 15.889 / py 13, 10pt gap. */
  tipCard: {
    alignSelf: 'stretch',
    gap: lightTheme.space.s10,
    paddingHorizontal: 15.889,
    paddingVertical: 13,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: lightTheme.space.sm,
  },
  tipTitle: { flexShrink: 1 },
  /** `143:300` — four chips, 8pt apart, sharing the row. */
  tipChips: { flexDirection: 'row', gap: lightTheme.space.sm },
  /** `143:301` — py 7.889, 12pt radius. Width comes from the row, not from per-chip padding. */
  tipChip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7.889,
    paddingHorizontal: lightTheme.space.sm,
    borderRadius: lightTheme.radius.r12,
    borderWidth: lightTheme.stroke.thin,
  },
  tipChipIdle: {
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    borderColor: lightTheme.colors.surfaceAccentBold,
  },
  /** `143:303` — `#E2FF68` inside `#CFFF04`, with a 5% lift. */
  tipChipSelected: {
    backgroundColor: lightTheme.colors.surfaceEta,
    borderColor: lightTheme.colors.surfacePositiveBright,
    ...lightTheme.elevation.badge,
  },
});
