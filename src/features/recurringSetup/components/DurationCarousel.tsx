import { useState } from 'react';
import { View } from 'react-native';

import { DurationCarousel as SharedCarousel } from '@ui/v2/DurationCarousel';
import type { CarouselDuration } from '@ui/v2/DurationCarousel';

import type { RecurringDurationOption } from '../types';

/**
 * The duration strip on Schedule, Visit addition and Edit date: Home's carousel (`@ui/v2`), so it
 * behaves exactly as Home's does (owner, 2026-10-16). It loops; a swipe only moves the focus; a TAP
 * chooses (lime liquid and a tick on the front tile); a disabled duration reads "Unavailable" and
 * is skipped by the snap. This replaces the recurring copy, which chose whatever card a swipe came
 * to rest on and stopped at both ends.
 *
 * CONTROLLED for the choice (`selectedId`, `onSelect`); the focus is the strip's own, starting on
 * the choice, else `defaultId`, else the middle option, and following a choice made from outside.
 *
 * Full-bleed: the shared strip spans the window, so inside a screen with a 16pt gutter pass
 * `bleed={16}`.
 */
export interface DurationCarouselOption extends RecurringDurationOption {
  /** Greyed out and not selectable (no start time fits, or it would overlap a booked visit). */
  readonly disabled?: boolean | undefined;
}

export interface DurationCarouselProps {
  readonly options: readonly DurationCarouselOption[];
  /** The chosen option's id, or null while none is. */
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  /** Where the strip rests while nothing is chosen. The middle option by default. */
  readonly defaultId?: string | undefined;
  /** Negative side margin, to span a screen whose content has a gutter. Default 0. */
  readonly bleed?: number | undefined;
  readonly testID?: string | undefined;
}

/** "30 mins", "1 hr", "1.5 hrs", "2 hrs" — the tiles' wording, as on Home. */
export function durationCardLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return hours > 1 ? `${text} hrs` : `${text} hr`;
}

interface Tile extends CarouselDuration {
  readonly disabled: boolean;
}

export function DurationCarousel({
  options,
  selectedId,
  onSelect,
  defaultId,
  bleed = 0,
  testID = 'recurring-duration-carousel',
}: DurationCarouselProps) {
  const tiles: readonly Tile[] = options.map((option) => ({
    id: option.id,
    minutes: option.minutes,
    label: durationCardLabel(option.minutes),
    pricePaise: option.pricePaise,
    mrpPaise: option.mrpPaise,
    disabled: option.disabled === true,
  }));
  const resting =
    [selectedId, defaultId].find(
      (id) => id !== null && id !== undefined && tiles.some((tile) => tile.id === id),
    ) ??
    tiles[Math.floor(Math.max(tiles.length - 1, 0) / 2)]?.id ??
    '';

  // The focus follows a choice made from outside (a reset, an edit opening on its saved duration).
  const [focus, setFocus] = useState({ id: resting, for: selectedId });
  if (focus.for !== selectedId) {
    setFocus({ id: selectedId ?? focus.id, for: selectedId });
  }

  return (
    <View style={{ marginHorizontal: -bleed }} testID={testID}>
      <SharedCarousel
        durations={tiles}
        focusedId={focus.id}
        selectedId={selectedId}
        isAvailable={(tile) => !tile.disabled}
        status="ready"
        onFocus={(id) => setFocus({ id, for: selectedId })}
        onSelect={(id) => {
          setFocus({ id, for: id });
          onSelect(id);
        }}
        onPressUnavailable={() => undefined}
        onRetry={() => undefined}
      />
    </View>
  );
}
