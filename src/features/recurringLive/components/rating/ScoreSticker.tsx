import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '@ui';

import { formatRating } from '../../data/rating';
import type { RatingTier, VisitRatingValue } from '../../data/rating';
import { RATING_ART } from './assets';

/**
 * The score sticker beside the mood headline — 96pt (`1501:6705` / `1501:7048` / `1501:7344` …),
 * plus the idle card's 112pt "?" sticker (`1501:6638`).
 *
 *   loved          `1501:6719` scallop at 0,0; 12pt sparkle at 82,0
 *   magic          `1501:7062` 104pt burst at −4,−4; sparkles 12pt at 82,0 and 8pt at −6,80
 *   below par      `1501:7362` blob at 0,4; the numeral's box centred 49.12 down
 *   disappointing  `1501:7508` blob at 0,4; centred 50.24 down
 *   very poor      `1501:7657` blob at 0,4; centred 51.36 down
 *
 * The idle sticker carries the file's only looping motion that reads cleanly in Figma's own
 * timeline (`1501:6628`, a 2 s cohort): the "?" bobs up 5pt and tilts 8° at 40 %, settles at 80 %
 * and ends 2.5pt up at −4°. The ring's slow turn and the sparkle's spin end on a visible jump in
 * the Figma loop, so they're left still.
 */

const LOOP_MS = 2000;

interface BlobSpec {
  readonly source: ImageSourcePropType;
  readonly width: number;
  readonly height: number;
  /** Where the numeral's 96pt box is centred, measured from the sticker's top. */
  readonly centreY: number;
}

const BLOBS: Partial<Record<RatingTier, BlobSpec>> = {
  belowPar: { source: RATING_ART.blobBelowPar, width: 87, height: 72, centreY: 49.12 },
  disappointing: {
    source: RATING_ART.blobDisappointing,
    width: 88,
    height: 68,
    centreY: 50.24,
  },
  veryPoor: { source: RATING_ART.blobVeryPoor, width: 78, height: 68, centreY: 51.36 },
};

export interface ScoreStickerProps {
  readonly tier: Exclude<RatingTier, 'idle'>;
  readonly value: VisitRatingValue;
  readonly testID: string;
}

export function ScoreSticker({ tier, value, testID }: ScoreStickerProps) {
  const blob = BLOBS[tier];
  const centreY = blob?.centreY ?? 48;

  return (
    <View style={styles.sticker} testID={testID}>
      {tier === 'loved' ? <Image source={RATING_ART.scallopHigh} style={styles.scallop} /> : null}
      {tier === 'magic' ? <Image source={RATING_ART.burstTop} style={styles.burst} /> : null}
      {blob ? (
        <Image
          source={blob.source}
          style={[styles.blob, { width: blob.width, height: blob.height }]}
        />
      ) : null}
      <View style={[styles.numeral, { top: centreY - 48 }]}>
        <Text variant="spoonDisplayLarge" align="center">
          {formatRating(value)}
        </Text>
      </View>
      {tier === 'loved' ? (
        <Image source={RATING_ART.sparkleHigh} style={styles.sparkleTopRight} />
      ) : null}
      {tier === 'magic' ? (
        <>
          <Image source={RATING_ART.sparkleTopLarge} style={styles.sparkleTopRight} />
          <Image source={RATING_ART.sparkleTopSmall} style={styles.sparkleBottomLeft} />
        </>
      ) : null}
    </View>
  );
}

/** `1501:6638` — the idle 112pt sticker: dashed ring, bobbing "?", two sparkles. */
export function IdleSticker({ testID }: { readonly testID: string }) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: LOOP_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: [0, -5, 0, -2.5],
    easing: Easing.inOut(Easing.ease),
  });
  const rotate = progress.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: ['0rad', '0.14rad', '0rad', '-0.07rad'],
    easing: Easing.inOut(Easing.ease),
  });

  return (
    <View style={styles.idle} testID={testID}>
      <Image source={RATING_ART.idleRing} style={styles.idleRing} />
      <Animated.View style={[styles.idleMark, { transform: [{ translateY }, { rotate }] }]}>
        <Text variant="ratingPlaceholder" color="textRatingPlaceholder" align="center">
          ?
        </Text>
      </Animated.View>
      <Image source={RATING_ART.idleSparkleLarge} style={styles.idleSparkleLarge} />
      <Image source={RATING_ART.idleSparkleSmall} style={styles.idleSparkleSmall} />
    </View>
  );
}

const styles = StyleSheet.create({
  sticker: { width: 96, height: 96 },
  scallop: { position: 'absolute', left: 0, top: 0, width: 96, height: 96 },
  /** `1501:7062` — 104pt, 4pt proud of the sticker on every side. */
  burst: { position: 'absolute', left: -4, top: -4, width: 104, height: 104 },
  /** `1501:7362` … — the blob sits 4pt down; its size is the export box. */
  blob: { position: 'absolute', left: 0, top: 4 },
  numeral: {
    position: 'absolute',
    left: 0,
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleTopRight: { position: 'absolute', left: 82, top: 0, width: 12, height: 12 },
  sparkleBottomLeft: { position: 'absolute', left: -6, top: 80, width: 8, height: 8 },
  idle: { width: 112, height: 112 },
  /** `1501:6642` — 104pt at 4,4. */
  idleRing: { position: 'absolute', left: 4, top: 4, width: 104, height: 104 },
  /** `1501:6655` — the 40/28 "?" centred on the 112 box. */
  idleMark: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleSparkleLarge: { position: 'absolute', left: 96, top: 2, width: 14, height: 14 },
  idleSparkleSmall: { position: 'absolute', left: 2, top: 90, width: 8, height: 8 },
});
