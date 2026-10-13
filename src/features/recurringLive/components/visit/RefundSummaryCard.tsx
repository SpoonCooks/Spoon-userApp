import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { visitDemoModel } from '../../data/visit';
import type { VisitRefundData, VisitRefundLine, VisitRefundTracker } from '../../data/visit';
import {
  VISIT_MONEY_24,
  VISIT_REFUND_CHECK,
  VISIT_REFUND_CHEVRON_UP,
  VISIT_REFUND_LOCK,
  VISIT_REFUND_NODE,
  VISIT_STITCH_HORIZONTAL,
} from './assets';

/**
 * `Payment summary · Cancelled` — Figma `1670:3461` (in `1466:8446`), Status = Refunded.
 *
 * White, 1pt `#FFEF99` edge, 16pt corners, p 16 / 16 gap: the header (40pt `#FFE666` money well,
 * "Payment & refund", the lime `Refunded` badge `90:182`); the `#FFF7CC` breakdown (amount paid,
 * the Caption GST and cancellation-fee lines, a yellow stitch, the refund total in
 * `Spoon/Display`); then where the refund went and its timeline, ending on the 5–7 days note.
 *
 * Cancelled by Spoon (`2342:4201`): the badge is Neutral ("Refund started") and the grey
 * `Refund tracker` (`2303:4071`) takes the place of the refund mode and timeline.
 */
export interface RefundSummaryCardProps {
  /** Defaults to the frame's. A value the backend does not give (refund id, mode) is left out. */
  readonly refund?: VisitRefundData;
  readonly testID?: string | undefined;
}

const DEMO = visitDemoModel('cancelled');
const DEMO_REFUND = DEMO.refund!;

export function RefundSummaryCard({
  refund = DEMO_REFUND,
  testID = 'visit-refund-summary',
}: RefundSummaryCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={styles.well}>
          <Image source={VISIT_MONEY_24} style={styles.glyph24} />
        </View>
        <View style={styles.headerText}>
          <Text variant="spoonHeading" color="textPrimary">
            {refund.title}
          </Text>
          {refund.booking === undefined ? null : (
            <Text variant="spoonCaption" color="textSecondarySoft">
              {refund.booking}
            </Text>
          )}
        </View>
        <View style={[styles.badge, refund.badgeTone === 'neutral' && styles.badgeNeutral]}>
          <Text variant="spoonCaptionStrong" color="textPrimary">
            {refund.badge}
          </Text>
        </View>
      </View>

      <View style={styles.breakdown}>
        {refund.lines.map((line) => (
          <Line key={line.label} line={line} />
        ))}
        <Image source={VISIT_STITCH_HORIZONTAL} style={styles.stitch} resizeMode="stretch" />
        <View style={styles.line}>
          <View style={styles.label}>
            <Text variant="spoonEmphasis" color="textPrimary">
              {refund.total.label}
            </Text>
            <Text variant="spoonCaption" color="textSecondarySoft">
              {refund.total.detail}
            </Text>
          </View>
          <View style={[styles.price, styles.priceEnd]}>
            {refund.total.was === undefined ? null : (
              <Text variant="spoonBody" color="textSecondarySoft" style={styles.struck}>
                {refund.total.was}
              </Text>
            )}
            <Text variant="spoonDisplay" color="textPrimary">
              {refund.total.amount}
            </Text>
          </View>
        </View>
      </View>

      {refund.tracker !== undefined ? (
        <RefundTrackerBlock tracker={refund.tracker} testID={`${testID}-tracker`} />
      ) : (
        <View style={styles.status}>
          <View style={styles.mode}>
            {refund.mode === undefined ? null : (
              <View style={styles.modeText}>
                <Text variant="spoonMicroStrong" color="textSecondarySoft">
                  {refund.modeEyebrow}
                </Text>
                <Text variant="spoonBodyStrong" color="textPrimary">
                  {refund.mode}
                </Text>
              </View>
            )}
            {refund.refundId === undefined ? null : (
              <View style={styles.refundId}>
                <Text variant="spoonMicroStrong" color="textSecondarySoft">
                  {refund.idEyebrow}
                </Text>
                <Text variant="spoonCaptionStrong" color="textPrimary">
                  {refund.refundId}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.timeline}>
            {refund.steps.map((step) => (
              <View key={step.title} style={styles.step}>
                <Image source={VISIT_REFUND_NODE} style={styles.node} />
                <View style={styles.stepText}>
                  <Text variant={step.note ? 'spoonBody' : 'spoonBodyStrong'} color="textPrimary">
                    {step.title}
                  </Text>
                  {step.when === undefined ? null : (
                    <Text variant="spoonCaption" color="textSecondarySoft">
                      {step.when}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * `Refund tracker` — `2303:4071` as drawn in `2342:4234`. On `rgba(0,0,0,0.03)`, p 16 / 16 gap,
 * 16pt corners: a 40pt white well with the lock, "Booking refund ₹299" (Emphasis) over
 * "To: Original source", the `#FFF7CC` status pill (pl 10 / pr 8 / py 4, 4 gap) whose chevron
 * folds the steps away; a 1pt divider at 12%; then the three steps — a 20pt dot (lime with the
 * check once done, 15% ink until then) on a 2pt connector, the text 12 to the right with 14
 * under it.
 */
function RefundTrackerBlock({
  tracker,
  testID,
}: {
  readonly tracker: VisitRefundTracker;
  readonly testID: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.tracker} testID={testID}>
      <View style={styles.header}>
        <View style={styles.trackerWell}>
          <Image source={VISIT_REFUND_LOCK} style={styles.glyph24} />
        </View>
        <View style={styles.headerText}>
          {/* One line, as the frame draws it (`I2342:4234;2303:4078`, no wrap). */}
          <Text
            variant="spoonEmphasis"
            color="textPrimary"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {tracker.title}
          </Text>
          <Text variant="spoonCaption" color="textSecondarySoft">
            {tracker.destination}
          </Text>
        </View>
        <Pressable
          onPress={() => setOpen((value) => !value)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${tracker.status}, ${open ? 'hide' : 'show'} progress`}
          style={styles.trackerStatus}
          testID={`${testID}-toggle`}
        >
          <Text variant="spoonCaptionStrong" color="textPrimary">
            {tracker.status}
          </Text>
          <Image
            source={VISIT_REFUND_CHEVRON_UP}
            style={[styles.chevron, open ? null : styles.chevronClosed]}
          />
        </Pressable>
      </View>
      {open ? (
        <>
          <View style={styles.divider} />
          <View testID={`${testID}-steps`}>
            {tracker.steps.map((step, index) => {
              const last = index === tracker.steps.length - 1;
              return (
                <View key={step.title} style={styles.trackerStep}>
                  <View style={[styles.trackerNode, last ? null : styles.trackerNodeLinked]}>
                    {step.done ? (
                      <View style={styles.dotDone}>
                        <Image source={VISIT_REFUND_CHECK} style={styles.glyph12} />
                      </View>
                    ) : (
                      <View style={[styles.dot, styles.faint]} />
                    )}
                    {last ? null : (
                      <View style={[styles.connector, step.done ? null : styles.faint]} />
                    )}
                  </View>
                  <View style={[styles.trackerText, last ? null : styles.trackerTextSpaced]}>
                    <Text
                      variant="spoonBodyStrong"
                      color={step.done ? 'textPrimary' : 'textSecondarySoft'}
                    >
                      {step.title}
                    </Text>
                    {step.when === undefined ? null : (
                      <Text variant="spoonCaption" color="textSecondarySoft">
                        {step.when}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

/**
 * `1670:3470` — a breakdown line: label over detail, the amount at the right. A minor line
 * (`1670:3514` GST, `1670:3477` cancellation fee) is one Caption row, label and amount in ink.
 */
function Line({ line }: { readonly line: VisitRefundLine }) {
  if (line.minor) {
    return (
      <View style={styles.line}>
        <Text variant="spoonCaption" color="textPrimary" style={styles.label}>
          {line.label}
        </Text>
        <Text variant="spoonCaption" color="textPrimary">
          {line.amount}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.line}>
      <View style={styles.label}>
        <Text variant="spoonBody" color="textPrimary">
          {line.label}
        </Text>
        {line.detail === undefined ? null : (
          <Text variant="spoonCaption" color="textSecondarySoft">
            {line.detail}
          </Text>
        )}
      </View>
      <View style={styles.price}>
        {line.was === undefined ? null : (
          <Text variant="spoonCaption" color="textSecondarySoft" style={styles.struck}>
            {line.was}
          </Text>
        )}
        <Text variant="spoonBodyStrong" color="textPrimary">
          {line.amount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderAccent,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  well: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  glyph24: { width: 24, height: 24 },
  headerText: { flex: 1, gap: lightTheme.space.xxs },
  /** `90:182` — Badge · Positive: px 8 / py 4 on `#CFFF04`, pill. */
  badge: {
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfacePositiveBright,
  },
  /** `90:187` — Badge · Neutral: the same pill on `#FFF7CC`. */
  badgeNeutral: { backgroundColor: lightTheme.colors.surfaceAccent },
  /** `1468:817` — p 16 / 12 gap on `#FFF7CC`, 16pt corners. */
  breakdown: {
    gap: lightTheme.space.md,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  label: { flex: 1, gap: lightTheme.space.xxs },
  price: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.sm },
  /** `1474:2494` — the refund total sits on its baseline row, bottom-aligned. */
  priceEnd: { alignItems: 'flex-end' },
  struck: { textDecorationLine: 'line-through' },
  /** `1468:828` — 306×2 at the frame's width. */
  stitch: { width: '100%', height: 2 },
  /** `1468:835` — 16 between the refund mode and the timeline. */
  status: { gap: lightTheme.space.lg },
  mode: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  modeText: { flex: 1, gap: lightTheme.space.xxs },
  refundId: { alignItems: 'flex-end', gap: lightTheme.space.xxs },
  timeline: { gap: lightTheme.space.md },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.md },
  node: { width: 20, height: 20 },
  stepText: { flex: 1, gap: lightTheme.space.xxs },
  tracker: {
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceSummaryCancelled,
  },
  trackerWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  trackerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingLeft: 10,
    paddingRight: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** An 8×4 box; the stroke-inclusive art overhangs it by 0.75 each side. */
  chevron: { width: 9.5, height: 5.5, marginHorizontal: -0.75, marginVertical: -0.75 },
  chevronClosed: { transform: [{ rotate: '180deg' }] },
  /** `2303:4085` — 1pt of ink at 12%. */
  divider: { height: 1, backgroundColor: lightTheme.colors.textPrimary, opacity: 0.12 },
  trackerStep: { flexDirection: 'row', gap: lightTheme.space.md },
  /** `2303:4088` — the dot over its connector, 2 apart, 2 short of the next step. */
  trackerNode: { alignItems: 'center', gap: lightTheme.space.xxs },
  trackerNodeLinked: { paddingBottom: lightTheme.space.xxs },
  dot: {
    width: 20,
    height: 20,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.textPrimary,
  },
  dotDone: {
    width: 20,
    height: 20,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfacePositiveBright,
  },
  /** A step not reached yet: its dot and connector in ink at 15%. */
  faint: { opacity: 0.15 },
  connector: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    backgroundColor: lightTheme.colors.textPrimary,
  },
  glyph12: { width: 12, height: 12 },
  trackerText: { flex: 1, gap: lightTheme.space.xxs },
  trackerTextSpaced: { paddingBottom: 14 },
});
