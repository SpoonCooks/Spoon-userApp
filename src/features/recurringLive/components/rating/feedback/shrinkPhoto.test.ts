import { PHOTO_LONG_EDGE, shrinkPhoto, shrunkSize } from './shrinkPhoto';

jest.mock('@core/native', () => ({ loadExpoImageManipulator: () => null }));

describe('rating photo shrink', () => {
  it('brings the longest side down to 1600, keeping the shape, portrait or landscape', () => {
    expect(shrunkSize(4000, 3000)).toEqual({ width: PHOTO_LONG_EDGE, height: 1200 });
    expect(shrunkSize(3024, 4032)).toEqual({ width: 1200, height: PHOTO_LONG_EDGE });
  });

  it('never enlarges a photo that is already small', () => {
    expect(shrunkSize(1200, 900)).toBeNull();
    expect(shrunkSize(1600, 1600)).toBeNull();
    expect(shrunkSize(0, 0)).toBeNull();
  });

  it('keeps the original on a build without the manipulator', async () => {
    await expect(shrinkPhoto('file:///photo.jpg')).resolves.toBeNull();
  });
});
