import type { ApiClient } from '@core/api';

import { createServiceApi } from './api/bookingApi';
import { ratingSubmissionScope } from './api/hooks';
import { ratingMimeTypeOf, uploadRatingAttachments } from './ratingMedia';
import type { RatingAttachment } from './ratingMedia';

/**
 * Rating feedback on the wire (Figma "Ratings" `1603:50`): a signed upload per file, PUT straight
 * to storage, then one rating that names them — with the chips, the note and "a different cook".
 */
function recordingApi() {
  const calls: { path: string; method?: string | undefined; body?: unknown }[] = [];
  let next = 0;
  const api: ApiClient = {
    async request(path, options) {
      calls.push({ path, method: options.method, body: options.body });
      if (path.endsWith('/rating/media')) {
        next += 1;
        return options.parse({
          mediaId: `media-${String(next)}`,
          kind: (options.body as { kind: string }).kind,
          upload: {
            method: 'PUT',
            url: `https://bucket.example/${String(next)}`,
            headers: { 'Content-Type': 'x', 'Content-Length': '1' },
            expiresAt: '2026-10-12T07:00:00.000Z',
          },
        });
      }
      return options.parse({
        ratingId: 'r1',
        bookingId: 'b1',
        cookId: 'c1',
        stars: 2.5,
        isFivePlus: false,
        exceptional: false,
        chips: ['slow'],
        avoidCook: true,
        media: [],
        created: true,
      });
    },
  };
  return { calls, service: createServiceApi(api) };
}

const PHOTO: RatingAttachment = {
  kind: 'photo',
  uri: 'file:///photo.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 1200,
  durationMs: null,
};
const VOICE: RatingAttachment = {
  kind: 'voice',
  uri: 'file:///note.m4a',
  mimeType: 'audio/mp4',
  sizeBytes: 900,
  durationMs: 9_400,
};

describe('rating media upload', () => {
  it('asks for one signed URL per file, PUTs each, and returns the ids in order', async () => {
    const { calls, service } = recordingApi();
    const puts: string[] = [];
    const ids = await uploadRatingAttachments(service, 'b1', [VOICE, PHOTO], async (url, uri) => {
      puts.push(`${url} ${uri}`);
    });
    expect(ids).toEqual(['media-1', 'media-2']);
    expect(puts).toEqual([
      'https://bucket.example/1 file:///note.m4a',
      'https://bucket.example/2 file:///photo.jpg',
    ]);
    expect(calls[0]).toEqual({
      path: '/v1/bookings/b1/rating/media',
      method: 'POST',
      body: { kind: 'voice', contentType: 'audio/mp4', sizeBytes: 900, durationMs: 9400 },
    });
    expect(calls[1]?.body).toEqual({ kind: 'photo', contentType: 'image/jpeg', sizeBytes: 1200 });
  });

  it('reuses what already landed on a retry instead of uploading it again', async () => {
    const { calls, service } = recordingApi();
    const landed = new Map<string, string>();
    const cache = {
      get: (uri: string) => landed.get(uri),
      set: (uri: string, id: string) => landed.set(uri, id),
    };
    await uploadRatingAttachments(service, 'b1', [PHOTO], async () => undefined, cache);
    const retry = await uploadRatingAttachments(
      service,
      'b1',
      [PHOTO],
      async () => undefined,
      cache,
    );
    expect(retry).toEqual(['media-1']);
    expect(calls).toHaveLength(1);
  });

  it('does not go on to the rating when a PUT fails', async () => {
    const { calls, service } = recordingApi();
    await expect(
      uploadRatingAttachments(service, 'b1', [PHOTO], async () => {
        throw new Error('HTTP 403');
      }),
    ).rejects.toThrow('HTTP 403');
    expect(calls.map((call) => call.path)).toEqual(['/v1/bookings/b1/rating/media']);
  });
});

describe('the rating call', () => {
  it('sends chips, a different cook and the media ids only when there are any', async () => {
    const { calls, service } = recordingApi();
    await service.rate(
      'b1',
      { stars: 2.5, chips: ['slow'], avoidCook: true, mediaIds: ['m1'], feedback: ' Salty ' },
      'scope',
    );
    await service.rate('b1', { stars: 4, chips: [], avoidCook: false, mediaIds: [] }, 'scope-2');
    expect(calls[0]?.body).toEqual({
      stars: 2.5,
      feedback: 'Salty',
      chips: ['slow'],
      avoidCook: true,
      mediaIds: ['m1'],
    });
    expect(calls[1]?.body).toEqual({ stars: 4 });
  });

  it('keys a retry of the same submission alike, and a changed one apart', () => {
    const base = { stars: 4.5, chips: ['taste'], attachments: [PHOTO] };
    expect(ratingSubmissionScope('b1', base)).toBe(ratingSubmissionScope('b1', { ...base }));
    expect(ratingSubmissionScope('b1', base)).not.toBe(
      ratingSubmissionScope('b1', { ...base, chips: ['taste', 'onTime'] }),
    );
    expect(ratingSubmissionScope('b1', base)).not.toBe(ratingSubmissionScope('b2', base));
  });
});

describe('content types', () => {
  it('keeps the picker’s own, else reads the extension the camera and recorder leave', () => {
    expect(ratingMimeTypeOf('file:///x.jpg', 'IMAGE/HEIC')).toBe('image/heic');
    expect(ratingMimeTypeOf('file:///Camera/clip.MOV')).toBe('video/quicktime');
    expect(ratingMimeTypeOf('file:///rec/note.m4a')).toBe('audio/mp4');
    expect(ratingMimeTypeOf('file:///unknown.bin')).toBeNull();
  });
});
