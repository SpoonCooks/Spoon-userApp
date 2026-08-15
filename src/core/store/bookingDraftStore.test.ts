import { EMPTY_BOOKING_DRAFT, useBookingDraftStore } from './bookingDraftStore';

describe('bookingDraftStore', () => {
  beforeEach(() => {
    useBookingDraftStore.getState().clear();
  });

  it('starts empty', () => {
    expect(useBookingDraftStore.getState().draft).toEqual(EMPTY_BOOKING_DRAFT);
  });

  it('accumulates server-supplied selections', () => {
    const { select } = useBookingDraftStore.getState();

    select({ dayId: 'day_2', period: 'morning' });
    select({ durationOptionId: 'dur_90', startSlotId: 'slot_0630' });

    expect(useBookingDraftStore.getState().draft).toMatchObject({
      dayId: 'day_2',
      period: 'morning',
      durationOptionId: 'dur_90',
      startSlotId: 'slot_0630',
    });
  });

  it('discards downstream selections when the booking mode changes', () => {
    useBookingDraftStore.getState().select({ dayId: 'day_2', durationOptionId: 'dur_90' });
    useBookingDraftStore.getState().setMode('instant');

    expect(useBookingDraftStore.getState().draft).toEqual({
      ...EMPTY_BOOKING_DRAFT,
      mode: 'instant',
    });
  });

  it('clears on submission — ownership transfers to the server', () => {
    useBookingDraftStore.getState().select({ mode: 'scheduled', startSlotId: 'slot_1' });
    useBookingDraftStore.getState().clear();

    expect(useBookingDraftStore.getState().draft).toEqual(EMPTY_BOOKING_DRAFT);
  });
});
