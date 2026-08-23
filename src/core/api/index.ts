export { createApiClient } from './client';
export type { ApiClientOptions } from './client';
export { CORRELATION_HEADER, createCorrelationId } from './correlation';
export { BACKEND_ERROR_CODES, isKnownErrorCode, readErrorEnvelope, unwrapData } from './envelope';
export type { BackendErrorCode } from './envelope';
export {
  IDEMPOTENCY_HEADER,
  createIdempotencyKey,
  createIdempotencyScope,
  idempotency,
  idempotencyHeader,
} from './idempotency';
export type { IdempotencyScope } from './idempotency';
export { expectNoContent, passthrough } from './types';
export type {
  ApiClient,
  AuthTokenProvider,
  HttpMethod,
  JsonValue,
  RequestOptions,
  ResponseParser,
} from './types';
