import { useEffect, useRef, useState } from 'react';

import type { DataState } from '@core/data';
import { getLogger } from '@core/logging';
import { EmptyState, InfoDialog, QueryBoundary, Screen } from '@ui';
import type { RatingSelection } from '@ui';

import { AutoCancelledBody } from '../components/AutoCancelledBody';
import { BookingDetailsSheet } from '../components/BookingDetailsSheet';
import { BookingHeader } from '../components/BookingHeader';
import { CompletionBody } from '../components/CompletionBody';
import { ConfirmationBody } from '../components/ConfirmationBody';
import { ExtensionSheet } from '../components/ExtensionSheet';
import { InServiceBody } from '../components/InServiceBody';
import { TipSheet } from '../components/TipSheet';
import { TrackingBody } from '../components/TrackingBody';
import { extensionMinutesFrom } from '../adapters';
import { useMarkCancellationSeen } from '../api/hooks';
import { useBookingDetailData, useExtensionData } from '../data';
import type { BookingDetailViewModel } from '../types';

/**
 * The booking-lifecycle host — one route rendering Confirmation (`3:1041`), En route
 * (`3:1381` / `99:1413`), Arrived (`3:1658`), In service (`101:1812`) and Completion (`143:207`).
 *
 * FRONTEND_FOUNDATION_PLAN.md §18: a SINGLE server-provided field selects the view, through one
 * mapping table. The client never computes, infers or advances a state — not from a timer, not
 * from an OTP, not from a map position. An unrecognised view renders a safe fallback and logs.
 */

export interface BookingDetailActions {
  readonly onBack: () => void;
  readonly onHelp?: () => void;
  readonly onCallCook?: () => void;
  /**
   * A Call Cook failure, already turned into customer copy by `useCallCook`.
   *
   * Surfaced as a dialog rather than swallowed: the customer pressed a button and a call did not
   * happen, so silence would read as the app being broken. FIGMA_PENDING — no frame draws this
   * state, so it reuses the `InfoDialog` the taxes explainers already use.
   */
  readonly callCookError?: string | null;
  /**
   * Why the last extension attempt failed, if it did.
   *
   * The seam that submits an extension swallowed its rejection with a comment saying the
   * mutation surfaced it. Nothing did: the sheet simply stayed open and still, so a refused
   * extension was indistinguishable from a dead button — which is how it was reported.
   */
  readonly extendError?: string | null;
  readonly onDismissExtendError?: () => void;
  readonly onDismissCallCookError?: () => void;
  readonly onReschedule?: () => void;
  readonly onCancel?: () => void;
  /** `250:2966` — opens `250:2861` Booking details. A seam; this screen decides nothing there. */
  readonly onViewDetails?: () => void;
  /** `383:748` — the WhatsApp disc on "Share recipe/ special requests" (`8a` / `8b`, task §15). */
  readonly onShareRecipe?: () => void;
  readonly onStartService?: () => void;
  readonly onEndService?: () => void;
  /**
   * `275:4265` — "Extend • ₹16". Carries the chosen option's MINUTES, which the catalogue
   * published and the option id encodes; the new end time comes from the server's response and is
   * never computed here.
   *
   * Optional, and the sheet's CTA follows it: a host with no extension action does not draw a
   * button that closes the sheet and changes nothing.
   */
  readonly onExtendBooking?: (minutes: number) => Promise<unknown>;
  /** True while `POST /v1/bookings/:id/extensions` is in flight. LOCAL to the sheet's CTA. */
  readonly extending?: boolean;
  /** True while `POST /v1/bookings/:id/tips` is in flight. LOCAL to the tip sheet's CTA. */
  readonly tipping?: boolean;
  /**
   * `143:292` — Completion's Submit chip. Carries the RATING as well as the words, because
   * `299:1424` draws one Submit for both and `319:3191` is the state after that one press.
   *
   * The rating is a `RatingSelection`, so `5+` reaches the caller INTACT. What the caller may do
   * with it is a contract question, answered where the request is built — never by narrowing it
   * to a number here, which would lose the distinction before anyone could act on it.
   */
  readonly onSubmitFeedback?: (feedback: string, rating: RatingSelection | null) => void;
  /**
   * `306:2885` — the tip sheet's CTA. Resolves when the SERVER has taken the tip; the sheet closes
   * on that, never on the press, because a sheet that dismisses itself is a receipt.
   */
  readonly onSelectTip?: (tipId: string) => Promise<unknown>;
  /** `201:96` / `201:93` — PRODUCT_PENDING: neither answer names a destination in the design. */
  readonly onRebook?: () => void;
  readonly onDeclineRebook?: () => void;
}

export interface BookingDetailViewProps extends BookingDetailActions {
  readonly state: DataState<BookingDetailViewModel>;
  readonly onRetry: () => void;
  /**
   * The booking the extension sheet is priced against.
   *
   * `GET /v1/bookings/:id/extension-options` is what knows this service's totals, its tax and the
   * new end each option would produce; the catalogue only publishes SKUs. Optional so the review
   * route, which has no booking, still opens the sheet on published prices.
   */
  readonly bookingId?: string;
}

export function BookingDetailView({
  state,
  onRetry,
  bookingId,
  ...actions
}: BookingDetailViewProps) {
  const [rating, setRating] = useState<RatingSelection | null>(null);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [extensionOptionId, setExtensionOptionId] = useState<string | null>(null);
  const [tipOptionId, setTipOptionId] = useState<string | null>(null);
  // The chosen option is what the CTA's amount is ABOUT, so it is an input to the read rather
  // than something applied to its result — the same shape `useInstantData` already uses.
  const extension = useExtensionData({
    ...(bookingId === undefined ? {} : { bookingId }),
    optionId: extensionOptionId,
  });

  return (
    <Screen scroll tone="plain" testID="booking-detail-screen">
      <QueryBoundary state={state} onRetry={onRetry}>
        {(booking) => (
          <>
            <BookingHeader
              title={booking.headerTitle}
              subtitle={booking.headerSubtitle}
              helpLabel={booking.helpLabel}
              onBack={actions.onBack}
              {...(actions.onHelp === undefined ? {} : { onHelp: actions.onHelp })}
            />

            {renderBody()}

            {extension.state.status === 'ready' ? (
              <ExtensionSheet
                visible={extensionOpen}
                extension={extension.state.data}
                /* The sheet opens on the server's default until the user picks another. */
                selectedOptionId={extensionOptionId ?? extension.state.data.defaultOptionId ?? null}
                onSelectOption={setExtensionOptionId}
                onClose={() => setExtensionOpen(false)}
                helpLabel={booking.helpLabel}
                {...(actions.onHelp === undefined ? {} : { onHelp: actions.onHelp })}
                {...(actions.extending === undefined ? {} : { submitting: actions.extending })}
                {...extendSeam(extension.state.data.defaultOptionId ?? null)}
                onBookAnother={() => setExtensionOpen(false)}
              />
            ) : null}

            {/* `250:2861` — opened from the `250:2966` row, over the same screen. */}
            {booking.details === undefined ? null : (
              <BookingDetailsSheet
                visible={detailsOpen}
                details={booking.details}
                onClose={() => setDetailsOpen(false)}
              />
            )}

            {/* `306:2885` — opened from Completion's `308:3121` row. */}
            {booking.tip === undefined ? null : (
              <TipSheet
                visible={tipOpen}
                tip={booking.tip}
                /* The sheet opens on the server's default until the user picks another. */
                selectedOptionId={tipOptionId ?? booking.tip.defaultOptionId ?? null}
                onSelectOption={setTipOptionId}
                onClose={() => setTipOpen(false)}
                helpLabel={booking.helpLabel}
                {...(actions.onHelp === undefined ? {} : { onHelp: actions.onHelp })}
                {...(actions.tipping === undefined ? {} : { submitting: actions.tipping })}
                {...tipSeam(booking.tip.defaultOptionId ?? null)}
              />
            )}

            {/* FIGMA_PENDING — an extension failure has no designed frame either. */}
            <InfoDialog
              visible={actions.extendError !== null && actions.extendError !== undefined}
              onClose={() => actions.onDismissExtendError?.()}
              title="Couldn’t extend"
              body={actions.extendError ?? ''}
              testID="extend-error"
            />

            {/* FIGMA_PENDING — a Call Cook failure has no designed frame. */}
            <InfoDialog
              visible={actions.callCookError !== null && actions.callCookError !== undefined}
              onClose={() => actions.onDismissCallCookError?.()}
              title="Can’t call right now"
              body={actions.callCookError ?? ''}
              testID="call-cook-error"
            />
          </>
        )}
      </QueryBoundary>
    </Screen>
  );

  /**
   * `275:4265` — Extend.
   *
   * The sheet stays OPEN until the SERVER answers: the booking has not been extended until it
   * does, and closing on press would tell the customer it had. A refusal therefore leaves them on
   * the same choice, able to retry against the same idempotency scope.
   *
   * Absent when the host wires no extension action, which disables the CTA rather than drawing a
   * live button over nothing.
   */
  function extendSeam(serverDefaultOptionId: string | null) {
    const submit = actions.onExtendBooking;
    if (submit === undefined) return {};

    return {
      onExtend: () => {
        const minutes = extensionMinutesFrom(extensionOptionId ?? serverDefaultOptionId);
        // No option chosen and no server default: there is no length to ask for. Nothing is
        // submitted, and the sheet keeps the choice in front of the customer.
        if (minutes === null) return;
        void submit(minutes)
          .then(() => setExtensionOpen(false))
          .catch(() => {
            // Surfaced by the mutation. Nothing here claims the service was extended.
          });
      },
    };
  }

  /**
   * `306:2885` — Tip. Same rule as the extension: the sheet closes when the SERVER has taken the
   * tip, and an unwired host disables the CTA rather than drawing one that dismisses a sheet and
   * charges nothing (ruling R-1: no amount is computed here either — the id carries it).
   */
  function tipSeam(serverDefaultOptionId: string | null) {
    const submit = actions.onSelectTip;
    if (submit === undefined) return {};

    return {
      onConfirm: () => {
        const chosen = tipOptionId ?? serverDefaultOptionId;
        if (chosen === null) return;
        void submit(chosen)
          .then(() => setTipOpen(false))
          .catch(() => {
            // Surfaced by the mutation. Nothing here claims a tip was paid.
          });
      },
    };
  }

  /**
   * `292:233` / `292:1188` / `308:3121` — the details row is a SEAM. It renders only when the
   * payload carries the sheet it opens, so an unwired host never draws a dead control.
   */
  function detailsSeam(booking: BookingDetailViewModel) {
    if (booking.details === undefined) return {};
    return {
      onViewDetails: () => {
        setDetailsOpen(true);
        actions.onViewDetails?.();
      },
    };
  }

  /**
   * Call Cook — offered only where the SERVER says it may be.
   *
   * `callCookAllowed` is `allowedActions.canCallCook`, and the endpoint that supplies the number
   * enforces the same rule, so a control drawn against the server's answer could only ever
   * produce a failed call. Absent (an older payload, or a view with no such action) hides it,
   * which is the fail-closed direction for a control that reveals a personal phone number.
   */
  function callCookSeam(booking: BookingDetailViewModel) {
    if (actions.onCallCook === undefined || booking.callCookAllowed !== true) return {};
    return { onCallCook: actions.onCallCook };
  }

  /**
   * Cancel — offered only where the SERVER says it may be.
   *
   * Same shape as `callCookSeam`, and for the same reason: a cancellation has a fee and a refund
   * attached, both of which the backend decides, so offering the control on any basis other than
   * its answer would put the customer in a flow it will refuse.
   */
  /*
   * Both controls are the server's verdict alone.
   *
   * §11 used to be enforced a second time here, as "an INSTANT booking offers neither control".
   * When the owner reopened cancellation for instant on 2026-09-03 the backend started saying yes
   * and this screen went on saying no, so the button stayed off the screen and the change looked
   * like it had not shipped. A rule with two homes only ever gets moved into one of them.
   *
   * `cancelAllowed` and `rescheduleAllowed` are both computed backend-side from the same
   * predicates the cancel and reschedule commands enforce, so a control offered here cannot be
   * refused on press.
   */
  function cancelSeam(booking: BookingDetailViewModel) {
    if (actions.onCancel === undefined || booking.cancelAllowed !== true) return {};
    return { onCancel: actions.onCancel };
  }

  function rescheduleSeam(booking: BookingDetailViewModel) {
    const serverAllowed =
      booking.summary?.rescheduleAllowed === true ||
      booking.tracking?.rescheduleAllowed === true ||
      booking.reassigned?.rescheduleAllowed === true;
    if (actions.onReschedule === undefined || !serverAllowed) return {};
    return { onReschedule: actions.onReschedule };
  }

  function renderBody() {
    if (state.status !== 'ready') return null;
    const booking = state.data;

    switch (booking.view) {
      case 'confirmation':
        return booking.summary === undefined ? (
          unknownView(booking.view)
        ) : (
          <ConfirmationBody
            summary={booking.summary}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            {...callCookSeam(booking)}
            {...(booking.details === undefined
              ? {}
              : {
                  onViewDetails: () => {
                    setDetailsOpen(true);
                    actions.onViewDetails?.();
                  },
                })}
            {...(actions.onShareRecipe === undefined
              ? {}
              : { onShareRecipe: actions.onShareRecipe })}
            {...rescheduleSeam(booking)}
            {...cancelSeam(booking)}
          />
        );

      case 'enRoute':
        return booking.tracking === undefined ? (
          unknownView(booking.view)
        ) : (
          <TrackingBody
            tracking={booking.tracking}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            {...callCookSeam(booking)}
            {...detailsSeam(booking)}
            {...rescheduleSeam(booking)}
            {...cancelSeam(booking)}
          />
        );

      // `201:100` / `209:747` — En route plus ONE notice block. The server reports this state;
      // the client never decides that a reassignment happened (task §7).
      case 'reassigned':
        return booking.reassigned === undefined ? (
          unknownView(booking.view)
        ) : (
          <TrackingBody
            tracking={booking.reassigned}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            {...callCookSeam(booking)}
            {...detailsSeam(booking)}
            {...rescheduleSeam(booking)}
            {...cancelSeam(booking)}
          />
        );

      case 'arrived':
        return booking.arrived === undefined ? (
          unknownView(booking.view)
        ) : (
          <TrackingBody
            tracking={booking.arrived}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            {...callCookSeam(booking)}
            {...(actions.onStartService === undefined
              ? {}
              : { onStartService: actions.onStartService })}
            {...detailsSeam(booking)}
          />
        );

      case 'inService':
        return booking.inService === undefined ? (
          unknownView(booking.view)
        ) : (
          <InServiceBody
            inService={booking.inService}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            {...callCookSeam(booking)}
            onExtend={() => setExtensionOpen(true)}
            onEndService={actions.onEndService ?? noop}
            {...detailsSeam(booking)}
            // Reaching zero asks the server what happens next; it never ends the session.
            onElapsed={onRetry}
          />
        );

      case 'completion':
        return booking.completion === undefined ? (
          unknownView(booking.view)
        ) : (
          <CompletionBody
            completion={booking.completion}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            rating={rating}
            onChangeRating={setRating}
            onSubmitFeedback={(feedback) =>
              (actions.onSubmitFeedback ?? noopFeedback)(feedback, rating)
            }
            {...(booking.tip === undefined ? {} : { onOpenTip: () => setTipOpen(true) })}
          />
        );

      // `201:278` — a terminal, server-reported state. Nothing here can reach it on its own.
      case 'autoCancelled':
        return booking.autoCancelled === undefined ? (
          unknownView(booking.view)
        ) : (
          <AutoCancelledBody
            cancelled={booking.autoCancelled}
            {...(actions.onRebook === undefined ? {} : { onRebook: actions.onRebook })}
            {...(actions.onDeclineRebook === undefined
              ? {}
              : { onDeclineRebook: actions.onDeclineRebook })}
          />
        );

      case 'cancelled':
      case 'unknown':
        return unknownView(booking.view);
    }
  }
}

function unknownView(view: string) {
  getLogger('booking-host').warn('Unrecognised booking view, rendering fallback', { view });

  return (
    <EmptyState
      title="This booking is being updated"
      description="Pull to refresh in a moment."
      icon="refresh"
      testID="booking-unknown-view"
    />
  );
}

function noop() {
  // Intentionally inert until the corresponding backend action exists.
}

function noopFeedback(_value: string, _rating: RatingSelection | null) {
  // Intentionally inert when the host supplies no submit action.
}

export function BookingDetailScreen({
  bookingId,
  ...actions
}: BookingDetailActions & { readonly bookingId: string }) {
  const { state, refetch } = useBookingDetailData(bookingId);

  /**
   * Arriving on `201:278` IS the acknowledgement of Spoon's apology.
   *
   * Home keeps drawing the Cancelled banner (`393:1072`) until the server is told the customer
   * has read it. The design offers nothing to press — no "Got it", no dismiss — so the only
   * honest signal is that this page was actually opened.
   *
   * Fired once per booking, guarded by a ref rather than by the effect's dependencies: `state`
   * changes identity on every refetch and poll, and without the guard each one would re-post.
   * The server keeps the first instant regardless, so a duplicate is harmless — this just avoids
   * making the request at all.
   */
  const seen = useMarkCancellationSeen();
  const acknowledged = useRef<string | null>(null);
  const isAutoCancelled = state.status === 'ready' && state.data.view === 'autoCancelled';

  useEffect(() => {
    if (!isAutoCancelled || bookingId === '' || acknowledged.current === bookingId) return;
    acknowledged.current = bookingId;
    // Fire and forget: see `useMarkCancellationSeen` for why a failure stays silent here.
    seen.mutate({ bookingId });
  }, [isAutoCancelled, bookingId, seen]);

  /**
   * KEYED BY BOOKING. Expo Router keeps this route mounted and swaps the param, so without a key
   * the view's local state — the rating in progress, an open sheet, a chosen extension option —
   * would survive a move to a DIFFERENT booking. Observed on device: a `5+` chosen on one booking
   * was still drawn selected on the next one, which is a rating the customer never gave.
   */
  return (
    <BookingDetailView
      key={bookingId}
      bookingId={bookingId}
      state={state}
      onRetry={refetch}
      {...actions}
    />
  );
}
