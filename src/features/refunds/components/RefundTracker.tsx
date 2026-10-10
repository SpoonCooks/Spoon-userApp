import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, Text } from '@ui';
import type { ColorToken } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { RefundBreakdownLine, RefundStatus, RefundTrackerView } from '../adapters';

/**
 * The refund tracker card (DEC-090, handoff §B) — one card for every refund, one-time or Recurring.
 *
 * Header (what was refunded, when, and who cancelled), the breakdown (one of three versions), then
 * the refund itself: amount, destination and status, which opens on the three-step stepper. The
 * bank's reference appears only once the refund is completed. A failed refund replaces the
 * reference with "Refund didn't go through" and a Contact support button; why it failed is never
 * shown.
 */
export interface RefundTrackerProps {
  readonly refund: RefundTrackerView;
  /** "Contact support" on a failed refund — WhatsApp, prefilled with `refund.supportMessage`. */
  readonly onContactSupport: (message: string) => void;
  readonly testID?: string;
}

const STATUS_COLOR: Record<RefundStatus, ColorToken> = {
  in_progress: 'textReschedule',
  completed: 'textSuccess',
  failed: 'danger',
};

export function RefundTracker({
  refund,
  onContactSupport,
  testID = 'refund-tracker',
}: RefundTrackerProps) {
  const [open, setOpen] = useState(true);

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="spoonHeading" color="textPrimary">
            {refund.title}
          </Text>
          <Text variant="spoonCaption" color="textSecondarySoft">
            {refund.date}
          </Text>
          {refund.recurringLine === undefined ? null : (
            <Text variant="spoonCaption" color="textSecondarySoft" testID={`${testID}-recurring`}>
              {refund.recurringLine}
            </Text>
          )}
        </View>
        {refund.cancelledBy === undefined ? null : (
          <View style={styles.tag} testID={`${testID}-cancelled-by`}>
            <Text variant="spoonCaptionStrong" color="textPrimary">
              {refund.cancelledBy}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.breakdown} testID={`${testID}-breakdown-${refund.breakdownKind}`}>
        {refund.breakdown.map((line) => (
          <BreakdownLine key={line.label} line={line} />
        ))}
        <View style={styles.rule} />
        <View style={styles.line}>
          <Text variant="spoonBodyStrong" color="textPrimary" style={styles.label}>
            {refund.total.label}
          </Text>
          <Text variant="spoonBodyStrong" color="textPrimary">
            {refund.total.amount}
          </Text>
        </View>
      </View>

      <View style={styles.status}>
        <Pressable
          onPress={() => setOpen((value) => !value)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${refund.statusLabel}, ${open ? 'hide' : 'show'} progress`}
          style={styles.statusRow}
          testID={`${testID}-toggle`}
        >
          <View style={styles.label}>
            <Text variant="spoonBodyStrong" color="textPrimary">
              {`Booking refund ${refund.total.amount}`}
            </Text>
            <Text variant="spoonCaption" color="textSecondarySoft">
              {`To: ${refund.destination}`}
            </Text>
          </View>
          <Text
            variant="spoonCaptionStrong"
            color={STATUS_COLOR[refund.status]}
            testID={`${testID}-status`}
          >
            {refund.statusLabel}
          </Text>
          <View style={open ? styles.chevronOpen : undefined}>
            <Icon name="down" size={16} color="textSecondarySoft" />
          </View>
        </Pressable>

        {open ? (
          <View style={styles.steps} testID={`${testID}-steps`}>
            {refund.steps.map((step, index) => (
              <View key={step.key} style={styles.step}>
                <View style={styles.rail}>
                  <View style={[styles.node, step.done ? styles.nodeDone : styles.nodePending]}>
                    {step.done ? <Icon name="check" size={12} color="textInverse" /> : null}
                  </View>
                  {index < refund.steps.length - 1 ? (
                    <View style={[styles.link, step.done ? styles.linkDone : null]} />
                  ) : null}
                </View>
                <View style={styles.stepText}>
                  <Text
                    variant={step.done ? 'spoonBodyStrong' : 'spoonBody'}
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
            ))}
          </View>
        ) : null}

        {refund.reference === undefined ? null : (
          <Text variant="spoonCaptionStrong" color="textPrimary" testID={`${testID}-reference`}>
            {refund.reference}
          </Text>
        )}

        {refund.status === 'failed' ? (
          <View style={styles.failed} testID={`${testID}-failed`}>
            <Text variant="spoonBodyStrong" color="danger">
              Refund didn&apos;t go through
            </Text>
            <Text variant="spoonCaption" color="textSecondarySoft">
              Our team will help you get your money back.
            </Text>
            <Button
              label="Contact support"
              variant="secondary"
              size="md"
              onPress={() => onContactSupport(refund.supportMessage)}
              testID={`${testID}-support`}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function BreakdownLine({ line }: { readonly line: RefundBreakdownLine }) {
  return (
    <View style={styles.line}>
      <Text variant="spoonBody" color="textPrimary" style={styles.label}>
        {line.label}
      </Text>
      <Text variant="spoonBody" color={line.deducted === true ? 'danger' : 'textPrimary'}>
        {line.amount}
      </Text>
    </View>
  );
}

const NODE = 20;

const styles = StyleSheet.create({
  card: {
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderAccent,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.md },
  headerText: { flex: 1, gap: lightTheme.space.xxs },
  tag: {
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceMuted,
  },
  breakdown: {
    gap: lightTheme.space.md,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  rule: { height: 1, backgroundColor: lightTheme.colors.borderAccent },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  label: { flex: 1, gap: lightTheme.space.xxs },
  status: {
    gap: lightTheme.space.md,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceSubtle,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.sm },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  steps: { gap: 0 },
  step: { flexDirection: 'row', gap: lightTheme.space.md },
  rail: { alignItems: 'center', width: NODE },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: lightTheme.colors.textSuccess },
  nodePending: {
    borderWidth: 2,
    borderColor: lightTheme.colors.borderSubtle,
    backgroundColor: lightTheme.colors.surface,
  },
  link: { flex: 1, width: 2, minHeight: 16, backgroundColor: lightTheme.colors.borderSubtle },
  linkDone: { backgroundColor: lightTheme.colors.textSuccess },
  stepText: { flex: 1, gap: lightTheme.space.xxs, paddingBottom: lightTheme.space.md },
  failed: { gap: lightTheme.space.sm },
});
