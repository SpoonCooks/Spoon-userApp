import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { FeatureCopy } from '../content';

/**
 * Recurring B / Feature card — `983:6050`: a 40pt `#FFF7CC` disc with the glyph in it, and beside
 * it a Livvic SemiBold 16/24 title over a Regular 14/20 line in the secondary ink, 4 apart.
 */
export interface FeatureRowProps {
  readonly feature: FeatureCopy;
  readonly testID?: string;
}

export function FeatureRow({ feature, testID = 'feature-row' }: FeatureRowProps) {
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.disc}>
        <Image
          source={feature.icon}
          style={{
            position: 'absolute',
            left: feature.iconLeft,
            top: feature.iconTop,
            width: feature.iconSize,
            height: feature.iconSize,
          }}
        />
      </View>
      <View style={styles.text}>
        <Text variant="emphasis" color="textPrimary">
          {feature.title}
        </Text>
        <Text variant="bodyLarge" color="textSubdued">
          {feature.body}
        </Text>
      </View>
    </View>
  );
}

const DISC = 40;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: lightTheme.space.md },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccent,
    overflow: 'hidden',
  },
  text: { flex: 1, gap: lightTheme.space.xs },
});
