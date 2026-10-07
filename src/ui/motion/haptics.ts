import type * as HapticsApi from 'expo-haptics';

/**
 * A light haptic tick, best effort.
 *
 * `expo-haptics` is a native module: a dev client built before it was added has no `ExpoHaptics`,
 * and importing the package there throws at load — taking the importing screen with it. So it is
 * required lazily, once, and a missing module (or a device with nothing to play) is silently a
 * no-op. A fresh build carries the module and plays the tick.
 */
type HapticsModule = typeof HapticsApi;

let haptics: HapticsModule | null | undefined;

function load(): HapticsModule | null {
  if (haptics === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      haptics = require('expo-haptics') as HapticsModule;
    } catch {
      haptics = null;
    }
  }
  return haptics;
}

export function lightTick(): void {
  const module = load();
  if (module === null) return;
  module.impactAsync(module.ImpactFeedbackStyle.Light).catch(() => undefined);
}
