import { canOfferReschedule } from './eligibility';

/**
 * Ruling R-3: the client must never infer reschedule eligibility. These tests exist to make a
 * regression toward client-side inference fail loudly.
 */
describe('canOfferReschedule', () => {
  it('offers reschedule only when the backend explicitly allows it', () => {
    expect(canOfferReschedule(true)).toBe(true);
  });

  it('hides reschedule when the backend says no', () => {
    expect(canOfferReschedule(false)).toBe(false);
  });

  it('fails closed when the backend said nothing at all', () => {
    expect(canOfferReschedule(undefined)).toBe(false);
  });
});
