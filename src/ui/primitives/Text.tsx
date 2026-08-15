import { Text as RNText, StyleSheet } from 'react-native';
import type { StyleProp, TextProps as RNTextProps, TextStyle } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken, TypographyToken } from '@ui/tokens/semantic';

/**
 * The only text primitive. Components never hand-roll a font size, weight or colour — they name
 * a typography token and a colour token, so a token change propagates everywhere.
 *
 * Each token carries its own Livvic `fontFamily` (see `tokens/semantic.ts`): React Native does
 * not synthesise weights, so a weight must be addressed as its own family or Android silently
 * renders the base face.
 */

export interface TextProps extends Omit<RNTextProps, 'style'> {
  readonly variant?: TypographyToken;
  readonly color?: ColorToken;
  readonly align?: TextStyle['textAlign'];
  readonly style?: StyleProp<TextStyle>;
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  children,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        styles[variant],
        { color: lightTheme.colors[color] },
        align === undefined ? null : { textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create(
  Object.fromEntries(
    Object.entries(lightTheme.typography).map(([token, value]) => [token, value]),
  ) as Record<TypographyToken, TextStyle>,
);
