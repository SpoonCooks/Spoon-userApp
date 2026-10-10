import type { ImageSourcePropType } from 'react-native';

/**
 * Static artwork for the login redesign, exported from Figma `cCQlzTeiObQkpVBzwI8mZi` (page
 * "Login") into `assets/figma/login/`. Vector layers were rasterised at 3× their rendered box (the
 * app has no SVG renderer), the same way `homeRedesign/assets.ts` does it.
 */
const img = (source: unknown) => source as ImageSourcePropType;

export const LOGIN_ART = {
  /** `1928:1076` — "Hero photo · cook at work", the raw photograph (drawn `object-cover`). */
  hero: img(require('../../../../assets/figma/login/hero.jpg')),
  /**
   * `1923:1306` — "Sheet · curve". Only its curved top edge (the first 48pt: `M0 48C110 -16 292
   * -16 402 48`) is an image; the rest of the sheet is plain white and drawn as a View, so it can
   * be any height.
   */
  sheetCurve: img(require('../../../../assets/figma/login/sheet-curve.png')),
  /** `1940:5638` — the 138 × 100 black Spoon logo. */
  logo: img(require('../../../../assets/figma/login/logo.png')),
  /** `827:115` Icon/Lock — "Background verified". */
  lock: img(require('../../../../assets/figma/login/icon-lock.png')),
  /** `1005:125` Icon/Profile — "Female cooks only". */
  profile: img(require('../../../../assets/figma/login/icon-profile.png')),
  /** `543:2344` Done_round — "Trained for all needs". */
  done: img(require('../../../../assets/figma/login/icon-done.png')),
  /** `543:2380` Instant — "15-min arrival". */
  instant: img(require('../../../../assets/figma/login/icon-instant.png')),
  /** `1940:7597` Icon/Exclamation — the inline error mark, 16pt. */
  exclamation: img(require('../../../../assets/figma/login/icon-exclamation.png')),
  /** `1195:126` Icon/Time — the resend countdown pill. */
  time: img(require('../../../../assets/figma/login/icon-time.png')),
  /** `1819:2928` Icon/Edit_light — the Edit pill. */
  edit: img(require('../../../../assets/figma/login/icon-edit.png')),
  /** `43:63` Icon/Chevron left — the floating Back button. */
  chevronLeft: img(require('../../../../assets/figma/login/icon-chevron-left.png')),
  /** `543:2337` Interface / Restart — "Resend via SMS". */
  restart: img(require('../../../../assets/figma/login/icon-restart.png')),
} as const;
