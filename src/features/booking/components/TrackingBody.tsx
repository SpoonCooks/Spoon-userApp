import { StyleSheet, View } from 'react-native';

import {
  BOOKING_NOTE_ART,
  BOOKING_NOTE_REASSIGNED_ART,
  BOOKING_NOTE_SHIELD_ART,
  Button,
  CookCard,
  NoteCard,
  NoticeCard,
  StatusBanner,
  Text,
  lightTheme,
} from '@ui';
import type { CookViewModel } from '@ui';

import { DETAILS_GLYPH } from './ConfirmationBody';
import { ServiceHandoverBlock } from './ServiceHandoverBlock';
import { ServiceLinkRow } from './ServiceLinkRow';
import { SERVICE_SECTION_GAP, ServiceSection } from './ServiceSection';
import { cookCardVariantFor } from '../adapters';
import type { ArrivedViewModel, ReassignedViewModel, TrackingViewModel } from '../types';

/**
 * En route and Arrived — Figma `3:1381` (on time), `292:469` (late), `201:100` / `292:657`
 * (reassigned, on time and late) and `3:1658` (arrived).
 *
 * On-time vs late is exactly two property changes (banner fill + body copy), so one component
 * renders both. **The tone comes from the server**; the client never compares an ETA to the clock
 * to decide that a cook is late (FRONTEND_FOUNDATION_PLAN.md §18 rule 4).
 *
 * Frame order, verbatim from `3:1382`:
 *   status banner → [reassignment notice] → [handover] → cook card → note → details row → actions
 *
 * TWO blocks were missing and are added this pass, both drawn on the current nodes:
 *   `292:233` — the "View booking details" row, the same `250:2966` component Confirmation uses;
 *   `292:241` — the **Cancel / Reschedule** pair. The superseded En route frames carried no
 *               cancel affordance, which is why none was drawn; `3:1381` and `201:100` now do.
 *               Arrived (`3:1658`) still does not, and neither does this component when the
 *               booking has arrived.
 *
 * Arrived adds the Start OTP block and the Start Service CTA. The OTP is server-generated and is
 * only displayed — never logged, never verified locally, and never used to advance state.
 *
 * Ruling R-3 still holds for Reschedule: it renders only when the SERVER says the booking is
 * still eligible.
 */
export interface TrackingBodyProps {
  readonly tracking: TrackingViewModel | ArrivedViewModel | ReassignedViewModel;
  readonly cook?: CookViewModel;
  readonly onCallCook?: () => void;
  readonly onStartService?: () => void;
  readonly onViewDetails?: () => void;
  readonly onReschedule?: () => void;
  readonly onCancel?: () => void;
}

type AnyTracking = TrackingViewModel | ArrivedViewModel | ReassignedViewModel;

function isArrived(value: AnyTracking): value is ArrivedViewModel {
  return 'otpCode' in value;
}

function isReassigned(value: AnyTracking): value is ReassignedViewModel {
  return 'notice' in value;
}

export function TrackingBody({
  tracking,
  cook,
  onCallCook,
  onStartService,
  onViewDetails,
  onReschedule,
  onCancel,
}: TrackingBodyProps) {
  const arrived = isArrived(tracking) ? tracking : undefined;
  const reassigned = isReassigned(tracking) ? tracking : undefined;

  const canReschedule = tracking.rescheduleAllowed === true && onReschedule !== undefined;
  // `3:1658` draws no action bar; the pair belongs to the En route frames only.
  const showActions = arrived === undefined && (canReschedule || onCancel !== undefined);

  return (
    <View style={styles.container} testID="tracking-body">
      <ServiceSection>
        <StatusBanner
          title={tracking.bannerTitle}
          message={tracking.bannerMessage}
          tone={tracking.tone}
          highlight={tracking.etaLabel}
          testID="tracking-banner"
        />
      </ServiceSection>

      {/* `292:468` — the reassigned frames insert this ONE block between the banner and the cook. */}
      {reassigned === undefined ? null : (
        <ServiceSection>
          <NoticeCard
            title={reassigned.notice.title}
            body={reassigned.notice.body}
            art={BOOKING_NOTE_REASSIGNED_ART}
            testID="tracking-reassignment"
          />
        </ServiceSection>
      )}

      {/* `21:1091` is drawn UNCONDITIONALLY on `3:1658`, so it renders whenever the server says
          the booking has arrived. An unwired host gets an inert CTA rather than a missing block —
          the same rule the Help pill follows. */}
      {arrived === undefined ? null : (
        <ServiceSection>
          <ServiceHandoverBlock
            ctaLabel={arrived.startCtaLabel}
            onPress={onStartService ?? noop}
            otpCode={arrived.otpCode}
            otpTitle={arrived.otpTitle}
            otpCaption={arrived.otpCaption}
            tone="start"
            testID="arrived-handover"
          />
        </ServiceSection>
      )}

      {cook === undefined ? null : (
        <ServiceSection>
          <CookCard
            cook={cook}
            variant={cookCardVariantFor(cook.profileVariant)}
            {...(onCallCook === undefined ? {} : { onCallCook })}
            testID="tracking-cook"
          />
        </ServiceSection>
      )}

      {/* `292:226` draws a to-do list on En route; `292:1005` draws a shield on Arrived. */}
      <ServiceSection>
        <NoteCard
          title={tracking.noteTitle}
          body={tracking.noteBody}
          art={arrived === undefined ? BOOKING_NOTE_ART : BOOKING_NOTE_SHIELD_ART}
          artSize={arrived === undefined ? 'tall' : 'square'}
          testID="tracking-note"
        />
      </ServiceSection>

      {onViewDetails === undefined ? null : (
        <ServiceSection>
          <ServiceLinkRow
            label={tracking.viewDetailsLabel}
            glyph={DETAILS_GLYPH}
            glyphOffset={-1.04}
            onPress={onViewDetails}
            testID="tracking-view-details"
          />
        </ServiceSection>
      )}

      {showActions ? (
        <View style={styles.actions}>
          {onCancel === undefined ? null : (
            <View style={styles.action}>
              <Button
                label={tracking.cancelLabel}
                onPress={onCancel}
                variant="outlineSoft"
                size="bar"
                flat
                testID="tracking-cancel"
              />
            </View>
          )}
          {canReschedule ? (
            <View style={styles.action}>
              <Button
                label={tracking.rescheduleLabel}
                onPress={onReschedule}
                variant="primary"
                size="bar"
                flat
                testID="tracking-reschedule"
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {tracking.cancelBlockedNote === undefined ? null : (
        <Text variant="caption" style={styles.rescheduleNote} testID="tracking-cancel-note">
          {tracking.cancelBlockedNote}
        </Text>
      )}
      {tracking.rescheduleBlockedNote === undefined ? null : (
        <Text variant="caption" style={styles.rescheduleNote} testID="tracking-reschedule-note">
          {tracking.rescheduleBlockedNote}
        </Text>
      )}
    </View>
  );
}

function noop() {
  // Inert until the backend exposes a start-service action. The client never starts a session.
}

const styles = StyleSheet.create({
  /** Sits where the Reschedule bar would be, on the gutter the action row uses. */
  rescheduleNote: {
    color: lightTheme.colors.textMuted,
    paddingHorizontal: lightTheme.space.xs,
  },
  /** `3:1382` — the section BOXES sit 16pt apart. */
  container: { gap: SERVICE_SECTION_GAP },
  /** `292:241` — the same pair Confirmation draws. */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
  },
  action: { flex: 1, minWidth: 0 },
});
