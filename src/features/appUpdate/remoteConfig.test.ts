import * as firebase from '@react-native-firebase/remote-config';

import { fetchUpdatePolicy, parameterName } from './remoteConfig';

const mockedGetString = jest.mocked(firebase.getString);
const mockedFetch = jest.mocked(firebase.fetchAndActivate);

describe('fetchUpdatePolicy', () => {
  it('reads the per-platform parameters, treating blanks as unset', () => {
    mockedGetString.mockImplementation((_config, key) => {
      const values: Record<string, string> = {
        min_app_version_android: ' 1.2.0 ',
        latest_app_version_android: '',
        update_message: '',
      };
      return values[key] ?? '';
    });

    return expect(fetchUpdatePolicy('android', 'production')).resolves.toEqual({
      minimum: '1.2.0',
      latest: null,
      message: null,
    });
  });

  it('reads the iOS parameters for iOS', async () => {
    mockedGetString.mockImplementation((_config, key) =>
      key === 'min_app_version_ios' ? '3.0.0' : '',
    );
    expect((await fetchUpdatePolicy('ios', 'production'))?.minimum).toBe('3.0.0');
  });

  it('is null, not a block, when Firebase cannot be reached', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('offline'));
    expect(await fetchUpdatePolicy('ios', 'production')).toBeNull();
  });
});

describe('environment separation', () => {
  it('names production parameters plainly and every other environment with its prefix', () => {
    expect(parameterName('min_app_version_ios', 'production')).toBe('min_app_version_ios');
    expect(parameterName('min_app_version_ios', 'staging')).toBe('staging_min_app_version_ios');
    expect(parameterName('update_message', 'development')).toBe('development_update_message');
  });

  it('never lets a staging build read the production keys, or the reverse', async () => {
    const asked: string[] = [];
    mockedGetString.mockImplementation((_config, key) => {
      asked.push(key);
      return '';
    });

    await fetchUpdatePolicy('ios', 'staging');
    expect(asked.every((key) => key.startsWith('staging_'))).toBe(true);

    asked.length = 0;
    await fetchUpdatePolicy('ios', 'production');
    expect(asked.some((key) => key.startsWith('staging_'))).toBe(false);
    expect(asked).toContain('min_app_version_ios');
  });
});
