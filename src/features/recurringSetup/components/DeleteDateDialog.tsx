import { Image, StyleSheet, View } from 'react-native';

import { Button, Dialog, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import { COOK_VISIT_ICON } from '../art';
import { TIME_OF_DAY_BANDS, durationMinutes, formatStartTime, selectedDayLabel } from '../data';
import type { RecurringVisitChoice } from '../types';

/**
 * "Delete this date from Plan N?" — Figma `586:4373` (on `586:4315`).
 *
 * The cook badge, the question, the date as the Selected days grid draws it, the visit booked on
 * it as tags, then "Keep date" and the outlined "Delete date".
 */
export interface DeleteDateDialogProps {
  readonly visible: boolean;
  /** 1-based. */
  readonly planNumber: number;
  readonly dayId: string;
  /** The visit booked on the date. */
  readonly visit: RecurringVisitChoice;
  readonly onKeep: () => void;
  readonly onDelete: () => void;
  readonly testID?: string;
}

export function DeleteDateDialog({
  visible,
  planNumber,
  dayId,
  visit,
  onKeep,
  onDelete,
  testID = 'recurring-delete-date',
}: DeleteDateDialogProps) {
  const { weekday, day } = selectedDayLabel(dayId);
  const band = TIME_OF_DAY_BANDS.find((entry) => entry.id === visit.timeOfDay);
  const tags = [
    band?.label ?? '',
    `${durationMinutes(visit.durationId)} minutes`,
    formatStartTime(visit.startMinutes),
  ];
  return (
    <Dialog visible={visible} onClose={onKeep} testID={testID}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Image source={COOK_VISIT_ICON} style={styles.badgeIcon} />
        </View>
        <Text variant="headingSection" color="textPrimary">
          Delete this date from Plan {planNumber}?
        </Text>
        {/* `586:4378` — one cell of a 7-column, 4-gapped grid across the 306 card. */}
        <View style={styles.dateRow}>
          {Array.from({ length: DATE_COLUMNS }, (_, column) =>
            column === 0 ? (
              <View key="date" style={styles.dateCell}>
                <Text variant="microSemibold" color="textPrimary" align="center">
                  {weekday}
                </Text>
                <Text variant="bodyLarge" color="textPrimary" align="center">
                  {day}
                </Text>
              </View>
            ) : (
              <View key={`empty-${column}`} style={styles.dateCell} />
            ),
          )}
        </View>
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text variant="body" color="textPrimary">
                {tag}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.actions}>
          <Button
            label="Keep date"
            onPress={onKeep}
            size="pillLg"
            flat
            labelColor="textPrimary"
            style={styles.action}
            testID={`${testID}-keep`}
          />
          <Button
            label="Delete date"
            onPress={onDelete}
            variant="secondary"
            size="pillLg"
            labelColor="textPrimary"
            style={[styles.action, styles.destructive]}
            testID={`${testID}-delete`}
          />
        </View>
      </View>
    </Dialog>
  );
}

const DATE_COLUMNS = 7;
const DATE_GAP = 4;

const styles = StyleSheet.create({
  /** `586:4373` — p 24, 16 between rows, a 24pt radius, `Elevation/3`. */
  card: {
    padding: lightTheme.space.xl,
    gap: lightTheme.space.lg,
    borderRadius: lightTheme.radius.lg,
    backgroundColor: lightTheme.colors.surface,
    boxShadow: innerShadows.elevation3,
  },
  /** `586:4374` — a 48pt `#FFE666` disc around the 24pt cook. */
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceBrandTint,
  },
  badgeIcon: { width: 24, height: 24 },
  dateRow: { flexDirection: 'row', gap: DATE_GAP },
  dateCell: { flex: 1, padding: lightTheme.space.xs, alignItems: 'center' },
  /** `586:4379` — 8 apart. */
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  /** `586:4380` — `#FFF7CC`, px 12 / py 4, an 8pt radius. */
  tag: {
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** `586:4386` — pt 8, 12 between the two. */
  actions: { flexDirection: 'row', gap: lightTheme.space.md, paddingTop: lightTheme.space.sm },
  action: { flex: 1 },
  /** `90:176` — white behind a 1.5pt black edge. */
  destructive: { borderWidth: 1.5, borderColor: lightTheme.colors.borderInk },
});
