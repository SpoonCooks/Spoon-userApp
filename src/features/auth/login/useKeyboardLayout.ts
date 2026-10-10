import { useEffect, useState } from 'react';
import { Keyboard, LayoutAnimation, Platform } from 'react-native';
import type { KeyboardEvent } from 'react-native';

/**
 * The keyboard's height, with every layout change it causes animated in step with it.
 *
 * Dev note `1949:2258`: the screen adapts to the keyboard rather than being covered or pushed —
 * the photo shrinks to a band, the sheet rises so its last element sits 16pt above the keyboard
 * and the gaps tighten — "in step with the keyboard sliding up", using the keyboard's OWN duration
 * and curve, and the reverse when it closes. The height is always read from the event, never
 * hardcoded: it changes by phone, language and the iOS suggestion bar.
 *
 * `LayoutAnimation` is armed right before the state change, so the one re-layout it triggers —
 * hero, sheet, gaps, logo size — animates as a single transition.
 *
 * iOS announces the keyboard BEFORE it moves (`will` events, with the system curve). Android only
 * reports after (`did` events), so it gets the note's 250 ms ease-out. `keyboardWillChangeFrame`
 * catches the iOS "From Messages" bar appearing over an open keyboard, which the OTP dev notes
 * want animated (150 ms) rather than jumped.
 */
export function useKeyboardLayout(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === 'ios';

    const apply = (next: number, event?: KeyboardEvent) => {
      setHeight((current) => {
        if (current === next) return current;
        LayoutAnimation.configureNext({
          duration: ios && event?.duration ? event.duration : 250,
          update: { type: ios && event?.easing === 'keyboard' ? 'keyboard' : 'easeOut' },
        });
        return next;
      });
    };

    const subscriptions = ios
      ? [
          Keyboard.addListener('keyboardWillShow', (e) => apply(e.endCoordinates.height, e)),
          Keyboard.addListener('keyboardWillHide', (e) => apply(0, e)),
          Keyboard.addListener('keyboardWillChangeFrame', (e) => {
            if (Keyboard.isVisible()) apply(e.endCoordinates.height, e);
          }),
        ]
      : [
          Keyboard.addListener('keyboardDidShow', (e) => apply(e.endCoordinates.height, e)),
          Keyboard.addListener('keyboardDidHide', () => apply(0)),
        ];

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return height;
}
