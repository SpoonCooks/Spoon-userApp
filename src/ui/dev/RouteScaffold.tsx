import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Temporary route scaffold — exists ONLY to verify that expo-router resolves the shell.
 * It is not a screen and carries no product UI.
 *
 * Every one of these is replaced in Phase 3 by the real screen. Do not build on it.
 */

export type RouteStatus = 'foundation' | 'figma-pending' | 'design-pending' | 'blocked';

const STATUS_LABEL: Record<RouteStatus, string> = {
  foundation: 'FOUNDATION PLACEHOLDER',
  'figma-pending': 'FIGMA PENDING',
  'design-pending': 'DESIGN PENDING',
  blocked: 'BLOCKED — PRODUCT ANSWER REQUIRED',
};

export interface RouteScaffoldProps {
  readonly title: string;
  readonly status?: RouteStatus;
  /** Audit / blocker references so the route explains itself while it is a stub. */
  readonly notes?: readonly string[];
}

export function RouteScaffold({ title, status = 'foundation', notes = [] }: RouteScaffoldProps) {
  return (
    <SafeAreaView style={styles.container} testID={`route-scaffold-${title}`}>
      <View style={styles.content}>
        <Text variant="labelUpper" color="textSecondary">
          {STATUS_LABEL[status]}
        </Text>
        <Text variant="heading" color="textPrimary" accessibilityRole="header">
          {title}
        </Text>
        {notes.map((note) => (
          <Text key={note} variant="body" color="textSecondary">
            • {note}
          </Text>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
  },
});
