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

/**
 * `333:3542` … `333:3562` — the six "Reasons to rely on Spoon cooks" illustrations.
 *
 * FIVE of the six artworks changed in the current file, and the labels and order changed with
 * them: only "Trained" survives. The keys are therefore the CURRENT labels rather than the
 * superseded `amenable` / `hours` / `efficient` / `punctual` ids, and the six `trust-*.png`
 * files they pointed at are deleted rather than left orphaned.
 *
 * Each file is the NODE's crop baked in at 3× — the frame positions the source inside a smaller
 * box (e.g. `333:3542` draws its 3200² source at 94.49 % × 109.82 %, offset −2.5 % vertically),
 * so exporting the raw image and fitting it in code would not reproduce what Figma draws.
 */
export const HOME_REASON_ART: Record<string, ImageSourcePropType> = {
  trained: require('../../../assets/figma/home/reason-trained.png') as ImageSourcePropType,
  verified: require('../../../assets/figma/home/reason-verified.png') as ImageSourcePropType,
  hygienic: require('../../../assets/figma/home/reason-hygienic.png') as ImageSourcePropType,
  reliable: require('../../../assets/figma/home/reason-reliable.png') as ImageSourcePropType,
  available: require('../../../assets/figma/home/reason-available.png') as ImageSourcePropType,
  compliant: require('../../../assets/figma/home/reason-compliant.png') as ImageSourcePropType,
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

/**
 * `59:397` — the 25 × 26 profile glyph. The current file drops the separate ring: `59:400` is a
 * plain `#FFE666` 32pt disc with `overflow: clip`, so `BANNER_AVATAR_RING` is no longer drawn on
 * Home. It stays exported from `@ui` for the Address out-of-service banner, which still uses it.
 */
export { BANNER_AVATAR_GLYPH as HOME_ICON_CUSTOMER } from '@ui';

/** `156:44` — the Spoon mark closing the page. */
export const HOME_APP_LOGO =
  require('../../../assets/figma/home/app-logo.png') as ImageSourcePropType;

/**
 * The Home carousel — `378:189` "usecase sliders" (eight cards) plus `406:1325` "assist", all
 * exported at 3x their 217 x 268 box.
 *
 * The headline and the supporting line are BAKED INTO each artwork by the designer (the frames
 * are leaf image fills, not text layers over a photo), so these ship as complete cards rather
 * than as backgrounds with copy drawn on top. Redrawing the type in code would not reproduce the
 * design — it would replace it, which §1 forbids.
 *
 * `label` is therefore not display copy. It is the accessibility name for a card whose words a
 * screen reader cannot otherwise reach, transcribed from the artwork.
 *
 * ## Nine cards, in the founder's order
 *
 * V7 adds `406:1325` — "You don't have to do it all!" — which sits OUTSIDE the `378:189` grid, at
 * the section level, and was therefore missing entirely. It is card four.
 *
 * The order is NOT the file's reading order any more, and could not be: `378:189` lays its eight
 * cards out left-to-right / top-to-bottom for a designer to look at, and the ninth is not in the
 * grid at all. The sequence below is the one the founder specified for the running carousel
 * (task §16), resolved card-by-card against the ARTWORK rather than against the frame names —
 * "roti/rice" is the card that reads "You deserve to eat it hot!", "meal prep" is "Sorted for
 * days!", and so on. Each entry records the node it came from so the mapping can be re-checked.
 */
export interface HomeUsecaseSlide {
  readonly id: string;
  readonly source: ImageSourcePropType;
  readonly label: string;
}

export const HOME_USECASE_SLIDES: readonly HomeUsecaseSlide[] = [
  {
    // `367:56` "snacks"
    id: 'snacks',
    source: require('../../../assets/figma/home/usecase/snacks.png') as ImageSourcePropType,
    label: 'Crave guilt free! Your favourite snacks made healthy',
  },
  {
    // `378:184` "absent"
    id: 'absent',
    source: require('../../../assets/figma/home/usecase/absent.png') as ImageSourcePropType,
    label: "Cook absent? Daily meals sorted with Spoon's versatile cooks",
  },
  {
    // `367:66` "tiffin"
    id: 'tiffin',
    source: require('../../../assets/figma/home/usecase/tiffin.png') as ImageSourcePropType,
    label: 'Sleep for longer! Healthy tiffin cooked & packed for kids, everyday',
  },
  {
    // `406:1325` "assist" — NEW in V7, and the card that lives outside the `378:189` grid.
    id: 'assist',
    source: require('../../../assets/figma/home/usecase/assist.png') as ImageSourcePropType,
    label: "You don't have to do it all! Assistance with chopping, preparation etc.",
  },
  {
    // `375:169` "guests"
    id: 'guests',
    source: require('../../../assets/figma/home/usecase/guests.png') as ImageSourcePropType,
    label: "Tension free gatherings! Party food that's both guest & wallet friendly",
  },
  {
    // `375:120` "dry snacks"
    id: 'drysnacks',
    source: require('../../../assets/figma/home/usecase/drysnacks.png') as ImageSourcePropType,
    label: 'Munch as much as you want! Snacks made healthy with good ingredients',
  },
  {
    // `375:124` "breakfast"
    id: 'breakfast',
    source: require('../../../assets/figma/home/usecase/breakfast.png') as ImageSourcePropType,
    label: 'Breakfast only when required! Because breakfast are a waste on brunch days',
  },
  {
    // `367:77` "roti/rice"
    id: 'roti',
    source: require('../../../assets/figma/home/usecase/roti.png') as ImageSourcePropType,
    label: 'You deserve to eat it hot! Upgrade your meals with fresh & warm rotis',
  },
  {
    // `375:164` "meal prep"
    id: 'mealprep',
    source: require('../../../assets/figma/home/usecase/mealprep.png') as ImageSourcePropType,
    label: 'Sorted for days! Curries prepared and packed, ready to eat',
  },
];

/** `393:1205` — the 32pt Sad Cloud on the cancelled banner's apology row (`393:1202`). */
export const HOME_BANNER_SAD_CLOUD =
  require('../../../assets/figma/home/banner-sad-cloud.png') as ImageSourcePropType;
