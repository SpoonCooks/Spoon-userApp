import {
  fromStatus,
  isAppError,
  normalizeError,
  toNetworkError,
  toTimeoutError,
} from '@core/errors';
import type { Logger } from '@core/logging';

import { CORRELATION_HEADER, createCorrelationId } from './correlation';
import { readErrorEnvelope, unwrapData } from './envelope';
import type { ApiClient, AuthTokenProvider, RequestOptions } from './types';

/**
 * Typed fetch wrapper. Transport mechanism only — no endpoints, no payload shapes.
 * (FRONTEND_FOUNDATION_PLAN.md §5)
 *
 * Responsibilities:
 *  - base URL + timeout via AbortController
 *  - request interceptor: Authorization, platform/version headers, correlation id
 *  - response interceptor: normalize EVERY failure into the error taxonomy
 *  - unwrap the `{ data }` envelope once, centrally, so no feature module sees it
 *  - preserve the backend's `error.code` / `requestId` on every failure
 *  - 401 -> single-flight refresh -> retry once -> terminate session on failure
 */

export interface ApiClientOptions {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly logger: Logger;
  readonly auth: AuthTokenProvider;
  readonly appVersion: string;
  readonly platform: string;
  /** Injectable for tests. */
  readonly fetchImpl?: typeof fetch;
}

interface RawResult {
  readonly status: number;
  readonly ok: boolean;
  readonly data: unknown;
}

function buildUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (text.length === 0) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    // Non-JSON body — hand it back as text rather than throwing inside the transport.
    return text;
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { baseUrl, timeoutMs, logger, auth, appVersion, platform } = options;
  const doFetch = options.fetchImpl ?? fetch;

  async function send<T>(
    path: string,
    requestOptions: RequestOptions<T>,
    accessToken: string | null,
    correlationId: string,
  ): Promise<RawResult> {
    const effectiveTimeout = requestOptions.timeoutMs ?? timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), effectiveTimeout);

    const externalSignal = requestOptions.signal;
    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener('abort', onExternalAbort);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-App-Version': appVersion,
      'X-App-Platform': platform,
      [CORRELATION_HEADER]: correlationId,
      ...requestOptions.headers,
    };

    if (requestOptions.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (accessToken !== null) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    // Serialized BEFORE the try so a body that cannot be encoded is a programming error here
    // rather than something the catch below would misreport as a network failure.
    const encodedBody =
      requestOptions.body === undefined ? undefined : JSON.stringify(requestOptions.body);

    try {
      const response = await doFetch(buildUrl(baseUrl, path), {
        method: requestOptions.method ?? 'GET',
        headers,
        signal: controller.signal,
        ...(encodedBody === undefined ? {} : { body: encodedBody }),
      });

      return { status: response.status, ok: response.ok, data: await readBody(response) };
    } catch (cause) {
      if (controller.signal.aborted && externalSignal?.aborted !== true) {
        throw toTimeoutError(effectiveTimeout, correlationId);
      }
      // Anything already carrying the taxonomy passes through unchanged.
      if (isAppError(cause)) throw cause;
      // `fetch` rejected and nothing aborted it, so the request produced NO response. That is
      // the network kind by definition, and classifying it structurally is what keeps React
      // Native's `Error` from being misread as `unknown` — see `toNetworkError`.
      throw toNetworkError(cause, correlationId);
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  async function request<T>(path: string, requestOptions: RequestOptions<T>): Promise<T> {
    const correlationId = createCorrelationId();
    const useAuth = requestOptions.authenticated ?? true;

    const token = useAuth ? await auth.getAccessToken() : null;
    let result = await send(path, requestOptions, token, correlationId);

    if (result.status === 401 && useAuth) {
      logger.info('Access token rejected, attempting refresh', { correlationId });
      const refreshed = await auth.refreshAccessToken();

      if (refreshed === null) {
        auth.onSessionExpired();
        throw fromStatus(401, {
          message: 'Session expired',
          correlationId,
          code: 'UNAUTHENTICATED',
        });
      }

      result = await send(path, requestOptions, refreshed, correlationId);

      if (result.status === 401) {
        auth.onSessionExpired();
        throw fromStatus(401, {
          message: 'Session expired after refresh',
          correlationId,
          code: 'UNAUTHENTICATED',
        });
      }
    }

    if (!result.ok) {
      // The backend answers every failure with `{ error: { code, message, requestId, details } }`.
      // Carrying the code through is what lets a screen distinguish
      // ADDRESS_NOT_SERVICEABLE from SLOT_UNAVAILABLE — both plain 4xx to the transport.
      const envelope = readErrorEnvelope(result.data);
      const error = fromStatus(result.status, {
        correlationId,
        ...(envelope === null
          ? {}
          : {
              code: envelope.code,
              ...(envelope.message === undefined ? {} : { message: envelope.message }),
              ...(envelope.requestId === undefined ? {} : { requestId: envelope.requestId }),
              ...(envelope.details === undefined ? {} : { details: envelope.details }),
            }),
      });
      logger.warn('Request failed', {
        path,
        status: result.status,
        correlationId,
        ...(envelope === null ? {} : { code: envelope.code, requestId: envelope.requestId }),
      });
      throw error;
    }

    try {
      // 204 and other empty bodies never carry an envelope; `expectNoContent` handles them.
      return requestOptions.parse(result.data === undefined ? undefined : unwrapData(result.data));
    } catch (cause) {
      logger.error('Response failed boundary validation', { path, correlationId });
      throw normalizeError(cause, correlationId);
    }
  }

  return { request };
}
