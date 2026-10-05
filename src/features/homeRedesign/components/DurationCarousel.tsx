import { useEffect, useRef } from 'react';
import {
  Image,
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
import type { DurationOption } from '../types';
import { C, F, SHADOW_PILL, SHADOW_SOFT } from '../theme';

/** `1219:4394` default tile and `1219:4271` focused tile. */
const TILE = { width: 100, height: 130 };
const FOCUSED = { width: 128, height: 160 };
const GAP = 12;
/** Distance between the left edges of two neighbouring tiles. */
const STEP = TILE.width + GAP;
/** `1219:4273` — the focused tile's liquid is 53pt whatever the duration. */
const FOCUSED_FILL = 53;

/**
 * Liquid level per duration, read off `1219:4395` … `1219:4450` (30m 22, 45m 33, 1.5h 65, 2h 87,
 * 2.5h 108). The frames never draw an unfocused 1 hr, so it sits on the same ~0.72pt/min line.
 */
function fillFor(minutes: number): number {
  const known: Record<number, number> = { 30: 22, 45: 33, 60: 44, 90: 65, 120: 87, 150: 108 };
  return known[minutes] ?? Math.max(12, Math.min(118, Math.round(minutes * 0.72)));
}

export interface DurationCarouselProps {
  readonly durations: readonly DurationOption[];
  readonly focusedId: string;
  /** Snapping reports a new focus; it does not select. */
  readonly onFocus: (id: string) => void;
  /** A tap selects (and focuses) the tile. */
  readonly onSelect: (id: string) => void;
}

/**
 * `1212:22816` — a 176pt strip of "liquid" tiles with a 4pt page indicator 12 below it.
 *
 * The focused tile is always centred: the track is padded by half the viewport less half the
 * focused tile, so focusing tile `i` scrolls to `i × 112`. With "1 hr" focused that puts the first
 * tile at x −87, exactly where `1212:22739` draws it.
 */
export function DurationCarousel({
  durations,
  focusedId,
  onFocus,
  onSelect,
}: DurationCarouselProps) {
  const { width: screen } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const index = Math.max(
    0,
    durations.findIndex((d) => d.id === focusedId),
  );
  const inset = (screen - FOCUSED.width) / 2;

  useEffect(() => {
    scroll.current?.scrollTo({ x: index * STEP, animated: true });
  }, [index]);

  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = durations[Math.round(e.nativeEvent.contentOffset.x / STEP)];
    if (next !== undefined && next.id !== focusedId) onFocus(next.id);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: index * STEP, y: 0 }}
        snapToOffsets={durations.map((_, i) => i * STEP)}
        decelerationRate="fast"
        onMomentumScrollEnd={onSettle}
        contentContainerStyle={[styles.track, { paddingHorizontal: inset }]}
        style={styles.carousel}
      >
        {durations.map((d) => (
          <Tile key={d.id} option={d} focused={d.id === focusedId} onPress={() => onSelect(d.id)} />
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {durations.map((d) => (
          <View key={d.id} style={d.id === focusedId ? styles.dotActive : styles.dot} />
        ))}
      </View>
    </View>
  );
}

function Tile({
  option,
  focused,
  onPress,
}: {
  option: DurationOption;
  focused: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={`${option.label}, ${formatPaise(option.pricePaise)}`}
      onPress={onPress}
      // The shadow sits on the outer box: iOS clips a shadow drawn by an `overflow: hidden` view.
      style={[styles.shadowBox, focused ? FOCUSED : TILE, focused ? SHADOW_PILL : SHADOW_SOFT]}
    >
      <View style={[styles.tile, focused ? styles.tileFocused : styles.tileDefault]}>
        <View
          style={[
            styles.liquid,
            focused ? styles.liquidFocused : null,
            { height: focused ? FOCUSED_FILL : fillFor(option.minutes) },
          ]}
        >
          <LinearGradient
            colors={focused ? [C.brand, '#FFDE33', C.tint] : [C.tint, '#FFF3B3', C.soft]}
            locations={[0, 0.6, 1]}
            style={styles.liquidBody}
          />
          <Image
            source={focused ? ART.tileSurfaceFocused : ART.tileSurface}
            style={styles.surface}
            resizeMode="stretch"
          />
        </View>
        {option.mostBooked === true ? (
          <View style={[styles.badge, focused ? styles.badgeFocused : null]}>
            <Text style={styles.badgeText}>Most booked</Text>
          </View>
        ) : null}
        <Text style={focused ? styles.titleFocused : styles.title}>{option.label}</Text>
        <View style={styles.priceRow}>
          <Text style={focused ? styles.priceFocused : styles.price}>
            {formatPaise(option.pricePaise)}
          </Text>
          {option.mrpPaise === null ? null : (
            <Text style={styles.mrp}>{formatPaise(option.mrpPaise)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12, width: '100%' },
  carousel: { height: 176, width: '100%', flexGrow: 0 },
  track: { alignItems: 'center', gap: GAP, paddingVertical: 12 },
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
  liquid: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  /** `1219:4272` "Level" is inset −1, so the focused liquid runs under the border. */
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
  /** `1219:4399` — white on a default tile, `#FFE666` (`1219:4276`) on the focused one. */
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
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 9999, backgroundColor: C.textDisabled },
  dotActive: { width: 12, height: 4, borderRadius: 9999, backgroundColor: C.text },
});
