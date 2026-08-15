import { StyleSheet, View } from 'react-native';

import { Text, lightTheme } from '@ui';

import { HOME_DESIGN } from '../layout';

/**
 * The shared Home section title — Figma `209:1274` / `209:1355` / `209:1376`.
 *
 * A 31pt block holding Livvic Black 16/24 at −0.4 tracking, centred over a 305pt measure. The
 * measure is a `maxWidth`, not a fixed width: on a 320dp phone the content column is 288, and a
 * hard 305 would overflow.
 */
export function SectionTitle({ children }: { readonly children: string }) {
  return (
    <View style={styles.block}>
      <Text variant="heading" color="textPrimary" align="center" accessibilityRole="header">
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
});

export const sectionStyles = StyleSheet.create({
  /** `209:1254` — every section is a 24pt-radius white block with 6pt padding and a 6pt gap. */
  section: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: HOME_DESIGN.section.gap,
    paddingVertical: HOME_DESIGN.section.paddingVertical,
    borderRadius: lightTheme.layout.cardRadius,
    backgroundColor: lightTheme.colors.surface,
  },
});
