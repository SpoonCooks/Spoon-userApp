import { StyleSheet, View } from 'react-native';

import {
  BOOKING_EN_ROUTE_ART,
  BOOKING_NOTE_ART,
  BOOKING_NOTE_REASSIGNED_ART,
  BOOKING_NOTE_SHIELD_ART,
  CookCard,
  NoteCard,
  NoticeCard,
  StatusBanner,
} from '@ui';
import type { CookViewModel } from '@ui';

import { ServiceHandoverBlock } from './ServiceHandoverBlock';
import type { ArrivedViewModel, ReassignedViewModel, TrackingViewModel } from '../types';

/**
 * En route and Arrived — Figma `3:1381` (on time), `99:1413` (late) and `3:1658` (arrived).
 *
 * On-time vs late is exactly two property changes (banner fill + body copy), so one component
 * renders both. **The tone comes from the server**; the client never compares an ETA to the clock
 * to decide that a cook is late (FRONTEND_FOUNDATION_PLAN.md §18 rule 4).
 *
 * Arrived adds the Start OTP block and the Start Service CTA. The OTP is server-generated and is
 * only displayed — never logged, never verified locally, and never used to advance state.
 *
 * Neither En route frame has a Cancel control (blocker B-11), so none is invented here.
 */
export interface TrackingBodyProps {
  readonly tracking: TrackingViewModel | ArrivedViewModel | ReassignedViewModel;
  readonly cook?: CookViewModel;
  readonly onCallCook?: () => void;
  readonly onStartService?: () => void;
}

type AnyTracking = TrackingViewModel | ArrivedViewModel | ReassignedViewModel;

function isArrived(value: AnyTracking): value is ArrivedViewModel {
  return 'otpCode' in value;
}

function isReassigned(value: AnyTracking): value is ReassignedViewModel {
  return 'notice' in value;
}

export function TrackingBody({ tracking, cook, onCallCook, onStartService }: TrackingBodyProps) {
  const arrived = isArrived(tracking) ? tracking : undefined;
  const reassigned = isReassigned(tracking) ? tracking : undefined;

  return (
    <View style={styles.container} testID="tracking-body">
      <StatusBanner
        title={tracking.bannerTitle}
        message={tracking.bannerMessage}
        tone={tracking.tone}
        art={BOOKING_EN_ROUTE_ART}
        highlight={tracking.etaLabel}
        testID="tracking-banner"
      />

      {/* `208:553` — Page 8c/8d insert this ONE block between the banner and the cook card. */}
      {reassigned === undefined ? null : (
        <NoticeCard
          title={reassigned.notice.title}
          body={reassigned.notice.body}
          art={BOOKING_NOTE_REASSIGNED_ART}
          testID="tracking-reassignment"
        />
      )}

      {/* `21:1091` is drawn UNCONDITIONALLY on `3:1658`, so it renders whenever the server says
          the booking has arrived. An unwired host gets an inert CTA rather than a missing block —
          the same rule the Help pill follows. */}
      {arrived === undefined ? null : (
        <ServiceHandoverBlock
          ctaLabel={arrived.startCtaLabel}
          onPress={onStartService ?? noop}
          otpCode={arrived.otpCode}
          otpTitle={arrived.otpTitle}
          otpCaption={arrived.otpCaption}
          tone="start"
          testID="arrived-handover"
        />
      )}

      {cook === undefined ? null : (
        <CookCard
          cook={cook}
          {...(onCallCook === undefined ? {} : { onCallCook })}
          testID="tracking-cook"
        />
      )}

      {/* `99:1605` draws a to-do list on En route; `3:1710` draws a shield on Arrived. */}
      <NoteCard
        title={tracking.noteTitle}
        body={tracking.noteBody}
        art={arrived === undefined ? BOOKING_NOTE_ART : BOOKING_NOTE_SHIELD_ART}
        artSize={arrived === undefined ? 'tall' : 'square'}
        testID="tracking-note"
      />
    </View>
  );
}

function noop() {
  // Inert until the backend exposes a start-service action. The client never starts a session.
}

const styles = StyleSheet.create({
  /** `3:1382` / `3:1673` — 22pt between the banner, the handover, the cook card and the note. */
  container: { gap: 22 },
});
