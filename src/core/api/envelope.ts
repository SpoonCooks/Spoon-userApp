import { z } from 'zod';

/**
 * The backend's transport envelope, and the canonical error vocabulary it speaks.
 *
 * Every Spoon response is one of exactly two shapes (`docs/09_ERROR_HANDLING.md`):
 *
 *   success   `{ "data": ... }`
 *   failure   `{ "error": { "code", "message", "requestId", "details" } }`
 *
 * Unwrapping happens ONCE, in the transport, so no feature module ever writes `.data.data`, and
 * so a body that is neither shape is rejected at the boundary rather than reaching a screen as
 * `undefined`.
 */

/**
 * The complete public error vocabulary, transcribed from the backend's
 * `src/shared/errors/error-codes.ts`.
 *
 * It is duplicated deliberately: this is a CONTRACT, and a contract the client cannot read at
 * build time has to be restated somewhere. Restating it here — once, in one file, as data —
 * is what lets `ADDRESS_NOT_SERVICEABLE` select a designed screen instead of being flattened
 * into "something went wrong". `isKnownErrorCode` keeps an unrecognised code from throwing, so
 * a backend that adds one degrades safely instead of crashing the app.
 */
export const BACKEND_ERROR_CODES = [
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'RESOURCE_NOT_FOUND',
  'ADDRESS_NOT_SERVICEABLE',
  'SLOT_UNAVAILABLE',
  'NO_ELIGIBLE_COOK',
  'INVALID_BOOKING_STATE',
  'ACTIVE_ASSIGNMENT_CHANGED',
  'INVALID_SERVICE_OTP',
  'PAYMENT_NOT_VERIFIED',
  'PAYMENT_AMOUNT_MISMATCH',
  'REFUND_ALREADY_REQUESTED',
  'REFUND_NOT_ALLOWED',
  'EXTENSION_CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'RATE_LIMITED',
  'PROVIDER_TEMPORARILY_UNAVAILABLE',
  'DEPENDENCY_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type BackendErrorCode = (typeof BACKEND_ERROR_CODES)[number];

const KNOWN_CODES: ReadonlySet<string> = new Set(BACKEND_ERROR_CODES);

export function isKnownErrorCode(value: string): value is BackendErrorCode {
  return KNOWN_CODES.has(value);
}

/**
 * The error body.
 *
 * `code` is NOT narrowed to `BackendErrorCode` here on purpose. A response carrying a code this
 * build has never heard of is still a well-formed error response, and treating it as a malformed
 * body would turn "the server added a code" into "the app is broken".
 */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().optional(),
    requestId: z.string().optional(),
    details: z
      .object({
        reason: z.string().min(1).optional(),
      })
      .optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

/** Reads the error envelope out of an arbitrary parsed body, or null when it is not one. */
export function readErrorEnvelope(body: unknown): ErrorEnvelope['error'] | null {
  const result = errorEnvelopeSchema.safeParse(body);
  return result.success ? result.data.error : null;
}

/**
 * Unwraps `{ data }`.
 *
 * A success body that is not enveloped is a contract violation and throws, because the
 * alternative — passing the raw body through — silently changes every downstream parser's input
 * shape the first time a route forgets `jsonData()`.
 *
 * `data: null` is legitimate (the catalogue publishes a null `extension`), so presence of the
 * KEY is what is checked, never truthiness of the value.
 */
export function unwrapData(body: unknown): unknown {
  if (typeof body === 'object' && body !== null && 'data' in body) {
    return (body as { data: unknown }).data;
  }
  throw new Error('Response body is not a Spoon data envelope');
}
