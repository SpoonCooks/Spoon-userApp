import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, IconButton, Text, lightTheme } from '@ui';

import type { HomeHeaderViewModel } from '../types';

/**
 * Home header — Figma `59:520` / `1:455` top block: a lime bar carrying the ETA headline, the
 * profile avatar, and the address selector beneath it.
 *
 * The ETA headline is server copy. Nothing here computes a time.
 */
export interface HomeHeaderProps {
  readonly header: HomeHeaderViewModel;
  readonly onPressAddress: () => void;
  readonly onPressProfile: () => void;
}

export function HomeHeader({ header, onPressAddress, onPressProfile }: HomeHeaderProps) {
  return (
    <View style={styles.container} testID="home-header">
      <View style={styles.topRow}>
        <View style={styles.eta}>
          <Icon name="instant" size={16} color="textOnAccent" />
          <Text variant="title" color="textOnAccent">
            {header.etaHeadline}
          </Text>
        </View>
        <IconButton
          name="user"
          label="Profile"
          onPress={onPressProfile}
          variant="accent"
          testID="home-profile"
        />
      </View>

      <Pressable
        onPress={onPressAddress}
        accessibilityRole="button"
        accessibilityLabel={`Delivery address: ${header.addressLabel}, ${header.addressLine}. Change`}
        style={styles.address}
        testID="home-address"
      >
        <View style={styles.addressLabel}>
          <Text variant="bodyStrong" color="textOnAccent">
            {header.addressLabel}
          </Text>
          <Icon name="down" size={14} color="textOnAccent" />
        </View>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {header.addressLine}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.md,
    paddingBottom: lightTheme.space.lg,
    borderBottomLeftRadius: lightTheme.layout.cardRadius,
    borderBottomRightRadius: lightTheme.layout.cardRadius,
    backgroundColor: lightTheme.colors.surfacePositive,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eta: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs, flexShrink: 1 },
  address: { gap: lightTheme.space.xxs },
  addressLabel: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
});
