import { StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives/Text';

/**
 * The two-line address lockup — Figma `319:3346` (Home banner) and `289:9215` (the service-flow
 * top banner). One drawing, two widths.
 *
 * Both nodes position the lines by their vertical CENTRES rather than by stacking them: the label
 * (Livvic SemiBold 11/16.5) is centred on y 8.5 and the address line (Livvic Regular 9/13.5) on
 * y 25. Laying them out as a flex column with a gap lands them a point or two off, because the
 * two leadings differ; absolute centres reproduce the frame exactly at both sizes.
 *
 * The box is a FIXED width in both frames, and deliberately so — whatever follows it (the Home
 * chevron disc, the service Help pill) is positioned off the BOX, not off the rendered glyphs, so
 * a longer address must not be allowed to move the control. The line truncates instead, which is
 * what the frames draw: `319:3349` / `250:2958` are separate "…" nodes.
 *
 * Both strings are server copy. Nothing here formats or shortens an address.
 */
export interface AddressLinesProps {
  /** `250:2956` — "Home". */
  readonly label: string;
  /** `250:2957` — "E102, Purva Skydale, Silver Count…". */
  readonly line: string;
  /** `319:3346` draws 140 × 32; `289:9215` draws 188 × 28. */
  readonly width: number;
  readonly height: number;
  readonly testID?: string;
}

/** `250:2956` / `250:2957` — the two leadings the centres are computed against. */
const LABEL_LINE_HEIGHT = 16.5;
const ADDRESS_LINE_HEIGHT = 13.5;
const LABEL_CENTRE_Y = 8.5;
const LINE_CENTRE_Y = 25;

export function AddressLines({ label, line, width, height, testID }: AddressLinesProps) {
  return (
    <View style={[styles.box, { width, height }]} testID={testID}>
      <Text variant="label" color="textPrimary" numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Text variant="micro" color="textPrimary" numberOfLines={1} style={styles.line}>
        {line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {},
  label: {
    position: 'absolute',
    top: LABEL_CENTRE_Y - LABEL_LINE_HEIGHT / 2,
    left: 0,
    right: 0,
  },
  line: {
    position: 'absolute',
    top: LINE_CENTRE_Y - ADDRESS_LINE_HEIGHT / 2,
    left: 0,
    right: 0,
  },
});
