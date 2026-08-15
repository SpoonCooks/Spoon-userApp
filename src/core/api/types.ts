/**
 * Transport types only.
 *
 * There are deliberately NO endpoint paths, payload shapes, status enums or response envelopes
 * in this layer. No backend contract exists yet.
 * TODO(backend-contract): generated types land in this directory (openapi-typescript), and
 * response validation moves to zod schemas at that point. See FRONTEND_FOUNDATION_PLAN.md §5.
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Boundary parser. Required on every request so unvalidated server data cannot enter the app.
 * Today this is a hand-written narrowing function; it becomes `schema.parse` when a contract exists.
 */
export type ResponseParser<T> = (data: unknown) => T;

export interface RequestOptions<T> {
  readonly method?: HttpMethod;
  readonly body?: JsonValue;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly parse: ResponseParser<T>;
  /** Set false for endpoints that must not carry a token. Defaults to true. */
  readonly authenticated?: boolean;
}

export interface ApiClient {
  request<T>(path: string, options: RequestOptions<T>): Promise<T>;
}

/**
 * Supplies credentials to the transport. Implemented in `core/auth`; the transport itself never
 * reads storage.
 */
export interface AuthTokenProvider {
  getAccessToken(): Promise<string | null>;
  /** Single-flight refresh. Resolves with a new access token, or null when refresh failed. */
  refreshAccessToken(): Promise<string | null>;
  /** Called when the session is unrecoverable — clears session state app-wide. */
  onSessionExpired(): void;
}

/** Passing `unknown` through unchanged. Use only where a body is genuinely ignored. */
export const passthrough: ResponseParser<unknown> = (data) => data;

/** For 204 / empty-body responses. */
export const expectNoContent: ResponseParser<void> = () => undefined;
