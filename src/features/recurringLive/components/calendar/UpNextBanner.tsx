import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';

import { lightTheme } from '@ui/theme/ThemeProvider';
import { FillImage } from '../FillImage';
import { CALENDAR_CHEVRON_RIGHT, UP_NEXT_BACKDROP, UP_NEXT_COOK_PHOTO } from './assets';

/**
 * `Up next banner / recurring / assigned` — Figma component `1461:6288`, "Late evening" variant,
 * instanced as `1461:6324` on `1005:132`.
 *
 * A 24pt-radius card (p 16, 12 gap): the white Caption / Heading / Body Strong stack, the 56pt
 * cook photo and a white 28pt "Go" disc carrying the 20pt chevron. The card's `#2E2766` →
 * `#0D0A22` sky is a `LinearGradient`; the `1461:6325` moon glow, crescent, stars and dots over it
 * are ONE transparent image composited from the backdrop's own vectors at their frame positions.
 *
 * Per the page note, tapping it goes to the existing live booking page; the route wires that.
 */
export interface UpNextBannerProps {
  readonly label: string;
  readonly title: string;
  readonly meta: string;
  readonly onPress?: (() => void) | undefined;
  readonly testID?: string;
}

export function UpNextBanner({
  label,
  title,
  meta,
  onPress,
  testID = 'up-next-banner',
}: UpNextBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${title}. ${meta}`}
      style={styles.card}
      testID={testID}
    >
      <LinearGradient
        colors={[
          lightTheme.colors.surfaceUpNextNightTop,
          lightTheme.colors.surfaceUpNextNightBottom,
        ]}
        style={styles.backdrop}
      />
      <FillImage source={UP_NEXT_BACKDROP} style={styles.backdrop} />

      <View style={styles.stack}>
        <Text variant="spoonCaption" color="textInverse" numberOfLines={1}>
          {label}
        </Text>
        <Text variant="spoonHeading" color="textInverse" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="spoonBodyStrong" color="textInverse" numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <View style={styles.photoSlot}>
        <Image source={UP_NEXT_COOK_PHOTO} style={styles.photo} />
      </View>

      <View style={styles.go}>
        <Image source={CALENDAR_CHEVRON_RIGHT} style={styles.chevron} />
      </View>
    </Pressable>
  );
}

const PHOTO = 56;
/** `1461:6351` — the photo's lime ring bleeds 0.89 % past the 56pt slot: it draws at 57pt. */
const PHOTO_BLEED = 57;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.lg,
    overflow: 'hidden',
  },
  /** The sky and `1461:6325` both fill the card (`inset 0`); 370 × 102 on the frame. */
  backdrop: StyleSheet.absoluteFill,
  stack: { flex: 1, gap: lightTheme.space.xs },
  photoSlot: { width: PHOTO, height: PHOTO, alignItems: 'center', justifyContent: 'center' },
  /** Transparent outside the ring already; the radius keeps the edge clean on any scale. */
  photo: { width: PHOTO_BLEED, height: PHOTO_BLEED, borderRadius: PHOTO_BLEED / 2 },
  /** `1461:6352` — white disc, 4 inset around a 20pt chevron. */
  go: {
    padding: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surface,
  },
  chevron: { width: 20, height: 20 },
});
