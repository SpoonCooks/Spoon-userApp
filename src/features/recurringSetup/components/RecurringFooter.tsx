import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The pinned footer every recurring-setup screen draws — Spoon — User (`cCQlzTeiObQkpVBzwI8mZi`,
 * e.g. `144:2481`): a 72pt white Footer, px 16 / py 12, holding the file's Button — a 48pt `#FFD600`
 * pill with a Livvic Bold 16/24 black label, and its own soft disabled state. No rule, no lift.
 * Goes in `Screen`'s `footer` slot, which already adds 8 on top and the safe-area gutter below.
 */
export interface RecurringFooterProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  /** Content above the CTA. */
  readonly children?: ReactNode;
  readonly testID: string;
}

export function RecurringFooter({
  label,
  onPress,
  disabled = false,
  children,
  testID,
}: RecurringFooterProps) {
  return (
    <View style={styles.footer}>
      {children}
      <Button
        label={label}
        onPress={onPress}
        disabled={disabled}
        size="pillLg"
        flat
        disabledTone="soft"
        labelColor="textPrimary"
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * `144:2481` — py 12 around the button. `Screen` already gives 8 on top and the safe area below
   * (the frame's 34pt home indicator), so this adds 4 above and the full 12 below.
   */
  footer: {
    gap: lightTheme.space.sm,
    paddingTop: lightTheme.space.xs,
    paddingBottom: lightTheme.space.md,
  },
});
