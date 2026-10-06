import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { selectedDayLabel } from '../data';

/**
 * The plan's days, picked for a further visit — Figma `365:8604` (none picked, `332:6093`) and
 * `365:8620` (`332:5869`).
 *
 * The Selected days grid made selectable: tap a day, or drag across days in any direction, to
 * toggle them. A drag adds or removes for its whole length, decided by the first day it touches —
 * Step 1's rule. Picked days sit on a 42pt disc: the earliest and latest in brand gold, those
 * between in the tint (`332:5887` / `332:5884` / `332:5883`).
 */
export interface VisitDaysPickerProps {
  /** The plan's days, earliest first. */
  readonly dayIds: readonly string[];
  /** Read on mount; every later change is reported through `onChange`. */
  readonly selected: ReadonlySet<string>;
  readonly onChange: (next: ReadonlySet<string>) => void;
  readonly testID?: string;
}

export function VisitDaysPicker({ dayIds, selected, onChange, testID }: VisitDaysPickerProps) {
  // Every change goes through the tracker, which owns the latest selection between renders.
  const [tracker] = useState(() => new DragTracker(selected));
  const rows = useMemo(() => {
    const result: (readonly string[])[] = [];
    for (let index = 0; index < dayIds.length; index += COLUMNS) {
      result.push(dayIds.slice(index, index + COLUMNS));
    }
    return result;
  }, [dayIds]);

  const picked = dayIds.filter((id) => selected.has(id));
  const startId = picked[0];
  const endId = picked.at(-1);

  const drag = useMemo(() => {
    const visit = (x: number, y: number) => {
      const id = tracker.hit(x, y, rows);
      if (id === null) return;
      onChange(tracker.apply(id));
    };
    return Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onBegin((event) => {
        tracker.begin();
        visit(event.x, event.y);
      })
      .onUpdate((event) => visit(event.x, event.y))
      .onFinalize(() => tracker.end());
  }, [tracker, rows, onChange]);

  return (
    <GestureDetector gesture={drag}>
      <View
        style={styles.grid}
        onLayout={(event) => tracker.setWidth(event.nativeEvent.layout.width)}
        testID={testID}
      >
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {Array.from({ length: COLUMNS }, (_, column) => {
              const id = row[column];
              if (id === undefined) return <View key={`empty-${column}`} style={styles.cell} />;
              const { weekday, day } = selectedDayLabel(id);
              const isPicked = selected.has(id);
              return (
                <View
                  key={id}
                  style={styles.cell}
                  accessible
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${weekday} ${day}`}
                  accessibilityState={{ checked: isPicked }}
                  accessibilityActions={[{ name: 'activate' }]}
                  onAccessibilityAction={() => onChange(tracker.toggle(id))}
                  testID={testID === undefined ? undefined : `${testID}-${id}`}
                >
                  {isPicked ? (
                    <View
                      style={[
                        styles.disc,
                        id === startId || id === endId ? styles.discEdge : styles.discPicked,
                      ]}
                    />
                  ) : null}
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
    </GestureDetector>
  );
}

/**
 * One drag across the grid: the mode its first day set (add or remove) and the days it has
 * touched, so a finger resting on a day applies it once. A stable instance, not state: the
 * gesture is built once and reads it from its callbacks.
 */
class DragTracker {
  private selected: ReadonlySet<string>;
  private width = 0;
  private mode: 'add' | 'remove' | null = null;
  private visited = new Set<string>();

  constructor(initial: ReadonlySet<string>) {
    this.selected = initial;
  }

  setWidth(width: number): void {
    this.width = width;
  }

  begin(): void {
    this.mode = null;
    this.visited = new Set();
  }

  end(): void {
    this.begin();
  }

  /** The day under a grid-relative point, if the drag has not touched it yet. */
  hit(x: number, y: number, rows: readonly (readonly string[])[]): string | null {
    if (this.width === 0) return null;
    const column = Math.floor(x / ((this.width + GAP) / COLUMNS));
    const row = Math.floor(y / (CELL_HEIGHT + GAP));
    if (column < 0 || column >= COLUMNS || row < 0) return null;
    const id = rows[row]?.[column];
    if (id === undefined || this.visited.has(id)) return null;
    this.visited.add(id);
    return id;
  }

  /** The selection after the drag reaches `id`. */
  apply(id: string): ReadonlySet<string> {
    this.mode ??= this.selected.has(id) ? 'remove' : 'add';
    return this.set(id, this.mode === 'add');
  }

  /** A screen reader's activation: flips one day. */
  toggle(id: string): ReadonlySet<string> {
    return this.set(id, !this.selected.has(id));
  }

  private set(id: string, on: boolean): ReadonlySet<string> {
    const next = new Set(this.selected);
    if (on) next.add(id);
    else next.delete(id);
    this.selected = next;
    return next;
  }
}

const COLUMNS = 7;
const GAP = 4;
/** `365:8605` — p 4 around a 14pt weekday line and a 20pt date line. */
const CELL_HEIGHT = 42;
/** `332:5887` — a 42pt disc, centred on the cell. */
const DISC = 42;

const styles = StyleSheet.create({
  grid: { gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    padding: lightTheme.space.xs,
    alignItems: 'center',
  },
  disc: {
    position: 'absolute',
    top: 0,
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
  },
  discPicked: { backgroundColor: lightTheme.colors.surfaceBrandTint },
  discEdge: { backgroundColor: lightTheme.colors.surfaceBrand },
});
