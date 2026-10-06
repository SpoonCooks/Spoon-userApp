import type { ExplainerVideoSource } from './components/ExplainerPlayer';

/**
 * Where the explainer video is. This is the ONE place to set it: paste the video's URL here (an
 * `https://` link to an `.mp4`, or an HLS `.m3u8`), or, when the backend sends it, have
 * `useExplainerVideoSource` return that instead — its callers do not change.
 *
 * `null` means there is no video yet: the page still opens its player, with a placeholder that
 * counts time but plays nothing.
 */
export const EXPLAINER_VIDEO_URL: string | null = null;

/** The video the Recurring landing plays, or `undefined` while there is none. */
export function useExplainerVideoSource(): ExplainerVideoSource | undefined {
  return EXPLAINER_VIDEO_URL === null ? undefined : { uri: EXPLAINER_VIDEO_URL };
}
