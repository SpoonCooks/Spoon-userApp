import { StyleSheet, View } from 'react-native';

import {
  BOOKING_NOTE_APOLOGY_ART,
  BOOKING_NOTE_REFUND_ART,
  Button,
  CancelledHero,
  DetailRows,
  NoticeCard,
  PromptBlock,
  RefundDestinationRow,
  Text,
  lightTheme,
} from '@ui';

import type { AutoCancelledViewModel } from '../types';

/**
 * Auto cancelled — Figma `201:278` ("Page 8e"). A TERMINAL state: the booking is over and the
 * screen exists to explain it and offer a rebooking.
 *
 * `201:65` stacks three blocks 22pt apart, then the rebook prompt sits below at a 10pt gap:
 *   hero      `201:66`  — a white 24pt-radius card, 116 × 72 artwork over "This booking has been
 *                         cancelled" in Livvic Bold 18/28, centred
 *   summary   `201:512` — the SAME `#FFF7CC` detail table as Confirmation (`3:1095`)
 *   refund    `201:478` — the apology notice (`201:458`) above the refund card (`201:467`)
 *   rebook    `201:477` — an `#ECFF9B` 24pt-radius prompt with No / Yes beneath it
 *
 * BOUNDARY (task §10, §20, FRONTEND_FOUNDATION_PLAN.md §20):
 *  - **nothing here computes a refund.** `refundAmount` is rendered exactly as supplied; the
 *    client never derives `paid − fee`. The same rule governs every figure in the summary table.
 *  - nothing here decides that a booking was auto-cancelled, when that happens, or whether a
 *    penalty applied. The screen renders a state the server has already reached.
 *
 * TODO(product): neither rebook answer has a designed destination — "Yes" does not name a screen
 * and "No" does not name a dismissal target. Both are rendered because they are drawn, and both
 * callbacks are optional, so an unwired host shows the prompt without inventing a route.
 */
export interface AutoCancelledBodyProps {
  readonly cancelled: AutoCancelledViewModel;
  readonly onRebook?: () => void;
  readonly onDeclineRebook?: () => void;
}

export function AutoCancelledBody({
  cancelled,
  onRebook,
  onDeclineRebook,
}: AutoCancelledBodyProps) {
  return (
    <View style={styles.container} testID="auto-cancelled-body">
      {/* `201:66` is byte-identical to the cancellation sheet's `115:2716`. */}
      <CancelledHero title={cancelled.title} testID="auto-cancelled-hero" />

      <View style={styles.summary} testID="auto-cancelled-summary">
        <DetailRows rows={cancelled.rows} testID="auto-cancelled-rows" />
      </View>

      <View style={styles.refund}>
        <NoticeCard
          title={cancelled.apologyTitle}
          body={cancelled.apologyBody}
          art={BOOKING_NOTE_APOLOGY_ART}
          testID="auto-cancelled-apology"
        />

        <NoticeCard
          title={cancelled.refundTitle}
          body={cancelled.refundBody}
          art={BOOKING_NOTE_REFUND_ART}
          testID="auto-cancelled-refund"
        >
          <View style={styles.refundFigures}>
            <View style={styles.refundRow}>
              <Text variant="bodyStrong" color="textPrimary">
                {cancelled.refundAmountLabel}
              </Text>
              {/* Server-supplied and rendered verbatim. Never `paid − fee`. */}
              <Text variant="headingCta" color="textPrimary" align="right">
                {cancelled.refundAmount}
              </Text>
            </View>

            <RefundDestinationRow
              destination={cancelled.refundDestination}
              timeframe={cancelled.refundTimeframe}
              testID="auto-cancelled-destination"
            />
          </View>
        </NoticeCard>
      </View>

      <View style={styles.rebook} testID="auto-cancelled-rebook">
        <PromptBlock
          title={cancelled.rebookPrompt}
          titleVariant="titleRebook"
          testID="auto-cancelled-prompt"
        />

        {/* `201:92` draws both answers unconditionally; an unwired host gets inert buttons. */}
        <View style={styles.rebookActions}>
          <Button
            label={cancelled.rebookDeclineLabel}
            onPress={onDeclineRebook ?? noop}
            variant="secondary"
            size="bar"
            fullWidth={false}
            style={[styles.rebookButton, styles.declineOutline]}
            testID="auto-cancelled-decline"
          />
          <Button
            label={cancelled.rebookAcceptLabel}
            onPress={onRebook ?? noop}
            variant="bright"
            size="bar"
            fullWidth={false}
            style={styles.rebookButton}
            testID="auto-cancelled-accept"
          />
        </View>
      </View>
    </View>
  );
}

function noop() {
  // Intentionally inert: neither rebook answer has a designed destination yet.
}

const styles = StyleSheet.create({
  /** `201:65` — 22pt between the hero, the summary and the refund block. */
  container: { gap: 22 },
  /** `201:512` — the same `#FFF7CC` table Confirmation uses (`3:1095`). */
  summary: {
    padding: 19.889,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
    ...lightTheme.elevation.soft,
  },
  /** `201:478` — 16pt between the apology and the refund card. */
  refund: { gap: lightTheme.space.lg },
  /** `201:550` — 9pt apart, 6pt of vertical padding. */
  refundFigures: { gap: 9, paddingVertical: lightTheme.space.s6 },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  /** `201:477` — 10pt between the prompt and the answers, 6pt of vertical padding. */
  rebook: { gap: lightTheme.space.s10, paddingVertical: lightTheme.space.s6 },
  /** `201:92` — two 162 × 34 buttons at a 15pt radius, 10pt apart. */
  rebookActions: { flexDirection: 'row', gap: lightTheme.space.s10 },
  rebookButton: { flex: 1, maxWidth: 162 },
  /** `201:93` — outlined in `#FFDE33`, not the shared slate border. */
  declineOutline: { borderColor: lightTheme.colors.borderCtaSoft },
});
