import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { BOOKING_COMPLETE_ART, RatingWidget, Text, lightTheme } from '@ui';
import type { CookViewModel, RatingSelection } from '@ui';

import { SERVICE_SECTION_GAP, ServiceSection } from './ServiceSection';
import { ServiceLinkRow } from './ServiceLinkRow';
import type { CompletionViewModel } from '../types';

/** `308:3130` — the 35 × 35 "Receive Cash" mark on the tip row. */
const TIP_GLYPH = require('../../../../assets/figma/booking/tip-cook.png') as ImageSourcePropType;

/**
 * Completion — Figma `299:1424` ("Page 14a"), with `319:3191` ("Page 14b") as its SUBMITTED
 * state.
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
 *   tip       `308:3121` — the tip CARD is gone. The current file ends the screen with the same
 *                         `250:2966` outlined row Confirmation uses, reading "Would you like to
 *                         tip the cook?" over the `308:3130` mark, which opens `306:2885`
 *                         ("Page 15- Tip pop out"). The four inline `#FFEF99` chips moved into
 *                         that sheet.
 *
 * `319:3191` is the SAME screen after Submit: the nine-chip scale disappears (the value is in),
 * the "5+" legend carries a thank-you line, the textarea holds the acknowledgement and the
 * Submit chip is gone. It is `submitted` on the view model — a SERVER fact, not a local flag the
 * component sets when the button is pressed.
 *
 * Boundary: nothing is submitted here. There is no rating, feedback or tip endpoint, so the
 * component collects input and hands it to callbacks. Tip amounts are server-supplied options,
 * not client-calculated values, and choosing one does not take payment (ruling R-1).
 */
export interface CompletionBodyProps {
  readonly completion: CompletionViewModel;
  readonly cook?: CookViewModel;
  readonly rating: RatingSelection | null;
  readonly onChangeRating: (value: RatingSelection) => void;
  readonly onSubmitFeedback: (feedback: string) => void;
  /** `308:3122` — opens `306:2885`. A seam; nothing about the tip is decided here. */
  readonly onOpenTip?: () => void;
}

export function CompletionBody({
  completion,
  cook,
  rating,
  onChangeRating,
  onSubmitFeedback,
  onOpenTip,
}: CompletionBodyProps) {
  const [feedback, setFeedback] = useState('');
  const submitted = completion.submitted === true;

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
          {/* `143:242` — Livvic Bold 14/20 at 80 % layer opacity, not a lighter ink. */}
          <Text variant="title" color="textPrimary" align="center" style={styles.promptLabel}>
            {completion.ratePrompt}
          </Text>
        </View>
        <Text variant="bodyStrong" color="textPrimary" align="center">
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
            <Text variant="headingCta" color="textPrimary" align="center" numberOfLines={1}>
              {cook?.displayName ?? ''}
            </Text>
            <Text variant="title" color="textSecondary" align="center">
              {completion.bookingHeadline}
            </Text>
          </View>
        </View>

        <View style={styles.ratingScale}>
          <RatingWidget
            value={rating}
            onChange={onChangeRating}
            showExceptionalPrompt
            promptText={submitted ? completion.ratedCaption : completion.ratingCaption}
            /* `319:3217` — once the rating is in, the frame keeps the legend and drops the scale. */
            showScale={!submitted}
            testID="completion-rating"
          />
        </View>
      </View>

      {/* `143:286` — feedback. */}
      <View style={styles.feedback}>
        {/*
          `143:288` asks; `319:3191` reports. Keeping the asking headline over the
          acknowledgement left a customer who had just submitted still being invited to.
        */}
        <Text variant="bodyStrong" color="textPrimary" align="center">
          {submitted ? completion.feedbackSubmittedTitle : completion.feedbackTitle}
        </Text>
        {submitted ? (
          <View style={styles.input} testID="completion-feedback-submitted">
            <Text variant="bodyMedium" color="textField">
              {completion.feedbackAcknowledgement}
            </Text>
          </View>
        ) : (
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder={completion.feedbackPlaceholder}
            placeholderTextColor={lightTheme.colors.textPlaceholder}
            multiline
            style={[styles.input, styles.inputField]}
            accessibilityLabel={completion.feedbackTitle}
            testID="completion-feedback"
          />
        )}
        {submitted ? null : (
          /*
           * Submit is gated on the RATING, not on the words.
           *
           * It used to require feedback text: a customer who picked five stars and wrote nothing
           * found Submit dead, with nothing on screen explaining why. The rating is the thing
           * this screen exists to collect — `299:1424` labels the scale "Please rate this
           * service!" and the field is an optional invitation below it — and the submit handler
           * already drops empty feedback from the request. Requiring prose to record a rating
           * lost ratings.
           */
          <Pressable
            onPress={() => onSubmitFeedback(feedback)}
            disabled={rating === null}
            accessibilityRole="button"
            accessibilityLabel={completion.submitLabel}
            accessibilityState={{ disabled: rating === null }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.submit,
              rating === null ? styles.submitDisabled : null,
              pressed ? styles.pressed : null,
            ]}
            testID="completion-submit"
          >
            <Text variant="buttonUpper" color="textPrimary" align="center">
              {completion.submitLabel}
            </Text>
          </Pressable>
        )}
      </View>

      {/* `308:3121` — the tip ENTRY POINT. The chips live on `306:2885` now. */}
      {onOpenTip === undefined ? null : (
        <ServiceSection>
          <ServiceLinkRow
            label={completion.tipRowLabel}
            glyph={TIP_GLYPH}
            onPress={onOpenTip}
            testID="completion-tip-row"
          />
        </ServiceSection>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** `299:1425` — the section BOXES sit 16pt apart. */
  container: { gap: SERVICE_SECTION_GAP },
  /** `143:233` — 7pt between the mark and the title. */
  hero: { alignItems: 'center', gap: 7, paddingVertical: lightTheme.space.lg },
  heroArt: { width: 65, height: 65 },
  /** `143:240` — pill then caption, 4pt apart. */
  prompt: { alignItems: 'center', gap: lightTheme.space.xs },
  /** `143:242` — the label is drawn at 80 % layer opacity. */
  promptLabel: { opacity: 0.8 },
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
  /** `143:245` — white, 1pt `#FFDE33`, **20pt** radius, 16pt padding, 6pt gap, `0 1 0` lift. */
  ratingCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.r20,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderCtaSoft,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  /** `143:246` — an 82pt row, 12pt gap, py 6, top-aligned. */
  cookRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: lightTheme.space.md,
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
  /**
   * `143:248` — the same offset crop the cook card and the Home card use: the portrait is drawn
   * wider and higher than its box so the frame lands on the face.
   */
  cookPhotoImage: {
    position: 'absolute',
    left: '-6.15%',
    top: '-7.857%',
    width: '118.46%',
    height: '169.29%',
  },
  /** `143:249` — a 70pt column, 8pt between the two lines, 6pt padding, centred. */
  cookText: {
    flex: 1,
    minWidth: 0,
    height: 70,
    justifyContent: 'center',
    gap: lightTheme.space.sm,
    padding: lightTheme.space.s6,
  },
  /** `143:252` — a 304pt block; the widget carries its own px 4 / py 6 rows. */
  ratingScale: { alignSelf: 'stretch' },
  /** `143:286` — 6pt between the label, the field and the Submit chip, all centred. */
  feedback: { alignSelf: 'stretch', alignItems: 'center', gap: lightTheme.space.s6 },
  /** `143:289` — 103pt, a 1pt **`#CFFF04`** edge, 16pt radius, pl 12 / pr 11.889 / py 8. */
  input: {
    alignSelf: 'stretch',
    height: 103,
    justifyContent: 'center',
    paddingLeft: lightTheme.space.md,
    paddingRight: 11.889,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfacePositiveBright,
    backgroundColor: lightTheme.colors.surface,
  },
  inputField: {
    color: lightTheme.colors.textField,
    textAlignVertical: 'top',
    ...lightTheme.typography.bodyMedium,
  },
  /** `143:292` — a CENTRED 102 × 25 `#E2FF68` chip at a 5pt radius. */
  /**
   * `143:292` — a 102 × 25 chip, with 25 as a FLOOR rather than a fixed height.
   *
   * The frame's 25 assumes the system font scale is 1. It is not on every phone, and a label that
   * scales inside a box that does not is a label with its bottom sheared off — which is how
   * "SUBMIT" arrived on the founder's device. Padding plus a minimum keeps the drawn size at 1,
   * and lets the chip grow rather than crop past it. The width is a minimum for the same reason.
   */
  submit: {
    alignSelf: 'center',
    minWidth: 102,
    minHeight: 25,
    paddingHorizontal: lightTheme.space.s6,
    paddingVertical: lightTheme.space.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r5,
    backgroundColor: lightTheme.colors.surfaceEta,
  },
  submitDisabled: { backgroundColor: lightTheme.colors.surfaceMuted },
  pressed: { opacity: 0.85 },
});
