import {
  EMPTY_FEEDBACK,
  WAVE_BAR_COUNT,
  WAVE_HEIGHT,
  attachmentsOf,
  barFromMetering,
  clipTime,
  foldBars,
  hasFeedback,
  photosLeft,
  videoAllowed,
} from './model';
import type { FeedbackDraft } from './model';

const photo = (id: string) => ({
  id,
  kind: 'photo' as const,
  uri: `file:///${id}.jpg`,
  mimeType: 'image/jpeg',
  sizeBytes: 10,
  durationMs: null,
});

describe('feedback block model (Figma 2093:6050)', () => {
  it('writes clip lengths as the frames do', () => {
    expect(clipTime(23_400)).toBe('0:23');
    expect(clipTime(30_000)).toBe('0:30');
    expect(clipTime(61_000)).toBe('1:01');
    expect(clipTime(-5)).toBe('0:00');
  });

  it('maps loudness into the 30.8pt band and folds a long note into 38 bars', () => {
    expect(barFromMetering(0)).toBeCloseTo(WAVE_HEIGHT);
    expect(barFromMetering(-160)).toBeLessThan(6);
    expect(barFromMetering(undefined)).toBeLessThan(6);
    const folded = foldBars(Array.from({ length: 200 }, (_, i) => (i === 150 ? 30 : 5)));
    expect(folded).toHaveLength(WAVE_BAR_COUNT);
    expect(Math.max(...folded)).toBe(30);
  });

  it('counts what is left: five photos and one video', () => {
    const draft: FeedbackDraft = {
      ...EMPTY_FEEDBACK,
      media: [photo('a'), photo('b'), { ...photo('v'), kind: 'video', durationMs: 9_000 }],
    };
    expect(photosLeft(draft)).toBe(3);
    expect(videoAllowed(draft)).toBe(false);
    expect(videoAllowed(EMPTY_FEEDBACK)).toBe(true);
  });

  it('knows when something was added, and leaves the preview’s drawn note out of the upload', () => {
    expect(hasFeedback(EMPTY_FEEDBACK)).toBe(false);
    expect(hasFeedback({ ...EMPTY_FEEDBACK, text: '  ' })).toBe(false);
    expect(hasFeedback({ ...EMPTY_FEEDBACK, text: 'Salty' })).toBe(true);
    const drawn: FeedbackDraft = {
      ...EMPTY_FEEDBACK,
      voice: { uri: null, durationMs: 23_000, sizeBytes: 0, bars: [] },
    };
    expect(attachmentsOf(drawn)).toEqual([]);
  });
});
