import { StyleSheet, View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Skeleton block.
 *
 * No loading state is designed anywhere in the Figma file (docs/FIGMA_USER_APP_AUDIT.md §R), so
 * this is a deliberately neutral convention built from tokens, to be restyled once design lands.
 *
 * Static rather than pulsing on purpose: an animation loop would put a permanent timer in every
 * test that renders a loading screen, for no user-visible benefit at this stage.
 */

export interface SkeletonProps {
  readonly width?: DimensionValue;
  readonly height?: number;
  readonly radius?: number;
  readonly testID?: string;
}

export function Skeleton({
  width = '100%',
  height = lightTheme.space.lg,
  radius = lightTheme.radius.xs,
  testID,
}: SkeletonProps) {
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { width, height, borderRadius: radius }]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: lightTheme.colors.surfaceMuted },
});
