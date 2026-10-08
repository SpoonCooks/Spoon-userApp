import * as firebase from '@react-native-firebase/remote-config';

import { fetchUpdatePolicy } from './remoteConfig';

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

    return expect(fetchUpdatePolicy('android')).resolves.toEqual({
      minimum: '1.2.0',
      latest: null,
      message: null,
    });
  });

  it('reads the iOS parameters for iOS', async () => {
    mockedGetString.mockImplementation((_config, key) =>
      key === 'min_app_version_ios' ? '3.0.0' : '',
    );
    expect((await fetchUpdatePolicy('ios'))?.minimum).toBe('3.0.0');
  });

  it('is null, not a block, when Firebase cannot be reached', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('offline'));
    expect(await fetchUpdatePolicy('ios')).toBeNull();
  });
});
