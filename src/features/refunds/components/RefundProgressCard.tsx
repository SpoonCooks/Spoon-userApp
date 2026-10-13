import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { RefundStatus, RefundStepView, RefundTrackerView } from '../adapters';

const ART = {
  /** `827:115` Icon/Lock, 24pt. */
  lock: require('../../../../assets/figma/cancel-v2/icon-lock.png'),
  /** `2000:1099` Icon/Check at 12pt, black, on a lime dot. */
  check: require('../../../../assets/figma/cancel-v2/icon-check-tiny.png'),
  /** `2303:4219` — the failed step: a black 20pt dot with a white ✕. */
  failed: require('../../../../assets/figma/refunds/refund-step-failed.png'),
  /** `2303:4084` — the 8 × 4 chevron in the status pill (up while the steps show). */
  chevronUp: require('../../../../assets/figma/refunds/refund-chevron-up.png'),
} as const;

/** What the card draws — the refund itself, wherever it appears. */
export interface RefundProgressView {
  /** "₹299". */
  readonly amount: string;
  /** "Original source", or the method it goes back to. */
  readonly destination: string;
  readonly status: RefundStatus;
  /** Initiated, processed, completed — each with its gateway time once it has happened. */
  readonly steps: readonly RefundStepView[];
  /** "RRN: 664320396937" under the last step, once completed. */
  readonly reference?: string | undefined;
}

/** A refund as the server tracks it, as this card reads it. */
export function refundProgressViewFrom(refund: RefundTrackerView): RefundProgressView {
  return {
    amount: refund.total.amount,
    destination: refund.destination,
    status: refund.status,
    steps: refund.steps,
    reference: refund.reference,
  };
}

const STATUS_LABEL: Record<RefundStatus, string> = {
  in_progress: 'In progress',
  completed: 'Refunded',
  failed: 'Refund failed',
};

interface Row {
  readonly key: string;
  readonly title: string;
  readonly when: string | undefined;
  readonly state: 'done' | 'failed' | 'pending';
}

/** Failed (`2303:4191`): step 2 becomes "Refund didn't go through" with the ✕; step 3 waits. */
function rowsOf(view: RefundProgressView): readonly Row[] {
  const rows = view.steps.map<Row>((step) => ({
    key: step.key,
    title: step.title,
    when: step.when,
    state: step.done ? 'done' : 'pending',
  }));
  if (view.status !== 'failed') return rows;
  return rows.map((row) =>
    row.key === 'processed'
      ? { key: 'failed', title: 'Refund didn’t go through', when: undefined, state: 'failed' }
      : row.key === 'completed'
        ? { ...row, when: undefined, state: 'pending' }
        : row,
  );
}

/**
 * `Refund tracker` — Figma `2303:4231`, four states (dev note beside it): Initiated `2303:4070`,
 * Processed `2303:4107`, Completed `2303:4147`, Failed `2303:4191`. The same card on the cancel
 * sheet (C5) and on Visit details → Payment & refund.
 *
 *   header    a 40pt white well with the lock; "Booking refund ₹X" (SemiBold 16/24) over "To:
 *             <destination>" (Caption at 60 %); the status pill with its chevron — "In progress"
 *             on `#FFF7CC`, "Refunded" on lime `#CFFF04`, "Refund failed" white with a 1pt black
 *             edge. Tapping it folds the steps; they show by default.
 *   divider   1pt black at 12 %
 *   steps     20pt dots, 12pt from the text: done is lime with a black check and the gateway time
 *             under the title; pending is a solid black 15 % dot, its title at 60 %, no time; the
 *             failed step is black with a white ✕. The 2pt line below a done step is black, else
 *             black 15 %. A completed refund's RRN sits under the last step.
 *   failed    a full-width `#FFD600` "Contact support" (48 tall, fully rounded, Bold 16/24)
 *
 * Brand colours only: no red or green anywhere — failure is the ✕ and the outlined pill.
 */
export function RefundProgressCard({
  view,
  onContactSupport,
  testID = 'refund-progress',
}: {
  readonly view: RefundProgressView;
  /** "Contact support" on a failed refund. */
  readonly onContactSupport?: () => void;
  readonly testID?: string;
}) {
  const [open, setOpen] = useState(true);
  const rows = rowsOf(view);

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={styles.well}>
          <Image source={ART.lock} style={styles.icon24} />
        </View>
        <View style={styles.headerText}>
          {/* Wraps rather than dropping the amount where the card sits narrower than 370. */}
          <Text variant="spoonEmphasis">{`Booking refund ${view.amount}`}</Text>
          <Text variant="spoonCaption" color="textSecondarySoft" numberOfLines={1}>
            {`To: ${view.destination}`}
          </Text>
        </View>
        <Pressable
          onPress={() => setOpen((value) => !value)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${STATUS_LABEL[view.status]}, ${open ? 'hide' : 'show'} the steps`}
          hitSlop={lightTheme.space.sm}
          style={[styles.pill, PILL[view.status]]}
          testID={`${testID}-status`}
        >
          <Text variant="spoonCaptionStrong">{STATUS_LABEL[view.status]}</Text>
          <Image
            source={ART.chevronUp}
            style={[styles.chevron, open ? null : styles.chevronDown]}
          />
        </Pressable>
      </View>

      {open ? (
        <>
          <View style={styles.divider} />
          <View testID={`${testID}-steps`}>
            {rows.map((row, index) => {
              const last = index === rows.length - 1;
              return (
                <View key={row.key} style={styles.step} testID={`${testID}-step-${row.key}`}>
                  <View style={[styles.node, last ? null : styles.nodeLinked]}>
                    {row.state === 'done' ? (
                      <View style={[styles.dot, styles.dotDone]}>
                        <Image source={ART.check} style={styles.icon12} />
                      </View>
                    ) : row.state === 'failed' ? (
                      <Image source={ART.failed} style={styles.dot} />
                    ) : (
                      <View style={[styles.dot, styles.dotPending]} />
                    )}
                    {last ? null : (
                      <View
                        style={[
                          styles.connector,
                          row.state === 'done' ? styles.connectorDone : styles.connectorPending,
                        ]}
                      />
                    )}
                  </View>
                  <View style={[styles.stepText, last ? null : styles.stepTextSpaced]}>
                    <Text
                      variant="spoonBodyStrong"
                      color={row.state === 'pending' ? 'textSecondarySoft' : 'textPrimary'}
                    >
                      {row.title}
                    </Text>
                    {row.state === 'done' && row.when !== undefined ? (
                      <Text variant="spoonCaption" color="textSecondarySoft">
                        {row.when}
                      </Text>
                    ) : null}
                    {last && view.status === 'completed' && view.reference !== undefined ? (
                      <Text variant="spoonCaptionStrong" testID={`${testID}-reference`}>
                        {view.reference}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {view.status === 'failed' && onContactSupport !== undefined ? (
        <Pressable
          onPress={onContactSupport}
          accessibilityRole="button"
          style={styles.support}
          testID={`${testID}-support`}
        >
          <Text variant="spoonButton">Contact support</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const DOT = 20;

const styles = StyleSheet.create({
  /** `2303:4070` — black 3 %, r16, p16, 16 between blocks. */
  card: {
    alignSelf: 'stretch',
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.space.lg,
    backgroundColor: lightTheme.colors.surfaceRefund,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  well: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  icon24: { width: 24, height: 24 },
  icon12: { width: 12, height: 12 },
  headerText: { flex: 1, gap: lightTheme.space.xxs },
  /** `2303:4080` — pl10 / pr8 / py4, fully rounded, 4pt between the label and the chevron. */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingLeft: lightTheme.space.s10,
    paddingRight: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
  },
  chevron: { width: 9.5, height: 5.5 },
  chevronDown: { transform: [{ rotate: '180deg' }] },
  divider: { height: 1, backgroundColor: lightTheme.colors.refundDivider },
  step: { flexDirection: 'row', alignItems: 'stretch', gap: lightTheme.space.md },
  /** The dot over the line into the next step, 2pt apart, 2pt short of the row's end. */
  node: { width: DOT, alignItems: 'center' },
  nodeLinked: { gap: lightTheme.space.xxs, paddingBottom: lightTheme.space.xxs },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  dotDone: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceRatingLime,
  },
  dotPending: { backgroundColor: lightTheme.colors.refundPending },
  connector: { flex: 1, width: 2, borderRadius: 1 },
  connectorDone: { backgroundColor: lightTheme.colors.textPrimary },
  connectorPending: { backgroundColor: lightTheme.colors.refundPending },
  stepText: { flex: 1, gap: lightTheme.space.xxs },
  /** `2303:4092` — 14pt under a step's text before the next. */
  stepTextSpaced: { paddingBottom: 14 },
  /** `2303:4229` — `#FFD600`, 48 tall, fully rounded, `Elevation/1`. */
  support: {
    alignSelf: 'stretch',
    minHeight: 48,
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceCta,
    boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 3, color: 'rgba(0,0,0,0.08)' }],
  },
});

const PILL = StyleSheet.create({
  in_progress: { backgroundColor: lightTheme.colors.surfaceAccent },
  completed: { backgroundColor: lightTheme.colors.surfaceRatingLime },
  failed: {
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderColor: lightTheme.colors.textPrimary,
  },
});
