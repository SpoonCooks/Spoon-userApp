import { useEffect, useState } from 'react';
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

import { currentSkewMs } from '@core/time';
import { gradientAxis } from '@ui/tokens/semantic';

import { BANNER } from '../assets';
import { BANNER_FILL, C, F } from '../theme';
import type { ActiveBookingCard } from '../types';

export interface ActiveBookingsProps {
  /** In carousel order. Empty: nothing is drawn. */
  readonly cards: readonly ActiveBookingCard[];
  /** The whole card opens the booking; the arrow is only an affordance. */
  readonly onPressCard: (card: ActiveBookingCard) => void;
  /** "View all ›" → My bookings, Upcoming. */
  readonly onPressViewAll: () => void;
}

/** `2243:1120` — 370pt cards on a 402pt frame: 16 either side, 8 between, so the next one peeks. */
const CARD_WIDTH = 370;
const CARD_HEIGHT = 74;
const INSET = 16;
const GAP = 8;
/** "dots match the card count (cap at 5)". */
const MAX_DOTS = 5;
/** The in-progress bar is "refreshed every minute". */
const PROGRESS_TICK_MS = 60_000;

/**
 * `2243:1120` / `2243:973` Home banner carousel — every active booking (`activeBookingCardsFrom`)
 * as a `2240:5822` Home banner card, under "Active bookings".
 *
 * One booking: a single static card, no count, no "View all", no dots. Two or more: the count
 * badge and "View all ›" join the header, the track scrolls with snap and one dot per card shows
 * where it rests (capped at five). It always opens on the first card and never auto-advances.
 */
export function ActiveBookings({ cards, onPressCard, onPressViewAll }: ActiveBookingsProps) {
  const { width: screen } = useWindowDimensions();
  const cardWidth = Math.min(CARD_WIDTH, screen - INSET * 2);
  const [index, setIndex] = useState(0);

  if (cards.length === 0) return null;
  const many = cards.length > 1;
  const dots = Math.min(cards.length, MAX_DOTS);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const at = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP));
    setIndex(Math.max(0, Math.min(cards.length - 1, at)));
  };

  return (
    <View style={styles.section} testID="home-active-bookings">
      <View style={styles.header}>
        <View style={styles.title}>
          <Text style={styles.titleText}>Active bookings</Text>
          {many ? (
            <View style={styles.count}>
              <Text style={styles.countText}>{cards.length}</Text>
            </View>
          ) : null}
        </View>
        {many ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="View all bookings"
            onPress={onPressViewAll}
            hitSlop={8}
            style={styles.viewAll}
          >
            <Text style={styles.viewAllText}>View all</Text>
            <Image source={BANNER.chevronRight} style={styles.viewAllIcon} />
          </Pressable>
        ) : null}
      </View>

      {many ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.track}
          contentContainerStyle={styles.trackContent}
        >
          {cards.map((card) => (
            <BannerCard
              key={card.key}
              card={card}
              width={cardWidth}
              onPress={() => onPressCard(card)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.trackContent, styles.single]}>
          {cards[0] === undefined ? null : (
            <BannerCard
              card={cards[0]}
              width={cardWidth}
              onPress={() => onPressCard(cards[0] as ActiveBookingCard)}
            />
          )}
        </View>
      )}

      {many ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
          {Array.from({ length: dots }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, i === Math.min(index, dots - 1) ? styles.dotActive : null]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const STATE_LABEL: Record<ActiveBookingCard['state'], string> = {
  upcoming: 'Upcoming',
  in_progress: 'In progress',
  completed: 'Completed',
};

/** Server time now — the bar's window is server instants, so a drifted handset clock is corrected. */
const serverNow = () => Date.now() - currentSkewMs();

/** `2240:5822` Home banner — one booking: type tag, state pill, date · time, duration, Go. */
function BannerCard({
  card,
  width,
  onPress,
}: {
  readonly card: ActiveBookingCard;
  readonly width: number;
  readonly onPress: () => void;
}) {
  const fill = BANNER_FILL[card.timeOfDay];
  const axis = gradientAxis(fill.angleDeg, width, CARD_HEIGHT);
  const ink = fill.dark ? C.base : C.text;
  const service = card.service;

  const [now, setNow] = useState(serverNow);
  const live = service !== null;
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(serverNow()), PROGRESS_TICK_MS);
    return () => clearInterval(timer);
  }, [live]);
  const progress =
    service === null
      ? null
      : Math.max(0, Math.min(1, (now - service.startMs) / (service.endMs - service.startMs)));

  const type = card.type === 'recurring' ? 'RECURRING' : 'ONE-TIME';
  const minutes = `${card.duration.value} ${card.duration.unit.toLowerCase()}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${type.toLowerCase()} booking, ${STATE_LABEL[card.state]}, ${card.whenLabel}, ${minutes}`}
      onPress={onPress}
      style={[styles.card, { width }]}
      testID={`home-active-booking-${card.key}`}
    >
      <LinearGradient
        colors={fill.colors}
        start={axis.start}
        end={axis.end}
        style={StyleSheet.absoluteFill}
      />
      <Image source={BANNER.backdrop[card.timeOfDay]} style={styles.backdrop} />

      <View style={styles.stack}>
        <View style={styles.eyebrow}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{type}</Text>
          </View>
          <View
            style={[
              styles.statePill,
              card.state === 'in_progress'
                ? styles.pillLive
                : card.state === 'completed'
                  ? styles.pillDone
                  : null,
            ]}
          >
            {card.state === 'upcoming' ? (
              <Image source={BANNER.notStarted} style={styles.notStarted} />
            ) : card.state === 'in_progress' ? (
              <Image source={BANNER.liveDot} style={styles.liveDot} />
            ) : (
              <View style={styles.checkBox}>
                <Image source={BANNER.check} style={styles.check} />
              </View>
            )}
            <Text style={styles.stateText}>{STATE_LABEL[card.state]}</Text>
          </View>
        </View>
        <Text style={[styles.when, { color: ink }]} numberOfLines={1} ellipsizeMode="tail">
          {card.whenLabel}
        </Text>
      </View>

      <View style={styles.duration}>
        <Text style={[styles.durationValue, { color: ink }]}>{card.duration.value}</Text>
        <Text style={[styles.durationUnit, { color: ink }]}>{card.duration.unit}</Text>
      </View>

      <View style={styles.go}>
        <Image source={BANNER.chevronRight} style={styles.goIcon} />
      </View>

      {progress === null ? null : (
        <>
          <View style={styles.progressTrack} />
          <View
            style={[
              styles.progressFill,
              { width: width * progress, backgroundColor: fill.dark ? C.brand : C.text },
            ]}
          />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** Header, track and dots, 12 apart: 24 + 12 + 74 + 12 + 6 = the frame's 128. */
  section: { width: '100%', alignItems: 'center', gap: 12 },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: INSET,
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  /** Spoon/Emphasis. */
  titleText: { fontFamily: F.semibold, fontSize: 16, lineHeight: 24, color: C.text },
  /** `2243:1124` — brand yellow, 7 × 2 padding. */
  count: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Spoon/Caption Strong. */
  countText: { fontFamily: F.semibold, fontSize: 12, lineHeight: 16, color: C.text },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontFamily: F.semibold, fontSize: 12, lineHeight: 16, color: C.text },
  viewAllIcon: { width: 16, height: 16 },
  track: { width: '100%', flexGrow: 0 },
  trackContent: { paddingHorizontal: INSET, gap: GAP, flexDirection: 'row' },
  single: { width: '100%' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 9999, backgroundColor: C.textDisabled },
  /** `2243:1133` Dot/active — a 16 × 6 black pill. */
  dotActive: { width: 16, backgroundColor: C.text },

  /** `2240:5822` — 74 tall, radius 16, padding 12 / 12 / 12 / 16, children 12 apart. */
  card: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
  },
  /** `Backdrop` — 266.4 × 73.44, pinned to the card's top-right corner. */
  backdrop: { position: 'absolute', top: 0, right: 0, width: 266.4, height: 73.44 },
  stack: { flex: 1, minWidth: 1, gap: 4, overflow: 'hidden' },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, overflow: 'hidden' },
  /** Booking type tag — white, 8 × 4 padding, Spoon/Micro Strong. */
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: C.base,
  },
  typeText: { fontFamily: F.semibold, fontSize: 10, lineHeight: 14, color: C.text },
  /** State pill — 7 / 8 × 3 padding, icon 4 before the label; white while Upcoming. */
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 7,
    paddingRight: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: C.base,
  },
  /** color/status/positive. */
  pillLive: { backgroundColor: C.lime },
  /** color/status/positive-subtle. */
  pillDone: { backgroundColor: C.limeSoft },
  stateText: { fontFamily: F.semibold, fontSize: 12, lineHeight: 16, color: C.text },
  notStarted: { width: 8, height: 8 },
  liveDot: { width: 6, height: 6 },
  /** Icon/Check's 8.71 × 6.22 box; the export carries the stroke's overhang around it. */
  checkBox: { width: 8.711, height: 6.222 },
  check: { position: 'absolute', left: -0.778, top: -0.778, width: 10.267, height: 7.778 },
  /** Spoon/Emphasis, one line, ellipsis. */
  when: { fontFamily: F.semibold, fontSize: 16, lineHeight: 24 },
  duration: { alignItems: 'center' },
  /** Spoon/Display over Spoon/Micro. */
  durationValue: { fontFamily: F.bold, fontSize: 24, lineHeight: 32 },
  durationUnit: { fontFamily: F.regular, fontSize: 10, lineHeight: 14 },
  /** Go — a white 28pt disc round the 20pt chevron. */
  go: { padding: 4, borderRadius: 9999, backgroundColor: C.base },
  goIcon: { width: 20, height: 20 },
  /** In progress — a 4pt white track along the bottom edge, filled elapsed / booked. */
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: C.base,
  },
  progressFill: { position: 'absolute', left: 0, bottom: 0, height: 4 },
});
