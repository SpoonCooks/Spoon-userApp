import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { Button } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The pinned footer every recurring-setup screen draws (Figma `ZIJf639gTWHXshaa2YOeCT`): whatever
 * sits above the CTA, then the flat `#FFD600` 52pt bar at a 16pt radius with a Livvic Black 17/21
 * `#1A1A1A` label, in the 20pt gutter. Goes in `Screen`'s `footer` slot, which already adds 8 on top
 * and the safe-area gutter below.
 *
 *   `plain`   — `4:423` (Step 1): no rule; 12 above the content, 8 between it and the CTA.
 *   `ruled`   — `4:713` / `4:1267` / `4:1929` / `4:2000` (Steps 2–5): a 1pt `#EEEDE8` rule edge to
 *               edge, 11 below it, 8 between content and CTA.
 *   `stacked` — `4:2034` (Step 6): no rule; 14 above, 10 between the CTA and `secondary`.
 *   `pill`    — the redesigned file (`cCQlzTeiObQkpVBzwI8mZi`, e.g. `144:2481`): a 72pt white Footer,
 *               px 16 / py 12, holding the file's Button — a 48pt `#FFD600` pill with a Livvic Bold
 *               16/24 black label, and its own soft disabled state. No rule, no lift.
 */
export type RecurringFooterLayout = 'plain' | 'ruled' | 'stacked' | 'pill';

export interface RecurringFooterProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly layout?: RecurringFooterLayout;
  /** Content above the CTA — a caption, a total, a charge note. */
  readonly children?: ReactNode;
  /** Content below the CTA — Step 6's share button. */
  readonly secondary?: ReactNode;
  readonly testID: string;
}

export function RecurringFooter({
  label,
  onPress,
  disabled = false,
  layout = 'ruled',
  children,
  secondary,
  testID,
}: RecurringFooterProps) {
  return (
    <View style={LAYOUT_STYLE[layout]}>
      {children}
      {layout === 'pill' ? (
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
      ) : (
        <Button
          label={label}
          onPress={onPress}
          disabled={disabled}
          flat
          labelVariant="titleLargeBlack"
          labelColor="textInk"
          style={styles.cta}
          testID={testID}
        />
      )}
      {secondary}
    </View>
  );
}

/** The recurring frames' 20pt gutter, against `Screen`'s 16. */
const GUTTER = 20;
const SCREEN_GUTTER = lightTheme.layout.screenPaddingHorizontal;

const styles = StyleSheet.create({
  /** `4:423` — 8 from `Screen` plus 4: 12 above. */
  plain: {
    gap: lightTheme.space.sm,
    paddingTop: lightTheme.space.xs,
    paddingHorizontal: GUTTER - SCREEN_GUTTER,
  },
  /**
   * `4:713` — the rule runs edge to edge, so the footer pulls out over `Screen`'s gutter and its
   * 8 of top padding, then pads back in to 20 / 11.
   */
  ruled: {
    gap: lightTheme.space.sm,
    marginHorizontal: -SCREEN_GUTTER,
    marginTop: -lightTheme.space.sm,
    paddingHorizontal: GUTTER,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.surfaceStone,
  },
  /** `4:2034` — 8 from `Screen` plus 6: 14 above; buttons 10 apart. */
  stacked: {
    gap: lightTheme.space.s10,
    paddingTop: lightTheme.space.s6,
    paddingHorizontal: GUTTER - SCREEN_GUTTER,
  },
  /**
   * `144:2481` — py 12 around the button. `Screen` already gives 8 on top and the safe area below
   * (the frame's 34pt home indicator), so this adds 4 above and the full 12 below.
   */
  pill: {
    gap: lightTheme.space.sm,
    paddingTop: lightTheme.space.xs,
    paddingBottom: lightTheme.space.md,
  },
  /** `4:426` — a flat 52pt bar at a 16pt radius. */
  cta: { height: 52, paddingVertical: 0, borderRadius: lightTheme.radius.md },
});

const LAYOUT_STYLE: Record<RecurringFooterLayout, ViewStyle> = {
  plain: styles.plain,
  ruled: styles.ruled,
  stacked: styles.stacked,
  pill: styles.pill,
};
