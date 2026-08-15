import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { IconButton } from '@ui/primitives/IconButton';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The stacked-screen header — one Figma component reused verbatim on five frames:
 * `68:252` Saved addresses, `53:120` Select service location, `60:731` Add address details,
 * `65:35` Past bookings and `71:620` Refunds.
 *
 * Geometry: a white bar with a 0.889pt `#E2E8F0` underline, 16pt horizontal and 12pt vertical
 * padding, a 32pt back control and a Livvic Bold 16/24 title 14pt to its right. It is STICKY on
 * every frame that uses it.
 *
 * This is NOT the booking-lifecycle header (`39:5324`), which carries an address pair and the Help
 * pill instead of a single title, nor the sheet header (`1:735`).
 */
export interface ScreenHeaderProps {
  readonly title: string;
  readonly onBack: () => void;
  /** `60:731` draws no underline; every other frame does. */
  readonly divider?: boolean;
  readonly trailing?: ReactNode;
  readonly testID?: string;
}

export function ScreenHeader({
  title,
  onBack,
  divider = true,
  trailing,
  testID = 'screen-header',
}: ScreenHeaderProps) {
  return (
    <View style={[styles.header, divider ? styles.divider : null]} testID={testID}>
      {/* `6:792` / `68:252` — a 32pt white disc with a hairline ring around a chevron. */}
      <IconButton
        name="back"
        label="Back"
        onPress={onBack}
        variant="outlined"
        color="textSecondary"
        testID={`${testID}-back`}
      />
      <Text
        variant="headingBold"
        color="textPrimary"
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Text>
      {trailing ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    backgroundColor: lightTheme.colors.surface,
  },
  divider: {
    borderBottomWidth: lightTheme.stroke.hairline,
    borderBottomColor: lightTheme.colors.borderField,
  },
  title: { flexShrink: 1 },
});
