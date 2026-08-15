import { StyleSheet, View } from 'react-native';

import { lightTheme } from '@ui';

import type { HomeMarketingViewModel } from '../types';
import { HomeCuisines } from './HomeCuisines';
import { HomeDurationMatrix } from './HomeDurationMatrix';
import { HomeExclusions } from './HomeExclusions';
import { HomePromise } from './HomePromise';
import { HomeReasons } from './HomeReasons';

/**
 * The long-form stack below the booking tiles on Page 3a (`1:455`), in frame order:
 * cuisine mosaic → reasons grid → duration matrix → exclusions → Spoon's promise.
 *
 * All of it is server-owned CONTENT rendered from data; none of it computes or constrains
 * anything. The duration matrix in particular is a reference table, not a rule.
 */
export interface HomeMarketingProps {
  readonly marketing: HomeMarketingViewModel;
}

export function HomeMarketing({ marketing }: HomeMarketingProps) {
  return (
    <View style={styles.stack} testID="home-marketing">
      <HomeCuisines title={marketing.cuisinesTitle} cuisines={marketing.cuisines} />
      <HomeReasons title={marketing.reasonsTitle} reasons={marketing.reasons} />
      <HomeDurationMatrix
        title={marketing.durationGuideTitle}
        columns={marketing.durationGuideColumns}
        rows={marketing.durationGuide}
      />
      <HomeExclusions title={marketing.exclusionsTitle} exclusions={marketing.exclusions} />
      <HomePromise title={marketing.promiseTitle} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { alignSelf: 'stretch', gap: lightTheme.layout.sectionGap },
});
