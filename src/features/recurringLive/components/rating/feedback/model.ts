import type { RatingAttachment } from '@features/booking';

/**
 * What the customer adds to a rating through the card's Voice / Media / Write block (Figma
 * "Ratings" `1603:50`, `2093:6050`; dev notes `2238:919`, `2238:935`): at most one voice note,
 * five photos and one video, and a written note. Held by the card until Submit, then uploaded.
 */
export interface FeedbackVoiceNote {
  /** Local recording; `null` for the preview's drawn note. */
  readonly uri: string | null;
  readonly durationMs: number;
  readonly sizeBytes: number;
  /** The bars as recorded, in points, 0 – {@link WAVE_HEIGHT}. */
  readonly bars: readonly number[];
}

export interface FeedbackMediaItem {
  readonly id: string;
  readonly kind: 'photo' | 'video';
  readonly uri: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  /** Video only. */
  readonly durationMs: number | null;
}

export interface FeedbackDraft {
  readonly voice: FeedbackVoiceNote | null;
  readonly media: readonly FeedbackMediaItem[];
  readonly text: string;
}

export const EMPTY_FEEDBACK: FeedbackDraft = { voice: null, media: [], text: '' };

/** "Photo: camera allows up to 5 photos." */
export const MAX_FEEDBACK_PHOTOS = 5;
/** One video, auto-stopped at 30 s. */
export const MAX_FEEDBACK_VIDEOS = 1;
export const MAX_VIDEO_MS = 30_000;
/** A gallery video's reported length may run a little over a 30 s clip's. */
const VIDEO_LENGTH_SLACK_MS = 1_000;

/**
 * Why a video picked from the gallery can't go on the rating, or `null` when it can. The gallery
 * lets the customer pick a video of any length, so the length it reports is checked here; one it
 * cannot report is turned away too, since nothing else would stop a long one.
 */
export function galleryVideoProblem(
  durationMs: number | null | undefined,
): 'tooLong' | 'unknownLength' | null {
  if (durationMs === null || durationMs === undefined || !(durationMs > 0)) return 'unknownLength';
  return durationMs > MAX_VIDEO_MS + VIDEO_LENGTH_SLACK_MS ? 'tooLong' : null;
}
/** The voice note stops itself at two minutes; the card asks for ten seconds. */
export const MAX_VOICE_MS = 120_000;
const MB = 1024 * 1024;
/**
 * The server's size limit per file (V0 `RATING_MEDIA_RULES`), a few times what the app sends: a
 * shrunk photo is ~0.3 MB and a compressed 30 s video ~5–6 MB (an iPhone's export up to ~18 MB).
 * Checked as each item is added, so an oversized one is turned away there, not at Submit.
 */
export const MAX_MEDIA_BYTES: Readonly<Record<FeedbackMediaItem['kind'], number>> = {
  photo: 5 * MB,
  video: 25 * MB,
};
/** The server's limit on a written note. */
export const MAX_FEEDBACK_TEXT = 2000;

/** `2093:5682` — 38 bars fill the 186pt waveform; each 2.45 wide, 2.52 apart, up to 30.8 tall. */
export const WAVE_BAR_COUNT = 38;
export const WAVE_HEIGHT = 30.8;
const WAVE_MIN = 4;

export function photosLeft(draft: FeedbackDraft): number {
  return MAX_FEEDBACK_PHOTOS - draft.media.filter((item) => item.kind === 'photo').length;
}

export function videoAllowed(draft: FeedbackDraft): boolean {
  return draft.media.filter((item) => item.kind === 'video').length < MAX_FEEDBACK_VIDEOS;
}

export function mediaBytes(draft: FeedbackDraft): number {
  return draft.media.reduce((sum, item) => sum + item.sizeBytes, 0) + (draft.voice?.sizeBytes ?? 0);
}

/** Whether anything has been added — the block then shows what. */
export function hasFeedback(draft: FeedbackDraft): boolean {
  return draft.voice !== null || draft.media.length > 0 || draft.text.trim() !== '';
}

/** "0:23" — whole seconds, rounded down, never negative. */
export function clipTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;
}

/** A metering reading (dBFS, -160 … 0) as a bar height: the bottom 50 dB is the visible range. */
export function barFromMetering(db: number | undefined): number {
  if (db === undefined || !Number.isFinite(db)) return WAVE_MIN;
  const level = Math.min(1, Math.max(0, (db + 50) / 50));
  return WAVE_MIN + level * (WAVE_HEIGHT - WAVE_MIN);
}

/** Every reading folded into {@link WAVE_BAR_COUNT} bars, each the loudest of its share. */
export function foldBars(samples: readonly number[]): readonly number[] {
  if (samples.length <= WAVE_BAR_COUNT) return samples;
  const bars: number[] = [];
  for (let index = 0; index < WAVE_BAR_COUNT; index += 1) {
    const from = Math.floor((index * samples.length) / WAVE_BAR_COUNT);
    const to = Math.max(from + 1, Math.floor(((index + 1) * samples.length) / WAVE_BAR_COUNT));
    bars.push(Math.max(...samples.slice(from, to)));
  }
  return bars;
}

/** The draft as the rating sends it: the voice note first, then photos and video as added. */
export function attachmentsOf(draft: FeedbackDraft): readonly RatingAttachment[] {
  const voice: RatingAttachment[] =
    draft.voice === null || draft.voice.uri === null
      ? []
      : [
          {
            kind: 'voice',
            uri: draft.voice.uri,
            mimeType: 'audio/mp4',
            sizeBytes: draft.voice.sizeBytes,
            durationMs: draft.voice.durationMs,
          },
        ];
  return [
    ...voice,
    ...draft.media.map((item) => ({
      kind: item.kind,
      uri: item.uri,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      durationMs: item.durationMs,
    })),
  ];
}

/** The preview's drawn feedback states, `2093:5738` (voice), `2093:5817` (write) and `2093:5898`. */
export function feedbackFixture(
  state: 'voice' | 'write' | 'uploaded',
  photoUri: string,
  bars: readonly number[],
): FeedbackDraft {
  const voice: FeedbackVoiceNote = { uri: null, durationMs: 23_000, sizeBytes: 0, bars };
  if (state === 'voice') return { voice, media: [], text: '' };
  if (state === 'write') return { voice, media: [], text: '' };
  return {
    voice,
    media: [1, 2, 3, 4].map((n) => ({
      id: `photo-${String(n)}`,
      kind: 'photo' as const,
      uri: photoUri,
      mimeType: 'image/webp',
      sizeBytes: 1,
      durationMs: null,
    })),
    text: 'Sabzi was little salty, but overall food was good. Sabzi was little salty, but overall food was good.',
  };
}
