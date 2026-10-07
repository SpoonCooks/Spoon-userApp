import { useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@ui';
import { keyframedStyle, useTimeline } from '@ui/motion/keyframes';
import { lightTheme } from '@ui/theme/ThemeProvider';

import {
  RATING_CHIPS_NEGATIVE,
  RATING_CHIPS_NEGATIVE_PICKED,
  RATING_CHIPS_POSITIVE,
  RATING_CHIPS_POSITIVE_PICKED,
  RATING_SUBMIT_CALL_BACK,
  RATING_TIER_COPY,
  RATING_VISIT_FIXTURE,
  ratingTier,
} from '../../data/rating';
import type { RatingSupportKind, RatingTier, VisitRatingValue } from '../../data/rating';
import { CONFETTI_ART, RATING_ART } from './assets';
import {
  CONFETTI,
  IDLE_RING_TURN_MS,
  MIC_PULSE,
  NUDGE_SPARKLE,
  RATING_TIMELINE_MS,
  STICKER_MOTION,
} from './ratingMotion';
import { RatingStars } from './RatingStars';
import type { StarTap } from './RatingStars';
import { IdleSticker, ScoreSticker } from './ScoreSticker';

/**
 * Rate card — Figma `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`, components `Rate card / *`
 * (`1517:9293` … `1517:9303`). One self-contained card; the Visit details · Completed screen
 * drops it into its `ratingSlot`.
 *
 * Every drawn state is the SAME card at a different picked score, held as local UI state:
 *   null       `1501:6628` first look — 112pt "?" sticker, empty stars, scale captions, lime nudge
 *   4 – 5      `1501:6696` "Loved it!" — scallop, "What stood out?" chips, Tap to talk, Submit
 *   5+         `1501:6846` "Off the charts!" — lime wash + confetti, lime "Send 5+ to Rekha"
 *   3 – 3.5    `1501:7335` "Not quite there" — blob, "What fell short?", different-cook toggle
 *   2 – 2.5    `1501:7481` "That's disappointing" — call-back toggle ON, "Submit & request call back"
 *   1 – 1.5    `1501:7630` "That's not okay" — as 2–2.5
 *
 * Geometry, verbatim:
 *   card     370 wide in the frames (stretches to its slot here), r28, `0 8 24 rgba(0,0,0,0.08)`,
 *            p20 (idle: pt20 / pb24), 20pt between blocks; 5+ washes `#ECFF9B` → white by 55 %,
 *            1–3.5 wash `#F3F0E8` → white by 40 %
 *   cook     44pt photo, 12pt gap, SemiBold 14/20 over Caption 12/16 at 55 %, 2pt apart
 *   hero     idle: centred column, 12pt gap; rated: 96pt sticker, 16pt gap, Display 24/32 over
 *            Caption at 55 %, 4pt apart
 *   chips    label SemiBold 12/16 at 70 %, 10pt below it a wrap at 8pt; ticked chips pl10 / pr14
 *            / py8 with a 1.5pt edge (`#FFD600`, or black 25 % on a low score) on `#FFF7CC` with an
 *            18pt check 4pt from the label; unticked px14 / py8, 1pt black 25 % on white
 *   say more p8 (1–1.5: pr12), r24, 8pt gap; `#FFF7CC` (black 3 % on a low score); 44pt yellow mic
 *            disc, Body Strong over Micro at 55 %, two 40pt white discs (camera, video)
 *   support  pl12 / pr14 / py12, r18, 12pt gap; 36pt white disc, Caption Strong over Micro, 44 × 26
 *            toggle
 *   CTA      52 tall, r26, `#FFD600` (5+: `#CFFF04`), Spoon/Button
 *
 * Frame 6 (`1501:7575`) draws BOTH "What went wrong?" and, nested under it, a second "What fell
 * short?" label — a leftover from copying frame 5's block. Frame 7 draws only the first, so the
 * card draws only "What went wrong?" on 1–2.5.
 *
 * Motion follows Figma's 2 s timelines (`ratingMotion.ts`): the first look loops; a picked score
 * plays its entrance once, again on every new pick. Reduce Motion rests each on its final frame.
 *
 * STATIC: no submission or recording. Chips and toggles flip locally; `onSubmit` hands the
 * current picks up, `onTellUsMore` opens the "Tell us more" sheet.
 */

export interface RateVisitSubmission {
  readonly rating: VisitRatingValue;
  readonly chips: readonly string[];
  readonly support?: { readonly kind: RatingSupportKind; readonly on: boolean };
}

export interface RateVisitCardProps {
  readonly initialRating?: VisitRatingValue | null;
  readonly onSubmit?: (submission: RateVisitSubmission) => void;
  /** The say-more row — mic, camera or video — opens "Tell us more". */
  readonly onTellUsMore?: () => void;
  /** `1501:6636` — "Later" on the first look. */
  readonly onLater?: () => void;
  readonly testID?: string;
}

const LOW_TIERS: readonly RatingTier[] = ['belowPar', 'disappointing', 'veryPoor'];

export function RateVisitCard({
  initialRating = null,
  onSubmit,
  onTellUsMore,
  onLater,
  testID = 'rate-visit-card',
}: RateVisitCardProps) {
  const [rating, setRating] = useState<VisitRatingValue | null>(initialRating);
  const [positivePicked, setPositivePicked] = useState<readonly string[]>(
    RATING_CHIPS_POSITIVE_PICKED,
  );
  const [negativePicked, setNegativePicked] = useState<readonly string[]>(
    RATING_CHIPS_NEGATIVE_PICKED,
  );
  const [supportOn, setSupportOn] = useState<Partial<Record<RatingSupportKind, boolean>>>({});

  const tapRef = useRef<StarTap | null>(null);

  const tier = ratingTier(rating);
  const low = LOW_TIERS.includes(tier);
  const entrance = useTimeline({ durationMs: RATING_TIMELINE_MS, replayKey: rating });

  return (
    <View style={styles.shadow} testID={testID}>
      <View style={[styles.card, tier === 'idle' ? styles.cardIdle : null]}>
        {tier === 'magic' ? (
          <LinearGradient
            colors={[
              lightTheme.colors.surfaceRatingNudge,
              lightTheme.colors.surface,
              lightTheme.colors.surface,
            ]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {low ? (
          <LinearGradient
            colors={[
              lightTheme.colors.surfaceRatingPoorTop,
              lightTheme.colors.surface,
              lightTheme.colors.surface,
            ]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {tier === 'magic' ? (
          <View style={styles.confetti} pointerEvents="none">
            {CONFETTI.map((piece) => (
              <Animated.View
                key={piece.key}
                style={[
                  styles.confettiPiece,
                  { left: piece.x, top: piece.y, width: piece.width, height: piece.height },
                  keyframedStyle(entrance, piece.motion),
                ]}
              >
                {piece.art === 'image' ? (
                  <Image
                    source={CONFETTI_ART[piece.key]!}
                    style={[
                      styles.confettiArt,
                      { width: piece.width + 8, height: piece.height + 8 },
                    ]}
                  />
                ) : (
                  <View style={[styles.streamer, { backgroundColor: piece.art }]} />
                )}
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* `1501:6631` — cook row. */}
        <View style={styles.cook}>
          <Image source={RATING_ART.cookPhoto} style={styles.cookPhoto} />
          <View style={styles.cookText}>
            <Text variant="spoonBodyStrong" numberOfLines={1}>
              {RATING_VISIT_FIXTURE.title}
            </Text>
            <Text variant="spoonCaption" color="textRatingSubtle" numberOfLines={1}>
              {RATING_VISIT_FIXTURE.meta}
            </Text>
          </View>
          {tier === 'idle' ? (
            <Pressable
              onPress={onLater}
              accessibilityRole="button"
              hitSlop={lightTheme.space.md}
              testID={`${testID}-later`}
            >
              <Text variant="spoonCaptionStrong" color="textRatingQuiet">
                Later
              </Text>
            </Pressable>
          ) : null}
        </View>

        {rating === null || tier === 'idle' ? (
          <FirstLook rating={rating} onRate={setRating} tapRef={tapRef} testID={testID} />
        ) : (
          <RatedBody
            tier={tier}
            rating={rating}
            onRate={setRating}
            tapRef={tapRef}
            picked={low ? negativePicked : positivePicked}
            onTogglePick={(key) => {
              const update = (current: readonly string[]) =>
                current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
              if (low) setNegativePicked(update);
              else setPositivePicked(update);
            }}
            supportOn={supportOn}
            onToggleSupport={(kind, initial) =>
              setSupportOn((current) => ({ ...current, [kind]: !(current[kind] ?? initial) }))
            }
            onTellUsMore={onTellUsMore}
            onSubmit={onSubmit}
            clock={entrance}
            testID={testID}
          />
        )}
      </View>
    </View>
  );
}

/**
 * `1501:6628` — the first look, with its own clocks: the 2 s loop (the "?" bob, the nudge
 * sparkle, the 5+ wiggle) and the ring's endless turn. Both rest at their start under Reduce Motion.
 */
function FirstLook({
  rating,
  onRate,
  tapRef,
  testID,
}: {
  readonly rating: VisitRatingValue | null;
  readonly onRate: (value: VisitRatingValue) => void;
  readonly tapRef: MutableRefObject<StarTap | null>;
  readonly testID: string;
}) {
  const loop = useTimeline({ durationMs: RATING_TIMELINE_MS, loop: true, restAt: 0 });
  const spin = useTimeline({ durationMs: IDLE_RING_TURN_MS, loop: true, restAt: 0 });
  return (
    <>
      {/* `1501:6637` — idle hero. */}
      <View style={styles.idleHero}>
        <IdleSticker clock={loop} spin={spin} testID={`${testID}-sticker`} />
        <Text variant="spoonTitle" align="center">
          How was the food today?
        </Text>
        <Text variant="spoonCaption" color="textRatingSubtle" align="center">
          One tap! Your rating helps us assign you better cooks
        </Text>
      </View>

      {/* `1501:6660` — stars over the scale captions, 10pt apart. */}
      <View style={styles.idleInput}>
        <RatingStars
          value={rating}
          onChange={onRate}
          tapRef={tapRef}
          clock={loop}
          testID={`${testID}-stars`}
        />
        <View style={styles.scaleLabels}>
          <Text variant="spoonMicro" color="textSecondarySoft">
            Not great
          </Text>
          <Text variant="spoonMicro" color="textSecondarySoft">
            Single tap for 0.5. Fast double tap for full star
          </Text>
          <Text variant="spoonMicroStrong" color="textSecondarySoft">
            Amazing!
          </Text>
        </View>
      </View>

      {/* `1501:6689` — the 5+ nudge. */}
      <View style={styles.nudge}>
        <View style={styles.nudgeDisc}>
          <Animated.Image
            source={RATING_ART.nudgeSparkle}
            style={[styles.nudgeSparkle, keyframedStyle(loop, { rotate: NUDGE_SPARKLE })]}
          />
        </View>
        <Text variant="spoonCaption" style={styles.flex}>
          {'Blown away? Give a '}
          <Text variant="ratingCaptionBold">5+</Text>
          {`, it tells ${RATING_VISIT_FIXTURE.cookName} she went above & beyond to deliver that extra delight!`}
        </Text>
      </View>
    </>
  );
}

interface RatedBodyProps {
  readonly tier: Exclude<RatingTier, 'idle'>;
  readonly rating: VisitRatingValue;
  readonly onRate: (value: VisitRatingValue) => void;
  readonly tapRef: MutableRefObject<StarTap | null>;
  readonly picked: readonly string[];
  readonly onTogglePick: (key: string) => void;
  readonly supportOn: Partial<Record<RatingSupportKind, boolean>>;
  readonly onToggleSupport: (kind: RatingSupportKind, initial: boolean) => void;
  readonly onTellUsMore?: (() => void) | undefined;
  readonly onSubmit?: ((submission: RateVisitSubmission) => void) | undefined;
  /** The entrance, played on each new score. */
  readonly clock: Animated.Value;
  readonly testID: string;
}

function RatedBody({
  tier,
  rating,
  onRate,
  tapRef,
  picked,
  onTogglePick,
  supportOn,
  onToggleSupport,
  onTellUsMore,
  onSubmit,
  clock,
  testID,
}: RatedBodyProps) {
  const motion = STICKER_MOTION[tier];
  const copy = RATING_TIER_COPY[tier];
  const low = LOW_TIERS.includes(tier);
  const chips = low ? RATING_CHIPS_NEGATIVE : RATING_CHIPS_POSITIVE;
  const support = copy.support;
  const supportActive = support ? (supportOn[support.kind] ?? support.initiallyOn) : false;
  const submitLabel =
    support?.kind === 'callBack' && supportActive ? RATING_SUBMIT_CALL_BACK : copy.submit;

  return (
    <>
      {/* `1501:6704` — sticker + mood. */}
      <View style={styles.hero}>
        <ScoreSticker tier={tier} value={rating} clock={clock} testID={`${testID}-sticker`} />
        <View style={styles.mood}>
          <Animated.View style={keyframedStyle(clock, motion.headline)}>
            <Text variant="spoonDisplay">{copy.headline}</Text>
          </Animated.View>
          <Animated.View style={keyframedStyle(clock, motion.body)}>
            <Text variant="spoonCaption" color="textRatingSubtle">
              {copy.body}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* `1501:6758` — stars, no captions once rated. */}
      <RatingStars
        value={rating}
        onChange={onRate}
        tapRef={tapRef}
        clock={clock}
        testID={`${testID}-stars`}
      />

      {/* `1501:6807` — chips. */}
      <View style={styles.chipsBlock}>
        <Text variant="spoonCaptionStrong" color="textSecondary">
          {copy.chipsLabel}
        </Text>
        <View style={styles.chips}>
          {chips.map((chip) => {
            const on = picked.includes(chip.key);
            return (
              <Pressable
                key={chip.key}
                onPress={() => onTogglePick(chip.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[
                  styles.chip,
                  on ? styles.chipOn : styles.chipOff,
                  on && low ? styles.chipOnLow : null,
                ]}
                testID={`${testID}-chip-${chip.key}`}
              >
                {on ? <Image source={RATING_ART.check} style={styles.chipCheck} /> : null}
                <Text variant="spoonCaptionStrong">{chip.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* `1501:6828` — say more. */}
      <Pressable
        onPress={onTellUsMore}
        accessibilityRole="button"
        accessibilityLabel={copy.sayMoreTitle}
        style={[
          styles.sayMore,
          low ? styles.sayMoreLow : null,
          tier === 'veryPoor' ? styles.sayMoreWide : null,
        ]}
        testID={`${testID}-say-more`}
      >
        <Animated.View
          style={[styles.micDisc, low ? keyframedStyle(clock, { scale: MIC_PULSE }) : null]}
        >
          <Image source={RATING_ART.mic} style={styles.icon} />
        </Animated.View>
        <View style={styles.sayMoreText}>
          <Text variant="spoonBodyStrong" numberOfLines={1}>
            {copy.sayMoreTitle}
          </Text>
          <Text variant="spoonMicro" color="textRatingSubtle" numberOfLines={1}>
            {copy.sayMoreBody}
          </Text>
        </View>
        <View style={styles.mediaDisc}>
          <Image source={RATING_ART.camera} style={styles.icon} />
        </View>
        <View style={styles.mediaDisc}>
          <Image source={RATING_ART.video} style={styles.icon} />
        </View>
      </Pressable>

      {/* `1501:7471` / `1501:7619` — low-score support toggle. */}
      {support ? (
        <Pressable
          onPress={() => onToggleSupport(support.kind, support.initiallyOn)}
          accessibilityRole="switch"
          accessibilityState={{ checked: supportActive }}
          style={styles.support}
          testID={`${testID}-support`}
        >
          <View style={styles.supportDisc}>
            <Image
              source={support.kind === 'callBack' ? RATING_ART.phone : RATING_ART.restart}
              style={styles.icon}
            />
          </View>
          <View style={styles.supportText}>
            <Text variant="spoonCaptionStrong" numberOfLines={1}>
              {support.title}
            </Text>
            <Text variant="spoonMicro" color="textRatingSubtle" numberOfLines={1}>
              {support.body}
            </Text>
          </View>
          <Image
            source={supportActive ? RATING_ART.toggleOn : RATING_ART.toggleOff}
            style={styles.toggle}
          />
        </Pressable>
      ) : null}

      {/* `1501:6844` — CTA. */}
      <Pressable
        onPress={() =>
          onSubmit?.(
            support
              ? { rating, chips: picked, support: { kind: support.kind, on: supportActive } }
              : { rating, chips: picked },
          )
        }
        accessibilityRole="button"
        style={[styles.submit, tier === 'magic' ? styles.submitLime : null]}
        testID={`${testID}-submit`}
      >
        <Text variant="spoonButton">{submitLabel}</Text>
      </Pressable>
    </>
  );
}

const CARD_RADIUS = 28;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  /** `1517:9293` — `0 8 24 rgba(0,0,0,0.08)`, outside the clip so iOS keeps it. */
  shadow: {
    alignSelf: 'stretch',
    borderRadius: CARD_RADIUS,
    backgroundColor: lightTheme.colors.surface,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    padding: 20,
    gap: 20,
    alignItems: 'center',
  },
  /** `1517:9293` — the first look pads 24 at the bottom. */
  cardIdle: { paddingBottom: lightTheme.space.xl },
  /** `1501:6849` — 370 × 226 from the card's corner. */
  confetti: { position: 'absolute', left: 0, top: 0, width: 370, height: 226 },
  /** A piece at its box; a sparkle's art carries 4pt of margin round it. */
  confettiPiece: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  confettiArt: { position: 'absolute', left: -4, top: -4 },
  /** `1501:6961` — a 10 × 4 streamer, r2, centred in its turned box. */
  streamer: { width: 10, height: 4, borderRadius: 2 },
  cook: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
  },
  cookPhoto: { width: 44, height: 44 },
  cookText: { flex: 1, gap: lightTheme.space.xxs },
  idleHero: { alignSelf: 'stretch', alignItems: 'center', gap: lightTheme.space.md },
  idleInput: { alignSelf: 'stretch', alignItems: 'center', gap: lightTheme.space.s10 },
  scaleLabels: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  /** `1501:6689` — pl12 / pr14 / py10, r16, 10pt gap. */
  nudge: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s10,
    paddingLeft: lightTheme.space.md,
    paddingRight: 14,
    paddingVertical: lightTheme.space.s10,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceRatingNudge,
  },
  /** `1501:6690` — 28pt lime disc; the 14pt sparkle at 7,7. */
  nudgeDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: lightTheme.colors.surfaceRatingLime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeSparkle: { width: 14, height: 14 },
  hero: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.lg,
  },
  mood: { flex: 1, gap: lightTheme.space.xs },
  chipsBlock: { alignSelf: 'stretch', gap: lightTheme.space.s10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.pill,
  },
  /** `1501:6810` — ticked: pl10 / pr14, 1.5pt `#FFD600` on `#FFF7CC`. */
  chipOn: {
    paddingLeft: lightTheme.space.s10,
    paddingRight: 14,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.surfaceCta,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** `1501:7432` — on a low score the ticked edge is black 25 % instead. */
  chipOnLow: { borderColor: lightTheme.colors.textDisabledSoft },
  /** `1501:6818` — unticked: px14, 1pt black 25 % on white. */
  chipOff: {
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: lightTheme.colors.textDisabledSoft,
    backgroundColor: lightTheme.colors.surface,
  },
  chipCheck: { width: 18, height: 18 },
  /** `1501:6828` — p8, r24, 8pt gap on `#FFF7CC`. */
  sayMore: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    padding: lightTheme.space.sm,
    borderRadius: lightTheme.radius.lg,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** `1501:7448` — black 3 % on a low score. */
  sayMoreLow: { backgroundColor: lightTheme.colors.surfaceRatingQuiet },
  /** `1501:7742` — 1–1.5 pads 12 on the right. */
  sayMoreWide: { paddingRight: lightTheme.space.md },
  micDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: lightTheme.colors.surfaceCta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sayMoreText: { flex: 1, gap: lightTheme.space.xxs },
  mediaDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: lightTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 24, height: 24 },
  /** `1501:7471` — pl12 / pr14 / py12, r18, 12pt gap. */
  support: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    paddingLeft: lightTheme.space.md,
    paddingRight: 14,
    paddingVertical: lightTheme.space.md,
    borderRadius: 18,
  },
  supportDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: lightTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportText: { flex: 1, gap: lightTheme.space.xxs },
  toggle: { width: 44, height: 26 },
  /** `1501:6844` — 52 tall, r26. */
  submit: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 26,
    backgroundColor: lightTheme.colors.surfaceCta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLime: { backgroundColor: lightTheme.colors.surfaceRatingLime },
});
