import { StyleSheet, View } from 'react-native';

import { HelpPill, IconButton, Text, lightTheme } from '@ui';

/**
 * The shared lifecycle header — Figma `39:5324` (Confirmation), repeated on En route, Arrived,
 * In service and all four cancellation surfaces.
 *
 * Geometry, verbatim: a 45pt white strip. The 32pt BACK control sits at left 4 / top 7 — and it is
 * a white disc with a hairline ring around a CHEVRON (`37:5266`), not the bare arrow the bottom
 * sheet uses. Drawing the sheet's arrow here left the disc off entirely. The address label
 * (Livvic SemiBold 11/16.5) is centred on y 14.5 and the address line (Livvic Regular 9/13.5) on
 * y 26; the Help pill (`39:5331`) is a 73 × 25.3 `#FFD600` box at a 16pt radius carrying a Livvic
 * Bold 12/15.2 label and the 22 × 25 WhatsApp mark, lifted by `0 0 2 rgba(0,0,0,0.15)`.
 *
 * The Help control is a WhatsApp handoff in the design, which is why the mark is the real exported
 * asset and not Feather's `headphones`.
 *
 * TODO(product B-10): `Help` has no destination anywhere in the Figma file. The control renders
 * because it is designed; the callback is optional and unwired until the destination is decided.
 */
export interface BookingHeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly helpLabel: string;
  readonly onBack: () => void;
  readonly onHelp?: () => void;
}

export function BookingHeader({ title, subtitle, helpLabel, onBack, onHelp }: BookingHeaderProps) {
  return (
    <View style={styles.row} testID="booking-header">
      <IconButton
        name="back"
        label="Back"
        onPress={onBack}
        variant="outlined"
        // `37:5266`'s chevron measures (77,77,77) at full coverage — `rgba(0,0,0,0.7)`, not black.
        color="textSecondary"
        testID="booking-back"
      />

      <View style={styles.text}>
        <Text variant="label" color="textPrimary" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="micro" color="textPrimary" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {onHelp === undefined ? null : (
        <HelpPill label={helpLabel} onPress={onHelp} testID="booking-help" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    /** `39:5311` starts at x 47 with the 32pt control ending at 36 — an 11pt gap, not 10. */
    gap: 11,
    paddingVertical: lightTheme.space.s6,
    backgroundColor: lightTheme.colors.surface,
  },
  text: { flex: 1, minWidth: 0, gap: lightTheme.space.xxs },
});
