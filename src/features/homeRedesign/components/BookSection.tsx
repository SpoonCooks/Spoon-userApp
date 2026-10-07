import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPaise } from '@core/format';

import { ART } from '../assets';
import type { BookingMode, CtaKind } from '../state/bookingDraft';
import type { DurationOption } from '../types';
import { C, F, SHADOW_PILL } from '../theme';
import { BookingToggle } from './BookingToggle';
import { DurationCarousel } from './DurationCarousel';

export interface BookSectionProps {
  /** The lowest instant ETA, or `null` when instant is unavailable — regardless of the tab. */
  readonly etaMins: number | null;
  readonly mode: BookingMode;
  readonly onChangeMode: (mode: BookingMode) => void;
  readonly cta: CtaKind;
  readonly durations: readonly DurationOption[];
  readonly focusedDurationId: string;
  readonly selectedDurationId: string | null;
  readonly onFocusDuration: (id: string) => void;
  readonly onSelectDuration: (id: string) => void;
  readonly isAvailable: (duration: DurationOption) => boolean;
  readonly pricingStatus: 'ready' | 'loading' | 'error';
  readonly onPressUnavailable: (duration: DurationOption) => void;
  readonly onRetryPricing: () => void;
  readonly canBook: boolean;
  readonly onPressBook: () => void;
  readonly onPressHelpMePick: () => void;
  readonly onPressPaymentDetails: () => void;
}

/**
 * `1047:6923` "Book section" and its states — `1222:23630` selected (Now), `1222:24656` schedule
 * (Later), `1303:1333` instantNA.
 *
 * The header caption is a function of instant availability only: "Arriving in x mins" while it
 * is available, "Instant · Unavailable" with a grey bolt while it is not, whichever tab is on.
 *
 * CTA:
 *   book      lime "Book now · ₹payable" (the server's price incl. GST) + "Check payment details";
 *             before a tap it is the disabled grey "Book Now" alone (`1255:3181`).
 *   schedule  yellow "Schedule", no payment link; grey until a duration is tapped.
 */
export function BookSection({
  etaMins,
  mode,
  onChangeMode,
  cta,
  durations,
  focusedDurationId,
  selectedDurationId,
  onFocusDuration,
  onSelectDuration,
  isAvailable,
  pricingStatus,
  onPressUnavailable,
  onRetryPricing,
  canBook,
  onPressBook,
  onPressHelpMePick,
  onPressPaymentDetails,
}: BookSectionProps) {
  const selected = durations.find((d) => d.id === selectedDurationId);
  const live = canBook && selected !== undefined && pricingStatus === 'ready';
  // The design has no Selected variant for a side tile, so when the choice is scrolled off-centre
  // the CTA names it (the tile dev note's proposal).
  const named = selected !== undefined && selected.id !== focusedDurationId;

  const label =
    cta === 'schedule'
      ? live && named
        ? `Schedule  ·  ${selected.label}`
        : 'Schedule'
      : live
        ? named
          ? `Book now  ·  ${selected.label}  ·  ${formatPaise(selected.payablePaise)}`
          : `Book now  ·  ${formatPaise(selected.payablePaise)}`
        : // `1255:3181` — before a duration is tapped the disabled button reads just "Book Now".
          'Book Now';

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={styles.title}>Select duration to book</Text>
          <View style={styles.eta}>
            <Image source={etaMins === null ? ART.flashOff : ART.flash} style={styles.flash} />
            {etaMins === null ? (
              <Text style={styles.etaLabel}>Instant · Unavailable</Text>
            ) : (
              <View style={styles.etaRow}>
                <Text style={styles.etaLabel}>Arriving in</Text>
                <View style={styles.etaChip}>
                  <Text style={styles.etaValue}>{`${etaMins} mins`}</Text>
                </View>
              </View>
            )}
          </View>
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

      <BookingToggle
        value={mode}
        onChange={onChangeMode}
        muted={mode === 'now' && etaMins === null}
      />

      {cta === 'none' ? null : (
        <>
          <DurationCarousel
            durations={durations}
            focusedId={focusedDurationId}
            selectedId={selectedDurationId}
            isAvailable={isAvailable}
            status={pricingStatus}
            onFocus={onFocusDuration}
            onSelect={onSelectDuration}
            onPressUnavailable={onPressUnavailable}
            onRetry={onRetryPricing}
          />
          <View style={styles.cta}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !live }}
              disabled={!live}
              onPress={onPressBook}
              style={[
                styles.button,
                !live
                  ? styles.buttonDisabled
                  : cta === 'book'
                    ? styles.buttonBook
                    : styles.buttonSchedule,
              ]}
            >
              <Text style={[styles.buttonLabel, live ? null : styles.buttonLabelDisabled]}>
                {label}
              </Text>
            </Pressable>
            {/* `1255:3181` draws no link under the disabled button; it comes with the price. */}
            {cta === 'book' && live ? (
              <Pressable accessibilityRole="link" onPress={onPressPaymentDetails}>
                <Text style={styles.link}>Check payment details</Text>
              </Pressable>
            ) : null}
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
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flash: { width: 32, height: 32 },
  etaLabel: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20, color: C.text },
  etaChip: {
    height: 24,
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
  /** `1222:23640` — lime "Book now". */
  buttonBook: { backgroundColor: C.lime },
  /** `1222:24666` — yellow "Schedule". */
  buttonSchedule: { backgroundColor: C.brand },
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
