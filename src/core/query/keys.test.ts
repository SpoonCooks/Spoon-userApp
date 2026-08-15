import { bookingKeys } from '@features/booking';
import { homeKeys } from '@features/home';

import { createKeyFactory } from './keys';

describe('createKeyFactory', () => {
  const keys = createKeyFactory('booking');

  it('scopes every key so invalidation has an auditable blast radius', () => {
    expect(keys.all()).toEqual(['booking']);
    expect(keys.detail('bk_1')[0]).toBe('booking');
    expect(keys.collection('active')[0]).toBe('booking');
  });

  it('distinguishes details by id', () => {
    expect(keys.detail('bk_1')).not.toEqual(keys.detail('bk_2'));
  });

  it('includes params in a collection key so filters cache separately', () => {
    expect(keys.collection('list', { page: 1 })).toEqual(['booking', 'list', { page: 1 }]);
    expect(keys.collection('list')).toEqual(['booking', 'list']);
  });

  it('keeps feature namespaces disjoint', () => {
    expect(bookingKeys.all()).not.toEqual(homeKeys.all());
  });
});
