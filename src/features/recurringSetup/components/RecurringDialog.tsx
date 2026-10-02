import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Button, Dialog, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import { selectedDayLabel } from '../data';

/**
 * The recurring flow's confirm dialog — Figma `586:4373` (delete date), `542:1534` (delete visit),
 * `542:1669` (delete plan), `542:1746` (start over).
 *
 * A 354 card, p 24, 16 between rows, a 24pt radius and `Elevation/3`: a 48pt `#FFE666` badge,
 * the question, whatever the dialog shows of what is at stake, then the safe choice in gold and
 * the destructive one outlined.
 */
export interface RecurringDialogCardProps {
  /** The 24pt glyph in the badge. */
  readonly icon: ImageSourcePropType;
  readonly title: string;
  /** `542:1753` — a line under the title, 8 below it. */
  readonly body?: string | undefined;
  readonly keepLabel: string;
  readonly confirmLabel: string;
  readonly onKeep: () => void;
  readonly onConfirm: () => void;
  readonly children?: ReactNode;
  readonly testID: string;
}

export interface RecurringDialogProps extends RecurringDialogCardProps {
  readonly visible: boolean;
}

/** The dialog in its own modal (`Dialog`). */
export function RecurringDialog({ visible, ...card }: RecurringDialogProps) {
  return (
    <Dialog visible={visible} onClose={card.onKeep} testID={card.testID}>
      <RecurringDialogCard {...card} />
    </Dialog>
  );
}

/** The card itself, without a modal around it. */
function RecurringDialogCard({
  icon,
  title,
  body,
  keepLabel,
  confirmLabel,
  onKeep,
  onConfirm,
  children,
  testID,
}: RecurringDialogCardProps) {
  return (
    <View style={styles.card} accessibilityViewIsModal testID={testID}>
      <View style={styles.badge}>
        <Image source={icon} style={styles.badgeIcon} />
      </View>
      <View style={styles.text}>
        <Text variant="headingSection" color="textPrimary">
          {title}
        </Text>
        {body === undefined ? null : (
          <Text variant="bodyLarge" color="textSubdued">
            {body}
          </Text>
        )}
      </View>
      {children}
      <View style={styles.actions}>
        <Button
          label={keepLabel}
          onPress={onKeep}
          size="pillLg"
          flat
          labelColor="textPrimary"
          style={styles.action}
          testID={`${testID}-keep`}
        />
        <Button
          label={confirmLabel}
          onPress={onConfirm}
          variant="secondary"
          size="pillLg"
          labelColor="textPrimary"
          style={[styles.action, styles.destructive]}
          testID={`${testID}-confirm`}
        />
      </View>
    </View>
  );
}

/**
 * `547:2624` "Selected days- pop up" — an optional Emphasis "Selected days" over the dates in a
 * 7-column, 4-gapped grid across the 306 card; more than seven wrap.
 */
export function DialogDays({
  dayIds,
  heading = true,
}: {
  readonly dayIds: readonly string[];
  readonly heading?: boolean;
}) {
  const rows: (readonly string[])[] = [];
  for (let index = 0; index < dayIds.length; index += COLUMNS) {
    rows.push(dayIds.slice(index, index + COLUMNS));
  }
  return (
    <View style={styles.days}>
      {heading ? (
        <Text variant="emphasis" color="textPrimary">
          Selected days
        </Text>
      ) : null}
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {Array.from({ length: COLUMNS }, (_, column) => {
              const id = row[column];
              if (id === undefined) return <View key={`empty-${column}`} style={styles.cell} />;
              const { weekday, day } = selectedDayLabel(id);
              return (
                <View key={id} style={styles.cell}>
                  <Text variant="microSemibold" color="textPrimary" align="center">
                    {weekday}
                  </Text>
                  <Text variant="bodyLarge" color="textPrimary" align="center">
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

/** `586:4379` — `#FFF7CC` tags, px 12 / py 4 at an 8pt radius, Caption 12/16; 8 apart. */
export function DialogTags({ tags }: { readonly tags: readonly string[] }) {
  return (
    <View style={styles.tags}>
      {tags.map((tag, index) => (
        <View key={`${tag}-${index}`} style={styles.tag}>
          <Text variant="body" color="textPrimary">
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * `542:1678` — 48pt rows ruled in `#FFEF99`: a Body Strong label on the left, a 60 % Caption
 * detail on the right.
 */
export function DialogRows({
  rows,
}: {
  readonly rows: readonly { readonly label: string; readonly detail: string }[];
}) {
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text variant="bodyLargeStrong" color="textPrimary">
            {row.label}
          </Text>
          <Text variant="body" color="textSubdued">
            {row.detail}
          </Text>
        </View>
      ))}
    </View>
  );
}

const COLUMNS = 7;

const styles = StyleSheet.create({
  /** `586:4373` — p 24, 16 between rows, a 24pt radius, `Elevation/3`. */
  card: {
    padding: lightTheme.space.xl,
    gap: lightTheme.space.lg,
    borderRadius: lightTheme.radius.lg,
    backgroundColor: lightTheme.colors.surface,
    boxShadow: innerShadows.elevation3,
  },
  /** `586:4374` — a 48pt `#FFE666` disc around the 24pt glyph. */
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceBrandTint,
  },
  badgeIcon: { width: 24, height: 24 },
  /** `542:1751` — 8 between the title and the line under it. */
  text: { gap: lightTheme.space.sm },
  /** `547:2624` — 8 between "Selected days" and the dates. */
  days: { gap: lightTheme.space.sm },
  grid: { gap: 4 },
  gridRow: { flexDirection: 'row', gap: 4 },
  cell: { flex: 1, padding: lightTheme.space.xs, alignItems: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  tag: {
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  list: {},
  row: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.surfaceAccentStrong,
  },
  /** `586:4386` — pt 8, 12 between the two. */
  actions: { flexDirection: 'row', gap: lightTheme.space.md, paddingTop: lightTheme.space.sm },
  action: { flex: 1 },
  /** `90:176` — white behind a 1.5pt black edge. */
  destructive: { borderWidth: 1.5, borderColor: lightTheme.colors.borderInk },
});
