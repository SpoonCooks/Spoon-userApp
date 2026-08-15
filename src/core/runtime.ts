import type { QueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { createApiClient } from './api';
import type { ApiClient } from './api';
import { createSessionController, secureTokenStore, unimplementedSessionGateway } from './auth';
import type { SessionController } from './auth';
import { getConfig } from './config';
import type { AppConfig } from './config';
import { getLogger } from './logging';
import type { Logger } from './logging';
import { createQueryClient } from './query';
import { sessionStore } from './store';

/**
 * Composition root. Built once at app start and handed to the providers.
 *
 * Wiring only — no endpoints, no backend shapes, no business rules.
 */

export interface AppRuntime {
  readonly config: AppConfig;
  readonly logger: Logger;
  readonly queryClient: QueryClient;
  readonly api: ApiClient;
  readonly session: SessionController;
}

export function createAppRuntime(): AppRuntime {
  const config = getConfig();
  const logger = getLogger('app');
  const queryClient = createQueryClient();

  const session = createSessionController({
    tokenStore: secureTokenStore,
    // TODO(backend-contract): swap for a real gateway once auth endpoints exist.
    gateway: unimplementedSessionGateway,
    logger: logger.child('session'),
    dispatch: sessionStore.dispatch,
    onSessionCleared: () => {
      // Logout must clear all three: SecureStore (in the controller), the query cache (here)
      // and session status (via the machine). Missing the cache reset leaks the previous
      // user's bookings into the next session.
      queryClient.clear();
    },
  });

  const api = createApiClient({
    baseUrl: config.apiBaseUrl,
    timeoutMs: config.apiTimeoutMs,
    logger: logger.child('api'),
    auth: session,
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    platform: Platform.OS,
  });

  return { config, logger, queryClient, api, session };
}
