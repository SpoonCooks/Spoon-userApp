import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { DEMO_HOME_PRE_BOOKING } from '@/demo/fixtures/home';
import { HomeTopBanner } from './HomeTopBanner';

function paddingTopFor(topInset: number): unknown {
  render(
    <HomeTopBanner
      header={DEMO_HOME_PRE_BOOKING.header}
      onPressAddress={jest.fn()}
      onPressProfile={jest.fn()}
      topInset={topInset}
    />,
  );
  return StyleSheet.flatten(screen.getByTestId('home-header').props.style).paddingTop;
}

describe('Home header spacing below the status bar', () => {
  it('keeps a 12pt gap under the status bar instead of sitting flush against it', () => {
    expect(paddingTopFor(30)).toBe(42);
  });

  it('keeps the design 22pt where there is no status bar inset', () => {
    expect(paddingTopFor(0)).toBe(22);
  });
});
