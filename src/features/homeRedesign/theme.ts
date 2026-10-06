import { Platform } from 'react-native';
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
} as const;

export const F = fontFamily;

/** `0 0 12 rgba(0,0,0,0.1)` — the floating pills. */
export const SHADOW_PILL: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  default: { elevation: 4 },
})!;

/** `0 0 6 rgba(0,0,0,0.1)` — the cook card. */
export const SHADOW_CARD: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  default: { elevation: 3 },
})!;

/** `0 0 3 rgba(0,0,0,0.08)` — duration tiles and stepper buttons. */
export const SHADOW_SOFT: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  default: { elevation: 2 },
})!;
