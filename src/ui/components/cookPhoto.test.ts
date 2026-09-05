import { Image } from 'react-native';

import type * as CookPhotoModule from './cookPhoto';
import type * as CookCardContentModule from './cookCardContent';

/*
 * Two Jest facts get in the way of observing which asset a cook resolves to, and both would let
 * this file pass on the very defect it exists to catch.
 *
 * `Image.resolveAssetSource` returns nothing under the renderer, so every bundled URI comes back
 * `undefined` and "all four cooks share one photograph" compares equal as `undefined ===
 * undefined`. And Jest's asset transform hands back one identical stub for every PNG `require`,
 * so echoing the argument distinguishes nothing either.
 *
 * Numbering the resolve calls sidesteps both: the module resolves each photograph once, at import,
 * so a per-call identity makes "four separate assets" observable.
 */
let resolved = 0;
jest
  .spyOn(Image, 'resolveAssetSource')
  .mockImplementation(
    () => ({ uri: `asset:${(resolved += 1)}`, width: 512, height: 512, scale: 1 }) as never,
  );

/* eslint-disable @typescript-eslint/no-require-imports */
const { cookPhotoFor } = require('./cookPhoto') as typeof CookPhotoModule;
const { cookCardContentFor } = require('./cookCardContent') as typeof CookCardContentModule;
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * One cook, one photograph, on every surface that draws her.
 *
 * This has gone wrong four separate ways: JPEG conversion dropped the alpha and every card showed
 * a black box; one photograph was shared by all four cooks; a centred crop cut the top of a 2:3
 * portrait off; and the Home banner resolved a SEPARATE `cutoutPhotoUrl` that stayed a single
 * shared picture of Rekha, so it drew her over every booking while the screen one tap inside drew
 * the right person.
 *
 * Every one of those was invisible from inside the surface that had it, and every one was found
 * by a person looking at two screens side by side. The cases below are the cheap version of that
 * comparison: they enumerate the SURFACES rather than checking one, so a fifth surface added
 * without going through `cookPhotoFor` is a failing test rather than a founder's screenshot.
 */
describe('one cook, one photograph', () => {
  const CODES = ['COOK_REKHA', 'COOK_SANCHITA', 'COOK_BARSHA', 'COOK_JYOTI'] as const;

  it('gives each published cook a photograph of her own', () => {
    const photos = CODES.map((profileCode) => cookPhotoFor({ profileCode }));

    for (const photo of photos) expect(typeof photo).toBe('string');
    // The regression: four cooks collapsing onto one asset.
    expect(new Set(photos).size).toBe(CODES.length);
  });

  /**
   * The surfaces, as their adapters call the resolver.
   *
   * `photoUrl` is the booking schema's normalisation; `profileImageUrl` is the raw server spelling
   * that History reads. A surface reading the wrong one used to get nothing at all.
   */
  const SURFACES = {
    'booking card': (code: string) => cookPhotoFor({ photoUrl: null, profileCode: code }),
    'home banner': (code: string) => cookPhotoFor({ profileCode: code }),
    history: (code: string) => cookPhotoFor({ profileImageUrl: null, profileCode: code }),
    completion: (code: string) => cookPhotoFor({ profileCode: code, photoUrl: undefined }),
  };

  it('draws the SAME photograph on every surface', () => {
    for (const profileCode of CODES) {
      const drawn = Object.values(SURFACES).map((resolve) => resolve(profileCode));
      // The founder's bug in one line: Home disagreeing with the booking screen.
      expect(new Set(drawn).size).toBe(1);
      expect(drawn[0]).toBe(cookCardContentFor(profileCode)?.photoUrl);
    }
  });

  it('lets a hosted photograph win over the bundled one, in either spelling', () => {
    // The real person as the backend published them always beats a bundled export.
    expect(cookPhotoFor({ photoUrl: 'https://cdn/x.png', profileCode: 'COOK_REKHA' })).toBe(
      'https://cdn/x.png',
    );
    expect(cookPhotoFor({ profileImageUrl: 'https://cdn/y.png', profileCode: 'COOK_REKHA' })).toBe(
      'https://cdn/y.png',
    );
  });

  it('answers null rather than substituting somebody else', () => {
    // An unpublished cook draws NO photograph. Falling back to a sample is what put one cook's
    // face on another cook's booking, so absence has to stay expressible.
    expect(cookPhotoFor({ profileCode: 'COOK_NOT_REAL' })).toBeNull();
    expect(cookPhotoFor({})).toBeNull();
    expect(cookPhotoFor(null)).toBeNull();
  });
});
