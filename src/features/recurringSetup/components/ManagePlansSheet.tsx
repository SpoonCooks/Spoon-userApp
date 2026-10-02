import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Button, Overlay, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import { innerShadows } from '@ui/tokens/primitives';

import { CALENDAR_REMOVE_ICON, COOK_VISIT_ICON, RESTART_ROW_ICON } from '../art';

/**
 * "Manage your plans" — Figma `542:1500` (on `542:1442`), opened by the Summary's bin.
 *
 * A bottom sheet with a grabber: delete the visit shown, delete its plan, or start over. Each row
 * says exactly what it would take away. "Delete visit" only shows while the plan has another
 * visit — removing a plan's only visit is deleting the plan.
 */
export interface ManagePlansSheetProps {
  readonly visible: boolean;
  /** "1st Visit · Plan 2", or undefined when the plan has a single visit. */
  readonly visitLine?: string | undefined;
  /** "Plan 2 · 2 visits". */
  readonly planLine: string;
  /** "Deletes all 2 plans and 3 visits and takes you back to choosing days". */
  readonly startOverLine: string;
  readonly onDeleteVisit: () => void;
  readonly onDeletePlan: () => void;
  readonly onStartOver: () => void;
  readonly onClose: () => void;
  readonly testID?: string;
}

export function ManagePlansSheet({
  visible,
  visitLine,
  planLine,
  startOverLine,
  onDeleteVisit,
  onDeletePlan,
  onStartOver,
  onClose,
  testID = 'recurring-manage-plans',
}: ManagePlansSheetProps) {
  if (!visible) return null;
  return (
    <Overlay visible={visible} onRequestClose={onClose} testID={`${testID}-modal`}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <View style={styles.sheet} accessibilityViewIsModal testID={testID}>
        {/* `542:1501` — a 40 × 4 `#FFEF99` grabber, 16 above the title. */}
        <View style={styles.handle}>
          <View style={styles.grabber} />
        </View>
        <Text variant="headingSection" color="textPrimary">
          Manage your plans
        </Text>
        <View style={styles.titleGap} />
        {visitLine === undefined ? null : (
          <Row
            icon={COOK_VISIT_ICON}
            title="Delete visit"
            detail={visitLine}
            onPress={onDeleteVisit}
            testID={`${testID}-visit`}
          />
        )}
        <Row
          icon={CALENDAR_REMOVE_ICON}
          title="Delete plan"
          detail={planLine}
          onPress={onDeletePlan}
          testID={`${testID}-plan`}
        />
        <View style={styles.divider} />
        <Row
          icon={RESTART_ROW_ICON}
          title="Start over"
          detail={startOverLine}
          onPress={onStartOver}
          testID={`${testID}-start-over`}
        />
        <View style={styles.actionsGap} />
        <Button
          label="Cancel"
          onPress={onClose}
          size="pillLg"
          flat
          labelColor="textPrimary"
          testID={`${testID}-cancel`}
        />
      </View>
    </Overlay>
  );
}

/** `542:1505` — at least 64 tall, py 8: a 48pt well, 16 from an Emphasis title over its detail. */
function Row({
  icon,
  title,
  detail,
  onPress,
  testID,
}: {
  readonly icon: ImageSourcePropType;
  readonly title: string;
  readonly detail: string;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detail}`}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      testID={testID}
    >
      <View style={styles.well}>
        <Image source={icon} style={styles.icon} />
      </View>
      <View style={styles.rowText}>
        <Text variant="emphasis" color="textPrimary">
          {title}
        </Text>
        <Text variant="body" color="textSubdued">
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  /** `542:1500` — white, 24pt top corners, pt 8 / px 16 / pb 32, `Elevation/3`. */
  sheet: {
    marginTop: 'auto',
    paddingTop: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.lg,
    paddingBottom: 32,
    borderTopLeftRadius: lightTheme.radius.lg,
    borderTopRightRadius: lightTheme.radius.lg,
    backgroundColor: lightTheme.colors.surface,
    boxShadow: innerShadows.elevation3,
  },
  handle: { alignItems: 'center', paddingBottom: lightTheme.space.lg },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
  /** `542:1504` — an 8pt spacer under the title. */
  titleGap: { height: lightTheme.space.sm },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.lg,
    paddingVertical: lightTheme.space.sm,
  },
  rowPressed: { opacity: 0.6 },
  /** `542:1506` — a 48pt `color/surface/disabled` well. */
  well: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceDisabledSoft,
  },
  icon: { width: 24, height: 24 },
  /** `542:1511` — 2 between the title and the detail. */
  rowText: { flex: 1, gap: 2 },
  /** `542:1523` — a 1pt `#FFEF99` rule above "Start over". */
  divider: { height: 1, backgroundColor: lightTheme.colors.surfaceAccentStrong },
  /** `542:1532` — 16 above Cancel. */
  actionsGap: { height: lightTheme.space.lg },
});
