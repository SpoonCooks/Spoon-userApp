import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LOGIN_ART } from '../login/art';
import { LoginShell, useOverlayTop } from '../login/LoginShell';
import {
  displayDigits,
  isValidMobile,
  nextPhoneDigits,
  normalizePhoneInput,
  PHONE_DIGITS,
} from '../login/phone';
import { C, F, SHADOW_BUTTON, SHADOW_PILL, SHADOW_SOFT } from '../login/theme';
import { useKeyboardLayout } from '../login/useKeyboardLayout';
import type { LoginViewModel } from '../types';

/**
 * Login — Figma `cCQlzTeiObQkpVBzwI8mZi`, page "Login": `1923:1139` "Page 1- Login No. — v2" and
 * `1945:1353` "— keyboard", built to their dev notes (`1949:2203`, `1949:2258`).
 *
 * One flow for new and returning customers: a mobile number, then an SMS code. The hero (photo,
 * logo, badges) is decorative; the shell plays its intro once and hides the badges while typing.
 *
 *   content `1923:1307` — 24pt gaps (16 with the keyboard up): the 138 × 100 logo (60 % with the
 *                         keyboard up) over "Home cooks for all your needs", the form, the terms
 *   field   `1923:1319` — 56pt pill, 1.5pt `#FFD600`, Elevation/1; "+91" in a 44pt cell
 *   error   `1940:7592` — 16pt exclamation + Caption Strong, under the field
 *   CTA     `1923:1328` — 48pt pill "Get OTP"; the disabled style until the number is valid
 *   terms   `1923:1330` — Caption at 60 %, both links black and underlined
 *
 * Validation (dev note): a valid number is 10 digits starting 6–9. "Please enter a valid phone
 * number" appears only when the customer LEAVES the field with an incomplete or invalid number,
 * never while typing, and clears on the next edit. Server failures arrive pre-worded in
 * `login.errorMessage` and share the same slot.
 *
 * Not in the frames: the iOS-only "Skip" (App Store review needs the app browsable without an
 * account) and the remembered number from the last sign-in. Both are kept from the previous screen.
 */
export interface LoginScreenProps {
  readonly login: LoginViewModel;
  /** Raised with the 10 national digits. Sending the code is the host's job. */
  readonly onRequestOtp: (digits: string) => void;
  /** Any edit — the host clears a stale server error with it. */
  readonly onChangePhone?: () => void;
  readonly onOpenTerms?: () => void;
  readonly onOpenPrivacy?: () => void;
  /** Guest mode; the pill is drawn only when supplied (iOS). */
  readonly onSkip?: () => void;
  /** The number from this device's last sign-in. Applied once, only into an empty field. */
  readonly initialPhone?: string;
  /**
   * Changing this focuses the field. The OTP screen's Back / Edit return here "with the number
   * prefilled and the keyboard open" — the number is still in this screen's state (it stays mounted
   * under the OTP screen); this brings the keyboard back.
   */
  readonly focusKey?: number;
  readonly testID?: string;
}

/** `1923:1307` starts 400pt above the bottom edge; the curve 34pt above that. */
const CONTENT_FROM_BOTTOM = 400;
const CURVE_LEAD = 34;
const LOGO = { width: 138, height: 100 } as const;
/** "Logo shrinks to about 60% on this screen only." */
const LOGO_COMPACT = 0.6;

/** 1 to 9 digits, or 10 that are not a mobile number. */
function isIncomplete(digits: string): boolean {
  return digits.length > 0 && !isValidMobile(digits);
}

export function LoginScreen({
  login,
  onRequestOtp,
  onChangePhone,
  onOpenTerms,
  onOpenPrivacy,
  onSkip,
  initialPhone,
  focusKey,
  testID = 'login-screen',
}: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [leftInvalid, setLeftInvalid] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const keyboardHeight = useKeyboardLayout();
  const keyboardOpen = keyboardHeight > 0;
  const { height } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const overlayTop = useOverlayTop();

  // The remembered number, applied once and only while the field is empty (see `lastPhoneStore`).
  const [appliedInitial, setAppliedInitial] = useState<string | undefined>(undefined);
  if (initialPhone !== undefined && initialPhone !== appliedInitial) {
    setAppliedInitial(initialPhone);
    if (phone === '') {
      const digits = normalizePhoneInput(initialPhone);
      if (digits.length === PHONE_DIGITS) setPhone(digits);
    }
  }

  useEffect(() => {
    if (focusKey === undefined || focusKey === 0) return;
    inputRef.current?.focus();
  }, [focusKey]);

  const valid = isValidMobile(phone);
  const submitting = login.submitting === true;
  const ready = valid && !submitting;
  const errorMessage = leftInvalid ? login.invalidPhoneMessage : login.errorMessage;

  /*
   * Small phones: "Everything must fit above the keyboard … hide the terms first, then the logo."
   * The compact content's height is known from the frame (logo 60 + 8 + 20, form 116 + any error
   * line, terms 16, 16pt gaps), so the decision is made up front instead of after a measuring pass.
   */
  const available = height - keyboardHeight - 16 - (top + 8);
  const compactForm = 116 + (errorMessage === undefined ? 0 : 28);
  const compactFull = LOGO.height * LOGO_COMPACT + 28 + 16 + compactForm + 16 + 16;
  const hideTerms = keyboardOpen && available < compactFull;
  const hideLogo = keyboardOpen && available < compactFull - 32;

  const gap = keyboardOpen ? 16 : 24;
  const logoScale = keyboardOpen ? LOGO_COMPACT : 1;

  return (
    <LoginShell
      keyboardHeight={keyboardHeight}
      contentFromBottom={CONTENT_FROM_BOTTOM}
      curveLead={CURVE_LEAD}
      intro
      testID={testID}
      overlay={
        onSkip === undefined ? null : (
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={login.skipLabel}
            hitSlop={8}
            style={({ pressed }) => [styles.skip, { top: overlayTop }, pressed && styles.pressed]}
            testID={`${testID}-skip`}
          >
            <Text style={styles.skipLabel}>{login.skipLabel}</Text>
          </Pressable>
        )
      }
    >
      <View style={[styles.content, { gap }]}>
        <View style={styles.brand}>
          {hideLogo ? null : (
            <Image
              source={LOGIN_ART.logo}
              style={{ width: LOGO.width * logoScale, height: LOGO.height * logoScale }}
              accessibilityLabel="Spoon"
              accessibilityIgnoresInvertColors
            />
          )}
          <Text style={styles.headline}>{login.headline}</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.field, SHADOW_SOFT]}>
            <View style={styles.dial}>
              <Text style={[styles.fieldText, styles.dialCode]}>{login.dialCode}</Text>
            </View>
            <TextInput
              ref={inputRef}
              value={displayDigits(phone)}
              onChangeText={(text) => {
                setPhone(nextPhoneDigits(phone, displayDigits(phone), text));
                setLeftInvalid(false);
                onChangePhone?.();
              }}
              // "Only if the user leaves the field with 1 to 9 digits" — never while typing.
              onBlur={() => setLeftInvalid(isIncomplete(phone))}
              placeholder={login.phonePlaceholder}
              placeholderTextColor={C.textDisabled}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              editable={!submitting}
              style={styles.input}
              accessibilityLabel={login.phoneLabel}
              testID={`${testID}-phone`}
            />
          </View>

          {errorMessage === undefined ? null : (
            <View style={styles.error} accessibilityLiveRegion="polite" testID={`${testID}-error`}>
              <Image source={LOGIN_ART.exclamation} style={styles.errorIcon} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              if (ready) {
                onRequestOtp(phone);
                return;
              }
              // A tap on the disabled button means the customer is done with the field: leaving it
              // incomplete is exactly when the message is due.
              if (isIncomplete(phone)) {
                inputRef.current?.blur();
                setLeftInvalid(true);
              }
            }}
            // Not `disabled={false}`: Pressable copies `disabled` over accessibilityState, and a
            // screen reader must still hear Get OTP as disabled until the number is valid.
            disabled={submitting ? true : undefined}
            accessibilityRole="button"
            accessibilityLabel={login.ctaLabel}
            accessibilityState={{ disabled: !ready, busy: submitting }}
            style={({ pressed }) => [
              styles.cta,
              SHADOW_BUTTON,
              valid ? styles.ctaEnabled : styles.ctaDisabled,
              pressed && ready && styles.pressed,
            ]}
            testID={`${testID}-cta`}
          >
            {submitting ? (
              <ActivityIndicator color={C.text} testID={`${testID}-sending`} />
            ) : (
              <Text style={[styles.ctaLabel, !valid && styles.ctaLabelDisabled]}>
                {login.ctaLabel}
              </Text>
            )}
          </Pressable>
        </View>

        {hideTerms ? null : (
          <Text style={styles.legal}>
            {login.legalLead}
            <Text style={styles.link} onPress={onOpenTerms} accessibilityRole="link">
              {login.legalTerms}
            </Text>
            {login.legalSeparator}
            <Text style={styles.link} onPress={onOpenPrivacy} accessibilityRole="link">
              {login.legalPrivacy}
            </Text>
          </Text>
        )}
      </View>
    </LoginShell>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', alignItems: 'center' },
  /** `1940:5639` "Brand tag" — 8pt between the logo and the line. */
  brand: { alignItems: 'center', gap: 8 },
  /** Spoon/Body at 60 %. */
  headline: {
    fontFamily: F.regular,
    fontSize: 14,
    lineHeight: 20,
    color: C.textSecondary,
    textAlign: 'center',
  },
  /** `1923:1317` — 12pt between field, error and CTA, left-aligned. */
  form: { width: '100%', gap: 12, alignItems: 'flex-start' },
  field: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 4,
    paddingRight: 8,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: C.brand,
    backgroundColor: C.base,
  },
  /** `1923:1320` — the 44pt "+91" cell. */
  dial: { height: 44, justifyContent: 'center', paddingLeft: 16, paddingRight: 12 },
  /** Spoon/Emphasis — SemiBold 16/24. */
  fieldText: { fontFamily: F.semibold, fontSize: 16, lineHeight: 24, color: C.text },
  /**
   * Carried over from `5eaf2c0` ("Centre the login phone field's +91 and number"). A single-line
   * iOS `TextInput` given a `lineHeight` sets its text low in the box, so the number shares the
   * `+91`'s type but NOT its line height: it fills the bar and centres its glyphs instead. Android
   * pads the font's ascent unless told not to.
   */
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontFamily: F.semibold,
    fontSize: 16,
    color: C.text,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  /**
   * Also from `5eaf2c0`: iOS sets a `Text` two-thirds of a point lower than a `TextInput` in the
   * same font and box (measured on device), so the `+91` is lifted by exactly that.
   */
  dialCode: { transform: [{ translateY: -2 / 3 }] },
  error: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  errorIcon: { width: 16, height: 16 },
  /** Spoon/Caption Strong, black — there is no red in the customer app. */
  errorText: { fontFamily: F.semibold, fontSize: 12, lineHeight: 16, color: C.text, flexShrink: 1 },
  cta: {
    width: '100%',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaEnabled: { backgroundColor: C.brand },
  ctaDisabled: { backgroundColor: C.surfaceDisabled },
  /** Spoon/Button — Bold 16/24. */
  ctaLabel: { fontFamily: F.bold, fontSize: 16, lineHeight: 24, color: C.text },
  ctaLabelDisabled: { color: C.textDisabled },
  /** Spoon/Caption at 60 %; the two links black and underlined. */
  legal: {
    width: '100%',
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 16,
    color: C.textSecondary,
    textAlign: 'center',
  },
  link: { color: C.text, textDecorationLine: 'underline' },
  /** Not in the frame — styled as the frames' floating Back button: white, Elevation/2, 40pt. */
  skip: {
    position: 'absolute',
    right: 16,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 9999,
    justifyContent: 'center',
    backgroundColor: C.base,
    ...SHADOW_PILL,
  },
  skipLabel: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: C.text },
  pressed: { opacity: 0.85 },
});
