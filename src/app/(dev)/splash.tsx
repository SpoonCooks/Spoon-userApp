import { SplashLoading } from '@features/loading';
import { RouteScaffold } from '@ui';

/**
 * The Login loading page — DEVELOPMENT ONLY. Reachable at `spoon://splash`.
 *
 * `73:1036` renders in the product only while `src/app/index.tsx` is resolving the session, which
 * on a warm device is a handful of frames — too short to capture, and therefore the one finalized
 * Login state that could never be compared against its frame on hardware.
 *
 * This route is the review path and nothing more. It invents no product entry point, changes no
 * navigation, and refuses to render outside `__DEV__`.
 */
export default function SplashDevRoute() {
  if (!__DEV__) {
    return <RouteScaffold title="Not available" status="blocked" />;
  }

  return <SplashLoading />;
}
