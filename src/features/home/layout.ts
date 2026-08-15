import { useWindowDimensions } from 'react-native';

import { lightTheme } from '@ui';

/**
 * Home geometry, read off Figma Page 3a (`1:455`) and re-verified on Page 3b (`209:1207`), which
 * is the same body plus the upcoming-booking card.
 *
 * The 390pt frame includes the device bezel (a 9.6pt inset each side), so the design viewport is
 * 372pt and the padded content column is 340pt. Every value below is the REAL Figma measurement
 * at that column.
 *
 * RESPONSIVENESS RULE (task §5): these values are NOT multiplied by `screenWidth / 390`. Fixed
 * things in the design — padding, gaps, icons, radii, type — stay fixed, because they are fixed
 * in the design; only things that genuinely divide the content column (grid tracks, mosaic cells)
 * are derived from the available width, and they are derived with flexbox rather than arithmetic
 * wherever flexbox can express it. `useHomeContentWidth` exists for the two places where a real
 * measurement is unavoidable — the duration matrix gutter, which must collapse on a narrow phone
 * so the columns keep their text.
 *
 * Nothing here is a business value; it is pure layout arithmetic.
 */

/** The padded content column on Page 3a: 372 − 2×16. */
export const DESIGN_CONTENT_WIDTH = 340;

/** Available content width on THIS device, after the 16pt screen gutters. */
export function useHomeContentWidth(): number {
  const { width } = useWindowDimensions();
  return Math.max(1, width - lightTheme.layout.screenPaddingHorizontal * 2);
}

/** Page 3a section heights and inner dimensions, in design pt. */
export const HOME_DESIGN = {
  /** `209:1226` Body — 22pt above the first section, 8pt between sections. */
  body: { gap: 8, paddingTop: 22, paddingBottom: 16 },

  /** `209:1213` sticky top banner. */
  banner: {
    paddingTop: 16,
    /**
     * `1:458` is 85 tall and its in-flow children are the 23pt headline at y 16 and the 34pt
     * address block at y 43 (a 4pt gap): 16 + 23 + 4 + 34 = 77, so the tail is **8**, not 10.
     */
    paddingBottom: 8,
    paddingHorizontal: 16,
    gap: 4,
    /** `209:1216` — the bolt is 20 × 23, then a 4pt gap to the headline. */
    bolt: { width: 20, height: 23, gap: 4 },
    /**
     * `59:375` — a 34pt block: label centred at 10.5, address line centred at 26.
     *
     * The caret (`59:386`) needed three corrections, all verified on device:
     *  - `labelWidth` — the label's text box is a fixed **48** (`59:376`), and the caret follows
     *    THAT box, not the rendered glyphs. Laying it out as `"Home" + 3pt gap` put the caret
     *    ~16dp left of the frame.
     *  - `chevron` — the node's 8.35 × 3.69 is the PATH bound. The exported SVG is a 1.66667
     *    round-capped stroke, which adds 0.833 on every side, so the DRAWN mark is 10 × 5.33.
     *    Rendering it in an 8.35 box with `contain` shrank it to 6.71 wide.
     *  - `chevronCentreY` — the caret is at y 13 in a label spanning 2…19, so its centre (14.845)
     *    sits on the text BASELINE, not on the label's vertical centre (10.5).
     */
    address: {
      height: 34,
      labelCentreY: 10.5,
      lineCentreY: 26,
      labelWidth: 48,
      chevron: { width: 10, height: 5.33 },
      chevronGap: 2.17,
      chevronCentreY: 14.845,
    },
    /** `209:1223` — a 41pt hit box at top 14 / right 14; the 32pt ring sits +5/+4 inside it. */
    profile: { box: 41, top: 14, right: 14, ring: 32, ringInset: 5, glyph: 25 },
  },

  /** `209:1227` "header 1" — a peeking three-panel carousel, clipped to the column. */
  promo: {
    height: 257,
    gap: 16,
    centre: { width: 217, height: 238 },
    side: { width: 75, height: 210 },
  },

  /**
   * `59:587` upcoming booking. 340 × 136.59 with a large intentional empty tail — the header sits
   * at 16 and the duration row's box is centred in a 74.4pt band starting at 47, which puts its
   * 20pt content at 74.2.
   */
  upcoming: {
    height: 136.59,
    padding: 16,
    headerHeight: 25,
    /** 74.2 (duration row top) − 41 (header bottom). */
    headerToDuration: 33.2,
    durationHeight: 20,
    timerChip: 20,
    timerGap: 6,
  },

  /** `209:1234` "Book tiles". */
  tiles: {
    rowPaddingVertical: 4.5,
    gap: 18,
    tile: { width: 160, height: 142, paddingHorizontal: 10, paddingVertical: 22, gap: 6 },
    icon: 40,
    /** `209:1240` — the glyph inside the 40pt disc is 30 × 40. */
    iconGlyphWidth: 30,
  },

  /** `209:1254` "NI/SI party" — the cuisine mosaic. */
  cuisines: {
    /** Column gutter between the tall card and the stacked pair (178 − 162). */
    columnGap: 16,
    /** Row gutter inside the stack (104 − 89) and above the full-width band (209 − 194). */
    rowGap: 15,
    daily: { aspectRatio: 162 / 194, captionLeft: 10, captionCentreFromBottom: 14 },
    north: { aspectRatio: 162 / 89, captionLeft: 11, captionCentreFromBottom: 12 },
    south: { aspectRatio: 162 / 90, captionLeft: 12, captionCentreFromBottom: 13 },
    asian: { aspectRatio: 340 / 90, captionLeft: 12, captionCentreFromBottom: 13 },
  },

  /** `209:1276` — 3 × 2 reasons grid, 10pt gutters, 125pt rows. */
  reasons: {
    gap: 10,
    columns: 3,
    tileHeight: 125,
    artTop: 12,
    /** `153:503` … `153:493` — Figma sizes the artwork per tile, not uniformly. */
    art: { trained: 85, hygienic: 85, amenable: 80, hours: 80, efficient: 75, punctual: 78 },
    /** Vertical CENTRE of the label, measured from the tile top. */
    labelCentre: {
      trained: 109,
      hygienic: 109,
      amenable: 109,
      hours: 110,
      efficient: 109,
      punctual: 110,
    },
    labelCentreDefault: 109,
    artDefault: 80,
  },

  /** `209:1305` duration matrix. */
  matrix: {
    rowGap: 6,
    headerHeight: 21,
    rowHeight: 18,
    columnGap: 40,
    minColumnGap: 10,
    /** `209:1307` — the first cell starts 3.5pt in from the row edge. */
    rowPaddingHorizontal: 3.5,
    /** 84 + 84 + 85 — the three tracks, without gutters. */
    trackTotal: 253,
  },

  /** `209:1357` "What's not included?" — a 2 × 2 grid. */
  exclusions: {
    gap: 15,
    imageAspectRatio: 162 / 67.5,
    /** `209:1361` — caption top edge sits 6pt below the 67.5pt image. */
    captionGap: 6,
  },

  /** `209:1378` "Spoon's promise". */
  promise: { logo: 40 },

  /** `209:1274` shared section title block — 31pt tall over a 305pt measure. */
  sectionTitle: { height: 31, width: 305 },

  /** Every Home section carries 6pt of vertical padding and a 6pt inner gap (`209:1254`). */
  section: { paddingVertical: 6, gap: 6 },
} as const;
