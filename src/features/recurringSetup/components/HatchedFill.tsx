import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The 45° hatch Figma `ZIJf639gTWHXshaa2YOeCT` draws behind a start time that clashes with
 * another visit (`4:1044`): alternating 4pt bands of `#F2F1EC` and `#E4E2DA`, a CSS
 * `linear-gradient(135deg, …)` in the source. React Native has no repeating gradient, so this
 * lays one out with hard stops, sized from the cell so the bands stay 4pt wide at 45° whatever
 * the cell's shape. Fills its parent; the parent clips it with its own radius.
 */
const BAND = 4;

export function HatchedFill() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (size === null || size.width !== width || size.height !== height) {
      setSize({ width, height });
    }
  }

  let gradient = null;
  if (size !== null && size.width > 0 && size.height > 0) {
    const { width, height } = size;
    // A CSS 135° gradient line runs top-left to bottom-right through the centre, (w + h) / √2
    // long; its ends, in the unit box expo-linear-gradient takes, sit (w + h) / 4 off-centre.
    const length = (width + height) / Math.SQRT2;
    const bands = Math.ceil(length / BAND);
    const colors: string[] = [];
    const locations: number[] = [];
    for (let index = 0; index < bands; index += 1) {
      const color =
        index % 2 === 0 ? lightTheme.colors.surfaceStoneSoft : lightTheme.colors.borderStone;
      const from = Math.min((index * BAND) / length, 1);
      const to = Math.min(((index + 1) * BAND) / length, 1);
      colors.push(color, color);
      locations.push(from, to);
    }
    const reach = (width + height) / 4;
    gradient = (
      <LinearGradient
        colors={colors as unknown as readonly [string, string, ...string[]]}
        locations={locations as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0.5 - reach / width, y: 0.5 - reach / height }}
        end={{ x: 0.5 + reach / width, y: 0.5 + reach / height }}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {gradient}
    </View>
  );
}
