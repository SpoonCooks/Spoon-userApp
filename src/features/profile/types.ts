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
  /**
   * The bordered row above Log Out that opens the Account screen (Terms of Service, Privacy
   * Policy, Delete Account). Replaces the V8 legal-links footer row — see the Account feature and
   * the superseded Ruling R-6 in `ProfileScreen.tsx`.
   */
  readonly manageAccountLabel: string;
  readonly logoutLabel: string;
}
