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

import { AUTH_HERO, AUTH_LOGO_LOCKUP } from '../assets';
import type { LoginViewModel } from '../types';

/**
 * Login — NEW Figma `53:174` "Page 17a- Login No.".
 *
 * Read off the node, top to bottom inside the 370pt screen (`225:1632`, `justify-between`):
 *   hero   `225:1640` — a 364pt band, `py 6`, clipping a 946 × 360 photograph at `object-cover`
 *   brand  `53:179`   — 167pt: `pt 12 / pb 6`, `px 16`, 6pt gap, a 134 × 93 logo lockup over
 *                       `225:1637` Livvic Bold **18/28** ("minutes" in `#FFD600`) and
 *                       `225:1636` Livvic SemiBold **14/16** at `rgba(0,0,0,0.7)`
 *   form   `53:175`   — 237pt: `px 16`, `pt 6 / pb 16`, 21pt gap
 *                       `53:224`  "Login"  Livvic Bold 14/20
 *                       `225:1598` subtitle Livvic Regular 12/15 at 70%
 *                       `53:225`  the field: 338 wide, `px 12 / py 8`, radius **24**, 1pt `#FFD600`
 *                                 border, a `+91` cell at `px 16` closed by a **1.778pt** `#FFE666`
 *                                 rule, then the input at `px 16`; both Livvic SemiBold 14/16
 *                       `53:242`  CTA: `#FFD600`, h **34**, radius **16**, Livvic Black 16/24 at −0.4
 *   legal  `53:251`   — 39pt: Livvic Regular 9/13.5, the lead at 70% and both links underlined
 *
 * This replaces the previous file's Login entirely (logo tile, `#CFFF04` badge, Black 36/45
 * headline, black-outlined field, outlined CTA) — none of that survives in the new design.
 *
 * BOUNDARY: the CTA raises intent. It performs no validation beyond limiting input to the supplied
 * `phoneMaxLength` digits, formats no message, and decides nothing about retries or rate limits.
 * `errorMessage` and `submitting` are rendered from the caller.
 */
export interface LoginScreenProps {
  readonly login: LoginViewModel;
  /** Raises "the user wants an OTP for this number". Sending it is the host's job. */
  readonly onRequestOtp: (phone: string) => void;
  readonly onOpenTerms?: () => void;
  readonly onOpenPrivacy?: () => void;
  readonly testID?: string;
}

export function LoginScreen({
  login,
  onRequestOtp,
  onOpenTerms,
  onOpenPrivacy,
  testID = 'login-screen',
}: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const focusedRef = useRef(false);
  const ready = phone.length === login.phoneMaxLength && login.submitting !== true;

  /**
   * The field and the CTA are the LAST things in the scroll, and the 364pt hero above them is
   * taller than what an Android keyboard leaves of the viewport. `adjustResize` shrinks the window
   * but does not move the scroll offset, so the focused field ended up behind the keyboard with
   * the CTA unreachable — measured on the handset, not inferred.
   *
   * The scroll is driven off the ScrollView's own `onLayout`, not off `keyboardDidShow`: on
   * Android the keyboard event fires BEFORE the window resize reaches the view, so a scroll issued
   * there is computed against the pre-resize height and does nothing. `onLayout` runs after the
   * new height lands, which is the only point at which "the end" means anything.
   */
  const revealField = () => {
    if (focusedRef.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      {/*
        `behavior="padding"` on BOTH platforms. Android's `windowSoftInputMode="adjustResize"` no
        longer resizes the window under the edge-to-edge display this app runs in, so leaving the
        behavior undefined on Android left the keyboard covering the field and the CTA outright —
        measured on the handset. Padding the avoiding view shrinks the scroll viewport, which is
        what makes `revealField` below have anywhere to scroll to.
      */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={revealField}
        >
          {/* `225:1640` — the hero is CLIPPED, never letterboxed. */}
          <View style={styles.hero}>
            <Image
              source={AUTH_HERO}
              style={styles.heroImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={styles.brand}>
            <Image
              source={AUTH_LOGO_LOCKUP}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.tagline}>
              <Text variant="titleLead" color="textPrimary" align="center">
                {login.taglineLead}
                <Text variant="titleLead" color="surfaceCta">
                  {login.taglineAccent}
                </Text>
              </Text>
              <Text variant="loginTagline" color="textSecondary" align="center">
                {login.taglineSub}
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.formInner}>
              <View style={styles.labels}>
                <Text variant="title" color="textPrimary">
                  {login.title}
                </Text>
                <Text variant="bodyQuiet" color="textSecondary">
                  {login.subtitle}
                </Text>
              </View>

              {/* `53:225` — a 24pt-radius pill outlined in `#FFD600`. */}
              <View style={styles.field}>
                <View style={styles.dial}>
                  <Text variant="fieldValue" color="textPrimary">
                    {login.dialCode}
                  </Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={(next) => setPhone(next.replace(/\D/g, ''))}
                  placeholder={login.phonePlaceholder}
                  placeholderTextColor={lightTheme.colors.textPlaceholder}
                  onFocus={() => {
                    focusedRef.current = true;
                    revealField();
                  }}
                  onBlur={() => {
                    focusedRef.current = false;
                  }}
                  keyboardType="phone-pad"
                  maxLength={login.phoneMaxLength}
                  style={styles.input}
                  accessibilityLabel={login.subtitle}
                  testID={`${testID}-phone`}
                />
              </View>

              {login.errorMessage === undefined ? null : (
                <Text variant="bodyQuiet" color="textDestructive" testID={`${testID}-error`}>
                  {login.errorMessage}
                </Text>
              )}

              <Pressable
                onPress={() => onRequestOtp(phone)}
                disabled={!ready}
                accessibilityRole="button"
                accessibilityLabel={login.ctaLabel}
                accessibilityState={{ disabled: !ready, busy: login.submitting === true }}
                style={({ pressed }) => [
                  styles.cta,
                  ready ? null : styles.ctaDisabled,
                  pressed && ready ? styles.pressed : null,
                ]}
                testID={`${testID}-cta`}
              >
                <Text variant="headingCtaTight" color={ready ? 'textOnAccent' : 'textDisabled'}>
                  {login.ctaLabel}
                </Text>
              </Pressable>
            </View>

            {/* `53:251` — Regular 9/13.5; both links underlined, as drawn. */}
            <View style={styles.legal}>
              <Text variant="micro" color="textSecondary" align="center">
                {login.legalLead}
              </Text>
              <Text variant="micro" color="textPrimary" align="center">
                <Text variant="micro" color="textPrimary" style={styles.link} onPress={onOpenTerms}>
                  {login.legalTerms}
                </Text>
                {login.legalSeparator}
                <Text
                  variant="micro"
                  color="textPrimary"
                  style={styles.link}
                  onPress={onOpenPrivacy}
                >
                  {login.legalPrivacy}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  fill: { flex: 1 },
  body: { flexGrow: 1 },
  /** `225:1640` — 364pt tall with 6pt of vertical padding, clipping the photograph. */
  hero: {
    height: 364,
    paddingVertical: lightTheme.space.s6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  /** `53:179` — 167pt, pt 12 / pb 6. */
  brand: {
    height: 167,
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingTop: lightTheme.space.md,
    paddingBottom: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.lg,
  },
  /** `225:1630` — 134 × 93. */
  logo: { width: 134, height: 93 },
  /** `225:1639` — a 320pt measure, 2pt between the two lines. */
  tagline: { width: 320, gap: lightTheme.space.xxs, alignItems: 'center' },
  /** `53:175` — 21pt between the form block and the legal footer. */
  form: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 21,
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.s6,
    paddingBottom: lightTheme.space.lg,
  },
  /** `53:219` — 16pt between the labelled field group and the CTA. */
  formInner: { gap: lightTheme.space.lg },
  /** `53:222` — 6pt between "Login" and its subtitle. */
  labels: { gap: lightTheme.space.s6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfaceCta,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `53:227` — the dial cell is closed by a 1.778pt `#FFE666` rule. */
  dial: {
    paddingHorizontal: lightTheme.space.lg,
    borderRightWidth: lightTheme.stroke.base,
    borderRightColor: lightTheme.colors.surfaceAccentBold,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: 0,
    color: lightTheme.colors.textPrimary,
    ...lightTheme.typography.fieldValue,
  },
  /** `53:242` — a fixed 34pt bar at a 16pt radius. */
  cta: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  ctaDisabled: { backgroundColor: lightTheme.colors.surfaceMuted },
  pressed: { opacity: 0.85 },
  /** `53:251` — 39pt, 2pt between the two lines. */
  legal: { gap: lightTheme.space.xxs, alignItems: 'center', paddingVertical: lightTheme.space.s6 },
  link: { textDecorationLine: 'underline' },
});
