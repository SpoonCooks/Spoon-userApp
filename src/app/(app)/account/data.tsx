import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { getUserMessage, isAppError, isRateLimited } from '@core/errors';
import { useNavigationGuard, useSafeBack } from '@core/navigation';
import {
  AccountDataScreen,
  DeleteAccountSheetV2,
  useAccountSummary,
  useRequestAccountDeletionOtp,
} from '@features/account';
import { useMe, useSignOut } from '@features/auth';
import { phoneLabelOf } from '@features/profile';

/** "1 address", "2 addresses", "50+ visits". */
function countOf(count: number, more: boolean, one: string, many: string): string {
  return `${String(count)}${more ? '+' : ''} ${count === 1 && !more ? one : many}`;
}

/**
 * Account & data — Figma `1517:10315` (dev note `2084:2781`), and the Delete account confirm sheet
 * `1517:10413` (dev note `2084:2786`).
 *
 * ## The deletion code is requested HERE, as Manage account used to request it
 *
 * Login's order, for Login's reason: `/account/delete-otp` is pushed only once `otp/send` has
 * answered, carrying the server's cooldown, so that screen opens knowing a code is on its way and
 * counts down the real interval. The number is the account's own (`GET /v1/me`), never typed.
 */
export default function AccountDataRoute() {
  const router = useRouter();
  const goBack = useSafeBack('/account');
  const me = useMe();
  const summary = useAccountSummary();
  const requestOtp = useRequestAccountDeletionOtp();
  const signOut = useSignOut();
  const [sheetOpen, setSheetOpen] = useState(false);
  // One screen per tap: a quick double tap must not open the same screen twice.
  const guard = useNavigationGuard();

  const identity = me.state.status === 'ready' ? me.state.data : null;
  const identityErrorMessage =
    me.state.status === 'error' ? getUserMessage(me.state.error) : undefined;

  // RATE_LIMITED gets its own wording: pressing Delete, going back and pressing it again is one
  // attempt too soon, not "too many attempts" (see the deletion endpoint's own cooldown).
  const sendErrorMessage =
    isAppError(requestOtp.error) && isRateLimited(requestOtp.error)
      ? 'A code was just sent. Please wait a moment before asking for another.'
      : isAppError(requestOtp.error)
        ? getUserMessage(requestOtp.error)
        : (requestOtp.error?.message ?? undefined);

  const hasFoodProfile =
    identity !== null &&
    (identity.profileComplete ||
      [
        identity.householdStructure,
        identity.mealStructure,
        identity.pressingIssue,
        identity.dietaryPreference,
        identity.regionPreference,
        identity.genderPreference,
        identity.householdAdults,
        identity.oilLevel,
        identity.gheeOnly,
      ].some((answer) => answer !== null) ||
      (identity.grownUpEating?.length ?? 0) > 0 ||
      (identity.nonVegPreferences?.length ?? 0) > 0 ||
      (identity.mealHassles?.length ?? 0) > 0);

  const signOutNow = () =>
    signOut.mutate(undefined, {
      onSettled() {
        router.replace('/' as Href);
      },
    });

  return (
    <AccountDataScreen
      phone={identity === null ? '' : phoneLabelOf(identity.phone)}
      addressesSummary={
        summary.addressLabels === null
          ? null
          : countOf(summary.addressLabels.length, false, 'address', 'addresses')
      }
      visitsSummary={
        summary.visits === null
          ? null
          : `${countOf(summary.visits.count, summary.visits.more, 'visit', 'visits')} · ratings & feedback`
      }
      onBack={guard(goBack)}
      onTasteProfile={guard(() => router.push('/profile/details' as Href))}
      onAddresses={guard(() => router.push('/address?from=profile'))}
      onBookingHistory={guard(() => router.push('/history?tab=past' as Href))}
      onDelete={() => {
        requestOtp.reset();
        setSheetOpen(true);
      }}
      sheet={
        <DeleteAccountSheetV2
          visible={sheetOpen}
          losses={{
            cookPool: (summary.poolCount ?? 0) > 0,
            foodProfile: hasFoodProfile,
            visitHistory: summary.hasBooked === true,
            addresses: (summary.addressLabels?.length ?? 0) > 0,
          }}
          onKeep={() => setSheetOpen(false)}
          onLogout={() => {
            setSheetOpen(false);
            signOutNow();
          }}
          onDelete={() => {
            if (identity === null || requestOtp.isPending) return;
            // No argument: the endpoint resolves the account from the session.
            requestOtp.mutate(undefined, {
              onSuccess(result) {
                setSheetOpen(false);
                router.push({
                  pathname: '/account/delete-otp',
                  // The server's cooldown, so the OTP screen counts down the real interval.
                  params: { retryAfter: String(result.retryAfterSeconds) },
                } as Href);
              },
            });
          }}
          requesting={requestOtp.isPending || me.state.status === 'loading'}
          errorMessage={sendErrorMessage ?? identityErrorMessage ?? null}
        />
      }
    />
  );
}
