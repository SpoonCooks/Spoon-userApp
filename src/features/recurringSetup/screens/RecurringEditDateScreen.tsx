import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { CHIP_CLOCK_ICON, CHIP_TIME_OF_DAY_ICONS, TRASH_ICON } from '../art';
import { DeleteDateDialog } from '../components/DeleteDateDialog';
import { RecurringFooter } from '../components/RecurringFooter';
import { VisitChoices } from '../components/VisitChoices';
import { TIME_OF_DAY_BANDS, durationLabel, editDateLabel, formatStartTime } from '../data';
import type { RecurringBusyWindow } from '../data';
import type { RecurringVisitChoice } from '../types';

/**
 * Recurring setup — Edit date. Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User): `494:605` (time),
 * `494:809` (duration), `494:676` (start time), and the delete dialog on `586:4315`.
 *
 * Reached from the Summary's edit mode by tapping one date. A header keeps the date's booking as
 * it stands — plan, date, time of day, duration, start — while the three choices below pick its
 * new one from scratch. "Save changes" unlocks once a start time is picked. The bin asks before
 * taking the date off its plan.
 */
export interface RecurringEditDateScreenProps {
  /** 1-based: the plan the date is on. */
  readonly planNumber: number;
  readonly dayId: string;
  /** The visit booked on the date now. */
  readonly visit: RecurringVisitChoice;
  /** The plan's other visits on this date, whose times the new one must not overlap. */
  readonly busy: readonly RecurringBusyWindow[];
  readonly onBack: () => void;
  readonly onSave: (choice: RecurringVisitChoice) => void;
  readonly onDelete: () => void;
  readonly testID?: string;
}

export function RecurringEditDateScreen({
  planNumber,
  dayId,
  visit,
  busy,
  onBack,
  onSave,
  onDelete,
  testID = 'recurring-edit-date-screen',
}: RecurringEditDateScreenProps) {
  const [choice, setChoice] = useState<RecurringVisitChoice | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const band = TIME_OF_DAY_BANDS.find((entry) => entry.id === visit.timeOfDay);

  return (
    <Screen
      scroll
      tone="plain"
      padded={false}
      showsScrollIndicator={false}
      contentStyle={styles.content}
      testID={testID}
      header={
        <View>
          {/* `586:4283` — Nav header 4: back, "Edit date", the bin in a 44pt target. */}
          <ScreenHeader
            density="nav"
            title="Edit date"
            onBack={onBack}
            trailing={
              <Pressable
                onPress={() => setConfirmingDelete(true)}
                accessibilityRole="button"
                accessibilityLabel="Delete this date"
                style={styles.trash}
                testID={`${testID}-delete`}
              >
                <Image source={TRASH_ICON} style={styles.icon24} />
              </Pressable>
            }
            testID={`${testID}-header`}
          />
          {/* `512:1228` — the booking as it stands, on a white → `#FFE666` fall. */}
          <View style={styles.dayHeader}>
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
              <Chip icon={CHIP_TIME_OF_DAY_ICONS[visit.timeOfDay]} label={band?.label ?? ''} />
              <Chip icon={CHIP_CLOCK_ICON} label={durationLabel(visit.durationId)} />
              <Chip label={formatStartTime(visit.startMinutes)} />
            </View>
          </View>
        </View>
      }
      footer={
        <RecurringFooter
          label="Save changes"
          disabled={choice === null}
          onPress={() => {
            if (choice !== null) onSave(choice);
          }}
          testID={`${testID}-save`}
        />
      }
    >
      <VisitChoices busy={busy} timeLabel="Time of the day" onChange={setChoice} />
      <DeleteDateDialog
        visible={confirmingDelete}
        planNumber={planNumber}
        dayId={dayId}
        visit={visit}
        onKeep={() => setConfirmingDelete(false)}
        onDelete={() => {
          setConfirmingDelete(false);
          onDelete();
        }}
      />
    </Screen>
  );
}

/** `512:1235` — a `#FFF7CC` pill, px 12 / py 6, a 16pt icon 6 from a SemiBold 14/20 label. */
function Chip({ icon, label }: { readonly icon?: ImageSourcePropType; readonly label: string }) {
  return (
    <View style={styles.chip}>
      {icon === undefined ? null : <Image source={icon} style={styles.chipIcon} />}
      <Text variant="bodyLargeStrong" color="textPrimary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `494:812` — p 16, 24 between blocks. */
  content: { padding: lightTheme.space.lg, gap: lightTheme.space.xl },
  /** `586:4283` — the bin's 44pt hit area sits 6 from the frame's right edge, past the gutter. */
  trash: {
    marginLeft: 'auto',
    marginRight: -10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon24: { width: 24, height: 24 },
  /** `512:1228` / `512:1229` — 144 tall, p 16, 12 between the plan, the date and the chips. */
  dayHeader: {
    height: 144,
    padding: lightTheme.space.lg,
    gap: lightTheme.space.md,
    overflow: 'hidden',
  },
  /** `512:1234` — 8 apart, wrapping. */
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  chipIcon: { width: 16, height: 16, tintColor: lightTheme.colors.textPrimary },
});
