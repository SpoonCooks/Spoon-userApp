import { Image, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Cook / user avatar with an initials fallback.
 *
 * The image URL is always supplied by the caller; nothing here builds a CDN path.
 * TODO(backend-contract): the photo field name and any sizing/transform parameters are unknown.
 */

export type AvatarSize = 'sm' | 'md' | 'lg';

const DIMENSION: Record<AvatarSize, number> = { sm: 40, md: 56, lg: 72 };

export interface AvatarProps {
  readonly name: string;
  readonly uri?: string;
  readonly size?: AvatarSize;
  readonly testID?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return `${first}${second}`.toUpperCase();
}

export function Avatar({ name, uri, size = 'md', testID }: AvatarProps) {
  const dimension = DIMENSION[size];
  const shape = { width: dimension, height: dimension };

  if (uri === undefined || uri.length === 0) {
    return (
      <View
        testID={testID}
        accessible
        accessibilityRole="image"
        accessibilityLabel={name}
        style={[styles.base, styles.fallback, shape]}
      >
        <Text variant="bodyStrong" color="textSecondary">
          {initialsOf(name)}
        </Text>
      </View>
    );
  }

  return (
    <Image
      testID={testID}
      source={{ uri }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[styles.base, shape]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: lightTheme.layout.avatarRadius,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
