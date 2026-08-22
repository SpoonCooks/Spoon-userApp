import { Image, Pressable, StyleSheet, View } from 'react-native';

import { PROFILE_AVATAR_GLYPH, Text, lightTheme } from '@ui';

import { PROFILE_INCOMPLETE_MARK } from '../assets';

/**
 * `222:1570` / `456:3467` — the profile-completion card on `6:663` Page 16.
 *
 * ## Why there is one component and not two
 *
 * The V8 file draws the two states as separate nodes, and they are byte-identical apart from
 * three things: the headline, the CTA label, and whether the `222:1582` exclamation mark is
 * present. Same `#FFF7CC` ground, same 15pt radius, same `0 0 2 rgba(0,0,0,0.07)` lift, same
 * 306 × 34 `#FFD600` CTA at a 16pt radius, same 241pt text column, same body copy — which is
 * "Share how your meal preferences, so that we can serve you better" in BOTH, typo and all. It is
 * the frame's own wording and is transcribed rather than corrected.
 *
 * ## Geometry
 *
 * The frame positions all three children absolutely inside a 338 × 145 card, so the offsets are
 * transcribed as padding rather than re-derived from a flow layout that would only approximate
 * them: mark at (13, 15.89), text column at (72, 15.89) with a 3pt gap, CTA at (16, 97) — which
 * is 97 − (15.89 + 55) = 26.11 below the text column.
 *
 * ## Reinstated, deliberately
 *
 * This card was REMOVED in the V7 pass on the reading that V0 had no completeness surface (the
 * prompt sat in the `V1s` section). The V8 file puts it back on `6:663` itself, between the
 * identity card and the tile grid, and the founder's ruling makes profile onboarding V0 — so the
 * removal is reversed. `profile.test.tsx` locks the new behaviour in place of the old.
 *
 * BOUNDARY: this renders a verdict. It does not compute one — `complete` is the SERVER's
 * `profileComplete` (task §9), passed straight through.
 */

export interface ProfileCompletionCardProps {
  /** The server's `GET /v1/me` verdict, never a client-side recomputation. */
  readonly complete: boolean;
  readonly onPress: () => void;
  readonly testID?: string;
}

/** `222:1577` / `456:3476`. */
const TITLE_INCOMPLETE = 'Your profile is incomplete';
const TITLE_COMPLETE = 'Your profile is completed';
/** `222:1579` / `456:3478` — identical on both variants, verbatim from the frame. */
const BODY = 'Share how your meal preferences, so that we can serve you better';
/** `222:1592` / `456:3480`. */
const CTA_INCOMPLETE = 'Complete profile';
const CTA_COMPLETE = 'View profile';

export function ProfileCompletionCard({
  complete,
  onPress,
  testID = complete ? 'profile-complete' : 'profile-incomplete',
}: ProfileCompletionCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.row}>
        {/* `222:1571` — a 47 × 32 box: the 32pt avatar disc, and on the INCOMPLETE variant the
            15 × 32 exclamation mark 32.11pt across. The complete variant drops the mark and keeps
            the box, so the text column does not shift between states. */}
        <View style={styles.mark}>
          <Image
            source={PROFILE_AVATAR_GLYPH}
            style={styles.avatar}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          {complete ? null : (
            <Image
              source={PROFILE_INCOMPLETE_MARK}
              style={styles.exclamation}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          )}
        </View>

        {/* `222:1574` — the 241pt text column, 12pt clear of the mark box. */}
        <View style={styles.copy}>
          <Text variant="title" color="textStrong" testID={`${testID}-title`}>
            {complete ? TITLE_COMPLETE : TITLE_INCOMPLETE}
          </Text>
          <Text variant="body" color="textQuiet">
            {BODY}
          </Text>
        </View>
      </View>

      {/* `222:1590` — a 34pt `#FFD600` bar at a 16pt radius with a Livvic Bold 16/24 label.

          NOT `Button size="form"`: that is the 30pt-radius CTA `338:4558` draws, and its label is
          Livvic BLACK. Two properties differ, and this bar is drawn inside a card rather than as a
          screen action, so it is its own control. */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={complete ? CTA_COMPLETE : CTA_INCOMPLETE}
        hitSlop={lightTheme.space.s10}
        style={({ pressed }) => [styles.cta, pressed ? styles.pressed : null]}
        testID={`${testID}-cta`}
      >
        <Text variant="headingBold" color="textOnAccent" align="center">
          {complete ? CTA_COMPLETE : CTA_INCOMPLETE}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `222:1570` — 338 × 145, `#FFF7CC`, r15, `0 0 2 rgba(0,0,0,0.07)`. */
  card: {
    borderRadius: lightTheme.radius.r15,
    backgroundColor: lightTheme.colors.surfaceAccent,
    paddingTop: 15.889,
    // 145 − (97 + 34) = 14. The card's own height is not pinned, so the tail is padding.
    paddingBottom: 14,
    ...lightTheme.elevation.disc,
  },
  /** The mark box starts 13 in; the copy column starts at 72, i.e. 47 + 12. */
  row: { flexDirection: 'row', paddingLeft: 13, gap: lightTheme.space.md },
  mark: { width: 47, height: 32 },
  /** `222:1572` — the 32pt disc, drawn from x 0 of the 47pt box. */
  avatar: { position: 'absolute', left: 0, top: 0, width: 32, height: 32 },
  /** `222:1582` — 15 × 32 at x 32.11. */
  exclamation: { position: 'absolute', left: 32.11, top: 0.34, width: 15, height: 32 },
  /** `222:1575` — a 241pt column at a 3pt gap. Not width-pinned: it flexes so a 320dp handset
      wraps the body line instead of clipping it. */
  copy: { flex: 1, gap: 3, paddingRight: lightTheme.space.lg },
  /** `222:1590` — 306 × 34 at (16, 97). 97 − 70.89 = 26.11 below the copy column. */
  cta: {
    height: 34,
    marginTop: 26.11,
    marginHorizontal: lightTheme.space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  pressed: { opacity: 0.8 },
});
