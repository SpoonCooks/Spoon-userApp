import { fireEvent, render, screen } from '@testing-library/react-native';

import { BookingTabSwitcher } from './BookingTabSwitcher';
import type { BookingTabOption } from './BookingTabSwitcher';

const OPTIONS: readonly BookingTabOption[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

describe('BookingTabSwitcher', () => {
  it('renders every option label', () => {
    render(<BookingTabSwitcher options={OPTIONS} selectedId="upcoming" onSelect={jest.fn()} />);

    expect(screen.getByText('Upcoming')).toBeTruthy();
    expect(screen.getByText('Past')).toBeTruthy();
  });

  it('marks only the active segment as selected', () => {
    render(<BookingTabSwitcher options={OPTIONS} selectedId="past" onSelect={jest.fn()} />);

    expect(screen.getByTestId('booking-tab-switcher-past').props.accessibilityState.selected).toBe(
      true,
    );
    expect(
      screen.getByTestId('booking-tab-switcher-upcoming').props.accessibilityState.selected,
    ).toBe(false);
  });

  it('reports the id pressed, not the one already active', () => {
    const onSelect = jest.fn();
    render(<BookingTabSwitcher options={OPTIONS} selectedId="upcoming" onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('booking-tab-switcher-past'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('past');
  });

  it('still reports a press on the already-active segment — the host decides whether to act on it', () => {
    const onSelect = jest.fn();
    render(<BookingTabSwitcher options={OPTIONS} selectedId="upcoming" onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('booking-tab-switcher-upcoming'));

    expect(onSelect).toHaveBeenCalledWith('upcoming');
  });

  it('exposes a radiogroup, matching the accessibility shape ChipGroup already established', () => {
    render(<BookingTabSwitcher options={OPTIONS} selectedId="upcoming" onSelect={jest.fn()} />);

    expect(screen.getByTestId('booking-tab-switcher').props.accessibilityRole).toBe('radiogroup');
  });
});
