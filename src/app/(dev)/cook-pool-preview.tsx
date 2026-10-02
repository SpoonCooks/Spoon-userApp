import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CookPoolFlow, resetCookPoolDemo } from '@features/cookPool';
import { RouteScaffold } from '@ui';

/**
 * Cook Pool — DEV PREVIEW, DEVELOPMENT ONLY. `spoon://cook-pool-preview` opens the landing for a
 * new household (`844:5842`); `?pool=1` opens it with two cooks already in the pool (`719:1507`).
 *
 * The real routes (`(app)/cook-pool/*`) sit behind the session guard, which a build with no live
 * backend cannot pass — the same reason `recurring-setup.tsx` sits outside `(app)`.
 */
export default function CookPoolPreviewRoute() {
  const router = useRouter();
  const { pool } = useLocalSearchParams<{ pool?: string }>();
  // Seeds the store once, as the preview opens, before any screen reads it.
  useState(() => resetCookPoolDemo(pool === '1' ? ['demo-pool-sanchita', 'demo-pool-rekha'] : []));

  if (!__DEV__) {
    return (
      <RouteScaffold
        title="Cook Pool preview"
        status="foundation"
        notes={['This preview is available in development builds only']}
      />
    );
  }

  return <CookPoolFlow onExit={() => router.back()} />;
}
