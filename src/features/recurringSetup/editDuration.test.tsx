import { fireEvent, render, screen } from '@testing-library/react-native';

import type { AppError } from '@core/errors';

import type { VisitDurationOptionsDto } from './api';
import {
  EDIT_WINDOW_CLOSED_NOTE,
  EDIT_WINDOW_NOTE,
  RecurringEditDurationScreen,
  durationChangeMessage,
} from './screens/RecurringEditDurationScreen';
import type { EditDurationDate } from './screens/RecurringEditDurationScreen';

/**
 * A live booking's Edit duration (DEC-093): one day's duration, until its Autopay notice 27 hours
 * before. The asterisk note says so; a date past it cannot be changed; Save waits for a new length.
 */
const DATES: readonly EditDurationDate[] = [
  {
    visitId: 'v1',
    date: '2026-10-20',
    visit: { timeOfDay: 'morning', durationId: 'd60', startMinutes: 11 * 60 },
  },
  {
    visitId: 'v2',
    date: '2026-10-21',
    visit: { timeOfDay: 'morning', durationId: 'd60', startMinutes: 11 * 60 },
  },
];

const options = (editable: boolean, visitId = 'v1'): VisitDurationOptionsDto => ({
  recurringBookingId: 'b1',
  visitId,
  serviceDate: '2026-10-20',
  durationMinutes: 60,
  editable,
  editableUntil: '2026-10-19T02:30:00.000Z',
  refusal: editable ? null : 'EDIT_WINDOW_CLOSED',
  options: [60, 90, 120].map((minutes) => ({
    durationMinutes: minutes,
    basePricePaise: minutes * 500,
    pricePaise: minutes * 215,
    gstPaise: minutes * 39,
    totalPaise: minutes * 254,
  })),
});

function renderEdit(props: Partial<Parameters<typeof RecurringEditDurationScreen>[0]> = {}) {
  const onSave = jest.fn();
  const onSelectDate = jest.fn();
  render(
    <RecurringEditDurationScreen
      planNumber={1}
      dates={DATES}
      selectedVisitId="v1"
      onSelectDate={onSelectDate}
      options={options(true)}
      saving={false}
      onBack={jest.fn()}
      onSave={onSave}
      {...props}
    />,
  );
  return { onSave, onSelectDate };
}

const tile = (spoken: string) => screen.getByRole('radio', { name: new RegExp(`^${spoken}, ₹`) });
const save = () => screen.getByTestId('recurring-edit-duration-screen-save');

describe('Edit duration on a live booking', () => {
  it('notes with an asterisk that the duration can change until 27 hours before', () => {
    renderEdit();
    expect(screen.getByText(EDIT_WINDOW_NOTE)).toBeTruthy();
    expect(EDIT_WINDOW_NOTE.startsWith('*')).toBe(true);
    expect(EDIT_WINDOW_NOTE).toContain('27 hours');
    expect(EDIT_WINDOW_NOTE).not.toContain('—');
  });

  it('saves only a new length, in minutes', () => {
    const { onSave } = renderEdit();
    fireEvent.press(save());
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.press(tile('1.5 hours'));
    fireEvent.press(save());
    expect(onSave).toHaveBeenCalledWith(90);
  });

  it('cannot change a day past its Autopay notice, and says why', () => {
    const { onSave } = renderEdit({ options: options(false) });
    expect(screen.getByText(EDIT_WINDOW_CLOSED_NOTE)).toBeTruthy();
    fireEvent.press(tile('1.5 hours'));
    fireEvent.press(save());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('switches to another of the visit’s dates', () => {
    const { onSelectDate } = renderEdit();
    fireEvent.press(screen.getByTestId('recurring-edit-duration-screen-date-2026-10-21'));
    expect(onSelectDate).toHaveBeenCalledWith('v2');
  });
});

describe('durationChangeMessage', () => {
  it('names the closed window and the cook not free', () => {
    const refused = (reason: string): AppError => ({
      kind: 'validation',
      status: 409,
      message: 'refused',
      code: 'INVALID_BOOKING_STATE',
      details: { reason },
    });
    expect(durationChangeMessage(refused('EDIT_WINDOW_CLOSED'))).toContain('Autopay notice');
    expect(durationChangeMessage(refused('VISIT_UNAVAILABLE'))).toContain('No cook');
  });
});
