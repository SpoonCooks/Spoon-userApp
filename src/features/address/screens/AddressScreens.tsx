import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import { ADDRESS_OUT_OF_SERVICE_ART, QueryBoundary, ScreenHeader, Text, lightTheme } from '@ui';

import type { AddressOutOfServiceViewModel } from '../types';

/**
 * Address out of service — Figma `215:1472`.
 *
 * The rest of the address flow (saved list, map, search, details form) is the redesign in
 * `../v2` — Figma `1870:2379` onwards. This screen is unchanged by it: the redesign keeps today's
 * Confirm-time serviceability check, and `outside_service_area` still lands here.
 */

/* --------------------------------------------------- out of service (215:1472) */

export interface AddressOutOfServiceViewProps {
  readonly state: DataState<AddressOutOfServiceViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
}

/**
 * `215:1472` "Page 3c- Address out of service".
 *
 * PRODUCT_DESIGN_CONFLICT with ruling R-4 — see `AddressOutOfServiceViewModel`. Built as drawn.
 *
 * REBUILT in pass 8. The superseded file opened this screen with a 45pt banner (`218:1536`)
 * carrying the rejected address and the account avatar. `sbIXeBfaMzUFUz2NYJIJTm` replaces that
 * whole band with `275:5179` — a plain instance of the shared `63:783` header — titled "Choose
 * another location". The address pair and the avatar are GONE from the frame, so they are gone
 * from the view model too rather than being rendered where the design draws nothing.
 *
 * `221:1553` is px 16 / pt 16 / pb 80 with a **50pt** gap under the header; `275:5707` then holds
 * the 215pt `#FFEF99` disc 21pt clear of the copy block.
 *
 * DEVIATION: `219:1551` carries an INNER shadow (`-2 2 4 rgba(0,0,0,0.15)`). Figma clips an inner
 * shadow to the layer's alpha; React Native clips `boxShadow: inset` to the view BOX, so applying
 * it to this transparent PNG would draw a rectangle the frame does not show. Omitted deliberately.
 */
export function AddressOutOfServiceView({ state, onRetry, onBack }: AddressOutOfServiceViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <QueryBoundary state={state} onRetry={onRetry} loadingVariant="screen">
        {(view) => (
          <View style={styles.oosBody} testID="address-out-of-service-screen">
            <ScreenHeader title={view.headerTitle} onBack={onBack} testID="address-header" />

            {/* `275:5707` — the disc 21pt clear of the copy. */}
            <View style={styles.oosContent}>
              <View style={styles.oosDisc}>
                <Image
                  source={ADDRESS_OUT_OF_SERVICE_ART}
                  style={styles.oosArt}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>

              <View style={styles.oosCopy}>
                <Text variant="headingOutcome" color="textPrimary" align="center">
                  {view.title}
                </Text>
                <Text variant="captionStrong" color="textPrimary" align="center">
                  {view.message}
                </Text>
              </View>
            </View>
          </View>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },

  /* ---- `215:1472` address out of service ---- */
  /** `221:1553` — px 16 / pt 16 / pb 80, with a 50pt gap between the header and the content. */
  oosBody: {
    flex: 1,
    gap: 50,
    paddingTop: lightTheme.space.lg,
    paddingBottom: 80,
    paddingHorizontal: lightTheme.space.lg,
  },
  /** `275:5707` — the disc and the copy block, centred, 21pt apart. */
  oosContent: { alignItems: 'center', gap: 21 },
  /**
   * `222:1557` — a plain `#FFEF99` 215pt circle in the node, so it is drawn, not exported.
   * `222:1558` lifts it on `0 0 2 rgba(0,0,0,0.07)`.
   */
  oosDisc: {
    width: 215,
    height: 215,
    borderRadius: 107.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    ...lightTheme.elevation.disc,
  },
  /** `219:1551` — 150 x 125, with the frame's own crop baked into the export. */
  oosArt: { width: 150, height: 125 },
  /**
   * `221:1556` — px 15 / py 10, 10pt between the headline and the line.
   *
   * `221:1555`'s 307 is DERIVED (338 column − 2 × 15.5), not an independent measure: the block is
   * `w-full`, so it stretches with the column rather than clamping at 307.
   */
  oosCopy: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: lightTheme.space.xs + 6,
    paddingHorizontal: 15,
    paddingVertical: lightTheme.space.xs + 6,
  },
});
