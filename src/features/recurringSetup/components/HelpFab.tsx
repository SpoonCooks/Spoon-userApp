import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * `Help FAB / Recurring info` — Figma `1302:2617` (Spoon — User): a 48pt lime button with a white
 * 3pt ring, a soft lift and a "?", floating bottom right on every screen of the recurring flow.
 * Tapping it opens the Recurring landing page (service, flow, features): the frame wires every
 * instance to `970:5392`.
 *
 * Drawn INSIDE a screen's content region, which ends at the footer's top edge: the frames put the
 * button's foot 12 above it (`bottom: 118` on a 106-tall footer and home indicator), so it floats
 * 12 clear of the CTA on any device. A screen with no footer passes `bottom` (`494:1039`).
 *
 * Where it goes is the flow's business, so the screens only render the button; whoever hosts the
 * flow says what it opens by wrapping it in `RecurringInfoProvider`. With nobody listening there
 * is nothing to open, and the button is not drawn.
 */
const RecurringInfoContext = createContext<(() => void) | null>(null);

export function RecurringInfoProvider({
  onOpen,
  children,
}: {
  readonly onOpen: (() => void) | undefined;
  readonly children: ReactNode;
}) {
  return (
    <RecurringInfoContext.Provider value={onOpen ?? null}>{children}</RecurringInfoContext.Provider>
  );
}

export interface HelpFabProps {
  /** Distance from the content region's foot; 12 clears a footer's top edge. */
  readonly bottom?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function HelpFab({ bottom = FOOT_GAP, style, testID = 'recurring-help-fab' }: HelpFabProps) {
  const open = useContext(RecurringInfoContext);
  if (open === null) return null;
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel="About Recurring"
      style={[styles.fab, { bottom }, style]}
      testID={testID}
    >
      <Text variant="helpGlyph" color="textInk">
        ?
      </Text>
    </Pressable>
  );
}

const FOOT_GAP = lightTheme.space.md;
const SIZE = 48;

const styles = StyleSheet.create({
  /** `1302:2617` — lime `#CFFF04`, a 3pt white edge, `0 4 6 rgba(0,0,0,0.18)`, fully round. */
  fab: {
    position: 'absolute',
    right: lightTheme.space.lg,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    borderColor: lightTheme.colors.surface,
    backgroundColor: lightTheme.colors.surfacePositiveBright,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 6px 0px rgba(0,0,0,0.18)',
  },
});
