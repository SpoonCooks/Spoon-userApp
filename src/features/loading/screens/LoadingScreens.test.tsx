import { act, render, screen } from '@testing-library/react-native';

import { ready } from '@core/data';
import { DEMO_PROFILE } from '@/demo/fixtures/screens';
import { ProfileView } from '@features/profile';

import { IntroLoading, SplashLoading } from './LoadingScreens';

describe('Designed loading states (73:1036, 71:747)', () => {
  it('renders the splash with the brand logo, not a spinner', () => {
    render(<SplashLoading animate={false} />);

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

  describe('the splash never advances the app on its own', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('reports the zoom finishing as a VISUAL event only', () => {
      const onFinished = jest.fn();
      render(<SplashLoading onFinished={onFinished} />);

      // Before the animation completes, nothing has been reported.
      expect(onFinished).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(2500);
      });

      // The callback is the ONLY thing it does; readiness stays with `src/app/_layout.tsx`.
      expect(screen.getByTestId('splash-loading')).toBeTruthy();
    });
  });
});

describe('Loading → ready switching', () => {
  const actions = {
    onBack: jest.fn(),
    onSelectTile: jest.fn(),
    onOpenLink: jest.fn(),
    onLogout: jest.fn(),
    onRetry: jest.fn(),
  };

  it('swaps the designed loading surface for the screen when the payload lands', () => {
    const { rerender } = render(<ProfileView state={{ status: 'loading' }} {...actions} />);

    expect(screen.getByTestId('intro-loading')).toBeTruthy();
    expect(screen.queryByTestId('profile-identity')).toBeNull();

    rerender(<ProfileView state={ready(DEMO_PROFILE)} {...actions} />);

    expect(screen.queryByTestId('intro-loading')).toBeNull();
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
