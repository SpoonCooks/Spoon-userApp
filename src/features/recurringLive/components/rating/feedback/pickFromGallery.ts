import { Alert } from 'react-native';
import { loadExpoImagePicker } from '@core/native';
import { localFileSize, ratingMimeTypeOf } from '@features/booking';

import { compressGalleryVideo } from './compressVideo';
import { MAX_MEDIA_BYTES, MAX_VIDEO_MS, galleryVideoProblem } from './model';
import type { FeedbackMediaItem } from './model';
import { shrinkPhoto } from './shrinkPhoto';

/**
 * M1's Gallery: the system picker (no library permission on iOS 14+ or Android 13+), limited to
 * what the rating still has room for — the photos left of five, and one video of up to 30 s.
 * Anything past those limits is left out and the customer is told why.
 *
 * Photos are shrunk like the camera's. A video is brought down to 960 px H.264: on iPhone by the
 * picker itself, on Android by {@link compressGalleryVideo} — which takes a few seconds, so
 * `onPreparing` reports it for the card to show. One that can't be compressed is turned away.
 */
export async function pickFromGallery(
  photosLeft: number,
  videoAllowed: boolean,
  onPreparing?: (preparing: boolean) => void,
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
    videoExportPreset: picker.VideoExportPreset.H264_960x540,
  });
  if (result.canceled) return [];

  const items: FeedbackMediaItem[] = [];
  let photos = 0;
  let videos = 0;
  let skipped = false;
  let tooLong = false;
  let unknownLength = false;
  let compressFailed = false;
  let tooLarge = false;
  for (const asset of result.assets) {
    const video = asset.type === 'video';
    const durationMs = video ? (asset.duration ?? null) : null;
    if ((video && (!videoAllowed || videos >= 1)) || (!video && photos >= photosLeft)) {
      skipped = true;
      continue;
    }
    const problem = video ? galleryVideoProblem(durationMs) : null;
    if (problem !== null) {
      if (problem === 'tooLong') tooLong = true;
      else unknownLength = true;
      continue;
    }
    let shrunk: { uri: string; mimeType: string; sizeBytes: number } | null = null;
    if (video) {
      onPreparing?.(true);
      const compressed = await compressGalleryVideo(asset.uri).finally(() => onPreparing?.(false));
      if (compressed === 'failed') {
        compressFailed = true;
        continue;
      }
      shrunk = compressed;
    } else {
      shrunk = await shrinkPhoto(asset.uri);
    }
    const uri = shrunk?.uri ?? asset.uri;
    const mimeType = shrunk?.mimeType ?? ratingMimeTypeOf(asset.uri, asset.mimeType);
    // The file on disk, not the library's figure: an iPhone video was re-encoded on the way out.
    const sizeBytes = shrunk?.sizeBytes ?? (await localFileSize(uri)) ?? asset.fileSize ?? null;
    if (mimeType === null || sizeBytes === null) {
      skipped = true;
      continue;
    }
    if (sizeBytes > MAX_MEDIA_BYTES[video ? 'video' : 'photo']) {
      tooLarge = true;
      continue;
    }
    if (video) videos += 1;
    else photos += 1;
    items.push({
      id: `${video ? 'video' : 'photo'}-${asset.assetId ?? asset.uri}`,
      kind: video ? 'video' : 'photo',
      uri,
      mimeType,
      sizeBytes,
      durationMs: durationMs === null ? null : Math.round(durationMs),
    });
  }
  if (tooLong) {
    Alert.alert(
      'That video is longer than 30 seconds',
      'Pick a video of up to 30 seconds, or record one with the camera.',
    );
  } else if (compressFailed) {
    Alert.alert(
      'Couldn’t prepare that video',
      'Please pick another video, or record one with the camera.',
    );
  } else if (tooLarge) {
    Alert.alert(
      'That file is too large',
      'Please pick a smaller photo or video, or take one with the camera.',
    );
  } else if (unknownLength) {
    Alert.alert(
      'Couldn’t read that video’s length',
      'Please pick another video, or record one with the camera.',
    );
  } else if (skipped) {
    Alert.alert(
      'Some items weren’t added',
      'A rating can carry up to 5 photos and one video of up to 30 seconds.',
    );
  }
  return items;
}
