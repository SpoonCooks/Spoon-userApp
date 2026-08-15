import type { ImageSourcePropType } from 'react-native';

/**
 * Static design assets exported from Figma `QMgajesW22fQcUbs7TKspS` Page 3a and committed under
 * `assets/figma/`. Each was downsized from its Figma source to 3× its rendered box.
 *
 * These are DESIGN assets, not content: the cuisine, reasons and exclusion artwork is fixed
 * marketing imagery that ships with the app. Anything genuinely dynamic — cook photography above
 * all — stays data-driven and is never bundled here.
 *
 * A view model may still supply `imageUrl` for any tile; the screen prefers that over the bundled
 * asset, so the backend can take these over later without a code change.
 */

export const HOME_CUISINE_ART: Record<string, ImageSourcePropType> = {
  daily: require('../../../assets/figma/home/cuisine-daily.png') as ImageSourcePropType,
  north: require('../../../assets/figma/home/cuisine-north.png') as ImageSourcePropType,
  south: require('../../../assets/figma/home/cuisine-south.png') as ImageSourcePropType,
  asian: require('../../../assets/figma/home/cuisine-chinese.png') as ImageSourcePropType,
};

export const HOME_REASON_ART: Record<string, ImageSourcePropType> = {
  trained: require('../../../assets/figma/home/trust-trained.png') as ImageSourcePropType,
  hygienic: require('../../../assets/figma/home/trust-hygienic.png') as ImageSourcePropType,
  amenable: require('../../../assets/figma/home/trust-amenable.png') as ImageSourcePropType,
  hours: require('../../../assets/figma/home/trust-hours.png') as ImageSourcePropType,
  efficient: require('../../../assets/figma/home/trust-efficient.png') as ImageSourcePropType,
  punctual: require('../../../assets/figma/home/trust-punctual.png') as ImageSourcePropType,
};

export const HOME_EXCLUSION_ART: Record<string, ImageSourcePropType> = {
  utensils: require('../../../assets/figma/home/excl-utensils.png') as ImageSourcePropType,
  stove: require('../../../assets/figma/home/excl-stove.png') as ImageSourcePropType,
  electronics: require('../../../assets/figma/home/excl-electronics.png') as ImageSourcePropType,
  kitchen: require('../../../assets/figma/home/excl-kitchen.png') as ImageSourcePropType,
};

/** `59:518` / `59:391` — the bolt used in the banner headline and on the Instant tile. */
export const HOME_ICON_BOLT =
  require('../../../assets/figma/icons/lightning-bolt.png') as ImageSourcePropType;

/** `129:40` — the Schedule tile glyph. */
export const HOME_ICON_CALENDAR =
  require('../../../assets/figma/icons/calendar.png') as ImageSourcePropType;

/** `209:1225` — the default profile glyph, 25pt inside the ring. Shared with `215:1472`. */
export { BANNER_AVATAR_GLYPH as HOME_ICON_CUSTOMER } from '@ui';

/**
 * `209:1224` — the 32pt ring behind the profile glyph. Feather has no equivalent and the banner
 * ring is NOT a plain white circle, which is what the previous implementation drew.
 * Shared with the Address out-of-service banner (`218:1548`), so it is defined in `@ui`.
 */
export { BANNER_AVATAR_RING as HOME_ICON_AVATAR_RING } from '@ui';

/**
 * `209:1219` — the 8.35 × 3.69 caret beside the address label. Feather's `chevron-down` is a
 * 24pt stroked V and does not match this flat filled caret, so the Figma asset is used.
 */
export const HOME_ICON_CHEVRON =
  require('../../../assets/figma/icons/chevron-down.png') as ImageSourcePropType;

/**
 * `209:1405` — the upcoming-booking timer glyph.
 *
 * DESIGN_PENDING: the exported artwork is lime (`#D1FF03`) and the chip behind it is `#CFFF04`,
 * so the glyph is invisible — and it renders exactly that way IN FIGMA (verified against the
 * `59:587` node render, which shows a plain lime square). Wired up faithfully rather than
 * substituting a darker icon. The designer needs to give this glyph a contrasting fill.
 */
export const HOME_ICON_TIMER =
  require('../../../assets/figma/icons/timer.png') as ImageSourcePropType;

/** `156:44` — the Spoon mark closing the page. */
export const HOME_APP_LOGO =
  require('../../../assets/figma/home/app-logo.png') as ImageSourcePropType;
