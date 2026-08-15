import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DataState } from '@core/data';
import {
  Button,
  ChipGroup,
  Icon,
  IconButton,
  NoteCard,
  PriceTile,
  QueryBoundary,
  Screen,
  SectionHeader,
  Text,
  lightTheme,
} from '@ui';
import type { ChipOption } from '@ui';

import type { ScheduleSelection, ScheduleViewModel } from '../types';

/**
 * Scheduled booking — Figma `37:4183` / `37:3943` / `37:3703` / `34:3035` / `34:1919` / `34:2105`,
 * and the same screen in reschedule mode — `47:6549` / `47:6450` / `47:6059` / `47:5844` /
 * `47:5638`.
 *
 * ONE screen, four progressively-disclosed sections (C-1). A section appears only once the one
 * above it has a selection, which is why eleven Figma frames collapse to this file.
 *
 * Geometry read off `37:3703`:
 *   header  `37:3705` - sticky, white, 0.8pt `#F1F5F9` hairline, px 16 / py 12, 8pt gap,
 *                       title Livvic Black 20/28 in `#0F172B`, LEFT aligned
 *   body    `37:3713` - px 16, pt 22, pb 24, **20pt** between sections
 *   section `37:3714` - a 6pt gap between the field label and its controls
 *   grid    `37:3770` - 3 columns at 8pt gutters, compact tiles
 *   footer  `37:3907` - 8pt gap: the `#FFD600` bar with an inset black `Pay ->` pill, then the
 *                       `#F1F5F9` "Share your requests" bar
 *
 * The header now lives OUTSIDE the scroll view and is sticky, as `37:3705` pins it.
 *
 * PRODUCT RULE (task 17) - reschedule is FREE and takes NO payment. The Figma reschedule frames
 * (`47:6549` and siblings) still draw the `Pay ->` pill on the CTA; that is a stale artefact of
 * the booking frame they were duplicated from. The pill is therefore driven by `payLabel`, which
 * reschedule mode does not supply, so no Razorpay path can be reached from a reschedule.
 * PRODUCT_PENDING for the designer to remove it from those frames.
 *
 * Boundary: days, periods, durations and 15-minute slots — including which are disabled — are
 * server data. No booking horizon, availability rule or price is encoded here (B-8).
 */

export interface ScheduleActions {
  readonly onBack: () => void;
  readonly onSubmit: (selection: ScheduleSelection) => void;
  readonly onOpenMealBrief: () => void;
  readonly onPay?: () => void;
}

export interface ScheduleViewProps extends ScheduleActions {
  readonly state: DataState<ScheduleViewModel>;
  readonly onRetry?: () => void;
}

function toChipOptions(
  options: readonly { id: string; label: string; caption?: string; disabled?: boolean }[],
): readonly ChipOption[] {
  return options.map((option) => ({
    id: option.id,
    label: option.label,
    ...(option.caption === undefined ? {} : { caption: option.caption }),
    ...(option.disabled === undefined ? {} : { disabled: option.disabled }),
  }));
}

export function ScheduleView({ state, onRetry, ...actions }: ScheduleViewProps) {
  const [selection, setSelection] = useState<ScheduleSelection>({
    dayId: null,
    periodId: null,
    durationId: null,
    slotId: null,
  });

  return (
    <QueryBoundary state={state} {...(onRetry === undefined ? {} : { onRetry })}>
      {(schedule) => {
        const showTime = selection.dayId !== null;
        const hasDurations = schedule.durations !== undefined && schedule.durations.length > 0;
        const showDuration = showTime && selection.periodId !== null && hasDurations;
        const showStart =
          showTime &&
          selection.periodId !== null &&
          (!hasDurations || selection.durationId !== null);

        const slots =
          selection.periodId === null ? [] : (schedule.slotsByPeriod[selection.periodId] ?? []);

        const complete =
          selection.dayId !== null &&
          selection.periodId !== null &&
          selection.slotId !== null &&
          (!hasDurations || selection.durationId !== null);

        const blocked = schedule.blockedMessage !== undefined;

        return (
          <Screen
            scroll
            tone="plain"
            testID="schedule-screen"
            header={
              <View style={styles.header}>
                <IconButton
                  name="back"
                  label="Back"
                  onPress={actions.onBack}
                  testID="schedule-back"
                />
                <Text
                  variant="headingScreen"
                  color="textStrong"
                  accessibilityRole="header"
                  numberOfLines={1}
                >
                  {schedule.title}
                </Text>
              </View>
            }
            footer={
              <View style={styles.footer}>
                <Button
                  label={schedule.primaryCtaLabel}
                  onPress={() => actions.onSubmit(selection)}
                  variant="primary"
                  disabled={!complete || blocked}
                  testID="schedule-submit"
                  {...(schedule.payLabel === undefined || actions.onPay === undefined
                    ? {}
                    : {
                        trailing: (
                          <Pressable
                            onPress={actions.onPay}
                            disabled={!complete || blocked}
                            accessibilityRole="button"
                            accessibilityLabel={schedule.payLabel}
                            style={styles.payPill}
                            testID="schedule-pay"
                          >
                            <Text variant="bodyBold" color="surfaceCta">
                              {schedule.payLabel}
                            </Text>
                            <Icon name="arrowRight" size={14} color="surfaceCta" />
                          </Pressable>
                        ),
                      })}
                />
                <Button
                  label={schedule.secondaryCtaLabel}
                  onPress={actions.onOpenMealBrief}
                  variant="subtle"
                  size="md"
                  rightIcon="arrowRight"
                  testID="schedule-meal-brief"
                />
              </View>
            }
          >
            {schedule.blockedMessage === undefined ? null : (
              <NoteCard body={schedule.blockedMessage} icon="alert" testID="schedule-blocked" />
            )}

            <View style={styles.section}>
              <SectionHeader title={schedule.sectionTitles.day} />
              <ChipGroup
                options={toChipOptions(schedule.days)}
                selectedId={selection.dayId}
                onSelect={(dayId) =>
                  setSelection({ dayId, periodId: null, durationId: null, slotId: null })
                }
                accessibilityLabel={schedule.sectionTitles.day}
                testID="schedule-days"
              />
            </View>

            {!showTime ? null : (
              <View style={styles.section}>
                <SectionHeader title={schedule.sectionTitles.time} />
                <ChipGroup
                  options={schedule.periods.map((period) => ({
                    id: period.id,
                    label: period.label,
                    icon: period.icon,
                    ...(period.disabled === undefined ? {} : { disabled: period.disabled }),
                  }))}
                  selectedId={selection.periodId}
                  onSelect={(periodId) =>
                    setSelection((current) => ({
                      ...current,
                      periodId,
                      durationId: null,
                      slotId: null,
                    }))
                  }
                  accessibilityLabel={schedule.sectionTitles.time}
                  testID="schedule-periods"
                />
              </View>
            )}

            {!showDuration || schedule.durations === undefined ? null : (
              <View style={styles.section}>
                <SectionHeader title={schedule.sectionTitles.duration} />
                <View style={styles.durationGrid}>
                  {schedule.durations.map((duration) => (
                    <View key={duration.id} style={styles.durationCell}>
                      <PriceTile
                        label={duration.label}
                        price={duration.price}
                        {...(duration.strikePrice === undefined
                          ? {}
                          : { strikePrice: duration.strikePrice })}
                        {...(duration.badge === undefined ? {} : { badge: duration.badge })}
                        selected={selection.durationId === duration.id}
                        disabled={duration.disabled ?? false}
                        onPress={() =>
                          setSelection((current) => ({
                            ...current,
                            durationId: duration.id,
                            slotId: null,
                          }))
                        }
                        testID={`schedule-duration-${duration.id}`}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!showStart ? null : (
              <View style={styles.section}>
                <SectionHeader title={schedule.sectionTitles.startTime} />
                {/* `34:3485` — 4 columns, and the grid has its own chip density (see ChipGroup). */}
                <ChipGroup
                  options={toChipOptions(slots)}
                  selectedId={selection.slotId}
                  onSelect={(slotId) => setSelection((current) => ({ ...current, slotId }))}
                  columns={4}
                  density="slot"
                  accessibilityLabel={schedule.sectionTitles.startTime}
                  testID="schedule-slots"
                />
              </View>
            )}
          </Screen>
        );
      }}
    </QueryBoundary>
  );
}

/** `37:3770` - 3 columns at an 8pt gutter, expressed as half-gutter padding on each cell. */
const HALF_GAP = lightTheme.space.sm / 2;

const styles = StyleSheet.create({
  /** `37:3705` - px 16 / py 12, 8pt gap, 0.8pt hairline. */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.lg,
    paddingVertical: lightTheme.space.md,
    backgroundColor: lightTheme.colors.surface,
    borderBottomWidth: lightTheme.stroke.hairline,
    borderBottomColor: lightTheme.colors.borderHairline,
  },
  /**
   * `37:3713` / `34:3045` - 20pt between sections, and that gap comes from `Screen`'s own
   * `scrollContent` gap. This style used to ALSO carry `marginBottom: 20`, which stacked with it
   * and drew 40; with the grid's trailing row padding on top, the measured gap on the handset was
   * 48. It is now spacing-free and the single 20 is the frame's.
   */
  section: {},
  /** The cells pad the row gap onto their bottom, so the LAST row's padding is pulled back off. */
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -HALF_GAP,
    marginBottom: -lightTheme.space.sm,
  },
  durationCell: {
    width: '33.33%',
    paddingHorizontal: HALF_GAP,
    paddingBottom: lightTheme.space.sm,
  },
  footer: { gap: lightTheme.space.sm },
  /** `37:3912` - a black pill inset in the CTA bar, carrying the CTA's own yellow as its ink. */
  payPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.xs,
    paddingHorizontal: lightTheme.space.s10,
    paddingVertical: lightTheme.space.xs,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceInverse,
  },
});
