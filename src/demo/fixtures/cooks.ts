import type { CookViewModel } from '@ui/types/viewModels';
import {
  COOK_CARD_PHOTO,
  cookCardContentFor,
  type CookCardContent,
} from '@ui/components/cookCardContent';

/**
 * DEMO / TEST FIXTURES — NOT PRODUCTION DATA.
 *
 * Everything in `src/demo/` exists to exercise components before a backend contract exists. It is
 * never imported by a feature module or a production screen; the only consumers are the component
 * showcase (`src/app/(dev)/showcase.tsx`, dev-only) and tests.
 *
 * The card CONTENT itself — the photographs and the per-cook designed dish-chip lists — is no
 * longer transcribed here. It lives in `@ui/components/cookCardContent.ts`, keyed by the
 * backend's stable `profileCode`, because production adapters resolve it there. These fixtures
 * compose that same content with sample identity fields, so the showcase, the tests and the real
 * card can never drift apart: one transcription, three readers.
 */

/**
 * Kept exports: the same bundled photograph, under its historical fixture names.
 *
 * `COOK_CUTOUT_PHOTO` is now an alias of the same picture. The cut-out was never a different
 * image — every export already carries its alpha — and keeping them apart is what let the Home
 * banner drift onto one cook's face for every booking.
 */
export const COOK_SAMPLE_PHOTO = COOK_CARD_PHOTO;
export const COOK_CUTOUT_PHOTO = COOK_CARD_PHOTO;

/**
 * Every card in `289:8515` earns all three badges. That is a property of the SAMPLE, not of cooks
 * — see `CookBadgesViewModel` — so `DEMO_COOK_PARTIAL_BADGES` still exercises the other case.
 */
const ALL_BADGES = { spoonTrained: true, backgroundVerified: true, hygienic: true } as const;

function contentOf(profileCode: string): CookCardContent {
  const content = cookCardContentFor(profileCode);
  if (content === undefined) throw new Error(`no bundled card content for ${profileCode}`);
  return content;
}

/** `289:8388` / `289:8263` — Cook Rekha, standard and pure veg. */
export const DEMO_COOK_REKHA: CookViewModel = {
  id: 'demo-cook-rekha',
  displayName: 'Cook Rekha',
  firstName: 'Rekha',
  photoUrl: COOK_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'West Bengal',
  // `299:1811` draws the language glyph with no label on this card — no language data.
  specialties: contentOf('COOK_REKHA').specialties,
  pureVegSpecialties: contentOf('COOK_REKHA').pureVegSpecialties,
  badges: ALL_BADGES,
};

/** `289:7392` / `289:7891` — Cook Jyoti, standard and pure veg. */
export const DEMO_COOK_JYOTI: CookViewModel = {
  id: 'demo-cook-jyoti',
  displayName: 'Cook Jyoti',
  firstName: 'Jyoti',
  photoUrl: COOK_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'Odisha',
  languages: ['Hindi', 'Odiya'],
  specialties: contentOf('COOK_JYOTI').specialties,
  pureVegSpecialties: contentOf('COOK_JYOTI').pureVegSpecialties,
  badges: ALL_BADGES,
};

/** `299:2255` / `289:7642` — Cook Sanchita, standard and pure veg. */
export const DEMO_COOK_SANCHITA: CookViewModel = {
  id: 'demo-cook-sanchita-full',
  displayName: 'Cook Sanchita',
  firstName: 'Sanchita',
  photoUrl: COOK_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'West Bengal',
  specialties: contentOf('COOK_SANCHITA').specialties,
  pureVegSpecialties: contentOf('COOK_SANCHITA').pureVegSpecialties,
  badges: ALL_BADGES,
};

/** `289:7266` / `289:7767` — Cook Barsha, standard and pure veg. */
export const DEMO_COOK_BARSHA: CookViewModel = {
  id: 'demo-cook-barsha',
  displayName: 'Cook Barsha',
  firstName: 'Barsha',
  photoUrl: COOK_SAMPLE_PHOTO,
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'West Bengal',
  // `299:1811` draws the language glyph with no label on this card too.
  specialties: contentOf('COOK_BARSHA').specialties,
  pureVegSpecialties: contentOf('COOK_BARSHA').pureVegSpecialties,
  badges: ALL_BADGES,
};

/** All eight finalized Cook-profile frames, in section order. */
export const DEMO_COOK_PROFILES = [
  { cook: DEMO_COOK_JYOTI, variant: 'standard', node: '289:7392' },
  { cook: DEMO_COOK_REKHA, variant: 'standard', node: '289:8388' },
  { cook: DEMO_COOK_SANCHITA, variant: 'standard', node: '299:2255' },
  { cook: DEMO_COOK_BARSHA, variant: 'standard', node: '289:7266' },
  { cook: DEMO_COOK_JYOTI, variant: 'pureVeg', node: '289:7891' },
  { cook: DEMO_COOK_REKHA, variant: 'pureVeg', node: '289:8263' },
  { cook: DEMO_COOK_SANCHITA, variant: 'pureVeg', node: '289:7642' },
  { cook: DEMO_COOK_BARSHA, variant: 'pureVeg', node: '289:7767' },
] as const;

/** A cook with only some badges earned — the case the sample cards never show. */
export const DEMO_COOK_PARTIAL_BADGES: CookViewModel = {
  id: 'demo-cook-sanchita',
  displayName: 'Cook Sanchita',
  firstName: 'Sanchita',
  gender: 'Female',
  cuisine: 'North Indian',
  homeState: 'Assam',
  languages: ['Hindi', 'Assamese'],
  specialties: contentOf('COOK_SANCHITA').specialties.slice(0, 3),
  badges: { spoonTrained: true },
};

/** Nothing optional supplied — proves the card degrades instead of breaking. */
export const DEMO_COOK_MINIMAL: CookViewModel = {
  id: 'demo-cook-minimal',
  displayName: 'Cook Jyoti',
  firstName: 'Jyoti',
};
