import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { LaunchSplash } from './LaunchSplash';

describe('LaunchSplash', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('releases the system splash once the artwork has loaded, and only once', () => {
    const onShown = jest.fn();
    render(<LaunchSplash ready={false} onShown={onShown} onDone={jest.fn()} />);

    fireEvent(screen.getByTestId('launch-splash-art'), 'loadEnd');
    fireEvent(screen.getByTestId('launch-splash-art'), 'loadEnd');
    act(() => jest.advanceTimersByTime(2000));

    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('does not strand the customer on a flat colour if the artwork never reports', () => {
    const onShown = jest.fn();
    render(<LaunchSplash ready={false} onShown={onShown} onDone={jest.fn()} />);

    act(() => jest.advanceTimersByTime(1600));

    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('stays up, and blocks touches, until the app is ready', () => {
    const onDone = jest.fn();
    render(<LaunchSplash ready={false} onShown={jest.fn()} onDone={onDone} />);

    act(() => jest.advanceTimersByTime(5000));

    expect(screen.getByTestId('launch-splash').props.pointerEvents).toBe('auto');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('fills the screen, not the picture file: width and height are 100%', () => {
    render(<LaunchSplash ready={false} onShown={jest.fn()} onDone={jest.fn()} />);
    const style = StyleSheet.flatten(screen.getByTestId('launch-splash-art').props.style);

    // A local image otherwise defaults to its own pixel size and overrides the absolute insets.
    expect(style.width).toBe('100%');
    expect(style.height).toBe('100%');
  });

  it('keeps the artwork up for a minimum time even when the app is ready at once', () => {
    const onDone = jest.fn();
    render(<LaunchSplash ready onShown={jest.fn()} onDone={onDone} />);
    fireEvent(screen.getByTestId('launch-splash-art'), 'loadEnd');

    act(() => jest.advanceTimersByTime(500));
    expect(onDone).not.toHaveBeenCalled();

    // The minimum elapses first; the fade only starts on the render after it.
    act(() => jest.advanceTimersByTime(200));
    act(() => jest.advanceTimersByTime(600));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('fades out and reports done once the app is ready and the artwork has been seen', () => {
    const onDone = jest.fn();
    const { rerender } = render(<LaunchSplash ready={false} onShown={jest.fn()} onDone={onDone} />);
    fireEvent(screen.getByTestId('launch-splash-art'), 'loadEnd');

    rerender(<LaunchSplash ready onShown={jest.fn()} onDone={onDone} />);
    act(() => jest.advanceTimersByTime(700));
    act(() => jest.advanceTimersByTime(600));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('launch-splash').props.pointerEvents).toBe('none');
  });

  it('does not restart the fade when the parent re-renders with new callbacks', () => {
    const onDone = jest.fn();
    const { rerender } = render(<LaunchSplash ready onShown={jest.fn()} onDone={onDone} />);
    fireEvent(screen.getByTestId('launch-splash-art'), 'loadEnd');

    rerender(<LaunchSplash ready onShown={jest.fn()} onDone={() => onDone()} />);
    act(() => jest.advanceTimersByTime(700));
    act(() => jest.advanceTimersByTime(600));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
