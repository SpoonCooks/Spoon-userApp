import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Screen } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { ActionDock } from '../components/visit/ActionDock';
import { BeforeArrivalCard } from '../components/visit/BeforeArrivalCard';
import { CookAssignedCard } from '../components/visit/CookAssignedCard';
import { CookPendingCard } from '../components/visit/CookPendingCard';
import { RecipeShareRow } from '../components/visit/RecipeShareRow';
import { RefundSummaryCard } from '../components/visit/RefundSummaryCard';
import { VisitCancelledCard } from '../components/visit/VisitCancelledCard';
import { VisitChargeCard } from '../components/visit/VisitChargeCard';
import { VisitHeader } from '../components/visit/VisitHeader';
import { VisitStatusBanner } from '../components/visit/VisitStatusBanner';
import { VISIT_FIXTURE } from '../data/visit';
import type { VisitPrepKey, VisitPrepReady, VisitVariant } from '../data/visit';

/**
 * Recurring live booking — "Visit details".
 *
 * Source: Figma `cCQlzTeiObQkpVBzwI8mZi` page `1005:131`, one frame per `variant`:
 *   `assigned`  `1008:5398` "Visit details / upcoming · Cook assigned"
 *   `pending`   `1466:8275` "Visit details / upcoming · Cook pending"
 *   `completed` `1466:8639` "Visit details / upcoming · Completed"
 *   `cancelled` `1466:8446` "Visit details / upcoming · Cancelled"
 *
 * Under the `Nav header 2` bar the content runs px 16, pt 8, pb 24 with 24 between blocks:
 * the status banner, then the variant's cook section (`Cook details`, `1466:797` — "the only part
 * of the screen that changes"), and below it:
 *   assigned / pending — recipe share, the before-arrival checklist (`1444:718`), visit charge
 *   completed          — `ratingSlot` (the rate card, `1517:9295`, built elsewhere), visit charge
 *   cancelled          — the cancelled cook section and the payment & refund summary
 * The `Action dock` (`1444:730`) is the pinned footer; Completed and Cancelled have no "Modify
 * booking".
 *
 * STATIC ONLY: every value is `VISIT_FIXTURE`. The prep ticks are local UI state; Call, Share,
 * View Cook Pool and the next-visit row are optional callbacks; the dock's sheets and the Help
 * WhatsApp deep link (`1434:2205`) belong to the caller.
 */
export interface VisitDetailsScreenProps {
  readonly variant: VisitVariant;
  readonly onBack: () => void;
  readonly onPaymentDetails?: (() => void) | undefined;
  readonly onModifyBooking?: (() => void) | undefined;
  /** Per `1434:2205`: one tap straight to WhatsApp, no in-app sheet. */
  readonly onHelp?: (() => void) | undefined;
  readonly onCall?: (() => void) | undefined;
  readonly onShareRecipe?: (() => void) | undefined;
  readonly onViewCookPool?: (() => void) | undefined;
  readonly onNextVisit?: (() => void) | undefined;
  /** Completed only — rendered where the rate card sits, 24 under the banner and above the charge. */
  readonly ratingSlot?: ReactNode | undefined;
  /** How many prep checks start ticked: 0 (`1441:1808`), 1 (`1441:1853`) or 3 (`1441:1898`). */
  readonly prepState?: VisitPrepReady | undefined;
  readonly onPrepChange?: ((checked: readonly VisitPrepKey[]) => void) | undefined;
  readonly testID?: string | undefined;
}

const { charge } = VISIT_FIXTURE;

export function VisitDetailsScreen({
  variant,
  onBack,
  onPaymentDetails,
  onModifyBooking,
  onHelp,
  onCall,
  onShareRecipe,
  onViewCookPool,
  onNextVisit,
  ratingSlot,
  prepState = 0,
  onPrepChange,
  testID = 'visit-details-screen',
}: VisitDetailsScreenProps) {
  const upcoming = variant === 'assigned' || variant === 'pending';

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={<VisitHeader title="Visit details" onBack={onBack} testID={`${testID}-header`} />}
      footer={
        <ActionDock
          showModify={upcoming}
          onPaymentDetails={onPaymentDetails}
          onModifyBooking={onModifyBooking}
          onHelp={onHelp}
          testID={`${testID}-dock`}
        />
      }
    >
      <VisitStatusBanner
        state={
          variant === 'pending' ? 'upcoming' : variant === 'cancelled' ? 'cancelled' : 'confirmed'
        }
        date={VISIT_FIXTURE.date}
        slot={VISIT_FIXTURE.slot}
        daysToGo={VISIT_FIXTURE.daysToGo}
        testID={`${testID}-banner`}
      />

      {variant === 'assigned' ? (
        <CookAssignedCard onCall={onCall} testID={`${testID}-cook`} />
      ) : null}
      {variant === 'pending' ? (
        <CookPendingCard onViewPool={onViewCookPool} testID={`${testID}-cook`} />
      ) : null}
      {variant === 'cancelled' ? (
        <VisitCancelledCard onNextVisit={onNextVisit} testID={`${testID}-cook`} />
      ) : null}
      {variant === 'completed' ? (ratingSlot ?? null) : null}

      {upcoming ? (
        <>
          <RecipeShareRow onShare={onShareRecipe} testID={`${testID}-recipe`} />
          <BeforeArrivalCard
            initialReady={prepState}
            onChange={onPrepChange}
            testID={`${testID}-prep`}
          />
        </>
      ) : null}

      {variant === 'cancelled' ? (
        <RefundSummaryCard testID={`${testID}-refund`} />
      ) : (
        <VisitChargeCard
          body={variant === 'assigned' ? charge.bodyAssigned : charge.bodyNotice}
          testID={`${testID}-charge`}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** `1008:5414` — px 16 (Screen's own), pt 8, pb 24, 24 between blocks. */
  body: {
    paddingTop: lightTheme.space.sm,
    paddingBottom: lightTheme.space.xl,
    gap: lightTheme.space.xl,
  },
});
