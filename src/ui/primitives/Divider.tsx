import { StyleSheet, View } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

export type DividerTone = 'default' | 'accent';

export interface DividerProps {
  readonly tone?: DividerTone;
  readonly inset?: boolean;
}

/** Hairline rule. Decorative, so it is hidden from assistive technology. */
export function Divider({ tone = 'default', inset = false }: DividerProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        tone === 'accent' ? styles.accent : styles.default,
        inset ? styles.inset : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { height: lightTheme.stroke.thin, alignSelf: 'stretch' },
  default: { backgroundColor: lightTheme.colors.border },
  accent: { backgroundColor: lightTheme.colors.borderAccent },
  inset: { marginHorizontal: lightTheme.space.lg },
});
