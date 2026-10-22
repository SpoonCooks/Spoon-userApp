import { SweepTracker } from './RecurringDaysScreen';

/** A plan held in a Set, with the screen's rules: a 14-day cap and days nobody may pick. */
function harness(options: { picked?: string[]; cap?: number; blocked?: string[] } = {}) {
  const picked = new Set(options.picked ?? []);
  const blocked = new Set(options.blocked ?? []);
  const cap = options.cap ?? 14;
  const apply = (id: string, intent: 'add' | 'remove' | 'toggle') => {
    if (blocked.has(id)) return null;
    const mode = intent === 'toggle' ? (picked.has(id) ? 'remove' : 'add') : intent;
    if (mode === 'remove') picked.delete(id);
    else if (picked.size < cap) picked.add(id);
    return mode;
  };
  return { picked, apply, isPicked: (id: string) => picked.has(id) };
}

const ORDER = Array.from({ length: 21 }, (_, i) => `d${String(i + 1).padStart(2, '0')}`);
const days = (from: number, to: number) => ORDER.slice(from, to + 1);

describe('Pick your days: dragging selects the dates in between', () => {
  it('a drag down a column picks every date between, not just that weekday', () => {
    const h = harness();
    const sweep = new SweepTracker();
    sweep.sweepTo(2, ORDER, h.apply, h.isPicked); // Wed, week 1
    sweep.sweepTo(9, ORDER, h.apply, h.isPicked); // Wed, week 2
    expect([...h.picked].sort()).toEqual(days(2, 9));
  });

  it('works backwards from the anchor too', () => {
    const h = harness();
    const sweep = new SweepTracker();
    sweep.sweepTo(10, ORDER, h.apply, h.isPicked);
    sweep.sweepTo(4, ORDER, h.apply, h.isPicked);
    expect([...h.picked].sort()).toEqual(days(4, 10));
  });

  it('sliding back hands the dates it leaves their state from before the sweep', () => {
    const h = harness({ picked: ['d08'] });
    const sweep = new SweepTracker();
    sweep.sweepTo(2, ORDER, h.apply, h.isPicked);
    sweep.sweepTo(12, ORDER, h.apply, h.isPicked);
    sweep.sweepTo(5, ORDER, h.apply, h.isPicked);
    // d03..d06 from the sweep, and d08 as it already was.
    expect([...h.picked].sort()).toEqual([...days(2, 5), 'd08']);
  });

  it('starting on a picked date clears the range', () => {
    const h = harness({ picked: days(0, 13) });
    const sweep = new SweepTracker();
    sweep.sweepTo(3, ORDER, h.apply, h.isPicked);
    sweep.sweepTo(7, ORDER, h.apply, h.isPicked);
    expect([...h.picked].sort()).toEqual([...days(0, 2), ...days(8, 13)]);
  });

  it('skips dates nobody may pick and fills nearest the anchor first under the cap', () => {
    const h = harness({ cap: 5, blocked: ['d04'] });
    const sweep = new SweepTracker();
    sweep.sweepTo(1, ORDER, h.apply, h.isPicked);
    sweep.sweepTo(15, ORDER, h.apply, h.isPicked);
    expect([...h.picked].sort()).toEqual(['d02', 'd03', 'd05', 'd06', 'd07']);
  });
});
