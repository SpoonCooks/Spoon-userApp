import { feeScheduleFrom } from '@features/cancellation/adapters';
import type { Catalogue } from '@features/catalogue';

/**
 * The published cancellation schedule, as `6:22` draws it.
 *
 * The column is headed "Fee as percentage". The adapter used to print the REFUND under it —
 * "75% refund" where the design says "25%" — so every number on the one screen whose job is to
 * tell a customer what cancelling costs was the complement of the truth. The windows were printed
 * in minutes too ("More than 180 mins before"), a unit nobody cancelling a booking thinks in.
 */

const bandsOf = (
  bands: Catalogue['cancellation']['bands'],
): Pick<Catalogue, 'cancellation'>['cancellation'] =>
  ({ policyVersion: 'v', refundBasis: 'captured_gross', bands, reasons: [] }) as never;

const scheduleOf = (bands: Catalogue['cancellation']['bands']) =>
  feeScheduleFrom({ cancellation: bandsOf(bands) } as Catalogue);

describe('the cancellation fee schedule', () => {
  it('states the published fee, in the words the design uses', () => {
    const rows = scheduleOf([
      { band: 'SCHEDULED_FULL_REFUND', minMinutesToStart: 180, refundPercent: 100 },
      {
        band: 'SCHEDULED_PARTIAL_REFUND',
        minMinutesToStart: 60,
        maxMinutesToStart: 180,
        refundPercent: 75,
        chargePercent: 25,
      },
      {
        band: 'SCHEDULED_PARTIAL_REFUND',
        maxMinutesToStart: 60,
        refundPercent: 50,
        chargePercent: 50,
      },
    ]);

    expect(rows).toEqual([
      { label: 'More than 3 hrs to start time', value: 'Free', free: true },
      { label: 'Between 3 hrs to 1 hr to start time', value: '25%' },
      { label: 'Within 1 hr to start time', value: '50%' },
    ]);
  });

  it('will not invent a fee the policy has not published', () => {
    // A band published before the last one could refund anything states no fee. Printing
    // `100 - refundPercent` would be a number the client made up: that complement only holds
    // under the captured-gross basis, and the service-base arithmetic leaves a tax residual.
    const [row] = scheduleOf([
      { band: 'SCHEDULED_NO_REFUND', maxMinutesToStart: 60, refundPercent: 0 },
    ]);
    expect(row?.value).toBe('0% refund');
  });

  it('prints a boundary that is not whole hours in minutes', () => {
    const [row] = scheduleOf([
      { band: 'SCHEDULED_FULL_REFUND', minMinutesToStart: 90, refundPercent: 100 },
    ]);
    expect(row?.label).toBe('More than 90 mins to start time');
  });
});
