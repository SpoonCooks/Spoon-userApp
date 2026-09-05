import { act, render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';
import { DEMO_PROFILE } from '@/demo/fixtures/screens';
import { ProfileView } from '@features/profile';

import { ConfirmationLoading, IntroLoading, SplashLoading } from './LoadingScreens';

describe('Designed loading states (73:1036, 71:747)', () => {
  it('renders the splash with the brand logo, not a spinner', () => {
    render(<SplashLoading />);

    expect(screen.getByTestId('splash-loading')).toBeTruthy();
    expect(screen.queryByLabelText('Loading')).toBeNull();
  });

  it('renders the interstitial headline and artwork', () => {
    render(<IntroLoading />);

    expect(screen.getByTestId('intro-loading')).toBeTruthy();
    expect(screen.getByText('Best cooks in town!')).toBeTruthy();
  });

  it('takes its headline from the caller', () => {
    render(<IntroLoading headline="Finding your cook" />);
    expect(screen.getByText('Finding your cook')).toBeTruthy();
  });

  it('keeps the confirmation mark fixed rather than rotating the supplied artwork', () => {
    render(<ConfirmationLoading />);

    const mark = screen.getByTestId('confirmation-loading-mark');
    expect(mark.props.style).toEqual(expect.objectContaining({ width: 220.66, height: 216.32 }));
    expect(mark.props.style).not.toEqual(expect.objectContaining({ transform: expect.anything() }));
  });

  describe('the splash never advances the app on its own', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('runs no timer at all — `313:3159` is a static frame', () => {
      render(<SplashLoading />);

      expect(jest.getTimerCount()).toBe(0);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Readiness stays with `src/app/_layout.tsx`; the surface just sits there.
      expect(screen.getByTestId('splash-loading')).toBeTruthy();
    });
  });
});

describe('Loading → ready switching', () => {
  const actions = {
    onBack: jest.fn(),
    onSelectTile: jest.fn(),
    onOpenProfileDetails: jest.fn(),
    onOpenLink: jest.fn(),
    onLogout: jest.fn(),
    onRetry: jest.fn(),
  };

  /**
   * THE LOADING RULE (task §13 / §25).
   *
   * `71:747` is a BRANDED full-screen interstitial — logo, headline, hero photograph. Profile used
   * to render it while `GET /v1/me` was in flight, which made every Home -> Profile tap look like
   * a second app launch. The founder's rule is that the one global loading screen belongs to the
   * app OPENING and to nothing else, so this boundary now falls through to the token layer's
   * scoped state.
   */
  it('shows no branded interstitial while a normal screen is loading', () => {
    const { rerender } = render(<ProfileView state={{ status: 'loading' }} {...actions} />);

    expect(screen.queryByTestId('intro-loading')).toBeNull();
    expect(screen.queryByTestId('splash-loading')).toBeNull();
    expect(screen.queryByTestId('profile-identity')).toBeNull();

    rerender(<ProfileView state={ready(DEMO_PROFILE)} {...actions} />);

    expect(screen.getByTestId('profile-identity')).toBeTruthy();
    expect(screen.getByText('Aarav Mehta')).toBeTruthy();
  });

  it('shows the error surface instead of the loading surface on failure', () => {
    render(
      <ProfileView
        state={{ status: 'error', error: { kind: 'server', message: 'boom', status: 500 } }}
        {...actions}
      />,
    );

    expect(screen.queryByTestId('intro-loading')).toBeNull();
  });
});
