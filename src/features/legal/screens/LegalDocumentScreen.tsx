import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';

import { ScreenHeader, Text, lightTheme } from '@ui';

import type { LegalDocument } from '../documents';

/**
 * Terms of Service / Privacy Policy, rendered INSIDE the app.
 *
 * ## Why not `Linking.openURL`
 *
 * That is what Profile used to do, and it is the behaviour this replaces: it hands the customer
 * to Chrome or Safari, which loses the app's chrome, loses the back affordance that returns them
 * to Profile, and — with no legal URL published anywhere (see `documents.ts`) — had nothing to
 * open in the first place. A customer reading the terms they are being asked to accept should not
 * be ejected from the product to do it.
 *
 * ## Why a WebView rather than native text
 *
 * The documents are long-form legal copy with a fixed structure that HTML already expresses, and
 * they are replaced wholesale whenever Legal revises them. Rendering the markup keeps the
 * revision a content change rather than a component rewrite. See `documents.ts`.
 *
 * ## What this WebView is allowed to do
 *
 * As little as possible. The content is a local HTML string with no external CSS, fonts, scripts
 * or images, so nothing legitimate ever navigates. `onShouldStartLoadWithRequest` therefore
 * permits only the initial in-place load and hands `mailto:` to the OS — the documents carry the
 * grievance-officer address, and tapping it should open a mail client. Every other navigation is
 * REFUSED rather than followed: a document that could be made to navigate is a document that
 * could be made to render something other than the terms the customer thinks they are reading.
 *
 * JavaScript is off for the same reason. The page has none, so allowing it buys nothing.
 */

export interface LegalDocumentViewProps {
  readonly document: LegalDocument;
  readonly onBack: () => void;
  readonly testID?: string;
}

export function LegalDocumentView({
  document,
  onBack,
  testID = 'legal-document-screen',
}: LegalDocumentViewProps) {
  /**
   * The WebView paints white before its content lands, which on a dark-themed handset is a flash.
   * The spinner covers that gap and is removed on first load, not on a timer.
   */
  const [loading, setLoading] = useState(true);

  /**
   * The ONE navigation rule.
   *
   * `about:blank` and `data:` are how the platforms report an inline-HTML load — iOS uses the
   * former, Android the latter — so both are the document itself arriving and are allowed. A
   * `mailto:` is handed to the OS and refused here, so the WebView never leaves the document.
   * Anything else is refused outright.
   */
  const allowNavigation = (request: WebViewNavigation): boolean => {
    const url = request.url;
    if (url.startsWith('about:') || url.startsWith('data:')) return true;

    if (url.startsWith('mailto:')) {
      void Linking.openURL(url).catch(() => {
        // No mail client configured. The address is also printed as text in the document, so
        // there is nothing to recover and nothing worth interrupting the reader for.
      });
    }
    return false;
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      {/* The same `63:783` header every other secondary screen draws, inside the 16pt gutter. */}
      <View style={styles.headerColumn}>
        <ScreenHeader title={document.title} onBack={onBack} testID="legal-document-header" />
      </View>

      <View style={styles.body}>
        <WebView
          originWhitelist={['about:*', 'data:*']}
          source={{ html: document.html }}
          onShouldStartLoadWithRequest={allowNavigation}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={false}
          // The page sets its own ground per colour scheme; a transparent WebView would show the
          // native screen through it while the content is still parsing.
          style={styles.webview}
          // Android draws a white flash on first paint without this.
          setSupportMultipleWindows={false}
          testID="legal-document-webview"
        />

        {!loading ? null : (
          <View style={styles.loading} testID="legal-document-loading">
            <ActivityIndicator />
            <Text variant="body" color="textSecondary">
              Loading
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  /** `6:664` — the header sits at x 16 / y 16 inside the gutter column, like every other screen. */
  headerColumn: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  body: { flex: 1, marginTop: lightTheme.space.md },
  webview: { flex: 1, backgroundColor: lightTheme.colors.surface },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.sm,
    backgroundColor: lightTheme.colors.surface,
  },
});
