import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

/**
 * `pod install` stops before it can integrate the Firebase pods:
 *
 *     [!] The following Swift pods cannot yet be integrated as static libraries:
 *     The Swift pod `FirebaseCoreInternal` depends upon `GoogleUtilities`, which does not
 *     define modules.
 *
 * Pods link here as static LIBRARIES, which carry no module map, and Swift can only import what
 * it can see as a module. `use_modular_headers!` makes CocoaPods generate those maps.
 *
 * It is a target-definition setting, so WHERE it lands decides whether it does anything at all --
 * declared after the block it is meant to affect, the build fails identically with the line
 * sitting visibly in the file. iOS pods cannot be resolved on Windows (`expo prebuild
 * --platform ios` refuses), so placement is what these can check, and placement is the part that
 * silently does nothing when it is wrong.
 */

const PODFILE = `require File.join(File.dirname(\`node --print "require.resolve('expo/package.json')"\`), "scripts/autolinking")
require File.join(File.dirname(\`node --print "require.resolve('react-native/package.json')"\`), "scripts/react_native_pods")

require 'json'
podfile_properties = JSON.parse(File.read(File.join(__dir__, 'Podfile.properties.json'))) rescue {}

platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'
install! 'cocoapods', :deterministic_uuids => false

prepare_react_native_project!

target 'Spoon' do
  use_expo_modules!
  config = use_native_modules!
end
`;

function runPlugin(podfileContents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'podfile-headers-'));
  writeFileSync(join(dir, 'Podfile'), podfileContents);

  let ran = false;
  jest.isolateModules(() => {
    jest.doMock('expo/config-plugins', () => ({
      withDangerousMod: (config: unknown, [, action]: [string, (c: any) => any]) => {
        action({ modRequest: { platformProjectRoot: dir } });
        ran = true;
        return config;
      },
    }));
    const plugin = require('../../plugins/withPodModularHeaders.js');
    plugin({});
  });
  expect(ran).toBe(true);
  return readFileSync(join(dir, 'Podfile'), 'utf8');
}

describe('the modular headers plugin', () => {
  it('declares use_modular_headers!', () => {
    expect(runPlugin(PODFILE)).toContain('use_modular_headers!');
  });

  /*
   * A target-definition setting applies to the definition it sits in. After the target block it
   * is not merely late, it is scoped to nothing -- and the failure is identical to not having
   * added it, which is the expensive way to discover a one-line placement bug.
   */
  it('places it before the target block it must apply to', () => {
    const out = runPlugin(PODFILE);

    expect(out.indexOf('use_modular_headers!')).toBeLessThan(out.indexOf("target 'Spoon'"));
  });

  it('leaves the rest of the Podfile intact', () => {
    const out = runPlugin(PODFILE);

    expect(out).toContain('prepare_react_native_project!');
    expect(out).toContain('use_expo_modules!');
    expect(out).toContain('use_native_modules!');
  });

  it('does not stack a second copy when prebuild runs again', () => {
    const twice = runPlugin(runPlugin(PODFILE));

    expect(twice.match(/use_modular_headers!/g)).toHaveLength(1);
  });

  /*
   * If the anchor disappears from Expo's template, failing at prebuild beats appending the line
   * somewhere harmless and learning at `pod install` that it never took effect.
   */
  it('refuses a Podfile it cannot anchor to', () => {
    expect(() => runPlugin('# no target block here\n')).toThrow(/no target block/);
  });
});
