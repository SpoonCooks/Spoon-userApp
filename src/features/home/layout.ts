import { useWindowDimensions } from 'react-native';

import { lightTheme } from '@ui';

/**
 * Home geometry, read off the CURRENT Figma file `LJa7JoMVhagLrDG4WNxSMy`, section "Home page"
 * `338:4507` — Page 3a `1:455` and Page 3b `333:3834`.
 *
 * The 390pt frame is a phone MOCKUP: a 9.78pt bezel each side leaves a **370pt** viewport, and
 * every section sits at x 16 with width **338**. Inside a section the content is inset a further
 * 4pt, so the drawing column is 330. This is the same 370 / 16 / 338 system the seven previously
 * finalized sections use (audit §P8.1); the superseded 372 / 340 numbers were read off an older
 * revision and are gone.
 *
 * RESPONSIVENESS RULE (task §9): these values are NOT multiplied by `screenWidth / 390`. Fixed
 * things in the design — padding, gaps, icons, radii, type — stay fixed, because they are fixed in
 * the design; only things that genuinely divide the content column (grid tracks, mosaic cells) are
 * derived from the available width, with flexbox wherever flexbox can express it.
 * `useHomeContentWidth` exists for the two places a real measurement is unavoidable.
 *
 * Nothing here is a business value; it is pure layout arithmetic.
 */

/** The padded content column: 370 − 2 × 16. */
export const DESIGN_CONTENT_WIDTH = 338;

/** Available content width on THIS device, after the 16pt screen gutters. */
export function useHomeContentWidth(): number {
  const { width } = useWindowDimensions();
  return Math.max(1, width - lightTheme.layout.screenPaddingHorizontal * 2);
}

/** Page 3a / 3b section geometry, in design pt. */
export const HOME_DESIGN = {
  /**
   * Body rhythm. `333:3834` is the coherent frame: the banner ends at y 157, the carousel opens
   * 16 below it at 173 and closes at 453, and `333:3835` opens at 453 with its first section 16
   * further down — an unbroken **16pt** rhythm, and 16 again at the tail.
   *
   * FIGMA INCONSISTENCY, recorded not forked: Page 3a places the same body 55pt lower (`1:457` at
   * y 508 against `333:3835` at 453) while every other coordinate in the two frames is identical.
   * Nothing in 3a justifies a 71pt gap where every other gap on the page is 16, so 3b's rhythm is
   * taken and 3a's offset is treated as artboard placement.
   */
  body: { gap: 16, paddingTop: 16, paddingBottom: 16 },

  /** `1:458` sticky top banner — 370 × 115, `lime300` at 50 %, bottom corners only. */
  banner: {
    paddingTop: 22,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 4,
    /** `1:459` — a 33pt row inset a further 4pt inside the banner's 16. */
    headline: { height: 33, paddingHorizontal: 4, gap: 6 },
    /** `59:518` — 24 × 33, a crop of the bolt artwork rather than the whole glyph. */
    bolt: { width: 24, height: 33 },
    /** `59:400` — a 32pt `#FFE666` disc holding a 25 × 26 glyph, pinned right and centred. */
    profile: { size: 32, glyphWidth: 25, glyphHeight: 26 },
    /**
     * `319:3341` — a 44pt block (px 4 / py 6) holding a 140 × 32 address stack and, 12pt after
     * it, the 32pt chevron disc `319:3343`.
     */
    address: {
      paddingHorizontal: 4,
      paddingVertical: 6,
      height: 32,
      width: 140,
      /** Vertical CENTRES inside the 32pt stack. */
      labelCentreY: 8.5,
      lineCentreY: 25,
      gap: 12,
      disc: 32,
    },
  },

  /**
   * `1:479` "header 1" — a peeking three-panel carousel, FULL viewport width (369 of 370) rather
   * than inside the 16pt gutter. 75 + 16 + 217 + 16 + 75 = 399 in a 369 box, so each side panel
   * loses 15pt to the clip.
   */
  /**
   * `381:660` "header slides" — RE-READ against the final file, which replaced the empty colour
   * fields with eight real use-case cards (`378:189`).
   *
   * The block is 303 tall: the slide row (`381:661` "Frame 79") is 268 tall and starts 8.5 down,
   * then the pagination row (`381:677` "Frame 80") is 12 tall at y 282.5 — a 6pt gap between them.
   *
   * "Frame 79" is **399** wide starting at x −15 inside a 369pt viewport: 75 + 16 + 217 + 16 + 75.
   * The side panels are not a separate smaller shape, as the superseded file drew them — they are
   * the SAME 217 x 268 cards, clipped to a 75pt peek. That is why a slide can scroll into the
   * peek and become the centre without changing size.
   */
  promo: {
    height: 303,
    slideRowTop: 8.5,
    slideRowHeight: 268,
    dotsGap: 6,
    gap: 16,
    centre: { width: 217, height: 268 },
    /** How much of the neighbouring card shows on each side. 75 = (369 - 217 - 2*16) / 2 + 15. */
    peek: 75,
    radius: 20,
    /** `381:678` — eight 7pt circles at a 4pt gutter, both fills at 70 % opacity. */
    dot: { size: 7, gap: 4, opacity: 0.7 },
  },

  /** `59:654` "Book tiles" — `1:575` is a 2-track grid at an 18pt gutter. */
  tiles: {
    gap: 18,
    tile: { height: 142, paddingHorizontal: 10, paddingVertical: 22, gap: 6 },
    icon: 40,
    /** `59:391` / `129:40` — the glyph inside the 40pt disc is 30 × 40. */
    iconGlyphWidth: 30,
  },

  /**
   * `336:4260` "Active banner" → `59:587` — the Home active-booking card, REPLACING the
   * superseded `59:587` header-plus-timer-chip drawing entirely.
   *
   * On Page 3b it is the SECOND section, below the Instant/Schedule tiles, not above them.
   */
  activeBooking: {
    /** `337:4353` — 330 × 142, r24, 1pt `#FFD600`, `0 0 4 rgba(0,0,0,0.08)`. */
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
    /** `337:4354` — title left, disc right, 37pt tall. */
    headerHeight: 37,
    disc: 32,
    /** `337:4361` — the cook block and the badge column, 16 apart. */
    bodyGap: 16,
    photo: { width: 67, height: 70, imageWidth: 79, imageLeft: -4, imageTop: -5.5, radius: 16 },
    /** `337:4365` — 117 × 70 holding three lines at a 2pt gap. */
    lines: { width: 117, height: 70, gap: 2 },
    cookGap: 8,
    cookPaddingVertical: 6,
    /** `337:4369` / `337:4413` — the badge column. */
    badge: { width: 91, height: 82, radius: 7, captionGap: 8, pillHeight: 58 },
    /** `336:4228` — the rate card differs: r20, a `#FFDE33` hairline and a flatter lift. */
    rate: {
      /** `336:4236` — a 40pt "5+" chip 12 from a 244pt line, in a 48pt row at px 4 / py 6. */
      promptHeight: 48,
      promptPaddingHorizontal: 4,
      promptPaddingVertical: 6,
      promptGap: 12,
      chipWidth: 40,
      /** `336:4240` — nine equal tracks at a 6pt gutter in a 52pt row. */
      scaleHeight: 52,
      scaleGap: 6,
      blockGap: 4,
    },
  },

  /** `1:595` "NI/SI party" — the cuisine mosaic, 330 × 283. */
  cuisines: {
    /** 172 − 158. */
    columnGap: 14,
    /** 94 − 89 inside the stack. */
    rowGap: 5,
    /** 194 − 183 above the full-width band. */
    bandGap: 11,
    daily: { aspectRatio: 158 / 183 },
    north: { aspectRatio: 158 / 89 },
    south: { aspectRatio: 158 / 89 },
    asian: { aspectRatio: 330 / 89 },
    /** `140:188` — captions sit bottom-left at px 10 / pb 6. */
    captionPaddingHorizontal: 10,
    captionPaddingBottom: 6,
    /** `140:189` opens 10 from the top rather than 6; the others are symmetric. */
    bandPaddingTop: 10,
  },

  /** `135:71` — a 3 × 2 grid of 103 × 67 tiles, label ABOVE the artwork. */
  reasons: {
    columnGap: 10,
    rowGap: 16,
    columns: 3,
    tileHeight: 67,
    /** `333:3542` … `333:3562` — Figma sizes the artwork per tile, not uniformly. */
    art: {
      trained: { width: 63, height: 54 },
      verified: { width: 63, height: 52 },
      hygienic: { width: 54, height: 53 },
      reliable: { width: 57, height: 54 },
      available: { width: 60, height: 54 },
      compliant: { width: 60, height: 53 },
    },
    artDefault: { width: 60, height: 54 },
  },

  /** `135:93` duration matrix — unchanged from the superseded revision, re-verified this pass. */
  matrix: {
    rowGap: 6,
    headerHeight: 21,
    rowHeight: 18,
    columnGap: 40,
    minColumnGap: 10,
    /** `135:96` — the first cell starts 1.5pt LEFT of the row edge. */
    rowPaddingHorizontal: 0,
    /** 84 + 84 + 85 — the three tracks, without gutters. */
    trackTotal: 253,
  },

  /** `139:181` "What's not included?" — a 2 × 2 grid, 8 across and 15 down. */
  exclusions: {
    columnGap: 8,
    rowGap: 15,
    imageAspectRatio: 162 / 67.5,
    /** `156:30` — the caption's top edge sits 6pt below the 67.5pt image. */
    captionGap: 6,
  },

  /** `144:438` "Spoon's promise" — a 40pt mark 10 from a 254pt line. */
  promise: { logo: 40, gap: 10, lineWidth: 254 },

  /**
   * Section titles. The file uses TWO: the Black 16/24 heading over a 305pt measure inside a 31pt
   * block, and — on "Spoon's promise" alone (`144:437`) — a Bold 12/16 line in a 16pt block.
   */
  sectionTitle: { height: 31, width: 305, promiseHeight: 16 },

  /**
   * Every section is inset 4pt and padded 6pt vertically. The gap between a title and its content
   * is NOT uniform: `1:595` and `135:53` draw 12, `135:79`, `139:169` and `144:435` draw 6.
   */
  section: { paddingHorizontal: 4, paddingVertical: 6, gap: 6, gapWide: 12 },
} as const;
