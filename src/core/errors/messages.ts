import type { AppError, AppErrorKind } from './types';

/**
 * User-facing message mapping.
 *
 * Two layers, and the order matters:
 *
 *  1. the backend's `error.code`, which is the specific, actionable answer. A customer whose
 *     address is outside the service area needs to be told THAT, not "something went wrong" —
 *     and the code is the only thing that distinguishes it from a slot that just got taken.
 *  2. the transport `kind`, as the fallback for a code this build has never seen, and for
 *     failures that never reached the server at all.
 *
 * FIGMA_PENDING: error copy and error-state layouts are still undesigned
 * (docs/FIGMA_FINAL_BLOCKERS.md). The strings below are neutral placeholders and are expected to
 * be replaced wholesale once copy lands. The MAPPING is the part that is not placeholder: which
 * code selects which message is contract-driven and stays.
 */

const KIND_COPY: Record<AppErrorKind, string> = {
  network: 'No internet connection. Check your network and try again.',
  timeout: 'That took too long. Please try again.',
  auth: 'Your session has expired. Please sign in again.',
  validation: 'Something in that request was not accepted. Please check and try again.',
  server: 'Something went wrong on our side. Please try again shortly.',
  unknown: 'Something went wrong. Please try again.',
};

/**
 * Copy per backend error code.
 *
 * Only codes a CUSTOMER can actually provoke are listed. The cook and admin codes share the
 * vocabulary but never reach this app, and inventing copy for them would be dead text.
 */
const CODE_COPY: Readonly<Record<string, string>> = {
  INVALID_REQUEST: 'Please check the details and try again.',
  UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have access to that.',
  RESOURCE_NOT_FOUND: 'We could not find that any more.',
  ADDRESS_NOT_SERVICEABLE: 'We are not serving this address yet.',
  SLOT_UNAVAILABLE: 'That time was just taken. Please pick another.',
  NO_ELIGIBLE_COOK: 'No cook is available for that time right now.',
  INVALID_BOOKING_STATE: 'This booking has moved on. Refresh to see the latest.',
  ACTIVE_ASSIGNMENT_CHANGED: 'Your cook assignment changed. Refresh to see the latest.',
  INVALID_SERVICE_OTP: 'That code is not correct.',
  PAYMENT_NOT_VERIFIED: 'We are still confirming your payment.',
  PAYMENT_AMOUNT_MISMATCH: 'The payment amount did not match. Nothing was charged.',
  REFUND_ALREADY_REQUESTED: 'A refund is already on its way.',
  REFUND_NOT_ALLOWED: 'This booking is not eligible for a refund.',
  EXTENSION_CONFLICT: 'That extension is no longer available.',
  IDEMPOTENCY_CONFLICT: 'That request is still going through. Give it a moment.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  PROVIDER_TEMPORARILY_UNAVAILABLE: 'That service is briefly unavailable. Please try again.',
  DEPENDENCY_UNAVAILABLE: 'We are having trouble right now. Please try again shortly.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again shortly.',
};

const BOUNDED_REASON_COPY: Readonly<Record<string, string>> = {
  CUSTOMER_BOOKING_OVERLAP: 'You already have another booking at that time. Pick another slot.',
  NO_ELIGIBLE_COOK: 'No cook is available for that time right now.',
  SOCIETY_NOT_SUPPORTED: 'Spoon is not live in this society yet.',
};

export function getUserMessage(error: AppError): string {
  if (error.code === 'SLOT_UNAVAILABLE' && error.details?.reason !== undefined) {
    const reasonCopy = BOUNDED_REASON_COPY[error.details.reason];
    if (reasonCopy !== undefined) return reasonCopy;
  }
  if (error.code !== undefined) {
    const specific = CODE_COPY[error.code];
    if (specific !== undefined) return specific;
  }
  return KIND_COPY[error.kind];
}

/** True when the failure is the server saying "slow down", which screens surface differently. */
export function isRateLimited(error: AppError): boolean {
  return error.code === 'RATE_LIMITED';
}
