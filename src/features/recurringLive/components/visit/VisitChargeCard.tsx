import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { VISIT_FIXTURE } from '../../data/visit';
import { VISIT_MONEY_20, VISIT_STITCH_VERTICAL } from './assets';

/**
 * `Visit charge` — Figma `1374:1409` (and `1466:8283` / `1466:8647`). White, 1pt `#FFEF99` edge,
 * 16pt corners, p 16 / 16 gap: the struck ₹399 beside the ₹299 in `Spoon/Display`, a 2×56 yellow
 * stitch, then "Pay per visit" and how it's charged. Only that last line differs between frames.
 */
export interface VisitChargeCardProps {
  readonly body: string;
  readonly testID?: string | undefined;
}

const { charge } = VISIT_FIXTURE;

export function VisitChargeCard({ body, testID = 'visit-charge' }: VisitChargeCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.amount}>
        <Text variant="spoonMicroStrong" color="textSecondarySoft" align="center">
          {charge.eyebrow}
        </Text>
        <View style={styles.price}>
          <Text variant="spoonBody" color="textSecondarySoft" style={styles.struck}>
            {charge.was}
          </Text>
          <Text variant="spoonDisplay" color="textPrimary" align="center" style={styles.now}>
            {charge.amount}
          </Text>
        </View>
        <Text variant="spoonMicro" color="textSecondarySoft" align="center">
          {charge.taxNote}
        </Text>
      </View>

      <Image source={VISIT_STITCH_VERTICAL} style={styles.stitch} />

      <View style={styles.pay}>
        <View style={styles.payTitle}>
          <Image source={VISIT_MONEY_20} style={styles.money} />
          <Text variant="spoonBodyStrong" color="textPrimary">
            {charge.title}
          </Text>
        </View>
        <Text variant="spoonCaption" color="textSecondarySoft">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderAccent,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  amount: { alignItems: 'stretch' },
  /** `1474:2499` — 8 apart, bottom-aligned. */
  price: { flexDirection: 'row', alignItems: 'flex-end', gap: lightTheme.space.sm },
  struck: { textDecorationLine: 'line-through' },
  /** `1474:2499` — the ₹299 sits in a 58pt box. */
  now: { width: 58 },
  stitch: { width: 2, height: 56 },
  pay: { flex: 1, gap: lightTheme.space.xs },
  payTitle: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
  money: { width: 20, height: 20 },
});
