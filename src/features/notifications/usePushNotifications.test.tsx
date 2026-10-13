import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { RuntimeProvider } from '@core/runtimeContext';
import { useSessionStore } from '@core/store';
import { createStubApi, createTestRuntime } from '@/test/renderWithRuntime';

import { usePushNotifications } from './usePushNotifications';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

/**
 * Registration used to close after the first ATTEMPT rather than the first token.
 *
 * A customer who had not granted the OS permission at sign-in produced no token, the attempt was
 * marked done, and the app never asked again for the life of the install — so turning
 * notifications on in system Settings, the one thing support would tell them to do, changed
 * nothing. Confirmed against a real device: permission denied, zero tokens in the backend's
 * table, and nothing in any log to say so.
 */
describe('usePushNotifications — registers when it becomes possible, not only at sign-in', () => {
  const notifications = jest.mocked(Notifications);

  /** The hook's own foreground subscribers, captured so a test can foreground the app. */
  let foregrounded: ((status: string) => void)[] = [];

  const foreground = async () => {
    await act(async () => {
      foregrounded.forEach((listener) => listener('active'));
    });
  };

  function mount(handlers: Parameters<typeof createStubApi>[0]) {
    const runtime = createTestRuntime({ api: createStubApi(handlers) });

    function Probe() {
      usePushNotifications();
      return null;
    }

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={runtime.queryClient}>
          <RuntimeProvider runtime={runtime}>{children}</RuntimeProvider>
        </QueryClientProvider>
      );
    }

    return render(<Probe />, { wrapper: Wrapper });
  }

  /*
   * A registration settles a beat after its PUT (the token is stored afterwards), and React
   * Query batches that update on a timer: let it land inside act before the next test mounts.
   */
  afterEach(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  beforeEach(() => {
    (SecureStore as unknown as { __reset(): void }).__reset();
    foregrounded = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      handler: (status: string) => void,
    ) => {
      foregrounded.push(handler);
      return { remove: jest.fn() };
    }) as never);

    useSessionStore.setState({ status: 'authenticated' });
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as never);
    notifications.getDevicePushTokenAsync.mockResolvedValue({
      type: 'android',
      data: 'fcm-token-value',
    } as never);
  });

  it('registers on the next foreground once the customer grants the permission in Settings', async () => {
    const registered: unknown[] = [];
    mount({
      'PUT /v1/me/push-token': (body) => {
        registered.push(body);
        return {};
      },
    });

    // Sign-in with the permission denied: nothing is sent, and nothing is fabricated.
    await waitFor(() => expect(notifications.getPermissionsAsync).toHaveBeenCalled());
    expect(registered).toHaveLength(0);

    // The customer leaves for Settings, grants it, and comes back.
    notifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    await foreground();

    await waitFor(() => expect(registered).toHaveLength(1));
    /*
     * The platform is the one the app is actually running on, never a guess -- and so is the token
     * SOURCE: on iOS that is Firebase, because the APNs token `expo-notifications` returns is one
     * the backend's FCM-only send path cannot address.
     */
    expect(registered[0]).toEqual({
      token: Platform.OS === 'ios' ? 'fcm-ios-token' : 'fcm-token-value',
      platform: Platform.OS,
      notificationsEnabled: true,
    });
  });

  it('does not register a second time once a token has reached the backend', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    const registered: unknown[] = [];
    mount({
      'PUT /v1/me/push-token': (body) => {
        registered.push(body);
        return {};
      },
    });

    await waitFor(() => expect(registered).toHaveLength(1));

    await foreground();
    await foreground();

    // Foregrounding is not a reason to re-register a token the backend already holds.
    expect(registered).toHaveLength(1);
  });

  /**
   * The backend sends the "Spoon is now live in your area" notice by SMS instead of a silent push
   * when the phone has notifications off — which it can only know if the app keeps saying so,
   * including after the customer switches them off and the provider stops producing a token.
   */
  describe('tells the server whether notifications are on', () => {
    const TOKEN = Platform.OS === 'ios' ? 'fcm-ios-token' : 'fcm-token-value';
    const granted = { granted: true, status: 'granted' } as never;
    const denied = { granted: false, status: 'denied', canAskAgain: false } as never;

    function mountRecording() {
      const registered: unknown[] = [];
      mount({
        'PUT /v1/me/push-token': (body) => {
          registered.push(body);
          return {};
        },
      });
      return registered;
    }

    it('sends notificationsEnabled: true when the permission is granted', async () => {
      notifications.getPermissionsAsync.mockResolvedValue(granted);

      const registered = mountRecording();

      await waitFor(() => expect(registered).toHaveLength(1));
      expect(registered[0]).toEqual({
        token: TOKEN,
        platform: Platform.OS,
        notificationsEnabled: true,
      });
    });

    it('re-sends a token registered on an earlier launch with false once notifications are off', async () => {
      // An earlier launch registered this token; since then the customer switched notifications
      // off in Settings with the app closed.
      await SecureStore.setItemAsync('spoon.notifications.lastPushToken', 'earlier-token');
      notifications.getPermissionsAsync.mockResolvedValue(denied);

      const registered = mountRecording();

      await waitFor(() => expect(registered).toHaveLength(1));
      expect(registered[0]).toEqual({
        token: 'earlier-token',
        platform: Platform.OS,
        notificationsEnabled: false,
      });
      // Read, never requested: switching notifications off must not earn a prompt.
      expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('sends nothing when notifications are off and no token was ever registered', async () => {
      notifications.getPermissionsAsync.mockResolvedValue(denied);

      const registered = mountRecording();

      await waitFor(() => expect(notifications.getPermissionsAsync).toHaveBeenCalled());
      await foreground();
      expect(registered).toHaveLength(0);
    });

    it('re-sends on the next foreground whenever the flag changes', async () => {
      notifications.getPermissionsAsync.mockResolvedValue(granted);
      const registered = mountRecording();
      await waitFor(() => expect(registered).toHaveLength(1));

      // Switched off in Settings: the same token, now marked disabled.
      notifications.getPermissionsAsync.mockResolvedValue(denied);
      await foreground();
      await waitFor(() => expect(registered).toHaveLength(2));
      expect(registered[1]).toEqual({
        token: TOKEN,
        platform: Platform.OS,
        notificationsEnabled: false,
      });

      // And back on.
      notifications.getPermissionsAsync.mockResolvedValue(granted);
      await foreground();
      await waitFor(() => expect(registered).toHaveLength(3));
      expect(registered[2]).toEqual({
        token: TOKEN,
        platform: Platform.OS,
        notificationsEnabled: true,
      });
    });

    it('does not re-send while the token and the flag are unchanged', async () => {
      await SecureStore.setItemAsync('spoon.notifications.lastPushToken', 'earlier-token');
      notifications.getPermissionsAsync.mockResolvedValue(denied);
      const registered = mountRecording();
      await waitFor(() => expect(registered).toHaveLength(1));

      await foreground();
      await foreground();

      expect(registered).toHaveLength(1);
    });

    it('remembers the registered token for the next launch', async () => {
      notifications.getPermissionsAsync.mockResolvedValue(granted);
      const registered = mountRecording();
      await waitFor(() => expect(registered).toHaveLength(1));

      await waitFor(async () =>
        expect(await SecureStore.getItemAsync('spoon.notifications.lastPushToken')).toBe(TOKEN),
      );
    });
  });
});
