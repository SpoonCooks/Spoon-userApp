import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';

import type { ApiClient } from '@core/api';
import { createTestRuntime, renderWithRuntime, DEFAULT_API_STUBS } from '@/test/renderWithRuntime';

import { ScheduleView } from './screens/ScheduleScreen';
import type { ScheduleSelection } from './types';
import { useScheduleData } from './data';
import { addServiceDays, serviceDateIn } from './serviceTime';

/**
 * Unavailable start times are VISIBLE, grey and unbookable — never absent.
 *
 * The reported defect was a completely blank Start time section for a day/period/duration whose
 * candidates were all unavailable. The backend was never the cause: it returns every candidate it
 * evaluated, each with its own `available` flag. The blank came from this side of the wire, where
 * an availability read that had FAILED or had not answered yet was handed to the adapter as `null`
 * and rendered as a successful screen with an empty grid.
 *
 * These cases drive the real hook — `useScheduleData` -> `useScheduledAvailability` -> the Zod
 * schema -> the adapters -> the screen — against a stubbed transport, because the defect lived in
 * the seams between those and not in any one of them.
 */

const TIME_ZONE = 'Asia/Kolkata';
/** Two days out, resolved the way the day strip resolves it. Tuesday 25 Aug in the report. */
const SERVICE_DATE = addServiceDays(serviceDateIn(TIME_ZONE, new Date()), 2);
const DURATION_MINUTES = 120;

/** 12:00 -> 15:45 IST at the published 15-minute interval: the NOON candidates for a 2-hour book. */
function noonStarts(date = SERVICE_DATE): readonly string[] {
  const midday = Date.parse(`${date}T12:00:00+05:30`);
  return Array.from({ length: 16 }, (_unused, step) =>
    new Date(midday + step * 15 * 60_000).toISOString(),
  );
}

function slotTestId(index: number, date = SERVICE_DATE): string {
  return `schedule-slots-${noonStarts(date)[index]}`;
}

interface SlotSpec {
  readonly start: string;
  readonly available: boolean;
}

function availability(slots: readonly SlotSpec[], date = SERVICE_DATE) {
  return {
    date,
    durationMinutes: DURATION_MINUTES,
    slots: slots.map((slot) => ({
      start: slot.start,
      available: slot.available,
      reason: slot.available ? 'AVAILABLE' : 'NO_PRESENT_COOK',
    })),
    validUntil: new Date(Date.now() + 30_000).toISOString(),
  };
}

const allUnavailable = (date = SERVICE_DATE) =>
  availability(
    noonStarts(date).map((start) => ({ start, available: false })),
    date,
  );

const allAvailable = (date = SERVICE_DATE) =>
  availability(
    noonStarts(date).map((start) => ({ start, available: true })),
    date,
  );

/** Even indices bookable, odd ones not, so "all visible" and "some pressable" stay distinguishable. */
const mixed = () =>
  availability(noonStarts().map((start, index) => ({ start, available: index % 2 === 0 })));

/**
 * The catalogue the wired screen actually reads, plus the 2-hour tile the report names.
 *
 * `DEFAULT_API_STUBS` publishes 30 and 60 only; a duration the catalogue does not publish has no
 * tile to press, and the case under test is specifically the 2-hour one.
 */
function catalogueStub() {
  const base = DEFAULT_API_STUBS['GET /v1/catalogue']?.(undefined) as Record<string, unknown>;
  return {
    ...base,
    durations: [
      ...(base['durations'] as unknown[]),
      {
        durationMinutes: DURATION_MINUTES,
        serviceAmountPaise: 25900,
        taxAmountPaise: 1295,
        totalAmountPaise: 27195,
        latestStartLocalMinute: 1200,
      },
    ],
    scheduled: {
      horizonDays: 3,
      slotIntervalMinutes: 15,
      periods: [
        { id: 'MORNING', startMinute: 300, endMinute: 720 },
        { id: 'NOON', startMinute: 720, endMinute: 960 },
        { id: 'EVENING', startMinute: 960, endMinute: 1320 },
      ],
    },
  };
}

interface Recorded {
  readonly paths: string[];
}

/**
 * A transport stub that can see the QUERY, not just the path.
 *
 * The refetch cases turn on which `date` and `durationMinutes` were asked about, and the shared
 * `createStubApi` deliberately strips the query before dispatching.
 */
function createAvailabilityApi(respond: (params: URLSearchParams, callIndex: number) => unknown): {
  api: ApiClient;
  recorded: Recorded;
} {
  const recorded: Recorded = { paths: [] };
  let availabilityCalls = 0;

  const api: ApiClient = {
    async request(path, options) {
      const [route, search = ''] = path.split('?');
      recorded.paths.push(path);

      if (route === '/v1/availability/scheduled') {
        const index = availabilityCalls;
        availabilityCalls += 1;
        return options.parse(await respond(new URLSearchParams(search), index));
      }
      if (route === '/v1/catalogue') return options.parse(catalogueStub());

      const handler = DEFAULT_API_STUBS[`${options.method ?? 'GET'} ${route}`];
      if (handler === undefined) throw new Error(`No stub for ${path}`);
      return options.parse(handler(options.body));
    },
  };

  return { api, recorded };
}

/**
 * The wired composition, as `app/(app)/scheduled.tsx` assembles it.
 *
 * The route's own quote gate is stood in for by `canSubmit`, so what these cases measure is the
 * screen's half of the rule — a start time the SERVER offered — and not the pricing read.
 */
function Harness() {
  const [selection, setSelection] = useState<ScheduleSelection>({
    dayId: null,
    periodId: null,
    durationId: null,
    slotId: null,
  });

  const { state, refetch } = useScheduleData('book', {
    date: selection.dayId,
    durationMinutes: selection.durationId === null ? null : Number(selection.durationId.slice(4)),
  });

  return (
    <ScheduleView
      state={state}
      onRetry={refetch}
      onBack={jest.fn()}
      onSubmit={jest.fn()}
      canSubmit
      onSelectionChange={setSelection}
    />
  );
}

function renderSchedule(respond: (params: URLSearchParams, callIndex: number) => unknown) {
  const { api, recorded } = createAvailabilityApi(respond);
  const rendered = renderWithRuntime(<Harness />, { runtime: createTestRuntime({ api }) });
  return { ...rendered, recorded };
}

/** Day -> Noon -> 2 hours, the selection in the report. */
async function selectNoonTwoHours(date = SERVICE_DATE) {
  fireEvent.press(await screen.findByTestId(`schedule-days-${date}`));
  fireEvent.press(await screen.findByTestId('schedule-periods-NOON'));
  fireEvent.press(await screen.findByTestId('schedule-duration-dur-120'));
}

function cards() {
  return screen.queryAllByTestId(/^schedule-slots-\d{4}-/);
}

function ctaDisabled(): boolean {
  return screen.getByTestId('schedule-submit').props.accessibilityState.disabled === true;
}

describe('every candidate the server evaluated is drawn', () => {
  it('shows all 16 Noon cards, greyed and disabled, when NONE can be booked', async () => {
    renderSchedule(() => allUnavailable());
    await selectNoonTwoHours();

    await waitFor(() => expect(cards()).toHaveLength(16));

    // The whole point: an unbookable day is a grid of grey cards, never a blank section.
    for (const card of cards()) {
      expect(card.props.accessibilityState.disabled).toBe(true);
    }
    expect(ctaDisabled()).toBe(true);
  });

  it('draws every card when only SOME can be booked, and disables just the rest', async () => {
    renderSchedule(() => mixed());
    await selectNoonTwoHours();

    await waitFor(() => expect(cards()).toHaveLength(16));

    const disabled = cards().filter((card) => card.props.accessibilityState.disabled === true);
    expect(disabled).toHaveLength(8);
  });

  it('leaves every card selectable when all can be booked', async () => {
    renderSchedule(() => allAvailable());
    await selectNoonTwoHours();

    await waitFor(() => expect(cards()).toHaveLength(16));
    expect(cards().every((card) => card.props.accessibilityState.disabled === false)).toBe(true);
  });
});

describe('only a start time the server offered can become a booking', () => {
  it('keeps Book Now grey until a start time is chosen, then lights it', async () => {
    renderSchedule(() => allAvailable());
    await selectNoonTwoHours();
    await waitFor(() => expect(cards()).toHaveLength(16));

    expect(ctaDisabled()).toBe(true);
    fireEvent.press(screen.getByTestId(slotTestId(0)));
    await waitFor(() => expect(ctaDisabled()).toBe(false));
  });

  it('ignores a press on an unavailable card and leaves Book Now grey', async () => {
    renderSchedule(() => mixed());
    await selectNoonTwoHours();
    await waitFor(() => expect(cards()).toHaveLength(16));

    // Index 1 is unavailable in the mixed payload.
    fireEvent.press(screen.getByTestId(slotTestId(1)));

    expect(screen.getByTestId(slotTestId(1)).props.accessibilityState.selected).toBe(false);
    expect(ctaDisabled()).toBe(true);
  });
});

describe('a selection never outlives the answer that justified it', () => {
  it('clears the chosen start time when the DURATION changes, and re-asks', async () => {
    const { recorded } = renderSchedule(() => allAvailable());
    await selectNoonTwoHours();
    await waitFor(() => expect(cards()).toHaveLength(16));

    fireEvent.press(screen.getByTestId(slotTestId(0)));
    await waitFor(() => expect(ctaDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId('schedule-duration-dur-60'));

    await waitFor(() => expect(ctaDisabled()).toBe(true));
    await waitFor(() =>
      expect(recorded.paths.some((path) => path.includes('durationMinutes=60'))).toBe(true),
    );
  });

  it('clears the chosen start time when the DAY changes', async () => {
    const otherDay = addServiceDays(SERVICE_DATE, -1);
    const { recorded } = renderSchedule((params) =>
      allAvailable(params.get('date') ?? SERVICE_DATE),
    );

    await selectNoonTwoHours();
    await waitFor(() => expect(cards()).toHaveLength(16));
    fireEvent.press(screen.getByTestId(slotTestId(0)));
    await waitFor(() => expect(ctaDisabled()).toBe(false));

    fireEvent.press(screen.getByTestId(`schedule-days-${otherDay}`));

    await waitFor(() => expect(ctaDisabled()).toBe(true));
    await waitFor(() =>
      expect(recorded.paths.some((path) => path.includes(`date=${otherDay}`))).toBe(true),
    );
  });

  it('drops the selection when a refetch says that start time is no longer bookable', async () => {
    // The answer changes underneath an unchanged selection — a cook going off shift between the
    // 15-second reads, which is the race the grid is explicitly advisory about.
    let capacityGone = false;
    const { queryClient } = renderSchedule(() =>
      capacityGone ? allUnavailable() : allAvailable(),
    );

    await selectNoonTwoHours();
    await waitFor(() => expect(cards()).toHaveLength(16));
    fireEvent.press(screen.getByTestId(slotTestId(0)));
    await waitFor(() => expect(ctaDisabled()).toBe(false));

    capacityGone = true;
    await act(async () => {
      await queryClient.invalidateQueries();
    });

    await waitFor(() => {
      expect(screen.getByTestId(slotTestId(0)).props.accessibilityState.disabled).toBe(true);
    });
    // The card stays on screen, greyed; what goes away is the selection and the live CTA.
    expect(screen.getByTestId(slotTestId(0)).props.accessibilityState.selected).toBe(false);
    expect(ctaDisabled()).toBe(true);
  });
});

describe('a failure is a failure, not an empty day', () => {
  it('shows the designed error surface when the availability read fails', async () => {
    // Only the 2-hour read fails, so the screen is reachable and the failure belongs to the
    // selection under test rather than to the mounting read.
    renderSchedule((params) => {
      if (params.get('durationMinutes') === String(DURATION_MINUTES)) {
        throw new Error('availability unavailable');
      }
      return allAvailable(params.get('date') ?? SERVICE_DATE);
    });

    await selectNoonTwoHours();

    // The defect: this used to render a normal screen whose Start time section was simply blank,
    // with no error, no retry, and nothing to distinguish it from a day with no candidates.
    expect(await screen.findByTestId('error-state')).toBeTruthy();
    expect(screen.getByTestId('error-state-retry')).toBeTruthy();
    expect(cards()).toHaveLength(0);
  });

  it('shows the error surface when the response does not match the schema', async () => {
    renderSchedule((params) => {
      // `slots[].available` missing entirely — contract drift, not an empty day.
      if (params.get('durationMinutes') === String(DURATION_MINUTES)) {
        return {
          date: SERVICE_DATE,
          durationMinutes: DURATION_MINUTES,
          slots: [{ start: noonStarts()[0] }],
          validUntil: new Date().toISOString(),
        };
      }
      return allAvailable(params.get('date') ?? SERVICE_DATE);
    });

    await selectNoonTwoHours();

    expect(await screen.findByTestId('error-state')).toBeTruthy();
    expect(cards()).toHaveLength(0);
  });

  it('does not draw an empty Start time grid while the read is still in flight', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    renderSchedule(async () => {
      await gate;
      return allUnavailable();
    });

    await selectNoonTwoHours();

    // Nothing is claimed about availability until the server has answered.
    expect(cards()).toHaveLength(0);
    expect(screen.queryByTestId('schedule-slots')).toBeNull();

    release?.();
    await waitFor(() => expect(cards()).toHaveLength(16));
  });
});
