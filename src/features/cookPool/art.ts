import type { ImageSourcePropType } from 'react-native';

/**
 * Cook Pool art, exported from Figma `cCQlzTeiObQkpVBzwI8mZi` at @3x. The blurred glows are
 * rendered from their SVGs' own ellipses and blur radii, which the app's image pipeline cannot
 * draw itself.
 */

/** `844:5843` — the landing's four glows, 402×411 from the top of the screen. */
export const LANDING_GLOWS =
  require('../../../assets/figma/cookpool/landing-glows.png') as ImageSourcePropType;
/** `844:5852` — the hero: the cook at the stove, cropped to its 370×235 frame. */
export const LANDING_HERO =
  require('../../../assets/figma/cookpool/hero.webp') as ImageSourcePropType;
/** `844:5869` — "How it works?": heart → cook → pencil, 370×94.92. */
export const HOW_IT_WORKS =
  require('../../../assets/figma/cookpool/how-it-works.png') as ImageSourcePropType;

/**
 * `848:6323` — the skip side's grey glow at FULL strength (the frame's fill at 100 %), 480×622;
 * the deck sets its strength, which changes with the drag.
 */
export const GLOW_SKIP =
  require('../../../assets/figma/cookpool/glow-skip.png') as ImageSourcePropType;
/** `848:6617` — the add side's gold glow at full strength, 560×704. */
export const GLOW_ADD =
  require('../../../assets/figma/cookpool/glow-add.png') as ImageSourcePropType;

/** `755:2349` — the band's top edge on the 365 card. */
export const BAND_CURVE_CARD =
  require('../../../assets/figma/cookpool/band-curve-card.png') as ImageSourcePropType;
/** `719:1570` — the band's top edge across the 402 page. */
export const BAND_CURVE_PAGE =
  require('../../../assets/figma/cookpool/band-curve-page.png') as ImageSourcePropType;

/** `848:7809` — the dish card's 13×12 heart, `#D9D9D9`. */
export const DISH_HEART =
  require('../../../assets/figma/cookpool/dish-heart.png') as ImageSourcePropType;
/** `755:2484` — the Add button's 32pt outline heart. */
export const HEART_OUTLINE =
  require('../../../assets/figma/cookpool/heart-outline.png') as ImageSourcePropType;
/** `848:6611` — the Add button's heart, filled, while a card is dragged toward it. */
export const HEART_FILL =
  require('../../../assets/figma/cookpool/heart-fill.png') as ImageSourcePropType;
/** `848:6611` — the "Added to pool" indicator's 14pt heart. */
export const HEART_SMALL =
  require('../../../assets/figma/cookpool/heart-indicator.png') as ImageSourcePropType;

/** `43:67` — 24pt. */
export const CLOSE_ICON =
  require('../../../assets/figma/cookpool/close.png') as ImageSourcePropType;
/** `43:63` — the skip tab's chevron. */
export const CHEVRON_LEFT =
  require('../../../assets/figma/cookpool/chevron-left.png') as ImageSourcePropType;
/** `167:23` — the add tab's chevron. */
export const CHEVRON_RIGHT =
  require('../../../assets/figma/cookpool/chevron-right.png') as ImageSourcePropType;
/** `755:2475` — the scroll pill's 16pt chevron, drawn pointing right and turned down. */
export const CHEVRON_SMALL =
  require('../../../assets/figma/cookpool/chevron-down-small.png') as ImageSourcePropType;
/** `543:2325` — Undo skip. */
export const RESTART_ICON =
  require('../../../assets/figma/cookpool/restart.png') as ImageSourcePropType;
/** `855:129` — the rating's yellow star. */
export const STAR_ICON = require('../../../assets/figma/cookpool/star.png') as ImageSourcePropType;

/** `543:2307` — the profile's bin, the same glyph the recurring flow uses. */
export const TRASH_ICON =
  require('../../../assets/figma/recurring/trash.png') as ImageSourcePropType;
/** `848:7494` — the remove dialog's cook badge. */
export const COOK_ICON =
  require('../../../assets/figma/recurring/cook-visit.png') as ImageSourcePropType;

/** The glyphs a profile line may ask for, by the backend's key. */
export const LINE_ICONS: Readonly<Record<string, ImageSourcePropType>> = { star: STAR_ICON };
