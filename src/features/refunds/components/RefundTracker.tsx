import { StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { RefundBreakdownLine, RefundTrackerView } from '../adapters';
import { RefundProgressCard, refundProgressViewFrom } from './RefundProgressCard';

/**
 * The refund tracker card (DEC-090, handoff §B) — one card for every refund, one-time or Recurring.
 *
 * Handoff Part 1 A2: header (the visit, its date, who cancelled), the breakdown (one of three
 * versions), then the refund itself — Figma's `Refund tracker` (`2303:4231`, `RefundProgressCard`):
 * the amount, destination and status pill, the three steps (open by default), the RRN once
 * completed, and on a failed refund "Refund didn't go through" with Contact support; why it
 * failed is never shown. Brand colours only — nothing red or green.
 */
export interface RefundTrackerProps {
  readonly refund: RefundTrackerView;
  /** "Contact support" on a failed refund — WhatsApp, prefilled with `refund.supportMessage`. */
  readonly onContactSupport: (message: string) => void;
  readonly testID?: string;
}

export function RefundTracker({
  refund,
  onContactSupport,
  testID = 'refund-tracker',
}: RefundTrackerProps) {
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

      <RefundProgressCard
        view={refundProgressViewFrom(refund)}
        onContactSupport={() => onContactSupport(refund.supportMessage)}
        testID={`${testID}-progress`}
      />
    </View>
  );
}

function BreakdownLine({ line }: { readonly line: RefundBreakdownLine }) {
  if (line.note === true) {
    return (
      <Text variant="spoonBody" color="textSecondarySoft">
        {line.label}
      </Text>
    );
  }
  return (
    <View style={styles.line}>
      <Text variant="spoonBody" color="textPrimary" style={styles.label}>
        {line.label}
      </Text>
      <Text variant="spoonBody" color="textPrimary">
        {line.amount}
      </Text>
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
});
