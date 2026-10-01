import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';
import { gradientAxis } from '@ui/tokens/semantic';

import { PLUS_ICON } from '../art';

/**
 * Step 1's Plan header — Figma `cCQlzTeiObQkpVBzwI8mZi`: `476:5804` (Plan 1 alone, `340:6661`),
 * `444:10432` (Plan 1 and "+", `334:6406`) and `444:10420` (two plans and "+", `340:6550`).
 *
 * A row of Plan tiles, 12 apart, then the "+" that starts the next plan. Tiles share the row; once
 * they no longer fit at a readable width the row scrolls, since the frame's note puts no cap on
 * the number of plans.
 *
 * Every tile and the "+" are gradients under a gloss with an inset glow and a `#FFF7CC` edge. The
 * glow and the edge sit on a transparent overlay ABOVE the gradients: on the tile itself they
 * would be drawn underneath its gradient children and never seen.
 */
export interface PlanHeaderPlan {
  readonly id: string;
  readonly label: string;
  readonly dayCount: number;
}

export interface PlanHeaderProps {
  readonly plans: readonly PlanHeaderPlan[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
  /** Omit to hide the "+". Step 1 always shows it: there is no cap on plans. */
  readonly onAdd?: (() => void) | undefined;
  /**
   * Shows the "+" but refuses it — while a plan has no day yet, another can't be started. Drawn
   * at 40 % so it reads as unavailable rather than missing.
   */
  readonly addDisabled?: boolean;
  readonly testID: string;
}

export function PlanHeader({
  plans,
  activeId,
  onSelect,
  onAdd,
  addDisabled = false,
  testID,
}: PlanHeaderProps) {
  const layout = plans.length > 1 ? 'shared' : onAdd === undefined ? 'alone' : 'besideAdd';
  return (
    <View style={styles.header} testID={testID}>
      <ScrollView
        horizontal
        scrollEnabled={plans.length > 2}
        showsHorizontalScrollIndicator={false}
        style={styles.tiles}
        contentContainerStyle={styles.tilesContent}
      >
        {plans.map((plan) => (
          <PlanTile
            key={plan.id}
            plan={plan}
            active={plan.id === activeId}
            layout={layout}
            onPress={() => onSelect(plan.id)}
            testID={`${testID}-${plan.id}`}
          />
        ))}
      </ScrollView>
      {onAdd === undefined ? null : (
        <AddButton onPress={onAdd} disabled={addDisabled} testID={`${testID}-add`} />
      )}
    </View>
  );
}

interface PlanTileProps {
  readonly plan: PlanHeaderPlan;
  readonly active: boolean;
  readonly layout: 'alone' | 'besideAdd' | 'shared';
  readonly onPress: () => void;
  readonly testID: string;
}

function PlanTile({ plan, active, layout, onPress, testID }: PlanTileProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };
  const sweep = lightTheme.gradients.planTileActive;
  const angle =
    layout === 'shared' ? sweep.angleDeg : lightTheme.gradients.planTileActiveAngles[layout];
  const axis = gradientAxis(angle, box.width, box.height);
  const caption = `${plan.dayCount} day${plan.dayCount === 1 ? '' : 's'}`;

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityLabel={`${plan.label}, ${caption}`}
      accessibilityState={{ selected: active }}
      style={styles.tile}
      testID={testID}
    >
      {active ? (
        <>
          <LinearGradient
            colors={sweep.colors}
            locations={sweep.locations}
            start={axis.start}
            end={axis.end}
            style={StyleSheet.absoluteFill}
          />
          <Gloss gradient={lightTheme.gradients.planTileGloss} />
        </>
      ) : (
        <LinearGradient
          colors={lightTheme.gradients.planTileIdle.colors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text variant="headingBold" color="textPrimary" numberOfLines={1}>
        {plan.label}
      </Text>
      <Text variant="body" color="textPrimary" numberOfLines={1}>
        {caption}
      </Text>
      <View
        pointerEvents="none"
        style={[styles.overlay, active ? styles.tileActiveEdge : styles.tileIdleEdge]}
      />
    </Pressable>
  );
}

/** `444:10424` — 32 × 56 at an 8pt radius, the 16pt plus centred. */
function AddButton({
  onPress,
  disabled,
  testID,
}: {
  readonly onPress: () => void;
  readonly disabled: boolean;
  readonly testID: string;
}) {
  const add = lightTheme.gradients.planAdd;
  const axis = gradientAxis(add.angleDeg, ADD_WIDTH, TILE_HEIGHT);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add another plan"
      hitSlop={ADD_SLOP}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={[styles.add, disabled ? styles.addDisabled : null]}
      testID={testID}
    >
      <LinearGradient
        colors={add.colors}
        locations={add.locations}
        start={axis.start}
        end={axis.end}
        style={StyleSheet.absoluteFill}
      />
      <Gloss gradient={lightTheme.gradients.planAddGloss} />
      <PlusGlyph />
      <View pointerEvents="none" style={[styles.overlay, styles.addEdge]} />
    </Pressable>
  );
}

function Gloss({
  gradient,
}: {
  readonly gradient: {
    readonly colors: readonly [string, string];
    readonly locations: readonly [number, number];
  };
}) {
  return (
    <LinearGradient
      colors={gradient.colors}
      locations={gradient.locations}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** `352:141` — the file's own 16pt plus, rendered from its SVG. */
function PlusGlyph() {
  return <Image source={PLUS_ICON} style={styles.plus} accessibilityElementsHidden />;
}

/** `444:10420` — tiles and the "+" are 56 tall. */
const TILE_HEIGHT = 56;
const ADD_WIDTH = 32;
/** The "+" is 32 wide; slop restores a 44pt target without redrawing it. */
const ADD_SLOP = { left: 6, right: 6 };
/** Below this a tile's "Plan N" no longer fits, so the row scrolls instead of shrinking it. */
const MIN_TILE_WIDTH = 120;

const styles = StyleSheet.create({
  /**
   * `444:10420` — a 12pt-gapped row 56 tall. Figma draws it 364 wide inside the 370pt content
   * box, so it stops 6 short of the right edge.
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    height: TILE_HEIGHT,
    marginRight: 6,
  },
  tiles: { flexGrow: 1, flexShrink: 1 },
  tilesContent: { flexGrow: 1, gap: lightTheme.space.md },
  /** `444:10421` — p 8, 4 between label and caption, a 16pt radius. */
  tile: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: MIN_TILE_WIDTH,
    height: TILE_HEIGHT,
    padding: lightTheme.space.sm,
    gap: lightTheme.space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.md,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderColor: lightTheme.colors.borderPlanTile,
  },
  /** `444:10422` — a 1.5pt edge and a `0 -2 4` glow. */
  tileActiveEdge: {
    borderRadius: lightTheme.radius.md,
    borderWidth: 1.5,
    boxShadow: innerShadows.planTileActive,
  },
  /** `444:10421` — a 1pt edge and a softer `0 -1.5 3` glow. */
  tileIdleEdge: {
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    boxShadow: innerShadows.planTileIdle,
  },
  add: {
    width: ADD_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: lightTheme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addDisabled: { opacity: 0.4 },
  /** `444:10424` — a 1.2pt edge and a `0 -2 4` glow. */
  addEdge: {
    borderRadius: lightTheme.radius.xs,
    borderWidth: 1.2,
    boxShadow: innerShadows.planAdd,
  },
  plus: { width: 16, height: 16 },
});
