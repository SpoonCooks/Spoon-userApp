import { canBook, draftReducer, initialDraft } from './bookingDraft';
import { recommendDuration } from './recommendDuration';
import { isRecurringUnlocked, poolBeads, recurringChipFor } from './recurring';
import { resolveHomeVariant } from './variant';
import { joinWaitlist, waitlistProgress } from './waitlist';
import type { DurationOption, PoolCook } from '../types';

const DURATIONS: DurationOption[] = [30, 45, 60, 90, 120, 150].map((minutes) => ({
  id: `${minutes}`,
  minutes,
  label: `${minutes}`,
  pricePaise: 6900,
  mrpPaise: 15000,
}));
const cook = (id: string, photo = true): PoolCook => ({ id, name: id, photo: photo ? 1 : null });

describe('resolveHomeVariant', () => {
  it('sends a not-live pincode to the inactive home, whatever the booking history', () => {
    expect(
      resolveHomeVariant({ serviceability: 'not_live', user: { hasCompletedBooking: true } }),
    ).toBe('inactive');
  });
  it('picks returning for a live pincode with a completed booking', () => {
    expect(
      resolveHomeVariant({ serviceability: 'live', user: { hasCompletedBooking: true } }),
    ).toBe('returning');
  });
  it('falls back to default', () => {
    expect(
      resolveHomeVariant({ serviceability: 'live', user: { hasCompletedBooking: false } }),
    ).toBe('default');
  });
});

describe('booking draft', () => {
  const start = initialDraft({ focusedDurationId: '60', instantAvailable: true });

  it('opens focused on the default tile but with nothing selected, so the CTA is off', () => {
    expect(start.focusedDurationId).toBe('60');
    expect(start.selectedDurationId).toBeNull();
    expect(canBook(start, true)).toBe(false);
  });

  it('enables the CTA once a tile is tapped', () => {
    const next = draftReducer(start, { type: 'selectDuration', id: '90' });
    expect(next).toMatchObject({ focusedDurationId: '90', selectedDurationId: '90' });
    expect(canBook(next, true)).toBe(true);
  });

  it('only moves focus when scrolling before a tap', () => {
    const next = draftReducer(start, { type: 'focusDuration', id: '45' });
    expect(next).toMatchObject({ focusedDurationId: '45', selectedDurationId: null });
  });

  it('moves the selection with the focus after a tap', () => {
    const tapped = draftReducer(start, { type: 'selectDuration', id: '90' });
    expect(draftReducer(tapped, { type: 'focusDuration', id: '120' }).selectedDurationId).toBe(
      '120',
    );
  });

  it('keeps the duration when leaving recurring and going back to now', () => {
    const tapped = draftReducer(start, { type: 'selectDuration', id: '90' });
    const recurring = draftReducer(tapped, { type: 'setMode', mode: 'recurring' });
    expect(canBook(recurring, true)).toBe(false);
    const back = draftReducer(recurring, { type: 'setMode', mode: 'now' });
    expect(back.selectedDurationId).toBe('90');
    expect(canBook(back, true)).toBe(true);
  });

  it('starts on Later and blocks Now bookings when instant is unavailable', () => {
    const draft = initialDraft({ focusedDurationId: '60', instantAvailable: false });
    expect(draft.mode).toBe('later');
    const tapped = draftReducer(draft, { type: 'selectDuration', id: '60' });
    expect(canBook(tapped, false)).toBe(true);
    expect(canBook({ ...tapped, mode: 'now' }, false)).toBe(false);
  });

  it('clamps the counters', () => {
    expect(draftReducer(start, { type: 'setDishes', value: 0 }).dishes).toBe(1);
    expect(draftReducer(start, { type: 'setPeople', value: 99 }).people).toBe(20);
  });
});

describe('recommendDuration', () => {
  it("lands the frame's inputs on the frame's 1.5 hrs", () => {
    expect(
      recommendDuration({ complexity: 'simple', dishes: 2, people: 4 }, DURATIONS)?.minutes,
    ).toBe(90);
  });
  it('caps at the longest duration on offer', () => {
    expect(
      recommendDuration({ complexity: 'complex', dishes: 10, people: 20 }, DURATIONS)?.minutes,
    ).toBe(150);
  });
  it('returns null with nothing on offer', () => {
    expect(recommendDuration({ complexity: 'simple', dishes: 1, people: 1 }, [])).toBeNull();
  });
});

describe('recurring', () => {
  it('shows the live plan first', () => {
    expect(recurringChipFor({ cookPool: [], activeRecurringPlan: { id: 'p' } })).toEqual({
      label: 'Recurring · Live',
      target: 'planTracker',
    });
  });
  it('offers Book Recurring from two pooled cooks', () => {
    const model = { cookPool: [cook('a'), cook('b')], activeRecurringPlan: null };
    expect(recurringChipFor(model).target).toBe('recurringFlow');
    expect(isRecurringUnlocked(model)).toBe(true);
  });
  it('locks recurring and points at the explainer under two cooks', () => {
    const model = { cookPool: [cook('a')], activeRecurringPlan: null };
    expect(recurringChipFor(model)).toEqual({ label: 'Check Recurring', target: 'explainer' });
    expect(isRecurringUnlocked(model)).toBe(false);
  });
  it('draws only real cooks, at most six', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => cook(id));
    expect(poolBeads({ cookPool: [cook('x', false), ...pool] }).map((c) => c.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ]);
  });
});

describe('waitlist', () => {
  it('fills by count over threshold, capped at 100 %', () => {
    expect(waitlistProgress({ countForPincode: 50, launchThreshold: 200 })).toBe(0.25);
    expect(waitlistProgress({ countForPincode: 500, launchThreshold: 200 })).toBe(1);
    expect(waitlistProgress({ countForPincode: 5, launchThreshold: 0 })).toBe(0);
  });

  it('asks for permission at tap and registers for push when granted', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    const result = await joinWaitlist(
      { pincode: '560001', alreadyJoined: false },
      { requestPushPermission: () => Promise.resolve(true), register },
    );
    expect(result.channel).toBe('push');
    expect(register).toHaveBeenCalledWith({ pincode: '560001', channel: 'push' });
  });

  it('falls back to SMS when permission is refused or the prompt fails', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    await joinWaitlist(
      { pincode: '560001', alreadyJoined: false },
      { requestPushPermission: () => Promise.reject(new Error('x')), register },
    );
    expect(register).toHaveBeenCalledWith({ pincode: '560001', channel: 'sms' });
  });

  it('does nothing once joined', async () => {
    const register = jest.fn();
    const requestPushPermission = jest.fn();
    await joinWaitlist(
      { pincode: '560001', alreadyJoined: true },
      { requestPushPermission, register },
    );
    expect(requestPushPermission).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });
});
