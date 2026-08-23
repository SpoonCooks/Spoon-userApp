import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { ChipGroup } from './ChipGroup';

/**
 * Two things about `ChipGroup`'s geometry that a screenshot cannot pin down.
 *
 * The WRAPPING groups (Day, Time, diet, tip) carry row spacing as `paddingBottom` on each cell and
 * cancel the last row's with a negative margin on the container. With ZERO options there is no
 * cell and therefore no padding — but the margin was applied anyway, so the group measured −8, its
 * parent section measured 8pt shorter than its own label, and Scheduled's "Start time" heading was
 * drawn CLIPPED THROUGH THE MIDDLE on the handset. That is the §2 "Start time is cut off" report.
 *
 * The START-TIME grid no longer uses that mechanism at all: `34:3485` is an explicit 4-column
 * track, so its rows are real rows and its gutters are `gap`. The tests below assert the track,
 * because "every card is the same size" is exactly the property that regressed when the chips were
 * content-sized, and it is invisible to any assertion about a single chip.
 */

interface Rendered {
  readonly props: { readonly style?: unknown };
  readonly children: readonly Rendered[] | null;
}

function styleOf(testID: string): ViewStyle {
  const node = screen.getByTestId(testID);
  return (StyleSheet.flatten(node.props.style) ?? {}) as ViewStyle;
}

/** The grid's own rows, read off the rendered tree rather than guessed at. */
function slotRows(): readonly Rendered[] {
  const grid = screen.toJSON() as unknown as Rendered;
  return grid.children ?? [];
}

function flat(node: Rendered): ViewStyle {
  return (StyleSheet.flatten(node.props.style as never) ?? {}) as ViewStyle;
}

function renderSlots(count: number) {
  render(
    <ChipGroup
      options={Array.from({ length: count }, (_, index) => ({
        id: `s${index}`,
        // Deliberately UNEVEN label widths: the whole point is that the cell ignores them.
        label: index % 2 === 0 ? '5:00 AM' : '06:30 AM',
      }))}
      selectedId={null}
      onSelect={jest.fn()}
      columns={4}
      density="slot"
      testID="slots"
    />,
  );
}

describe('the wrapping groups — trailing-row correction', () => {
  it('cancels the last row padding when there ARE chips', () => {
    render(
      <ChipGroup
        options={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ]}
        selectedId={null}
        onSelect={jest.fn()}
        testID="chips"
      />,
    );

    expect(styleOf('chips').marginBottom).toBeLessThan(0);
  });

  it('applies NO negative margin when empty, so the label above it is not cropped', () => {
    render(<ChipGroup options={[]} selectedId={null} onSelect={jest.fn()} testID="chips" />);

    expect(styleOf('chips').marginBottom).toBe(0);
  });
});

describe('the start-time grid — `34:3485`', () => {
  /**
   * The same crop guard, against the mechanism that replaced it.
   *
   * The grid spaces its rows with `rowGap`, so there is no trailing padding to cancel and no
   * negative margin to leave behind. An empty grid must therefore contribute nothing at all —
   * never a negative height that eats the heading above it.
   */
  it('never carries a negative bottom margin, empty or not', () => {
    renderSlots(0);
    expect(styleOf('slots').marginBottom ?? 0).toBe(0);

    screen.unmount();

    renderSlots(8);
    expect(styleOf('slots').marginBottom ?? 0).toBe(0);
  });

  it('spaces rows and columns at the frame’s 8pt gutter', () => {
    renderSlots(8);

    expect(styleOf('slots').rowGap).toBe(8);
    // Every row states the same column gutter, so the vertical tracks line up down the grid.
    for (const row of slotRows()) {
      expect(flat(row).columnGap).toBe(8);
    }
  });

  it('lays out exactly four cells per row, whatever the labels are', () => {
    renderSlots(8);

    const rows = slotRows();
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.children).toHaveLength(4);
    }
  });

  /**
   * A short last row keeps the track rather than stretching across it.
   *
   * Six slots is four plus two. Without the spacers those two would each take half the width and
   * sit under nothing, which is the ragged edge the content-sized layout used to produce.
   */
  it('pads a short final row so its cards stay the same width as every other row', () => {
    renderSlots(6);

    const rows = slotRows();
    expect(rows).toHaveLength(2);
    expect(rows[1]?.children).toHaveLength(4);
    // Only the two real chips are pressable; the remaining two cells are empty.
    expect(screen.getByTestId('slots-s4')).toBeTruthy();
    expect(screen.getByTestId('slots-s5')).toBeTruthy();
    expect(screen.queryByTestId('slots-s6')).toBeNull();
  });

  it('gives every cell an equal share of the row, independent of its label', () => {
    renderSlots(4);

    const cells = slotRows()[0]?.children ?? [];
    expect(cells).toHaveLength(4);

    // One shared rule — `flex: 1` — so no label can widen its own column.
    for (const cell of cells) {
      expect(flat(cell).flex).toBe(1);
      expect(flat(cell).width).toBeUndefined();
    }
  });
});
