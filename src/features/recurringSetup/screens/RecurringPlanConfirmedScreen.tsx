import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Screen, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { buildDemoPlanConfirmation } from '../data';

/**
 * Recurring setup — Step 6 "Plan confirmed".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state `2i`
 * ("Step 6 · Plan confirmed"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md. Layout, sizes and copy
 * are read off the wireframe's markup; COLOURS are the app's own, as on Steps 1–5. The
 * wireframe's grey circle and grey square are placeholders, not assets: the circle becomes a
 * check on the brand lime, the square a calendar glyph on the app's grey.
 *
 * No `ScreenHeader` / back control: this is a terminal, confirmed-transaction screen, the same
 * reason the booking Confirmation screen (`ConfirmationBody`) draws none. The two buttons sit in
 * the pinned footer, as drawn.
 *
 * STATIC ONLY, per task: the plan summary is fixture data (`buildDemoPlanConfirmation`), and both
 * buttons are left unwired. There is no WhatsApp glyph asset for this feature, so "Share recipes
 * on WhatsApp" is a plain labelled button.
 */

export interface RecurringPlanConfirmedScreenProps {
  readonly onViewPlan?: () => void;
  readonly onShareRecipes?: () => void;
  readonly testID?: string;
}

export function RecurringPlanConfirmedScreen({
  onViewPlan,
  onShareRecipes,
  testID = 'recurring-plan-confirmed-screen',
}: RecurringPlanConfirmedScreenProps) {
  const confirmation = useMemo(() => buildDemoPlanConfirmation(), []);

  return (
    <Screen
      scroll
      showsScrollIndicator={false}
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      footer={
        <View style={styles.footer}>
          <Button
            label="View my plan"
            onPress={() => onViewPlan?.()}
            testID={`${testID}-view-plan`}
          />
          <Button
            label="Share recipes on WhatsApp"
            onPress={() => onShareRecipes?.()}
            variant="secondary"
            labelVariant="headingBold"
            style={styles.shareButton}
            testID={`${testID}-share`}
          />
        </View>
      }
    >
      <View style={styles.avatar}>
        <Icon name="checkCircle" size={32} color="textOnAccent" />
      </View>
      <Text variant="displayConfirm" color="textPrimary" align="center" accessibilityRole="header">
        Plan confirmed!
      </Text>
      <Text variant="bodyRelaxed" color="textSecondary" align="center">
        {confirmation.visitsCount} visits over {confirmation.daysCount} days ·{' '}
        {confirmation.rangeLabel}
        {'\n'}Autopay on · {confirmation.autopayMethodLabel}
      </Text>

      <Card
        tone="surface"
        padded={false}
        style={styles.firstVisit}
        testID={`${testID}-first-visit`}
      >
        <View style={styles.firstVisitArt}>
          <Icon name="calendar" size={24} color="textSecondary" />
        </View>
        <View style={styles.firstVisitText}>
          <Text variant="hint" color="textSecondary">
            First visit
          </Text>
          <Text variant="titleLargeBlack" color="textPrimary">
            {confirmation.firstVisitDateLabel} · {confirmation.firstVisitTimeLabel}
          </Text>
          <Text variant="hint" color="textSecondary">
            Cook shared a day before
          </Text>
        </View>
      </Card>

      {/* A plain box, no icon — `NoteCard` always draws one. */}
      <Card tone="muted" padded={false} style={styles.note} testID={`${testID}-note`}>
        <Text variant="bodyLarge" color="textPrimary">
          Share your usual dishes once - your cook sees them on every visit.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** `2i` — no header; the content opens well down the screen, blocks 14 apart. */
  body: { paddingTop: 58, gap: 14 },
  /** `2i` — a 72pt circle, centred. */
  avatar: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.accentSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `2i` — the first-visit card: 16 padding, an 18pt radius, a 1.5pt edge. */
  firstVisit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: lightTheme.space.lg,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  /** `2i` — the 56pt square beside it, at a 14pt radius. */
  firstVisitArt: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: lightTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstVisitText: { flex: 1 },
  /** `2i` — the note: a grey box, 14 padding, a 14pt radius. */
  note: { padding: 14, borderRadius: 14 },
  /** `2i` — the buttons sit 10 apart, 14 below the content. */
  footer: { gap: lightTheme.space.s10, paddingTop: lightTheme.space.s6 },
  /** `2i` — the share button is 48 tall, not the CTA's 52. */
  shareButton: { paddingVertical: 12 },
});
