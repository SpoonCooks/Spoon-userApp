import type { DurationGuideRow } from '@ui';

/**
 * DEMO / TEST FIXTURE - NOT PRODUCTION DATA.
 *
 * The "How to choose a duration?" table (`135:93`), transcribed from the final file.
 *
 * It lives on its own because THREE surfaces draw it: Home's marketing stack (`135:79`) and the
 * "Help me pick" sheet (`333:3643`) raised from the Duration step of both Scheduled and Instant.
 * One transcription, so the three cannot disagree about what the guide says.
 *
 * It is design CONTENT, like the rest of the marketing copy - it does not constrain the durations
 * the server offers, and nothing reads a duration out of it.
 */
export const DEMO_DURATION_GUIDE_TITLE = 'How to choose a duration?';

/** Uppercasing is a typography-token concern (`labelUpper`), not baked into the content. */
export const DEMO_DURATION_GUIDE_COLUMNS: readonly [string, string, string] = [
  'People',
  'Dish',
  'time',
];

/** `333:3625` - the sheet's own title, and the label of the link that raises it. */
export const DEMO_HELP_ME_PICK_LABEL = 'Help me pick';

export const DEMO_DURATION_GUIDE: readonly DurationGuideRow[] = [
  { people: '1–4', dish: 'Snacks/ sides/ roti', time: '30 mins' },
  { people: '1–2', dish: '2-3 (simple)', time: '45 mins' },
  { people: '1–2', dish: '2-3 (complex)', time: '60 mins' },
  { people: '3–4', dish: '2-3 (simple)', time: '1 hr' },
  { people: '3–4', dish: '2-3 (complex)', time: '1.5 hrs' },
  { people: '5–6', dish: '2-3 (simple)', time: '1.5 hrs' },
  { people: '5–6', dish: '4-5 (simple)', time: '2 hrs' },
  { people: '5–6', dish: '2-3 (complex)', time: '2 hrs' },
  { people: '5–6', dish: '4-5 (complex)', time: '2.5 hrs' },
  { people: '7–8', dish: '2-3 (simple)', time: '2 hrs' },
  { people: '7–8', dish: '4-5 (simple)', time: '2.5 hrs' },
];
