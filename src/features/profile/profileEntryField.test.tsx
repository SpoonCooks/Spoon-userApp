import { fireEvent, render } from '@testing-library/react-native';

import { lightTheme } from '@ui';

import { ProfileDetailsView } from './screens/ProfileDetailsScreen';

/**
 * The grown-up-food search — the one control on this form that opens something beneath itself.
 *
 * Both defects here were reported off a handset, and both are about what the customer can
 * actually see: the placeholder read as typed-in text, and tapping the field opened a list that
 * the keyboard then covered.
 */

describe('the grown-up-food search', () => {
  it('draws its placeholder in the placeholder colour, not the body colour', () => {
    /*
     * "Rajasthani food" is a PROMPT, not an answer. At `textSecondary` (70% black) it read as
     * something the customer had already chosen, on a field whose whole job is to look empty
     * until they choose. Every other input in the app uses `textPlaceholder`; this screen was
     * the only one that did not.
     */
    const { getByTestId } = render(<ProfileDetailsView onSubmit={() => undefined} />);
    const input = getByTestId('profile-grown-up-entry');

    expect(input.props.placeholder).toBe('Rajasthani food');
    expect(input.props.placeholderTextColor).toBe(lightTheme.colors.textPlaceholder);
    expect(input.props.placeholderTextColor).not.toBe(lightTheme.colors.textSecondary);
  });

  it('uses the same placeholder colour on the other prompts of the form', () => {
    // One screen, one answer to "what does an unanswered field look like".
    const { getByTestId } = render(<ProfileDetailsView onSubmit={() => undefined} />);
    for (const id of ['profile-name', 'profile-pressing-issue']) {
      const input = getByTestId(id);
      expect(input.props.placeholderTextColor).toBe(lightTheme.colors.textPlaceholder);
    }
  });

  it('opens the whole list on focus, before anything is typed', () => {
    const { getByTestId } = render(<ProfileDetailsView onSubmit={() => undefined} />);
    fireEvent(getByTestId('profile-grown-up-entry'), 'focus');
    expect(getByTestId('profile-grown-up-options')).toBeTruthy();
  });

  it('measures the field and its list together, so the keyboard cannot hide the options', () => {
    /*
     * The reveal is driven off the BLOCK's layout, not the input's focus. Focus is one commit too
     * early — the list does not exist yet — and revealing the input alone stops scrolling as soon
     * as the field's own bottom edge clears the IME, which leaves every option behind it.
     *
     * What this asserts is the wiring: the block that contains both carries an `onLayout`. The
     * arithmetic it triggers is covered in `Screen`'s own tests, against measurements a jsdom
     * renderer cannot produce.
     */
    const { getByTestId } = render(<ProfileDetailsView onSubmit={() => undefined} />);
    fireEvent(getByTestId('profile-grown-up-entry'), 'focus');

    const block = getByTestId('profile-grown-up-block');
    expect(typeof block.props.onLayout).toBe('function');
    // The list is inside the measured block, which is the property that makes it revealable.
    expect(block.findByProps({ testID: 'profile-grown-up-options' })).toBeTruthy();
  });
});
