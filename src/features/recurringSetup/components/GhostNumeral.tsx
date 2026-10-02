import { StyleSheet, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';

import { Text } from '@ui';

/**
 * A plan number drawn as background art — live text, so "1", "2" and "12" all draw, with a
 * top-to-bottom gradient fill (`444:10264`: `bg-clip-text` `#FFE666` → `#FFD600`).
 *
 * The app has no masked view, so the fill is built from horizontal bands: each band clips one
 * copy of the numeral and tints it with the gradient's colour at that height. At `BAND` points
 * a step is a fraction of one colour unit, which reads as a continuous ramp.
 */
export interface GhostNumeralProps {
  readonly value: number;
  /** Where the numeral's line box sits; the bands cover exactly this box. */
  readonly frame: ViewStyle & { readonly width: number };
  readonly fontFamily: string;
  readonly fontSize: number;
  /** The font's own "normal" line height at `fontSize` — the box Figma positions. */
  readonly lineHeight: number;
  /** Top and bottom colours, as `#RRGGBB`. */
  readonly colors: readonly [string, string];
}

/** Band height, in points. */
const BAND = 2;

export function GhostNumeral({
  value,
  frame,
  fontFamily,
  fontSize,
  lineHeight,
  colors,
}: GhostNumeralProps) {
  const glyph: TextStyle = { fontFamily, fontSize, lineHeight, width: frame.width };
  const count = Math.ceil(lineHeight / BAND);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, frame, { height: lineHeight }]}
    >
      {Array.from({ length: count }, (_, index) => (
        // Never flattened away: the band's clip IS the gradient step.
        <View
          key={index}
          collapsable={false}
          style={[styles.band, { top: index * BAND, height: BAND }]}
        >
          <Text
            style={[
              glyph,
              styles.glyph,
              { top: -index * BAND, color: mix(colors, (index * BAND + BAND / 2) / lineHeight) },
            ]}
          >
            {String(value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function mix([from, to]: readonly [string, string], t: number): string {
  const a = parse(from);
  const b = parse(to);
  const clamped = Math.min(Math.max(t, 0), 1);
  const channel = (index: 0 | 1 | 2) =>
    Math.round(a[index] + (b[index] - a[index]) * clamped)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

function parse(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.slice(1, 7), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const styles = StyleSheet.create({
  box: { position: 'absolute' },
  band: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  glyph: { position: 'absolute', left: 0 },
});
