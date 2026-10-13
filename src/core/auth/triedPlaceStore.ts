import * as SecureStore from 'expo-secure-store';

/**
 * The last place this customer was refused at (Not serviceable, `2214:4260`), kept per customer
 * on this device so a customer with no saved address lands on Home's inactive-pincode variant for
 * it on every launch (`1302:3539`) instead of being sent back to the map. The address feature owns
 * the shape; this module only stores the string, like `lastPhoneStore`.
 *
 * Keyed by user id, so one device's customers never see each other's place. Nothing personal is
 * in it beyond what the customer typed on the map.
 */
const keyFor = (userId: string) => `spoon.address.triedPlace.${userId.replace(/[^\w.-]/g, '_')}`;

export async function readTriedPlace(userId: string): Promise<string | null> {
  return SecureStore.getItemAsync(keyFor(userId));
}

export async function writeTriedPlace(userId: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(keyFor(userId), value);
}
