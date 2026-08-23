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
  /**
   * Where the row goes. ABSENT means there is nowhere to go, and the row is then drawn as plain
   * text rather than as a button that does nothing (task §11).
   *
   * BACKEND_GAP: no legal or policy URL is published anywhere — `GET /v1/catalogue`'s `support`
   * block carries `whatsappPhone`, `callPhone`, `email` and `helpUrl`, none of which is the terms
   * document `6:779` names, and the deployment publishes none of them. See
   * `docs/FRONTEND_BACKEND_PENDING.md`. No URL is guessed here: sending a customer to an invented
   * address for a LEGAL document is worse than not offering the link.
   */
  readonly url?: string;
}

export interface ProfileViewModel {
  readonly title: string;
  readonly user: ProfileUserViewModel;
  /**
   * `222:1570` vs `456:3467` — which completion card `6:663` draws.
   *
   * This is `GET /v1/me`'s `profileComplete`, carried through UNCHANGED. The client does not
   * compute it (task §9): the server owns the flag, and a second opinion here would put the two
   * in disagreement on every surface that reads either one.
   *
   * BACKEND_GAP_PROFILE_COMPLETENESS: the server derives it from `name !== null`, which is not
   * the V8 rule — V8 marks Name, Daily meal structure AND Dietary preference with a `*`. The flag
   * is therefore true for a customer who has answered one of three. Reported rather than
   * corrected here; see `docs/FRONTEND_BACKEND_PENDING.md`.
   */
  readonly profileComplete: boolean;
  readonly tiles: readonly ProfileTileViewModel[];
  readonly links: readonly ProfileLinkViewModel[];
  readonly logoutLabel: string;
}
