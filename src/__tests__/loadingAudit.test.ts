import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { globSync } from 'glob';

/**
 * THE ONE GLOBAL LOADING SCREEN — task §13 / §25.
 *
 * The founder's rule: there is exactly one full-screen loading surface, it is shown when the APP
 * OPENS, and it appears nowhere else. Home -> Profile, Profile -> Addresses, Home -> Instant,
 * Home -> Schedule, Profile -> Profile details, every address transition, the carousel and every
 * local form selection must use a scoped state instead — a CTA spinner, an inline spinner, or a
 * skeleton shaped like what is coming.
 *
 * ## Why this is a source scan and not a render
 *
 * A render test proves ONE screen behaves. The rule is about the whole app, and its failure mode
 * is additive: someone wires a branded interstitial into a new boundary six months from now and
 * every existing test still passes. What has to be enforced is the INVARIANT — the branded
 * surfaces appear in exactly the places allowed to have them — and that is a property of the
 * source tree. `productionDataPath.test.ts` enforces its rule the same way and for the same
 * reason.
 *
 * ## What was removed to make this pass
 *
 * Six boundaries rendered `IntroLoading` (`71:747`), the branded interstitial: the four address
 * screens, booking history, and Profile. Every one of them sits on a normal navigation, so every
 * one of them made a routine tap look like a second app launch. They now fall through to
 * `LoadingState`'s scoped variants.
 */

const REPO_ROOT = join(__dirname, '..', '..');

/** The two branded, full-viewport surfaces. Neither is a token-layer state. */
const BRANDED = ['SplashLoading', 'IntroLoading'] as const;

/**
 * The ONLY files allowed to render a branded loading surface.
 *
 * `src/app/index.tsx`   — the boot gate. THE one global loading screen: held while the session,
 *                         the profile gate and the address gate resolve, which is the app opening.
 * `src/app/+not-found.tsx` — the same wait, reached by an unrecognised deep link before the
 *                         session has settled. It is a cold start that happens to have a URL.
 * `src/app/(dev)/splash.tsx` — a `__DEV__` review route for the frame itself. Not reachable in a
 *                         release build and not on any customer path.
 * `src/features/loading/**` — where the components are defined and tested.
 */
const ALLOWED = new Set([
  'src/app/index.tsx',
  'src/app/+not-found.tsx',
  'src/app/(dev)/splash.tsx',
]);

function productionSources(): readonly string[] {
  return (
    globSync('src/**/*.{ts,tsx}', { cwd: REPO_ROOT })
      .map((file) => file.split('\\').join('/'))
      .filter((file) => !file.includes('.test.'))
      .filter((file) => !file.startsWith('src/test/'))
      .filter((file) => !file.startsWith('src/__tests__/'))
      // The components' own module. Defining them is not rendering them.
      .filter((file) => !file.startsWith('src/features/loading/'))
  );
}

/** Strips comments so a doc block NAMING a component is not read as using one. */
function code(file: string): string {
  return readFileSync(join(REPO_ROOT, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

describe('the one global loading screen', () => {
  const files = productionSources();

  it('finds the production sources', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(BRANDED)('renders %s only where the app is opening', (component) => {
    const offenders = files.filter(
      (file) => !ALLOWED.has(file) && new RegExp(`<${component}\\b`).test(code(file)),
    );

    expect(offenders).toEqual([]);
  });

  /**
   * The boot gate is the one that MUST have it — an empty allow-list would also pass the test
   * above, and that is the opposite failure: a cold start with no splash at all, flashing whatever
   * the first route renders while the session resolves.
   */
  it('keeps the splash on the boot gate', () => {
    expect(code('src/app/index.tsx')).toContain('<SplashLoading');
  });

  /**
   * `433:2290` is NOT a loading screen in this sense.
   *
   * It is a DESIGNED destination — "Confirmation in progress", the few seconds between a verified
   * payment and a booking the server has confirmed (task §20). It owns the viewport because the
   * frame does, not because something is being fetched behind it, so it is exempt by definition
   * rather than by exception. Asserted so the distinction is deliberate.
   */
  it('treats Page 21 as a screen, not as a loading state', () => {
    const confirming = code('src/app/(app)/booking/confirming.tsx');

    expect(confirming).toContain('<ConfirmationLoading');
    for (const component of BRANDED) {
      expect(confirming).not.toContain(`<${component}`);
    }
  });

  /**
   * Every remaining screen boundary uses a SCOPED state.
   *
   * `loadingFallback` is `QueryBoundary`'s escape hatch for a designed full-viewport surface. With
   * the six branded ones removed, nothing outside the allow-list should be reaching for it at all
   * — a boundary that wants a custom loading surface on a normal navigation is the exact thing
   * this rule forbids.
   */
  it('leaves no screen boundary overriding its loading state', () => {
    const offenders = files.filter((file) => code(file).includes('loadingFallback='));

    expect(offenders).toEqual([]);
  });
});
