import { StyleSheet, View } from 'react-native';

import { AddressLines, DirectionalDisc, HelpPill, lightTheme } from '@ui';

/**
 * The shared lifecycle header — Figma `289:9205` ("top banner"), repeated verbatim on Confirm
 * reassign (`308:3082`), Auto cancelled (`308:3095`), both En route frames, both Reassigned
 * frames, Arrived, In service and Cooking extended.
 *
 * It is NOT the `63:783` screen header the seven banked sections use, and it is not a title bar:
 * it is the HOME banner's address lockup with a back control in front of it and the Help pill
 * behind it.
 *
 * Geometry, verbatim from `289:9205`:
 *   row      338 × 38, px 4 / py 6, items centred, **24pt** between the address group and Help
 *   group    `289:9206` — the 32pt back disc (`54:289`, the SAME exported control), 12pt clear of
 *   address  `289:9215` — a fixed **188 × 28** lockup; label centred on y 8.5, line on y 25
 *   help     `289:9211` — the 73 × 25.335 `#FFD600` pill
 *
 * The back control was drawn as `IconButton variant="outlined"` — a reconstructed disc — where the
 * frame instances the one exported chevron disc. `DirectionalDisc` is the single place that
 * drawing lives.
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

/** `289:9215` — the fixed lockup the Help pill is positioned against. */
const ADDRESS_WIDTH = 188;
const ADDRESS_HEIGHT = 28;

export function BookingHeader({ title, subtitle, helpLabel, onBack, onHelp }: BookingHeaderProps) {
  return (
    <View style={styles.row} testID="booking-header">
      <View style={styles.lead}>
        <DirectionalDisc direction="back" label="Back" onPress={onBack} testID="booking-back" />
        <AddressLines
          label={title}
          line={subtitle}
          width={ADDRESS_WIDTH}
          height={ADDRESS_HEIGHT}
          testID="booking-header-address"
        />
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
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: 24,
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `289:9206` — the disc 12pt clear of the address lockup. */
  lead: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md, flexShrink: 1 },
});
