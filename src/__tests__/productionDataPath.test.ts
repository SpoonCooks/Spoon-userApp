import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { globSync } from 'glob';

/**
 * The production data path must not depend on dev fixtures.
 *
 * §27 asks for two guarantees, and only one of them can be checked by rendering:
 *
 *  1. a release build must never render sample data;
 *  2. a release build must never get STUCK, which is what `useDevFixture` does outside `__DEV__`
 *     — it reports `loading` forever.
 *
 * The second is invisible in a test run (Jest sets `__DEV__` true), so it is enforced
 * structurally instead: no feature `data.ts` that a production screen reads may import
 * `useDevFixture`. This test is the enforcement.
 *
 * Fixtures themselves are deliberately NOT deleted — they remain the fastest way to review a
 * hard-to-reach lifecycle state, and the showcase and tests still use them. What is forbidden is
 * a fixture standing in the way of real data.
 */

const REPO_ROOT = join(__dirname, '..', '..');

/**
 * Data seams still awaiting a backend capability.
 *
 * Each entry is a screen whose data has NO endpoint behind it yet, so `useDevFixture` remains the
 * honest source: it renders the designed screen in development and refuses to invent content in a
 * release build. Every one is recorded as a gap in `docs/BACKEND_INTEGRATION_MAP.md`.
 */
const ALLOWED_PENDING = new Set([
  // The meal brief: no endpoint persists a draft, and the catalogue publishes only its BOUNDS
  // (guest count, diet axis). PRODUCT_DECISION_PENDING on where a brief is stored.
  'src/features/mealBrief/data.ts',
]);

describe('production data path', () => {
  const dataFiles = globSync('src/features/*/data.ts', { cwd: REPO_ROOT }).map((file) =>
    file.split('\\').join('/'),
  );

  it('finds the feature data seams', () => {
    expect(dataFiles.length).toBeGreaterThan(0);
  });

  it.each(dataFiles)('%s does not depend on useDevFixture', (relativePath) => {
    const source = readFileSync(join(REPO_ROOT, relativePath), 'utf8');
    // The IMPORT, not the word: several wired seams still explain in prose why they no longer
    // use the fixture path, and matching prose would fail them for saying so.
    const usesFixtureSeam = /import\s*\{[^}]*\buseDevFixture\b[^}]*\}/.test(source);

    if (ALLOWED_PENDING.has(relativePath)) {
      // Pending seams are allowed, but must stay declared here so the list is auditable.
      expect(usesFixtureSeam).toBe(true);
      return;
    }

    expect(usesFixtureSeam).toBe(false);
  });
});
