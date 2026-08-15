import type { IconName } from '@ui';

/**
 * Profile view models — Figma `6:663`.
 *
 * `contactLine` is whatever the server chooses to display beside the name. It is presentation
 * text: no phone number is assembled, formatted or dialled by this app, and the logger redacts
 * anything phone-shaped that reaches a log call.
 *
 * TODO(backend-contract): profile payload, and the destinations behind each tile.
 */

export interface ProfileUserViewModel {
  readonly name: string;
  readonly contactLine: string;
}

export interface ProfileTileViewModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  /**
   * `69:407` and its siblings are exported 32pt discs, keyed by tile id in `PROFILE_TILE_ART`.
   * The Feather name is kept only as a fallback for a tile the design has no artwork for.
   */
  readonly icon?: IconName;
}

export interface ProfileLinkViewModel {
  readonly id: string;
  readonly title: string;
  /** LEADING mark. `6:767` has one; `6:780` (the legal row) deliberately has none. */
  readonly icon?: IconName;
  /**
   * TRAILING mark. `6:775` is an external-link arrow, `6:782` is a **shield** — not a chevron, and
   * not derivable from an `external` flag, which is why this is the icon itself.
   */
  readonly trailingIcon?: IconName;
}

/**
 * `222:1570` — the "Your profile is incomplete" prompt, NEW in `1kd1u3WEc00SENkToIPloW`.
 *
 * Present ONLY when the server says the profile is incomplete. The client does not inspect the
 * profile, count missing fields or decide what "complete" means — those are product and backend
 * rules, and the whole block is absent when this is.
 */
export interface ProfileIncompleteViewModel {
  /** `222:1577` — "Your profile is incomplete". */
  readonly title: string;
  /** `222:1579` — the supporting line. */
  readonly message: string;
  /** `222:1592` — "Complete profile". */
  readonly ctaLabel: string;
}

export interface ProfileViewModel {
  readonly title: string;
  readonly user: ProfileUserViewModel;
  /** `222:1570`. Rendered between the identity card and the tile grid when supplied. */
  readonly incomplete?: ProfileIncompleteViewModel;
  readonly tiles: readonly ProfileTileViewModel[];
  readonly links: readonly ProfileLinkViewModel[];
  readonly logoutLabel: string;
}
