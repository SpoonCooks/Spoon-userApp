import { useEffect, useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

import { useExtensionOptions, useTracking } from '@features/booking';
import type { BookingDetailDto, ExtensionOptionDto } from '@features/booking';
import { cookProfileFrom, useCookPoolProfile } from '@features/cookPool';
import { PaymentDetailsSheet, RateVisitCard, ratingRequestFor } from '@features/recurringLive';
import type {
  PaymentDetailsSheetData,
  RateVisitSubmission,
  VisitMenuSection,
  VisitPrepKey,
} from '@features/recurringLive';
import { useBookingPrep, useUpdateBookingPrep } from '@features/recurringSetup';

import { ServiceVisitScreen } from './ServiceVisitScreen';
import type { ServiceVisitModel } from './ServiceVisitScreen';
import type { BriefKey } from './components';
import {
  arrivalOf,
  clock,
  day,
  duration,
  endsAt,
  extendChoicesFrom,
  extendedMinutes,
  firstName,
  freeTill,
  minutesLeft,
  otpDigits,
  paidTipOf,
  paymentSheetFrom,
  servicePhaseOf,
} from './model';
import type { ServicePhase } from './model';

/**
 * The live data behind `ServiceVisitScreen` for one booking. The host owns the reads (tracking
 * while the visit is live, the cook's profile and menu, the prep checklist, extension options)
 * and a minute clock; every write that takes money — extending, tipping — and the rating go
 * through the route's existing mutations, so checkout and idempotency stay where they are.
 */
export interface ServiceVisitHostProps {
  readonly booking: BookingDetailDto;
  readonly phase: ServicePhase;
  readonly onBack: () => void;
  readonly onModifyBooking?: (() => void) | undefined;
  readonly onHelp?: (() => void) | undefined;
  readonly onCall?: (() => void) | undefined;
  readonly onShareRecipe?: (() => void) | undefined;
  readonly onExtend: (minutes: number) => Promise<unknown>;
  readonly extending: boolean;
  readonly onTip: (amountPaise: number) => Promise<unknown>;
  readonly tipping: boolean;
  readonly onRate: (request: {
    readonly stars: number;
    readonly exceptional?: true;
    readonly feedback?: string;
  }) => Promise<unknown>;
  readonly rating: boolean;
  readonly onBookAnother: () => void;
}

/** "Brief your cook" ticks: optional, per visit, kept for the app session. */
const briefByBooking = new Map<string, readonly BriefKey[]>();

export function ServiceVisitHost({
  booking,
  phase,
  onBack,
  onModifyBooking,
  onHelp,
  onCall,
  onShareRecipe,
  onExtend,
  extending,
  onTip,
  tipping,
  onRate,
  rating,
  onBookAnother,
}: ServiceVisitHostProps) {
  const now = useMinuteClock();
  const live =
    phase === 'onTheWay' || phase === 'arrived' || phase === 'cooking' || phase === 'timesUp';
  const tracking = useTracking(live ? booking.id : null, { poll: true });
  const cookId = booking.cook?.id ?? null;
  const profile = useCookPoolProfile(cookId ?? 'none', { enabled: cookId !== null });
  const prep = useBookingPrep(phase === 'assigned' || phase === 'onTheWay' ? booking.id : null);
  const updatePrep = useUpdateBookingPrep();
  const extension = useExtensionOptions(
    (phase === 'cooking' || phase === 'timesUp') && booking.allowedActions.canExtend
      ? booking.id
      : null,
  );
  const [brief, setBrief] = useState<readonly BriefKey[]>(
    () => briefByBooking.get(booking.id) ?? [],
  );
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [tipPaid, setTipPaid] = useState<ServiceVisitModel['tipPaid']>(null);
  const [rated, setRated] = useState(false);

  const options: readonly ExtensionOptionDto[] =
    extension.state.status === 'ready' ? extension.state.data : [];
  const trackingData = tracking.state.status === 'ready' ? tracking.state.data : null;
  const card = profile.state.status === 'ready' ? profile.state.data.cook : null;
  const cookName = booking.cook?.name ?? card?.displayName ?? null;
  const photoUrl = booking.cook?.photoUrl ?? card?.profileImageUrl ?? null;
  const cookPhoto: ImageSourcePropType | null = photoUrl === null ? null : { uri: photoUrl };

  const menu: readonly VisitMenuSection[] = useMemo(() => {
    if (profile.state.status !== 'ready') return [];
    return cookProfileFrom(profile.state.data).menu.map((section) => ({
      id: section.id,
      title: section.title,
      dishes: section.dishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        ...(dish.image === undefined ? {} : { image: dish.image as ImageSourcePropType }),
      })),
    }));
  }, [profile.state]);

  const start = booking.scheduledStart ?? booking.timing.actualStart;
  const length = duration(booking.durationMinutes);
  const end = endsAt(booking);
  const origin = [
    card?.region ?? null,
    card !== null && card.languages.length > 0 ? `Speaks ${card.languages.join(', ')}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
  // "Your rating" is this customer's own average for the cook (dev note `2226:4211`) — never the
  // cook's overall average, which the card also carries. No own rating yet: no rating line.
  const cookRating = card?.yourRating ?? null;

  const model: ServiceVisitModel = {
    phase,
    title: booking.slotType === 'instant' ? 'Instant visit' : 'On-time visit',
    bannerTitle:
      start === null
        ? length
        : phase === 'assigned' || phase === 'completed'
          ? day(start)
          : `${clock(start)} · ${length}`,
    bannerSlot:
      start === null || !(phase === 'assigned' || phase === 'completed')
        ? null
        : `${clock(start)} – ${clock(
            new Date(Date.parse(start) + booking.durationMinutes * 60_000).toISOString(),
          )} · ${length}`,
    cook: {
      // Dev note `2226:4211`: "Spoon trained · Verified" only for a cook who is both.
      eyebrow:
        card !== null && card.spoonTrained && card.backgroundVerified
          ? 'SPOON TRAINED · VERIFIED'
          : '',
      name: cookName === null ? 'Your cook' : `Cook ${firstName(cookName) ?? cookName}`,
      ...(origin === '' ? {} : { origin }),
      ...(card === null ? {} : { visits: `Visits with you: ${String(card.visitsWithYou)}` }),
      ...(cookRating === null || cookRating.count === 0
        ? {}
        : { rating: `Your rating: ${cookRating.average.toFixed(1)}` }),
      note: '',
      ...(photoUrl === null ? {} : { photo: { uri: photoUrl } }),
    },
    menu,
    cookFirstName: firstName(cookName),
    cookPhoto,
    prepChecked:
      prep.state.status !== 'ready'
        ? []
        : [
            ...(prep.state.data.entryApproved ? (['entry'] as const) : []),
            ...(prep.state.data.groceriesReady ? (['groceries'] as const) : []),
            ...(prep.state.data.utensilsReady ? (['utensils'] as const) : []),
          ],
    arrival: arrivalOf(booking, trackingData, now),
    arrivedAt:
      (trackingData?.arrivedAt ?? booking.timing.arrivedAt ?? null) === null
        ? null
        : clock((trackingData?.arrivedAt ?? booking.timing.arrivedAt) as string),
    startOtp: otpDigits(trackingData?.serviceOtp?.start),
    endOtp: otpDigits(trackingData?.serviceOtp?.end),
    minutesLeft: minutesLeft(booking, now),
    endsAt: end === null ? null : clock(end),
    startedAt: booking.timing.actualStart === null ? null : clock(booking.timing.actualStart),
    extendChoices: extendChoicesFrom(options),
    extendedMinutes: extendedMinutes(booking),
    freeTill: freeTill(options),
    // The server's captured tip outlives the session; the local one covers the moment between
    // paying and the refetch.
    tipPaid: paidTipOf(booking) ?? tipPaid,
    canTip: booking.allowedActions.canTip,
  };

  const paymentSheet: PaymentDetailsSheetData = paymentSheetFrom(booking, cookName);

  const ratingSlot =
    phase === 'completed' && booking.allowedActions.canRate && !rated ? (
      <RateVisitCard
        live
        variant="service"
        visit={{
          title: cookName === null ? 'Your cook' : `Cook ${firstName(cookName) ?? cookName}`,
          meta: start === null ? length : `${day(start)} · ${clock(start)} · ${length}`,
          cookName: firstName(cookName) ?? 'your cook',
          photoUri: photoUrl,
        }}
        submitting={rating}
        onSubmit={(submission: RateVisitSubmission) => {
          void onRate(ratingRequestFor(submission, ''))
            .then(() => setRated(true))
            .catch(() => undefined);
        }}
        testID="service-visit-rate"
      />
    ) : undefined;

  return (
    <>
      <ServiceVisitScreen
        model={model}
        onBack={onBack}
        onPaymentDetails={() => setPaymentOpen(true)}
        onModifyBooking={onModifyBooking}
        onHelp={onHelp}
        onCall={booking.allowedActions.canCallCook ? onCall : undefined}
        onShareRecipe={onShareRecipe}
        onPrepChange={(checked: readonly VisitPrepKey[]) =>
          updatePrep.mutate({
            bookingId: booking.id,
            input: {
              entryApproved: checked.includes('entry'),
              groceriesReady: checked.includes('groceries'),
              utensilsReady: checked.includes('utensils'),
            },
          })
        }
        briefChecked={brief}
        onBriefToggle={(key) =>
          setBrief((current) => {
            const next = current.includes(key)
              ? current.filter((entry) => entry !== key)
              : [...current, key];
            briefByBooking.set(booking.id, next);
            return next;
          })
        }
        extending={extending}
        onExtend={(minutes) => {
          void onExtend(minutes)
            .then(() => extension.refetch())
            .catch(() => undefined);
        }}
        onBookAnother={onBookAnother}
        ratingSlot={ratingSlot}
        tipping={tipping}
        onTip={(amountPaise) => {
          void onTip(amountPaise)
            .then(() =>
              setTipPaid({
                amountPaise,
                when: `Paid · ${day(new Date().toISOString())}, ${clock(new Date().toISOString())}`,
              }),
            )
            .catch(() => undefined);
        }}
      />
      <PaymentDetailsSheet
        visible={paymentOpen}
        data={paymentSheet}
        onClose={() => setPaymentOpen(false)}
      />
    </>
  );
}

/** Ticks every 30s: the countdown and the ETA move in whole minutes (dev note `2165:12402`). */
function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export { servicePhaseOf };
