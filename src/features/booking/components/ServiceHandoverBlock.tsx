import { StyleSheet, View } from 'react-native';

import { Button, OtpDisplay, lightTheme } from '@ui';
import type { OtpTone } from '@ui';

/**
 * The service handover — Figma `21:1091` (Arrived, "Start Service") and `101:1893` (In service,
 * "End Service"). Structurally one block drawn twice in two hues.
 *
 * The CTA is NOT stacked above the OTP panel: `21:1106` is absolutely positioned so the 254 × 40
 * pill straddles the panel's top edge, overlapping it by 21pt. The panel itself carries 20pt of
 * clear space above it for exactly that reason, and the whole block sits inside 6pt of vertical
 * padding. Rendering the two as ordinary siblings — which the previous implementation did —
 * loses the overlap and the block reads 40pt taller than the frame.
 *
 * BOUNDARY: pressing the CTA reports the user's intent. It does not start, end or advance the
 * booking, and the OTP below it is displayed for the user to read out — never verified here
 * (FRONTEND_FOUNDATION_PLAN.md §18, §19).
 */
export interface ServiceHandoverBlockProps {
  readonly ctaLabel: string;
  readonly onPress: () => void;
  readonly otpCode: string;
  readonly otpTitle: string;
  readonly otpCaption: string;
  /** `start` — Arrived, lime. `end` — In service, yellow. */
  readonly tone: OtpTone;
  readonly testID?: string;
}

export function ServiceHandoverBlock({
  ctaLabel,
  onPress,
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

      {/* `21:1106` — the pill straddles the panel's top edge; `pointerEvents` stays default so it
          remains tappable over the panel. */}
      <View style={styles.ctaSlot} pointerEvents="box-none">
        <Button
          label={ctaLabel}
          onPress={onPress}
          variant={tone === 'start' ? 'bright' : 'primary'}
          size="pill"
          fullWidth={false}
          testID={`${testID}-cta`}
        />
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
});
