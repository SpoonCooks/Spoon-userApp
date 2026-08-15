import { fireEvent, render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';

import { DEMO_MEAL_BRIEF } from '@/demo/fixtures/screens';
import { MealBriefView } from './MealBriefScreen';

const actions = { onBack: jest.fn(), onSkip: jest.fn(), onSubmit: jest.fn() };

function renderBrief() {
  return render(<MealBriefView state={ready(DEMO_MEAL_BRIEF)} onRetry={jest.fn()} {...actions} />);
}

describe('Meal Brief (3:684)', () => {
  it('renders the four dietary options — the diet axis is never a boolean (C-7)', () => {
    renderBrief();

    expect(screen.getByTestId('meal-brief-diet-veg')).toBeTruthy();
    expect(screen.getByTestId('meal-brief-diet-non-veg')).toBeTruthy();
    expect(screen.getByTestId('meal-brief-diet-jain')).toBeTruthy();
    expect(screen.getByTestId('meal-brief-diet-eggetarian')).toBeTruthy();
  });

  it('is skippable, as the design specifies', () => {
    renderBrief();

    fireEvent.press(screen.getByTestId('meal-brief-skip'));
    expect(actions.onSkip).toHaveBeenCalledTimes(1);
  });

  it('starts with the server-preselected dishes and toggles multi-select', () => {
    renderBrief();

    const preselected = screen.getByTestId('meal-brief-dish-dal-tadka');
    expect(preselected.props.accessibilityState.selected).toBe(true);

    fireEvent.press(preselected);
    expect(screen.getByTestId('meal-brief-dish-dal-tadka').props.accessibilityState.selected).toBe(
      false,
    );

    const other = screen.getByTestId('meal-brief-dish-aloo-gobi');
    fireEvent.press(other);
    expect(screen.getByTestId('meal-brief-dish-aloo-gobi').props.accessibilityState.selected).toBe(
      true,
    );
  });

  it('steps guests within the server-supplied bounds', () => {
    renderBrief();

    expect(screen.getByTestId('meal-brief-guests-value')).toHaveTextContent('2');

    fireEvent.press(screen.getByTestId('meal-brief-guests-plus'));
    expect(screen.getByTestId('meal-brief-guests-value')).toHaveTextContent('3');

    fireEvent.press(screen.getByTestId('meal-brief-guests-minus'));
    fireEvent.press(screen.getByTestId('meal-brief-guests-minus'));
    expect(screen.getByTestId('meal-brief-guests-value')).toHaveTextContent('1');

    // At the server-provided minimum the control is disabled rather than clamping silently.
    expect(screen.getByTestId('meal-brief-guests-minus').props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it('adds a custom dish', () => {
    renderBrief();

    fireEvent.changeText(screen.getByTestId('meal-brief-custom-dish'), 'Baingan Bharta');
    fireEvent.press(screen.getByTestId('meal-brief-add-dish'));

    // `3:725` puts a custom dish into the SAME chip flow as the catalogue dishes, already selected.
    expect(screen.getByTestId('meal-brief-custom-Baingan Bharta')).toBeTruthy();
    expect(screen.getByText('Baingan Bharta')).toBeTruthy();
  });

  it('collects the whole draft and hands it to the callback', () => {
    renderBrief();

    fireEvent.press(screen.getByTestId('meal-brief-diet-jain'));
    fireEvent.changeText(screen.getByTestId('meal-brief-recipe-url'), 'https://example.test/reel');
    fireEvent.changeText(screen.getByTestId('meal-brief-notes'), 'Low oil please');
    fireEvent.press(screen.getByTestId('meal-brief-submit'));

    expect(actions.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        dietaryId: 'jain',
        guests: 2,
        recipeUrl: 'https://example.test/reel',
        notes: 'Low oil please',
      }),
    );
  });
});
