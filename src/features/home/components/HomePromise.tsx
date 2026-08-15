import { Image, StyleSheet, View } from 'react-native';

import { HOME_APP_LOGO } from '../assets';
import { HOME_DESIGN } from '../layout';
import { SectionTitle, sectionStyles } from './SectionTitle';

/**
 * "Spoon's promise" — Figma Page 3a `144:435`, re-read on `209:1375`.
 *
 * The section title over the 40pt Spoon mark (`209:1379`), closing the page. The frame carries no
 * promise copy beneath the logo; none is invented here.
 */
export function HomePromise({ title }: { readonly title: string }) {
  return (
    <View style={sectionStyles.section} testID="home-promise">
      <SectionTitle>{title}</SectionTitle>
      <View style={styles.mark}>
        <Image
          source={HOME_APP_LOGO}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Spoon"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', alignSelf: 'stretch' },
  logo: { width: HOME_DESIGN.promise.logo, height: HOME_DESIGN.promise.logo },
});
