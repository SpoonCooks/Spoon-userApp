import { requireOptionalNativeModule } from 'expo';
import { TurboModuleRegistry } from 'react-native';

import type * as ExpoAudio from 'expo-audio';
import type * as ExpoCamera from 'expo-camera';
import type * as ExpoFileSystemLegacy from 'expo-file-system/legacy';
import type * as ExpoImageManipulator from 'expo-image-manipulator';
import type * as ExpoImagePicker from 'expo-image-picker';
import type * as ExpoVideo from 'expo-video';
import type * as Compressor from 'react-native-compressor';

/**
 * Native packages that a build made BEFORE they were added does not contain.
 *
 * Importing such a package on an older build (an installed dev client, a store build from before)
 * throws when it reaches for its native module — a red screen in development, a crash in a
 * release. So the native module is looked up FIRST, without importing anything, and the package is
 * loaded only when it is there; otherwise the caller gets `null` and leaves the feature out. Each
 * is looked up once. (The same reasoning as `recurringLanding/expoVideo.ts`, shared here for the
 * rate card's voice note, camera, gallery and uploads.)
 */
function optional<T>(nativeName: string, load: () => T): () => T | null {
  return optionalWhen(() => requireOptionalNativeModule(nativeName) !== null, load);
}

function optionalWhen<T>(linked: () => boolean, load: () => T): () => T | null {
  let loaded: T | null | undefined;
  return () => {
    if (loaded !== undefined) return loaded;
    if (!linked()) {
      loaded = null;
      return loaded;
    }
    try {
      loaded = load();
    } catch {
      loaded = null;
    }
    return loaded;
  };
}

/* eslint-disable @typescript-eslint/no-require-imports -- on demand on purpose, see above */
export const loadExpoAudio = optional('ExpoAudio', () => require('expo-audio') as typeof ExpoAudio);
export const loadExpoCamera = optional(
  'ExpoCamera',
  () => require('expo-camera') as typeof ExpoCamera,
);
export const loadExpoImagePicker = optional(
  'ExponentImagePicker',
  () => require('expo-image-picker') as typeof ExpoImagePicker,
);
export const loadExpoImageManipulator = optional(
  'ExpoImageManipulator',
  () => require('expo-image-manipulator') as typeof ExpoImageManipulator,
);
export const loadExpoFileSystem = optional(
  'ExponentFileSystem',
  () => require('expo-file-system/legacy') as typeof ExpoFileSystemLegacy,
);
export const loadExpoVideo = optional('ExpoVideo', () => require('expo-video') as typeof ExpoVideo);
/**
 * `react-native-compressor`'s video side. It is a Nitro module, not an Expo one, so the build is
 * checked for Nitro's own TurboModule instead; the package throws on import without it.
 */
export const loadVideoCompressor = optionalWhen(
  () => TurboModuleRegistry.get('NitroModules') !== null,
  () => (require('react-native-compressor') as typeof Compressor).Video,
);
/* eslint-enable @typescript-eslint/no-require-imports */
