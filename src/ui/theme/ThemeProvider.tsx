import { createContext, useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';

import {
  elevations,
  fontFamily,
  fontSize,
  lineHeight,
  radius,
  space,
  stroke,
} from '@ui/tokens/primitives';
import {
  darkColors,
  elevation,
  layout,
  lightColors,
  toneColors,
  typography,
} from '@ui/tokens/semantic';
import type { ColorTokens } from '@ui/tokens/semantic';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  readonly name: ThemeName;
  readonly colors: ColorTokens;
  readonly tones: typeof toneColors;
  readonly space: typeof space;
  readonly radius: typeof radius;
  readonly stroke: typeof stroke;
  readonly fontFamily: typeof fontFamily;
  readonly fontSize: typeof fontSize;
  readonly lineHeight: typeof lineHeight;
  readonly elevations: typeof elevations;
  readonly elevation: typeof elevation;
  readonly typography: typeof typography;
  readonly layout: typeof layout;
}

function buildTheme(name: ThemeName): Theme {
  return {
    name,
    colors: name === 'dark' ? darkColors : lightColors,
    tones: toneColors,
    space,
    radius,
    stroke,
    fontFamily,
    fontSize,
    lineHeight,
    elevations,
    elevation,
    typography,
    layout,
  };
}

export const lightTheme = buildTheme('light');

const ThemeContext = createContext<Theme>(lightTheme);

/**
 * Only a light theme is evidenced in Figma, so the provider pins light by default rather than
 * following the OS. The dark branch exists so adopting it later is a token change, not a refactor.
 */
export function ThemeProvider({
  name = 'light',
  children,
}: PropsWithChildren<{ name?: ThemeName }>) {
  const value = useMemo(() => buildTheme(name), [name]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
