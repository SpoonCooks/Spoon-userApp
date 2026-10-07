import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The way back to booking from a past visit. NO FIGMA FRAME: the spec asks for both, the frames
 * draw neither, so this is the page's own tokens and the app's buttons.
 *
 *   failed debit   "Book a one-time visit" — the spec: a visit cancelled by a failed debit shows
 *                  "a way to book a one-time visit for the same slot"
 *   any past visit "Book again" — the spec: "Book again" on a past Recurring visit starts a new
 *                  Recurring plan
 */
export interface VisitRebookProps {
  readonly onBookOneTime?: (() => void) | undefined;
  readonly onBookAgain?: (() => void) | undefined;
  readonly testID?: string;
}

export function VisitRebook({
  onBookOneTime,
  onBookAgain,
  testID = 'visit-rebook',
}: VisitRebookProps) {
  if (onBookOneTime === undefined && onBookAgain === undefined) return null;
  return (
    <View style={styles.block} testID={testID}>
      {onBookOneTime === undefined ? null : (
        <>
          <Text variant="spoonCaption" color="textSecondarySoft">
            Your Autopay payment didn’t go through, so this visit was cancelled and nothing was
            charged. You can still book a cook for the same time.
          </Text>
          <Button
            label="Book a one-time visit"
            onPress={onBookOneTime}
            flat
            labelVariant="spoonButton"
            style={styles.button}
            testID={`${testID}-one-time`}
          />
        </>
      )}
      {onBookAgain === undefined ? null : (
        <Button
          label="Book again"
          onPress={onBookAgain}
          variant="secondary"
          flat
          labelVariant="spoonButton"
          style={styles.button}
          testID={`${testID}-again`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: lightTheme.space.md },
  button: { minHeight: 48, borderRadius: lightTheme.radius.pill },
});
