import { requireOptionalNativeModule } from 'expo';
import type * as ExpoVideoModule from 'expo-video';

/**
 * `expo-video`, if this build has it. The package needs its native module, which only a build made
 * AFTER the dependency was added contains. On an older build (an installed dev client, a store
 * build from before) importing the package throws, and in development that is a red screen — so
 * the native module is looked up FIRST, without importing anything, and the package is loaded
 * only when it is there. A build without it gets `null`, and the explainer plays its placeholder
 * instead of failing the page. Looked up once.
 */
export type ExpoVideo = typeof ExpoVideoModule;

/** The name `expo-video` registers its native module under. */
const NATIVE_MODULE = 'ExpoVideo';

let loaded: ExpoVideo | null | undefined;

export function loadExpoVideo(): ExpoVideo | null {
  if (loaded !== undefined) return loaded;
  if (requireOptionalNativeModule(NATIVE_MODULE) === null) {
    loaded = null;
    return loaded;
  }
  try {
    // On demand on purpose (see above): a static import would load the package on every build.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require('expo-video') as ExpoVideo;
  } catch {
    loaded = null;
  }
  return loaded;
}
