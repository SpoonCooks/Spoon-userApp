/**
 * Fixture data for the recurring live booking rate card and its "Tell us more" sheet, read
 * verbatim off Figma `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`: `1501:6628` (first look),
 * `1501:6696` (4.5), `1501:6846` (5+), `1501:7335` (3–3.5), `1501:7481` (2–2.5), `1501:7630`
 * (1–1.5) and `1501:7201` (Tell us more). STATIC ONLY — nothing here comes from a backend.
 */

/**
 * What the customer can pick: a half-step score on the five stars, or the `5+` burst.
 *
 * Named apart from `@ui`'s `RatingValue` (the one-off Completion widget's nine-chip scale) so the
 * two can be imported side by side.
 */
export type VisitRatingValue = 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 | '5+';

export const VISIT_RATING_PLUS = '5+';

/**
 * The card's five drawn moods. `idle` is `1501:6628`; the rest follow from the score:
 *   loved         4 – 5     `1501:6696`
 *   magic         5+        `1501:6846`
 *   belowPar      3 – 3.5   `1501:7335`
 *   disappointing 2 – 2.5   `1501:7481`
 *   veryPoor      1 – 1.5   `1501:7630`
 */
export type RatingTier = 'idle' | 'loved' | 'magic' | 'belowPar' | 'disappointing' | 'veryPoor';

export function ratingTier(value: VisitRatingValue | null): RatingTier {
  if (value === null) return 'idle';
  if (value === VISIT_RATING_PLUS) return 'magic';
  if (value >= 4) return 'loved';
  if (value >= 3) return 'belowPar';
  if (value >= 2) return 'disappointing';
  return 'veryPoor';
}

/** The sticker numeral: "4.5", "5+", "1" — integers drawn without a decimal (`1501:7664`). */
export function formatRating(value: VisitRatingValue): string {
  return String(value);
}

/** Which support toggle a low score offers. */
export type RatingSupportKind = 'differentCook' | 'callBack';

export interface RatingTierCopy {
  readonly headline: string;
  readonly body: string;
  /** The chip block's label. */
  readonly chipsLabel: string;
  readonly sayMoreTitle: string;
  readonly sayMoreBody: string;
  /** Low scores only. */
  readonly support?: {
    readonly kind: RatingSupportKind;
    readonly title: string;
    readonly body: string;
    /** As drawn: `1501:7477` off, `1501:7626` / `1501:7772` on. */
    readonly initiallyOn: boolean;
  };
  /** The CTA label; with a call-back toggle ON it reads `submitCallBack` instead. */
  readonly submit: string;
}

const SAY_MORE_POSITIVE = {
  sayMoreTitle: 'Tap to talk',
  sayMoreBody: 'Say it like you’d tell a friend',
} as const;

const SAY_MORE_NEGATIVE = {
  sayMoreTitle: 'What happened?',
  sayMoreBody: 'A quick voice note helps us fix it',
} as const;

/**
 * On a real visit the say-more row opens the WRITTEN half of "Tell us more" only: the rating
 * endpoint takes words (`feedback`) but no voice note, photo or video yet.
 */
export const RATING_SAY_MORE_WRITTEN = {
  sayMoreTitle: 'Add a note',
  sayMoreBody: 'Tell us in your own words',
} as const;

const CALL_BACK = {
  kind: 'callBack',
  title: 'Get a call back from Spoon',
  body: 'Our team reaches out within 24 hrs',
  initiallyOn: true,
} as const;

export const RATING_SUBMIT_CALL_BACK = 'Submit & request call back';

/** The tier copy for a cook by first name (the frames' Rekha in the preview). */
export function ratingTierCopy(
  cookName: string,
): Record<Exclude<RatingTier, 'idle'>, RatingTierCopy> {
  return {
    loved: {
      headline: 'Loved it!',
      body: `${cookName} will be thrilled. Anything that made it special?`,
      chipsLabel: 'What stood out?',
      ...SAY_MORE_POSITIVE,
      submit: 'Submit rating',
    },
    magic: {
      headline: 'Off the charts!',
      body: `We’ll make sure ${cookName} hears this. What made it magic?`,
      chipsLabel: 'What made it magic?',
      ...SAY_MORE_POSITIVE,
      submit: `Send 5+ to ${cookName}`,
    },
    belowPar: {
      headline: 'Not quite there',
      body: 'Sorry it wasn’t great. What fell short?',
      chipsLabel: 'What fell short?',
      ...SAY_MORE_NEGATIVE,
      support: {
        kind: 'differentCook',
        title: 'Prefer a different cook next time?',
        body: 'We’ll match you with someone new',
        initiallyOn: false,
      },
      submit: 'Submit rating',
    },
    disappointing: {
      headline: 'That’s disappointing',
      body: 'We’re sorry. Tell us what went wrong, we’ll act on it immediately.',
      chipsLabel: 'What went wrong?',
      ...SAY_MORE_NEGATIVE,
      support: CALL_BACK,
      submit: 'Submit rating',
    },
    veryPoor: {
      headline: 'That’s not okay',
      body: 'We’re really sorry. Someone from Spoon will look into this personally.',
      chipsLabel: 'What went wrong?',
      ...SAY_MORE_NEGATIVE,
      support: CALL_BACK,
      submit: 'Submit rating',
    },
  };
}

export const RATING_TIER_COPY = ratingTierCopy('Rekha');

export interface RatingChip {
  readonly key: string;
  readonly label: string;
}

/** `1501:6809` — the positive chips, in drawn order. */
export const RATING_CHIPS_POSITIVE: readonly RatingChip[] = [
  { key: 'taste', label: 'Taste' },
  { key: 'onTime', label: 'On time' },
  { key: 'variety', label: 'Dish variety' },
  { key: 'polite', label: 'Polite' },
  { key: 'fast', label: 'Fast' },
  { key: 'portion', label: 'Portion' },
  { key: 'hygiene', label: 'Hygiene' },
];

/** `1501:7431` — the negative chips, in drawn order. */
export const RATING_CHIPS_NEGATIVE: readonly RatingChip[] = [
  { key: 'taste', label: 'Taste' },
  { key: 'slow', label: 'Slow' },
  { key: 'portion', label: 'Portion' },
  { key: 'hygiene', label: 'Hygiene' },
  { key: 'rude', label: 'Rude' },
  { key: 'burnt', label: 'Burnt' },
  { key: 'oil', label: 'Too much oil' },
];

/** The chips each frame draws ticked. */
export const RATING_CHIPS_POSITIVE_PICKED: readonly string[] = ['taste', 'onTime', 'hygiene'];
export const RATING_CHIPS_NEGATIVE_PICKED: readonly string[] = ['taste', 'slow'];

/** `1501:6631` — the card's header row. */
export const RATING_VISIT_FIXTURE = {
  title: 'Lunch with Cook Rekha',
  meta: 'Sun, 12 Apr · 1:15 PM · 1 hr',
  cookName: 'Rekha',
} as const;

// --- Tell us more (`1501:7203`) ------------------------------------------------------------------

/** `1501:7217` — the live recorder's 38 bars; the first 26 are recorded (black), the rest pending. */
export const RECORDER_BARS: readonly number[] = [
  38.247, 37.289, 12.345, 32.047, 30.163, 14.977, 12.435, 25.682, 30.755, 11.767, 36.33, 40.925,
  21.788, 16.956, 13.371, 18.588, 11.162, 33.099, 42.76, 25.04, 23.055, 29.856, 17.489, 11.033,
  23.122, 35.187, 24.017, 25.86, 40.847, 29.286, 11.359, 12.77, 20.524, 19.309, 24.267, 43.023,
  35.396, 12.171,
];
export const RECORDER_BARS_RECORDED = 26;

/** `1501:7275` — the saved voice note's 30 bars. */
export const VOICE_NOTE_BARS: readonly number[] = [
  9.977, 11.703, 5.911, 5.728, 13.632, 19.791, 13.109, 11.975, 18.513, 12.747, 5.586, 7.488, 13.634,
  11.301, 12.117, 21.502, 17.285, 5.591, 10.43, 5.886, 7.932, 10.215, 19.746, 18.249, 5.641, 16.053,
  14.228, 6.912, 6.717, 13.731,
];

export const FEEDBACK_PROMPT =
  'Try: how the sabzi tasted · was she on time · anything to change next visit · what was good?';

export type FeedbackMediaKind = 'photo' | 'video';

export interface FeedbackMedia {
  readonly id: string;
  readonly kind: FeedbackMediaKind;
  /** Fixture thumbnails are flat 135° washes (`1501:7308` …), named by their token pair. */
  readonly wash: 'amber' | 'green' | 'video';
  /** Videos only — `1501:7326`. */
  readonly duration?: string;
}

export const FEEDBACK_FIXTURE = {
  recordingTime: '0:23',
  voiceNote: { duration: '0:41' },
  media: [
    { id: 'photo-1', kind: 'photo', wash: 'amber' },
    { id: 'photo-2', kind: 'photo', wash: 'green' },
    { id: 'video-1', kind: 'video', wash: 'video', duration: '0:12' },
  ] as readonly FeedbackMedia[],
} as const;

/** `1501:7270` — "1 voice · 2 photos · 1 video". */
export function addedSummary(voiceNotes: number, media: readonly FeedbackMedia[]): string {
  const photos = media.filter((item) => item.kind === 'photo').length;
  const videos = media.length - photos;
  return [
    `${voiceNotes} voice`,
    `${photos} ${photos === 1 ? 'photo' : 'photos'}`,
    `${videos} ${videos === 1 ? 'video' : 'videos'}`,
  ].join(' · ');
}
