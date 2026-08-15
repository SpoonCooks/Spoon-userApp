import { useState } from 'react';

import type { DataState } from '@core/data';
import { getLogger } from '@core/logging';
import { EmptyState, QueryBoundary, Screen } from '@ui';
import type { RatingValue } from '@ui';

import { AutoCancelledBody } from '../components/AutoCancelledBody';
import { BookingHeader } from '../components/BookingHeader';
import { CompletionBody } from '../components/CompletionBody';
import { ConfirmationBody } from '../components/ConfirmationBody';
import { ExtensionSheet } from '../components/ExtensionSheet';
import { InServiceBody } from '../components/InServiceBody';
import { TrackingBody } from '../components/TrackingBody';
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
  readonly onReschedule?: () => void;
  readonly onCancel?: () => void;
  readonly onStartService?: () => void;
  readonly onEndService?: () => void;
  readonly onSubmitFeedback?: (feedback: string) => void;
  readonly onSelectTip?: (tipId: string) => void;
  /** `201:96` / `201:93` — PRODUCT_PENDING: neither answer names a destination in the design. */
  readonly onRebook?: () => void;
  readonly onDeclineRebook?: () => void;
}

export interface BookingDetailViewProps extends BookingDetailActions {
  readonly state: DataState<BookingDetailViewModel>;
  readonly onRetry: () => void;
}

export function BookingDetailView({ state, onRetry, ...actions }: BookingDetailViewProps) {
  const [rating, setRating] = useState<RatingValue | null>(null);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [extensionOptionId, setExtensionOptionId] = useState<string | null>(null);
  const extension = useExtensionData();

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
                selectedOptionId={extensionOptionId}
                onSelectOption={setExtensionOptionId}
                onClose={() => setExtensionOpen(false)}
                onExtend={() => {
                  // TODO(backend-contract): submit the extension and re-read the booking. The new
                  // end time comes from the response — never from client arithmetic.
                  setExtensionOpen(false);
                  onRetry();
                }}
                onBookAnother={() => setExtensionOpen(false)}
              />
            ) : null}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );

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
            {...(actions.onCallCook === undefined ? {} : { onCallCook: actions.onCallCook })}
            {...(actions.onReschedule === undefined ? {} : { onReschedule: actions.onReschedule })}
            {...(actions.onCancel === undefined ? {} : { onCancel: actions.onCancel })}
          />
        );

      case 'enRoute':
        return booking.tracking === undefined ? (
          unknownView(booking.view)
        ) : (
          <TrackingBody
            tracking={booking.tracking}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            {...(actions.onCallCook === undefined ? {} : { onCallCook: actions.onCallCook })}
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
            {...(actions.onCallCook === undefined ? {} : { onCallCook: actions.onCallCook })}
          />
        );

      case 'arrived':
        return booking.arrived === undefined ? (
          unknownView(booking.view)
        ) : (
          <TrackingBody
            tracking={booking.arrived}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            {...(actions.onCallCook === undefined ? {} : { onCallCook: actions.onCallCook })}
            {...(actions.onStartService === undefined
              ? {}
              : { onStartService: actions.onStartService })}
          />
        );

      case 'inService':
        return booking.inService === undefined ? (
          unknownView(booking.view)
        ) : (
          <InServiceBody
            inService={booking.inService}
            {...(booking.cook === undefined ? {} : { cook: booking.cook })}
            {...(actions.onCallCook === undefined ? {} : { onCallCook: actions.onCallCook })}
            onExtend={() => setExtensionOpen(true)}
            onEndService={actions.onEndService ?? noop}
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
            onSubmitFeedback={actions.onSubmitFeedback ?? noopFeedback}
            onSelectTip={actions.onSelectTip ?? noopFeedback}
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

function noopFeedback(_value: string) {
  // Intentionally inert until the corresponding backend action exists.
}

export function BookingDetailScreen({
  bookingId,
  ...actions
}: BookingDetailActions & { readonly bookingId: string }) {
  const { state, refetch } = useBookingDetailData(bookingId);
  return <BookingDetailView state={state} onRetry={refetch} {...actions} />;
}
