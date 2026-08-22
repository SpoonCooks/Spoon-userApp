import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, lightTheme } from '@ui';

import { AUTH_EDIT_PHONE, AUTH_LOGO_LOCKUP } from '../assets';
import type { OtpViewModel } from '../types';

/**
 * OTP verification — Figma `fsgGIC4c6DJulb64TTt9yg`, "Login flow" section `275:4472`:
 *
 *   `275:4289`  Page 2a — countdown      — "Resend OTP in **25s**", trailing token Bold, NOT
 *                                          underlined
 *   `250:2439`  Page 2b — resend offered — "Resend OTP **via SMS**", underlined
 *   `275:4349`  Page 2c — rejected code  — `275:4467` "Incorrect OTP. Please try again" in Livvic
 *                                          Medium **12/16** at `#FF0404`, sitting INSIDE the white
 *                                          digits container below the boxes, with every box
 *                                          swapped from `#FFEF99` to `rgba(255,4,4,0.07)`
 *
 * All three share one skeleton — a 370 × 800 live area holding a 33pt status bar, a 172pt brand
 * block at y = 54 and the body at y = 247. Geometry below is read off `275:4289` / `275:4312`;
 * the error frame changes fill, adds one line and grows the body 160 → 192.
 *
 *   brand   `275:4305` — 172pt, `justify-end`, px 16 / py 6: a 134 × 93 lockup, then a 268pt
 *                        tagline that is DELIBERATELY not Login's: Livvic Bold **14/20** over
 *                        Medium **11/16.5**, where Login uses Bold 18/28 over SemiBold 14/16.
 *   body    `275:4312` — px 4 / py 12, 16pt between the heading group and the digits block
 *   header  `275:4315` — "OTP verification", Livvic **Bold 14/20**
 *           `275:4317` — "OTP has been sent to …", Livvic **Regular 12/16** at 70 %, 12pt clear of
 *                        `275:4318`, a 14 × 14 pencil that returns to the number
 *   digits  `275:4321` — a full-width container, `px 12 / py 6`, radius **24**, on white, holding
 *                        `digitCount` boxes of **35 × 35** at a **5pt** radius on `#FFEF99`, 10pt
 *                        apart, each carrying a Livvic Bold **18/28** glyph at `rgba(0,0,0,0.7)`
 *           `275:4340` — the resend line, Livvic **SemiBold 14/16**, trailing token Bold 14/20
 *
 * **There is no CTA.** `227:1687` ("Verify & Proceed") existed in the superseded file and is gone
 * from all three finalized frames — verified by geometry, not by eye: the body block ends at
 * y = 407 and nothing follows before the home indicator at y = 810. The code is therefore
 * submitted as soon as the last digit lands, which is the only affordance the design leaves.
 * `onVerify` is still the seam; this screen decides nothing about whether the code is correct.
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

/** `275:4305` — the brand block's designed height, held wherever the viewport can afford it. */
const BRAND_REFERENCE_HEIGHT = 172;

/**
 * `275:4312` / `275:4439` — the body at its designed height, plus the 21pt gap above it. The
 * error frame's body is 192 rather than 160, so the taller of the two is reserved and the clamp
 * never has to move when an error appears.
 */
const CONTENT_BLOCK_HEIGHT = 192 + 21;

/** The floor the block may close to before it stops reading as a brand block. */
const BRAND_MIN_HEIGHT = 96;

/**
 * `275:4306` (93) + the 6pt gap + `275:4308` (39). Below this the block cannot hold the lockup
 * whole, so the lockup is dropped rather than sliced.
 */
const BRAND_LOCKUP_MIN_BLOCK = 138;

export function OtpScreen({
  otp,
  onVerify,
  onResend,
  onEditNumber,
  testID = 'otp-screen',
}: OtpScreenProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const focusedRef = useRef(false);
  const boxes = Array.from({ length: otp.digitCount }, (_, index) => index);
  const errored = otp.errorMessage !== undefined;

  /**
   * The finalized frames draw no submit control, so the last digit IS the submit gesture. This
   * raises intent exactly once per completed code and still decides nothing — `onVerify` remains
   * the seam and the host owns the result.
   */
  const onChangeCode = (next: string) => {
    const digits = next.replace(/\D/g, '').slice(0, otp.digitCount);
    setCode(digits);
    if (digits.length === otp.digitCount && otp.submitting !== true) {
      onVerify(digits);
    }
  };

  /**
   * SHORT-HEIGHT RESPONSIVENESS — the same rule Login uses, for the same reason: this screen also
   * stacks a fixed brand block above the digits, so on a short viewport the block pushes the
   * resend line off. The brand block absorbs the shortfall; nothing else scales.
   *
   * The keyboard height is SUBTRACTED explicitly rather than inferred from `useWindowDimensions`.
   * Under the edge-to-edge display this app runs in, Android's `adjustResize` never shrinks the
   * window, so `windowHeight` is identical with the keyboard up and down — the clamp could never
   * fire. Measured on a 360 x 568 viewport: the boxes and the resend line sat under the IME with
   * the brand block still at its full 172.
   */
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const availableHeight = windowHeight - insets.top - insets.bottom - keyboardHeight;
  const brandHeight = Math.max(
    BRAND_MIN_HEIGHT,
    Math.min(BRAND_REFERENCE_HEIGHT, availableHeight - CONTENT_BLOCK_HEIGHT),
  );

  /**
   * The digit row and the CTA are the last things in the scroll. `adjustResize` is inert under
   * the edge-to-edge display this app runs in, so the keyboard would otherwise sit over them —
   * the same defect LoginScreen documents. Driven off the ScrollView's own `onLayout` because on
   * Android the keyboard event fires BEFORE the window resize reaches the view.
   */
  const revealInput = () => {
    if (focusedRef.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      {/* `padding` on both platforms — see LoginScreen: `adjustResize` is inert under the
          edge-to-edge display, so an undefined Android behavior leaves the keyboard covering the
          digit boxes and the CTA. */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={revealInput}
        >
          <View style={[styles.brand, { height: brandHeight }]}>
            {/*
              The lockup is DROPPED, not clipped, once the block can no longer hold it whole.
              `275:4306` is 93 tall over a 6pt gap and a 39pt tagline, so anything under 138 would
              slice the mark off at the top and leave a stray fragment on screen. The tagline still
              carries the brand at that size, and every viewport that can afford 172 is unchanged.
            */}
            {brandHeight >= BRAND_LOCKUP_MIN_BLOCK ? (
              <Image
                source={AUTH_LOGO_LOCKUP}
                style={styles.logo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            ) : null}
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
              <Text variant="title" color="textPrimary">
                {otp.title}
              </Text>
              <View style={styles.sentRow}>
                <Text variant="bodyQuiet" color="textSecondary">
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

            <View style={[styles.digitsBlock, errored ? styles.digitsBlockErrored : null]}>
              {/*
                `275:4321` / `275:4448` — the white radius-24 container. On the error frame it
                becomes a COLUMN and takes the message as a second child, which is why the message
                sits inside the container rather than under it.
              */}
              <View style={styles.digitsPanelWrap}>
                <Pressable
                  onPress={() => inputRef.current?.focus()}
                  accessibilityRole="none"
                  style={styles.digitsPanel}
                  testID={`${testID}-digits`}
                >
                  <View style={styles.digitsRow}>
                    {boxes.map((index) => (
                      <View
                        key={index}
                        style={[styles.digit, errored ? styles.digitErrored : null]}
                        testID={`${testID}-digit-${index}`}
                      >
                        <Text variant="otpDigit" color="textSecondary" align="center">
                          {code[index] ?? ''}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* `275:4467` — Livvic Medium 12/16 at `#FF0404`, inside the panel. */}
                  {errored ? (
                    <Text
                      variant="otpError"
                      color="danger"
                      align="center"
                      testID={`${testID}-error`}
                    >
                      {otp.errorMessage}
                    </Text>
                  ) : null}
                </Pressable>

                {/*
                  The real input is TRANSPARENT and covers the panel, rather than sitting 1 x 1 at
                  the scroll's origin.
                  Android scrolls a focused input into view on its own. With the input at (0, 0)
                  that auto-reveal pulled the scroll to the TOP, which fought `revealInput` and
                  left the boxes and the resend line under the keyboard on a 360 x 568 viewport —
                  observed, not inferred. Covering the panel means the auto-reveal targets the
                  boxes themselves, which is the thing that has to stay visible.
                */}
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={onChangeCode}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={otp.digitCount}
                  caretHidden
                  onFocus={() => {
                    focusedRef.current = true;
                    revealInput();
                  }}
                  onBlur={() => {
                    focusedRef.current = false;
                  }}
                  style={styles.hiddenInput}
                  accessibilityLabel={otp.title}
                  testID={`${testID}-input`}
                />
              </View>

              <Pressable
                onPress={onResend}
                disabled={!otp.resendEnabled}
                accessibilityRole="button"
                accessibilityLabel={otp.resendLabel}
                accessibilityState={{ disabled: !otp.resendEnabled }}
                hitSlop={8}
                testID={`${testID}-resend`}
              >
                {/*
                  `275:4340` / `275:4469` — one text node, two runs: SemiBold lead, Bold trailing
                  token. Underlined only once resend is actually offered, exactly as `250:2439`
                  and `275:4349` draw it against the plain countdown on `275:4289`.
                */}
                <Text
                  variant="otpResend"
                  color="textSecondary"
                  align="center"
                  style={otp.resendEnabled ? styles.resendOffered : null}
                >
                  {otp.resendLabel}
                  {otp.resendLabelAccent === undefined ? null : (
                    <Text variant="otpResendStrong" color="textSecondary">
                      {otp.resendLabelAccent}
                    </Text>
                  )}
                </Text>
              </Pressable>
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
  /**
   * `275:4290` — px 16 per block, 21pt between the status bar and the brand block and again
   * between the brand block and the body.
   */
  body: {
    flexGrow: 1,
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: 21,
    gap: 21,
  },
  /** `275:4305` — bottom-aligned. Height is supplied by the component; see the clamp above. */
  brand: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: lightTheme.space.s6,
    paddingVertical: lightTheme.space.s6,
  },
  logo: { width: 134, height: 93 },
  /** `275:4308` — a 268pt measure, 2pt between the two lines. */
  tagline: { width: 268, gap: lightTheme.space.xxs, alignItems: 'center' },
  /** `275:4312` — px 4 / py 12, 16pt between the heading group and the digits block. */
  content: {
    gap: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.md,
  },
  heading: { gap: lightTheme.space.s6 },
  /** `275:4316` — the pencil sits 12pt clear of the copy. */
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  editIcon: { width: 14, height: 14 },
  /** `275:4320` — 6pt between the panel and the resend line. */
  digitsBlock: {
    gap: lightTheme.space.s6,
    paddingVertical: lightTheme.space.s6,
    alignItems: 'center',
  },
  /** `275:4447` — the error frame opens this rhythm from 6 to 12. */
  digitsBlockErrored: { gap: lightTheme.space.md },
  /** Positioning context for the transparent input that covers the panel. */
  digitsPanelWrap: { alignSelf: 'stretch', position: 'relative' },
  /** `275:4321` — a full-width 24pt-radius panel on white, px 12 / py 6. */
  digitsPanel: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `275:4471` — the boxes themselves, 10pt apart. */
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s10,
  },
  /** `275:4322` — 35 × 35 at a 5pt radius on `#FFEF99`. */
  digit: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r5,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
  /** `275:4449` — on the error frame the same box swaps to the red tint. Geometry is unchanged. */
  digitErrored: { backgroundColor: lightTheme.colors.dangerSurface },
  /** `250:2439` / `275:4469` — the resend line is underlined only once it is actually offered. */
  resendOffered: { textDecorationLine: 'underline' },
  /**
   * Transparent rather than `display: none`, so it can still take focus, paste and SMS autofill —
   * and sized over the panel so the platform's focus auto-reveal lands on the boxes.
   */
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
});
