import { addressSchema, addressWriteResponseSchema } from './schemas';

const serviceability = {
  status: 'serviceable' as const,
  reason: 'AVAILABLE' as const,
  hub: { id: 'hub-1', name: 'Bengaluru Hub' },
};

describe('saved-address contract', () => {
  it('retains the backend evaluated serviceability projection on list rows', () => {
    const parsed = addressSchema.parse({
      id: 'addr-1',
      label: 'Home',
      flat: null,
      tower: null,
      society: null,
      street: 'Silver County Road',
      pincode: '560102',
      city: 'Bengaluru',
      state: 'Karnataka',
      hub_id: 'hub-1',
      receiverName: null,
      receiverPhone: null,
      isDefault: true,
      latitude: 12.902746,
      longitude: 77.648817,
      serviceability,
    });

    expect(parsed.serviceability).toEqual(serviceability);
  });

  it('requires the same evaluated serviceability projection on address writes', () => {
    const parsed = addressWriteResponseSchema.parse({
      address: {
        id: 'addr-1',
        label: 'Home',
        receiverName: null,
        receiverPhone: null,
        placeId: null,
        latitude: 12.902746,
        longitude: 77.648817,
        isDefault: true,
        serviceability,
      },
    });

    expect(parsed.address.serviceability.reason).toBe('AVAILABLE');
    expect(parsed.address.label).toBe('Home');
  });

  /**
   * `PUT /v1/me/addresses/:id` does not echo the label, and that is the CONTRACT.
   *
   * `POST` builds `{ id, label, receiverName, receiverPhone, placeId, latitude, longitude,
   * isDefault, serviceability }`; `PUT` builds the same object WITHOUT `label`. The published
   * `AddressWritten` response agrees — only `[id, isDefault, serviceability, latitude, longitude]`
   * are required.
   *
   * This schema required `label`, so every SUCCESSFUL update threw at the parse and reached the
   * customer as a failed save — on top of a row the backend had already changed. Retrying then
   * re-sent a write that had already landed.
   *
   * Nothing is given up by matching the contract: the label the app renders comes from
   * `GET /v1/me/addresses`, which the mutation invalidates, and no screen reads it off this reply.
   */
  it('parses an UPDATE reply, which the backend sends without a label', () => {
    const parsed = addressWriteResponseSchema.parse({
      address: {
        id: 'addr-1',
        receiverName: null,
        receiverPhone: null,
        placeId: null,
        latitude: 12.902429,
        longitude: 77.649321,
        isDefault: false,
        serviceability,
      },
    });

    expect(parsed.address.id).toBe('addr-1');
    expect(parsed.address.label).toBeUndefined();
    // The fields the flow actually depends on are still REQUIRED — the point of the coordinates
    // and the verdict surviving is that neither is ever guessed at.
    expect(parsed.address.latitude).toBe(12.902429);
    expect(parsed.address.longitude).toBe(77.649321);
    expect(parsed.address.serviceability.status).toBe('serviceable');
  });

  /** A reply missing a field the UI genuinely needs still fails, loudly. */
  it('still refuses a write reply with no serviceability verdict', () => {
    expect(() =>
      addressWriteResponseSchema.parse({
        address: {
          id: 'addr-1',
          receiverName: null,
          receiverPhone: null,
          placeId: null,
          latitude: 12.902429,
          longitude: 77.649321,
          isDefault: false,
        },
      }),
    ).toThrow();
  });
});
