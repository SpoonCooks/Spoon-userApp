import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { TypographyToken } from '@ui/tokens/semantic';

/**
 * The lime "instead of this, try that" prompt — Figma `6:63` (reschedule instead of cancelling),
 * `104:2378` (the same on the refund step), `143:358` (the Extension sheet's "not able to
 * extend?"), `115:2745` ("make another booking?") and `201:89` (the auto-cancel rebook).
 *
 * All five are one block: `#ECFF9B` at a 24pt radius with 15.889pt padding, holding a 44pt text
 * area — a centred Livvic Bold title with the second line 22pt below it in Livvic Regular 11/16.5
 * at 80% black — and, on three of the five, a full-width `#CFFF04` pill beneath at a 12pt gap.
 *
 * `115:2748` and `201:91` carry a single Livvic Bold 15/24 line instead of the 12/16 pair,
 * which is why the title's variant is a prop rather than a constant.
 */
export interface PromptBlockProps {
  readonly title: string;
  readonly body?: string;
  /** `6:65` uses Bold 12/16; `115:2748` and `201:91` use Bold 15/24. */
  readonly titleVariant?: Extract<TypographyToken, 'bodyBold' | 'titleRebook'>;
  /** The CTA drawn inside the block (`6:68`, `104:2384`, `143:364`). */
  readonly children?: ReactNode;
  readonly testID?: string;
}

export function PromptBlock({
  title,
  body,
  titleVariant = 'bodyBold',
  children,
  testID = 'prompt-block',
}: PromptBlockProps) {
  return (
    <View style={styles.block} testID={testID}>
      <View style={styles.text}>
        <Text variant={titleVariant} color="textPrimary" align="center">
          {title}
        </Text>
        {body === undefined ? null : (
          <Text variant="bodySmall" color="textSeparator" align="center">
            {body}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  /** `6:63` — `#ECFF9B`, 24pt radius, 15.889pt padding, 12pt above the CTA. */
  block: {
    alignSelf: 'stretch',
    gap: lightTheme.space.md,
    padding: 15.889,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surfacePositive,
  },
  /** `103:2258` — a 44pt area; the second line starts 22pt down, i.e. 6pt clear of the first. */
  text: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 44,
    gap: lightTheme.space.s6,
  },
});
