import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '@ui';
import { lightTick } from '@ui/motion/haptics';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import { visitDemoModel } from '../../data/visit';
import type { VisitPrepData, VisitPrepItem, VisitPrepKey, VisitPrepReady } from '../../data/visit';
import {
  VISIT_DISH_GLYPH,
  VISIT_PREP_CHECK_OFF,
  VISIT_PREP_CHECK_ON,
  VISIT_PREP_LOCK,
  VISIT_PREP_POT,
  VISIT_PREP_TOMATO,
} from './assets';

/**
 * `Prep checklist` — Figma component `1444:718`, drawn at Ready = 0 (`1441:1808`), 1
 * (`1441:1853`) and 3 (`1441:1898`).
 *
 * A Heading "Before the Cook arrives" with a counter pill, a three-segment progress bar (6 tall,
 * 4 apart, 3pt corners), three `Prep check` tiles (`1441:471`) and, under them, either the "why
 * it matters" caption or — at 3/3 — the all-set banner. What changes with the count is read off
 * the three frames:
 *
 * | ready | counter            | empty segment | checked tile's well |
 * |-------|--------------------|---------------|---------------------|
 * | 0     | `#FFEF99`          | `#FFF7CC`     | —                   |
 * | 1–2   | `#FFF7CC`          | `#FFEF99`     | lime `#ECFF9B`      |
 * | 3     | lime `#ECFF9B`     | —             | white               |
 *
 * A filled segment is `#E2FF68`. An unchecked tile has a 1.5pt DASHED `#FFEF99` edge and a
 * `#FFF7CC` well; a checked one a 1.5pt solid `#CFFF04` edge, the lime tick and "Done" in
 * full ink.
 *
 * Motion, per `1441:1981` "Note · Prep check motion" (all under 0.5s): a tapped tile squishes to
 * 96 % and springs back; the tick pops 0 → 120 % → 100 %; the matching segment fills left to
 * right; the tick's well washes to lime; the counter rolls up; at 3/3 six yellow/lime dots burst from the pill (once per mount)
 * and the banner slides in; un-ticking is a gentle 300ms. Each tap gives the note's light haptic
 * tick. Tick state is local UI state; nothing persists it.
 */
export interface BeforeArrivalCardProps {
  readonly prep?: VisitPrepData;
  /** How many checks start ticked, first to last (the frames' 0 / 1 / 3). */
  readonly initialReady?: VisitPrepReady | undefined;
  /** The checks already saved, by key; wins over `initialReady`. */
  readonly initialChecked?: readonly VisitPrepKey[] | undefined;
  readonly onChange?: ((checked: readonly VisitPrepKey[]) => void) | undefined;
  readonly testID?: string | undefined;
}

const DEMO = visitDemoModel('assigned');
const DEMO_PREP_FALLBACK: VisitPrepData = {
  title: '',
  items: [],
  idleHint: '',
  doneHint: '',
  why: '',
  allSet: '',
};

const GLYPHS: Record<VisitPrepKey, ImageSourcePropType> = {
  entry: VISIT_PREP_LOCK,
  groceries: VISIT_PREP_TOMATO,
  utensils: VISIT_PREP_POT,
};

/** `1441:1986` — the six burst dots, alternating the brand yellow and lime. */
const BURST = [0, 1, 2, 3, 4, 5].map((index) => {
  const angle = (index / 6) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * 22,
    y: Math.sin(angle) * 22,
    color: index % 2 === 0 ? lightTheme.colors.surfaceCta : lightTheme.colors.borderPositive,
  };
});

export function BeforeArrivalCard({
  prep = DEMO.prep ?? DEMO_PREP_FALLBACK,
  initialReady = 0,
  initialChecked,
  onChange,
  testID = 'visit-before-arrival',
}: BeforeArrivalCardProps) {
  const [checked, setChecked] = useState<ReadonlySet<VisitPrepKey>>(
    () => new Set(initialChecked ?? prep.items.slice(0, initialReady).map((item) => item.key)),
  );
  const ready = checked.size;
  const allSet = ready === prep.items.length;

  const toggle = (key: VisitPrepKey) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
    onChange?.(prep.items.filter((item) => next.has(item.key)).map((item) => item.key));
  };

  const counterColor: ColorToken = allSet
    ? 'surfacePositive'
    : ready === 0
      ? 'surfaceAccentStrong'
      : 'surfaceAccent';
  const emptySegment: ColorToken = ready === 0 ? 'surfaceAccent' : 'surfaceAccentStrong';

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        <Text variant="spoonHeading" color="textPrimary">
          {prep.title}
        </Text>
        <Counter ready={ready} total={prep.items.length} color={counterColor} testID={testID} />
      </View>

      <View style={styles.progress}>
        {prep.items.map((item, index) => (
          <Segment key={item.key} filled={index < ready} emptyColor={emptySegment} />
        ))}
      </View>

      <View style={styles.checks}>
        {prep.items.map((item) => (
          <PrepTile
            key={item.key}
            prep={prep}
            item={item}
            checked={checked.has(item.key)}
            allSet={allSet}
            onPress={() => toggle(item.key)}
            testID={`${testID}-${item.key}`}
          />
        ))}
      </View>

      {allSet ? (
        <AllSetBanner prep={prep} testID={testID} />
      ) : (
        <Text variant="spoonCaption" color="textSecondarySoft">
          {prep.why}
        </Text>
      )}
    </View>
  );
}

function Counter({
  ready,
  total,
  color,
  testID,
}: {
  readonly ready: number;
  readonly total: number;
  readonly color: ColorToken;
  readonly testID: string;
}) {
  const allSet = ready === total;
  const [roll] = useState(() => new Animated.Value(0));
  const [burst] = useState(() => new Animated.Value(0));
  const burstDone = useRef(allSet);
  const previous = useRef(ready);

  useEffect(() => {
    if (previous.current === ready) return;
    const up = ready > previous.current;
    previous.current = ready;
    // The number rolls in from below on a tick, from above on an undo.
    roll.setValue(up ? 1 : -1);
    Animated.timing(roll, {
      toValue: 0,
      duration: up ? 250 : 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    if (ready === total && !burstDone.current) {
      burstDone.current = true;
      burst.setValue(0);
      Animated.timing(burst, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [ready, total, roll, burst]);

  return (
    <View style={styles.counterWrap}>
      {BURST.map((dot, index) => (
        <Animated.View
          key={index}
          pointerEvents="none"
          style={[
            styles.dot,
            {
              backgroundColor: dot.color,
              opacity: burst.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] }),
              transform: [
                { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, dot.x] }) },
                { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, dot.y] }) },
              ],
            },
          ]}
        />
      ))}
      <View
        style={[styles.counter, { backgroundColor: lightTheme.colors[color] }]}
        testID={`${testID}-counter`}
      >
        <Animated.View
          style={{
            opacity: roll.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateY: roll.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) },
            ],
          }}
        >
          <Text variant="spoonCaptionStrong" color="textPrimary">
            {allSet ? `All set! ${ready}/${total}` : `${ready}/${total} ready`}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function Segment({
  filled,
  emptyColor,
}: {
  readonly filled: boolean;
  readonly emptyColor: ColorToken;
}) {
  const [fill] = useState(() => new Animated.Value(filled ? 1 : 0));

  useEffect(() => {
    Animated.timing(fill, {
      toValue: filled ? 1 : 0,
      duration: filled ? 280 : 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [filled, fill]);

  return (
    <View style={[styles.segment, { backgroundColor: lightTheme.colors[emptyColor] }]}>
      <Animated.View style={[styles.segmentFill, { transform: [{ scaleX: fill }] }]} />
    </View>
  );
}

function PrepTile({
  prep,
  item,
  checked,
  allSet,
  onPress,
  testID,
}: {
  readonly prep: VisitPrepData;
  readonly item: VisitPrepItem;
  readonly checked: boolean;
  readonly allSet: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  const [squish] = useState(() => new Animated.Value(1));
  const [tick] = useState(() => new Animated.Value(1));
  // `1441:1984` — the well's fill washes to lime on a tick (a colour, so not on the native driver).
  const [wash] = useState(() => new Animated.Value(checked ? 1 : 0));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.timing(wash, {
      toValue: checked ? 1 : 0,
      duration: checked ? 280 : 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    if (checked) {
      // `1441:1984` — the tick pops 0 → 120 % → 100 %.
      tick.setValue(0);
      Animated.sequence([
        Animated.timing(tick, {
          toValue: 1.2,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(tick, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
      ]).start();
    } else {
      tick.setValue(0.6);
      Animated.timing(tick, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [checked, tick, wash]);

  const press = () => {
    // `1441:1983` — a light haptic tick. Best effort: a device without a taptic engine, or a
    // simulator, simply has nothing to play.
    lightTick();
    // `1441:1983` — squish to 96 % and spring back (bouncy, ~400ms).
    squish.setValue(0.96);
    Animated.spring(squish, {
      toValue: 1,
      friction: 4,
      tension: 180,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  const wellColor = wash.interpolate({
    inputRange: [0, 1],
    outputRange: [
      lightTheme.colors.surfaceAccent,
      lightTheme.colors[allSet ? 'surface' : 'surfacePositive'],
    ],
  });

  return (
    <Animated.View style={[styles.tileWrap, { transform: [{ scale: squish }] }]}>
      <Pressable
        onPress={press}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={item.label}
        style={[styles.tile, checked ? styles.tileChecked : styles.tileIdle]}
        testID={testID}
      >
        <View style={styles.tileTop}>
          <Animated.View style={[styles.well, { backgroundColor: wellColor }]}>
            <Image source={GLYPHS[item.key]} style={styles.glyph24} />
          </Animated.View>
          <Animated.Image
            source={checked ? VISIT_PREP_CHECK_ON : VISIT_PREP_CHECK_OFF}
            style={[styles.glyph24, { transform: [{ scale: tick }] }]}
          />
        </View>
        <View style={styles.tileText}>
          <Text variant="spoonCaptionStrong" color="textPrimary">
            {item.label}
          </Text>
          <Text variant="spoonMicro" color={checked ? 'textPrimary' : 'textSecondarySoft'}>
            {checked ? prep.doneHint : prep.idleHint}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AllSetBanner({ prep, testID }: { readonly prep: VisitPrepData; readonly testID: string }) {
  const [enter] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
      testID={`${testID}-all-set`}
    >
      <View style={styles.bannerWell}>
        <Image source={VISIT_DISH_GLYPH} style={styles.glyph24} />
      </View>
      <Text variant="spoonCaptionStrong" color="textPrimary" style={styles.flex}>
        {prep.allSet}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /** `1444:718` — 12 between rows. */
  card: { gap: lightTheme.space.md },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterWrap: { alignItems: 'center', justifyContent: 'center' },
  /** `1444:497` — px 10 / py 4, pill. */
  counter: {
    paddingHorizontal: lightTheme.space.s10,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    overflow: 'hidden',
  },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  /** `1444:499` — three 6pt segments, 4 apart. */
  progress: { flexDirection: 'row', gap: lightTheme.space.xs },
  segment: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  segmentFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 3,
    backgroundColor: lightTheme.colors.surfaceVisitPrepDone,
    transformOrigin: 'left',
  },
  /** `1444:503` — 8 between tiles, all the height of the tallest. */
  checks: { flexDirection: 'row', alignItems: 'stretch', gap: lightTheme.space.sm },
  tileWrap: { flex: 1 },
  /** `1441:471` — p 12, 12 gap, 16pt corners, a 1.5pt edge. */
  tile: {
    flex: 1,
    gap: lightTheme.space.md,
    padding: lightTheme.space.md,
    borderWidth: 1.5,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  tileIdle: { borderStyle: 'dashed', borderColor: lightTheme.colors.borderAccent },
  tileChecked: { borderStyle: 'solid', borderColor: lightTheme.colors.borderPositive },
  tileTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  well: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  glyph24: { width: 24, height: 24 },
  tileText: { gap: lightTheme.space.xxs },
  /** `1444:713` — p 12, 8 gap, 16pt corners; a 32pt lime well. */
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    padding: lightTheme.space.md,
    borderRadius: lightTheme.radius.md,
  },
  bannerWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfacePositive,
  },
});
