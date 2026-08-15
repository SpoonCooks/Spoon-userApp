import { fireEvent, render, screen } from '@testing-library/react-native';

import { RATING_VALUES, RatingWidget } from './RatingWidget';

describe('RatingWidget — scale', () => {
  it('offers exactly the 9 values from the reference frame', () => {
    render(<RatingWidget value={null} onChange={jest.fn()} />);

    expect(RATING_VALUES).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);
    RATING_VALUES.forEach((value) => {
      expect(screen.getByTestId(`rating-widget-${value}`)).toBeTruthy();
    });
  });

  it('renders half steps as selectable controls, not display-only', () => {
    const onChange = jest.fn();
    render(<RatingWidget value={null} onChange={onChange} />);

    fireEvent.press(screen.getByTestId('rating-widget-2.5'));
    fireEvent.press(screen.getByTestId('rating-widget-4.5'));

    expect(onChange).toHaveBeenNthCalledWith(1, 2.5);
    expect(onChange).toHaveBeenNthCalledWith(2, 4.5);
  });

  it('reports every valid value through onChange', () => {
    const onChange = jest.fn();
    render(<RatingWidget value={null} onChange={onChange} />);

    RATING_VALUES.forEach((value) => fireEvent.press(screen.getByTestId(`rating-widget-${value}`)));

    expect(onChange.mock.calls.map((call) => call[0])).toEqual([...RATING_VALUES]);
  });
});

describe('RatingWidget — controlled selection', () => {
  it('marks only the current value as selected', () => {
    render(<RatingWidget value={3.5} onChange={jest.fn()} />);

    expect(screen.getByTestId('rating-widget-3.5').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('rating-widget-3').props.accessibilityState.selected).toBe(false);
  });

  it('selects nothing when the value is null', () => {
    render(<RatingWidget value={null} onChange={jest.fn()} />);

    RATING_VALUES.forEach((value) => {
      expect(screen.getByTestId(`rating-widget-${value}`).props.accessibilityState.selected).toBe(
        false,
      );
    });
  });

  it('does not manage its own state — the parent owns the value', () => {
    const onChange = jest.fn();
    render(<RatingWidget value={1} onChange={onChange} />);

    fireEvent.press(screen.getByTestId('rating-widget-5'));

    expect(onChange).toHaveBeenCalledWith(5);
    expect(screen.getByTestId('rating-widget-1').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('rating-widget-5').props.accessibilityState.selected).toBe(false);
  });
});

describe('RatingWidget — accessibility', () => {
  it('exposes radio semantics with a spoken value', () => {
    render(<RatingWidget value={4} onChange={jest.fn()} />);

    const chip = screen.getByTestId('rating-widget-4');
    expect(chip.props.accessibilityRole).toBe('radio');
    expect(chip.props.accessibilityLabel).toBe('4 out of 5');
    expect(chip.props.accessibilityState.checked).toBe(true);
  });

  it('marks every option disabled when the control is disabled', () => {
    const onChange = jest.fn();
    render(<RatingWidget value={null} onChange={onChange} disabled />);

    const chip = screen.getByTestId('rating-widget-3');
    expect(chip.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(chip);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RatingWidget — exceptional-service prompt', () => {
  it('is hidden by default', () => {
    render(<RatingWidget value={null} onChange={jest.fn()} />);

    expect(screen.queryByTestId('rating-widget-prompt')).toBeNull();
  });

  it('shows the 5+ badge and prompt copy when enabled', () => {
    render(<RatingWidget value={5} onChange={jest.fn()} showExceptionalPrompt />);

    expect(screen.getByTestId('rating-widget-prompt')).toBeTruthy();
    expect(screen.getByText('5+')).toBeTruthy();
    expect(screen.getByText(/exceeded your expectations/)).toBeTruthy();
  });
});
