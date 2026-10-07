import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * A completed visit's follow-ups with its cook. NO FIGMA FRAME: the spec asks for both and the
 * frames draw neither, so this uses the page's tokens and the app's buttons.
 *
 *   add to Pool   "A completed visit also offers adding that cook to the Cook Pool" — shown only
 *                 while the cook is not in the household's Pool
 *   tip           "Reuse the V0 rating and tip flow" — shown only while the server allows a tip
 *                 (`allowedActions.canTip`); it opens the visit's booking on its tip sheet
 */
export interface VisitCookActionsProps {
  /** First name, as the rest of the page writes it. */
  readonly cookName: string;
  readonly onAddToPool?: (() => void) | undefined;
  readonly adding?: boolean;
  readonly onTip?: (() => void) | undefined;
  readonly testID?: string;
}

export function VisitCookActions({
  cookName,
  onAddToPool,
  adding = false,
  onTip,
  testID = 'visit-cook-actions',
}: VisitCookActionsProps) {
  if (onAddToPool === undefined && onTip === undefined) return null;
  return (
    <View style={styles.card} testID={testID}>
      {onAddToPool === undefined ? null : (
        <View style={styles.row}>
          <View style={styles.text}>
            <Text variant="spoonBodyStrong" color="textPrimary">
              {`Liked ${cookName}?`}
            </Text>
            <Text variant="spoonCaption" color="textSecondarySoft">
              Add them to your Cook Pool for your Recurring visits.
            </Text>
          </View>
          <Button
            label="Add to Pool"
            onPress={onAddToPool}
            loading={adding}
            disabled={adding}
            size="md"
            flat
            labelVariant="spoonCaptionStrong"
            style={styles.button}
            testID={`${testID}-add-to-pool`}
          />
        </View>
      )}
      {onTip === undefined ? null : (
        <View style={styles.row}>
          <View style={styles.text}>
            <Text variant="spoonBodyStrong" color="textPrimary">
              {`Tip ${cookName}`}
            </Text>
            <Text variant="spoonCaption" color="textSecondarySoft">
              Say thanks for today’s visit.
            </Text>
          </View>
          <Button
            label="Tip"
            onPress={onTip}
            variant="secondary"
            size="md"
            flat
            labelVariant="spoonCaptionStrong"
            style={styles.button}
            testID={`${testID}-tip`}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderAccent,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  text: { flex: 1, gap: lightTheme.space.xxs },
  button: { borderRadius: lightTheme.radius.pill },
});
