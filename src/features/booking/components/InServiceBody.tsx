import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { createServerClock, splitDuration, useCountdown } from '@core/time';
import { CookCard, StatusBanner } from '@ui';
import type { CookViewModel } from '@ui';

import { DETAILS_GLYPH } from './ConfirmationBody';
import { ExtendPromoCard } from './ExtendPromoCard';
import { ServiceHandoverBlock } from './ServiceHandoverBlock';
import { ServiceLinkRow } from './ServiceLinkRow';
import { SERVICE_SECTION_GAP, ServiceSection } from './ServiceSection';
import { cookCardVariantFor } from '../adapters';
import type { InServiceViewModel } from '../types';

/**
 * In service — Figma `101:1812`, and `292:1197` "Page 12b- Cooking extended".
 *
 * `101:1881` stacks its section boxes 16pt apart:
 *   status banner (`292:1035`) → [extended notice] → extension promo (`101:1857`) → End Service +
 *   End OTP (`292:1046`) → cook card (`292:1064`) → details row (`292:1188`).
 *
 * TWO corrections this pass: the frame draws **no "Note before starting" card** on In service —
 * the implementation rendered one — and it DOES draw the `250:2966` details row, which it did not.
 *
 * `292:1197` is this screen with ONE extra block: `292:1399`, a second, compact status banner
 * reading "Booking extended! / End time extended by 20 mins". Its presence is the SERVER
 * reporting the extension took effect; the new end time arrives with it and is never computed
 * from the chosen option.
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
  readonly onViewDetails?: () => void;
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
  onViewDetails,
}: InServiceBodyProps) {
  const clock = useMemo(() => createServerClock(inService.clockSkewMs), [inService.clockSkewMs]);
  const { remainingMs } = useCountdown(inService.endsAtMs, clock, { onElapsed });

  return (
    <View style={styles.container} testID="in-service-body">
      <ServiceSection>
        <StatusBanner
          title={inService.statusTitle}
          message={inService.statusMessage}
          tone="positive"
          highlight={formatRemaining(remainingMs)}
          testID="in-service-banner"
        />
      </ServiceSection>

      {/* `292:1399` — only `292:1197` draws this, and only because the server says so. */}
      {inService.extendedNotice === undefined ? null : (
        <ServiceSection>
          <StatusBanner
            title={inService.extendedNotice.title}
            message={inService.extendedNotice.body}
            tone="warning"
            layout="heroCompact"
            icon="checkCircle"
            testID="in-service-extended"
          />
        </ServiceSection>
      )}

      <ServiceSection>
        <ExtendPromoCard
          prompt={inService.extendPrompt}
          ctaLabel={inService.extendCtaLabel}
          onExtend={onExtend}
          testID="in-service-extend"
        />
      </ServiceSection>

      <ServiceSection>
        <ServiceHandoverBlock
          ctaLabel={inService.endCtaLabel}
          onPress={onEndService}
          otpCode={inService.otpCode}
          otpTitle={inService.otpTitle}
          otpCaption={inService.otpCaption}
          tone="end"
          testID="in-service-handover"
        />
      </ServiceSection>

      {cook === undefined ? null : (
        <ServiceSection>
          <CookCard
            cook={cook}
            variant={cookCardVariantFor(cook.profileVariant)}
            {...(onCallCook === undefined ? {} : { onCallCook })}
            testID="in-service-cook"
          />
        </ServiceSection>
      )}

      {onViewDetails === undefined ? null : (
        <ServiceSection>
          <ServiceLinkRow
            label={inService.viewDetailsLabel}
            glyph={DETAILS_GLYPH}
            glyphOffset={-1.04}
            onPress={onViewDetails}
            testID="in-service-view-details"
          />
        </ServiceSection>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** `101:1881` — the section BOXES sit 16pt apart, matching every other service frame. */
  container: { gap: SERVICE_SECTION_GAP },
});
