import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui';

import { HOME_APP_LOGO } from '../assets';
import { HOME_DESIGN } from '../layout';
import { SectionTitle, sectionStyles } from './SectionTitle';

/**
 * "Spoon's promise" — Figma `144:435`, closing the page.
 *
 * Two changes in the current file. Its title (`144:437`) is the ONE section heading set in Livvic
 * **Bold 12/16** rather than Black 16/24 — carried as `SectionTitle`'s `compact` variant. And the
 * 40pt mark (`156:44`) is no longer alone: `319:3340` sets a Livvic Regular 9/13.5 line **10pt**
 * to its right, over a 254pt measure.
 *
 * The line is server copy, like every other string on Home.
 */
export function HomePromise({ title, promise }: HomePromiseProps) {
  return (
    <View style={sectionStyles.section} testID="home-promise">
      <SectionTitle variant="compact">{title}</SectionTitle>
      <View style={styles.vision}>
        <Image
          source={HOME_APP_LOGO}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Spoon"
        />
        {promise === undefined ? null : (
          <Text variant="micro" color="textPrimary" style={styles.line}>
            {promise}
          </Text>
        )}
      </View>
    </View>
  );
}

export interface HomePromiseProps {
  readonly title: string;
  /** `319:3340` — "Cooking food tailored to your taste, needs and moods". */
  readonly promise?: string;
}

const styles = StyleSheet.create({
  /** `144:438` — a 304pt row: the mark, 10pt, then the line. */
  vision: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: HOME_DESIGN.promise.gap,
  },
  logo: { width: HOME_DESIGN.promise.logo, height: HOME_DESIGN.promise.logo },
  line: { flex: 1, minWidth: 0 },
});
