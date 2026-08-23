import { useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import {
  InstantSheet,
  useBookingSubmission,
  useInstantData,
  useRateBooking,
} from '@features/booking';
import { HomeScreen } from '@features/home';
import { useAddressGate } from '@features/address';
import { isNumericRating } from '@ui';
import { DEMO_INSTANT_NO_SLOTS, DEMO_INSTANT_OUT_OF_SHIFT } from '@/demo/fixtures/booking';

/**
 * Home route - Figma `1:455` / `59:520` (ruling R-2: one route, two booking-state variants).
 *
 * The Instant sheet (`1:728`) is presented over Home rather than being a route of its own,
 * matching the design. Its taxes dialog (`25:1585`) layers above the sheet inside the same modal.
 *
 * DEV reachability (task §12): the finalized "Instant booking" section `267:3520` holds four
 * states, and none of them was directly reachable — the sheet only opened by tapping the Home
 * tile, and the two blocked states had no entry point at all. `?instant=` opens each one:
 *
 *   `available`  `1:728`   — the sheet as drawn
 *   `taxes`      `25:1585` — the taxes dialog layered over the sheet
 *   `outOfShift` `25:1327` — the moon state
 *   `noSlots`    `44:5378` — the calendar state
 *
 * The switch is `__DEV__`-only; a release build always renders live data and opens nothing.
 */
const DEV_INSTANT = {
  available: undefined,
  taxes: undefined,
  outOfShift: DEMO_INSTANT_OUT_OF_SHIFT,
  noSlots: DEMO_INSTANT_NO_SLOTS,
} as const;

export default function HomeRoute() {
  const router = useRouter();
  const { instant: instantParam } = useLocalSearchParams<{
    instant?: keyof typeof DEV_INSTANT;
  }>();
  const devInstant = __DEV__ && instantParam !== undefined && instantParam in DEV_INSTANT;
  const [instantOpen, setInstantOpen] = useState(devInstant);
  const [durationId, setDurationId] = useState<string | null>(null);
  // The chosen duration is what availability and the quote are ABOUT, so it is an input to the
  // read, not something applied to its result.
  const instant = useInstantData({ durationId });
  const submission = useBookingSubmission({ slotType: 'instant', durationId });
  const addressGate = useAddressGate();

  /**
   * `336:4235` — the rating chips ON the "Share your rating!" banner.
   *
   * The control is already drawn and already wired to an `onRate` seam; nothing new is added
   * here. What was missing was the other end of it: `HomeBookingBanner` disables the widget when
   * no handler is supplied, and this route supplied none, so the banner rendered a rating row the
   * customer could look at and not use.
   *
   * The banner is only offered for a booking the SERVER says may still be rated
   * (`allowedActions.canRate`), and the mutation invalidates the active list, so submitting a
   * rating is what makes the card go away — the client never removes it on its own.
   *
   * `5+` is carried intact: `exceptional` is a field of its own, valid only alongside `stars: 5`,
   * exactly as the completion screen sends it. It moves no money — the five-plus earnings bonus
   * remains `stars === 5`.
   */
  const rate = useRateBooking();

  /**
   * FIRST-RUN ADDRESS (task section 4). A customer with no saved address goes straight into
   * `53:31` ("Select service location") - the first step that can actually produce an address -
   * rather than onto a Home whose booking CTAs cannot enable.
   *
   * The redirect is placed AFTER every hook so the hook order is identical on both paths, and it
   * fires only on `required`: while the list is still resolving Home renders normally, so a slow
   * read shows the real screen instead of flashing a form at someone who already has an address.
   *
   * `onboarding=1` is carried so the end of the flow returns to Home rather than to the saved-
   * address list, which is where the SAME screens land when reached from `68:214`.
   *
   * The `__DEV__` Instant deep links below are exempt: they exist to render the four `267:3520`
   * sheet states for visual QA, and every one of them is reached THROUGH Home, so the gate would
   * make them unreachable on any account without an address. A release build has no such param.
   */
  if (addressGate === 'required' && !devInstant) {
    return <Redirect href="/address/location?onboarding=1" />;
  }

  return (
    <>
      <HomeScreen
        onPressInstant={() => setInstantOpen(true)}
        onPressSchedule={() => router.push('/scheduled')}
        onPressAddress={() => router.push('/address')}
        onPressProfile={() => router.push('/profile')}
        /**
         * This route previously pushed `/booking/enRoute` — a DEV fixture id — so every banner
         * opened the same demo screen no matter which booking was live (task §7). The destination
         * now arrives from the state machine that drew the banner, carrying the REAL booking id;
         * the lifecycle host then picks 8a / 8b / 8c / 9a / 9b / 10a / 10b / 11 / 12a / 12b / 14a
         * from the server's state, which is the only party entitled to decide it.
         */
        onOpenActiveBooking={(destination) => router.push(`/booking/${destination.bookingId}`)}
        onRateActiveBooking={(value, destination) => {
          if (rate.isPending) return;
          const exceptional = !isNumericRating(value);
          rate
            .mutateAsync({
              bookingId: destination.bookingId,
              stars: exceptional ? 5 : value,
              ...(exceptional ? { exceptional: true } : {}),
              scope: `booking.rate:${destination.bookingId}`,
            })
            .catch(() => {
              // Normalized and surfaced by the mutation. Nothing here claims a rating landed,
              // and the banner stays put until the server's list says otherwise.
            });
        }}
      />

      {instant.state.status === 'ready' ? (
        <InstantSheet
          visible={instantOpen}
          instant={
            (devInstant ? DEV_INSTANT[instantParam as keyof typeof DEV_INSTANT] : undefined) ??
            instant.state.data
          }
          {...(devInstant && instantParam === 'taxes' ? { initialTaxesOpen: true } : {})}
          selectedDurationId={durationId}
          onSelectDuration={setDurationId}
          /**
           * The SERVER's half of the CTA gate (task §E).
           *
           * A tapped duration tile is not a bookable booking: `canSubmit` is the account's default
           * address plus that duration, and the ready QUOTE is the server having priced exactly
           * it. `instant.ctaLabel` only carries an amount once that quote exists, so gating on the
           * same condition is also what stops "Book NOW" from ever being live without one.
           */
          canBook={submission.canSubmit && submission.quote.state.status === 'ready'}
          submitting={submission.submitting}
          /**
           * Back and the backdrop are REFUSED while the booking call is in flight (task §14: back
           * during payment preparation must not corrupt booking state).
           *
           * Not because closing would unmake anything — the booking is created server-side and the
           * hold is real either way — but because the sheet closing on its own would leave the
           * customer on Home with a booking they were never shown, and a moment later Razorpay's
           * checkout would open over a screen that gives it no context. The CTA carries the
           * pending state, so the refusal is legible rather than mysterious.
           */
          onClose={() => {
            if (submission.submitting) return;
            setInstantOpen(false);
          }}
          onBook={() => {
            if (!submission.canSubmit || submission.submitting) return;
            void submission
              .submit()
              .then((created) => {
                setInstantOpen(false);
                const bookingId = created.booking.booking.id;

                /**
                 * A VERIFIED payment goes to `433:2290`, Page 21 (V7 founder comment, task §9):
                 * the backend has accepted the payment and is now settling the booking, and the
                 * customer waits on the designed screen for that rather than being dropped onto
                 * a lifecycle view built from a booking that is still on hold. Page 21 polls the
                 * server and moves to Home once the booking has actually moved.
                 *
                 * Anything else — a dismissed checkout, a failure, an order that was not ready —
                 * has nothing to confirm, so it goes to the booking screen, which shows the
                 * SERVER's state including the hold the customer can still pay off. Sending
                 * those to a "Confirmation in progress" screen would be this app asserting a
                 * payment it does not have.
                 */
                if (created.payment === 'verified') {
                  router.push(`/booking/confirming?id=${bookingId}`);
                  return;
                }
                router.push(`/booking/${bookingId}`);
              })
              .catch(() => {
                // The error is already normalized and surfaced by the mutation; the sheet stays
                // open so the customer can retry against the same idempotency scope.
              });
          }}
          onSchedule={() => {
            setInstantOpen(false);
            router.push('/scheduled');
          }}
        />
      ) : null}
    </>
  );
}
