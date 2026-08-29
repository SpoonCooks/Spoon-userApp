import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getDeviceId } from '@core/auth';
import { useApiQuery } from '@core/data';
import type { ScreenQuery } from '@core/data';
import { useRuntime } from '@core/runtimeContext';
import { bookingKeys } from '@features/booking';

import { authKeys } from './keys';
import { createAuthApi } from './authApi';
import type {
  MeResponse,
  OtpSendResponse,
  OtpVerifyResponse,
  ProfileData,
  ProfileUpdateRequest,
} from './schemas';

/**
 * The React layer over the auth endpoints.
 *
 * Mutations, not queries, for everything that changes server state — and none of them retry
 * (the query client sets `mutations.retry: false`), because a silently retried OTP verify burns
 * an attempt against the server's retry budget.
 */

/** `POST /v1/auth/otp/send`. */
export function useSendOtp() {
  const { authApi } = useRuntime();
  const api = createAuthApi(authApi);

  return useMutation<OtpSendResponse, Error, string>({
    mutationFn: (phone: string) => api.sendOtp(phone),
  });
}

/**
 * `POST /v1/auth/otp/verify`, followed by the session hand-off.
 *
 * The hand-off is part of the mutation on purpose: a verify that succeeded on the server but
 * whose tokens never reached SecureStore would leave the user staring at the OTP screen holding
 * a valid, unusable session. Storing before resolving makes "the mutation succeeded" and "the
 * app is signed in" the same event.
 */
export function useVerifyOtp() {
  const { authApi, session } = useRuntime();
  const queryClient = useQueryClient();
  const api = createAuthApi(authApi);

  return useMutation<OtpVerifyResponse, Error, { phone: string; otp: string }>({
    async mutationFn({ phone, otp }) {
      const deviceId = await getDeviceId();
      const result = await api.verifyOtp({ phone, otp, deviceId });

      await session.signIn({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        // The server's own instant, parsed — never a TTL the client assumed.
        expiresAt: Date.parse(result.accessTokenExpiresAt),
      });

      return result;
    },
    onSuccess() {
      // A previous account's cached reads must not survive into this session.
      void queryClient.invalidateQueries();
    },
  });
}

/**
 * `GET /v1/me` — the identity the app restores itself from after a cold start.
 *
 * `enabled` is the caller's, because every screen that wants it is already behind the session
 * gate; a `/me` fired before bootstrap resolves would 401 and burn a refresh.
 */
export function useMe(options: { enabled?: boolean } = {}): ScreenQuery<MeResponse> {
  const { api } = useRuntime();
  const auth = createAuthApi(api);

  return useApiQuery<MeResponse>({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => auth.getMe(signal),
    enabled: options.enabled ?? true,
    // Identity changes rarely; a profile update invalidates this key explicitly.
    staleTime: 5 * 60_000,
  });
}

/**
 * `PUT /v1/me/profile` — all eight answers.
 *
 * ## Why the response is written into the cache AND the key invalidated
 *
 * The reply is the committed projection of the row that was just written, including the
 * recomputed `profileComplete`. Merging it into `authKeys.me()` makes `6:663` correct on the
 * very next render: the completion card flips the instant the write lands, with no restart and
 * no window in which a finished profile still reads as incomplete (task §12).
 *
 * The invalidation stays because the merge is a SUPERSET write, not a substitute for the read.
 * `/me` also carries `id`, `role`, `status` and `phone`, which this reply does not, so the merge
 * layers the eight profile keys over whatever identity is already cached and the refetch remains
 * the authority on the rest. If nothing is cached yet there is nothing to layer onto, and the
 * refetch is the only thing that runs — which is why the merge is written defensively rather
 * than assuming a previous `/me`.
 */
export function useUpdateProfile() {
  const { api } = useRuntime();
  const queryClient = useQueryClient();
  const auth = createAuthApi(api);

  return useMutation<ProfileData, Error, ProfileUpdateRequest>({
    mutationFn: (patch: ProfileUpdateRequest) => auth.updateProfile(patch),
    onSuccess(profile) {
      queryClient.setQueryData<MeResponse>(authKeys.me(), (current) =>
        current === undefined ? current : { ...current, ...profile },
      );
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      // The assigned-cook card's veg/mixed projection is derived SERVER-SIDE from the stored
      // `dietaryPreference`, so a profile save can change what every booking read returns.
      // Refetching bookings here is what makes the card follow the answer without an app
      // restart; the server remains the only thing that decides the variant.
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all() });
    },
  });
}

/**
 * Sign out.
 *
 * The local teardown is NOT conditional on the network call. A user who taps Log Out on a train
 * must end up logged out; the server-side revocation is attempted, and its failure is swallowed
 * deliberately rather than left to strand them in a signed-in shell.
 */
export function useSignOut() {
  const { api, session, logger } = useRuntime();
  const auth = createAuthApi(api);

  return useMutation<void, Error, void>({
    async mutationFn() {
      try {
        await auth.logout();
      } catch (error) {
        logger.warn('Server-side logout failed; clearing local session anyway', {
          error: String(error),
        });
      }
      await session.signOut();
    },
  });
}
