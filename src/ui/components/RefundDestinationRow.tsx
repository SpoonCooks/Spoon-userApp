import { StyleSheet, View } from 'react-native';

import { Icon } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * "Refund to original payment source" — Figma `104:2375`, repeated on `115:2742` (cancel confirm)
 * and `201:86` (auto cancelled).
 *
 * A 16pt mark, a 10pt gap, then Livvic Regular 12/16 in `#1D293D` over Livvic Medium 10/13.33 in
 * `#90A1B9`, 2.315pt apart. `boxed` wraps it in `104:2370`'s own white card (1pt `#E2E8F0`, 16pt
 * radius, 11.889pt padding); the other two frames place the row inside a card that already exists.
 *
 * BOUNDARY: the destination and the timeframe are server strings. The client does not know where
 * a refund goes, and the timeframe genuinely differs between frames ("3-5" vs "5-7 business
 * days"), which is exactly why it is not a constant here.
 *
 * TODO(designer): `104:2372` is a 16pt bespoke mark that has not been exported; Feather's
 * `credit-card` is the closest available glyph. ASSET_PENDING.
 */
export interface RefundDestinationRowProps {
  readonly destination: string;
  readonly timeframe: string;
  /** `104:2370` — the row in its own outlined card. */
  readonly boxed?: boolean;
  readonly testID?: string;
}

export function RefundDestinationRow({
  destination,
  timeframe,
  boxed = false,
  testID = 'refund-destination',
}: RefundDestinationRowProps) {
  return (
    <View style={[styles.row, boxed ? styles.boxed : null]} testID={testID}>
      <Icon name="wallet" size={16} color="textField" />
      <View style={styles.text}>
        <Text variant="body" color="textField">
          {destination}
        </Text>
        <Text variant="captionStrong" color="textFaint">
          {timeframe}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s10,
  },
  /** `104:2370` — white, 1pt `#E2E8F0`, 16pt radius, 11.889pt padding. */
  boxed: {
    padding: 11.889,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surface,
  },
  text: { flex: 1, minWidth: 0, gap: 2.315 },
});
