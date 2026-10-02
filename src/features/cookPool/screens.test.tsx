import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { resetCookPoolDemo } from './data';
import { CookPoolScreen } from './screens/CookPoolScreen';
import { CookProfileScreen } from './screens/CookProfileScreen';

const SANCHITA = 'demo-pool-sanchita';

function renderLanding() {
  const handlers = { onBack: jest.fn(), onAddCooks: jest.fn(), onOpenCook: jest.fn() };
  render(<CookPoolScreen {...handlers} />);
  return handlers;
}

describe('Cook Pool landing', () => {
  it('shows a new household two empty places, each opening the deck', () => {
    act(() => resetCookPoolDemo());
    const { onAddCooks } = renderLanding();
    const places = screen.getAllByTestId('cook-pool-screen-pool-add');
    expect(places).toHaveLength(2);
    fireEvent.press(places[0]!);
    expect(onAddCooks).toHaveBeenCalled();
  });

  it('lists the pool in its order, then one Add, and opens a cook', () => {
    act(() => resetCookPoolDemo(['demo-pool-rekha', SANCHITA]));
    const { onOpenCook } = renderLanding();
    const names = screen.getAllByText(/^(Rekha|Sanchita|Add)$/).map((node) => node.props.children);
    expect(names).toEqual(['Rekha', 'Sanchita', 'Add']);
    fireEvent.press(screen.getByTestId(`cook-pool-screen-pool-${SANCHITA}`));
    expect(onOpenCook).toHaveBeenCalledWith(SANCHITA);
  });
});

describe('Cook profile', () => {
  it('draws the backend lines and menu', () => {
    act(() => resetCookPoolDemo());
    render(<CookProfileScreen cookId={SANCHITA} onBack={jest.fn()} onRemoved={jest.fn()} />);
    expect(screen.getByText('Cook Sanchita')).toBeTruthy();
    expect(screen.getByText('Region: West Bengal')).toBeTruthy();
    expect(screen.getByText('No. of visits: 45')).toBeTruthy();
    expect(screen.getByText('Curries/ sabzis- Non Veg')).toBeTruthy();
    // Not in the pool: nothing to remove.
    expect(screen.queryByTestId('cook-profile-screen-remove')).toBeNull();
  });

  it('removes a pooled cook only after Remove is confirmed', () => {
    act(() => resetCookPoolDemo([SANCHITA]));
    const onRemoved = jest.fn();
    render(<CookProfileScreen cookId={SANCHITA} onBack={jest.fn()} onRemoved={onRemoved} />);

    fireEvent.press(screen.getByTestId('cook-profile-screen-remove'));
    expect(screen.getByText('Remove Cook Sanchita from your Cook Pool?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('cook-profile-screen-dialog-keep'));
    expect(onRemoved).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('cook-profile-screen-remove'));
    fireEvent.press(screen.getByTestId('cook-profile-screen-dialog-remove'));
    expect(onRemoved).toHaveBeenCalled();
    expect(screen.queryByTestId('cook-profile-screen-remove')).toBeNull();
  });

  it('hearts a dish', () => {
    act(() => resetCookPoolDemo());
    render(<CookProfileScreen cookId={SANCHITA} onBack={jest.fn()} onRemoved={jest.fn()} />);
    const heart = screen.getByTestId('dish-card-sanchita-dahi-bhindi-favourite');
    expect(heart.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    fireEvent.press(heart);
    expect(
      screen.getByTestId('dish-card-sanchita-dahi-bhindi-favourite').props.accessibilityState,
    ).toEqual(expect.objectContaining({ selected: true }));
  });

  it('reports a cook the household has never had', () => {
    render(<CookProfileScreen cookId="nobody" onBack={jest.fn()} onRemoved={jest.fn()} />);
    expect(screen.queryByText('Cook Sanchita')).toBeNull();
  });
});
