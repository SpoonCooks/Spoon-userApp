/**
 * Feature: app update.
 *
 * Decides from Firebase Remote Config whether this build must be updated (a blocking screen) or
 * may be (a dismissible prompt). See `AppUpdateGate`.
 */
export { AppUpdateGate } from './AppUpdateGate';
export { compareVersions, decideUpdate, parseVersion } from './version';
export type { UpdateRequirement } from './version';
