import { StyleSheet, View } from 'react-native';

import { OtpDisplay, Text, lightTheme } from '@ui';
import type { OtpTone } from '@ui';

/**
 * The service handover — Figma `21:1091` (Arrived, "Start Service") and `101:1893` (In service,
 * "End Service"). Structurally one block drawn twice in two hues.
 *
 * The pill is NOT stacked above the OTP panel: `21:1106` is absolutely positioned so the 254 × 40
 * pill straddles the panel's top edge, overlapping it by 21pt. The panel itself carries 20pt of
 * clear space above it for exactly that reason, and the whole block sits inside 6pt of vertical
 * padding. Rendering the two as ordinary siblings — which the previous implementation did —
 * loses the overlap and the block reads 40pt taller than the frame.
 *
 * BOUNDARY: starting and ending a service are the COOK's actions, made on the cook's own device —
 * this pill exists to LABEL the OTP panel beneath it ("here is the code to start service" / "...to
 * end it"), not to trigger anything here. It is deliberately NOT a button: a `Pressable` that
 * looked identical to every other CTA in the app but silently did nothing on press read as broken
 * rather than as a label, so it renders as plain text on a coloured pill instead.
 */
export interface ServiceHandoverBlockProps {
  readonly ctaLabel: string;
  readonly otpCode: string;
  readonly otpTitle: string;
  readonly otpCaption: string;
  /** `start` — Arrived, lime. `end` — In service, yellow. */
  readonly tone: OtpTone;
  readonly testID?: string;
}

export function ServiceHandoverBlock({
  ctaLabel,
  otpCode,
  otpTitle,
  otpCaption,
  tone,
  testID = 'service-handover',
}: ServiceHandoverBlockProps) {
  return (
    <View style={styles.block} testID={testID}>
      <View style={styles.panelSlot}>
        <OtpDisplay
          code={otpCode}
          title={otpTitle}
          caption={otpCaption}
          tone={tone}
          testID={`${testID}-otp`}
        />
      </View>

      {/* `21:1106` — the pill straddles the panel's top edge. A label, not a control: no
          Pressable, no accessibilityRole="button", nothing to press. */}
      <View style={styles.ctaSlot} pointerEvents="none">
        <View
          style={[styles.pill, tone === 'start' ? styles.pillStart : styles.pillEnd]}
          testID={`${testID}-cta`}
        >
          <Text variant="titleLead" color="textOnAccent" numberOfLines={1}>
            {ctaLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `21:1091` — 6pt of vertical padding around the whole handover. */
  block: { alignSelf: 'stretch', paddingVertical: lightTheme.space.s6 },
  /** `21:1092` — 20pt of clear space above the panel, 6pt below it. */
  panelSlot: {
    paddingTop: 20,
    paddingBottom: lightTheme.space.s6,
  },
  /** `21:1106` — top 1 relative to the block, horizontally centred. */
  ctaSlot: {
    position: 'absolute',
    top: 1,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  /**
   * `21:1107` / `101:1909` — the SAME 254 × 40 pill geometry `Button`'s `pill` size draws, so this
   * reads as the identical control the rest of the app uses elsewhere, right down to the "primary"
   * variant's lift — only the interactivity is gone.
   */
  pill: {
    width: 254,
    maxWidth: '100%',
    height: 40,
    borderRadius: lightTheme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `bright` — Arrived, lime. No lift in the file. */
  pillStart: { backgroundColor: lightTheme.colors.surfacePositiveBright },
  /** `primary` — In service, yellow, with the same lift every other primary CTA carries. */
  pillEnd: { backgroundColor: lightTheme.colors.surfaceCta, ...lightTheme.elevation.cta },
});
