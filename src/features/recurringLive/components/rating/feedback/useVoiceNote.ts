import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import type { loadExpoAudio } from '@core/native';
import { localFileSize } from '@features/booking';

import { MAX_VOICE_MS, WAVE_BAR_COUNT, barFromMetering, foldBars } from './model';
import type { FeedbackVoiceNote } from './model';

/** `expo-audio`, as `loadExpoAudio` hands it over on a build that has it. */
export type ExpoAudioModule = NonNullable<ReturnType<typeof loadExpoAudio>>;

/** How often the live waveform takes a reading. */
const SAMPLE_MS = 120;

/**
 * The feedback block's voice note (`2093:5673` recording, `2093:5759` recorded): record with a
 * live waveform from the microphone's metering, stop into a note, play it back.
 *
 * Recording asks for the microphone first; a refusal explains itself and offers Settings rather
 * than failing silently. The note stops itself at {@link MAX_VOICE_MS}.
 */
export function useVoiceNote(
  audio: ExpoAudioModule,
  onRecorded: (note: FeedbackVoiceNote) => void,
) {
  const recorder = audio.useAudioRecorder({
    ...audio.RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveBars, setLiveBars] = useState<readonly number[]>([]);
  const samples = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopping = useRef(false);

  const clearTimer = () => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  };

  const stop = useCallback(async () => {
    if (stopping.current) return;
    stopping.current = true;
    clearTimer();
    try {
      const durationMs = recorder.getStatus().durationMillis;
      await recorder.stop();
      await audio.setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;
      setRecording(false);
      if (uri === null || durationMs < 500) return;
      onRecorded({
        uri,
        durationMs,
        sizeBytes: (await localFileSize(uri)) ?? 0,
        bars: foldBars(samples.current),
      });
    } finally {
      stopping.current = false;
    }
  }, [audio, onRecorded, recorder]);

  const start = useCallback(async () => {
    const permission = await audio.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Microphone is off',
        'Allow Spoon to use the microphone to record a voice note.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }
    await audio.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    samples.current = [];
    setLiveBars([]);
    setElapsedMs(0);
    setRecording(true);
    timer.current = setInterval(() => {
      const status = recorder.getStatus();
      samples.current.push(barFromMetering(status.metering));
      setLiveBars(samples.current.slice(-WAVE_BAR_COUNT));
      setElapsedMs(status.durationMillis);
      if (status.durationMillis >= MAX_VOICE_MS) void stop();
    }, SAMPLE_MS);
  }, [audio, recorder, stop]);

  useEffect(
    () => () => {
      clearTimer();
    },
    [],
  );

  return { recording, elapsedMs, liveBars, start, stop };
}

/** Plays a recorded note; `null` (the preview's drawn note) plays nothing. */
export function useVoicePlayback(audio: ExpoAudioModule, uri: string | null) {
  const player = audio.useAudioPlayer(uri === null ? null : { uri });
  const status = audio.useAudioPlayerStatus(player);
  const toggle = useCallback(() => {
    if (uri === null) return;
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
      void player.seekTo(0);
    }
    player.play();
  }, [player, status, uri]);
  return { playing: status.playing, positionMs: status.currentTime * 1000, toggle };
}
