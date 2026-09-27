import { StyleSheet, View } from 'react-native';

import { DirectionalDisc, Text } from '@ui';

/**
 * The header on every recurring-setup screen, as Figma `ZIJf639gTWHXshaa2YOeCT` draws it: a 36pt
 * back disc, a 12pt gap and a Livvic Black 22 title, in a 20pt gutter, 8 below the safe area (the
 * frame's 52 less its 44pt status bar). `ScreenHeader` draws the app's 32pt disc and 20pt title,
 * so these screens use this instead.
 */
export function RecurringHeader({
  title,
  onBack,
  testID,
}: {
  readonly title: string;
  readonly onBack: () => void;
  readonly testID: string;
}) {
  return (
    <View style={styles.header} testID={testID}>
      <DirectionalDisc
        direction="back"
        label="Back"
        size={36}
        onPress={onBack}
        testID={`${testID}-back`}
      />
      <Text
        variant="headingStep"
        color="textInk"
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  title: { flexShrink: 1 },
});
