import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadExpoVideo } from '@core/native';
import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { FEEDBACK_ART } from '../assets';
import type { FeedbackMediaItem } from './model';

/**
 * A submitted rating's photo or video, full-screen (dev note "Submitted", `2306:929`: "media opens
 * full-screen"). The photo fits the screen; the video plays with the system controls. A close
 * disc sits top-left, and the hardware back closes it too.
 */
export function MediaViewer({
  item,
  onClose,
  testID = 'media-viewer',
}: {
  readonly item: FeedbackMediaItem;
  readonly onClose: () => void;
  readonly testID?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root} testID={testID}>
        {item.kind === 'photo' ? (
          <Image
            source={{ uri: item.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            accessibilityLabel="Your photo"
          />
        ) : (
          <FullVideo uri={item.uri} />
        )}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={lightTheme.space.sm}
          style={[styles.close, { top: insets.top + 12 }]}
          testID={`${testID}-close`}
        >
          <Image source={FEEDBACK_ART.close} style={styles.closeIcon} />
        </Pressable>
      </View>
    </Modal>
  );
}

function FullVideo({ uri }: { readonly uri: string }) {
  const video = loadExpoVideo();
  if (video === null) {
    return (
      <View style={styles.unavailable}>
        <Text variant="spoonBodyStrong" color="textInverse" align="center">
          Update the app to play this video.
        </Text>
      </View>
    );
  }
  return <NativeFullVideo video={video} uri={uri} />;
}

function NativeFullVideo({
  video,
  uri,
}: {
  readonly video: NonNullable<ReturnType<typeof loadExpoVideo>>;
  readonly uri: string;
}) {
  const player = video.useVideoPlayer(uri, (instance) => {
    instance.play();
  });
  return (
    <video.VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lightTheme.colors.textPrimary },
  close: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  closeIcon: { width: 24, height: 24 },
  unavailable: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
