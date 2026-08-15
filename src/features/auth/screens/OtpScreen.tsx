import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, lightTheme } from '@ui';

import { AUTH_EDIT_PHONE, AUTH_LOGO_LOCKUP } from '../assets';
import type { OtpViewModel } from '../types';

/**
 * OTP verification — NEW Figma `227:1649` "Page 17b- Login OTP".
 *
 * This screen did NOT exist in the previous file; it was blocker B-7 ("do not invent it"). It is
 * now fully designed, so it is built as drawn:
 *
 *   brand   `227:1666` — 172pt, `justify-end`: the same 134 × 93 lockup, then a tagline that is
 *                        DELIBERATELY not Login's: Livvic Bold **14/20** over Medium **11/16.5**,
 *                        where Login uses Bold 18/28 over SemiBold 14/16. Not unified.
 *   header  `227:1678` — "OTP verification", Livvic Bold 12/16
 *           `227:1680` — "OTP has been sent to …", Livvic Regular 10/15 at 70%, 12pt clear of
 *                        `227:1700`, a 14 × 14 `#FFD600` pencil that returns to the number
 *   digits  `227:1681` — a 338pt row, `px 12 / py 6`, radius **24**, holding `digitCount` boxes of
 *                        **35 × 35** at a **5pt** radius on `#FFEF99`, 10pt apart, each carrying a
 *                        Livvic Bold **18/28** glyph at `rgba(0,0,0,0.7)`
 *           `230:2086` — "Resend OTP in 26s", Livvic Medium 11/16.5, the trailing token Bold
 *   cta     `227:1687` — `#FFD600`, h **34**, radius **16**, Livvic Black 16/24 at −0.4
 *
 * The boxes are a DISPLAY of one hidden input — that keeps paste, autofill and the platform SMS
 * suggestion working, which six separate inputs would break.
 *
 * BOUNDARY: nothing here verifies a code, counts down, decides when resend unlocks, or knows the
 * expiry. `digitCount`, `resendLabel` and `resendEnabled` are supplied; `onVerify` hands the code
 * to the host and stops.
 */
export interface OtpScreenProps {
  readonly otp: OtpViewModel;
  readonly onVerify: (code: string) => void;
  readonly onResend: () => void;
  /** `227:1700` — the pencil returns to phone entry. */
  readonly onEditNumber: () => void;
  readonly testID?: string;
}

export function OtpScreen({
  otp,
  onVerify,
  onResend,
  onEditNumber,
  testID = 'otp-screen',
}: OtpScreenProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const ready = code.length === otp.digitCount && otp.submitting !== true;
  const boxes = Array.from({ length: otp.digitCount }, (_, index) => index);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      {/* `padding` on both platforms — see LoginScreen: `adjustResize` is inert under the
          edge-to-edge display, so an undefined Android behavior leaves the keyboard covering the
          digit boxes and the CTA. */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Image
              source={AUTH_LOGO_LOCKUP}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.tagline}>
              <Text variant="title" color="textPrimary" align="center">
                {otp.taglineLead}
                <Text variant="title" color="surfaceCta">
                  {otp.taglineAccent}
                </Text>
              </Text>
              <Text variant="otpTagline" color="textSecondary" align="center">
                {otp.taglineSub}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.heading}>
              <Text variant="bodyBold" color="textPrimary">
                {otp.title}
              </Text>
              <View style={styles.sentRow}>
                <Text variant="caption" color="textSecondary">
                  {otp.sentToLabel}
                </Text>
                <Pressable
                  onPress={onEditNumber}
                  accessibilityRole="button"
                  accessibilityLabel="Change phone number"
                  hitSlop={12}
                  testID={`${testID}-edit`}
                >
                  <Image
                    source={AUTH_EDIT_PHONE}
                    style={styles.editIcon}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.digitsBlock}>
              {/* One real input behind the drawn boxes, so paste and SMS autofill still work. */}
              <Pressable
                onPress={() => inputRef.current?.focus()}
                accessibilityRole="none"
                style={styles.digitsRow}
                testID={`${testID}-digits`}
              >
                {boxes.map((index) => (
                  <View key={index} style={styles.digit}>
                    <Text variant="otpDigit" color="textSecondary" align="center">
                      {code[index] ?? ''}
                    </Text>
                  </View>
                ))}
              </Pressable>

              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={(next) => setCode(next.replace(/\D/g, '').slice(0, otp.digitCount))}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={otp.digitCount}
                style={styles.hiddenInput}
                accessibilityLabel={otp.title}
                testID={`${testID}-input`}
              />

              <Pressable
                onPress={onResend}
                disabled={!otp.resendEnabled}
                accessibilityRole="button"
                accessibilityLabel={otp.resendLabel}
                accessibilityState={{ disabled: !otp.resendEnabled }}
                hitSlop={8}
                testID={`${testID}-resend`}
              >
                <Text variant="otpTagline" color="textSecondary" align="center">
                  {otp.resendLabel}
                </Text>
              </Pressable>
            </View>

            {otp.errorMessage === undefined ? null : (
              <Text variant="caption" color="textDestructive" testID={`${testID}-error`}>
                {otp.errorMessage}
              </Text>
            )}

            <Pressable
              onPress={() => onVerify(code)}
              disabled={!ready}
              accessibilityRole="button"
              accessibilityLabel={otp.ctaLabel}
              accessibilityState={{ disabled: !ready, busy: otp.submitting === true }}
              style={({ pressed }) => [
                styles.cta,
                ready ? null : styles.ctaDisabled,
                pressed && ready ? styles.pressed : null,
              ]}
              testID={`${testID}-cta`}
            >
              <Text variant="headingCtaTight" color={ready ? 'textOnAccent' : 'textDisabled'}>
                {otp.ctaLabel}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  fill: { flex: 1 },
  /** `227:1650` — px 16, 21pt between the brand block and the body. */
  body: { flexGrow: 1, paddingHorizontal: lightTheme.space.lg, gap: 21 },
  /** `227:1666` — 172pt, bottom-aligned. */
  brand: {
    height: 172,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: lightTheme.space.s6,
    paddingVertical: lightTheme.space.s6,
  },
  logo: { width: 134, height: 93 },
  tagline: { gap: lightTheme.space.xxs, alignItems: 'center' },
  /** `227:1674` — 16pt between the heading, the digits and the CTA. */
  content: { gap: lightTheme.space.lg, paddingVertical: lightTheme.space.s6 },
  heading: { gap: lightTheme.space.s6 },
  /** `227:1679` — the pencil sits 12pt clear of the copy. */
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  editIcon: { width: 14, height: 14 },
  /** `230:2084` — 6pt between the boxes and the resend line. */
  digitsBlock: { gap: lightTheme.space.s6, paddingVertical: lightTheme.space.s6 },
  /** `227:1681` — a 24pt-radius row, px 12 / py 6, boxes 10pt apart. */
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `230:2091` — 35 × 35 at a 5pt radius on `#FFEF99`. */
  digit: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r5,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
  /** Off-screen rather than `display: none`, so it can still take focus and autofill. */
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1, top: 0, left: 0 },
  cta: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  ctaDisabled: { backgroundColor: lightTheme.colors.surfaceMuted },
  pressed: { opacity: 0.85 },
});
