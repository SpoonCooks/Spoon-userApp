import type { ImageSourcePropType } from 'react-native';

/**
 * Cook-card artwork exported from Figma `94:906`.
 *
 * These are FILLED, multi-colour glyphs. Feather is a single-weight stroked set and does not
 * match any of them — `user` is not the `User Female` mark, `award` is not the `Chef Hat`,
 * `message-circle` is not `Language`. Task §14 says to use the real asset when Feather does not
 * match, so these are exported rather than approximated.
 */

/** `94:918` / `94:924` / `94:928` / `94:934` — the 16pt attribute glyphs. */
export const COOK_ATTRIBUTE_ART: Record<string, ImageSourcePropType> = {
  gender: require('../../../assets/figma/cook/attr-gender.png') as ImageSourcePropType,
  cuisine: require('../../../assets/figma/cook/attr-cuisine.png') as ImageSourcePropType,
  homeState: require('../../../assets/figma/cook/attr-state.png') as ImageSourcePropType,
  languages: require('../../../assets/figma/cook/attr-languages.png') as ImageSourcePropType,
};

/**
 * `289:7623` / `289:7631` / `289:7639` — the trust-row glyphs, each drawn on an 18pt
 * `rgba(0,0,0,0.8)` disc (`289:7622`, an `Ellipse 5`).
 *
 * The third badge CHANGED in the current file: the clock ("On-time") is gone and the row now
 * reads Spoon Trained · Background Verified · **Hygienic**, drawn with the Clean Hands mark. The
 * glyphs are also drawn at three DIFFERENT sizes inside the shared disc — 16 / 15 / 13.
 */
export const COOK_BADGE_ART: Record<string, ImageSourcePropType> = {
  spoonTrained: require('../../../assets/figma/cook/badge-trained.png') as ImageSourcePropType,
  backgroundVerified:
    require('../../../assets/figma/cook/badge-verified.png') as ImageSourcePropType,
  hygienic: require('../../../assets/figma/cook/badge-hygienic.png') as ImageSourcePropType,
};

/** `94:938` — the 14pt handset inside the Call Cook pill. */
export const COOK_CALL_GLYPH =
  require('../../../assets/figma/cook/call.png') as ImageSourcePropType;

/** `39:5333` — the 22 × 25 WhatsApp mark inside the Help pill (`39:5331`). */
export const HELP_WHATSAPP_GLYPH =
  require('../../../assets/figma/cook/whatsapp.png') as ImageSourcePropType;

/** `99:1241` — the 31pt "user location" mark above the en-route banner title. */
export const BOOKING_EN_ROUTE_ART =
  require('../../../assets/figma/booking/en-route.png') as ImageSourcePropType;

/** `99:1605` — the 32 x 66 to-do list mark in En route's "Note before starting". */
export const BOOKING_NOTE_ART =
  require('../../../assets/figma/booking/note-todo.png') as ImageSourcePropType;

/**
 * `3:1710` / `101:2042` — the 24 x 23 shield in the SAME note on Arrived and In service. The two
 * screens deliberately carry a different mark to En route's to-do list, so the note takes its
 * artwork from the caller rather than owning one.
 */
export const BOOKING_NOTE_SHIELD_ART =
  require('../../../assets/figma/booking/note-shield.png') as ImageSourcePropType;

/** `127:27` — the 31pt frying pan above the In-service banner title. */
export const BOOKING_IN_SERVICE_ART =
  require('../../../assets/figma/booking/in-service.png') as ImageSourcePropType;

/** `128:28` — the 119pt banner inside the In-service extension promo (`101:1857`). */
export const BOOKING_EXTEND_PROMO_ART =
  require('../../../assets/figma/booking/extend-promo.png') as ImageSourcePropType;

/** `69:533` — the 28pt "add" mark on the saved-addresses bar (`69:514`). */
export const ADDRESS_ADD_GLYPH =
  require('../../../assets/figma/address/add.png') as ImageSourcePropType;

/** `63:782` / `63:805` — the 46 x 43 map pin, reused at 22pt inside the Change thumbnail. */
export const ADDRESS_MAP_PIN =
  require('../../../assets/figma/address/map-pin.png') as ImageSourcePropType;

/** `275:5710` — the 13pt `#FFD600` star beside a booking card's rating (`275:5708`). */
export const BOOKING_RATING_STAR =
  require('../../../assets/figma/history/rating-star.png') as ImageSourcePropType;

/**
 * `230:1969` — the 20 x 32 "Menu Vertical" kebab on every saved-address row (`230:1960`).
 *
 * `sbIXeBfaMzUFUz2NYJIJTm` exports this as an asset. The superseded file drew it as three flat
 * 3.35pt dots, which is why it used to be reconstructed in the screen rather than rendered.
 */
export const ADDRESS_ROW_MENU =
  require('../../../assets/figma/address/menu-vertical.png') as ImageSourcePropType;

/** `63:769` — the 37 x 45 location mark beside the resolved address (`63:771`). */
export const ADDRESS_LOCATION_GLYPH =
  require('../../../assets/figma/address/location-pin.png') as ImageSourcePropType;

/** `63:803` — the 56 x 59 map thumbnail behind "Change" (`63:807`). */
export const ADDRESS_CHANGE_AREA_ART =
  require('../../../assets/figma/address/change-area.png') as ImageSourcePropType;

/**
 * `230:2067` / `230:2072` — the Edit and Delete marks on the address-edit sheet (`228:1801`).
 *
 * Each is a 28pt white disc carrying a drop shadow, so the export canvas is 36pt (the node draws
 * itself at `inset -14.29%`). They are rendered at 36 inside a 28pt box with a −4 margin, which
 * reproduces that overflow exactly rather than scaling the disc down to fit.
 *
 * Neither is substituted with a Feather glyph: the Delete trash is `#FF0404` and the Edit pencil
 * is a FILLED mark, and both sit on their own drawn disc.
 */
export const ADDRESS_ACTION_EDIT =
  require('../../../assets/figma/address/action-edit.png') as ImageSourcePropType;

export const ADDRESS_ACTION_DELETE =
  require('../../../assets/figma/address/action-delete.png') as ImageSourcePropType;

/**
 * `219:1551` — the 150 x 125 house-and-pin illustration on Address out of service (`215:1472`).
 * Exported from the NODE, so the frame's own `h 120.63%` crop is baked in.
 */
export const ADDRESS_OUT_OF_SERVICE_ART =
  require('../../../assets/figma/address/out-of-service.png') as ImageSourcePropType;

/**
 * `209:1224` / `218:1548` — the 32pt profile ring, and `209:1225` / `218:1549` the 25pt default
 * glyph inside it. Home's top banner and the Address out-of-service banner draw the SAME pair, so
 * they are defined once here; `@features/home` re-exports them under its own names.
 *
 * The ring is not a plain white circle, and Feather has no equivalent — hence the exports.
 */
export const BANNER_AVATAR_RING =
  require('../../../assets/figma/icons/avatar-ring.png') as ImageSourcePropType;

export const BANNER_AVATAR_GLYPH =
  require('../../../assets/figma/icons/customer.png') as ImageSourcePropType;

/** `74:27` — the 179pt splash logo (`73:1036`). */
export const LOADING_SPLASH_LOGO =
  require('../../../assets/figma/loading/splash-logo.png') as ImageSourcePropType;

/**
 * `433:2400` — the 72pt "In Progress" mark on `433:2290` (Page 21, confirmation loading).
 *
 * A lime ring whose solid arc trails off into detached dots, with a check at its centre. The dots
 * are a MOTION TRAIL: they are what a rotating arc leaves behind, and they are the only reason the
 * ring is drawn asymmetrically. `get_motion_context` returns no animated nodes for the frame — the
 * still cannot carry the motion — so the rotation is read off the mark's own construction and
 * recorded as a deviation on `ConfirmationLoading`.
 */
export const LOADING_CONFIRMATION_PROGRESS =
  require('../../../assets/figma/loading/confirmation-progress.png') as ImageSourcePropType;

/** `73:1035` — the 130pt logo on the loading interstitial (`71:747`). */
export const LOADING_INTRO_LOGO =
  require('../../../assets/figma/loading/intro-logo.png') as ImageSourcePropType;

/** `73:894` — the 369 x 526 photograph on the loading interstitial. */
export const LOADING_INTRO_HERO =
  require('../../../assets/figma/loading/intro-hero.png') as ImageSourcePropType;

/** `53:181` — the 96pt Login logo tile, gradient baked into the export. */
export const AUTH_LOGO_ART = require('../../../assets/figma/auth/logo.png') as ImageSourcePropType;

/** `53:205` — the 16pt mark inside the "Get a trained cook in 15 mins" badge. */
export const AUTH_BADGE_GLYPH =
  require('../../../assets/figma/auth/badge-icon.png') as ImageSourcePropType;

/** `53:252` — the 16pt shield in the Login trust footer (`53:251`). */
export const AUTH_TRUST_GLYPH =
  require('../../../assets/figma/auth/trust-shield.png') as ImageSourcePropType;

/** `66:206` — the 32pt Profile avatar disc (`6:667`). */
export const PROFILE_AVATAR_GLYPH =
  require('../../../assets/figma/profile/avatar.png') as ImageSourcePropType;

/** `69:419` — the 32pt chevron on each Profile tile. */
export const PROFILE_CHEVRON_GLYPH =
  require('../../../assets/figma/profile/chevron.png') as ImageSourcePropType;

/** `69:407` / `69:341` / `69:475` / `69:511` — the 32pt disc on each Profile tile (`69:423`). */
export const PROFILE_TILE_ART: Record<string, ImageSourcePropType> = {
  orders: require('../../../assets/figma/profile/tile-orders.png') as ImageSourcePropType,
  addresses: require('../../../assets/figma/profile/tile-addresses.png') as ImageSourcePropType,
  refunds: require('../../../assets/figma/profile/tile-refunds.png') as ImageSourcePropType,
  help: require('../../../assets/figma/profile/tile-help.png') as ImageSourcePropType,
};

/** `104:2408` / `104:2449` — the 20pt radio marks on the cancel-reason list. */
export const CANCEL_RADIO_OFF =
  require('../../../assets/figma/cancel/radio-off.png') as ImageSourcePropType;
export const CANCEL_RADIO_ON =
  require('../../../assets/figma/cancel/radio-on.png') as ImageSourcePropType;

/** `111:2622` — the 32pt "Receive Cash" mark on the fee notice (`107:2587`). */
export const CANCEL_NOTE_FALLBACK_ART =
  require('../../../assets/figma/cancel/note-cash.png') as ImageSourcePropType;

/**
 * `111:2622` / `110:2621` — the 32pt marks on the two cancellation-policy notices.
 *
 * The keys MUST match the note ids the payload supplies (`6:2` draws "Receive Cash" on the first
 * notice and "Synchronize" on the second). They previously read `fee` / `reschedule`, which match
 * nothing: both notices therefore fell through to the fallback and the sheet rendered the cash
 * mark twice, losing the `110:2621` synchronize glyph entirely.
 */
export const CANCEL_NOTE_ART: Record<string, ImageSourcePropType> = {
  compensation: CANCEL_NOTE_FALLBACK_ART,
  'reschedule-once': require('../../../assets/figma/cancel/note-sync.png') as ImageSourcePropType,
};

/** `143:234` — the 65pt check mark over "Booking Complete!" (`143:233`). */
export const BOOKING_COMPLETE_ART =
  require('../../../assets/figma/booking/complete-check.png') as ImageSourcePropType;

/** `144:434` — the 32pt "Trust" mark on the Extension sheet's first notice (`143:343`). */
export const BOOKING_EXT_NOTE_TRUST_ART =
  require('../../../assets/figma/booking/ext-note-trust.png') as ImageSourcePropType;

/** `144:433` — the 32pt timer on the Extension sheet's second notice (`143:351`). */
export const BOOKING_EXT_NOTE_TIMER_ART =
  require('../../../assets/figma/booking/ext-note-timer.png') as ImageSourcePropType;

/**
 * The three server-reported lifecycle states (`201:100`, `209:747`, `201:278`). The artwork is
 * exported; what CAUSES any of these states is backend/business logic and is not modelled here.
 */

/** `209:945` — the 32pt "Replace" mark on the reassignment notice (`208:553`). */
export const BOOKING_NOTE_REASSIGNED_ART =
  require('../../../assets/figma/lifecycle/note-reassigned.png') as ImageSourcePropType;

/** `201:475` — the 32pt "Sad Cloud" on the auto-cancel apology (`201:458`). */
export const BOOKING_NOTE_APOLOGY_ART =
  require('../../../assets/figma/lifecycle/note-apology.png') as ImageSourcePropType;

/** `201:552` — the 32pt "Stack of Money" on the refund notice (`201:467`). */
export const BOOKING_NOTE_REFUND_ART =
  require('../../../assets/figma/lifecycle/note-refund.png') as ImageSourcePropType;

/** `201:67` — the 116 × 72 calendar-and-cross hero on `201:66`. */
export const BOOKING_CANCELLED_ART =
  require('../../../assets/figma/lifecycle/cancelled-art.png') as ImageSourcePropType;
