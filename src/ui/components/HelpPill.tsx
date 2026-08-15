import { Image, Pressable, StyleSheet } from 'react-native';

import { HELP_WHATSAPP_GLYPH } from '@ui/components/cookAssets';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The `Help` pill — Figma `39:5331`, repeated verbatim on nine surfaces: Confirmation, both En
 * route frames, both Reassigned frames, Arrived, In service, Auto cancelled, the Extension sheet
 * (`143:322`) and all four cancellation sheets.
 *
 * Geometry: a 73 × 25.335 `#FFD600` box at a 16pt radius carrying a Livvic Bold 12/15.2 label and
 * the 22 × 25 exported WhatsApp mark, lifted by `0 0 2 rgba(0,0,0,0.15)`. Drawn at its Figma size;
 * `hitSlop` restores the 44pt touch target rather than inflating the pill.
 *
 * The control is a WhatsApp handoff in the design, which is why the mark is the real exported
 * asset and not Feather's `headphones`.
 *
 * TODO(product B-10): `Help` has no destination anywhere in the Figma file. The pill renders
 * because it is drawn; hosts pass a handler only once the destination is decided.
 */
export interface HelpPillProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

export function HelpPill({ label, onPress, testID = 'help-pill' }: HelpPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={styles.pill}
      testID={testID}
    >
      <Text variant="helpLabel" color="textOnAccent">
        {label}
      </Text>
      <Image
        source={HELP_WHATSAPP_GLYPH}
        style={styles.glyph}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s6,
    width: 73,
    height: 25.335,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceCta,
    ...lightTheme.elevation.soft,
  },
  glyph: { width: 22, height: 25 },
});
