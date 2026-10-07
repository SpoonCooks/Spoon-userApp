import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithRuntime } from '@/test/renderWithRuntime';

import { CALENDAR_DEMO_DATES } from '../data/calendar';
import { RecurringLiveScreen } from './RecurringLiveScreen';

/** `1006:527` — a today / upcoming date's pop-up ends on "Close", which only dismisses it. */
describe('RecurringLiveScreen date pop-up', () => {
  it('closes from its Close pill', () => {
    renderWithRuntime(
      <RecurringLiveScreen onBack={jest.fn()} initialSelectedDate={CALENDAR_DEMO_DATES.today} />,
    );
    fireEvent(screen.getByTestId('recurring-live-screen-calendar'), 'layout', {
      nativeEvent: { layout: { x: 16, y: 300, width: 370, height: 255 } },
    });
    fireEvent(screen.getByTestId('recurring-live-screen-content'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 722 } },
    });

    fireEvent.press(screen.getByText('Close'));

    expect(screen.queryByTestId('recurring-live-screen-popup')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });
});
