import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  BottomSheet,
  Button,
  CANCEL_NOTE_ART,
  CANCEL_NOTE_FALLBACK_ART,
  CANCEL_RADIO_OFF,
  CANCEL_RADIO_ON,
  CancelledHero,
  DetailRows,
  FeeSchedule,
  HelpPill,
  NoticeCard,
  PromptBlock,
  RefundDestinationRow,
  Text,
  lightTheme,
} from '@ui';

import type { CancellationViewModel } from '../types';

/**
 * Cancellation — Figma `6:2` → `104:2260` → `104:2336` → `115:2703`.
 *
 * Confirmed C-4: this is ONE bottom sheet with four steps over an `rgba(0,0,0,0.8)` scrim, sharing
 * one persistent header (`111:2635`: the SCREEN header — 45pt band, "Cancel booking" in Livvic
 * Black 20/28, back control and Help pill). The back chevron steps within the sheet.
 *
 * Per step, read off the frames:
 *   policy   `6:2`      fee schedule (`6:17`) → two outlined notices (`107:2587`, `107:2613`) →
 *                       the lime reschedule prompt (`6:63`) → a `#FFD600` Cancel bar (`6:75`)
 *   reason   `104:2260` a white 24pt-radius card (`104:2273`): "Why do you want to cancel?" in
 *                       Livvic Bold 16/24 over seven 20pt radio rows, then `Continue` (`104:2314`)
 *   refund   `104:2336` the refund table (`104:2353`), the destination row (`104:2370`), the same
 *                       reschedule prompt, and a Cancel bar that is `#FFDE33` here, not `#FFD600`
 *   confirm  `115:2703` the cancelled hero (`115:2716`), a card carrying the refund amount and
 *                       destination (`115:2737`), then "make another booking?" with No / Yes
 *
 * ⚠ NOT WIRED. Blocker B-11: no live-booking screen has a verified Cancel entry point, so this
 * component is implemented visually and exercised from the showcase only. Do not attach it to a
 * screen until the entry point is confirmed. **The entry point is not invented here.**
 *
 * Boundary — this is the most legally consequential surface in the app:
 *  - the fee schedule renders as CONTENT; the applicable fee is a server value;
 *  - the refund figures are three server-provided numbers, displayed. "paid − fee = refund" is
 *    never computed here — a client/server mismatch on a refund is a trust incident;
 *  - the "Reschedule for free" block renders only when the server says the booking is still
 *    eligible (ruling R-3).
 *
 * PRODUCT RULE (B-19, confirmed): choosing the reason flagged `requiresDetail` ("Others") reveals
 * a free-text field, and Continue stays disabled until it has content. The field is not drawn on
 * `104:2260`; it is an approved addition, recorded in the audit as a deliberate deviation.
 *
 * TODO(designer, defect D-9): the destructive Cancel action uses the primary yellow, and the two
 * steps disagree about which yellow. Drawn as designed on both.
 */

export type CancellationStep = 'policy' | 'reason' | 'refund' | 'confirmed';

export interface CancelBookingSheetProps {
  readonly visible: boolean;
  readonly cancellation: CancellationViewModel;
  readonly step: CancellationStep;
  readonly onStepChange: (step: CancellationStep) => void;
  readonly onClose: () => void;
  readonly onReschedule?: () => void;
  readonly onConfirmCancel: (reasonId: string, detail: string) => void;
  readonly onBookAgain: (again: boolean) => void;
  readonly onHelp?: () => void;
}

export function CancelBookingSheet({
  visible,
  cancellation,
  step,
  onStepChange,
  onClose,
  onReschedule,
  onConfirmCancel,
  onBookAgain,
  onHelp,
}: CancelBookingSheetProps) {
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [detail, setDetail] = useState('');

  const selectedReason = cancellation.reasons.find((reason) => reason.id === reasonId);
  const needsDetail = selectedReason?.requiresDetail === true;
  const canContinue = reasonId !== null && (!needsDetail || detail.trim().length > 0);
  const canReschedule = cancellation.rescheduleAllowed === true && onReschedule !== undefined;

  const reschedulePrompt = canReschedule ? (
    <PromptBlock
      title={cancellation.reschedulePromptTitle}
      body={cancellation.reschedulePromptBody}
      testID="cancel-reschedule-block"
    >
      <Button
        label={cancellation.rescheduleCtaLabel}
        onPress={onReschedule}
        variant="bright"
        size="barSm"
        testID="cancel-reschedule"
      />
    </PromptBlock>
  ) : null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={cancellation.title}
      headerVariant="screen"
      bodyStyle={styles.body}
      onBack={step === 'policy' ? onClose : () => onStepChange(previousStep(step))}
      {...(onHelp === undefined
        ? {}
        : {
            headerAction: (
              <HelpPill label={cancellation.helpLabel} onPress={onHelp} testID="cancel-help" />
            ),
          })}
      testID="cancel-sheet"
    >
      {renderStep()}
    </BottomSheet>
  );

  function renderStep() {
    switch (step) {
      case 'policy':
        return (
          <View style={styles.step} testID="cancel-step-policy">
            <FeeSchedule
              columns={cancellation.feeColumns}
              rows={cancellation.feeSchedule}
              testID="cancel-fees"
            />

            {cancellation.notes.map((note) => (
              <NoticeCard
                key={note.id}
                title={note.title}
                body={note.body}
                art={CANCEL_NOTE_ART[note.id] ?? CANCEL_NOTE_FALLBACK_ART}
                testID={`cancel-note-${note.id}`}
              />
            ))}

            {reschedulePrompt}

            <Button
              label={cancellation.cancelCtaLabel}
              onPress={() => onStepChange('reason')}
              variant="primary"
              size="bar"
              testID="cancel-continue-policy"
            />
          </View>
        );

      case 'reason':
        return (
          <View style={styles.step} testID="cancel-step-reason">
            <View style={styles.card}>
              <View style={styles.cardTitle}>
                <Text variant="headingBold" color="textPrimary" accessibilityRole="header">
                  {cancellation.reasonTitle}
                </Text>
              </View>

              <View
                style={styles.reasons}
                accessibilityRole="radiogroup"
                accessibilityLabel={cancellation.reasonTitle}
              >
                {cancellation.reasons.map((reason) => {
                  const selected = reasonId === reason.id;
                  return (
                    <Pressable
                      key={reason.id}
                      onPress={() => setReasonId(reason.id)}
                      accessibilityRole="radio"
                      accessibilityLabel={reason.label}
                      accessibilityState={{ selected, checked: selected }}
                      hitSlop={{ top: 6, bottom: 6, left: 0, right: 0 }}
                      style={({ pressed }) => [styles.reasonRow, pressed ? styles.pressed : null]}
                      testID={`cancel-reason-${reason.id}`}
                    >
                      <Image
                        source={selected ? CANCEL_RADIO_ON : CANCEL_RADIO_OFF}
                        style={styles.radio}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                      />
                      <Text variant="body" color="textSecondary" style={styles.reasonLabel}>
                        {reason.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* B-19 — revealed only by the reason that asks for it, and required. */}
              {needsDetail ? (
                <TextInput
                  value={detail}
                  onChangeText={setDetail}
                  placeholder={cancellation.reasonDetailPlaceholder}
                  placeholderTextColor={lightTheme.colors.textPlaceholder}
                  multiline
                  style={styles.detailInput}
                  accessibilityLabel={cancellation.reasonDetailPlaceholder}
                  testID="cancel-reason-detail"
                />
              ) : null}
            </View>

            <Button
              label={cancellation.continueLabel}
              onPress={() => onStepChange('refund')}
              variant="primary"
              size="bar"
              disabled={!canContinue}
              testID="cancel-continue-reason"
            />
          </View>
        );

      case 'refund':
        return (
          <View style={styles.step} testID="cancel-step-refund">
            <View style={styles.card}>
              <View style={styles.cardTitle}>
                <Text variant="headingBold" color="textPrimary" accessibilityRole="header">
                  {cancellation.refundTitle}
                </Text>
              </View>
              {/* Three supplied figures. Nothing is subtracted here. */}
              <DetailRows
                rows={cancellation.refundRows}
                variant="refund"
                testID="cancel-refund-rows"
              />
            </View>

            <RefundDestinationRow
              destination={cancellation.refundMethodTitle}
              timeframe={cancellation.refundMethodBody}
              boxed
              testID="cancel-refund-method"
            />

            {reschedulePrompt}

            {/* `104:2386` — this step's Cancel bar is the softer `#FFDE33`. */}
            <Button
              label={cancellation.cancelCtaLabel}
              onPress={() => {
                onConfirmCancel(reasonId ?? '', detail);
                onStepChange('confirmed');
              }}
              variant="primary"
              size="bar"
              style={styles.softCancel}
              testID="cancel-confirm"
            />
          </View>
        );

      case 'confirmed': {
        const total = cancellation.refundRows.find((row) => row.emphasis === 'total');
        return (
          <View style={styles.stepConfirmed} testID="cancel-step-confirmed">
            <CancelledHero title={cancellation.confirmedTitle} testID="cancel-confirmed-hero" />

            <View style={styles.refundCard} testID="cancel-confirmed-refund">
              {total === undefined ? null : (
                <View style={styles.refundTotalRow}>
                  <Text variant="bodyStrong" color="textPrimary">
                    {total.label}
                  </Text>
                  <Text variant="headingCta" color="textPrimary" align="right">
                    {total.value}
                  </Text>
                </View>
              )}
              <RefundDestinationRow
                destination={cancellation.refundMethodTitle}
                timeframe={cancellation.refundMethodBody}
              />
            </View>

            <PromptBlock
              title={cancellation.bookAgainTitle}
              titleVariant="titleRebook"
              testID="cancel-book-again"
            />

            <View style={styles.bookAgain}>
              <Button
                label={cancellation.bookAgainNoLabel}
                onPress={() => onBookAgain(false)}
                variant="secondary"
                size="bar"
                fullWidth={false}
                style={[styles.bookAgainButton, styles.declineOutline]}
                testID="cancel-book-again-no"
              />
              <Button
                label={cancellation.bookAgainYesLabel}
                onPress={() => onBookAgain(true)}
                variant="bright"
                size="bar"
                fullWidth={false}
                style={styles.bookAgainButton}
                testID="cancel-book-again-yes"
              />
            </View>
          </View>
        );
      }
    }
  }
}

function previousStep(step: CancellationStep): CancellationStep {
  switch (step) {
    case 'reason':
      return 'policy';
    case 'refund':
      return 'reason';
    case 'confirmed':
      return 'refund';
    case 'policy':
      return 'policy';
  }
}

const styles = StyleSheet.create({
  /** `6:14` — 16pt padding around the step. */
  body: {
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.lg,
    gap: 0,
  },
  /** `6:15` — 16pt between blocks. */
  step: { gap: lightTheme.space.lg },
  /** `115:2715` — the confirmation step stacks 23pt apart. */
  stepConfirmed: { gap: 23 },
  /** `104:2273` — white, 24pt radius, 15.889pt padding, `0 0 1 rgba(0,0,0,0.15)`. */
  card: {
    alignSelf: 'stretch',
    gap: 11.99,
    padding: 15.889,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.hairline,
  },
  /** `104:2274` — a 31pt title band, 6pt vertical padding. */
  cardTitle: { justifyContent: 'center', minHeight: 31, paddingVertical: lightTheme.space.s6 },
  /** `104:2281` — 8pt between rows, 6pt of vertical padding. */
  reasons: { gap: lightTheme.space.sm, paddingVertical: lightTheme.space.s6 },
  /** `104:2283` — a 20pt row, 10pt between the mark and the label. */
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s10,
    minHeight: 20,
  },
  radio: { width: 20, height: 20 },
  reasonLabel: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  /** B-19 — not drawn on `104:2260`; matched to the Completion feedback field (`143:289`). */
  detailInput: {
    alignSelf: 'stretch',
    minHeight: 72,
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
  },
  /** `104:2386` — `#FFDE33` rather than the policy step's `#FFD600`. */
  softCancel: { backgroundColor: lightTheme.colors.borderCtaSoft },
  /** `115:2737` — white, 1pt `#E2E8F0`, 16pt radius, 11.889pt padding, 11pt gap. */
  refundCard: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 11,
    padding: 11.889,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `115:2731` — 6pt of lead-in above the amount. */
  refundTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
    paddingTop: lightTheme.space.s6,
  },
  /** `115:2814` — two 162 × 34 buttons, 10pt apart. */
  bookAgain: { flexDirection: 'row', gap: lightTheme.space.s10 },
  bookAgainButton: { flex: 1, maxWidth: 162 },
  /** `115:2810` — outlined in `#FFDE33`. */
  declineOutline: { borderColor: lightTheme.colors.borderCtaSoft },
});
