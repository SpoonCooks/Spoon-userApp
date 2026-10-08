import { Linking, Modal, Platform, StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getConfig } from '@core/config';
import { getLogger } from '@core/logging';
import { Button, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { storeUrlsFor } from './storeUrl';
import { useAppUpdate } from './useAppUpdate';

/**
 * Wraps the app and puts the update screen over it when one is needed.
 *
 * ## Why an overlay and not a replacement
 *
 * The app underneath stays MOUNTED. Swapping the navigator out for a block screen would discard
 * the customer's place in the app (a half-filled booking, an open tracking screen) for a
 * requirement they cannot satisfy without leaving anyway; keeping it mounted means a customer who
 * updates and returns, or whose requirement is later relaxed in the console, is exactly where they
 * were.
 *
 * ## The mandatory screen cannot be closed
 *
 * It is a native modal whose `onRequestClose` does nothing, which is what stops Android's back
 * button; it has no close control and no backdrop to tap. The only way off it is the store.
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
    androidPackage: config.androidPackage,
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
      <Modal
        visible={requirement !== 'none'}
        transparent={!required}
        animationType="fade"
        statusBarTranslucent
        // Deliberately inert for the mandatory screen: this IS the Android back-button trap.
        onRequestClose={required ? () => undefined : dismiss}
        testID="app-update-modal"
      >
        {required ? (
          <SafeAreaView
            style={styles.required}
            accessibilityViewIsModal
            testID="app-update-required"
          >
            <View style={styles.requiredBody}>
              <Text variant="title" color="textPrimary" align="center" accessibilityRole="header">
                {REQUIRED_TITLE}
              </Text>
              <Text variant="body" color="textSecondary" align="center">
                {message ?? REQUIRED_BODY}
              </Text>
            </View>
            <View style={styles.requiredFooter}>
              <Button
                label="Update"
                onPress={() => void openStore()}
                variant="primary"
                size="lg"
                testID="app-update-required-action"
              />
            </View>
          </SafeAreaView>
        ) : (
          <View style={styles.optionalScrim} accessibilityViewIsModal testID="app-update-optional">
            <View style={styles.optionalCard}>
              <Text variant="title" color="textPrimary" align="center" accessibilityRole="header">
                {OPTIONAL_TITLE}
              </Text>
              <Text variant="body" color="textSecondary" align="center">
                {OPTIONAL_BODY}
              </Text>
              <Button
                label="Update"
                onPress={() => void openStore()}
                variant="primary"
                size="md"
                testID="app-update-optional-action"
              />
              <Button
                label="Not now"
                onPress={dismiss}
                variant="link"
                size="md"
                testID="app-update-optional-dismiss"
              />
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  required: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
    padding: lightTheme.space.lg,
  },
  requiredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.sm,
  },
  requiredFooter: { paddingBottom: lightTheme.space.md },
  optionalScrim: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.scrim,
    paddingHorizontal: lightTheme.space.xl,
  },
  optionalCard: {
    gap: lightTheme.space.sm,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.lg,
    backgroundColor: lightTheme.colors.surface,
  },
});
