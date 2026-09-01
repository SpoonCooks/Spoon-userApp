import { Image } from 'react-native';

import type * as CookCardContentModule from './cookCardContent';

/*
 * Two things get in the way of observing which asset a cook resolves to, and both are Jest's.
 *
 * `Image.resolveAssetSource` returns nothing under the Jest renderer, so every bundled URI comes
 * back `undefined` — and "all four cooks share one photograph" would pass by collapsing to
 * `undefined === undefined`, the exact defect this file exists to catch. And Jest's asset
 * transform hands back the SAME stub for every `require` of a PNG, so echoing the argument does
 * not distinguish them either.
 *
 * Numbering the calls sidesteps both. The module resolves each photograph once, at import, so a
 * per-call identity makes "four separate assets" observable — while two fields pointing at ONE
 * constant still resolve once and stay equal, which is the property the fix turns on.
 */
let resolved = 0;
jest
  .spyOn(Image, 'resolveAssetSource')
  .mockImplementation(
    () => ({ uri: `asset:${(resolved += 1)}`, width: 512, height: 512, scale: 1 }) as never,
  );

// Loaded after the mock is installed, because it resolves its assets at import time — which is
// what a static `import` could not guarantee here.
/* eslint-disable @typescript-eslint/no-require-imports */
const { COOK_CARD_CUTOUT_PHOTO, cookCardContentFor } =
  require('./cookCardContent') as typeof CookCardContentModule;
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * The Home banner must draw the cook who is actually coming.
 *
 * `cutoutPhotoUrl` was the SAME shared export for all four cooks, so the active-booking banner on
 * Home drew Rekha's face over every upcoming booking, while the booking screen one tap beneath it
 * — which reads `photoUrl` — drew the right cook. A founder testing a booking with Sanchita saw
 * Rekha on Home and Sanchita inside.
 *
 * The card exports already carry their own alpha (39–47% of each is fully transparent), so the
 * banner takes the same file the card does rather than a second asset kept in step by hand.
 */
describe('every cook resolves to her OWN cut-out', () => {
  const CODES = ['COOK_REKHA', 'COOK_SANCHITA', 'COOK_BARSHA', 'COOK_JYOTI'] as const;

  it('gives each published cook a distinct cut-out', () => {
    const cutouts = CODES.map((code) => cookCardContentFor(code)?.cutoutPhotoUrl);

    for (const cutout of cutouts) expect(typeof cutout).toBe('string');
    // The regression itself: four cooks collapsing onto one asset.
    expect(new Set(cutouts).size).toBe(CODES.length);
  });

  it('draws the same person on the banner as on the card', () => {
    // The two surfaces disagreeing is precisely what was seen on the handset.
    for (const code of CODES) {
      const content = cookCardContentFor(code);
      expect(content?.cutoutPhotoUrl).toBe(content?.photoUrl);
    }
  });

  it('never falls back to the shared sample for a published cook', () => {
    for (const code of CODES) {
      expect(cookCardContentFor(code)?.cutoutPhotoUrl).not.toBe(COOK_CARD_CUTOUT_PHOTO);
    }
  });

  it('resolves nothing for a cook that is not published', () => {
    // Unchanged: an unknown code yields no bundled content, so the banner renders without a photo
    // rather than borrowing someone else's face.
    expect(cookCardContentFor('COOK_NOT_REAL')).toBeUndefined();
    expect(cookCardContentFor(null)).toBeUndefined();
  });
});
