import { StyleSheet, View } from 'react-native';

import { Text, lightTheme } from '@ui';

import { HOME_DESIGN } from '../layout';

/**
 * The shared Home section title — Figma `132:49` / `135:55` / `139:171`.
 *
 * A 31pt block holding Livvic Black 16/24 at −0.4 tracking, centred over a 305pt measure. The
 * measure is a `maxWidth`, not a fixed width: on a 320dp phone the content column is 288, and a
 * hard 305 would overflow.
 *
 * `144:437` "Spoon's promise" is the ONE exception in the file — Livvic **Bold 12/16** in a 16pt
 * block. It is a `variant`, not a second component, so the two cannot drift apart.
 */
export type SectionTitleVariant = 'heading' | 'compact';

export function SectionTitle({
  children,
  variant = 'heading',
}: {
  readonly children: string;
  readonly variant?: SectionTitleVariant;
}) {
  const compact = variant === 'compact';

  return (
    <View style={[styles.block, compact ? styles.blockCompact : null]}>
      <Text
        variant={compact ? 'bodyBold' : 'heading'}
        color="textPrimary"
        align="center"
        accessibilityRole="header"
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    height: HOME_DESIGN.sectionTitle.height,
    width: '100%',
    maxWidth: HOME_DESIGN.sectionTitle.width,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blockCompact: { height: HOME_DESIGN.sectionTitle.promiseHeight },
});

export const sectionStyles = StyleSheet.create({
  /**
   * `1:595` / `135:53` / `144:435` — every Home section is a 24pt-radius block inset **4pt**
   * horizontally and padded 6pt vertically.
   *
   * `1:595` alone carries no fill where the others are white; the page ground behind it is white
   * too, so the composite is identical and one style serves all six.
   */
  section: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: HOME_DESIGN.section.gap,
    paddingHorizontal: HOME_DESIGN.section.paddingHorizontal,
    paddingVertical: HOME_DESIGN.section.paddingVertical,
    borderRadius: lightTheme.layout.cardRadius,
    backgroundColor: lightTheme.colors.surface,
  },
  /**
   * The title-to-content gap is NOT uniform: `1:595` and `135:53` draw 12 where `135:79`,
   * `139:169` and `144:435` draw 6. Both are real; neither is averaged.
   */
  gapWide: { gap: HOME_DESIGN.section.gapWide },
});
