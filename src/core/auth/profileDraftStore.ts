import * as SecureStore from 'expo-secure-store';

/**
 * The taste-profile wizard's unsaved answers, kept per customer on this device (dev note
 * `2505:4916`: "persist locally on every change… restore the draft if the user returns
 * mid-flow"). The profile feature owns the shape; this module only stores the string, like
 * `triedPlaceStore`.
 *
 * Keyed by user id, so one device's customers never see each other's answers. Removed once the
 * profile is saved.
 */
const keyFor = (userId: string) => `spoon.profile.draft.${userId.replace(/[^\w.-]/g, '_')}`;

export async function readProfileDraft(userId: string): Promise<string | null> {
  return SecureStore.getItemAsync(keyFor(userId));
}

export async function writeProfileDraft(userId: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(keyFor(userId), value);
}

export async function clearProfileDraft(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(keyFor(userId));
}
