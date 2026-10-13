import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import {
  VISIT_AUTOPAY_BELL,
  VISIT_AUTOPAY_MONEY,
  VISIT_AUTOPAY_RECURRING,
  VISIT_AUTOPAY_THREAD,
  VISIT_AUTOPAY_TOUCH,
} from './assets';

/**
 * `UPI Autopay explainer` — Figma `2165:13863`, under the cook section while the cook is pending.
 *
 * `#FFF8D6` → white (55 %) down a 16pt-cornered card, p 16 / 16 gap: the header (24pt recurring
 * glyph + "How UPI Autopay works", 6 apart, over its caption, 4 apart) and three steps. Each step
 * is a 32pt `#FFEF99` well holding a 24pt glyph, 12 from its title / caption pair (2 apart); the
 * first two carry 20 under their copy and a dashed 2×18 yellow thread 4 under the well.
 */
const STEPS: readonly {
  readonly key: string;
  readonly icon: ImageSourcePropType;
  readonly title: string;
  readonly body: string;
}[] = [
  {
    key: 'approve',
    icon: VISIT_AUTOPAY_TOUCH,
    title: 'Approve once',
    body: 'Authorise UPI Autopay in your UPI app while booking.',
  },
  {
    key: 'reminder',
    icon: VISIT_AUTOPAY_BELL,
    title: 'Reminder 27 hrs before',
    body: 'We notify you ahead of each day’s payment.',
  },
  {
    key: 'debit',
    icon: VISIT_AUTOPAY_MONEY,
    title: 'Auto-debit 3 hrs before',
    body: 'Your visits that day are paid together, 3 hrs before the first one. Nothing to pay manually.',
  },
];

export function UpiAutopayCard({ testID = 'visit-autopay' }: { readonly testID?: string }) {
  return (
    <View style={styles.card} testID={testID}>
      <LinearGradient
        colors={[GRADIENT_TOP, lightTheme.colors.surface]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <View style={styles.title}>
          <Image source={VISIT_AUTOPAY_RECURRING} style={styles.icon} />
          <Text variant="spoonEmphasis" color="textPrimary" style={styles.titleText}>
            How UPI Autopay works
          </Text>
        </View>
        <Text variant="spoonCaption" color="textSecondarySoft">
          Set it up once, every visit is then paid automatically.
        </Text>
      </View>
      <View>
        {STEPS.map((step, index) => {
          const last = index === STEPS.length - 1;
          return (
            <View key={step.key} style={styles.step} testID={`${testID}-${step.key}`}>
              <View style={styles.marker}>
                <View style={styles.well}>
                  <Image source={step.icon} style={styles.icon} />
                </View>
                {last ? null : <Image source={VISIT_AUTOPAY_THREAD} style={styles.thread} />}
              </View>
              <View style={[styles.copy, last ? null : styles.copyGap]}>
                <Text variant="spoonBodyStrong" color="textPrimary">
                  {step.title}
                </Text>
                <Text variant="spoonCaption" color="textSecondarySoft">
                  {step.body}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** `2165:13863` — the card's top stop. */
const GRADIENT_TOP = '#FFF8D6';

const styles = StyleSheet.create({
  card: {
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.md,
    overflow: 'hidden',
  },
  header: { gap: lightTheme.space.xs },
  title: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  /** Spoon SemiBold 16/22. */
  titleText: { lineHeight: 22 },
  icon: { width: 24, height: 24 },
  step: { flexDirection: 'row', gap: lightTheme.space.md },
  marker: { width: 32, alignSelf: 'stretch' },
  well: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
  /** `1951:14318` — x 15 (its 2pt stroke spans 14–16), 36 down, 18 long. */
  thread: { position: 'absolute', left: 14, top: 36, width: 2, height: 18 },
  copy: { flex: 1, gap: 2 },
  copyGap: { paddingBottom: 20 },
});
