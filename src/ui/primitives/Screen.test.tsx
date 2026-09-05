import { act, renderHook } from '@testing-library/react-native';

import { useKeyboardAwareScroll, type KeyboardAwareScroll } from './Screen';

/**
 * The keyboard reveal, tested in the order the events actually arrive.
 *
 * The bug these cover shipped looking finished: `revealView` existed, the profile screen called
 * it, and every test passed — because nothing modelled the ORDER. On a device the keyboard
 * reports last, so both of the earlier calls return without doing anything and the only call
 * that lands is the one triggered by the viewport shrinking. That call used to reveal the
 * focused input, which on a search-with-a-list sits above the list and is already visible, so
 * the measured overlap was zero and the screen did not move at all.
 */

/** A stand-in for anything with a window rectangle. `measureInWindow` answers synchronously. */
function node(y: number, height: number) {
  return {
    measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) =>
      callback(0, y, 100, height),
  };
}

describe('useKeyboardAwareScroll', () => {
  function setup() {
    const scrollTo = jest.fn();
    const rendered = renderHook<KeyboardAwareScroll, { keyboard: number }>(
      ({ keyboard }) => useKeyboardAwareScroll(keyboard, 0),
      { initialProps: { keyboard: 0 } },
    );
    // The viewport occupies 0..400 once the keyboard has shrunk it.
    const attach = () => {
      rendered.result.current.scrollRef.current = { scrollTo } as never;
      rendered.result.current.viewportRef.current = node(0, 400) as never;
    };
    attach();
    return { ...rendered, scrollTo, attach };
  }

  it('does nothing while the keyboard is still closed', () => {
    const { result, scrollTo } = setup();

    act(() => result.current.onInputFocus());
    act(() => result.current.revealView(node(300, 250) as never));

    // Both calls arrive before the IME reports its height. There is no geometry to act on yet,
    // and guessing one is what the measured approach exists to avoid.
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('reveals the whole control when the keyboard finally arrives, not just the focused input', () => {
    const { result, rerender, scrollTo, attach } = setup();

    act(() => result.current.onInputFocus());
    // The options list opens: the block now spans 300..550, well past the shrunk viewport.
    act(() => result.current.revealView(node(300, 250) as never));

    rerender({ keyboard: 300 });
    attach();
    act(() => result.current.onViewportLayout());

    // 550 (the block's bottom) - 400 (the viewport's) = 150, and there is 300 of headroom above
    // it, so the whole overlap can be scrolled away without pushing the field off the top.
    expect(scrollTo).toHaveBeenCalledWith({ y: 150, animated: true });
  });

  it('never scrolls a control taller than the space above the keyboard off the top', () => {
    const { result, rerender, scrollTo, attach } = setup();

    // A block starting 40 from the top and running 900 tall cannot be shown whole.
    act(() => result.current.revealView(node(40, 900) as never));
    rerender({ keyboard: 300 });
    attach();
    act(() => result.current.onViewportLayout());

    // Clamped to the 40 of headroom rather than the 540 of overlap: showing the top of the
    // control and as much of the list as fits is the honest maximum.
    expect(scrollTo).toHaveBeenCalledWith({ y: 40, animated: true });
  });

  it('retires the remembered control once focus moves to a plain field', () => {
    const { result, rerender, scrollTo, attach } = setup();

    act(() => result.current.revealView(node(300, 250) as never));
    // Focus leaves for an ordinary input elsewhere on the form.
    act(() => result.current.onInputFocus());

    rerender({ keyboard: 300 });
    attach();
    act(() => result.current.onViewportLayout());

    // With nothing remembered it falls back to the focused input, and there is none under test,
    // so nothing moves. The point is that the stale block is NOT chased.
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('leaves a control that already clears the keyboard where it is', () => {
    const { result, rerender, scrollTo, attach } = setup();

    // 100..200 sits comfortably inside the shrunk 0..400 viewport.
    act(() => result.current.revealView(node(100, 100) as never));
    rerender({ keyboard: 300 });
    attach();
    act(() => result.current.onViewportLayout());

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
