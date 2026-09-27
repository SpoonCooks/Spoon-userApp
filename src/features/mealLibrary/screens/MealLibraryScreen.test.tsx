import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithDefaultRuntime as render } from '@/test/renderWithRuntime';

import type { LibraryDish, LibraryIngredient, MealSlot } from '../types';
import { MealLibraryScreen } from './MealLibraryScreen';
import type { MealLibraryScreenProps } from './MealLibraryScreen';

/**
 * The screen draws whatever the backend sends: these lists are deliberately NOT the design's
 * five meals / twelve ingredients / six dishes, so a count baked into the UI would fail here.
 */
const MEALS: readonly MealSlot[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'brunch', label: 'Brunch' },
];

const INGREDIENTS: readonly LibraryIngredient[] = [
  { id: 'egg', label: 'Egg', title: 'Eggs', emoji: '🥚' },
  { id: 'dal', label: 'Dal', imageUrl: 'https://example.test/dal.png' },
  { id: 'rice', label: 'Rice' },
];

const DISHES: readonly LibraryDish[] = [
  { id: 'omelette', name: 'Omelette', cookMinutes: 10, diet: 'nonVeg' },
  { id: 'egg-bhurji', name: 'Egg Bhurji', cookMinutes: 15, diet: 'nonVeg' },
  { id: 'egg-curry', name: 'Egg Curry', cookMinutes: 30, diet: 'nonVeg' },
  { id: 'poha', name: 'Poha', cookMinutes: 20, diet: 'veg' },
  { id: 'upma', name: 'Upma', cookMinutes: 20, diet: 'veg' },
];

function renderScreen(overrides: Partial<MealLibraryScreenProps> = {}) {
  const props: MealLibraryScreenProps = {
    meals: MEALS,
    selectedMealId: 'breakfast',
    onSelectMeal: jest.fn(),
    ingredients: INGREDIENTS,
    selectedIngredientId: 'egg',
    onSelectIngredient: jest.fn(),
    dishes: DISHES,
    ...overrides,
  };
  render(<MealLibraryScreen {...props} />);
  return props;
}

const TID = 'meal-library-screen';

describe('MealLibraryScreen', () => {
  it('draws one tab, one rail item and one tile per item it is given', () => {
    // A non-veg profile opens on Non-Veg; clear it so every dish is drawn.
    renderScreen({ dietaryPreference: 'non-vegetarian' });
    fireEvent.press(screen.getByTestId(`${TID}-diet-nonVeg`));

    expect(screen.getAllByRole('tab')).toHaveLength(MEALS.length + INGREDIENTS.length);
    for (const dish of DISHES) {
      expect(screen.getByTestId(`${TID}-dish-${dish.id}`)).toBeTruthy();
    }
  });

  it('titles the grid with the ingredient, falling back to its label', () => {
    renderScreen();
    expect(screen.getByText('Eggs')).toBeTruthy();
  });

  it('reports meal and ingredient taps to the caller, which owns the selection', () => {
    const props = renderScreen();
    fireEvent.press(screen.getByTestId(`${TID}-meals-brunch`));
    fireEvent.press(screen.getByTestId(`${TID}-ingredients-dal`));
    expect(props.onSelectMeal).toHaveBeenCalledWith('brunch');
    expect(props.onSelectIngredient).toHaveBeenCalledWith('dal');
  });

  it('opens a vegetarian profile on Veg, and Veg shows only veg dishes', () => {
    renderScreen({ dietaryPreference: 'vegetarian' });
    expect(screen.getByTestId(`${TID}-dish-poha`)).toBeTruthy();
    expect(screen.queryByTestId(`${TID}-dish-omelette`)).toBeNull();
  });

  it('draws every tile with its add button, and reports the dish added', () => {
    const onAddDish = jest.fn();
    renderScreen({ dietaryPreference: 'vegetarian', onAddDish });
    fireEvent.press(screen.getByTestId(`${TID}-dish-poha-add`));
    expect(onAddDish).toHaveBeenCalledWith(DISHES[3]);
  });

  it('draws the add button even when no caller handles it yet', () => {
    renderScreen({ dietaryPreference: 'vegetarian' });
    expect(screen.getByTestId(`${TID}-dish-upma-add`)).toBeTruthy();
  });

  it('draws an empty state when the backend sends no dishes', () => {
    renderScreen({ dishes: [] });
    expect(screen.getByTestId(`${TID}-empty`)).toBeTruthy();
  });

  it('reports the search query and draws the results it is handed', () => {
    const onSearchChange = jest.fn();
    renderScreen({
      dietaryPreference: 'non-vegetarian',
      onSearchChange,
      searchResults: [DISHES[1] as LibraryDish],
    });

    fireEvent.press(screen.getByTestId(`${TID}-search`));
    fireEvent.changeText(screen.getByTestId(`${TID}-search-input`), '  bhurji ');

    expect(onSearchChange).toHaveBeenLastCalledWith('bhurji');
    expect(screen.getByTestId(`${TID}-dish-egg-bhurji`)).toBeTruthy();
    expect(screen.queryByTestId(`${TID}-dish-omelette`)).toBeNull();

    fireEvent.press(screen.getByTestId(`${TID}-search-close`));
    expect(onSearchChange).toHaveBeenLastCalledWith('');
  });
});
