/**
 * The sticky "Schedule Recurring" footer's show/hide rule — design notes `983:6006` … `983:6019`
 * on the Recurring booking page.
 *
 * Only one "schedule" CTA is on screen at a time. At the top the "Schedule Now" tag hangs off the
 * thread and the footer is parked below the screen; the moment the tag's bottom edge scrolls past
 * the top of the viewport (scrollY > 254) the footer slides in, and as soon as the tag comes back
 * it slides out again. An 8pt buffer keeps it from bouncing at the threshold: it comes in above
 * 254 but goes out only once back under 246.
 *
 * Both functions run on the UI thread (`'worklet'`), inside the scroll handler.
 */

/** The scroll offset past which the tag is off the top of the viewport. */
export const FOOTER_SHOW_ABOVE = 254;
/** The buffer under the threshold the footer holds through before it goes out again. */
export const FOOTER_BUFFER = 8;

/** Slides up from 100 % to 0 and fades in: 220 ms, `cubic-bezier(.2, .8, .2, 1)`. */
export const FOOTER_IN_MS = 220;
export const FOOTER_IN_CURVE = [0.2, 0.8, 0.2, 1] as const;
/** Slides back down as the tag re-enters: 180 ms, ease-in (`cubic-bezier(.42, 0, 1, 1)`). */
export const FOOTER_OUT_MS = 180;
export const FOOTER_OUT_CURVE = [0.42, 0, 1, 1] as const;

/** Whether the footer should be showing, given whether it is now and where the page is scrolled. */
export function footerVisibleAt(wasVisible: boolean, scrollY: number): boolean {
  'worklet';
  return wasVisible ? scrollY >= FOOTER_SHOW_ABOVE - FOOTER_BUFFER : scrollY > FOOTER_SHOW_ABOVE;
}
