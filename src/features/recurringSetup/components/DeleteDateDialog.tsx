import { StyleSheet, View } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

import { COOK_VISIT_ICON } from '../art';
import { visitTags } from '../data';
import type { RecurringVisitChoice } from '../types';
import { DialogDayDisc, DialogTags, RecurringDialog } from './RecurringDialog';

/**
 * "Caution! Delete this date?" — Figma `586:4373` (on `586:4315`).
 *
 * The cook badge, the question, a red "Deleted dates can't be restored", then the date as a disc
 * ("Fri 2") beside the visit booked on it as tags, then "Keep date" and the outlined "Delete
 * date". The plan is not named: the screen behind it already says which one.
 */
export interface DeleteDateDialogProps {
  readonly visible: boolean;
  readonly dayId: string;
  /** The visit booked on the date. */
  readonly visit: RecurringVisitChoice;
  readonly onKeep: () => void;
  readonly onDelete: () => void;
  readonly testID?: string;
}

export function DeleteDateDialog({
  visible,
  dayId,
  visit,
  onKeep,
  onDelete,
  testID = 'recurring-delete-date',
}: DeleteDateDialogProps) {
  return (
    <RecurringDialog
      visible={visible}
      icon={COOK_VISIT_ICON}
      title="Caution! Delete this date?"
      note="Deleted dates can’t be restored"
      keepLabel="Keep date"
      confirmLabel="Delete date"
      onKeep={onKeep}
      onConfirm={onDelete}
      testID={testID}
    >
      {/* `1073:3206` — the disc and the tags on one line, 12 apart. */}
      <View style={styles.row}>
        <DialogDayDisc dayId={dayId} />
        <DialogTags tags={visitTags(visit)} gap={lightTheme.space.xs} />
      </View>
    </RecurringDialog>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
});
