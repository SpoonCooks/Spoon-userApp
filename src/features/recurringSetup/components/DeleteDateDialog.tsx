import { COOK_VISIT_ICON } from '../art';
import { visitTags } from '../data';
import type { RecurringVisitChoice } from '../types';
import { DialogDays, DialogTags, RecurringDialog } from './RecurringDialog';

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
  return (
    <RecurringDialog
      visible={visible}
      icon={COOK_VISIT_ICON}
      title={`Delete this date from Plan ${planNumber}?`}
      keepLabel="Keep date"
      confirmLabel="Delete date"
      onKeep={onKeep}
      onConfirm={onDelete}
      testID={testID}
    >
      <DialogDays dayIds={[dayId]} heading={false} />
      <DialogTags tags={visitTags(visit)} />
    </RecurringDialog>
  );
}
