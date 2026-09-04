import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

/**
 * `pod install` refuses to finish while Firebase resolves through SPM under static linkage.
 *
 *     [!] [react-native-firebase] SPM + static linkage is not supported (target(s): Pods-Spoon).
 *
 * firebase-ios-sdk's Swift Package products are automatic libraries, so every react-native-firebase
 * pod links its own copy and they collide as duplicate symbols. The library's own escape hatch is
 * `$RNFirebaseDisableSPM = true`, and `rnfirebase_spm_disabled?` tests the VALUE rather than mere
 * definedness -- so the flag has to read exactly `true`, and it has to be assigned BEFORE the
 * target block that reads it.
 *
 * iOS prebuild cannot run on Windows, so these drive the plugin's transformation directly against
 * a Podfile shaped like the one prebuild writes. That is the part worth testing anyway: where the
 * line lands, and that a second prebuild does not stack another copy.
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
  use_frameworks! :linkage => :static
end
`;

function runPlugin(podfileContents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'podfile-'));
  writeFileSync(join(dir, 'Podfile'), podfileContents);

  let captured: any = null;
  jest.isolateModules(() => {
    jest.doMock('expo/config-plugins', () => ({
      withDangerousMod: (config: unknown, [, action]: [string, (c: any) => any]) => {
        captured = action({ modRequest: { platformProjectRoot: dir } });
        return config;
      },
    }));
    const plugin = require('../../plugins/withFirebaseCocoaPods.js');
    plugin({});
  });
  expect(captured).not.toBeNull();
  return readFileSync(join(dir, 'Podfile'), 'utf8');
}

describe('the Firebase CocoaPods plugin', () => {
  it('sets the flag to exactly true', () => {
    expect(runPlugin(PODFILE)).toContain('$RNFirebaseDisableSPM = true');
  });

  /*
   * Order is the whole point. A global assigned after the block that reads it is the same as not
   * assigning it, and the build fails identically -- which is a very expensive way to learn that
   * the line was present but late.
   */
  it('puts it before the target block that reads it', () => {
    const out = runPlugin(PODFILE);

    expect(out.indexOf('$RNFirebaseDisableSPM')).toBeLessThan(out.indexOf("target 'Spoon'"));
  });

  it('leaves the rest of the Podfile alone', () => {
    const out = runPlugin(PODFILE);

    expect(out).toContain('use_frameworks! :linkage => :static');
    expect(out).toContain('prepare_react_native_project!');
    expect(out).toContain('use_expo_modules!');
  });

  /* Prebuild can run repeatedly over one ios/ directory; the flag must not stack. */
  it('does not add a second copy when run again', () => {
    const once = runPlugin(PODFILE);
    const twice = runPlugin(once);

    expect(twice.match(/\$RNFirebaseDisableSPM/g)).toHaveLength(1);
  });

  /*
   * A Podfile with no target block means the anchor is gone -- a template change, most likely.
   * Failing loudly at prebuild beats appending the flag somewhere harmless and discovering at
   * `pod install` that it never took effect.
   */
  it('refuses a Podfile it cannot anchor to', () => {
    expect(() => runPlugin('# no target block here\n')).toThrow(/no target block/);
  });
});
