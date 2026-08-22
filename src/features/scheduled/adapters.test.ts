import { durationsFrom } from './adapters';
import type { Catalogue } from '@features/catalogue';

/**
 * `275:4938`'s duration grid draws the SAME six options as `1:728`, written the same way. This
 * adapter used to carry its own copy of the label rule, converting only exact multiples of 60, so
 * the two identical grids disagreed: Instant read "1.5 hr" / "2.5 hrs" and Scheduled read
 * "90 mins" / "150 mins". Both now go through `durationLabelFor`.
 */
function catalogueWith(minutes: readonly number[]): Catalogue {
  return {
    durations: minutes.map((durationMinutes) => ({
      durationMinutes,
      serviceAmountPaise: durationMinutes * 100,
      taxAmountPaise: 0,
      totalAmountPaise: durationMinutes * 100,
      latestStartLocalMinute: 1290,
    })),
  } as unknown as Catalogue;
}

describe('scheduled duration tiles', () => {
  it('writes every duration the way the frames do', () => {
    const tiles = durationsFrom(catalogueWith([30, 45, 60, 90, 120, 150]));

    expect(tiles.map((tile) => tile.label)).toEqual([
      '30 min',
      '45 min',
      '1 hr',
      '1.5 hr',
      '2 hr',
      '2.5 hrs',
    ]);
  });

  it('keeps the id addressed to the server minutes', () => {
    expect(durationsFrom(catalogueWith([90])).map((tile) => tile.id)).toEqual(['dur-90']);
  });

  it('formats the price through the shared formatter', () => {
    // 6900 paise -> ₹69, with no fractional tail.
    const [tile] = durationsFrom(catalogueWith([69]));
    expect(tile?.price).toBe('₹69');
  });
});
