import type { ImageSourcePropType } from 'react-native';

/**
 * Auth artwork exported from the NEW Figma `1kd1u3WEc00SENkToIPloW`.
 *
 * All three are STATIC design assets (task §10 class A), exported from the node so the frame's own
 * cropping is baked in rather than re-derived in code.
 */

/** `225:1640` — the 364pt Login hero band, exported composed so the `object-cover` crop is exact. */
export const AUTH_HERO =
  require('../../../assets/figma/auth/login-hero.jpg') as ImageSourcePropType;

/**
 * `225:1630` / `227:1668` — the 134 × 93 logo lockup. The node clips a taller source
 * (`h 143.37% / top −14.87%`), so the NODE is exported, not the raw image.
 */
export const AUTH_LOGO_LOCKUP =
  require('../../../assets/figma/auth/logo-lockup.png') as ImageSourcePropType;

/**
 * `227:1700` — the 14pt "change number" pencil. A FILLED `#FFD600` glyph with an underline bar;
 * Feather's stroked `edit-2` is not the same mark, so the asset is used (task §6).
 */
export const AUTH_EDIT_PHONE =
  require('../../../assets/figma/auth/edit-phone.png') as ImageSourcePropType;
