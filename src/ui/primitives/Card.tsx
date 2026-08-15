import { StyleSheet, View } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Surface container. Tones are drawn from the audited frames:
 *  - `surface`  — white card with a hairline border (booking history, refunds, address rows)
 *  - `accent`   — pale-yellow wash (detail table on Confirmation, "Note before starting")
 *  - `positive` — lime wash (status banners, trust row, "Don't cancel, reschedule instead")
 *  - `muted`    — grey wash (disabled / secondary rows)
 *  - `inverse`  — the black COOK EN-ROUTE card on Home
 */
export type CardTone = 'surface' | 'accent' | 'positive' | 'muted' | 'inverse';

export interface CardProps {
  readonly tone?: CardTone;
  readonly bordered?: boolean;
  readonly padded?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  /** Set when the card groups content that a screen reader should announce as one unit. */
  readonly accessibilityLabel?: string;
  readonly header?: ReactNode;
}

export function Card({
  tone = 'surface',
  bordered = true,
  padded = true,
  style,
  testID,
  accessibilityLabel,
  header,
  children,
}: PropsWithChildren<CardProps>) {
  return (
    <View
      testID={testID}
      {...(accessibilityLabel === undefined ? {} : { accessible: true, accessibilityLabel })}
      style={[
        styles.base,
        TONE[tone],
        bordered && tone === 'surface' ? styles.bordered : null,
        padded ? styles.padded : null,
        style,
      ]}
    >
      {header}
      {children}
    </View>
  );
}

const TONE: Record<CardTone, ViewStyle> = {
  surface: { backgroundColor: lightTheme.colors.surface },
  accent: { backgroundColor: lightTheme.colors.surfaceAccent },
  positive: { backgroundColor: lightTheme.colors.surfacePositive },
  muted: { backgroundColor: lightTheme.colors.surfaceMuted },
  inverse: { backgroundColor: lightTheme.colors.surfaceInverse },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: lightTheme.layout.cardRadius,
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.border,
  },
  padded: { padding: lightTheme.layout.cardPadding },
});
