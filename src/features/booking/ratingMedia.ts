import { loadExpoFileSystem } from '@core/native';

import type { RatingMediaKind } from './api/schemas';
import type { ServiceApi } from './api/bookingApi';

/**
 * Photos, a video and a voice note on a rating — the rate card's Voice / Media / Write block
 * (Figma "Ratings" `1603:50`, M1–M5).
 *
 * The bytes never pass through the API: each file asks `POST …/rating/media` for a signed URL and
 * is PUT straight to object storage, then the rating names the ids it got back. A file the server
 * refuses (wrong type, too big, too long) fails the whole send, so the customer is never told a
 * photo went when it did not.
 */
export interface RatingAttachment {
  readonly kind: RatingMediaKind;
  /** A local `file://` URI from the camera, the recorder or the picker. */
  readonly uri: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  /** Video and voice only. */
  readonly durationMs: number | null;
}

/**
 * Whether this build can upload rating media at all — it needs the file system module, which a
 * build from before rating media does not have. Without it the card offers only words.
 */
export function canUploadRatingMedia(): boolean {
  return loadExpoFileSystem() !== null;
}

/** PUTs one local file to a signed URL. Injected so tests never touch the file system. */
export type RatingFileUploader = (
  url: string,
  fileUri: string,
  headers: Readonly<Record<string, string>>,
) => Promise<void>;

export const uploadFileToSignedUrl: RatingFileUploader = async (url, fileUri, headers) => {
  const fileSystem = loadExpoFileSystem();
  if (fileSystem === null) throw new Error('This build cannot upload files');
  const result = await fileSystem.uploadAsync(url, fileUri, {
    httpMethod: 'PUT',
    uploadType: fileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { ...headers },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Rating media upload failed with HTTP ${String(result.status)}`);
  }
};

/** Uploads every attachment in order and returns their media ids, in the same order. */
export async function uploadRatingAttachments(
  service: Pick<ServiceApi, 'requestRatingMedia'>,
  bookingId: string,
  attachments: readonly RatingAttachment[],
  upload: RatingFileUploader = uploadFileToSignedUrl,
  /** Files already uploaded for this booking — a retry reuses them. */
  cache?: {
    readonly get: (uri: string) => string | undefined;
    readonly set: (uri: string, mediaId: string) => void;
  },
): Promise<readonly string[]> {
  const mediaIds: string[] = [];
  for (const attachment of attachments) {
    const cached = cache?.get(attachment.uri);
    if (cached !== undefined) {
      mediaIds.push(cached);
      continue;
    }
    const signed = await service.requestRatingMedia(bookingId, {
      kind: attachment.kind,
      contentType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      durationMs: attachment.durationMs,
    });
    await upload(signed.upload.url, attachment.uri, signed.upload.headers);
    cache?.set(attachment.uri, signed.mediaId);
    mediaIds.push(signed.mediaId);
  }
  return mediaIds;
}

/** A local file's size in bytes, for the signed upload's Content-Length; `null` when unreadable. */
export async function localFileSize(uri: string): Promise<number | null> {
  const fileSystem = loadExpoFileSystem();
  if (fileSystem === null) return null;
  const info = await fileSystem.getInfoAsync(uri);
  return info.exists && typeof info.size === 'number' && info.size > 0 ? info.size : null;
}

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  mp3: 'audio/mpeg',
};

/**
 * The content type to declare: the picker's own when it gives one, else read off the extension —
 * the camera and the recorder hand back bare file URIs.
 */
export function ratingMimeTypeOf(uri: string, given?: string | null): string | null {
  if (given !== undefined && given !== null && given !== '') return given.toLowerCase();
  const extension = /\.([A-Za-z0-9]+)(?:\?.*)?$/u.exec(uri)?.[1]?.toLowerCase();
  return extension === undefined ? null : (MIME_BY_EXTENSION[extension] ?? null);
}
