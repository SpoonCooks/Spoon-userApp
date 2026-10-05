import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';
import { gradientAxis } from '@ui/tokens/semantic';

import { PLAN_CALENDAR } from '../art';
import { ordinal } from '../data';
import { GhostNumeral } from './GhostNumeral';

/**
 * The visit flow's "Plan & visits header" — Figma `444:10249` (on `332:6093`, `332:5869`,
 * `332:5718`).
 *
 * A compact Plan card (`444:10250`) — calendar, "Plan N" over its subtitle, the plan number as a
 * gradient ghost — then one card per visit: those already booked greyed with "1 hr · 9:00 AM",
 * the one being added in gold with "Scheduling". Every number is live, so any plan or visit count
 * draws; past two visits the row scrolls rather than squeezing the cards.
 */
export interface PlanVisitsHeaderProps {
  /** 1-based. */
  readonly planNumber: number;
  /** "4 days · 1st Visit". */
  readonly subtitle: string;
  /** Captions of the visits already booked, in order: "1 hr · 9:00 AM". */
  readonly bookedVisits: readonly string[];
  readonly testID?: string;
}

export function PlanVisitsHeader({
  planNumber,
  subtitle,
  bookedVisits,
  testID,
}: PlanVisitsHeaderProps) {
  const visitCount = bookedVisits.length + 1;
  const scrolls = visitCount > 2;
  return (
    <View style={styles.header} testID={testID}>
      <PlanCard planNumber={planNumber} subtitle={subtitle} />
      <ScrollView
        horizontal
        scrollEnabled={scrolls}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.visits}
      >
        {bookedVisits.map((caption, index) => (
          <View key={`visit-${index}`} style={[styles.visit, styles.visitBooked]}>
            <Text variant="emphasis" color="textSubdued" align="center">
              {ordinal(index + 1)} Visit
            </Text>
            <Text variant="body" color="textSubdued" align="center">
              {caption}
            </Text>
          </View>
        ))}
        <SchedulingVisit label={`${ordinal(visitCount)} Visit`} />
      </ScrollView>
    </View>
  );
}

/** `444:10250` — p 12, 12 between the calendar and the text, a 16pt radius. */
function PlanCard({
  planNumber,
  subtitle,
}: {
  readonly planNumber: number;
  readonly subtitle: string;
}) {
  const [width, setWidth] = useState(0);
  const gradient = lightTheme.gradients.planCard;
  const gloss = lightTheme.gradients.planCardGloss;
  const axis = gradientAxis(gradient.angleDeg, width, CARD_HEIGHT);
  return (
    <View
      style={styles.card}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      <LinearGradient
        colors={gradient.colors}
        locations={gradient.locations}
        start={axis.start}
        end={axis.end}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={gloss.colors}
        locations={gloss.locations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* `444:10264` — Livvic Bold 100, a 60-wide box whose left edge is 282 in, its line box
          19 above the card so the numeral runs off the bottom. Placed from the right so it holds
          its place against the card's right edge at any width. */}
      <GhostNumeral
        value={planNumber}
        frame={{ right: GHOST_RIGHT, top: GHOST_TOP, width: GHOST_WIDTH }}
        fontFamily={lightTheme.typography.titleNav.fontFamily}
        fontSize={GHOST_SIZE}
        lineHeight={GHOST_LINE}
        colors={lightTheme.gradients.planCardGhost.colors}
      />
      <View style={styles.calendar}>
        <Image source={PLAN_CALENDAR} style={styles.calendarArt} resizeMode="stretch" />
      </View>
      <View style={styles.text}>
        <Text variant="emphasis" color="textPrimary" numberOfLines={1}>
          Plan {planNumber}
        </Text>
        <Text variant="bodyStrong" color="textSubdued" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View pointerEvents="none" style={[styles.overlay, styles.cardGlow]} />
    </View>
  );
}

/**
 * `444:10299` — the visit being added: the selected Plan tile's gold and glow, inside a 1.5pt edge
 * that runs from `#FFF7CC` at the top to `#FFD600` at the foot. With no gradient border in React
 * Native the edge is a ring: the rim gradient over the card, then the card's own fill again,
 * inset by the stroke's width.
 */
function SchedulingVisit({ label }: { readonly label: string }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const rim = lightTheme.gradients.visitTabRim;
  const fill = (inset: boolean) => (
    <TabFill
      width={box.width - (inset ? EDGE * 2 : 0)}
      height={box.height - (inset ? EDGE * 2 : 0)}
      style={inset ? styles.visitInner : StyleSheet.absoluteFill}
    />
  );
  return (
    <View
      style={[styles.visit, styles.visitActive]}
      onLayout={(event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setBox((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
    >
      {fill(false)}
      <LinearGradient
        colors={rim.colors}
        locations={rim.locations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {fill(true)}
      <Text variant="headingBold" color="textPrimary" align="center">
        {label}
      </Text>
      <Text variant="bodyLarge" color="textPrimary" align="center">
        Scheduling
      </Text>
      <View pointerEvents="none" style={[styles.overlay, styles.visitActiveGlow]} />
    </View>
  );
}

/** The visit tab's sweep and gloss over a `width` × `height` box. */
function TabFill({
  width,
  height,
  style,
}: {
  readonly width: number;
  readonly height: number;
  readonly style: StyleProp<ViewStyle>;
}) {
  const sweep = lightTheme.gradients.planTileActive;
  const gloss = lightTheme.gradients.planTileGloss;
  const axis = gradientAxis(lightTheme.gradients.visitTabActiveAngleDeg, width, height);
  return (
    <View style={style} pointerEvents="none">
      <LinearGradient
        colors={sweep.colors}
        locations={sweep.locations}
        start={axis.start}
        end={axis.end}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={gloss.colors}
        locations={gloss.locations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** `444:10250` — 12 + the 44pt text stack + 12. */
const CARD_HEIGHT = 68;
/** `444:10264` — `right-[88px] translate-x-full w-[60px]` in the 370 card: left edge at 282. */
const GHOST_WIDTH = 60;
const GHOST_RIGHT = 88 - GHOST_WIDTH;
/** `top-[calc(50%-53px)]` on the 68 card. */
const GHOST_TOP = CARD_HEIGHT / 2 - 53;
const GHOST_SIZE = 100;
/** Livvic Bold's "normal" line: (ascender 1005 + descender 250) / 1000 em at 100. */
const GHOST_LINE = 125.5;
/** `444:10269` — two visits share the row; more scroll at this width instead of shrinking. */
const MIN_VISIT_WIDTH = 160;
/** `444:10299` — the visit being scheduled's edge. */
const EDGE = 1.5;

const styles = StyleSheet.create({
  /** `444:10249` — 12 between the Plan card and the visits. */
  header: { gap: lightTheme.space.md },
  card: {
    height: CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: lightTheme.space.md,
    borderRadius: lightTheme.radius.md,
    overflow: 'hidden',
  },
  /** `444:10251` — a 32pt box, the art inset 1.25 % top and bottom. */
  calendar: { width: 32, height: 32 },
  calendarArt: { position: 'absolute', left: 0, top: 32 * 0.0125, width: 31.991, height: 31.19 },
  /** `444:10265` — 4 between "Plan N" and the subtitle. */
  text: { flex: 1, gap: lightTheme.space.xs },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: lightTheme.radius.md,
  },
  /** `444:10250` — `inset 0 -2 4 rgba(255,230,102,0.8)`. */
  cardGlow: { boxShadow: innerShadows.planCard },
  /** `444:10268` — 16 between the visit cards. */
  visits: { flexGrow: 1, gap: lightTheme.space.lg },
  /** `444:10269` / `444:10270` — p 8, 4 between the lines, a 16pt radius. */
  visit: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: MIN_VISIT_WIDTH,
    padding: lightTheme.space.sm,
    gap: lightTheme.space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.md,
    overflow: 'hidden',
  },
  /** `Visit 1` — `color/surface/disabled` under 60 % ink. */
  visitBooked: { backgroundColor: lightTheme.colors.surfaceDisabledSoft },
  /** `444:10299` — p 8 inside the 1.5pt edge. */
  visitActive: { padding: lightTheme.space.sm + EDGE },
  visitInner: {
    position: 'absolute',
    top: EDGE,
    left: EDGE,
    right: EDGE,
    bottom: EDGE,
    borderRadius: lightTheme.radius.md - EDGE,
    overflow: 'hidden',
  },
  /** `444:10299` — `inset 0 -2 4 rgba(255,214,0,0.9)`. */
  visitActiveGlow: { boxShadow: innerShadows.planTileActive },
});
