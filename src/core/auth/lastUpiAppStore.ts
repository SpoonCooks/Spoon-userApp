import * as SecureStore from 'expo-secure-store';

/**
 * The UPI app this customer last set up Autopay with, on this device ("Last used", Figma
 * 2316:3597). Written when a mandate becomes active, read when the list opens. Keyed by user id
 * like `triedPlaceStore`, so one device's customers never see each other's choice. A failed read
 * or write only loses the tag.
 */
const keyFor = (userId: string) => `spoon.autopay.lastUpiApp.${userId.replace(/[^\w.-]/g, '_')}`;

export async function readLastUpiApp(userId: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(keyFor(userId));
  } catch {
    return null;
  }
}

export async function writeLastUpiApp(userId: string, appId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(keyFor(userId), appId);
  } catch {
    // Only the tag is lost.
  }
}
