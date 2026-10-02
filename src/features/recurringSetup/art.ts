import type { ImageSourcePropType } from 'react-native';

import type { RecurringTimeOfDay } from './types';

/**
 * Figma artwork for the redesigned recurring flow (`cCQlzTeiObQkpVBzwI8mZi`), in
 * `assets/figma/recurring/`.
 *
 * The icons are the file's own SVGs rendered to PNG at @3x (the app draws no SVG), shown at their
 * drawn size. The photographs and the calendar illustration are the file's own rasters scaled
 * down to @3x of their drawn size from multi-megabyte originals.
 */

/** `352:141` — 16pt. */
export const PLUS_ICON = require('../../../assets/figma/recurring/plus.png') as ImageSourcePropType;
/** `497:2045` — 24pt. */
export const EDIT_ICON = require('../../../assets/figma/recurring/edit.png') as ImageSourcePropType;
/** `543:2308` — 24pt. */
export const TRASH_ICON =
  require('../../../assets/figma/recurring/trash.png') as ImageSourcePropType;
/** `364:521` — the Plan banner's calendar, drawn 56.96 × 57.58 inside a 73 × 72 box. */
export const PLAN_CALENDAR =
  require('../../../assets/figma/recurring/plan-calendar.png') as ImageSourcePropType;

/** `288:524` / `288:535` / `288:547` — the 14pt time-of-day pictograms. */
export const TIME_OF_DAY_ICONS: Readonly<Record<RecurringTimeOfDay, ImageSourcePropType>> = {
  morning: require('../../../assets/figma/recurring/morning.png') as ImageSourcePropType,
  afternoon: require('../../../assets/figma/recurring/afternoon.png') as ImageSourcePropType,
  evening: require('../../../assets/figma/recurring/evening.png') as ImageSourcePropType,
};

/**
 * Summary's first tile (`316:4762`) — one photograph per band. They are loose rectangles on the
 * "Recurring flow" page sitting under the `485:399` frame (which holds only the captions):
 * `373:8719` Morning, `361:435` Afternoon, `444:10248` Evening.
 */
export const TIME_OF_DAY_PHOTOS: Readonly<Record<RecurringTimeOfDay, ImageSourcePropType>> = {
  morning: require('../../../assets/figma/recurring/time-morning.png') as ImageSourcePropType,
  afternoon: require('../../../assets/figma/recurring/time-afternoon.png') as ImageSourcePropType,
  evening: require('../../../assets/figma/recurring/time-evening.png') as ImageSourcePropType,
};

/** `586:3819` — one timer photograph per duration. */
export const DURATION_PHOTOS: Readonly<Record<number, ImageSourcePropType>> = {
  30: require('../../../assets/figma/recurring/duration-30.png') as ImageSourcePropType,
  45: require('../../../assets/figma/recurring/duration-45.png') as ImageSourcePropType,
  60: require('../../../assets/figma/recurring/duration-60.png') as ImageSourcePropType,
  90: require('../../../assets/figma/recurring/duration-90.png') as ImageSourcePropType,
  120: require('../../../assets/figma/recurring/duration-120.png') as ImageSourcePropType,
  150: require('../../../assets/figma/recurring/duration-150.png') as ImageSourcePropType,
};

/** `586:3820` — one arrival photograph per start-time band. */
export const START_TIME_PHOTOS: Readonly<Record<RecurringTimeOfDay, ImageSourcePropType>> = {
  morning: require('../../../assets/figma/recurring/start-morning.png') as ImageSourcePropType,
  afternoon: require('../../../assets/figma/recurring/start-afternoon.png') as ImageSourcePropType,
  evening: require('../../../assets/figma/recurring/start-evening.png') as ImageSourcePropType,
};

/**
 * `512:1235` — the Edit date header's 16pt chip icons. Morning is the file's own `Icon/sunrise`;
 * the file draws no Afternoon or Evening chip, so those reuse the time-of-day pictograms drawn
 * at 16. All are tinted on screen, so their source ink doesn't matter.
 */
export const CHIP_TIME_OF_DAY_ICONS: Readonly<Record<RecurringTimeOfDay, ImageSourcePropType>> = {
  morning: require('../../../assets/figma/recurring/chip-morning.png') as ImageSourcePropType,
  afternoon: require('../../../assets/figma/recurring/chip-afternoon.png') as ImageSourcePropType,
  evening: require('../../../assets/figma/recurring/chip-evening.png') as ImageSourcePropType,
};
/** `512:1247` — `Icon/clock`, 16pt. */
export const CHIP_CLOCK_ICON =
  require('../../../assets/figma/recurring/chip-clock.png') as ImageSourcePropType;
/** `558:170` — `Cook/ Visit`, 24pt, the delete dialog's badge. */
export const COOK_VISIT_ICON =
  require('../../../assets/figma/recurring/cook-visit.png') as ImageSourcePropType;
/** `547:2535` — `Calendar / Calendar_Remove`, 24pt: the "Delete plan" row and dialog. */
export const CALENDAR_REMOVE_ICON =
  require('../../../assets/figma/recurring/calendar-remove.png') as ImageSourcePropType;
/** `543:2325` — `Interface / Restart`, 24pt: the sheet's "Start over" row. */
export const RESTART_ROW_ICON =
  require('../../../assets/figma/recurring/restart-sheet.png') as ImageSourcePropType;
/** `542:1748` — the "Start over?" dialog's 24pt restart arrow. */
export const RESTART_ICON =
  require('../../../assets/figma/recurring/restart.png') as ImageSourcePropType;
/** `568:2994` — `Done_round`, 20pt white tick in the undo banner's badge. */
export const DONE_ICON = require('../../../assets/figma/recurring/done.png') as ImageSourcePropType;
/** `43:67` — `Icon/Close`, 24pt: the undo banner's dismiss. */
export const CLOSE_ICON =
  require('../../../assets/figma/recurring/close.png') as ImageSourcePropType;
