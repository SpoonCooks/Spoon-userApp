import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { formatPaise } from '@core/format';

import { ART } from '../assets';
import { liquidHeight, showsMrp, spokenDuration } from '../state/durations';
import type { DurationOption } from '../types';
import { C, F, SHADOW_PILL, SHADOW_SOFT } from '../theme';

/** `1555:10725` default tile and `1555:10508` focused tile. */
const TILE = { width: 100, height: 130 };
const FOCUSED = { width: 128, height: 160 };
const GAP = 12;
/** Distance between the left edges of two neighbouring tiles. */
const STEP = TILE.width + GAP;
/** Skeleton count while pricing loads, per the carousel's dev note. */
const SKELETONS = 6;

export interface DurationCarouselProps {
  readonly durations: readonly DurationOption[];
  readonly focusedId: string;
  /** The booking choice. It is drawn (lime + check) only while that tile is also centred. */
  readonly selectedId: string | null;
  /** Whether each tile can be booked in the current mode. */
  readonly isAvailable: (duration: DurationOption) => boolean;
  readonly status: 'ready' | 'loading' | 'error';
  /** Snapping reports a new focus; it does not select. */
  readonly onFocus: (id: string) => void;
  /** A tap selects (and centres) the tile. */
  readonly onSelect: (id: string) => void;
  /** A tap on an unavailable tile (the screen shows a toast). */
  readonly onPressUnavailable: (duration: DurationOption) => void;
  readonly onRetry: () => void;
}

/**
 * `1555:10863` "Duration carousel/ selected" — a 176pt strip of "liquid" tiles and a page
 * indicator (one dot per tile, the focused one a 12pt pill; tapping a dot centres its tile).
 *
 * The focused tile is always centred: the track is padded by half the viewport less half the
 * focused tile, so focusing tile `i` scrolls to `i × 112` — "1 hr" focused puts the first tile at
 * x −87, as drawn. Snapping only lands on bookable tiles. The size swap between Default and
 * Focused animates over ~150 ms, or swaps instantly with Reduce Motion on.
 */
export function DurationCarousel({
  durations,
  focusedId,
  selectedId,
  isAvailable,
  status,
  onFocus,
  onSelect,
  onPressUnavailable,
  onRetry,
}: DurationCarouselProps) {
  const { width: screen } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const reduceMotion = useReduceMotion();
  const index = Math.max(
    0,
    durations.findIndex((d) => d.id === focusedId),
  );
  const inset = (screen - FOCUSED.width) / 2;

  useEffect(() => {
    scroll.current?.scrollTo({ x: index * STEP, animated: !reduceMotion });
  }, [index, reduceMotion]);

  const animate = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.create(150, 'easeInEaseOut', 'scaleXY'));
    }
  };

  const focus = (id: string) => {
    if (id === focusedId) return;
    animate();
    onFocus(id);
  };

  /**
   * Snap offsets only list bookable tiles, but iOS also treats the end of the list as one, and a
   * drag without momentum skips snapping. So wherever the scroll rests, settle on the nearest
   * bookable tile and centre it.
   */
  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const landed = Math.round(e.nativeEvent.contentOffset.x / STEP);
    const next = nearestAvailableIndex(landed);
    if (next === null) return;
    const option = durations[next]!;
    if (next * STEP !== e.nativeEvent.contentOffset.x) {
      scroll.current?.scrollTo({ x: next * STEP, animated: !reduceMotion });
    }
    focus(option.id);
  };

  const nearestAvailableIndex = (from: number): number | null => {
    for (let step = 0; step < durations.length; step += 1) {
      for (const i of [from - step, from + step]) {
        const option = durations[i];
        if (option !== undefined && isAvailable(option)) return i;
      }
    }
    return null;
  };

  if (status !== 'ready') {
    return (
      <View style={styles.wrap}>
        <View style={[styles.carousel, styles.placeholderRow, { paddingLeft: inset - 2 * STEP }]}>
          {status === 'loading' ? (
            Array.from({ length: SKELETONS }, (_, i) => (
              <View
                key={i}
                testID="duration-skeleton"
                style={[styles.skeleton, i === 2 ? FOCUSED : TILE]}
              />
            ))
          ) : (
            <View style={[styles.errorBox, { marginLeft: 2 * STEP - inset + 16 }]}>
              <Text style={styles.errorText}>Couldn’t load prices</Text>
              <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
                <Text style={styles.retryLabel}>Retry</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: index * STEP, y: 0 }}
        snapToOffsets={durations.flatMap((d, i) => (isAvailable(d) ? [i * STEP] : []))}
        decelerationRate="fast"
        onMomentumScrollEnd={onSettle}
        onScrollEndDrag={(e) => {
          // No momentum means no momentum-end event; settle here instead.
          if (Math.abs(e.nativeEvent.velocity?.x ?? 0) < 0.05) onSettle(e);
        }}
        contentContainerStyle={[styles.track, { paddingHorizontal: inset }]}
        style={styles.carousel}
        accessibilityRole="radiogroup"
        accessibilityLabel="Duration"
      >
        {durations.map((d) => {
          const available = isAvailable(d);
          return (
            <Tile
              key={d.id}
              option={d}
              focused={d.id === focusedId}
              selected={d.id === selectedId}
              available={available}
              onPress={() => {
                if (!available) {
                  onPressUnavailable(d);
                  return;
                }
                // Selecting brings the tile to the front (the screen focuses it with the choice).
                animate();
                onSelect(d.id);
              }}
            />
          );
        })}
      </ScrollView>
      <View style={styles.dots}>
        {durations.map((d) => (
          <Pressable
            key={d.id}
            accessibilityRole="button"
            accessibilityLabel={`Show ${spokenDuration(d.minutes)}`}
            hitSlop={6}
            disabled={!isAvailable(d)}
            onPress={() => focus(d.id)}
          >
            <View style={d.id === focusedId ? styles.dotActive : styles.dot} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduce(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);
  return reduce;
}

type Tone = 'default' | 'focused' | 'selected' | 'unavailable';

/** Liquid gradients per state — `1555:10728`, `1555:10533`, `1555:10607`, `1555:10794`. */
const LIQUID: Record<Tone, readonly [string, string, ...string[]]> = {
  default: [C.tint, '#FFF3B3', C.soft],
  focused: [C.brand, '#FFDE33', C.tint],
  selected: [C.lime, '#E2FF68', C.limeSoft],
  unavailable: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.035)', 'rgba(0,0,0,0.02)'],
};

/**
 * One duration. Side tiles (`1555:10724`) have Default and Unavailable only; the centred tile
 * (`1555:10507`) adds Selected — lime liquid and a check. A selected tile scrolled off-centre is
 * drawn Default (the design has no side Selected variant); the CTA names it instead.
 */
function Tile({
  option,
  focused,
  selected,
  available,
  onPress,
}: {
  option: DurationOption;
  focused: boolean;
  selected: boolean;
  available: boolean;
  onPress: () => void;
}) {
  const tone: Tone = !available
    ? 'unavailable'
    : focused && selected
      ? 'selected'
      : focused
        ? 'focused'
        : 'default';
  const surface = !available
    ? focused
      ? ART.tileSurfaceFocusedUnavailable
      : ART.tileSurfaceUnavailable
    : tone === 'selected'
      ? ART.tileSurfaceSelected
      : focused
        ? ART.tileSurfaceFocused
        : ART.tileSurface;

  const spoken = [
    spokenDuration(option.minutes),
    formatPaise(option.pricePaise),
    option.serves === undefined
      ? null
      : `serves ${option.serves.dishes} dishes for ${option.serves.people} people`,
    option.mostBooked === true ? 'most booked' : null,
    !available ? 'unavailable' : selected ? 'selected' : null,
  ]
    .filter((part) => part !== null)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={spoken}
      accessibilityState={{ checked: selected, disabled: !available }}
      onPress={onPress}
      // The shadow sits on the outer box: iOS clips a shadow drawn by an `overflow: hidden` view.
      style={[
        styles.shadowBox,
        focused ? FOCUSED : TILE,
        !available ? null : focused ? SHADOW_PILL : SHADOW_SOFT,
      ]}
    >
      <View
        style={[
          styles.tile,
          focused ? styles.tileFocused : styles.tileDefault,
          !available ? styles.tileUnavailable : null,
        ]}
      >
        <View
          style={[
            styles.liquid,
            focused ? styles.liquidFocused : null,
            { height: liquidHeight(option.minutes, focused) },
          ]}
        >
          <LinearGradient colors={LIQUID[tone]} locations={[0, 0.6, 1]} style={styles.liquidBody} />
          <Image source={surface} style={styles.surface} resizeMode="stretch" />
        </View>
        {available && option.mostBooked === true ? (
          <View style={[styles.badge, focused ? styles.badgeFocused : null]}>
            <Text style={styles.badgeText}>Most booked</Text>
          </View>
        ) : null}
        <Text
          style={[
            focused ? styles.titleFocused : styles.title,
            !available ? styles.titleUnavailable : null,
          ]}
        >
          {option.label}
        </Text>
        {available ? (
          <View style={styles.priceRow}>
            <Text style={focused ? styles.priceFocused : styles.price}>
              {formatPaise(option.pricePaise)}
            </Text>
            {showsMrp(option) && option.mrpPaise !== null ? (
              <Text style={styles.mrp}>{formatPaise(option.mrpPaise)}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.unavailable}>Unavailable</Text>
        )}
        {tone === 'selected' ? <Image source={ART.selectedCheck} style={styles.check} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12, width: '100%' },
  carousel: { height: 176, width: '100%', flexGrow: 0 },
  track: { alignItems: 'center', gap: GAP, paddingVertical: 12 },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  skeleton: { borderRadius: 16, backgroundColor: C.surfaceDisabled },
  errorBox: {
    width: 370,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: C.surfaceDisabled,
  },
  errorText: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: C.textSecondary },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: C.brand,
  },
  retryLabel: { fontFamily: F.bold, fontSize: 14, lineHeight: 20, color: C.text },
  shadowBox: { borderRadius: 16, backgroundColor: C.base },
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: C.base,
    overflow: 'hidden',
  },
  tileDefault: { gap: 4, padding: 8 },
  tileFocused: {
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.textDisabled,
  },
  /** Unavailable tiles sit on `rgba(0,0,0,0.03)` with no elevation (`1555:10791`). */
  tileUnavailable: { backgroundColor: C.surfaceDisabled },
  liquid: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  /** `Level` is inset −1 on the focused tile, so its liquid runs under the border. */
  liquidFocused: { left: -1, right: -1, bottom: -1 },
  liquidBody: { position: 'absolute', top: 9, left: 0, right: 0, bottom: 0 },
  surface: { position: 'absolute', top: 0, left: -10, right: -10, height: 18 },
  title: {
    alignSelf: 'stretch',
    fontFamily: F.bold,
    fontSize: 20,
    lineHeight: 28,
    color: C.text,
    textAlign: 'center',
  },
  titleFocused: {
    alignSelf: 'stretch',
    fontFamily: F.bold,
    fontSize: 26,
    lineHeight: 32,
    color: C.text,
    textAlign: 'center',
  },
  titleUnavailable: { color: C.textDisabled },
  unavailable: {
    fontFamily: F.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: C.textSecondary,
    textAlign: 'center',
  },
  priceRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  price: { fontFamily: F.semibold, fontSize: 12, lineHeight: 16, color: C.text },
  priceFocused: { fontFamily: F.semibold, fontSize: 16, lineHeight: 24, color: C.text },
  mrp: {
    fontFamily: F.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: C.text,
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  /** White on a side tile (`1555:10730`), `#FFE666` on the centred one (`1555:10513`). */
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: C.base,
    overflow: 'hidden',
  },
  badgeFocused: { backgroundColor: C.tint },
  badgeText: {
    fontFamily: F.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: C.text,
    textAlign: 'center',
  },
  /** `1555:10611` — 20pt, 4 from the top-right corner of the 128pt tile (inside its border). */
  check: { position: 'absolute', top: 3, right: 3, width: 20, height: 20 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 9999, backgroundColor: C.textDisabled },
  dotActive: { width: 12, height: 4, borderRadius: 9999, backgroundColor: C.text },
});
