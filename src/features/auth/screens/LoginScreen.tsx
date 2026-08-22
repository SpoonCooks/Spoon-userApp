import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, lightTheme, useBottomGutter } from '@ui';

import { AUTH_HERO, AUTH_LOGO_LOCKUP } from '../assets';
import type { LoginViewModel } from '../types';

/**
 * Login — Figma `250:2383` "Page 1- Login No.", re-read on the FINAL file
 * (`8F7GqT4hEG2pEhtUGBYw7p`).
 *
 * Read off the nodes, top to bottom inside the 370pt viewport:
 *   hero   `250:2434` — a **329**pt band, full-bleed and flush under the status bar. It carries
 *                       NO padding; the 6pt inset the superseded file drew came from an older
 *                       file's `225:1640` and was forcing a crop the design does not have.
 *   brand  `250:2400` — 167pt, `px 12 / py 6`, 6pt gap: a 134 × 93 logo lockup (`250:2401`) over
 *                       `250:2404` Livvic Bold **18/28** ("minutes" in `#FFD600`) and
 *                       `250:2405` SemiBold **14/16** at `rgba(0,0,0,0.7)`, on a 320pt measure
 *   form   `250:2406` — a 228pt `flex-1` block: `250:2407` carries `my-auto` (the form group is
 *                       CENTRED in the height left above the footer) and `250:2423` sits at its
 *                       end. 21pt between them at the reference size.
 *                       `250:2412` "Login"  Livvic Bold 14/20
 *                       `250:2414` subtitle Regular 12/15 at 70%
 *                       `250:2415` the field: 325 wide, h **43**, radius 15, 1pt `#FFD600`, a
 *                                  `+91` cell closed by a 1.778pt `#FFE666` rule
 *                       `250:2421` CTA: `#FFD600`, h **34**, radius 16, Livvic Black 16/24 at −0.4
 *   legal  `250:2423` — 39pt: Livvic Regular 9/13.5, the lead at 70% and both links underlined
 *
 * See the body of the component for how those blocks behave when the viewport is not 370 × 830 —
 * the founder's "not screen adapted" report (task §8) is answered there, not here.
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

/**
 * `250:2434` — the hero's designed height at the reference width.
 *
 * The frame's 362pt top band is a 33pt STATUS-BAR mockup (`250:2385`, holding "11:23" and the
 * signal glyphs) over a 329pt photograph. The status bar is the real system bar on device, so
 * only **329** belongs to the hero.
 */
const HERO_REFERENCE_HEIGHT = 329;

/** `250:2434` is drawn 370 wide — the full width of the design's viewport, edge to edge. */
const HERO_REFERENCE_WIDTH = 370;

/**
 * The photograph's own shape, and the reason it is no longer cropped from the top.
 *
 * `assets/figma/auth/login-hero.jpg` is now the `250:2434` NODE exported at 3× (1110 × 987), so
 * the frame's crop is baked into the file. The superseded asset was exported from an older file
 * at 1110 × 1092 — a 1.016 ratio against this node's 1.125 — so `resizeMode="cover"` inside a
 * 329pt box had to eat 35pt of it, and it ate them off the top of the cook's head. That is the
 * founder's "cropped from the top" (task §8), and it was an ASSET mismatch, not a layout bug.
 *
 * Held as a ratio rather than a fixed height so the band scales with the viewport's width instead
 * of cropping on any device that is not 370pt across.
 */
const HERO_ASPECT_RATIO = HERO_REFERENCE_WIDTH / HERO_REFERENCE_HEIGHT;

/** `250:2398` -> `250:2384` — the 10pt the frame leaves between the hero and the column. */
const HERO_GAP = 10;

/** `250:2400` and `250:2406` — the two blocks below the hero, at their designed heights. */
const BRAND_BLOCK_HEIGHT = 167;
const FORM_BLOCK_HEIGHT = 228;

/** `250:2423` — the legal footer, which is pinned to the bottom of the form block. */
const LEGAL_BLOCK_HEIGHT = 39;

/** `250:2406` — 21pt between the centred form group and that footer. */
const LEGAL_GAP = 21;

/** `250:2384` — the content column's own 16pt padding, twice, plus its 16pt gap. */
const COLUMN_CHROME = lightTheme.space.lg * 3;

/**
 * The floor the hero may crop to. Below this the photograph stops reading as a scene, and the
 * ScrollView is left to carry whatever still does not fit.
 */
const HERO_MIN_HEIGHT = 160;

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
   * SCREEN ADAPTATION (task §8). Three things the superseded layout got wrong, and the rule each
   * one is replaced by.
   *
   * 1. CROPPED FROM THE TOP. The hero was pinned to the reference **329** at every width, so any
   *    viewport wider than the design's 370 had to crop the photograph to fill it. It now scales
   *    by its own aspect ratio, so a 392.7pt handset gets a 349pt band showing the SAME picture
   *    rather than 329pt of the middle of it. Combined with the re-exported asset (see
   *    `HERO_ASPECT_RATIO`) the reference case now crops nothing at all.
   *
   * 2. A GIANT WHITE GAP AT THE BOTTOM. The stack was top-aligned inside a `flexGrow` scroll, so
   *    every point of leftover height piled up under the legal footer — ~50pt of blank white on
   *    the test handset. `250:2406` does not work that way: it is a `flex-1` block whose form
   *    group carries `my-auto` and whose footer sits at its end, so spare height goes BETWEEN
   *    them. The footer is pinned to the bottom and the gap moves to where the design puts it.
   *
   * 3. THE CTA. It rides with the form group, which is what `250:2421` does — it is not a pinned
   *    footer on this screen, and pinning it would have separated it from the field it submits.
   *
   * The hero is still the only block that YIELDS height, and only when there is not enough: it is
   * clamped so that the brand block and the form always get their designed heights first, and the
   * ScrollView carries anything a genuinely short viewport still cannot fit. At and above the
   * reference height the clamp is inert, so the frame stays pixel-exact.
   *
   * Nothing else scales — typography, the field, the CTA, the footer and every gap keep their
   * Figma values at every width.
   */
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableHeight = windowHeight - insets.top - insets.bottom;
  /**
   * `250:2384` closes with 16pt of column padding. The legal footer is the last thing on the
   * screen, so on a handset the gesture strip decides the real figure — see `useBottomGutter`.
   */
  const bottomGutter = useBottomGutter(lightTheme.space.lg);
  const heroHeight = Math.max(
    HERO_MIN_HEIGHT,
    Math.min(
      windowWidth / HERO_ASPECT_RATIO,
      availableHeight - HERO_GAP - COLUMN_CHROME - BRAND_BLOCK_HEIGHT - FORM_BLOCK_HEIGHT,
    ),
  );

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
          {/* `250:2434` — full-bleed, at the node's own aspect ratio. Clipped, never
              letterboxed, and the only block that yields height on a short viewport. */}
          <View style={[styles.hero, { height: heroHeight }]}>
            <Image
              source={AUTH_HERO}
              style={styles.heroImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </View>

          {/* `250:2384` — the padded content column the brand block and the form sit in. */}
          <View style={[styles.column, { paddingBottom: bottomGutter }]}>
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

            {/* `250:2406` — a flex block: the form group centred in whatever height is left
                (`250:2407`'s `my-auto`), the legal footer at its end. */}
            <View style={styles.form}>
              <View style={styles.formCentre}>
                <View style={styles.formInner}>
                  <View style={styles.labels}>
                    <Text variant="title" color="textPrimary">
                      {login.title}
                    </Text>
                    <Text variant="bodyQuiet" color="textSecondary">
                      {login.subtitle}
                    </Text>
                  </View>

                  {/* `250:2415` — a 43pt bar at a **15pt** radius, outlined 1pt in `#FFD600`. */}
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
                    <Text
                      variant="headingCtaTight"
                      color={ready ? 'textOnAccent' : 'textCtaDisabled'}
                    >
                      {login.ctaLabel}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* `250:2423` — Regular 9/13.5; both links underlined, as drawn. Pinned to the
                  BOTTOM of the form block, which is what stops spare height collecting beneath
                  it as blank white (task §8). */}
              <View style={styles.legal}>
                <Text variant="micro" color="textSecondary" align="center">
                  {login.legalLead}
                </Text>
                <Text variant="micro" color="textPrimary" align="center">
                  <Text
                    variant="micro"
                    color="textPrimary"
                    style={styles.link}
                    onPress={onOpenTerms}
                  >
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
  /**
   * `250:2434` — a FULL-BLEED band, edge to edge and flush under the status bar, with no padding
   * of its own. The 6pt inset the superseded file carried came from `225:1640` in an older file
   * and is not drawn here; it squeezed the box and forced a crop the design does not have.
   *
   * The height is supplied by the component — the node's aspect ratio wherever the viewport can
   * afford it, clamped down on a short one.
   */
  hero: { overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  /**
   * `250:2384` — the content column: 16pt padding, 16pt between the brand block and the form,
   * and `flex: 1` so the form block below it receives the viewport's spare height instead of
   * leaving it stacked under the footer.
   */
  column: {
    flex: 1,
    marginTop: HERO_GAP,
    padding: lightTheme.space.lg,
    gap: lightTheme.space.lg,
  },
  /** `250:2400` — 167pt, px 12 / py 6. */
  brand: {
    height: BRAND_BLOCK_HEIGHT,
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingVertical: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.md,
  },
  /** `225:1630` — 134 × 93. */
  logo: { width: 134, height: 93 },
  /** `225:1639` — a 320pt measure, 2pt between the two lines. */
  tagline: { width: 320, gap: lightTheme.space.xxs, alignItems: 'center' },
  /**
   * `250:2406` — `div.flex-1`, 228 tall at the reference, px 4 / py 6.
   *
   * `minHeight` rather than `height`, plus `flex: 1`: at the reference it measures exactly 228,
   * and on a taller viewport it ABSORBS the spare height rather than letting it fall through to
   * the bottom of the scroll as blank white (task §8).
   */
  form: {
    flex: 1,
    minHeight: FORM_BLOCK_HEIGHT,
    gap: LEGAL_GAP,
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
  },
  /**
   * `250:2407` — `my-auto`: the form group is CENTRED in the height left above the footer.
   *
   * At the reference this box is exactly 156 tall and holds a 156pt group, so centring is a no-op
   * and the frame measures as drawn. Every point of extra height a bigger handset brings is split
   * evenly above and below the group, which is what the auto margins mean.
   */
  formCentre: { flex: 1, justifyContent: 'center' },
  /** `250:2408` — 16pt between the labelled field group and the CTA. */
  formInner: { gap: lightTheme.space.lg },
  /** `250:2410` — 6pt between "Login" and its subtitle. */
  labels: { gap: lightTheme.space.s6 },
  /** `250:2415` — h 43, radius **15** (was 24 in the superseded file), 1pt `#FFD600`. */
  field: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: lightTheme.space.md,
    borderRadius: lightTheme.radius.r15,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfaceCta,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `250:2416` — the dial cell is closed by a 1.778pt `#FFE666` rule. */
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
  /**
   * `250:2421` — a fixed 34pt bar at a 16pt radius, carrying a `0 0 2 rgba(0,0,0,0.15)` drop
   * shadow. The shadow is new in `fsgGIC4c6DJulb64TTt9yg`; iOS reads `shadow*`, Android
   * `elevation`, so both are emitted.
   */
  cta: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceCta,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  /**
   * `275:4690` — the file's one drawn disabled CTA. It keeps the active bar's lift and swaps only
   * the fill, so this state no longer flattens the shadow or reaches for the slate ramp.
   */
  ctaDisabled: { backgroundColor: lightTheme.colors.surfaceCtaDisabled },
  pressed: { opacity: 0.85 },
  /** `250:2423` — 39pt, 2pt between the two lines. */
  /** `250:2423` — 39pt, 2pt between the two lines, held at the END of the form block. */
  legal: {
    minHeight: LEGAL_BLOCK_HEIGHT,
    flexShrink: 0,
    gap: lightTheme.space.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { textDecorationLine: 'underline' },
});
