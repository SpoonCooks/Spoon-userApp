import { Linking, Platform, StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { getConfig } from '@core/config';
import { getLogger } from '@core/logging';
import { Button, Icon, Text } from '@ui';
import { Dialog } from '@ui/overlays/Dialog';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { storeUrlsFor } from './storeUrl';
import { useAppUpdate } from './useAppUpdate';

/**
 * Wraps the app and puts the update popup over it when one is needed.
 *
 * ## Why an overlay and not a replacement
 *
 * The app underneath stays MOUNTED. Swapping the navigator out for a block screen would discard
 * the customer's place in the app (a half-filled booking, an open tracking screen) for a
 * requirement they cannot satisfy without leaving anyway; keeping it mounted means a customer who
 * updates and returns, or whose requirement is later relaxed in the console, is exactly where they
 * were.
 *
 * ## A popup, like every other dialog in the app
 *
 * It is the shared `Dialog`: a card centred over the app, which is dimmed by the same scrim the
 * other popups use. Nothing about it is bespoke except what makes it mandatory.
 *
 * ## The mandatory popup cannot be closed
 *
 * `onRequestClose` does nothing, which is what stops Android's back button; backdrop taps are
 * ignored; and the card has no close control. The only way off it is the store.
 */

const logger = getLogger('appUpdate');

const REQUIRED_TITLE = 'Update required';
const REQUIRED_BODY =
  'A new version of Spoon is available, and this one can no longer be used. Please update to continue.';
const OPTIONAL_TITLE = 'A new version is available';
const OPTIONAL_BODY = 'Update Spoon to get the latest improvements and fixes.';

async function openStore(): Promise<void> {
  const config = getConfig();
  const urls = storeUrlsFor({
    platform: Platform.OS,
    iosAppStoreId: config.iosAppStoreId,
  });

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // `market://` has no handler on a device without the Play Store app; the https URL is next.
    }
  }
  logger.warn('No store link could be opened for this build');
}

export function AppUpdateGate({ children }: PropsWithChildren) {
  const { requirement, message, dismiss } = useAppUpdate();
  const required = requirement === 'required';

  return (
    <>
      {children}
      <Dialog
        visible={requirement !== 'none'}
        // Deliberately inert for the mandatory popup: this IS the Android back-button trap.
        onClose={required ? () => undefined : dismiss}
        dismissOnBackdropPress={!required}
        testID={required ? 'app-update-required' : 'app-update-optional'}
      >
        <View style={styles.card} accessibilityRole="alert">
          <View style={styles.badge}>
            <Icon name="refresh" size={26} color="textPrimary" />
          </View>
          <Text variant="title" color="textPrimary" align="center" accessibilityRole="header">
            {required ? REQUIRED_TITLE : OPTIONAL_TITLE}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {required ? (message ?? REQUIRED_BODY) : OPTIONAL_BODY}
          </Text>
          <View style={styles.actions}>
            <Button
              label="Update"
              onPress={() => void openStore()}
              variant="primary"
              size="md"
              testID={required ? 'app-update-required-action' : 'app-update-optional-action'}
            />
            {required ? null : (
              <Button
                label="Not now"
                onPress={dismiss}
                variant="link"
                size="md"
                testID="app-update-optional-dismiss"
              />
            )}
          </View>
        </View>
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  /** Held near square on purpose: a narrow card, with the icon lending it height. */
  card: {
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
    alignItems: 'stretch',
    gap: lightTheme.space.sm,
    padding: lightTheme.space.xl,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surface,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: lightTheme.space.xs,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  actions: { gap: lightTheme.space.xs, paddingTop: lightTheme.space.sm },
});
