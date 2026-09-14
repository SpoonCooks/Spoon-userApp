import type { ApiClient, RequestOptions } from '@core/api';

import { createAuthApi } from './authApi';

/**
 * `POST /v1/auth/otp/send` is shared by two flows that must not drift into each other.
 *
 * Login asks unauthenticated (no session exists yet) and names no audience. Account deletion asks
 * with the caller's token attached, and names `customer` explicitly — that flag is what the
 * backend splits the customer app from the cook app on.
 *
 * The risk this pins is one-directional and silent: `audience` and `authenticated` were added for
 * deletion, and a default that leaked into Login would change a production request that currently
 * works, on the app's only way in.
 */

function captureRequest() {
  const sent: { path?: string; options?: RequestOptions<unknown> } = {};
  const api: ApiClient = {
    async request(path, options) {
      sent.path = path;
      sent.options = options as RequestOptions<unknown>;
      return options.parse({ accepted: true, retryAfterSeconds: 30 });
    },
  };
  return { sent, auth: createAuthApi(api) };
}

describe('the OTP send Login makes', () => {
  it('is unchanged by the deletion flow’s additions', async () => {
    const { sent, auth } = captureRequest();

    await auth.sendOtp('+919876543210');

    expect(sent.path).toBe('/v1/auth/otp/send');
    expect(sent.options?.method).toBe('POST');
    // The whole body, not a subset: an `audience: undefined` would be a declared key on the wire.
    expect(sent.options?.body).toEqual({ phone: '+919876543210' });
    expect(Object.keys(sent.options?.body as object)).toEqual(['phone']);
    // No session exists yet, and the unauthenticated client is what keeps a 401 here from
    // recursing into a refresh.
    expect(sent.options?.authenticated).toBe(false);
  });
});

describe('the OTP send account deletion makes', () => {
  it('names the audience and carries the caller’s token', async () => {
    const { sent, auth } = captureRequest();

    await auth.sendOtp('+919876543210', { audience: 'customer', authenticated: true });

    expect(sent.options?.body).toEqual({ phone: '+919876543210', audience: 'customer' });
    /*
     * The route never reads the header. The rate limiter does: it buckets by user id when a token
     * is present and by phone number when it is not, which keeps deletion sends out of the same
     * budget as login sends on that number.
     */
    expect(sent.options?.authenticated).toBe(true);
  });
});
