import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPaise } from '@core/format';

import { ART } from '../assets';
import type { BookingMode } from '../state/bookingDraft';
import type { DurationOption } from '../types';
import { C, F, SHADOW_PILL } from '../theme';
import { BookingToggle } from './BookingToggle';
import { DurationCarousel } from './DurationCarousel';

export interface BookSectionProps {
  readonly etaMins: number | null;
  readonly mode: BookingMode;
  readonly onChangeMode: (mode: BookingMode) => void;
  readonly disabledModes: Partial<Record<BookingMode, boolean>>;
  readonly durations: readonly DurationOption[];
  readonly focusedDurationId: string;
  readonly selectedDurationId: string | null;
  readonly onFocusDuration: (id: string) => void;
  readonly onSelectDuration: (id: string) => void;
  readonly canBook: boolean;
  readonly onPressBook: () => void;
  readonly onPressHelpMePick: () => void;
  readonly onPressPaymentDetails: () => void;
}

/**
 * `1047:6923` "Book section" — header, mode toggle and, on Now / Later, the duration strip and
 * CTA. On Recurring only the header and toggle remain; the recurring block takes the rest.
 *
 * The CTA price is the selected tile's, else the focused tile's — so the disabled button still
 * reads "Book now · ₹69" over the untapped "1 hr", as drawn.
 */
export function BookSection({
  etaMins,
  mode,
  onChangeMode,
  disabledModes,
  durations,
  focusedDurationId,
  selectedDurationId,
  onFocusDuration,
  onSelectDuration,
  canBook,
  onPressBook,
  onPressHelpMePick,
  onPressPaymentDetails,
}: BookSectionProps) {
  const priced =
    durations.find((d) => d.id === (selectedDurationId ?? focusedDurationId)) ?? durations[0];
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={styles.title}>Select duration to book</Text>
          {etaMins === null ? null : (
            <View style={styles.eta}>
              <Image source={ART.flash} style={styles.flash} />
              <Text style={styles.etaLabel}>Arriving in</Text>
              <View style={styles.etaChip}>
                <Text style={styles.etaValue}>{`${etaMins} mins`}</Text>
              </View>
            </View>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onPressHelpMePick}
          style={[styles.help, SHADOW_PILL]}
        >
          <Text style={styles.helpLabel}>Help me pick</Text>
          <Image source={ART.time} style={styles.helpIcon} />
        </Pressable>
      </View>

      <BookingToggle value={mode} onChange={onChangeMode} disabled={disabledModes} />

      {mode === 'recurring' ? null : (
        <>
          <DurationCarousel
            durations={durations}
            focusedId={focusedDurationId}
            onFocus={onFocusDuration}
            onSelect={onSelectDuration}
          />
          <View style={styles.cta}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canBook }}
              disabled={!canBook}
              onPress={onPressBook}
              style={[styles.button, canBook ? styles.buttonEnabled : styles.buttonDisabled]}
            >
              <Text style={[styles.buttonLabel, canBook ? null : styles.buttonLabelDisabled]}>
                {priced === undefined
                  ? 'Book now'
                  : `Book now  ·  ${formatPaise(priced.pricePaise)}`}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={onPressPaymentDetails}>
              <Text style={styles.link}>Check payment details</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, paddingBottom: 8, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titles: { gap: 4 },
  title: { fontFamily: F.semibold, fontSize: 18, lineHeight: 26, color: C.text },
  eta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flash: { width: 32, height: 32 },
  etaLabel: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: C.text },
  etaChip: {
    height: 24,
    marginLeft: -4,
    paddingHorizontal: 4,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaValue: { fontFamily: F.semibold, fontSize: 16, lineHeight: 24, color: C.text },
  help: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: C.base,
  },
  helpLabel: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: C.text },
  helpIcon: { width: 16, height: 16 },
  cta: { alignItems: 'center', gap: 4, paddingTop: 4, paddingHorizontal: 16 },
  button: {
    minHeight: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  buttonDisabled: { backgroundColor: C.surfaceDisabled },
  buttonEnabled: { backgroundColor: C.brand },
  buttonLabel: { fontFamily: F.bold, fontSize: 16, lineHeight: 24, color: C.text },
  buttonLabelDisabled: { color: C.textDisabled },
  link: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 16,
    color: C.text,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
