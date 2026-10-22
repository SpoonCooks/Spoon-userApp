import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DURATION_OPTIONS } from '../data';
import { DurationCarousel, durationCardLabel } from './DurationCarousel';
import type { DurationCarouselOption } from './DurationCarousel';

/**
 * Recurring's duration strip is Home's carousel (`@ui/v2/DurationCarousel`): a swipe only moves the
 * focus, a TAP chooses, and a disabled duration cannot be chosen (owner, 2026-10-16).
 */

function Harness({
  options = DURATION_OPTIONS,
  initial = null,
  onSelect,
}: {
  readonly options?: readonly DurationCarouselOption[];
  readonly initial?: string | null;
  readonly onSelect?: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(initial);
  return (
    <DurationCarousel
      options={options}
      selectedId={selected}
      onSelect={(id) => {
        setSelected(id);
        onSelect?.(id);
      }}
    />
  );
}

/** A duration's tile, the copy of the looping strip a screen reader hears. */
const tile = (spoken: string) => screen.getByRole('radio', { name: new RegExp(`^${spoken}, ₹`) });

describe('durationCardLabel', () => {
  it('writes the carousel wording: mins under an hour, hr for one, hrs above', () => {
    expect(durationCardLabel(30)).toBe('30 mins');
    expect(durationCardLabel(60)).toBe('1 hr');
    expect(durationCardLabel(90)).toBe('1.5 hrs');
    expect(durationCardLabel(120)).toBe('2 hrs');
  });
});

describe('Recurring duration carousel', () => {
  it('draws each duration with its price and the struck original, as on Home', () => {
    render(<Harness />);
    expect(screen.getAllByText('1.5 hrs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹189').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹450').length).toBeGreaterThan(0);
  });

  it('chooses nothing until a tile is tapped', () => {
    const onSelect = jest.fn();
    render(<Harness onSelect={onSelect} />);
    expect(onSelect).not.toHaveBeenCalled();
    expect(tile('1 hour').props.accessibilityState?.checked).toBe(false);
  });

  it('chooses a tapped tile and marks it selected (the lime liquid and tick)', () => {
    const onSelect = jest.fn();
    render(<Harness onSelect={onSelect} />);
    fireEvent.press(tile('1.5 hours'));
    expect(onSelect).toHaveBeenCalledWith('d90');
    expect(tile('1.5 hours').props.accessibilityState?.checked).toBe(true);
  });

  it('does not choose on a swipe coming to rest', () => {
    const onSelect = jest.fn();
    render(<Harness onSelect={onSelect} />);
    fireEvent(screen.getByLabelText('Duration'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 112 * 8, y: 0 } },
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('cannot choose a disabled duration, which reads Unavailable', () => {
    const onSelect = jest.fn();
    const options = DURATION_OPTIONS.map((option) =>
      option.minutes === 120 ? { ...option, disabled: true } : option,
    );
    render(<Harness options={options} onSelect={onSelect} />);
    fireEvent.press(tile('2 hours'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0);
  });
});
