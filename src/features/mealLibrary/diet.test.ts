import { defaultDietFor } from './diet';

describe('defaultDietFor', () => {
  it.each(['vegan', 'vegetarian'])('opens a %s customer on Veg', (preference) => {
    expect(defaultDietFor(preference)).toBe('veg');
  });

  it.each(['eggetarian', 'non-vegetarian'])('opens a %s customer on Non-Veg', (preference) => {
    expect(defaultDietFor(preference)).toBe('nonVeg');
  });

  it('opens on Non-Veg when the profile has no answer', () => {
    expect(defaultDietFor(null)).toBe('nonVeg');
    expect(defaultDietFor(undefined)).toBe('nonVeg');
  });
});
