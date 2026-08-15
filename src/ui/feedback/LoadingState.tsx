import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Card } from '@ui/primitives/Card';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { Skeleton } from './Skeleton';

/**
 * Loading states.
 *
 * `spinner` — indeterminate work with no known shape (submitting, checking availability).
 * `card`    — placeholder for a list of cards (booking history, refunds, saved addresses).
 * `screen`  — a full surface while the first payload resolves.
 *
 * The DESIGNED full-screen states (`73:1036` splash, `71:747` interstitial) live in
 * `@features/loading` — they carry brand photography and belong to a feature, not to the token
 * layer. A screen whose boundary owns the whole surface renders `IntroLoading` instead of
 * `screen` (task §13).
 *
 * Announced politely so a screen reader says something is happening rather than going silent.
 */

export type LoadingVariant = 'spinner' | 'card' | 'screen';

export interface LoadingStateProps {
  readonly variant?: LoadingVariant;
  /** Neutral by default: no backend-specific copy exists yet. */
  readonly label?: string;
  /** Number of placeholder cards for the `card` variant. */
  readonly count?: number;
  readonly testID?: string;
}

export function LoadingState({
  variant = 'spinner',
  label = 'Loading',
  count = 3,
  testID,
}: LoadingStateProps) {
  if (variant === 'card') {
    return (
      <View
        testID={testID}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityState={{ busy: true }}
        style={styles.list}
      >
        {Array.from({ length: count }, (_unused, index) => (
          <Card key={index} tone="surface" testID={`${testID ?? 'loading'}-card-${index}`}>
            <View style={styles.cardBody}>
              <Skeleton width="45%" height={lightTheme.space.md} />
              <Skeleton width="70%" height={lightTheme.space.lg} />
              <Skeleton width="30%" height={lightTheme.space.md} />
            </View>
          </Card>
        ))}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={variant === 'screen' ? styles.screen : styles.inline}
    >
      <ActivityIndicator size={variant === 'screen' ? 'large' : 'small'} color={SPINNER_COLOR} />
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const SPINNER_COLOR = lightTheme.colors.textSecondary;

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingVertical: lightTheme.space.md,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.md,
  },
  list: { gap: lightTheme.space.md },
  cardBody: { gap: lightTheme.space.sm },
});
