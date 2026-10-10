import type { ViewStyle } from 'react-native';

import { fontFamily } from '@ui/tokens/primitives';

/**
 * Colours and elevations for the login redesign — Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon--User),
 * page "Login" (`1873:4879`). The same design-system file as the redesigned Home, so these are the
 * same values `homeRedesign/theme.ts` uses; the app-wide tokens come from an older file and do not
 * match (`textSecondary` there is 70 % ink, here it is 60 %).
 */
export const C = {
  /** `color/surface/base`. */
  base: '#FFFFFF',
  /** `color/brand/primary` — field outline, cell outlines, the "OTP" marker. */
  brand: '#FFD600',
  /** `color/brand/primary-tint` — "Resend via SMS", the "Trained" badge well. */
  tint: '#FFE666',
  /** `color/surface/subtle` — empty cells, the timer and Edit pills. */
  subtle: '#FFF7CC',
  /** `color/status/positive` — the "15-min arrival" well. */
  positive: '#CFFF04',
  /** `color/status/positive-subtle` — the "Background verified" well. */
  positiveSubtle: '#ECFF9B',
  text: '#000000',
  textSecondary: 'rgba(0,0,0,0.6)',
  textDisabled: 'rgba(0,0,0,0.25)',
  /**
   * Disabled Get OTP (`1923:1328`) as Figma RENDERS it: 229 grey. The fill variable is only
   * `#00000006`, but that frame draws the Button's Elevation/1 shadow (8 % black) underneath the
   * see-through fill; React Native draws shadows outside a view only, so the composite (≈10 %
   * black over white) is the fill here. Measured on the exported frame.
   */
  surfaceDisabled: 'rgba(0,0,0,0.1)',
  /**
   * Disabled Verify & continue (`1945:1758`) renders as the bare variable — 249 grey, no shadow
   * behind it. The two frames differ; each is matched as drawn.
   */
  surfaceDisabledVerify: '#00000006',
  /** `color/border/strong` — the rejected-code cells. There is no red in the customer app. */
  borderStrong: '#000000',
} as const;

export const F = fontFamily;

/** Elevation/1 — `0 0 3 #00000014`: the phone field and filled cells. */
export const SHADOW_SOFT: ViewStyle = {
  boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 3, color: 'rgba(0,0,0,0.08)' }],
};

/** Elevation/2 — `0 0 12 #0000001A`: the badges and the floating Back button. */
export const SHADOW_PILL: ViewStyle = {
  boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 12, color: 'rgba(0,0,0,0.1)' }],
};

/** `1923:1328` — the Button's own `drop-shadow 0 0 1.5 #00000014`. */
export const SHADOW_BUTTON: ViewStyle = {
  boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 1.5, color: 'rgba(0,0,0,0.08)' }],
};
