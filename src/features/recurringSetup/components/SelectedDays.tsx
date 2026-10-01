import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { EDIT_ICON } from '../art';
import { selectedDayLabel } from '../data';

/**
 * "Selected days" — Figma `340:7094` (Schedule) and `547:2567` (Summary, with the pencil).
 *
 * The heading, then the plan's dates in a 7-column grid, 4 apart, each a 10pt weekday over a 14pt
 * date. More than seven days wrap onto further rows.
 */
export interface SelectedDaysProps {
  readonly dayIds: readonly string[];
  /** `547:2549` — shows the pencil in its 48pt hit area. */
  readonly onEdit?: (() => void) | undefined;
  readonly testID?: string;
}

export function SelectedDays({ dayIds, onEdit, testID }: SelectedDaysProps) {
  const rows: (readonly string[])[] = [];
  for (let index = 0; index < dayIds.length; index += COLUMNS) {
    rows.push(dayIds.slice(index, index + COLUMNS));
  }
  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.header}>
        <Text variant="headingSection" color="textPrimary">
          Selected days
        </Text>
        {onEdit === undefined ? null : (
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit selected days"
            style={styles.edit}
            testID={testID === undefined ? undefined : `${testID}-edit`}
          >
            <Image source={EDIT_ICON} style={styles.editIcon} />
          </Pressable>
        )}
      </View>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
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

const COLUMNS = 7;
const GAP = 4;

const styles = StyleSheet.create({
  /** `340:7094` — 8 between the heading and the grid. */
  section: { gap: lightTheme.space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /** `547:2549` — a 48pt hit area around the 24pt pencil, its right edge on the content's. */
  edit: {
    width: 48,
    height: 48,
    marginVertical: -11,
    marginRight: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: { width: 24, height: 24 },
  grid: { gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
  /** `340:7097` — p 4 around the weekday and the date. */
  cell: { flex: 1, padding: lightTheme.space.xs, alignItems: 'center' },
});
