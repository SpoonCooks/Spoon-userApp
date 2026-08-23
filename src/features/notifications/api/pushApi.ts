import { Platform } from 'react-native';

import type { ApiClient } from '@core/api';

/**
 * Push-token registration — `PUT /v1/me/push-token`.
 *
 * ## The frontend never talks to the worker
 *
 * Delivery is the worker's job: it owns the outbox, the FCM send and the lifecycle jobs. The app
 * registers a token with the API and stops. There is no worker URL anywhere in this repo and
 * there must never be one — the boundary is APP -> API -> infrastructure.
 */

export const PUSH_PATHS = { token: '/v1/me/push-token' } as const;

export type PushPlatform = 'android' | 'ios';

/** The contract enumerates exactly these two. `web` is not a valid value. */
export function currentPushPlatform(): PushPlatform | null {
  return Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : null;
}

export function createPushApi(api: ApiClient) {
  return {
    /**
     * Registers (or re-registers) this device's token.
     *
     * Re-registering the same token under a different account MOVES it, which is the backend's
     * behaviour and the correct one: a shared handset must not keep delivering the previous
     * customer's booking notifications.
     */
    async registerToken(input: { token: string; platform: PushPlatform }): Promise<unknown> {
      return api.request(PUSH_PATHS.token, {
        method: 'PUT',
        body: { token: input.token, platform: input.platform },
        parse: (data) => data,
      });
    },
  };
}

/**
 * The push-token seam.
 *
 * ## Why this is not implemented
 *
 * Obtaining a token needs a native module (`expo-notifications`) plus a Firebase config file in
 * the Android build. Both are native dependency/config changes requiring a prebuild and a new
 * APK, which §23/§16 put behind an approved strategy. No package was added.
 *
 * ## Deployment state, separately
 *
 * The API this integration ran against reported `providersConfigured.fcm: false` at startup, so
 * even a real token would have nothing to deliver it. Recorded as BACKEND_DEPLOYMENT_GAP.
 *
 * The default implementation returns `null` — "no token available" — rather than a fabricated
 * one, so registration is skipped instead of poisoning the backend's token table.
 */
export interface PushTokenProvider {
  /** Requests permission and resolves the device token, or null when unavailable/denied. */
  getToken(): Promise<string | null>;
}

export const unavailablePushTokenProvider: PushTokenProvider = {
  async getToken() {
    return null;
  },
};
