import type { ApiClient } from '@core/api';

import { createPushApi } from './pushApi';

const refused = { kind: 'validation', status: 400, code: 'INVALID_REQUEST', message: 'Invalid' };

function clientThat(...outcomes: readonly unknown[]) {
  const request = jest.fn();
  for (const outcome of outcomes) {
    if (outcome instanceof Promise) request.mockReturnValueOnce(outcome);
    else request.mockRejectedValueOnce(outcome);
  }
  return { request, api: { request } as unknown as ApiClient };
}

const input = { token: 'tok-1', platform: 'ios' as const, notificationsEnabled: false };

describe('PUT /v1/me/push-token', () => {
  it('sends notificationsEnabled, false included', async () => {
    const { request, api } = clientThat(Promise.resolve({}));
    await createPushApi(api).registerToken(input);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1].body).toEqual({
      token: 'tok-1',
      platform: 'ios',
      notificationsEnabled: false,
    });
  });

  it('retries once without the flag when an older API refuses it', async () => {
    const { request, api } = clientThat(refused, Promise.resolve({}));
    await createPushApi(api).registerToken(input);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][1].body).toEqual({ token: 'tok-1', platform: 'ios' });
  });

  it('does not retry a network failure or a rate limit', async () => {
    const network = { kind: 'network', message: 'offline' };
    const limited = { ...refused, code: 'RATE_LIMITED' };
    for (const failure of [network, limited]) {
      const { request, api } = clientThat(failure);
      await expect(createPushApi(api).registerToken(input)).rejects.toBe(failure);
      expect(request).toHaveBeenCalledTimes(1);
    }
  });
});
