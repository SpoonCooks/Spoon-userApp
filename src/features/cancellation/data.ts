import { useMemo } from 'react';

import { useCancellationPreview, useRescheduleOptions } from '@features/booking';
import { useCatalogue } from '@features/catalogue';
import { ready } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { cancellationFrom } from './adapters';
import { DEMO_CANCELLATION } from '@/demo/fixtures/screens';
import type { CancellationViewModel } from './types';

/**
 * Cancellation data.
 *
 *  - `GET /v1/catalogue` -> the published refund bands and the reason list
 *  - `GET /v1/bookings/:id/cancellation-preview` -> the fee, the refund and `cancellable`
 *  - `GET /v1/bookings/:id/reschedule-options` -> whether the reschedule prompt is offered
 *
 * `DEMO_CANCELLATION` supplies copy only. Every figure and every eligibility flag is the
 * server's; the client evaluates no band and computes no refund.
 *
 * The screen renders as soon as the CATALOGUE settles, so the policy table is visible while the
 * per-booking preview is still in flight. Without a booking id (the dev route), the preview and
 * reschedule reads stay disabled and the screen shows the published schedule alone.
 */
export function useCancellationData(
  bookingId: string | null = null,
): ScreenQuery<CancellationViewModel> {
  const catalogue = useCatalogue();
  const preview = useCancellationPreview(bookingId);
  const reschedule = useRescheduleOptions(bookingId);

  const state = useMemo(() => {
    if (catalogue.state.status !== 'ready') return catalogue.state;

    return ready(
      cancellationFrom({
        base: DEMO_CANCELLATION,
        catalogue: catalogue.state.data,
        preview: preview.state.status === 'ready' ? preview.state.data : null,
        reschedule: reschedule.state.status === 'ready' ? reschedule.state.data : null,
      }),
    );
  }, [catalogue.state, preview.state, reschedule.state]);

  return {
    state,
    refetch: () => {
      catalogue.refetch();
      preview.refetch();
      reschedule.refetch();
    },
  };
}
