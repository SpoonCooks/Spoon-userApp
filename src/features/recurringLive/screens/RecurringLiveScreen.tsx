import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RecurringTabsHeader } from '../components/RecurringTabsHeader';
import type { RecurringTab } from '../components/RecurringTabsHeader';
import { FillImage } from '../components/FillImage';
import { CALENDAR_THREAD, CALENDAR_TOUCH_GLYPH } from '../components/calendar/assets';
import { DAY_POPUP_WIDTH, DayVisitsPopup } from '../components/calendar/DayVisitsPopup';
import { ProgressThread } from '../components/calendar/ProgressThread';
import { UpNextBanner } from '../components/calendar/UpNextBanner';
import {
  VisitsCalendar,
  VisitsCalendarHeader,
  dateDiscFrame,
  locateDay,
} from '../components/calendar/VisitsCalendar';
import { CALENDAR_DEMO_MODEL, dayHeading, findDayIn } from '../data/calendar';
import type { CalendarDay, DayVisit, LiveCalendarModel } from '../data/calendar';

/**
 * Recurring — "Live booking" tab. Figma `cCQlzTeiObQkpVBzwI8mZi`, page `1005:131`:
 * `1005:132` (no date selected) and `1354:1543` (a date's pop-up open over the calendar).
 *
 * Under `RecurringTabsHeader` (`1017:6233`), the `1005:148` Content column (p 16, 24 between
 * blocks): the Up-next banner, the plan's progress thread, "Your visits" with its legend, the
 * calendar, and the "Tap a date…" hint. The pale "Thread" swoosh (`1005:311`) lies behind it all
 * near the foot of the screen.
 *
 * Page note: "The calendar is the base; tapping a date opens a small pop-up listing that day's
 * visits." Tapping a visit date toggles its pop-up; tapping blank area clears it. That selection
 * is the ONLY state here — visits, the Up-next card, the pop-up's Cancel and the tab switch are
 * callbacks the route wires later.
 *
 * POP-UP PLACEMENT: `1357:1898` hangs 1pt under the selected disc (disc y 348 + 32, card y 381)
 * and is centred over it, clamped inside the 16pt side padding. Where it would run past the
 * bottom of the screen it opens upward instead, 1pt above the disc — so the later rows, whose
 * pop-ups the frames don't place, stay on screen.
 *
 * Everything shown comes from `model`: the booking's own (`liveCalendarFrom`) on the real route,
 * `CALENDAR_DEMO_MODEL` in the dev preview. No Up-next card is drawn when nothing is left to run.
 */
export interface VisitRef {
  readonly dateId: string;
  readonly visitId: string;
  readonly isToday: boolean;
}

export interface RecurringLiveScreenProps {
  /** What the tab draws. Defaults to the Figma fixture, for the dev preview. */
  readonly model?: LiveCalendarModel;
  readonly onBack: () => void;
  readonly onTabChange?: ((tab: RecurringTab) => void) | undefined;
  /** A visit row in the pop-up — Visit details, or the live booking page for today's. */
  readonly onOpenVisit?: ((visit: VisitRef) => void) | undefined;
  /** The Up-next banner — the existing live booking page. */
  readonly onOpenUpNext?: (() => void) | undefined;
  /** Above the Up-next banner: e.g. the Autopay notice while visits can't be charged. */
  readonly notice?: ReactNode;
  /** Opens with this date's pop-up showing, e.g. `CALENDAR_DEMO_DATES.past`. */
  readonly initialSelectedDate?: string;
  readonly testID?: string;
}

/**
 * `1005:311` — the swoosh's stroke-bleed box is 430 × 54.05 at x −20 / y 636 on the 402 × 722
 * Content frame, so it overhangs 20 left and 8 right and ends 31.95 above Content's foot.
 */
const THREAD = { left: -20, right: -8, height: 54.05, bottom: 31.95 } as const;
/** `1357:1898` — the card's 1pt gap to the disc. */
const POPUP_OFFSET = 1;

export function RecurringLiveScreen({
  model = CALENDAR_DEMO_MODEL,
  onBack,
  onTabChange,
  onOpenVisit,
  onOpenUpNext,
  notice,
  initialSelectedDate,
  testID = 'recurring-live-screen',
}: RecurringLiveScreenProps) {
  const fixture = model;
  const insets = useSafeAreaInsets();

  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedDate ?? null);
  const [content, setContent] = useState<LayoutRectangle | null>(null);
  const [grid, setGrid] = useState<LayoutRectangle | null>(null);
  const [popupSize, setPopupSize] = useState<{ id: string; height: number } | null>(null);

  const selectedDay = selectedId === null ? undefined : findDayIn(fixture.weeks, selectedId);
  const dayVisits = selectedDay ? fixture.visitsByDay[selectedDay.id] : undefined;

  const onSelectDay = useCallback((day: CalendarDay) => {
    setSelectedId((current) => (current === day.id ? null : day.id));
  }, []);
  const clearSelection = useCallback(() => setSelectedId(null), []);

  const onContentLayout = useCallback(
    (event: LayoutChangeEvent) => setContent(event.nativeEvent.layout),
    [],
  );
  const onGridLayout = useCallback(
    (event: LayoutChangeEvent) => setGrid(event.nativeEvent.layout),
    [],
  );
  const onPopupLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (selectedId === null) return;
      const { height } = event.nativeEvent.layout;
      setPopupSize((prev) =>
        prev?.id === selectedId && prev.height === height ? prev : { id: selectedId, height },
      );
    },
    [selectedId],
  );

  /** Content-relative placement; `null` until the grid has been measured. */
  const popupPosition = useMemo(() => {
    if (selectedId === null || content === null || grid === null) return null;
    const cell = locateDay(fixture.weeks, selectedId);
    if (cell === undefined) return null;

    const disc = dateDiscFrame(grid.width, cell.rowIndex, cell.columnIndex);
    const discTop = grid.y + disc.top;
    const gutter = lightTheme.space.lg;
    const left = Math.min(
      Math.max(grid.x + disc.centerX - DAY_POPUP_WIDTH / 2, gutter),
      content.width - gutter - DAY_POPUP_WIDTH,
    );

    const below = discTop + 32 + POPUP_OFFSET;
    const measured = popupSize?.id === selectedId ? popupSize.height : null;
    if (measured === null) return { left, top: below, measured: false };
    const fitsBelow = below + measured <= content.height - insets.bottom;
    const top = fitsBelow ? below : Math.max(discTop - POPUP_OFFSET - measured, 0);
    return { left, top, measured: true };
  }, [selectedId, content, grid, popupSize, fixture.weeks, insets.bottom]);

  const openVisit = useCallback(
    (visit: DayVisit) => {
      if (!selectedDay) return;
      onOpenVisit?.({
        dateId: selectedDay.id,
        visitId: visit.id,
        isToday: selectedDay.kind === 'today',
      });
    },
    [onOpenVisit, selectedDay],
  );

  return (
    <Screen
      // Scrolls: the frame's blocks fit one phone exactly, so anything added above them (the
      // Autopay notice) or a shorter screen would crop the calendar and hint with no way to reach
      // them. The content still fills the screen when it is short.
      scroll
      tone="plain"
      padded={false}
      testID={testID}
      header={
        <RecurringTabsHeader
          tab="live"
          onBack={onBack}
          {...(onTabChange ? { onTabChange } : {})}
          testID={`${testID}-header`}
        />
      }
    >
      <Pressable
        onPress={clearSelection}
        onLayout={onContentLayout}
        accessible={false}
        style={[styles.content, { paddingBottom: lightTheme.space.lg + insets.bottom }]}
        testID={`${testID}-content`}
      >
        <FillImage
          source={CALENDAR_THREAD}
          style={[styles.thread, { bottom: THREAD.bottom + insets.bottom }]}
          resizeMode="stretch"
        />

        {notice}

        {fixture.upNext === null ? null : (
          <UpNextBanner
            label={fixture.upNext.label}
            title={fixture.upNext.title}
            meta={fixture.upNext.meta}
            photo={fixture.upNext.photo}
            onPress={onOpenUpNext}
            testID={`${testID}-up-next`}
          />
        )}

        <ProgressThread
          label={fixture.progressLabel}
          fraction={fixture.progressFraction}
          testID={`${testID}-progress`}
        />

        <VisitsCalendarHeader testID={`${testID}-calendar-header`} />

        <VisitsCalendar
          weekdays={fixture.weekdays}
          weeks={fixture.weeks}
          selectedId={selectedId}
          onSelectDay={onSelectDay}
          onLayout={onGridLayout}
          testID={`${testID}-calendar`}
        />

        <View style={styles.hint}>
          <Image source={CALENDAR_TOUCH_GLYPH} style={styles.hintGlyph} />
          <Text variant="spoonCaption" color="textSecondarySoft" style={styles.hintText}>
            {fixture.hint}
          </Text>
        </View>

        {selectedDay && dayVisits && selectedDay.kind !== 'none' && popupPosition ? (
          <DayVisitsPopup
            key={selectedDay.id}
            heading={dayHeading(selectedDay)}
            planLabel={dayVisits.planLabel}
            kind={selectedDay.kind}
            visits={dayVisits.visits}
            onOpenVisit={openVisit}
            onClose={clearSelection}
            onLayout={onPopupLayout}
            style={[
              styles.popup,
              { left: popupPosition.left, top: popupPosition.top },
              popupPosition.measured ? null : styles.unmeasured,
            ]}
            testID={`${testID}-popup`}
          />
        ) : null}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** `1005:148` — p 16, 24 between blocks, clipped (the swoosh overruns it). */
  content: {
    flexGrow: 1,
    gap: lightTheme.space.xl,
    paddingTop: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.lg,
    overflow: 'hidden',
  },
  /** `1005:311` — bleeds past both sides, behind every block. */
  thread: {
    position: 'absolute',
    left: THREAD.left,
    right: THREAD.right,
    height: THREAD.height,
  },
  /** `1005:312` — the touch glyph and caption, centred, 8 apart. */
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.sm,
  },
  hintGlyph: { width: 24, height: 24 },
  hintText: { flexShrink: 1 },
  popup: { position: 'absolute' },
  /** Laid out once off-screen-invisible so its height is known before it is placed. */
  unmeasured: { opacity: 0 },
});
