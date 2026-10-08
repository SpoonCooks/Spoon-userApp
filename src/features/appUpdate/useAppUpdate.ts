import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { getConfig } from '@core/config';
import { getLogger } from '@core/logging';

import { fetchUpdatePolicy } from './remoteConfig';
import type { UpdatePolicy } from './remoteConfig';
import { decideUpdate } from './version';
import type { UpdateRequirement } from './version';

/**
 * Whether this build must, or may, be updated — asked at launch and again whenever the app comes
 * back to the foreground, so a customer who leaves it open for days still meets a newly published
 * requirement.
 *
 * Fails open: if Remote Config cannot be reached the last answer stands, and with no answer yet
 * the result is `none`. A Firebase outage must never lock the customer out.
 */

export interface AppUpdateState {
  readonly requirement: UpdateRequirement;
  readonly message: string | null;
  /** Hides the OPTIONAL prompt for this session. A mandatory update cannot be dismissed. */
  readonly dismiss: () => void;
}

const logger = getLogger('appUpdate');

export function useAppUpdate(): AppUpdateState {
  const [policy, setPolicy] = useState<UpdatePolicy | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    inFlight.current = true;
    try {
      const next = await fetchUpdatePolicy(Platform.OS, getConfig().appEnv);
      if (next === null) {
        logger.warn('Update policy unavailable; keeping the last answer');
        return;
      }
      setPolicy(next);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const installed = Constants.expoConfig?.version ?? '0.0.0';
  const requirement =
    policy === null
      ? 'none'
      : decideUpdate({ installed, minimum: policy.minimum, latest: policy.latest });

  return {
    requirement: requirement === 'optional' && dismissed ? 'none' : requirement,
    message: policy?.message ?? null,
    dismiss: () => setDismissed(true),
  };
}
