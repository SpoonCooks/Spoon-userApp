import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { SummaryDetailTile } from '../../data/summary';
import { SUMMARY_TILE_ART } from './assets';

/**
 * `Booking details` — Figma `1017:439`: the visit's time of day, duration and start time as three
 * Spoon/Body Strong captions (columns 15.5 apart), 8 above three 185pt photo tiles (16 apart, 8pt
 * radius) that show the same three facts.
 */
export interface BookingDetailsProps {
  readonly tiles: readonly SummaryDetailTile[];
  readonly testID?: string;
}

export function BookingDetails({ tiles, testID = 'summary-booking-details' }: BookingDetailsProps) {
  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.captions}>
        {tiles.map((tile) => (
          <Text
            key={tile.key}
            variant="spoonBodyStrong"
            color="textPrimary"
            style={styles.caption}
            testID={`${testID}-caption-${tile.key}`}
          >
            {tile.caption}
          </Text>
        ))}
      </View>
      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <View key={tile.key} style={styles.tile}>
            <Image
              source={tile.source ?? SUMMARY_TILE_ART[tile.key]}
              resizeMode="cover"
              style={styles.photo}
              accessibilityIgnoresInvertColors
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: lightTheme.space.sm },
  /** `1017:444` — three equal columns, 15.5 apart. */
  captions: { flexDirection: 'row', gap: 15.5 },
  caption: { flex: 1, textAlign: 'center' },
  /** `1017:440` — three equal tiles, 16 apart. */
  tiles: { flexDirection: 'row', gap: lightTheme.space.lg },
  /** `1017:441` — 185pt tall, the photo fill clipped to an 8pt radius. */
  tile: { flex: 1, height: 185, borderRadius: lightTheme.radius.xs, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
});
