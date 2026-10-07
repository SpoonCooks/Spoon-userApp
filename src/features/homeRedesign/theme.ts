import type { ViewStyle } from 'react-native';

import { fontFamily } from '@ui/tokens/primitives';

/**
 * Colours and type for the redesigned Home — Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon--User), frames
 * `941:4884`, `1255:2973`, `1290:1280` and `1302:3539`.
 *
 * This file's palette is the new file's own; it does not reuse the previous Home's tokens, whose
 * values (e.g. the `lime300` banner) are from a different Figma file.
 */
export const C = {
  base: '#FFFFFF',
  brand: '#FFD600',
  tint: '#FFE666',
  soft: '#FFEF99',
  softer: '#FFF7CC',
  lime: '#CFFF04',
  limeSoft: '#ECFF9B',
  text: '#000000',
  textSecondary: 'rgba(0,0,0,0.6)',
  textDisabled: 'rgba(0,0,0,0.25)',
  surfaceDisabled: 'rgba(0,0,0,0.03)',
  /** `1095:8027` — the day spine's dashes. */
  spine: 'rgba(0,0,0,0.25)',
} as const;

export const F = fontFamily;

/*
 * Shadows as Figma states them, through `boxShadow` (CSS semantics on both platforms under the New
 * Architecture this app runs). Figma's effect "radius" is a CSS blur; iOS's `shadowRadius` is not —
 * it drew these about twice as soft and wide, so the duration tiles' shadows ran together into a
 * grey band the carousel then clipped square.
 */

/** Elevation/2 — `0 0 12 #0000001A`: the floating pills and the focused tile. */
export const SHADOW_PILL: ViewStyle = {
  boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 12, color: 'rgba(0,0,0,0.1)' }],
};

/**
 * The cook card. Its effect is Elevation/2, but the frame (`1255:3269`–`1255:3272`) stacks the four
 * swipeable cards on the same spot, so what the design SHOWS is four of those shadows on top of
 * each other. One card is on screen at a time here; four layers draw the shadow the frame draws.
 */
const ELEVATION_2 = { offsetX: 0, offsetY: 0, blurRadius: 12, color: 'rgba(0,0,0,0.1)' } as const;
export const SHADOW_CARD: ViewStyle = {
  boxShadow: [ELEVATION_2, ELEVATION_2, ELEVATION_2, ELEVATION_2],
};

/** Elevation/1 — `0 0 3 #00000014`: duration tiles and stepper buttons. */
export const SHADOW_SOFT: ViewStyle = {
  boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 3, color: 'rgba(0,0,0,0.08)' }],
};
