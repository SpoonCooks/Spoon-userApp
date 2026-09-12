import type { ApiClient, RequestOptions } from '@core/api';
import { createIdempotencyScope, idempotencyHeader } from '@core/api';

import { createAccountApi } from './accountApi';

/**
 * `DELETE /v1/me` — the call that actually ends the account.
 *
 * Asserted on the WIRE rather than through the screen, because three parts of this request are
 * contract rather than presentation and each fails in a way that looks like something else:
 *
 *  - the OTP travels in the BODY of the delete call, never through `otp/verify`. Verifying first
 *    would spend the one-time code and mint a session, so the delete would arrive with a code
 *    the server had already consumed.
 *  - the `Idempotency-Key` header is REQUIRED; without it the request is refused outright.
 *  - the method is DELETE and it carries a JSON body, which not every transport will send.
 */

/** Captures the whole request, headers included — the shared stub only exposes the body. */
function captureRequest() {
  const sent: { path?: string; options?: RequestOptions<unknown> } = {};
  const api: ApiClient = {
    async request(path, options) {
      sent.path = path;
      sent.options = options as RequestOptions<unknown>;
      return options.parse({ deleted: true });
    },
  };
  return { sent, account: createAccountApi(api) };
}

describe('DELETE /v1/me', () => {
  it('sends the typed code in the body of the delete itself', async () => {
    const { sent, account } = captureRequest();

    await account.deleteAccount('123456', 'account:delete:usr_1');

    expect(sent.path).toBe('/v1/me');
    expect(sent.options?.method).toBe('DELETE');
    expect(sent.options?.body).toEqual({ otp: '123456' });
  });

  it('carries the idempotency key for the attempt', async () => {
    const { sent, account } = captureRequest();

    await account.deleteAccount('123456', 'account:delete:usr_1');

    const key = sent.options?.headers?.['Idempotency-Key'];
    expect(key).toBeDefined();
    // The server's own bound, not the transport's looser 200-char ceiling. See `idempotency.test`.
    expect(key).toMatch(/^[A-Za-z0-9._~-]{8,128}$/);
  });

  /**
   * The retry contract. The server hashes an EMPTY body against the key and marks a failed
   * attempt retryable, so a corrected code under the SAME key is processed rather than replayed
   * — which is the only reason a customer who fat-fingers a digit can recover without restarting.
   */
  it('reuses one key across retries of the same attempt, whatever the code', async () => {
    const scope = createIdempotencyScope();
    const keys: (string | undefined)[] = [];
    const api: ApiClient = {
      async request(_path, options) {
        keys.push(options.headers?.['Idempotency-Key']);
        return options.parse({ deleted: true });
      },
    };
    const account = createAccountApi(api);

    // Two attempts at one intent: the scope store is what holds the key steady between them.
    const header = () => idempotencyHeader('account:delete:usr_1', scope)['Idempotency-Key'];
    expect(header()).toBe(header());

    await account.deleteAccount('111111', 'account:delete:usr_1');
    await account.deleteAccount('123456', 'account:delete:usr_1');

    expect(keys[0]).toBe(keys[1]);
  });

  it('refuses a 200 that does not confirm the deletion', async () => {
    const api: ApiClient = {
      async request(_path, options) {
        return options.parse({ deleted: 'yes' });
      },
    };

    // Boundary validation, not a soft read: a reply this shape means the contract moved, and
    // treating it as success would sign a customer out of an account that still exists.
    await expect(createAccountApi(api).deleteAccount('123456', 'scope')).rejects.toThrow();
  });
});
