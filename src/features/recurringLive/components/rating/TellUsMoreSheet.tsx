import { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import {
  FEEDBACK_FIXTURE,
  FEEDBACK_PROMPT,
  RECORDER_BARS,
  RECORDER_BARS_RECORDED,
  VOICE_NOTE_BARS,
  addedSummary,
} from '../../data/rating';
import type { FeedbackMedia } from '../../data/rating';
import { RATING_ART } from './assets';

/**
 * Tell us more — Figma `1501:7201` ("4 · Tell us more"), component `Feedback sheet / Recording`
 * (`1501:7203`), opened from the rate card's say-more row.
 *
 * Geometry, verbatim:
 *   sheet     white, r28, pt12 / px20 / pb20, 18pt between blocks, children centred
 *   grabber   `1501:7204` — 36 × 4, r2, black 15 %
 *   header    `1501:7205` — Title 20/28 over Caption at 55 % (2pt), a 36pt black-6 % close well
 *   recorder  `1501:7212` — `#FFF7CC`, 1.5pt `#FFE666`, r24, p16, 16pt gap: 8pt live dot + 0:23
 *             Display 24/32 + "Listening…"; a 44-tall waveform of 3.5pt bars at 3.6 (26 recorded
 *             black, 12 pending at black 15 %); the prompt at 60 %; controls 28pt apart — 44pt
 *             white Discard, 72pt `#FFD600` Stop with an 8pt `#FFD600`-35 % ring drawn OUTSIDE
 *             it (88 across on the frame), 44pt white Save
 *   written   `1517:9325` — Caption Strong label at 70 %, 12pt over a black-3 % r8 p12 field
 *   added     `1501:7267` — head row (Caption Strong 70 % / Micro 50 %); the voice note (`#FFF7CC`,
 *             pl8 / pr12 / py8, r24: 32pt `#FFE666` play disc, 2.5pt bars at 2.6, 0:41); then
 *             68pt r16 thumbnails 8pt apart with a 20pt black-55 % remove disc at 44,4, and a
 *             dashed "Photo/Video" add tile
 *   CTA       `1501:7333` — 52 tall, r26, `#FFD600`, "Send feedback"
 *
 * As a sheet, only the TOP corners are rounded and the bottom pad grows to the home indicator;
 * the host is RN's `Modal` set up as `RecurringSheet` sets it, over that file's 40 % scrim.
 *
 * STATIC: nothing records, plays or uploads. The recorder is the drawn 0:23 "Listening…" state;
 * the text field and the remove discs are local state; `onSend` hands up the typed text.
 */

const SHEET_OFFSET = 900;
const ANIMATION_MS = 220;
const SHEET_BOTTOM_PAD = 20;

export interface TellUsMoreSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSend?: (feedback: { readonly text: string }) => void;
  readonly testID?: string;
}

const WASHES: Record<FeedbackMedia['wash'], readonly [ColorToken, ColorToken]> = {
  amber: ['surfaceRatingThumbAmberTop', 'surfaceRatingThumbAmberBottom'],
  green: ['surfaceRatingThumbGreenTop', 'surfaceRatingThumbGreenBottom'],
  video: ['surfaceRatingThumbVideoTop', 'surfaceRatingThumbVideoBottom'],
};

export function TellUsMoreSheet({
  visible,
  onClose,
  onSend,
  testID = 'tell-us-more-sheet',
}: TellUsMoreSheetProps) {
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [mounted, setMounted] = useState(visible);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<readonly FeedbackMedia[]>(FEEDBACK_FIXTURE.media);

  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    const animation = Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_OFFSET,
      duration: ANIMATION_MS,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, translateY]);

  if (!visible && !mounted) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      testID={`${testID}-modal`}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          testID={`${testID}-backdrop`}
        />
        <Animated.View testID={testID} style={[styles.sheet, { transform: [{ translateY }] }]}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.body,
              { paddingBottom: Math.max(SHEET_BOTTOM_PAD, insets.bottom) },
            ]}
          >
            <View style={styles.grabber} />

            {/* `1501:7205` — header. */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text variant="spoonTitle" accessibilityRole="header">
                  Tell us more
                </Text>
                <Text variant="spoonCaption" color="textRatingSubtle">
                  Just talk — we’ll take care of the rest
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={lightTheme.space.xs}
                style={styles.closeWell}
                testID={`${testID}-close`}
              >
                <Image source={RATING_ART.close} style={styles.icon} />
              </Pressable>
            </View>

            {/* `1501:7212` — recorder. */}
            <View style={styles.recorder} testID={`${testID}-recorder`}>
              <View style={styles.timer}>
                <Image source={RATING_ART.liveDot} style={styles.liveDot} />
                <Text variant="spoonDisplay">{FEEDBACK_FIXTURE.recordingTime}</Text>
                <Text variant="spoonCaption" color="textRatingSubtle">
                  Listening…
                </Text>
              </View>
              <View style={styles.waveform}>
                {RECORDER_BARS.map((height, index) => (
                  <View
                    key={index}
                    style={[
                      styles.recorderBar,
                      { height },
                      index >= RECORDER_BARS_RECORDED ? styles.recorderBarPending : null,
                    ]}
                  />
                ))}
              </View>
              <Text variant="spoonCaption" color="textSecondarySoft" align="center">
                {FEEDBACK_PROMPT}
              </Text>
              <View style={styles.controls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Discard recording"
                  style={styles.controlDisc}
                  testID={`${testID}-discard`}
                >
                  <Image source={RATING_ART.close} style={styles.icon} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Stop recording"
                  style={styles.stop}
                  testID={`${testID}-stop`}
                >
                  <View style={styles.stopRing} />
                  <View style={styles.stopFill}>
                    <View style={styles.stopSquare} />
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save recording"
                  style={styles.controlDisc}
                  testID={`${testID}-save`}
                >
                  <Image source={RATING_ART.saveCheck} style={styles.icon} />
                </Pressable>
              </View>
            </View>

            {/* `1517:9325` — written feedback. */}
            <View style={styles.block}>
              <Text variant="spoonCaptionStrong" color="textSecondary">
                Write your feedback
              </Text>
              <View style={styles.field}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={FEEDBACK_PROMPT}
                  placeholderTextColor={lightTheme.colors.textSecondarySoft}
                  multiline
                  style={styles.input}
                  testID={`${testID}-input`}
                />
              </View>
            </View>

            {/* `1501:7267` — added so far. */}
            <View style={styles.block}>
              <View style={styles.addedHead}>
                <Text variant="spoonCaptionStrong" color="textSecondary">
                  Added so far
                </Text>
                <Text variant="spoonMicro" color="textRatingMeta">
                  {addedSummary(1, media)}
                </Text>
              </View>

              <View style={styles.voiceNote} testID={`${testID}-voice-note`}>
                <View style={styles.voicePlayDisc}>
                  <Image source={RATING_ART.voicePlay} style={styles.icon} />
                </View>
                <View style={styles.voiceWave}>
                  {VOICE_NOTE_BARS.map((height, index) => (
                    <View key={index} style={[styles.voiceBar, { height }]} />
                  ))}
                </View>
                <Text variant="spoonCaptionStrong">{FEEDBACK_FIXTURE.voiceNote.duration}</Text>
              </View>

              <View style={styles.media}>
                {media.map((item) => {
                  const [top, bottom] = WASHES[item.wash];
                  return (
                    <View key={item.id} style={styles.thumb} testID={`${testID}-${item.id}`}>
                      <LinearGradient
                        colors={[lightTheme.colors[top], lightTheme.colors[bottom]]}
                        locations={[0, 0.83333]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      {item.kind === 'photo' ? (
                        <Image source={RATING_ART.dish} style={styles.thumbDish} />
                      ) : (
                        <>
                          <View style={styles.thumbPlayDisc}>
                            <Image source={RATING_ART.videoPlay} style={styles.thumbPlay} />
                          </View>
                          <Text
                            variant="spoonMicroStrong"
                            color="textInverse"
                            style={styles.thumbDuration}
                          >
                            {item.duration}
                          </Text>
                        </>
                      )}
                      <Pressable
                        onPress={() =>
                          setMedia((current) => current.filter((entry) => entry.id !== item.id))
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.kind}`}
                        hitSlop={lightTheme.space.xs}
                        style={styles.thumbRemove}
                        testID={`${testID}-${item.id}-remove`}
                      >
                        <Image source={RATING_ART.removeClose} style={styles.removeGlyph} />
                      </Pressable>
                    </View>
                  );
                })}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add photo or video"
                  style={styles.addTile}
                  testID={`${testID}-add`}
                >
                  {/* `167:25` — `Icon/Add` is two 2pt bars, drawn as rectangles in the file. */}
                  <View style={styles.addIcon}>
                    <View style={styles.addBarH} />
                    <View style={styles.addBarV} />
                  </View>
                  <Text
                    variant="spoonMicro"
                    color="textSecondarySoft"
                    align="center"
                    style={styles.addLabel}
                  >
                    Photo/Video
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* `1501:7333` — CTA. */}
            <Pressable
              onPress={() => onSend?.({ text })}
              accessibilityRole="button"
              style={styles.send}
              testID={`${testID}-send`}
            >
              <Text variant="spoonButton">Send feedback</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const THUMB = 68;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lightTheme.colors.scrimRecurringSheet },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    marginTop: 'auto',
    maxHeight: '92%',
    backgroundColor: lightTheme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  /** `1501:7203` — pt12 / px20, 18pt gap, centred. */
  body: {
    paddingTop: lightTheme.space.md,
    paddingHorizontal: 20,
    gap: lightTheme.space.s18,
    alignItems: 'center',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: lightTheme.colors.surfaceRatingGrabber,
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
  },
  headerText: { flex: 1, gap: lightTheme.space.xxs },
  closeWell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: lightTheme.colors.surfaceRatingCloseWell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 24, height: 24 },
  recorder: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.surfaceAccentBold,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  timer: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.sm },
  liveDot: { width: 8, height: 8 },
  /** `1501:7217` — 44 tall, 3.6 between 3.5pt bars. */
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3.6, height: 44 },
  recorderBar: {
    width: 3.5,
    borderRadius: 1.75,
    backgroundColor: lightTheme.colors.textPrimary,
  },
  recorderBarPending: { backgroundColor: lightTheme.colors.surfaceRatingGrabber },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  controlDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: lightTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `1501:7261` — the 72pt button; its 8pt ring overhangs without taking layout. */
  stop: { width: 72, height: 72 },
  stopRing: {
    position: 'absolute',
    left: -8,
    top: -8,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: lightTheme.colors.surfaceRatingStopRing,
  },
  stopFill: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: lightTheme.colors.surfaceCta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `1501:7263` — a 14pt black square at r3 inside the 24pt `Icon/Stop`. */
  stopSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: lightTheme.colors.textPrimary,
  },
  block: { alignSelf: 'stretch', gap: lightTheme.space.md },
  /** `1501:7331` — black 3 %, p12, r8. */
  field: {
    padding: lightTheme.space.md,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceRatingQuiet,
  },
  input: {
    ...lightTheme.typography.spoonCaption,
    color: lightTheme.colors.textPrimary,
    padding: 0,
    minHeight: 32,
    textAlignVertical: 'top',
  },
  addedHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  /** `1501:7271` — pl8 / pr12 / py8, r24, 8pt gap. */
  voiceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingLeft: lightTheme.space.sm,
    paddingRight: lightTheme.space.md,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.lg,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  voicePlayDisc: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `1501:7275` — 22 tall, 2.6 between 2.5pt bars, clipped to the row. */
  voiceWave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.6,
    height: 22,
    overflow: 'hidden',
  },
  voiceBar: {
    width: 2.5,
    borderRadius: 1.25,
    backgroundColor: lightTheme.colors.surfaceRatingWave,
  },
  media: { flexDirection: 'row', gap: lightTheme.space.sm },
  thumb: { width: THUMB, height: THUMB, borderRadius: lightTheme.radius.md, overflow: 'hidden' },
  thumbDish: { position: 'absolute', left: 22, top: 22, width: 24, height: 24 },
  /** `1501:7323` — 28pt white-90 % disc at 20,20; the 21.6pt play at 3,1.5 inside it. */
  thumbPlayDisc: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: lightTheme.colors.surfaceRatingPlayDisc,
  },
  thumbPlay: { position: 'absolute', left: 3, top: 1.5, width: 21.6, height: 21.6 },
  thumbDuration: { position: 'absolute', left: 8, top: 50 },
  /** `1501:7310` — 20pt black-55 % disc at 44,4. */
  thumbRemove: {
    position: 'absolute',
    left: 44,
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: lightTheme.colors.surfaceRatingRemove,
  },
  removeGlyph: { width: 20, height: 20 },
  /** `1501:7327` — white, 1.5pt dashed black 20 %, r16. */
  addTile: {
    width: THUMB,
    height: THUMB,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.borderRatingAdd,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `1501:7328` — 24pt at 20.5,12.5 inside the 1.5pt border (centred on the 65pt inner box). */
  addIcon: { position: 'absolute', left: 20.5, top: 12.5, width: 24, height: 24 },
  addBarH: {
    position: 'absolute',
    left: 4,
    top: 11,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: lightTheme.colors.textPrimary,
  },
  addBarV: {
    position: 'absolute',
    left: 11,
    top: 4,
    width: 2,
    height: 16,
    borderRadius: 1,
    backgroundColor: lightTheme.colors.textPrimary,
  },
  /** `1501:7330` — 68 wide, centred on x 32.5, top 40.5. */
  addLabel: { position: 'absolute', left: 32.5 - THUMB / 2, top: 40.5, width: THUMB },
  send: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 26,
    backgroundColor: lightTheme.colors.surfaceCta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
