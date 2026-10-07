import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { visitDemoModel } from '../../data/visit';
import type { VisitCancelledData } from '../../data/visit';
import {
  VISIT_CALENDAR_CLOSE,
  VISIT_CHEVRON_20,
  VISIT_CLOSE_14,
  VISIT_THREAD_SNIPPED_LEFT,
  VISIT_THREAD_SNIPPED_RIGHT,
} from './assets';

/**
 * `Cook details` · Cancelled — Figma `1466:8451` (component `1466:797`).
 *
 * White, 1pt `#FFD600` edge, 16pt corners, p 16 / 16 gap: the "Visit cancelled" header on a 48pt
 * `#FFF7CC` well, the snipped thread (`1466:734`: a solid yellow thread, a 24pt ✕ well, a dotted
 * grey one) and "Your plan continues" with its 40pt yellow chevron well.
 */
export interface VisitCancelledCardProps {
  /** Defaults to the frame's. No next visit leaves out "Your plan continues". */
  readonly cancelled?: VisitCancelledData;
  readonly onNextVisit?: (() => void) | undefined;
  readonly testID?: string | undefined;
}

const DEMO = visitDemoModel('cancelled');

export function VisitCancelledCard({
  cancelled = DEMO.cancelled,
  onNextVisit,
  testID = 'visit-cancelled-card',
}: VisitCancelledCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <View style={styles.well48}>
          <Image source={VISIT_CALENDAR_CLOSE} style={styles.glyph24} />
        </View>
        <View style={styles.headerText}>
          <Text variant="spoonHeading" color="textPrimary">
            {cancelled.title}
          </Text>
          <Text variant="spoonCaption" color="textSecondarySoft">
            {cancelled.byline}
          </Text>
        </View>
      </View>

      {cancelled.nextVisit === null ? null : (
        <>
          {/* `1466:734` — the snipped thread, 28 tall. */}
          <View style={styles.snip} accessibilityElementsHidden importantForAccessibility="no">
            <Image source={VISIT_THREAD_SNIPPED_LEFT} style={styles.threadLeft} />
            <Image source={VISIT_THREAD_SNIPPED_RIGHT} style={styles.threadRight} />
            <View style={styles.snipWell}>
              <Image source={VISIT_CLOSE_14} style={styles.close} />
            </View>
          </View>

          <Pressable
            onPress={onNextVisit}
            accessibilityRole="button"
            style={styles.plan}
            testID={`${testID}-next-visit`}
          >
            <View style={styles.planText}>
              <Text variant="spoonMicroStrong" color="textSecondarySoft">
                {cancelled.eyebrow}
              </Text>
              <Text variant="spoonBodyStrong" color="textPrimary">
                {cancelled.nextVisit}
              </Text>
            </View>
            <View style={styles.well40}>
              <Image source={VISIT_CHEVRON_20} style={styles.glyph20} />
            </View>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderNotice,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  well48: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  headerText: { flex: 1, gap: lightTheme.space.xs },
  glyph24: { width: 24, height: 24 },
  glyph20: { width: 20, height: 20 },
  snip: { height: 28, overflow: 'hidden' },
  /** `1466:735` — a 152×6.93 box at y 10.54; the stroke-inclusive export is 156×10.93. */
  threadLeft: { position: 'absolute', left: -2, top: 8.54, width: 156.001, height: 10.9261 },
  /** `1466:736` — the same box at the right edge; its export is 154×8.92. */
  threadRight: { position: 'absolute', right: -1, top: 9.54, width: 154.001, height: 8.92194 },
  /** `1466:737` — 24pt white well, 1.5pt black edge, centred (x 158 of 340). */
  snipWell: {
    position: 'absolute',
    top: 2,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  close: { width: 14, height: 14 },
  /** `1466:745` — pl 16 / pr 12 / py 12, 12 gap, 16pt corners. */
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    paddingLeft: lightTheme.space.lg,
    paddingRight: lightTheme.space.md,
    paddingVertical: lightTheme.space.md,
    borderRadius: lightTheme.radius.md,
  },
  planText: { flex: 1, gap: lightTheme.space.xxs },
  well40: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceCta,
  },
});
