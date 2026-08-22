import {
  elevations,
  fontFamily,
  fontSize,
  letterSpacing,
  lineHeight,
  palette,
  radius,
  space,
  withAlpha,
} from './primitives';
import type { Elevation, TextTokenStyle } from './primitives';

/**
 * Layer 2 — semantic tokens. Intent-named aliases; the ONLY layer components consume.
 * (FRONTEND_FOUNDATION_PLAN.md §14)
 *
 * Rebuilt from Figma `QMgajesW22fQcUbs7TKspS` Page 3a `1:455`. Structured for light/dark even
 * though only one theme is evidenced in the file — retrofitting is expensive.
 */

export const lightColors = {
  background: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.grey100,
  surfaceSunken: palette.grey50,
  /** `37:3918` — the "Share your requests" secondary bar. */
  surfaceSubtle: palette.grey96,
  /** `3:686` — the Meal Brief screen ground: a cool off-white, not the app's warm cream. */
  surfaceForm: palette.grey98,
  /** `3:769` — the Meal Brief recipe card. */
  surfaceNote: palette.butterySoft,
  /** `3:776` — the "Optional" badge. */
  surfaceOptional: palette.roseSurface,
  /** `289:7617` — the cook-card trust row. */
  surfaceTrust: palette.limeTrust,
  /**
   * `456:3408` / `341:4650` / `341:4633` — a SELECTED chip in the profile page's lime family.
   *
   * The frame fills it `rgba(236,255,155,0.7)`, i.e. `lime300` at 70 %. Carried PRE-COMPOSITED
   * over white for the same reason `limeTrust` is: the chip draws a `0 1 2 rgba(0,0,0,0.05)`
   * shadow, and a translucent fill lets that shadow read through as a dirty edge.
   * 0.7 × #ECFF9B + 0.3 × #FFFFFF = (241.7, 255, 185) — the same value, reached the same way.
   */
  surfaceOptionSelected: palette.limeTrust,
  /** `289:7622` — the 18pt disc each trust glyph is drawn on. */
  surfaceTrustDisc: palette.black80,
  /** `21:1105` — the Start-OTP panel behind the Arrived service handover. */
  surfaceOtpStart: palette.limeSoft,
  /** `101:1905` — the End-OTP panel on In service. The two panels differ ONLY in hue. */
  surfaceOtpEnd: palette.yellowSoft,
  /** `#FFF7CC` — promo side panels, alternating duration-matrix rows. */
  surfaceAccent: palette.yellow200,
  /** `#FFEF99` — promo centre panel, trust tiles, alternating matrix rows. */
  surfaceAccentStrong: palette.yellow300,
  /** `#FFE666` — the Schedule tile and the matrix header row. */
  surfaceAccentBold: palette.yellow400,
  /** `#ECFF9B` — the Instant tile. */
  surfacePositive: palette.lime300,
  /** The sticky Home banner — lime at 50% over white (`1:458`). */
  surfaceBanner: palette.limeBanner,
  /** The black active-booking card on Home. */
  surfaceInverse: palette.black,
  /** Scrim over the "what's not included" photography (`156:38`). */
  surfaceScrim: palette.black40,
  /**
   * `44:5632` — the Instant sheet's unavailable veil: a FLAT white fill at 45 %, not a blur, and
   * it stops above the CTA so the CTA stays fully saturated.
   */
  surfaceVeil: palette.white45,

  border: palette.slate200,
  /** `59:587` — the lime hairline around the active-booking card. */
  borderPositive: palette.lime500,
  /** `209:1403` — the active-booking timer chip. */
  surfacePositiveBright: palette.lime500,
  borderAccent: palette.yellow300,
  /** `208:553` / `201:458` / `201:467` — the `#FFD600` outline on a lifecycle notice card. */
  borderNotice: palette.yellow500,
  /** `201:93` — the softer `#FFDE33` outline on the auto-cancel "No" button. */
  borderCtaSoft: palette.yellow33,
  borderStrong: palette.slate600,
  borderSubtle: palette.grey100,
  /** `37:3705` — the 0.8pt hairline under a screen header. */
  borderHairline: palette.grey96,
  /** `3:695` — Meal Brief control and card borders. */
  borderField: palette.grey91,
  /** `3:688` — the same border, softened, on the white preference card. */
  borderFieldSoft: palette.grey91Soft,
  /** `3:712` — stepper button borders. */
  borderControl: palette.slate200,
  /** `3:769` — the recipe card border. */
  borderNote: palette.yellow76,
  /** `3:780` — the recipe input border. */
  borderNoteStrong: palette.yellow59,

  /** Page 3a sets nearly all body copy to pure black, not the slate ramp. */
  textPrimary: palette.black,
  /** `color/azure/11` — the banner headline (`1:464`). */
  textStrong: palette.slate950,
  /** `color/black/-70%` — tile subtitles. */
  textSecondary: palette.black70,
  textMuted: palette.slate800,
  /** `37:3716` — "Day" / "Time" / "Duration" field labels. */
  textFieldLabel: palette.azure35,
  /** `37:3920` — the secondary-button label on Scheduled. */
  textSecondaryStrong: palette.azure27,
  /** `3:691` — Meal Brief field labels and entered text. */
  textField: palette.azure18,
  /** `3:816` — the Meal Brief "Skip" action. */
  textQuiet: palette.azure47,
  /** `201:88` — "Takes 5-7 business days"; the quietest ink in the file. */
  textFaint: palette.azure65,
  /** `143:299` — "100% goes directly to cook". The only green in the file. */
  textSuccess: palette.springGreen,
  /** `3:766` — placeholder text inside a Meal Brief input. */
  textPlaceholder: palette.black50,
  /** `3:777` — the "Optional" badge ink. */
  textOptional: palette.rose,
  /** `289:7625` — the trust-row separator dots. */
  textSeparator: palette.black80,
  /** `289:7624` — the trust-row labels, at the same 80 % black as the dots and the disc. */
  textTrust: palette.black80,
  /**
   * `337:4356` — the Home active-booking card's title ("Upcoming booking" / "Live booking" /
   * "Share your rating!"). The only place the file sets TYPE to the brand yellow.
   */
  textBrand: palette.yellow500,
  /** `3:1147` — the Confirmation reschedule action. */
  textReschedule: palette.amber700,
  /** `3:1151` — the Confirmation cancel action. */
  textDestructive: palette.rose600,
  /** `6:22` — a fee tier that costs nothing ("Free"). Only the value is tinted, not the row. */
  textFree: palette.emerald,
  /**
   * `6:789` — the Profile logout label. v4 sets it to **`#FF0404`**, the same red the OTP error
   * uses; the superseded file drew `#C70036` (`palette.rose39`, now unused).
   */
  textLogout: palette.danger,
  textDisabled: palette.slate400,
  textInverse: palette.white,
  /** Text drawn on the yellow/lime accents — always the dark ink, never white. */
  textOnAccent: palette.black,

  /** `1:798` — badge accent on the Instant duration tiles. */
  surfaceBadge: palette.yellow500,
  /** `1:821` — the primary CTA bar. */
  surfaceCta: palette.yellow500,
  /** `1:754` — the Instant "18 mins" ETA pill. */
  surfaceEta: palette.canary,
  /** `143:241` — the "Please rate this service!" pill on Completion. */
  surfaceRatePrompt: palette.limeRate,
  /** `53:33` — the map canvas on the address location step. */
  surfaceMapCanvas: palette.yellowCanvas,
  /** `6:784` — the Profile logout surface. */
  surfaceLogout: palette.roseLogout,
  /**
   * `73:1039` — the splash ground. The wash above it (`73:1040`) is drawn at 70 %, so this is the
   * WHITE the frame computes those stops over, not a tint of its own. v4's flat `canaryWash` was
   * the whole surface; it is now `gradients.splash`.
   */
  surfaceSplash: palette.white,
  /** `71:887` — the loading-interstitial ground. */
  surfaceLoading: palette.limeWash,

  /** Instant duration tiles — translucent fills, not the solid section surfaces. */
  surfaceTileIdle: palette.tileIdle,
  surfaceTileSelected: palette.tileSelected,
  surfaceTileDisabled: palette.tileDisabled,
  /** `1:815` — ink on a disabled tile. `textDisabled` is the slate ramp and is NOT this. */
  textDisabledOnTile: palette.black50,
  /** `1:818` — a struck-through price on a disabled tile. */
  textDisabledMuted: palette.black30,

  /**
   * `275:4690` — the DISABLED CTA bar, read off the only disabled call-to-action the file draws:
   * Scheduled steps 5a-5c, where "Book Now" waits for the rest of the selection.
   *
   * The node is `bg-[rgba(0,0,0,0.07)]` over a `rgba(0,0,0,0.5)` Livvic Black label, and it keeps
   * the active bar's geometry AND its `0 0 4 rgba(0,0,0,0.15)` lift — a disabled CTA is the same
   * bar drained of colour, not a different shape. That is the same pair `1:815` uses on a
   * disabled duration tile, so the primitives already existed; only the CTA-facing names are new.
   *
   * `surfaceMuted` / `textDisabled` (the `#F3F4F6` + slate `#8A94A6` pair the buttons used before)
   * are the SLATE ramp and appear nowhere in this treatment.
   */
  /**
   * PRE-COMPOSITED, unlike the tile it shares a value with: the bar keeps its lift, and Android
   * renders that shadow through a translucent fill. See `palette.ctaDisabled`.
   */
  surfaceCtaDisabled: palette.ctaDisabled,
  textCtaDisabled: palette.black50,

  accentPrimary: palette.yellow400,
  accentSecondary: palette.lime300,

  danger: palette.danger,
  dangerSurface: palette.dangerSurface,

  scrim: palette.scrim,
  /** `47:6615` / `29:1858` — the wash a sheet takes while a dialog is layered over it. */
  scrimSheet: palette.black65,
} as const;

/** TODO(designer): no dark theme exists in Figma. Mirrors light until one does. */
export const darkColors = lightColors;

export type ColorTokens = typeof lightColors;
export type ColorToken = keyof ColorTokens;

/**
 * Presentation tones. Components accept a tone, never a backend status value — the mapping from
 * a server status to a tone belongs to the screen layer, once a contract exists.
 */
export const toneColors = {
  neutral: { surface: lightColors.surfaceMuted, text: lightColors.textSecondary },
  positive: { surface: palette.lime300, text: lightColors.textOnAccent },
  warning: { surface: palette.yellow400, text: lightColors.textOnAccent },
  info: { surface: palette.yellow200, text: lightColors.textPrimary },
  danger: { surface: lightColors.dangerSurface, text: lightColors.danger },
} as const;

export type Tone = keyof typeof toneColors;

/**
 * Gradients, each read verbatim off its node rather than sampled.
 *
 * Every lead stop is a FOUNDER colour at a stated opacity, so all of them are built with
 * `withAlpha` rather than written as fresh literals.
 *
 * `angleDeg` is carried on every token so the axis decision stays visible and reversible. The
 * four cuisine scrims are all within 0.3° of CSS 180°, which is what `expo-linear-gradient` draws
 * by default; across the widest card the file draws (330pt) that tilt displaces the band by 1.7pt,
 * below the width of the softest stop transition, so they use the default vertical axis. The
 * splash's 154.26° is a genuine diagonal and is resolved through `gradientAxis` instead.
 */
export const gradients = {
  /**
   * `73:1040` — the Login loading ground. v5 replaces the flat `canaryWash` splash with a
   * diagonal wash:
   *
   *   linear-gradient(154.26259710299553deg,
   *     rgba(255,214,0,0.7) 0%, rgba(207,255,4,0.7) 98.789%)
   *
   * Both stops are FOUNDER colours at 70 % (`#FFD600`, `#CFFF04`), so they are built with
   * `withAlpha` rather than written as literals. The node sits on `#FFFFFF`, so the drawn
   * colours are (255,226,77) → (221,255,79); the stops are kept translucent and the surface
   * beneath is painted white, which is what the frame does.
   *
   * ANGLE: 154.26° is a real diagonal, not a rounded-off vertical, so it is NOT flattened the
   * way the two Home scrims are. `SplashLoading` resolves `start`/`end` from the measured box so
   * the axis stays at 154.26° on any screen instead of degrading to a corner-to-corner diagonal.
   */
  splash: {
    colors: [withAlpha(palette.yellow500, 0.7), withAlpha(palette.lime500, 0.7)],
    locations: [0, 0.98789],
    angleDeg: 154.26259710299553,
  },
  /**
   * `140:188` — "Daily meals". `#FFD600` at 7 % into black at 50 %, straight top-to-bottom.
   */
  cuisineDaily: {
    colors: [withAlpha(palette.yellow500, 0.07), palette.black50],
    angleDeg: 180,
  },
  /**
   * `140:186` / `140:187` — "North Indian" and "South Indian". The same wash, one stop darker:
   * `#FFD600` at 7 % into black at **70 %**. `140:186` measures 179.716°, `140:187` is drawn as a
   * plain `to bottom`; across a 158pt card a 0.28° tilt displaces the band by 0.8pt, so both are
   * drawn on the vertical axis and the measurement is recorded rather than forked.
   */
  cuisineIndian: {
    colors: [withAlpha(palette.yellow500, 0.07), palette.black70],
    angleDeg: 179.7159092576303,
  },
  /**
   * `140:189` — the "Chinese and Asian" band. A LIGHTER wash than the other three:
   * `#FFD600` at 10 % into black at 40 %, running 4.486 % → 99.057 % at 179.703°.
   */
  cuisineAsian: {
    colors: [withAlpha(palette.yellow500, 0.1), palette.black40],
    locations: [0.044863, 0.99057],
    angleDeg: 179.70251199528715,
  },
} as const;

export type GradientToken = keyof typeof gradients;

/**
 * Convert a CSS `linear-gradient` angle into the unit `start` / `end` points
 * `expo-linear-gradient` wants, for a box of the given size.
 *
 * CSS measures the angle clockwise from "to top", so the axis direction in screen coordinates
 * (x right, y down) is `(sin θ, −cos θ)`, and the gradient line is centred on the box with length
 * `|W·sin θ| + |H·cos θ|` — the projection of the box onto that axis, which is what puts the 0 %
 * and 100 % stops exactly on the box's bounding corners.
 *
 * Without this, a diagonal token has to be approximated as a corner-to-corner sweep, which only
 * matches the frame at the frame's own aspect ratio.
 */
export function gradientAxis(
  angleDeg: number,
  width: number,
  height: number,
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  if (width <= 0 || height <= 0) return { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };

  const radians = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const length = Math.abs(width * dx) + Math.abs(height * dy);
  const halfX = ((length / 2) * dx) / width;
  const halfY = ((length / 2) * dy) / height;

  return {
    start: { x: 0.5 - halfX, y: 0.5 - halfY },
    end: { x: 0.5 + halfX, y: 0.5 + halfY },
  };
}

/**
 * Rating scale fills — the reference frame (`119:2885`) varies the selected chip's colour with
 * the value: pale yellow at 1 through bright lime at 5.
 */
export const ratingFill = {
  lowest: palette.yellow200,
  low: palette.yellow300,
  mid: palette.yellow400,
  high: palette.lime300,
  highest: palette.lime300,
} as const;

export type RatingFillToken = keyof typeof ratingFill;

/**
 * Rating chip OUTLINES — `143:257`. At rest every chip is white with a coloured 1pt border, and
 * the border walks the same ramp the fill does: `#FFEF99` at 1–1.5, `#FFE666` at 2–2.5,
 * `#FFDE33` at 3–3.5, `#E2FF68` at 4–4.5 and `#CFFF04` at 5. The previous widget drew one border
 * colour for all nine, which is why the scale read as flat.
 */
export const ratingBorder = {
  lowest: palette.yellow300,
  low: palette.yellow400,
  mid: palette.yellow33,
  high: palette.canary,
  highest: palette.lime500,
} as const;

/**
 * Typography — every entry is a real Page 3a text style.
 *
 * These emit `fontFamily`, NOT `fontWeight`: React Native does not synthesise weights, and on
 * Android a `fontWeight` against a custom family silently renders the base face. That mismatch
 * is why the shipped screens read as a different typeface to the designer.
 */
export const typography = {
  /** `59:377` address line, `156:30` exclusion captions — Livvic Regular 9/13.5. */
  micro: {
    fontSize: fontSize.xxs,
    lineHeight: lineHeight.caption,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.none,
  },
  /** `144:469` cuisine-card captions — Livvic Bold 9/13.5, drawn on photography. */
  microStrong: {
    fontSize: fontSize.xxs,
    lineHeight: lineHeight.caption,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `138:115` duration-matrix cells — Livvic Regular 10/15. */
  caption: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.none,
  },
  /** `143:244` — Livvic Medium 10/**15**, the Completion rate caption. */
  captionMedium: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  /** `153:502` trust-tile labels — Livvic Medium 10/13.33. */
  captionStrong: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xxs,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.none,
  },
  /** `1:585` tile subtitle lead — Livvic SemiBold 12/16. */
  bodyStrong: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `39:5332` the Help pill label — Livvic Bold 12/**15.2**, not the general 12/16. */
  helpLabel: {
    fontSize: fontSize.md,
    lineHeight: 15.2,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `129:37` "Plan your meal", `337:4412` "Arriving in", `337:4370` "Confirmed!" — Livvic Bold
   * 12/**15.11**. A third 12pt Bold leading, and the one the current file uses for short labels
   * that sit inside a fixed box; `bodyBold`'s 16 would push them off their centres.
   */
  bodyBoldTight: {
    fontSize: fontSize.md,
    lineHeight: 15.11,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `209:1400` upcoming-booking date — the general Livvic Bold 12/16. */
  bodyBold: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `6:253` booking status pills — Livvic Bold 10/15, capitalised. */
  pillLabel: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
    textTransform: 'capitalize',
  },
  /** `3:694` Meal Brief diet chips and `3:777` the "Optional" badge — Livvic Bold 10/15. */
  captionBold: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `101:1861` "Need more food prepared?" — Livvic SemiBold 11/14.67. */
  promptStrong: {
    fontSize: fontSize.sm,
    lineHeight: 14.67,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `3:779` recipe-card body copy — Livvic Regular 11/16.5. */
  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.none,
  },
  /** `3:788` / `3:794` entered form text — Livvic Medium 12/16. */
  bodyMedium: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  /** `37:3722` chip labels ("Aug 5", "Morning") — Livvic Black 12/16. */
  bodyBlack: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `34:3157` start-time chip labels ("05:00 AM") — Livvic **Bold 11/16.5**.
   * Deliberately NOT `bodyBlack`: the Day and Time chips are Black 12/16, the start-time grid is
   * a step quieter and a step smaller. One style cannot serve both.
   */
  slotLabel: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `63:800` address label chips — Livvic Regular 11/16.5 at −0.275. */
  chipLabel: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    fontFamily: fontFamily.regular,
    letterSpacing: -0.275,
  },
  /** `53:109` the resolved address line — Livvic Regular 12/15.2. */
  bodyLoose: {
    fontSize: fontSize.md,
    lineHeight: 15.2,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.none,
  },
  /** `37:3716` field labels ("Day", "Time") — Livvic Medium 11/16.5. */
  labelMedium: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `456:3404` / `456:3418` / `338:4534` / `341:4658` / `341:4629` — the profile page's section
   * labels: Livvic SemiBold 13/16 (the 13 is literal in the frame, not a rounded 12).
   *
   * 13 is not on the type scale, and it is not a rounding of 12: `456:3432` ("What is the most
   * pressing issue…") on the SAME page resolves `font-size/12` from the variable, while these five
   * carry a literal 13. Two sizes, one page, both drawn — so both are transcribed rather than
   * averaged into one. See §22: no "looks close enough".
   */
  fieldSection: {
    fontSize: 13,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `59:376` "Home" — Livvic SemiBold 11/16.5. */
  label: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `3:1116` "End Time" — Livvic SemiBold 10/13.33, the quietest row label. */
  labelUpperQuiet: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xxs,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `135:96` matrix header — Livvic SemiBold 10/15, +0.5 tracking, uppercased. */
  labelUpper: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
  },
  /** `1:585` trailing "18 mins" — Livvic Bold 14/20. */
  title: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `143:255` the "5+" chip — Livvic Black 14/20 at −0.35, uppercased. */
  ratingPlus: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontFamily: fontFamily.black,
    letterSpacing: -0.35,
    textTransform: 'uppercase',
  },
  /** `143:260` the numeric rating chips — Livvic Black 12/16 at −0.3, uppercased. */
  ratingValue: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.black,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  /** `53:210` / `53:224` — Livvic Black 12/16 at +0.6, uppercased. The Login label voice. */
  labelUpperBlack: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.black,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  /** `53:238` "User Type:" — Livvic Bold 12/16 at −0.3, uppercased. */
  labelUpperTight: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  /** `53:212` the Login headline — Livvic Black 36/45 at −0.9. */
  displayHero: {
    fontSize: 36,
    lineHeight: 45,
    fontFamily: fontFamily.black,
    letterSpacing: -0.9,
  },
  /** `53:232` the phone value — Livvic Bold 16/24 at +1.6, so the digits read as a group. */
  phoneValue: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.bold,
    letterSpacing: 1.6,
  },
  /** `53:244` "GET OTP" — Livvic Black 18/28 at +0.9, uppercased. */
  ctaUpper: {
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontFamily: fontFamily.black,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  /** `143:293` the "Submit" chip — Livvic Bold 12/16 at +0.6, uppercased. */
  buttonUpper: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  /** `143:299` — Livvic SemiBold 11/13.33. */
  labelSuccess: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.xxs,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `143:238` "Booking Complete!" — Livvic Black 24/30. */
  headingHero24: {
    fontSize: 24,
    lineHeight: lineHeight.xxxl,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `1:464` banner headline — Livvic Black 14/20. */
  titleBlack: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `21:1104` "Start OTP" / `101:1907` "End OTP" — Livvic **Bold** 16/24, no tracking. */
  headingBold: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `132:49` section titles + `129:35` "Schedule" — Livvic Black 16/24, −0.4 tracking. */
  heading: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.tight,
  },
  /** `1:583` "Instant" — Livvic Black 18/28. */
  headingTile: {
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `201:91` "Give us another chance, book again!" — Livvic Bold 15/24. */
  titleRebook: {
    fontSize: 15,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `1:753` "Arriving in" — Livvic Bold 18/28. */
  titleLead: {
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `1:744` sheet titles — Livvic Black 20/20. */
  headingSheet: {
    fontSize: fontSize.xxl20,
    lineHeight: lineHeight.lg,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `37:3712` screen titles and `1:755` the Instant ETA pill — Livvic Black 20/28. */
  headingScreen: {
    fontSize: fontSize.xxl20,
    lineHeight: lineHeight.xxl,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `3:1106` "5:30 PM" — Livvic Black 18/22.5, the Confirmation hero value. */
  headingHero: {
    fontSize: fontSize.xxl,
    lineHeight: 22.5,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `3:1144` "₹135" — Livvic Black 18/28. */
  headingTotal: {
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `221:1554` the out-of-service headline — Livvic Black 20/**25**, tighter than `headingScreen`. */
  headingOutcome: {
    fontSize: fontSize.xxl20,
    lineHeight: 25,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `94:1097` the en-route ETA box — Livvic Black 23/25. The current file drops it a point
   * from the superseded 24; `StatusBanner`'s highlight is the only consumer.
   */
  headingEta: {
    fontSize: 23,
    lineHeight: 25,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `99:1608` note-card body — Livvic Regular 11/14.67. */
  noteBody: {
    fontSize: fontSize.sm,
    lineHeight: 14.67,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.none,
  },
  /** `1:829` primary CTA labels — Livvic Black 16/24, no tracking (unlike `heading`). */
  headingCta: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.none,
  },
  /** `1:766` struck-through prices on the Instant sheet — Livvic SemiBold 10/15. */
  strike: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `37:3776` struck-through prices on Scheduled — Livvic **Medium** 10/15. */
  strikeCompact: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  /** `37:3778` prices on the compact Scheduled tile — Livvic Bold 10/15. */
  priceCompact: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `225:1636` — the Login tagline's second line: Livvic SemiBold 14/16. */
  loginTagline: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `104:2284` — a cancellation reason row: Livvic Medium 13/16 at 70 % black.
   *
   * 13 appears nowhere else in the file, so it stays a literal rather than joining `fontSize`.
   * The rows were previously drawn with `body` (Regular 12/16), a lighter weight AND a smaller
   * size than the node.
   */
  optionLabel: {
    fontSize: 13,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  /** `227:1671` / `230:2086` — the OTP tagline and resend line: Livvic Medium 11/16.5. */
  otpTagline: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `250:2437` — the trailing run of the resend line ("26s"): Livvic **Bold** 11/16.5. Same size
   * and leading as `otpTagline`, one weight up, so the two runs sit on a single baseline.
   */
  otpTaglineStrong: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `250:2414` — "Enter your phone number to proceed", and `275:4317` "OTP has been sent to …":
   * Livvic Regular **12/16** at 70 %. The line height moved 15 → 16 in `fsgGIC4c6DJulb64TTt9yg`;
   * both auth screens now share this one ramp, which is why the OTP screen no longer uses
   * `caption` (Regular 10/15).
   */
  bodyQuiet: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `250:2417` / `250:2420` — the phone field's dial code and value.
   *
   * Livvic **Bold 16/24 at +1.6** tracking. This replaced SemiBold 14/16 in
   * `fsgGIC4c6DJulb64TTt9yg`; the tracking is what opens the digits out to the drawn width.
   * LoginScreen is the only consumer.
   */
  fieldValue: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.wider,
  },
  /** `6:781` — the Profile legal link: Livvic **Bold 11/14.67**, drawn underlined. */
  profileLegal: {
    fontSize: fontSize.sm,
    lineHeight: 14.67,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `6:789` — the Profile logout label: Livvic **SemiBold 13/16** at `#FF0404`. */
  profileLogout: {
    fontSize: 13,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `275:4324` — an OTP digit: Livvic Bold 18/28 at 70 %. Unchanged in the new file. */
  otpDigit: {
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /**
   * `275:4340` / `275:4469` — the resend line: Livvic **SemiBold 14/16**.
   *
   * This is NOT `otpTagline` (Medium 11/16.5). In `fsgGIC4c6DJulb64TTt9yg` the tagline sub and the
   * resend line stopped sharing a ramp, so they are two tokens.
   */
  otpResend: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `275:4340` trailing run ("25s" / "via SMS") — Livvic **Bold 14/20** against the SemiBold lead. */
  otpResendStrong: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.none,
  },
  /** `275:4467` — "Incorrect OTP. Please try again": Livvic **Medium 12/16** at `#FF0404`. */
  otpError: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  /** `53:244` / `227:1688` — the auth CTAs: Livvic Black 16/24 at **-0.4**, unlike `headingCta`. */
  headingCtaTight: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.tight,
  },
  headingLarge: {
    fontSize: fontSize.xxxl,
    lineHeight: lineHeight.xxxl,
    fontFamily: fontFamily.black,
    letterSpacing: letterSpacing.tight,
  },
} as const satisfies Record<string, TextTokenStyle>;

export type TypographyToken = keyof typeof typography;

/** Elevation aliases, by role rather than by depth. */
export const elevation = {
  none: elevations.none,
  card: elevations.tile,
  tile: elevations.tile,
  banner: elevations.banner,
  raised: elevations.raised,
  side: elevations.side,
  hairline: elevations.hairline,
  badge: elevations.badge,
  /** `63:779` — the map helper pill: `0 0 4 rgba(0,0,0,0.1)`. */
  pill: elevations.pill,
  /** `222:1558` — the out-of-service disc: `0 0 2 rgba(0,0,0,0.07)`. */
  disc: elevations.disc,
  /** `69:514` — the add-address bar: `0 0 1 rgba(0,0,0,0.1)`. */
  hairlineSoft: elevations.hairlineSoft,
  subtle: elevations.subtle,
  /** `0 0 2 rgba(0,0,0,0.15)` — status banner, note card, Help pill, Extend pill. */
  soft: elevations.soft,
  /** `0 0 2 rgba(0,0,0,0.08)` — the cook card, its photo panel and its trust row. */
  softer: elevations.softer,
  /**
   * `53:111` — the address CTA's yellow glow.
   *
   * UNUSED since pass 8: `sbIXeBfaMzUFUz2NYJIJTm` drops both `53:111` and `60:729`, and neither
   * `53:110` nor `275:4485` carries a shadow. Kept as a token, applied by nothing.
   */
  glow: elevations.glow,
  sheet: elevations.raised,
  cta: elevations.cta,
} as const satisfies Record<string, Elevation>;

export type ElevationRole = keyof typeof elevation;

export const layout = {
  /** iOS HIG / Material minimum, enforced by every pressable primitive. */
  minTouchTarget: 44,
  /** `1:478` Body — 16pt gutters. */
  screenPaddingHorizontal: space.lg,
  screenPaddingVertical: space.s22,
  /** `1:478` gap between Home sections. */
  sectionGap: space.sm,
  /** Gap inside a section, between its title and its content (`1:595`). */
  sectionInnerGap: space.s6,
  itemGap: space.md,
  tightGap: space.sm,
  cardPadding: space.lg,
  /** `1:576` Instant / Schedule tiles and the Home section containers. */
  cardRadius: radius.r24,
  tileRadius: radius.r24,
  /** `153:501` trust tiles, `156:28` exclusion thumbnails. */
  thumbRadius: radius.r10,
  /** `144:474` cuisine photography, `1:522` promo panels. */
  photoRadius: radius.r20,
  /** `135:95` duration-matrix rows. */
  rowRadius: radius.r5,
  controlRadius: radius.sm,
  /** `1:788` — Instant duration tiles. */
  optionRadius: radius.r12,
  /** `1:798` — badge pills. */
  badgeRadius: radius.r6,
  pillRadius: radius.pill,
  /** `1:729` — bottom sheets are rounded 20 at the top, not 24. */
  sheetRadius: radius.r20,
  /** `1:821` — the primary CTA bar. */
  ctaRadius: radius.r15,
  /** `1:754` — the Instant ETA pill. */
  etaPillRadius: radius.xs,
  avatarRadius: radius.pill,
  /** `1:458` sticky banner bottom corners. */
  bannerRadius: radius.r15,
} as const;
