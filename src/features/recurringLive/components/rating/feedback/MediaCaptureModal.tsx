import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { loadExpoCamera } from '@core/native';
import { loadExpoVideo } from '@core/native';
import { localFileSize, ratingMimeTypeOf } from '@features/booking';
import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { FEEDBACK_ART, RATING_ART } from '../assets';
import { MAX_VIDEO_MS, clipTime } from './model';
import type { FeedbackMediaItem } from './model';

export type CaptureMode = 'photo' | 'video';

/** `expo-camera`, as `loadExpoCamera` hands it over on a build that has it. */
export type ExpoCameraModule = NonNullable<ReturnType<typeof loadExpoCamera>>;
type CameraFacing = 'back' | 'front';

interface Captured {
  readonly kind: CaptureMode;
  readonly uri: string;
  readonly durationMs: number | null;
}

/**
 * Media capture — Figma M3 `1797:2281` (photo), M4 `1797:2316` (video recording) and M5
 * `1797:2353` (review), dev note `2238:935`:
 *
 *   - the camera fills the screen under a black 55 % control panel (pt20 / pb48, 16 apart): the
 *     PHOTO / VIDEO pill, then close (44pt white disc), the 76pt shutter (4pt white ring round a
 *     60pt white disc; recording, a 28pt red r6 stop) and flip (48pt white disc), then the hint
 *   - video counts to 0:30 in a pill at the top and stops itself there; tap to stop early
 *   - review shows the capture over a white panel: Retake (discards it) and Use photo / Use video
 *     (attaches it to the rating card and returns there)
 *
 * The camera asks for its permission on open, and video for the microphone too; a refusal says so
 * and offers Settings. Mounted only while open, so every opening starts from a clean screen.
 */
export function MediaCaptureModal({
  camera: cameraModule,
  visible,
  initialMode,
  canPhoto,
  canVideo,
  onUse,
  onClose,
  testID = 'media-capture',
}: {
  /** The loaded camera package; the card opens this screen only on a build that has it. */
  readonly camera: ExpoCameraModule;
  readonly visible: boolean;
  readonly initialMode: CaptureMode;
  readonly canPhoto: boolean;
  readonly canVideo: boolean;
  readonly onUse: (item: FeedbackMediaItem) => void;
  readonly onClose: () => void;
  readonly testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const { CameraView, useCameraPermissions, useMicrophonePermissions } = cameraModule;
  const camera = useRef<InstanceType<ExpoCameraModule['CameraView']>>(null);
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  const [facing, setFacing] = useState<CameraFacing>('back');
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ask once the screen is up: the camera always, the microphone for video.
  useEffect(() => {
    if (!visible || cameraPermission === null) return;
    if (!cameraPermission.granted && cameraPermission.canAskAgain) void requestCamera();
  }, [visible, cameraPermission, requestCamera]);
  useEffect(() => {
    if (!visible || mode !== 'video' || micPermission === null) return;
    if (!micPermission.granted && micPermission.canAskAgain) void requestMic();
  }, [visible, mode, micPermission, requestMic]);

  useEffect(
    () => () => {
      if (ticker.current !== null) clearInterval(ticker.current);
    },
    [],
  );

  const blocked =
    cameraPermission !== null && !cameraPermission.granted && !cameraPermission.canAskAgain;

  const takePhoto = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const picture = await camera.current?.takePictureAsync({ quality: 0.8 });
      if (picture?.uri !== undefined) {
        setCaptured({ kind: 'photo', uri: picture.uri, durationMs: null });
      }
    } finally {
      setBusy(false);
    }
  };

  const startVideo = async () => {
    if (micPermission?.granted !== true) {
      const answer = await requestMic();
      if (!answer.granted) {
        Alert.alert('Microphone is off', 'Allow Spoon to use the microphone to record a video.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
    }
    startedAt.current = Date.now();
    setElapsedMs(0);
    setRecording(true);
    ticker.current = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 250);
    try {
      const result = await camera.current?.recordAsync({ maxDuration: MAX_VIDEO_MS / 1000 });
      const durationMs = Math.min(MAX_VIDEO_MS, Date.now() - startedAt.current);
      if (result?.uri !== undefined) setCaptured({ kind: 'video', uri: result.uri, durationMs });
    } finally {
      if (ticker.current !== null) clearInterval(ticker.current);
      ticker.current = null;
      setRecording(false);
    }
  };

  const onShutter = () => {
    if (mode === 'photo') {
      void takePhoto();
    } else if (recording) {
      camera.current?.stopRecording();
    } else {
      void startVideo();
    }
  };

  const use = async () => {
    if (captured === null || busy) return;
    setBusy(true);
    try {
      const sizeBytes = await localFileSize(captured.uri);
      const mimeType = ratingMimeTypeOf(captured.uri);
      if (sizeBytes === null || mimeType === null) {
        Alert.alert('Couldn’t add that', 'Please try again.');
        return;
      }
      onUse({
        id: `${captured.kind}-${String(Date.now())}`,
        kind: captured.kind,
        uri: captured.uri,
        mimeType,
        sizeBytes,
        durationMs: captured.durationMs,
      });
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (recording) camera.current?.stopRecording();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.root} testID={testID}>
        {captured !== null ? (
          <Review
            captured={captured}
            busy={busy}
            bottomInset={insets.bottom}
            onRetake={() => setCaptured(null)}
            onUse={() => void use()}
            testID={`${testID}-review`}
          />
        ) : (
          <>
            {cameraPermission?.granted === true ? (
              <CameraView
                ref={camera}
                style={StyleSheet.absoluteFill}
                facing={facing}
                mode={mode === 'photo' ? 'picture' : 'video'}
                mute={false}
              />
            ) : (
              <View style={styles.permission}>
                <Text variant="spoonBodyStrong" color="textInverse" align="center">
                  {blocked
                    ? 'Camera access is off. Turn it on in Settings to add photos and videos.'
                    : 'Spoon needs the camera to add photos and videos.'}
                </Text>
                {blocked ? (
                  <Pressable
                    onPress={() => void Linking.openSettings()}
                    accessibilityRole="button"
                    style={styles.settings}
                    testID={`${testID}-settings`}
                  >
                    <Text variant="spoonButton">Open Settings</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {mode === 'video' && recording ? (
              <View style={[styles.timerPill, { top: insets.top + 14 }]} testID={`${testID}-timer`}>
                <Image source={RATING_ART.liveDot} style={styles.liveDot} />
                <Text variant="spoonEmphasis" color="textInverse">
                  {`${clipTime(elapsedMs)} / ${clipTime(MAX_VIDEO_MS)}`}
                </Text>
              </View>
            ) : null}

            <View style={[styles.controls, { paddingBottom: Math.max(48, insets.bottom + 14) }]}>
              <View style={styles.modePill}>
                {(['photo', 'video'] as const).map((value) => {
                  const on = mode === value;
                  const allowed = value === 'photo' ? canPhoto : canVideo;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setMode(value)}
                      disabled={recording || !allowed}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on, disabled: recording || !allowed }}
                      style={[
                        styles.modeOption,
                        on ? styles.modeOn : null,
                        allowed ? null : styles.dim,
                      ]}
                      testID={`${testID}-mode-${value}`}
                    >
                      <Text variant="spoonMicroStrong" color={on ? 'textPrimary' : 'textInverse'}>
                        {value === 'photo' ? 'PHOTO' : 'VIDEO'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.row}>
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Close camera"
                  style={styles.close}
                  testID={`${testID}-close`}
                >
                  <Image source={FEEDBACK_ART.close} style={styles.icon24} />
                </Pressable>
                <Pressable
                  onPress={onShutter}
                  disabled={busy || cameraPermission?.granted !== true}
                  accessibilityRole="button"
                  accessibilityLabel={
                    mode === 'photo' ? 'Take photo' : recording ? 'Stop recording' : 'Record video'
                  }
                  style={styles.shutter}
                  testID={`${testID}-shutter`}
                >
                  <View style={mode === 'video' && recording ? styles.stop : styles.shutterDisc} />
                </Pressable>
                <Pressable
                  onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
                  disabled={recording}
                  accessibilityRole="button"
                  accessibilityLabel="Flip camera"
                  style={[styles.flip, recording ? styles.flipOff : null]}
                  testID={`${testID}-flip`}
                >
                  <Image source={FEEDBACK_ART.flip} style={styles.icon24} />
                </Pressable>
              </View>
              <Text variant="spoonCaption" color="textInverse" align="center">
                {mode === 'photo'
                  ? 'Upto 5 photos can be attached'
                  : recording
                    ? 'Tap to stop · auto-stops at 30 sec'
                    : 'Tap to record · up to 30 sec'}
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

/** M5 `1797:2353` — the capture, and `Review panel` (`1797:2365` / `2248:16456`). */
function Review({
  captured,
  busy,
  bottomInset,
  onRetake,
  onUse,
  testID,
}: {
  readonly captured: Captured;
  readonly busy: boolean;
  readonly bottomInset: number;
  readonly onRetake: () => void;
  readonly onUse: () => void;
  readonly testID: string;
}) {
  return (
    <View style={styles.root} testID={testID}>
      {captured.kind === 'photo' ? (
        <Image source={{ uri: captured.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <ReviewVideo uri={captured.uri} />
      )}
      <View style={[styles.reviewPanel, { paddingBottom: Math.max(34, bottomInset + 10) }]}>
        <View style={styles.reviewActions}>
          <Pressable
            onPress={onRetake}
            disabled={busy}
            accessibilityRole="button"
            style={[styles.reviewButton, styles.retake]}
            testID={`${testID}-retake`}
          >
            <Text variant="spoonButton">Retake</Text>
          </Pressable>
          <Pressable
            onPress={onUse}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ busy }}
            style={[styles.reviewButton, styles.useButton]}
            testID={`${testID}-use`}
          >
            <Text variant="spoonButton">
              {captured.kind === 'photo' ? 'Use photo' : 'Use video'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ReviewVideo({ uri }: { readonly uri: string }) {
  const video = loadExpoVideo();
  return video === null ? null : <NativeReviewVideo video={video} uri={uri} />;
}

function NativeReviewVideo({
  video,
  uri,
}: {
  readonly video: NonNullable<ReturnType<typeof loadExpoVideo>>;
  readonly uri: string;
}) {
  const player = video.useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return (
    <video.VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lightTheme.colors.textPrimary },
  permission: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.xl,
  },
  settings: {
    height: 48,
    paddingHorizontal: lightTheme.space.xl,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  /** `1797:2323` — black 60 %, pill, px12 / py6, 8 apart: the red dot and "0:12 / 0:30". */
  timerPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: 6,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  liveDot: { width: 8, height: 8 },
  /** `1797:2295` — black 55 %, pt20 / pb48, 16 apart. */
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: lightTheme.space.lg,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  /** `1797:2296` — black 50 %, pill, p4, 4 apart; the mode in use is `#FFD600`. */
  modePill: {
    flexDirection: 'row',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modeOption: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: lightTheme.radius.pill },
  modeOn: { backgroundColor: lightTheme.colors.surfaceCta },
  dim: { opacity: 0.35 },
  /** `1797:2301` — 322 wide: close, shutter, flip, spread. */
  row: {
    width: 322,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  icon24: { width: 24, height: 24 },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: lightTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisc: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `1797:2346` — the 28pt `#FF594F` stop, r6. */
  stop: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#FF594F' },
  flip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  /** `1797:2349` — dimmed to 30 % while recording. */
  flipOff: { opacity: 0.3 },
  /** `1797:2365` — white, pt20 / px16 / pb34, the two 52pt buttons 12 apart. */
  reviewPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 20,
    paddingHorizontal: lightTheme.space.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  reviewActions: { flexDirection: 'row', gap: lightTheme.space.md },
  reviewButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retake: { borderWidth: 1.5, borderColor: lightTheme.colors.textPrimary },
  useButton: { backgroundColor: lightTheme.colors.surfaceCta },
});
