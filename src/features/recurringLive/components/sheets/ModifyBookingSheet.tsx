import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { MODIFY_BOOKING_SHEET } from '../../data/sheets';
import type { ModifyBookingSheetData, ModifyBookingStepKind } from '../../data/sheets';
import {
  SHEET_NODE_FEE,
  SHEET_NODE_NOW,
  SHEET_NODE_VISIT,
  SHEET_RECURRING_GLYPH,
  SHEET_THREAD_DASHED,
  SHEET_THREAD_LOOP,
} from './assets';
import { RecurringSheet } from './RecurringSheet';

/**
 * Visit details / assigned · Modify booking sheet — Figma `1433:1537`, sheet `1433:1625`
 * (`cCQlzTeiObQkpVBzwI8mZi`, page `1005:131`). The dimmed Visit details screen behind it is
 * `VisitDetailsScreen`'s; this file draws only the sheet.
 *
 * Below the shared chrome (`RecurringSheet`), top to bottom:
 *   window  `1433:1634` — `#FFF7CC`, p 16, r16, 8pt gap: Body Strong title over the 338 × 74
 *           `1433:1636` thread — three equal steps (pt 16, 20pt node, 4pt gap, label, caption)
 *           with the two thread vectors laid absolutely BEHIND them, node centre to node centre
 *   note    `1433:1665` — centred, 8pt gap: 16pt `Icon/Recurring` + Caption at 60 %
 *   action  `1433:1661` — the `90:180` Destructive button: white, 1.5pt black edge, full pill,
 *           min-h 48, px 16 / py 12, Button 16/24 label → 51pt tall
 *
 * STATIC: copy is fixture data; "Cancel this visit" only reports the press.
 */

export interface ModifyBookingSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Defaults to the frame's. */
  readonly data?: ModifyBookingSheetData;
  readonly onCancelVisit?: () => void;
  readonly testID?: string;
}

const NODE_ART: Record<ModifyBookingStepKind, ImageSourcePropType> = {
  now: SHEET_NODE_NOW,
  fee: SHEET_NODE_FEE,
  visit: SHEET_NODE_VISIT,
};

/** `1433:1636` — the thread row's design width; thread geometry is stated as a share of it. */
const THREAD_ROW_WIDTH = 338;
const pct = (pt: number) => `${(pt / THREAD_ROW_WIDTH) * 100}%` as const;

export function ModifyBookingSheet({
  visible,
  onClose,
  data = MODIFY_BOOKING_SHEET,
  onCancelVisit,
  testID = 'modify-booking-sheet',
}: ModifyBookingSheetProps) {
  return (
    <RecurringSheet
      visible={visible}
      onClose={onClose}
      title={data.title}
      subtitle={data.subtitle}
      testID={testID}
    >
      <View style={styles.window} testID={`${testID}-window`}>
        <Text variant="spoonBodyStrong">{data.windowTitle}</Text>
        <View style={styles.thread}>
          <Image source={SHEET_THREAD_LOOP} style={styles.threadLoop} resizeMode="stretch" />
          <Image source={SHEET_THREAD_DASHED} style={styles.threadDashed} resizeMode="stretch" />
          {data.steps.map((step) => (
            <View key={step.kind} style={styles.step} testID={`${testID}-step-${step.kind}`}>
              <Image source={NODE_ART[step.kind]} style={styles.node} />
              {/* `1433:1655` — the Visit step's label is Micro Strong 10/14, the others 12/16. */}
              <Text
                variant={step.kind === 'visit' ? 'spoonMicroStrong' : 'spoonCaptionStrong'}
                align="center"
                style={styles.stepText}
              >
                {step.title}
              </Text>
              <Text
                variant="spoonMicro"
                color="textSecondarySoft"
                align="center"
                style={styles.stepText}
              >
                {step.caption}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.note}>
        <Image source={SHEET_RECURRING_GLYPH} style={styles.noteGlyph} />
        <Text variant="spoonCaption" color="textSecondarySoft">
          {data.note}
        </Text>
      </View>

      <Pressable
        onPress={onCancelVisit}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cancel, pressed ? styles.pressed : null]}
        testID={`${testID}-cancel`}
      >
        <Text variant="spoonButton">{data.cancelLabel}</Text>
      </Pressable>
    </RecurringSheet>
  );
}

const styles = StyleSheet.create({
  /** `1433:1634` — `color/surface/subtle`, p 16, r16, 8pt gap. */
  window: {
    alignSelf: 'stretch',
    backgroundColor: lightTheme.colors.surfaceAccent,
    borderRadius: lightTheme.radius.md,
    padding: lightTheme.space.lg,
    gap: lightTheme.space.sm,
  },
  /** `1433:1636` — three equal columns; overflow clipped as in the frame. */
  thread: { flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden' },
  /**
   * `1433:1658` — box 113 × 21 at (56, 5); its 2pt stroke spills 2pt each side, so the export is
   * 117 × 25 at (54, 3). It ends on the fee node's centre line (y 26).
   */
  threadLoop: {
    position: 'absolute',
    left: pct(54),
    top: 3,
    width: pct(117),
    height: 25,
  },
  /** `1433:1657` — box 112.67 × 0 at (169, 26); 1pt stroke spill → 114.67 × 2 at (168, 25). */
  threadDashed: {
    position: 'absolute',
    left: pct(168),
    top: 25,
    width: pct(114.67),
    height: 2,
  },
  /** `1433:1637` — pt 16, 4pt gap, centred. */
  step: {
    flex: 1,
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingTop: lightTheme.space.lg,
  },
  node: { width: 20, height: 20 },
  stepText: { alignSelf: 'stretch' },
  /** `1433:1665` — centred, 8pt gap. */
  note: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.sm,
  },
  noteGlyph: { width: 16, height: 16 },
  /** `90:176` Destructive — white, 1.5pt black edge, full pill, min-h 48, px 16 / py 12. */
  cancel: {
    alignSelf: 'stretch',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.borderRecurringStrong,
    backgroundColor: lightTheme.colors.surface,
  },
  pressed: { opacity: 0.85 },
});
