import { Alert } from 'react-native';
import { loadExpoImagePicker } from '@core/native';
import { localFileSize, ratingMimeTypeOf } from '@features/booking';

import { MAX_VIDEO_MS } from './model';
import type { FeedbackMediaItem } from './model';

/**
 * M1's Gallery: the system picker (no library permission on iOS 14+ or Android 13+), limited to
 * what the rating still has room for — the photos left of five, and one video of up to 30 s.
 * Anything past those limits is left out and the customer is told why.
 */
export async function pickFromGallery(
  photosLeft: number,
  videoAllowed: boolean,
): Promise<readonly FeedbackMediaItem[]> {
  const picker = loadExpoImagePicker();
  const limit = Math.max(0, photosLeft) + (videoAllowed ? 1 : 0);
  if (picker === null || limit === 0) return [];
  const result = await picker.launchImageLibraryAsync({
    mediaTypes:
      videoAllowed && photosLeft > 0
        ? ['images', 'videos']
        : videoAllowed
          ? ['videos']
          : ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.8,
    videoMaxDuration: MAX_VIDEO_MS / 1000,
  });
  if (result.canceled) return [];

  const items: FeedbackMediaItem[] = [];
  let photos = 0;
  let videos = 0;
  let skipped = false;
  for (const asset of result.assets) {
    const video = asset.type === 'video';
    const durationMs = video ? (asset.duration ?? null) : null;
    if (
      (video && (!videoAllowed || videos >= 1 || (durationMs ?? 0) > MAX_VIDEO_MS + 1000)) ||
      (!video && photos >= photosLeft)
    ) {
      skipped = true;
      continue;
    }
    const mimeType = ratingMimeTypeOf(asset.uri, asset.mimeType);
    const sizeBytes = asset.fileSize ?? (await localFileSize(asset.uri));
    if (mimeType === null || sizeBytes === null) {
      skipped = true;
      continue;
    }
    if (video) videos += 1;
    else photos += 1;
    items.push({
      id: `${video ? 'video' : 'photo'}-${asset.assetId ?? asset.uri}`,
      kind: video ? 'video' : 'photo',
      uri: asset.uri,
      mimeType,
      sizeBytes,
      durationMs: durationMs === null ? null : Math.round(durationMs),
    });
  }
  if (skipped) {
    Alert.alert(
      'Some items weren’t added',
      'A rating can carry up to 5 photos and one video of up to 30 seconds.',
    );
  }
  return items;
}
