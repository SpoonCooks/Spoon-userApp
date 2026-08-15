import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { createServerClock, splitDuration, useCountdown } from '@core/time';
import {
  BOOKING_IN_SERVICE_ART,
  BOOKING_NOTE_SHIELD_ART,
  CookCard,
  NoteCard,
  StatusBanner,
} from '@ui';
import type { CookViewModel } from '@ui';

import { ExtendPromoCard } from './ExtendPromoCard';
import { ServiceHandoverBlock } from './ServiceHandoverBlock';
import type { InServiceViewModel } from '../types';

/**
 * In service — Figma `101:1812` (with `3:1848` as its top-fold).
 *
 * `101:1881` stacks four blocks 22pt apart, exactly as Arrived does:
 *   status banner (`101:1882`) → extension promo (`101:1857`) → End Service + End OTP
 *   (`101:1893`) → cook card (`101:1911`) → note (`101:2040`).
 *
 * The banner is the SAME component as En route and Arrived — `101:1882` differs from `99:1610`
 * only in its 31pt glyph (a frying pan), its copy and the figure in the 117 × 103 panel. The
 * countdown occupies that panel.
 *
 * The countdown is PRESENTATION ONLY (FRONTEND_FOUNDATION_PLAN.md §19):
 *  - it derives from the server's absolute `endsAtMs`, corrected by the server-reported skew;
 *  - it recomputes on foreground rather than trusting a background timer;
 *  - reaching zero calls `onElapsed`, which REFETCHES authoritative state. It never ends the
 *    session, never advances the booking, and never decides anything.
 *
 * The End OTP is displayed for the user to read out. It is not verified here.
 */
export interface InServiceBodyProps {
  readonly inService: InServiceViewModel;
  readonly cook?: CookViewModel;
  readonly onCallCook?: () => void;
  readonly onExtend: () => void;
  readonly onEndService: () => void;
  /** Called when the countdown reaches zero. Must refetch, not transition. */
  readonly onElapsed: () => void;
}

function formatRemaining(ms: number): string {
  const { hours, minutes } = splitDuration(ms);
  const totalMinutes = hours * 60 + minutes;
  return `${totalMinutes} mins`;
}

export function InServiceBody({
  inService,
  cook,
  onCallCook,
  onExtend,
  onEndService,
  onElapsed,
}: InServiceBodyProps) {
  const clock = useMemo(() => createServerClock(inService.clockSkewMs), [inService.clockSkewMs]);
  const { remainingMs } = useCountdown(inService.endsAtMs, clock, { onElapsed });

  return (
    <View style={styles.container} testID="in-service-body">
      <StatusBanner
        title={inService.statusTitle}
        message={inService.statusMessage}
        tone="positive"
        art={BOOKING_IN_SERVICE_ART}
        highlight={formatRemaining(remainingMs)}
        testID="in-service-banner"
      />

      <ExtendPromoCard
        prompt={inService.extendPrompt}
        ctaLabel={inService.extendCtaLabel}
        onExtend={onExtend}
        testID="in-service-extend"
      />

      <ServiceHandoverBlock
        ctaLabel={inService.endCtaLabel}
        onPress={onEndService}
        otpCode={inService.otpCode}
        otpTitle={inService.otpTitle}
        otpCaption={inService.otpCaption}
        tone="end"
        testID="in-service-handover"
      />

      {cook === undefined ? null : (
        <CookCard
          cook={cook}
          {...(onCallCook === undefined ? {} : { onCallCook })}
          testID="in-service-cook"
        />
      )}

      <NoteCard
        title={inService.noteTitle}
        body={inService.noteBody}
        art={BOOKING_NOTE_SHIELD_ART}
        artSize="square"
        testID="in-service-note"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /** `101:1881` — 22pt between blocks, matching Arrived's `3:1673`. */
  container: { gap: 22 },
});
