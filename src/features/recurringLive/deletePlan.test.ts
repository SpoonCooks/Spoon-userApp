import { deleteMessage } from './deletePlan';

/** Deleting a Plan (DEC-092): the confirm says what goes, what stays, and when the booking ends. */
const quote = (cancelDates: readonly string[], keptDates: readonly string[] = []) => ({
  recurringBookingId: 'rb-1',
  planNumber: 1,
  cancellable: true,
  cancelDates: [...cancelDates],
  keptDates: [...keptDates],
  visitsCancelled: cancelDates.length,
});

describe('deleteMessage', () => {
  it('says the days go free of charge', () => {
    expect(deleteMessage(quote(['2026-10-20', '2026-10-21']))).toBe(
      '2 days still to come will be cancelled. Nothing is charged for them.',
    );
  });

  it('warns that deleting the last plan closes the booking and stops Autopay', () => {
    expect(deleteMessage(quote(['2026-10-20']), true)).toBe(
      '1 day still to come will be cancelled. Nothing is charged for them. This is your last plan, so your Recurring booking will close and Autopay will stop.',
    );
  });

  it('does not warn when a paid day of the plan stays', () => {
    expect(deleteMessage(quote(['2026-10-21'], ['2026-10-20']), true)).toContain('stays as booked');
    expect(deleteMessage(quote(['2026-10-21'], ['2026-10-20']), true)).not.toContain('last plan');
  });
});
