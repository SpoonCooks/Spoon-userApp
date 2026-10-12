import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { Sheet } from '@ui/v2/Sheet';

import { FEEDBACK_ART } from '../assets';

export type MediaSource = 'photo' | 'video' | 'gallery';

/**
 * M1 · "Add photos & videos" — Figma `1796:3298`. Opened from the feedback block's Media tile:
 * Title 20/28 with a 32pt `#FFF7CC` close well, the 500 MB note, then three `Media option`s
 * (`2036:16003`) — a 56pt `#FFE666` well over a Caption Strong label, 12 apart, each a third.
 *
 * An option the rating has no room for (five photos, or a video already) is drawn dimmed and does
 * nothing; Gallery stays while either kind still fits.
 */
export function MediaSourceSheet({
  visible,
  onClose,
  onPick,
  canPhoto,
  canVideo,
  cameraAvailable,
  galleryAvailable,
  testID = 'media-source-sheet',
}: {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onPick: (source: MediaSource) => void;
  readonly canPhoto: boolean;
  readonly canVideo: boolean;
  /** This build has the camera; without it, Photo and Video are left out. */
  readonly cameraAvailable: boolean;
  /** This build has the system picker; without it, Gallery is left out. */
  readonly galleryAvailable: boolean;
  readonly testID?: string;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} testID={testID}>
      <View style={styles.header}>
        <View style={styles.title}>
          <Text variant="spoonTitle">Add photos & videos</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={lightTheme.space.sm}
            style={styles.close}
            testID={`${testID}-close`}
          >
            <Image source={FEEDBACK_ART.close} style={styles.closeIcon} />
          </Pressable>
        </View>
        <Text variant="spoonCaption" color="textSecondarySoft">
          Maximum size for media is 500 MB
        </Text>
      </View>
      <View style={styles.options}>
        {cameraAvailable ? (
          <>
            <Option
              label="Photo"
              icon={FEEDBACK_ART.camera}
              enabled={canPhoto}
              onPress={() => onPick('photo')}
              testID={`${testID}-photo`}
            />
            <Option
              label="Video"
              icon={FEEDBACK_ART.video24}
              enabled={canVideo}
              onPress={() => onPick('video')}
              testID={`${testID}-video`}
            />
          </>
        ) : null}
        {galleryAvailable ? (
          <Option
            label="Gallery"
            icon={FEEDBACK_ART.gallery24}
            enabled={canPhoto || canVideo}
            onPress={() => onPick('gallery')}
            testID={`${testID}-gallery`}
          />
        ) : null}
      </View>
    </Sheet>
  );
}

function Option({
  label,
  icon,
  enabled,
  onPress,
  testID,
}: {
  readonly label: string;
  readonly icon: ImageSourcePropType;
  readonly enabled: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      style={[styles.option, enabled ? null : styles.optionOff]}
      testID={testID}
    >
      <View style={styles.well}>
        <Image source={icon} style={styles.icon} />
      </View>
      <Text variant="spoonCaptionStrong" align="center">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: lightTheme.space.xs },
  title: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  closeIcon: { width: 16, height: 16 },
  options: { flexDirection: 'row', gap: lightTheme.space.md },
  option: { flex: 1, alignItems: 'center', gap: lightTheme.space.sm },
  optionOff: { opacity: 0.35 },
  well: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  icon: { width: 24, height: 24 },
});
