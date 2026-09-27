import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Screen, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RecurringFooter } from '../components/RecurringFooter';
import { buildDemoPlanConfirmation } from '../data';

/**
 * Recurring setup — Step 6 "Plan confirmed".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state `2i`
 * ("Step 6 · Plan confirmed"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md. Figma
 * `ZIJf639gTWHXshaa2YOeCT` frame `4:2005` (`2i`) — an import of that wireframe. Layout, sizes,
 * copy AND colours follow it, as on Steps 1–5. Its grey circle and grey square are placeholders,
 * not assets: each keeps Figma's stone fill and gains a glyph (a check, a calendar), as the back
 * disc on Steps 1–5 gains its arrow.
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
        <RecurringFooter
          layout="stacked"
          label="View my plan"
          onPress={() => onViewPlan?.()}
          testID={`${testID}-view-plan`}
          secondary={
            <Button
              label="Share recipes on WhatsApp"
              onPress={() => onShareRecipes?.()}
              variant="secondary"
              labelVariant="headingBold"
              labelColor="textInk"
              style={styles.shareButton}
              testID={`${testID}-share`}
            />
          }
        />
      }
    >
      <View style={styles.avatar}>
        <Icon name="checkCircle" size={32} color="textInk" />
      </View>
      <Text variant="displayConfirm" color="textInk" align="center" accessibilityRole="header">
        Plan confirmed!
      </Text>
      <Text variant="bodyRelaxed" color="textStone" align="center">
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
          <Icon name="calendar" size={24} color="textStone" />
        </View>
        <View style={styles.firstVisitText}>
          <Text variant="captionStep" color="textStoneCaption">
            First visit
          </Text>
          <Text variant="titleLargeBlack" color="textInk">
            {confirmation.firstVisitDateLabel} · {confirmation.firstVisitTimeLabel}
          </Text>
          <Text variant="captionStep" color="textStoneCaption">
            Cook shared a day before
          </Text>
        </View>
      </Card>

      {/* A plain box, no icon — `NoteCard` always draws one. */}
      <Card tone="muted" padded={false} style={styles.note} testID={`${testID}-note`}>
        <Text variant="bodyLarge" color="textInk">
          Share your usual dishes once - your cook sees them on every visit.
        </Text>
      </Card>
    </Screen>
  );
}

/** `4:2011` — a 20pt gutter (not the app's 16), as on Steps 1–5. */
const GUTTER = 20;

const styles = StyleSheet.create({
  /**
   * `4:2012` — no header; the content opens 36 below the safe area (the frame's 80 less its 44pt
   * status bar), blocks 14 apart.
   */
  body: { paddingHorizontal: GUTTER, paddingTop: 36, gap: 14 },
  /** `4:2014` — a 72pt `#E0DED6` disc, centred. */
  avatar: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceStoneDisc,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `4:2023` — the first-visit card: a 1pt `#CFCDC4` edge, 16 inside it, an 18pt radius: 90. */
  firstVisit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: lightTheme.space.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderStoneMid,
  },
  /** `4:2024` — the 56pt `#E6E5DF` tile beside it, at a 14pt radius. */
  firstVisitArt: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: lightTheme.colors.surfaceStoneTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstVisitText: { flex: 1 },
  /** `4:2032` — the note: `#F2F1EC`, 14 padding, a 14pt radius. */
  note: { padding: 14, borderRadius: 14, backgroundColor: lightTheme.colors.surfaceStoneSoft },
  /** `4:2037` — the share button: 50 tall, a 1pt `#CFCDC4` edge, a 16pt radius, white. */
  shareButton: {
    height: 50,
    paddingVertical: 0,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderStoneMid,
  },
});
