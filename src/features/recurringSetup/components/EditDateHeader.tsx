import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { CHIP_CLOCK_ICON, CHIP_TIME_OF_DAY_ICONS } from '../art';
import { TIME_OF_DAY_BANDS, durationLabel, editDateLabel, formatStartTime } from '../data';
import type { EditDateField } from '../editDateDraft';
import type { RecurringVisitChoice } from '../types';

/**
 * Edit date's "Full header" — Figma `512:1257` (on `494:676`): the booking as it stands, kept in
 * view while one part of it is changed. "A header with the original details persists."
 *
 * On a white → `#FFE666` fall: the plan (Caption Strong), the date (Display), then the three
 * details as chips. The chip whose editor is open is outlined in black (`512:1275`); tapping
 * another opens its editor below.
 */
export interface EditDateHeaderProps {
  /** 1-based. */
  readonly planNumber: number;
  readonly dayId: string;
  /** The booking the date has now — never the draft. */
  readonly visit: RecurringVisitChoice;
  readonly active: EditDateField;
  readonly onSelect: (field: EditDateField) => void;
  readonly testID?: string;
}

export function EditDateHeader({
  planNumber,
  dayId,
  visit,
  active,
  onSelect,
  testID = 'recurring-edit-date-header',
}: EditDateHeaderProps) {
  const band = TIME_OF_DAY_BANDS.find((entry) => entry.id === visit.timeOfDay);
  return (
    <View style={styles.header} testID={testID}>
      <LinearGradient
        colors={[lightTheme.colors.surface, lightTheme.colors.surfaceBrandTint]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text variant="bodyStrong" color="textPrimary">
        Plan {planNumber}
      </Text>
      <Text variant="display" color="textPrimary">
        {editDateLabel(dayId)}
      </Text>
      <View style={styles.chips}>
        <DetailChip
          icon={CHIP_TIME_OF_DAY_ICONS[visit.timeOfDay]}
          label={band?.label ?? ''}
          active={active === 'timeOfDay'}
          onPress={() => onSelect('timeOfDay')}
          testID={`${testID}-time-of-day`}
        />
        <DetailChip
          icon={CHIP_CLOCK_ICON}
          label={durationLabel(visit.durationId)}
          active={active === 'duration'}
          onPress={() => onSelect('duration')}
          testID={`${testID}-duration`}
        />
        <DetailChip
          label={formatStartTime(visit.startMinutes)}
          active={active === 'startTime'}
          onPress={() => onSelect('startTime')}
          testID={`${testID}-start-time`}
        />
      </View>
    </View>
  );
}

/**
 * `512:1264` / `512:1275` / `512:1280` — a `#FFF7CC` pill, px 12 / py 6, a 16pt icon 6 from a
 * SemiBold 14/20 label. The open one carries a 1pt black edge, which the frame counts in the
 * pill's size (74 × 34 against the others' 32).
 */
function DetailChip({
  icon,
  label,
  active,
  onPress,
  testID,
}: {
  readonly icon?: ImageSourcePropType;
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[styles.chip, active ? styles.chipActive : null]}
      testID={testID}
    >
      {icon === undefined ? null : <Image source={icon} style={styles.chipIcon} />}
      <Text variant="bodyLargeStrong" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** `512:1257` / `512:1258` — 144 tall, p 16, 12 between the plan, the date and the chips. */
  header: {
    height: 144,
    padding: lightTheme.space.lg,
    gap: lightTheme.space.md,
    overflow: 'hidden',
  },
  /** `512:1263` — 8 apart, wrapping, each at its own height. */
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: lightTheme.space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  chipActive: { borderWidth: 1, borderColor: lightTheme.colors.borderInk },
  chipIcon: { width: 16, height: 16, tintColor: lightTheme.colors.textPrimary },
});
