import {
  elevations,
  fontFamily,
  fontSize,
  letterSpacing,
  lineHeight,
  palette,
  radius,
  space,
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
  /** `94:1012` — the cook-card trust row. */
  surfaceTrust: palette.limeTrust,
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
  /** `94:1020` — the trust-row separator dots. */
  textSeparator: palette.black80,
  /** `3:1147` — the Confirmation reschedule action. */
  textReschedule: palette.amber700,
  /** `3:1151` — the Confirmation cancel action. */
  textDestructive: palette.rose600,
  /** `6:22` — a fee tier that costs nothing ("Free"). Only the value is tinted, not the row. */
  textFree: palette.emerald,
  /** `6:789` — the Profile logout label. A different rose to `textDestructive`. */
  textLogout: palette.rose39,
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
  /** `73:1040` — the splash ground. */
  surfaceSplash: palette.canaryWash,
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

  accentPrimary: palette.yellow400,
  accentSecondary: palette.lime300,

  danger: palette.danger,
  dangerSurface: palette.dangerSurface,

  scrim: palette.scrim,
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
  /** `94:1097` the en-route ETA box — Livvic Black 24/25. */
  headingEta: {
    fontSize: 24,
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
  /** `227:1671` / `230:2086` — the OTP tagline and resend line: Livvic Medium 11/16.5. */
  otpTagline: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.md,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.none,
  },
  /** `225:1598` — "Enter your phone number to proceed": Livvic Regular 12/15. */
  bodyQuiet: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.xs,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.none,
  },
  /** `53:229` / `53:232` — the phone field's dial code and value: Livvic SemiBold 14/16. */
  fieldValue: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.none,
  },
  /** `230:2093` — an OTP digit: Livvic Bold 18/28. */
  otpDigit: {
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontFamily: fontFamily.bold,
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
  subtle: elevations.subtle,
  /** `0 0 2 rgba(0,0,0,0.15)` — status banner, note card, Help pill, Extend pill. */
  soft: elevations.soft,
  /** `0 0 2 rgba(0,0,0,0.08)` — the cook card, its photo panel and its trust row. */
  softer: elevations.softer,
  /** `53:111` — the address CTA's yellow glow. */
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
