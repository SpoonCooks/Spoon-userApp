import { StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The service-handover OTP panel — Figma `21:1092` (Arrived, "Start OTP") and `101:1894`
 * (In service, "End OTP"). The two frames are the SAME geometry in two hues, which is why this is
 * one component with a `tone` rather than two panels.
 *
 * Geometry, verbatim from `21:1105` / `101:1905`: a 112pt panel at a 12pt radius carrying
 * `0 0 4 rgba(0,0,0,0.15)`. Copy is inset 26pt from the left; the three digit tiles start at
 * x = 194 and end 16pt from the right edge, each 31 × 44 at an 8pt radius with a Livvic Black
 * 16/24 numeral. Title is Livvic Bold 16/24, caption 10/15, 4pt apart, both centred on the panel.
 *
 * Tones: `start` — panel `lime300` @30%, digits `#CFFF04` (`21:1095`).
 *        `end`   — panel `yellow300` @30%, digits `#FFE666` (`101:1897`).
 *
 * TODO(designer, defect D-21): the caption is the ONLY string in the booking lifecycle set in
 * Inter (`font family/Font 2`) rather than Livvic — on both `21:1103` and `101:1906`. Treated as
 * copy-paste residue and rendered in Livvic Regular 10/15, since Inter is not a bundled face and
 * a second family for one caption would read as a bug. Raised with design.
 *
 * SECURITY: the digits are rendered and nothing else. This component never logs them, never
 * copies them to the clipboard and never sends them anywhere. The Phase-1 logger additionally
 * redacts any key matching `otp` if one ever reaches a log call
 * (FRONTEND_FOUNDATION_PLAN.md §12).
 *
 * NOTE: this is the SERVICE OTP, not the login OTP. The login OTP entry screen does not exist in
 * Figma and must not be invented (blocker B-7) — this component is not it.
 */

export type OtpTone = 'start' | 'end';

export interface OtpDisplayProps {
  /** Server-generated digits. Never generated, never verified and never advanced on the client. */
  readonly code: string;
  readonly title?: string;
  readonly caption?: string;
  readonly tone?: OtpTone;
  readonly testID?: string;
}

const PANEL_SURFACE: Record<OtpTone, string> = {
  start: lightTheme.colors.surfaceOtpStart,
  end: lightTheme.colors.surfaceOtpEnd,
};

const DIGIT_SURFACE: Record<OtpTone, string> = {
  start: lightTheme.colors.surfacePositiveBright,
  end: lightTheme.colors.surfaceAccentBold,
};

export function OtpDisplay({
  code,
  title,
  caption,
  tone = 'start',
  testID = 'otp-display',
}: OtpDisplayProps) {
  const digits = code.split('');

  return (
    <View style={[styles.panel, { backgroundColor: PANEL_SURFACE[tone] }]} testID={testID}>
      <View style={styles.text}>
        {title === undefined ? null : (
          <Text variant="headingBold" color="textPrimary" numberOfLines={1}>
            {title}
          </Text>
        )}
        {caption === undefined ? null : (
          <Text variant="caption" color="textPrimary" numberOfLines={1}>
            {caption}
          </Text>
        )}
      </View>

      <View
        style={styles.digits}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${title ?? 'Code'} ${digits.join(' ')}`}
      >
        {digits.map((digit, index) => (
          <View
            key={`${digit}-${index}`}
            style={[styles.digit, { backgroundColor: DIGIT_SURFACE[tone] }]}
          >
            <Text variant="headingCta" color="textPrimary" align="center">
              {digit}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `21:1105` — 112pt tall, 12pt radius, `0 0 4 rgba(0,0,0,0.15)`, copy 26pt in, digits 16pt out. */
  panel: {
    alignSelf: 'stretch',
    height: 112,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 26,
    paddingRight: lightTheme.space.lg,
    borderRadius: lightTheme.radius.r12,
    ...lightTheme.elevation.tile,
  },
  /** `21:1104` → `21:1103`: the two lines sit 4pt apart, centred on the panel. */
  text: { flexShrink: 1, gap: lightTheme.space.xs },
  /** `21:1093` — a 128pt group: three 31pt tiles at a 17.5pt gutter. */
  digits: { flexDirection: 'row', gap: 17.5 },
  /** `21:1095` — 31 × 44 at an 8pt radius. */
  digit: {
    width: 31,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.xs,
  },
});
