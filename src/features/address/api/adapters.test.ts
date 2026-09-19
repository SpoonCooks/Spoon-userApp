import { addressWriteInputFrom } from './adapters';
import type { AddressDto } from './schemas';

/**
 * `addressWriteInputFrom` — a stored address, back into a write body.
 *
 * It exists for one caller: making an address the account default is a full `PUT`, so the record
 * has to be replayed whole. That makes these tests about LOSS, not about mapping — every field
 * the DTO carries and the write accepts has to survive the round trip, because anything dropped
 * here is silently erased from the customer's saved address the moment they tap a row.
 */

const SAVED: AddressDto = {
  id: 'addr-1',
  label: 'Home',
  flat: 'E102',
  tower: null,
  society: 'Purva Skydale',
  street: 'Silver County Road',
  pincode: '560102',
  city: 'Bengaluru',
  state: 'Karnataka',
  hub_id: 'hub-1',
  receiverName: 'Asha',
  receiverPhone: '+919876543210',
  isDefault: false,
  latitude: 12.902746,
  longitude: 77.648817,
  placeId: 'place-1',
  serviceability: {
    status: 'serviceable',
    reason: 'AVAILABLE',
    hub: { id: 'hub-1', name: 'Bengaluru Hub' },
  },
};

describe('addressWriteInputFrom', () => {
  it('replays every field the write accepts, unchanged', () => {
    expect(addressWriteInputFrom(SAVED)).toEqual({
      label: 'Home',
      flat: 'E102',
      society: 'Purva Skydale',
      street: 'Silver County Road',
      pincode: '560102',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.902746,
      longitude: 77.648817,
      placeId: 'place-1',
      receiverName: 'Asha',
      receiverPhone: '+919876543210',
    });
  });

  it('OMITS nullable columns rather than sending null', () => {
    // The write schemas are `additionalProperties: false` with typed optionals, so an explicit
    // null is a 400 — `tower` is null on the fixture and must not appear at all.
    expect(addressWriteInputFrom(SAVED)).not.toHaveProperty('tower');

    const bare = addressWriteInputFrom({
      ...SAVED,
      flat: null,
      tower: null,
      society: null,
      city: null,
      state: null,
      placeId: null,
      receiverName: null,
      receiverPhone: null,
    });

    expect(bare).toEqual({
      label: 'Home',
      street: 'Silver County Road',
      pincode: '560102',
      latitude: 12.902746,
      longitude: 77.648817,
    });
  });

  it('omits placeId when the column is absent as well as when it is null', () => {
    const { placeId: _dropped, ...withoutPlaceId } = SAVED;
    expect(addressWriteInputFrom(withoutPlaceId)).not.toHaveProperty('placeId');
  });

  it('carries no isDefault of its own — the caller sets it', () => {
    // The mapper describes the address; it does not decide the account's default. `isDefault`
    // riding along here would make every ordinary edit silently promote its own row.
    expect(addressWriteInputFrom({ ...SAVED, isDefault: true })).not.toHaveProperty('isDefault');
  });

  it('keeps the stored receiver phone in E.164, which is what the backend accepted', () => {
    // `bodyOf` runs `toE164` on the way out and passes a number that already carries its country
    // code through untouched, so replaying the stored value is a no-op rather than a reformat.
    expect(addressWriteInputFrom(SAVED).receiverPhone).toBe('+919876543210');
  });
});
