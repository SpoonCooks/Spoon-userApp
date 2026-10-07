import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import { keyframedStyle, useTimeline } from '@ui/motion/keyframes';
import type { MotionPart } from '@ui/motion/keyframes';

import { HERO } from '../assets';
import { C, F } from '../theme';
import { HERO_LOOP_MS, HERO_REST_PROGRESS, HERO_TRACKS } from './heroTimeline';

/**
 * `1255:2991` — the 104pt cook-at-the-stove scene, animated as in Figma: on an 8s loop the cook
 * walks in, lights the stove, stirs while the pan tosses and steam rises, and walks off right.
 *
 * Each moving part is its own layer, rasterised at 3× from the scene's vectors with a 20pt
 * transparent margin (`assets/figma/home2/hero/`), placed at its Figma box and turned about that
 * box's centre — the export's default origin, which is where the art puts each shoulder and hip.
 * The 370pt stage keeps its right edge on the card's, as the flattened art did, so a narrower
 * card trims the left. The headline is live text over it. With Reduce Motion on, the scene holds
 * its resting frame: the cook at the lit stove.
 */
const PAD = 20;
const STAGE = { width: 370, height: 104 } as const;
/** `1255:3064` Kitchen and `1255:3117` Cook, in the scene's frame. */
const KITCHEN = { x: 248, y: 42 } as const;
const COOK = { x: 164, y: -3, width: 107.3, height: 145 } as const;

export function HeroBanner() {
  const progress = useTimeline({
    durationMs: HERO_LOOP_MS,
    loop: true,
    restAt: HERO_REST_PROGRESS,
  });
  const motion = useMemo(() => {
    const T = HERO_TRACKS;
    const at = (part: MotionPart) => keyframedStyle(progress, part);
    return {
      glow: at({ opacity: T.flameGlow.opacity, scale: T.flameGlow.scale }),
      flame: at({ opacity: T.flame.opacity, scaleY: T.flame.scaleY }),
      pan: at({ translateY: T.pan.translateY, rotate: T.pan.rotate }),
      food: at({ translateY: T.food.translateY, rotate: T.food.rotate }),
      wisps: T.wisps.map((wisp) => at({ opacity: wisp.opacity, translateY: wisp.translateY })),
      cook: at({
        translateX: T.cook.translateX,
        translateY: T.cook.translateY,
        rotate: T.cook.rotate,
      }),
      armBack: at({ rotate: T.armBack }),
      legBack: at({ rotate: T.legBack }),
      legFront: at({ rotate: T.legFront }),
      armFront: at({ rotate: T.armFront }),
    };
  }, [progress]);

  return (
    <View style={styles.wrap}>
      <View style={styles.scene} testID="home-hero">
        <View style={styles.stage} pointerEvents="none">
          <Image source={HERO.bg} style={styles.fill} />

          <Layer
            box={[KITCHEN.x + 16, KITCHEN.y + 15, 44, 14]}
            source={HERO.flameGlow}
            style={motion.glow}
          />
          <Layer
            box={[KITCHEN.x + 21, KITCHEN.y + 12, 34, 16]}
            source={HERO.flame}
            style={motion.flame}
          />
          <Layer box={[KITCHEN.x + 16, KITCHEN.y + 1, 74, 18]} source={HERO.pan} style={motion.pan}>
            {/* `1255:3097` — the food sits behind the pan body and tosses higher. */}
            <Layer box={[4, 0, 40, 8]} source={HERO.food} style={motion.food} />
          </Layer>
          {/* `1255:3113` Steam — three wisps 14 apart. */}
          {HERO.wisps.map((source, index) => (
            <Layer
              key={index}
              box={[KITCHEN.x + 20 + index * 14, KITCHEN.y - 27, 3.155, 24]}
              source={source}
              style={motion.wisps[index]}
            />
          ))}

          <Animated.View style={[styles.cook, motion.cook]}>
            <Layer box={[39.15, 20.3, 20.3, 87]} source={HERO.armBack} style={motion.armBack} />
            <Layer box={[47.85, 69.6, 23.2, 75.4]} source={HERO.legBack} style={motion.legBack} />
            <Layer box={[58, 69.6, 23.2, 75.4]} source={HERO.legFront} style={motion.legFront} />
            <Layer box={[0, 0, COOK.width, COOK.height]} source={HERO.body} />
            <Layer box={[63.8, 19.3, 20.3, 87]} source={HERO.armFront} style={motion.armFront} />
            <Layer box={[74, 34, 2, 2]} source={HERO.eyeBall} />
          </Animated.View>
        </View>

        <Text style={styles.headline}>
          All your meal worries now <Text style={styles.underline}>gone</Text>!
        </Text>
      </View>
    </View>
  );
}

/** One layer at its Figma box `[x, y, width, height]`; the art overhangs it by `PAD` all round. */
function Layer({
  box: [x, y, width, height],
  source,
  style,
  children,
}: {
  readonly box: readonly [number, number, number, number];
  readonly source: ImageSourcePropType;
  readonly style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>> | undefined;
  readonly children?: ReactNode;
}) {
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, width, height }, style]}>
      {children}
      <Image
        source={source}
        style={{
          position: 'absolute',
          left: -PAD,
          top: -PAD,
          width: Math.ceil(width + 2 * PAD),
          height: Math.ceil(height + 2 * PAD),
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 12 },
  scene: {
    height: STAGE.height,
    borderRadius: 24,
    backgroundColor: C.soft,
    overflow: 'hidden',
  },
  stage: { position: 'absolute', right: 0, top: 0, width: STAGE.width, height: STAGE.height },
  fill: { position: 'absolute', left: 0, top: 0, width: STAGE.width, height: STAGE.height },
  cook: { position: 'absolute', left: COOK.x, top: COOK.y, width: COOK.width, height: COOK.height },
  headline: {
    position: 'absolute',
    left: 16,
    top: 30,
    width: 154,
    fontFamily: F.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: C.text,
  },
  underline: { textDecorationLine: 'underline' },
});
