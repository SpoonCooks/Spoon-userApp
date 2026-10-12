import { Platform } from 'react-native';
import { loadVideoCompressor } from '@core/native';
import { localFileSize } from '@features/booking';

/** A gallery video is brought down to this many pixels on its longest side (960×540 for 16:9). */
export const VIDEO_MAX_EDGE = 960;
/** …at this bitrate: a 30 s clip comes to about 5–6 MB. */
export const VIDEO_COMPRESS_BITRATE = 1_500_000;

export interface CompressedVideo {
  readonly uri: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}

/**
 * Re-encodes a video picked from the Android gallery to 960 px / 1.5 Mbps H.264 `.mp4` — what the
 * iPhone's picker already does itself (`videoExportPreset`), and close to what the camera records.
 *
 *   - `null`: nothing to do — on iPhone, or on a build without the compressor; the video goes as
 *     it is, still held to 30 s and the server's size limit
 *   - `'failed'`: the compressor could not read or encode it; the caller turns the video away
 *     rather than upload a phone's full-size original
 */
export async function compressGalleryVideo(
  uri: string,
): Promise<CompressedVideo | 'failed' | null> {
  if (Platform.OS !== 'android') return null;
  const compressor = loadVideoCompressor();
  if (compressor === null) return null;
  try {
    const output = await compressor.compress(uri, {
      compressionMethod: 'manual',
      maxSize: VIDEO_MAX_EDGE,
      bitrate: VIDEO_COMPRESS_BITRATE,
    });
    const sizeBytes = await localFileSize(output);
    if (sizeBytes === null) return 'failed';
    return { uri: output, mimeType: 'video/mp4', sizeBytes };
  } catch {
    return 'failed';
  }
}
