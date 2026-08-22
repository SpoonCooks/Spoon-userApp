import { useMemo } from 'react';

import { useMe } from '@features/auth';
import { ready } from '@core/data';
import type { ScreenQuery } from '@core/data';

import { profileFromMe } from './adapters';
import { DEMO_PROFILE } from '@/demo/fixtures/screens';
import type { ProfileViewModel } from './types';

/**
 * Profile data — `GET /v1/me`.
 *
 * `DEMO_PROFILE` is no longer the data source; it is the STATIC SCREEN DEFINITION. The tile grid,
 * the legal row, the title and the logout label have no endpoint behind them and never will —
 * they are navigation and copy. Only the IDENTITY comes from the server.
 *
 * The distinction matters for the production-fixture rule: nothing here routes through
 * `useDevFixture`, so a release build renders real identity or a real error, never sample data
 * and never a permanent spinner.
 */

/** Static copy shown before the customer has given a name. Not backend data. */
const NAME_PLACEHOLDER = 'Add your name';

export function useProfileData(): ScreenQuery<ProfileViewModel> {
  const me = useMe();

  const state = useMemo(() => {
    if (me.state.status !== 'ready') return me.state;
    return ready(
      profileFromMe({
        base: DEMO_PROFILE,
        me: me.state.data,
        namePlaceholder: NAME_PLACEHOLDER,
      }),
    );
  }, [me.state]);

  return { state, refetch: me.refetch };
}
