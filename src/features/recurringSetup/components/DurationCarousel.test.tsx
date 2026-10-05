import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { DURATION_OPTIONS } from '../data';
import { DurationCarousel, durationCardLabel, durationLevelShare } from './DurationCarousel';
import type { DurationCarouselOption } from './DurationCarousel';

/**
 * The duration carousel (`1221:4505`): the card the strip rests on is the choice; a tap on a card
 * chooses it; the level rises with the duration; disabled cards cannot be chosen.
 */

/** One card to the next, between the idle ones (`1217:6619`: 100 wide + 12). */
const PITCH = 112;

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

/** The dots are hidden from assistive tech, so they are looked up past that. */
const HIDDEN = { includeHiddenElements: true };
const dot = (index: number) =>
  screen.getByTestId(`recurring-duration-carousel-dot-${index}`, HIDDEN);

const settleAt = (index: number) =>
  fireEvent(screen.getByTestId('recurring-duration-carousel-track'), 'momentumScrollEnd', {
    nativeEvent: { contentOffset: { x: index * PITCH, y: 0 } },
  });

describe('durationCardLabel', () => {
  it('writes the carousel wording: mins under an hour, hr for one, hrs above', () => {
    expect(durationCardLabel(30)).toBe('30 mins');
    expect(durationCardLabel(60)).toBe('1 hr');
    expect(durationCardLabel(90)).toBe('1.5 hrs');
    expect(durationCardLabel(120)).toBe('2 hrs');
    expect(durationCardLabel(150)).toBe('2.5 hrs');
  });
});

describe('durationLevelShare', () => {
  it('rises with the duration: minutes / 180 of the card', () => {
    // `1219:4396` — 22, 33, 53, 65, 87 and 108 of a 130 card (the 1 hr one is 53 of 160).
    expect(durationLevelShare(30) * 130).toBeCloseTo(21.7, 0);
    expect(durationLevelShare(45) * 130).toBeCloseTo(32.5, 0);
    expect(durationLevelShare(60) * 160).toBeCloseTo(53.3, 0);
    expect(durationLevelShare(90) * 130).toBeCloseTo(65, 0);
    expect(durationLevelShare(120) * 130).toBeCloseTo(86.7, 0);
    expect(durationLevelShare(150) * 130).toBeCloseTo(108.3, 0);
  });

  it('never overflows the card', () => {
    expect(durationLevelShare(600)).toBe(1);
    expect(durationLevelShare(0)).toBe(0);
  });
});

describe('DurationCarousel', () => {
  it('draws a card per option with its price and the struck original', () => {
    render(<Harness />);

    for (const option of DURATION_OPTIONS) {
      expect(screen.getByTestId(`recurring-duration-carousel-option-${option.id}`)).toBeTruthy();
    }
    expect(screen.getByText('1 hr')).toBeTruthy();
    expect(screen.getByText('₹129')).toBeTruthy();
    expect(screen.getByText('₹300')).toBeTruthy();
    expect(screen.getByLabelText('1.5 hrs, ₹189, was ₹450')).toBeTruthy();
  });

  it('rests on the middle card while nothing is chosen, and has not chosen it', () => {
    const onSelect = jest.fn();
    render(<Harness onSelect={onSelect} />);

    // 6 options: the 3rd (1 hr) is the middle one, as the frames draw it.
    expect(dot(2).props.style.width).toBe(12);
    expect(dot(1).props.style.width).toBe(4);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('chooses the card it comes to rest on', () => {
    const onSelect = jest.fn();
    render(<Harness onSelect={onSelect} />);

    settleAt(3);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('d90');
  });

  it('chooses the middle card when a tap confirms it', () => {
    const onSelect = jest.fn();
    render(<Harness onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('recurring-duration-carousel-option-d60'));

    expect(onSelect).toHaveBeenCalledWith('d60');
  });

  it('chooses a tapped neighbour', () => {
    const onSelect = jest.fn();
    render(<Harness onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('recurring-duration-carousel-option-d45'));

    expect(onSelect).toHaveBeenCalledWith('d45');
  });

  it('reports a card once: a tap and the rest that follows it are one choice', () => {
    const onSelect = jest.fn();
    render(<Harness onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('recurring-duration-carousel-option-d90'));
    settleAt(3);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('marks the chosen card selected for assistive tech', () => {
    render(<Harness initial="d120" />);

    expect(
      screen.getByTestId('recurring-duration-carousel-option-d120').props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByTestId('recurring-duration-carousel-option-d60').props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it('follows a choice made from outside', () => {
    const { rerender } = render(
      <DurationCarousel options={DURATION_OPTIONS} selectedId="d30" onSelect={jest.fn()} />,
    );

    rerender(
      <DurationCarousel options={DURATION_OPTIONS} selectedId="d150" onSelect={jest.fn()} />,
    );

    expect(
      screen.getByTestId('recurring-duration-carousel-option-d150').props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it('cannot choose a disabled card, by tap or by rest', () => {
    const onSelect = jest.fn();
    const options = DURATION_OPTIONS.map((option) => ({
      ...option,
      disabled: option.id === 'd90',
    }));
    render(<Harness options={options} initial="d60" onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('recurring-duration-carousel-option-d90'));
    act(() => settleAt(3));

    expect(onSelect).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('recurring-duration-carousel-option-d90').props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it('counts the options in its dots', () => {
    render(<Harness />);

    for (let index = 0; index < DURATION_OPTIONS.length; index += 1) {
      expect(dot(index)).toBeTruthy();
    }
    expect(
      screen.queryByTestId(`recurring-duration-carousel-dot-${DURATION_OPTIONS.length}`, HIDDEN),
    ).toBeNull();
  });
});
