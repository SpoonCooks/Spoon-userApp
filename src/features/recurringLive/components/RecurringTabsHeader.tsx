import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RECURRING_BACK_GLYPH, RECURRING_DELETE_GLYPH } from '../assets';

/**
 * `Header / Recurring tabs` — Figma component `1017:432`, instanced as `1017:6233`.
 *
 * A white bar (`px 12 / py 8`, 8 gap): a 40pt back hit area with the bare 24pt chevron, a pill
 * toggle on `#FFF7CC` (4 inset) whose active segment is brand yellow with Bold 16/24 and whose idle
 * one is SemiBold 16/24 at 60 % black, and a 40pt delete hit area. Per the component's own note,
 * delete only shows on Manage plans; on Live booking it is hidden but KEEPS its space so the
 * toggle doesn't shift.
 */
export type RecurringTab = 'live' | 'plans';

export interface RecurringTabsHeaderProps {
  readonly tab: RecurringTab;
  readonly onBack: () => void;
  readonly onTabChange?: (tab: RecurringTab) => void;
  /** Manage plans only. */
  readonly onDelete?: () => void;
  readonly testID?: string;
}

const TABS: readonly { readonly key: RecurringTab; readonly label: string }[] = [
  { key: 'live', label: 'Live booking' },
  { key: 'plans', label: 'Manage plans' },
];

export function RecurringTabsHeader({
  tab,
  onBack,
  onTabChange,
  onDelete,
  testID = 'recurring-tabs-header',
}: RecurringTabsHeaderProps) {
  const showDelete = tab === 'plans';

  return (
    <View style={styles.bar} testID={testID}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.hitArea}
        testID={`${testID}-back`}
      >
        <Image source={RECURRING_BACK_GLYPH} style={styles.glyph} />
      </Pressable>

      <View style={styles.toggle} accessibilityRole="tablist">
        {TABS.map(({ key, label }) => {
          const active = key === tab;
          return (
            <Pressable
              key={key}
              onPress={() => onTabChange?.(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.segment, active ? styles.segmentActive : null]}
              testID={`${testID}-${key}`}
            >
              <Text
                variant={active ? 'spoonButton' : 'spoonEmphasis'}
                color={active ? 'textPrimary' : 'textSecondarySoft'}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={showDelete ? onDelete : undefined}
        disabled={!showDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete plan"
        accessibilityElementsHidden={!showDelete}
        importantForAccessibility={showDelete ? 'auto' : 'no-hide-descendants'}
        style={[styles.hitArea, showDelete ? null : styles.hidden]}
        testID={`${testID}-delete`}
      >
        <Image source={RECURRING_DELETE_GLYPH} style={styles.glyph} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.sm,
    backgroundColor: lightTheme.colors.surface,
  },
  hitArea: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
  glyph: { width: 24, height: 24 },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    padding: lightTheme.space.xs,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.pill,
  },
  segmentActive: { backgroundColor: lightTheme.colors.surfaceCta },
});
