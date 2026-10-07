import { Fragment } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { CalendarDayKind, DayVisit } from '../../data/calendar';
import {
  CALENDAR_CHEVRON_RIGHT,
  VISIT_CANCELLED_GLYPH,
  VISIT_DONE_GLYPH,
  VISIT_PENDING_GLYPH,
} from './assets';

/**
 * `Date pop-up` — Figma `1006:323` (past), `1006:527` (today), `1006:727` (upcoming); shown open
 * on the calendar as `1357:1898` in `1354:1543`.
 *
 * A 310pt white card: 1pt `#FFD600` edge, 20pt radius, pt 16 / px 16 / pb 12, 4 between blocks,
 * and a `0 8 24 rgba(153,128,0,0.18)` drop. A header (date · plan line, pb 4), then one row per
 * visit. PAST days divide their rows with a 1pt `#FFEF99` rule and have no action; TODAY and
 * UPCOMING days list without rules and end on a pale-yellow "Close" pill (`1006:542`).
 */
export interface DayVisitsPopupProps {
  readonly heading: string;
  readonly planLabel: string;
  readonly kind: Exclude<CalendarDayKind, 'none'>;
  readonly visits: readonly DayVisit[];
  readonly onOpenVisit?: ((visit: DayVisit) => void) | undefined;
  readonly onClose?: (() => void) | undefined;
  readonly onLayout?: ((event: LayoutChangeEvent) => void) | undefined;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function DayVisitsPopup({
  heading,
  planLabel,
  kind,
  visits,
  onOpenVisit,
  onClose,
  onLayout,
  style,
  testID = 'day-visits-popup',
}: DayVisitsPopupProps) {
  const isPast = kind === 'past';

  return (
    <View
      style={[styles.card, style]}
      onLayout={onLayout}
      // Swallows taps on the card itself so they don't reach the "tap blank area" deselect.
      onStartShouldSetResponder={() => true}
      testID={testID}
    >
      <View style={styles.header}>
        <Text variant="calendarPopupTitle" color="textPrimary" numberOfLines={1}>
          {heading}
        </Text>
        <Text variant="recurringMeta" color="textRecurringMeta" numberOfLines={1}>
          {planLabel}
        </Text>
      </View>

      {visits.map((visit, index) => (
        <Fragment key={visit.id}>
          {isPast && index > 0 ? <View style={styles.divider} /> : null}
          <VisitRow
            visit={visit}
            onPress={onOpenVisit ? () => onOpenVisit(visit) : undefined}
            testID={`${testID}-${visit.id}`}
          />
        </Fragment>
      ))}

      {isPast ? null : (
        <View style={styles.actions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={styles.close}
            testID={`${testID}-close`}
          >
            <Text variant="spoonButton" color="textPrimary">
              Close
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/**
 * `Visit/*` — `1354:1749` Completed, `1354:1772` Cancelled, `1354:1849` upcoming / unassigned.
 * A 36pt glyph disc, the title / status pair (2 apart) and a 20pt chevron, 12 apart, py 8. An
 * unassigned visit adds the `1006:740` "Cook pending" card 8 below its row.
 */
function VisitRow({
  visit,
  onPress,
  testID,
}: {
  readonly visit: DayVisit;
  readonly onPress?: (() => void) | undefined;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${visit.title}. ${visit.meta}`}
      style={styles.visit}
      testID={testID}
    >
      <View style={styles.visitLine}>
        <VisitGlyph status={visit.status} />
        <View style={styles.visitText}>
          <Text variant="calendarVisitTitle" color="textPrimary" numberOfLines={1}>
            {visit.title}
          </Text>
          <Text variant="recurringMeta" color="textRecurringMeta" numberOfLines={1}>
            {visit.meta}
          </Text>
        </View>
        <Image source={CALENDAR_CHEVRON_RIGHT} style={styles.chevron} />
      </View>

      {visit.pool ? (
        <View style={styles.pool}>
          <View style={styles.poolAvatars}>
            {(visit.pool.photos ?? []).map((photo, index) => (
              <Image
                key={index}
                source={photo}
                style={[styles.poolPhoto, index > 0 ? styles.poolPhotoOverlap : null]}
              />
            ))}
          </View>
          <View style={styles.visitText}>
            <Text variant="calendarPoolTitle" color="textPrimary" numberOfLines={1}>
              {visit.pool.title}
            </Text>
            <Text variant="recurringMeta" color="textRecurringMeta" numberOfLines={1}>
              {visit.pool.subtitle}
            </Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

/** `1354:1707` Glyph/done, `1354:1717` Glyph/cancelled, `1354:1835` Glyph/pending. */
function VisitGlyph({ status }: { readonly status: DayVisit['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <View style={[styles.glyph, styles.glyphDone]}>
          <Image source={VISIT_DONE_GLYPH} style={styles.glyphIcon} />
        </View>
      );
    case 'cancelled':
      return (
        <View style={[styles.glyph, styles.glyphCancelled]}>
          <Image source={VISIT_CANCELLED_GLYPH} style={styles.glyphClose} />
        </View>
      );
    case 'unassigned':
      return (
        <View style={[styles.glyph, styles.glyphPending]}>
          <Image source={VISIT_PENDING_GLYPH} style={styles.glyphIcon} />
        </View>
      );
  }
}

export const DAY_POPUP_WIDTH = 310;

const styles = StyleSheet.create({
  card: {
    width: DAY_POPUP_WIDTH,
    gap: lightTheme.space.xs,
    paddingTop: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.lg,
    paddingBottom: lightTheme.space.md,
    borderRadius: lightTheme.radius.r20,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderNotice,
    backgroundColor: lightTheme.colors.surface,
    boxShadow: [
      { offsetX: 0, offsetY: 8, blurRadius: 24, color: lightTheme.colors.shadowCalendarPopup },
    ],
  },
  /** `1006:324` — 24 tall: a 20pt line plus pb 4. */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.sm,
    paddingBottom: lightTheme.space.xs,
  },
  divider: { height: 1, backgroundColor: lightTheme.colors.borderAccent },
  visit: { gap: lightTheme.space.sm, paddingVertical: lightTheme.space.sm },
  visitLine: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  visitText: { flex: 1, gap: lightTheme.space.xxs },
  chevron: { width: 20, height: 20 },
  glyph: {
    width: 36,
    height: 36,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphDone: { backgroundColor: lightTheme.colors.surfacePositiveBright },
  glyphCancelled: { backgroundColor: lightTheme.colors.surfaceAccent },
  glyphPending: {
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.borderNotice,
  },
  glyphIcon: { width: 20, height: 20 },
  glyphClose: { width: 18, height: 18 },
  /** `1006:740` — 52 tall, px 12 / py 10, 16pt radius, 12 gap. */
  pool: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s10,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** `1354:1844` — three 24pt photos, each pulled 12 under the next: 48 × 24. */
  poolAvatars: { flexDirection: 'row' },
  poolPhoto: { width: 24, height: 24, borderRadius: 12 },
  poolPhotoOverlap: { marginLeft: -12 },
  actions: { paddingTop: lightTheme.space.sm },
  /** `1006:542` — a `#FFEF99` pill, min 48 tall, px 16 / py 12. */
  close: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
});
