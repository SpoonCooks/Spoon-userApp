import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Icon, NoteCard, Screen, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { buildDemoPlanConfirmation } from '../data';

/**
 * Recurring setup — Step 6 "Plan confirmed".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state 2i
 * ("Step 6 · Plan confirmed"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md — a wireframe, not a
 * pixel-accurate mock; the wireframe's grey circle avatar is a placeholder rather than a real
 * asset, so this renders a check glyph on the brand lime instead. No `ScreenHeader` / back
 * control: this is a terminal, confirmed-transaction screen, the same reason the real booking
 * Confirmation screen (`ConfirmationBody`) draws none either.
 *
 * STATIC ONLY, per task: the plan summary is local fixture data (`buildDemoPlanConfirmation`) —
 * this step has nothing to read yet, since it isn't wired to the earlier steps. There is no
 * WhatsApp share glyph asset for this new feature (unlike `ConfirmationBody`'s exported PNG), so
 * "Share recipes on WhatsApp" is a plain labelled button rather than one with an icon.
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
    <Screen scroll tone="plain" testID={testID}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Icon name="checkCircle" size={32} color="textOnAccent" />
        </View>
        <Text variant="headingLarge" color="textPrimary" align="center" accessibilityRole="header">
          Plan confirmed!
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {confirmation.visitsCount} visits over {confirmation.daysCount} days ·{' '}
          {confirmation.rangeLabel}
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          Autopay on · {confirmation.autopayMethodLabel}
        </Text>
      </View>

      <Card tone="surface" testID={`${testID}-first-visit`}>
        <Text variant="caption" color="textSecondary">
          First visit
        </Text>
        <Text variant="bodyStrong" color="textPrimary" style={styles.firstVisitTime}>
          {confirmation.firstVisitDateLabel} · {confirmation.firstVisitTimeLabel}
        </Text>
        <Text variant="caption" color="textSecondary">
          Cook shared a day before
        </Text>
      </Card>

      <NoteCard
        body="Share your usual dishes once — your cook sees them on every visit."
        testID={`${testID}-note`}
      />

      <View style={styles.actions}>
        <Button
          label="View my plan"
          onPress={() => onViewPlan?.()}
          testID={`${testID}-view-plan`}
        />
        <Button
          label="Share recipes on WhatsApp"
          onPress={() => onShareRecipes?.()}
          variant="secondary"
          testID={`${testID}-share`}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: lightTheme.space.xs },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.accentSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: lightTheme.space.xs,
  },
  firstVisitTime: { marginVertical: lightTheme.space.xxs },
  actions: { gap: lightTheme.space.sm },
});
