import { createKeyFactory } from '@core/query';

/**
 * Feature: service (live session).
 *
 * Screens: `101:1812` In service (with `3:1848` as its top-fold), `3:2002` Extension bottom
 * sheet, `143:207` Completion (rating + tip, widget spec `119:2885`).
 *
 * Boundary — the countdown is a RENDERING of server truth (`@core/time`):
 *  - derived from a server-provided absolute end timestamp, corrected for clock skew;
 *  - recomputed on foreground;
 *  - reaching zero triggers a REFETCH, never a state transition. Session end is a backend
 *    decision.
 *  - the extension's new end time comes from the server response, never from client arithmetic —
 *    extension has pricing implications.
 *
 * TODO(backend-contract): no session, extension or completion endpoints exist.
 */
export const serviceKeys = createKeyFactory('service');
