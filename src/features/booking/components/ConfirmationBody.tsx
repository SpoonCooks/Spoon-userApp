import { StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import {
  BOOKING_NOTE_REASSIGNED_ART,
  Button,
  CookCard,
  NoteCard,
  NoticeCard,
  StatusBanner,
  Text,
  lightTheme,
} from '@ui';
import type { CookViewModel } from '@ui';

import { SERVICE_SECTION_GAP, ServiceSection } from './ServiceSection';
import { ServiceLinkRow } from './ServiceLinkRow';
import { cookCardVariantFor } from '../adapters';
import type { BookingSummaryViewModel } from '../types';

/**
 * Confirmation — Figma `3:1041`.
 *
 * Rebuilt against the current file, which reworked this screen more than any other (315 → 267
 * nodes). Layout, verbatim:
 *
 *   banner   `40:5346`  — the lime hero, now a ROW: Livvic Black 20/28 title over a Livvic Bold
 *                         14/20 schedule line on the LEFT, the 64pt `#CFFF04` disc on the RIGHT.
 *   cook     `94:906`   — the shared cook card, inside a 6pt vertical inset (`3:1054`)
 *   note     `250:2942` — NEW. The "Note before starting" card, `#FFF7CC` at a 16pt radius with a
 *                         32 × 66 to-do mark and a `0 0 2 rgba(0,0,0,0.07)` lift
 *   details  `250:2966` — NEW. A 39pt row outlined 1pt in `#FFD600` at a 15pt radius: a 35pt
 *                         exported glyph, a Livvic Bold 14/20 label, and the `250:2970` back mark
 *                         rotated 179.55° into a forward chevron
 *   actions  `250:2978` — TWO 34pt bars 16pt apart at a 15pt radius: "Cancel" white behind a
 *                         1pt `#FFDE33` edge, "Reschedule" flat `#FFD600`. Neither carries a lift.
 *
 * `289:6607` "Page 8b- Confirm reassign" is this screen plus ONE `208:553` notice between the
 * banner and the cook card — the same block En route's reassigned variant carries. Its presence
 * is the SERVER saying a reassignment happened; nothing here decides that (task §7). The frame
 * also omits the details row on 8b, which is treated as a designer omission rather than a rule:
 * the row still renders when the payload supplies one.
 *
 * What the current file REMOVED: the inline Date / Start time / Duration / End time rows
 * (`3:1095`) and the single white bar holding "Reschedule Booking | Cancel Booking & Refund"
 * (`3:1145`). The rows now live behind the details row, on `250:2861`.
 *
 * Boundary:
 *  - `scheduleLine` is a PRE-FORMATTED server string; the client does not assemble it from
 *    `rows`, format a date, or join the parts;
 *  - every row remains a server value rendered verbatim (no arithmetic);
 *  - ruling R-3: the Reschedule action renders only when the SERVER says the booking is still
 *    eligible. `rescheduleAllowed` absent means "the server did not say", which hides it. The
 *    frame drawing two side-by-side bars changes how they look, not when they appear;
 *  - the Cancel action is present in the design but its handler stays unwired until blocker
 *    B-11 resolves where cancellation is entered from (PRODUCT_PENDING);
 *  - `onViewDetails` is a seam: this component decides nothing about what that screen shows.
 */

/** `250:2945` — the 32 × 66 to-do mark, shared with the En route note. */
const NOTE_TODO = require('../../../../assets/figma/booking/note-todo.png') as ImageSourcePropType;

/** `292:236` — the 35 × 35 "Product" glyph on the details row, exported from the node. */
export const DETAILS_GLYPH =
  require('../../../../assets/figma/booking/view-booking-details.png') as ImageSourcePropType;

/** `383:755` — the 35 x 35 "Cooking Book" mark on the share-recipe row, exported from the node. */
const SHARE_RECIPE_GLYPH =
  require('../../../../assets/figma/booking/share-recipe.png') as ImageSourcePropType;

export interface ConfirmationBodyProps {
  readonly summary: BookingSummaryViewModel;
  readonly cook?: CookViewModel;
  readonly onCallCook?: () => void;
  readonly onViewDetails?: () => void;
  /**
   * `383:748` — the WhatsApp disc on the "Share recipe/ special requests" row.
   *
   * Absent, the row is not drawn at all: a row whose whole purpose is to open a chat would be a
   * dead control without it, and §15 forbids leaving one inert.
   */
  readonly onShareRecipe?: () => void;
  readonly onReschedule?: () => void;
  readonly onCancel?: () => void;
}

export function ConfirmationBody({
  summary,
  cook,
  onCallCook,
  onViewDetails,
  onShareRecipe,
  onReschedule,
  onCancel,
}: ConfirmationBodyProps) {
  const canReschedule = summary.rescheduleAllowed === true && onReschedule !== undefined;
  const showActions = canReschedule || onCancel !== undefined;

  return (
    <View style={styles.container} testID="confirmation-body">
      <ServiceSection>
        <StatusBanner
          title={summary.bannerTitle}
          message={summary.scheduleLine}
          tone={summary.tone ?? 'positive'}
          layout="hero"
          icon={summary.tone === 'warning' ? 'alert' : 'checkCircle'}
          testID="confirmation-banner"
        />
      </ServiceSection>

      {/* `292:201` — Confirm reassign inserts ONE notice here and changes nothing else. */}
      {summary.reassignNotice === undefined ? null : (
        <ServiceSection>
          <NoticeCard
            title={summary.reassignNotice.title}
            body={summary.reassignNotice.body}
            art={BOOKING_NOTE_REASSIGNED_ART}
            testID="confirmation-reassignment"
          />
        </ServiceSection>
      )}

      {/*
        `383:743` — ABOVE the cook card, directly under the banner (and under the reassignment
        notice when there is one).

        It was previously drawn beneath "View booking details", near the foot of the screen. The
        finalized frames put it here on every confirmed variant — plain confirm and confirm-reassign
        alike — and the position carries meaning: sharing a recipe or a special request is something
        the customer does BEFORE the cook sets off, so it belongs with the confirmation, not filed
        under the after-the-fact links at the bottom.
      */}
      {summary.shareRecipeLabel === undefined || onShareRecipe === undefined ? null : (
        <ServiceSection>
          <ServiceLinkRow
            label={summary.shareRecipeLabel}
            glyph={SHARE_RECIPE_GLYPH}
            onPress={onShareRecipe}
            trailing="whatsapp"
            testID="confirmation-share-recipe"
          />
        </ServiceSection>
      )}

      {cook === undefined ? null : (
        <ServiceSection>
          <CookCard
            cook={cook}
            variant={cookCardVariantFor(cook.profileVariant)}
            {...(onCallCook === undefined ? {} : { onCallCook })}
            testID="confirmation-cook"
          />
        </ServiceSection>
      )}

      <ServiceSection>
        <NoteCard
          title={summary.note.title}
          body={summary.note.body}
          art={NOTE_TODO}
          artSize="tall"
          depth="softer"
          testID="confirmation-note"
        />
      </ServiceSection>

      {onViewDetails === undefined ? null : (
        <ServiceSection>
          <ServiceLinkRow
            label={summary.viewDetailsLabel}
            glyph={DETAILS_GLYPH}
            glyphOffset={-1.04}
            onPress={onViewDetails}
            testID="confirmation-view-details"
          />
        </ServiceSection>
      )}

      {showActions ? (
        <View style={styles.actions}>
          {onCancel === undefined ? null : (
            <View style={styles.action}>
              <Button
                label={summary.cancelLabel}
                onPress={onCancel}
                variant="outlineSoft"
                size="bar"
                flat
                testID="confirmation-cancel"
              />
            </View>
          )}
          {canReschedule ? (
            <View style={styles.action}>
              <Button
                label={summary.rescheduleLabel}
                onPress={onReschedule}
                variant="primary"
                size="bar"
                flat
                testID="confirmation-reschedule"
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {summary.rescheduleBlockedNote === undefined ? null : (
        <Text
          variant="caption"
          style={styles.rescheduleNote}
          testID="confirmation-reschedule-note"
        >
          {summary.rescheduleBlockedNote}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * The note sits where the Reschedule button would have been, indented to the same gutter as the
   * action bars so it reads as a replacement for the missing control rather than a page footnote.
   */
  rescheduleNote: {
    color: lightTheme.colors.textMuted,
    paddingHorizontal: lightTheme.space.xs,
  },
  /** `3:1042` — the section BOXES sit 16pt apart; each inserts its own 4/6 inset. */
  container: { gap: SERVICE_SECTION_GAP },
  /**
   * `250:2978` — two bars 16pt apart in a row padded 6 vertically, opening 22 below the details
   * SECTION (16 + the row's own 6). The frame fixes each bar at 160 inside a 338 row; they are
   * given equal flex instead so the pair still fills the row at 320dp and at 430dp without a
   * `screenWidth / 390` factor.
   */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
    marginTop: lightTheme.space.s6,
  },
  action: { flex: 1, minWidth: 0 },
});
