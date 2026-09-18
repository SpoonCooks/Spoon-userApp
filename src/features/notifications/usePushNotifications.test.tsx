import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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

  beforeEach(() => {
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
});
