/**
 * Incident audit: parse the EXACT deployed staging responses (captured 2026-08-26,
 * booking a0f6e21f) with this commit's Zod boundary schemas.
 *
 * Each failure prints the precise ZodError paths — the field-level truth of why the
 * app renders "Something went wrong" on a 200 response.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { catalogueSchema } from '@features/catalogue/api/schemas';
import {
  bookingDetailResponseSchema,
  cancellationPreviewSchema,
  rescheduleOptionsSchema,
  bookingListResponseSchema,
} from '@features/booking/api/schemas';
import { addressListSchema } from '@features/address/api/schemas';

const WIRE = process.env.WIRE_DIR || join(__dirname, 'fixtures', 'wire');

function wire(name: string): unknown {
  const body = JSON.parse(readFileSync(join(WIRE, `${name}.json`), 'utf8')) as {
    data: unknown;
  };
  return body.data;
}

function tryParse(
  label: string,
  schema: { safeParse(v: unknown): { success: boolean; error?: unknown } },
  value: unknown,
): void {
  const out = schema.safeParse(value);
  if (!out.success) {
    const issues = (
      out.error as { issues: { path: (string | number)[]; code: string; message: string }[] }
    ).issues;
    const lines = issues.map((i) => `  ${i.path.join('.') || '(root)'} — ${i.code}: ${i.message}`);
    throw new Error(`${label} FAILED to parse deployed response:\n${lines.join('\n')}`);
  }
}

describe('deployed staging responses vs 2f139e1 boundary schemas', () => {
  it('catalogue parses the deployed captured-gross refund basis', () => {
    tryParse('catalogue', catalogueSchema, wire('catalogue'));
    expect(catalogueSchema.parse(wire('catalogue')).cancellation.refundBasis).toBe(
      'captured_gross',
    );
  });
  it('booking detail parses', () => {
    tryParse(
      'bookingDetail',
      bookingDetailResponseSchema,
      wire('bookings_a0f6e21f-c0a2-4532-838f-4a8810067d90'),
    );
  });
  it('cancellation preview parses', () => {
    tryParse(
      'cancellationPreview',
      cancellationPreviewSchema,
      wire('bookings_a0f6e21f-c0a2-4532-838f-4a8810067d90_cancellation-preview'),
    );
  });
  it('reschedule options parse', () => {
    tryParse(
      'rescheduleOptions',
      rescheduleOptionsSchema,
      wire('bookings_a0f6e21f-c0a2-4532-838f-4a8810067d90_reschedule-options'),
    );
  });
  it('active bookings parse', () => {
    tryParse('activeBookings', bookingListResponseSchema, wire('me_bookings_active'));
  });
  it('booking history parses', () => {
    tryParse('bookingHistory', bookingListResponseSchema, wire('me_bookings'));
  });
  it('addresses parse', () => {
    tryParse('addresses', addressListSchema, wire('me_addresses'));
  });
});
