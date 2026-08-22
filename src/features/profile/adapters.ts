import type { MeResponse } from '@features/auth';

import type { ProfileViewModel } from './types';

/**
 * `GET /v1/me` -> `ProfileViewModel`.
 *
 * ## What the backend owns here, and what it does not
 *
 * The server owns the IDENTITY half: the name and the phone. The server owns none of the
 * STRUCTURE: the tile grid, the legal row, the screen title and the logout label are navigation
 * and copy, not domain state, and there is no endpoint that serves them. They come from the
 * static screen definition and are passed in as `base`.
 *
 * ## Why `profileComplete` IS read (reversed for V8)
 *
 * The V7 pass stopped consuming this flag: the completion prompt (`222:1570`) had been moved into
 * the `V1s` section, `6:663` drew identity card / tile grid / legal row / logout and nothing else,
 * and V0 therefore had no completeness surface for the flag to drive.
 *
 * The V8 file reverses that. `222:1570` is back ON `6:663`, at y 79 between the identity card and
 * the tile grid, and `456:3467` is its completed counterpart — and the founder's ruling makes the
 * profile-details page (`338:4508`) V0 rather than V1. So the flag drives a surface again, and it
 * is carried through verbatim.
 *
 * It is NOT recomputed here (task §9). The server owns completeness; a client-side rule would
 * disagree with it the moment the two definitions drift. What the server's rule currently is —
 * `name !== null`, against V8's three starred fields — is recorded as a CONTRACT GAP in
 * `docs/FRONTEND_BACKEND_PENDING.md` rather than worked around.
 *
 * ## The empty name
 *
 * `name` is null until the customer supplies one, and the frame draws a name. Rather than invent
 * one, the adapter falls back to the static `namePlaceholder` — copy the design owns. Nothing is
 * fabricated: a blank identity is presented as blank.
 */
export function profileFromMe(input: {
  readonly base: ProfileViewModel;
  readonly me: MeResponse;
  /** Static copy shown while the customer has no name yet. */
  readonly namePlaceholder: string;
}): ProfileViewModel {
  const { base, me } = input;

  return {
    ...base,
    profileComplete: me.profileComplete,
    user: {
      name: me.name ?? input.namePlaceholder,
      // Presentation only. No number is assembled, parsed or dialled by this app.
      contactLine: me.phone,
    },
  };
}
