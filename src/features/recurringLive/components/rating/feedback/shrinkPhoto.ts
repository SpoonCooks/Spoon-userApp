import { loadExpoImageManipulator } from '@core/native';
import { localFileSize } from '@features/booking';

/** A rating photo keeps at most this many pixels on its longest side — plenty on a phone. */
export const PHOTO_LONG_EDGE = 1600;
/** JPEG quality of the shrunk photo. */
export const PHOTO_COMPRESS = 0.7;

export interface ShrunkPhoto {
  readonly uri: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}

/** The size a photo is resized to: its longest side brought down to `longEdge`, never up. */
export function shrunkSize(
  width: number,
  height: number,
  longEdge = PHOTO_LONG_EDGE,
): { readonly width: number; readonly height: number } | null {
  const longest = Math.max(width, height);
  if (longest <= longEdge || width <= 0 || height <= 0) return null;
  const scale = longEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Brings a camera or gallery photo down to an upload-sized JPEG (about 300 KB instead of the
 * 3–5 MB a 12 MP phone camera leaves): longest side {@link PHOTO_LONG_EDGE}, quality
 * {@link PHOTO_COMPRESS}. It reads the size after the photo's own rotation is applied, so a
 * portrait shot is not squashed.
 *
 * Returns `null` on a build without the manipulator, or if shrinking fails — the caller then keeps
 * the original, which the upload limits still allow.
 */
export async function shrinkPhoto(uri: string): Promise<ShrunkPhoto | null> {
  const manipulator = loadExpoImageManipulator();
  if (manipulator === null) return null;
  try {
    const context = manipulator.ImageManipulator.manipulate(uri);
    const original = await context.renderAsync();
    const size = shrunkSize(original.width, original.height);
    const image = size === null ? original : await context.resize(size).renderAsync();
    const saved = await image.saveAsync({
      compress: PHOTO_COMPRESS,
      format: manipulator.SaveFormat.JPEG,
    });
    const sizeBytes = await localFileSize(saved.uri);
    if (sizeBytes === null) return null;
    return { uri: saved.uri, mimeType: 'image/jpeg', sizeBytes };
  } catch {
    return null;
  }
}
