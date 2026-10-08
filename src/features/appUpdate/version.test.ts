import { compareVersions, decideUpdate, parseVersion } from './version';

describe('parseVersion', () => {
  it('reads full and short versions', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersion('2')).toEqual([2, 0, 0]);
    expect(parseVersion(' 1.4 ')).toEqual([1, 4, 0]);
  });

  it('refuses anything it cannot read, rather than guessing', () => {
    for (const bad of ['', '1.x', 'v1.0.0', '1.0.0-beta', null, undefined]) {
      expect(parseVersion(bad)).toBeNull();
    }
  });
});

describe('compareVersions', () => {
  it('orders numerically, not as text', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.0.9', '1.0.10')).toBeLessThan(0);
    expect(compareVersions('2', '2.0.0')).toBe(0);
  });

  it('is null when either side is unreadable', () => {
    expect(compareVersions('1.0.0', 'nope')).toBeNull();
  });
});

describe('decideUpdate', () => {
  const installed = '1.0.0';

  it('requires an update when below the minimum, even if the latest is also higher', () => {
    expect(decideUpdate({ installed, minimum: '1.1.0', latest: '1.2.0' })).toBe('required');
  });

  it('offers an update when only the latest is higher', () => {
    expect(decideUpdate({ installed, minimum: '1.0.0', latest: '1.1.0' })).toBe('optional');
  });

  it('asks for nothing at or above both', () => {
    expect(decideUpdate({ installed, minimum: '1.0.0', latest: '1.0.0' })).toBe('none');
    expect(decideUpdate({ installed: '2.0.0', minimum: '1.0.0', latest: '1.5.0' })).toBe('none');
  });

  it('asks for nothing while the console parameters are unset or the defaults', () => {
    expect(decideUpdate({ installed, minimum: null, latest: null })).toBe('none');
    expect(decideUpdate({ installed, minimum: '0.0.0', latest: '0.0.0' })).toBe('none');
  });

  it('fails open on a value that is not a version', () => {
    expect(decideUpdate({ installed, minimum: '1.x', latest: 'soon' })).toBe('none');
    expect(decideUpdate({ installed: 'dev', minimum: '9.0.0', latest: null })).toBe('none');
  });
});
