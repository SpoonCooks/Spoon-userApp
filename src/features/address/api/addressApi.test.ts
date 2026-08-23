import { createStubApi } from '@/test/renderWithRuntime';

import { addressCreateScope, createAddressApi } from './addressApi';
import type { AddressWriteInput } from './schemas';

/**
 * The receiver's phone must leave the device in E.164, because that is the only shape the
 * deployed endpoint accepts.
 *
 * Both address write schemas bound `receiverPhone` with `^\+[1-9][0-9]{7,14}$`. `64:27` draws a
 * bare "Phone no." field on a `phone-pad`, and its own placeholder is "98765 43210" — so the
 * value the design invites is precisely the value the backend refuses. Confirmed against the
 * deployed API before this was written:
 *
 *   POST /v1/me/addresses  { receiverPhone: "9876543210"      } -> 400 INVALID_REQUEST
 *   POST /v1/me/addresses  { receiverPhone: "+91 98765 43210" } -> 400 INVALID_REQUEST
 *   POST /v1/me/addresses  { receiverPhone: "+919876543210"   } -> 401 (schema accepted)
 *   PUT  /v1/me/addresses/:id  — the same three results
 *
 * The customer saw none of that: the field is optional and carries no validation state, so a
 * completed form simply failed to save with a generic error and nothing pointing at the phone.
 *
 * Asserted on the BODY rather than through a screen, because the normalisation lives on the
 * transport boundary so that create, update and the idempotency scope cannot disagree about
 * what was sent.
 */

const BASE: AddressWriteInput = {
  label: 'Home',
  street: '27th Main Rd',
  pincode: '560102',
  latitude: 12.902429,
  longitude: 77.649321,
  flat: 'A101',
  society: 'Tower1',
};

/** A real `POST` reply, envelope already unwrapped by the transport. */
const WRITE_REPLY = {
  address: {
    id: 'addr-1',
    label: 'Home',
    receiverName: null,
    receiverPhone: '+919876543210',
    placeId: null,
    latitude: 12.902429,
    longitude: 77.649321,
    isDefault: true,
    serviceability: {
      status: 'serviceable',
      reason: 'AVAILABLE',
      hub: { id: 'hub-1', name: 'HSR Layout' },
    },
  },
};

/** Captures the body the transport was handed for a given method. */
function captureBody() {
  const sent: { body?: unknown } = {};
  const api = createStubApi({
    'POST /v1/me/addresses': (body) => {
      sent.body = body;
      return WRITE_REPLY;
    },
    'PUT /v1/me/addresses/addr-1': (body) => {
      sent.body = body;
      return WRITE_REPLY;
    },
  });
  return { sent, address: createAddressApi(api) };
}

describe('the receiver phone on the wire', () => {
  /** 1 — the reported defect: exactly what the placeholder demonstrates. */
  it('sends a bare national number with its country code', async () => {
    const { sent, address } = captureBody();
    await address.create({ ...BASE, receiverPhone: '9876543210' }, 'scope-1');

    expect((sent.body as { receiverPhone: string }).receiverPhone).toBe('+919876543210');
  });

  /** 2 — the placeholder's own spacing. */
  it('sends a spaced national number with its country code and no separators', async () => {
    const { sent, address } = captureBody();
    await address.create({ ...BASE, receiverPhone: '98765 43210' }, 'scope-1');

    expect((sent.body as { receiverPhone: string }).receiverPhone).toBe('+919876543210');
  });

  /** 3 — a customer who typed the country code is not given a second one. */
  it('passes an already-E.164 number through untouched', async () => {
    const { sent, address } = captureBody();
    await address.create({ ...BASE, receiverPhone: '+919876543210' }, 'scope-1');

    expect((sent.body as { receiverPhone: string }).receiverPhone).toBe('+919876543210');
  });

  /** 4 — the edit form replays a stored value, which the backend wrote in E.164. */
  it('compacts a spaced E.164 number rather than rejecting it', async () => {
    const { sent, address } = captureBody();
    await address.create({ ...BASE, receiverPhone: '+91 98765 43210' }, 'scope-1');

    expect((sent.body as { receiverPhone: string }).receiverPhone).toBe('+919876543210');
  });

  /** 5 — the field is optional and stays optional. An omitted phone is not sent as an empty one. */
  it('omits the field entirely when no phone was given', async () => {
    const { sent, address } = captureBody();
    await address.create(BASE, 'scope-1');

    expect(sent.body).not.toHaveProperty('receiverPhone');
  });

  /** 6 — update is the same endpoint family and the same bug. */
  it('normalises on update as well as create', async () => {
    const { sent, address } = captureBody();
    await address.update('addr-1', { ...BASE, receiverPhone: '9876543210' });

    expect((sent.body as { receiverPhone: string }).receiverPhone).toBe('+919876543210');
  });

  /** 7 — every normalised value satisfies the schema the deployed backend actually enforces. */
  it('produces a value the backend pattern accepts', async () => {
    const backendPattern = /^\+[1-9][0-9]{7,14}$/;

    for (const typed of ['9876543210', '98765 43210', '+919876543210', '+91 98765 43210']) {
      const { sent, address } = captureBody();
      await address.create({ ...BASE, receiverPhone: typed }, 'scope-1');

      expect((sent.body as { receiverPhone: string }).receiverPhone).toMatch(backendPattern);
    }
  });
});

describe('the create scope, once the phone is normalised', () => {
  /**
   * 8 — the scope reads the same `bodyOf` the request does, so normalisation must reach it too.
   *
   * A customer who retypes "98765 43210" as "9876543210" has not changed their intent. Scoping
   * on the raw text would mint a second `Idempotency-Key` for the identical request, which is
   * the exact failure mode the whole-body scope exists to prevent.
   */
  it('treats a re-typed national number as the same intent', () => {
    expect(addressCreateScope({ ...BASE, receiverPhone: '98765 43210' })).toBe(
      addressCreateScope({ ...BASE, receiverPhone: '9876543210' }),
    );
  });

  /** 9 — and a genuinely different number is still a different intent. */
  it('still rotates when the number itself changes', () => {
    expect(addressCreateScope({ ...BASE, receiverPhone: '9876543210' })).not.toBe(
      addressCreateScope({ ...BASE, receiverPhone: '9876543211' }),
    );
  });
});
