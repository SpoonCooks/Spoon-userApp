import { useCallback, useEffect, useMemo, useRef } from 'react';

import { LOADING, failed, ready, useApiQueries } from '@core/data';
import type { DataState } from '@core/data';
import { useRuntime } from '@core/runtimeContext';
import { currentAddressOf, useAddresses } from '@features/address';
import { availabilityKeys, createAvailabilityApi } from '@features/availability';
import type { InstantAvailabilityDto } from '@features/availability';
import { useBookingHistory } from '@features/booking';
import { useCatalogue } from '@features/catalogue';

import { homeModelFrom } from './adapters';
import type { InstantReads } from './adapters';
import type { HomeModel } from './types';

export interface HomeRedesignData {
  readonly state: DataState<HomeModel>;
  /** The customer has no saved address at all — the route sends them to add one. */
  readonly needsAddress: boolean;
  /** The address every read (and the waitlist) is made against. */
  readonly addressId: string | null;
  /** Re-reads everything — on Home focus, on the Now/Later switch, and from pricing's Retry. */
  readonly refetch: () => void;
}

/**
 * The redesigned Home's read, composed from endpoints that exist today (see `adapters.ts` for
 * the field-by-field map and what is still missing).
 *
 * Only the ADDRESS list gates the screen: without it there is no variant. A slow or failed
 * catalogue surfaces as the carousel's skeleton / retry instead of blanking Home, and history or
 * instant reads still in flight fall back to "first-time" and "bookable".
 */
export function useHomeRedesignData(options: { waitlistJoined: boolean }): HomeRedesignData {
  const { api } = useRuntime();
  const addresses = useAddresses();
  const catalogue = useCatalogue();
  const history = useBookingHistory();

  const address =
    addresses.state.status === 'ready' ? currentAddressOf(addresses.state.data) : null;
  const addressId = address?.id ?? null;
  const minutes = useMemo(
    () =>
      catalogue.state.status === 'ready'
        ? catalogue.state.data.durations.map((d) => d.durationMinutes)
        : [],
    [catalogue.state],
  );

  const availability = createAvailabilityApi(api);
  const instantReads = useApiQueries<InstantAvailabilityDto>(
    minutes.map((durationMinutes) => ({
      queryKey: availabilityKeys.instant({ addressId: addressId ?? 'none', durationMinutes }),
      queryFn: ({ signal }) =>
        availability.instant({ addressId: addressId ?? '', durationMinutes }, signal),
      enabled: addressId !== null,
      staleTime: 15_000,
    })),
  );

  const state = useMemo<DataState<HomeModel>>(() => {
    if (addresses.state.status === 'loading') return LOADING;
    if (addresses.state.status === 'error') return failed(addresses.state.error);
    if (address === null) return LOADING;

    const instant: InstantReads = new Map(
      minutes.map((m, i) => {
        const read = instantReads[i]?.state;
        return [m, read?.status === 'ready' ? read.data : undefined];
      }),
    );

    return ready(
      homeModelFrom({
        address,
        catalogue: catalogue.state.status === 'ready' ? catalogue.state.data : undefined,
        catalogueStatus: catalogue.state.status,
        instant,
        history: history.state.status === 'ready' ? history.state.data : undefined,
        waitlistJoined: options.waitlistJoined,
      }),
    );
  }, [
    addresses.state,
    address,
    catalogue.state,
    history.state,
    instantReads,
    minutes,
    options.waitlistJoined,
  ]);

  // ONE identity for the life of Home. The route calls this from `useFocusEffect`, which re-runs
  // whenever its callback changes; a `refetch` that changed with the reads (every failed fetch is
  // a new error, so a new state) re-fired on every render and flooded the API until it rate
  // limited us. The ref always holds the latest reads.
  const reads = useRef({ addresses, catalogue, history, instantReads });
  useEffect(() => {
    reads.current = { addresses, catalogue, history, instantReads };
  });
  const refetch = useCallback(() => {
    const latest = reads.current;
    latest.addresses.refetch();
    latest.catalogue.refetch();
    latest.history.refetch();
    for (const read of latest.instantReads) read.refetch();
  }, []);

  return {
    state,
    needsAddress: addresses.state.status === 'ready' && addresses.state.data.length === 0,
    addressId,
    refetch,
  };
}
