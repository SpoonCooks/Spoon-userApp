import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DataState } from '@core/data';
import {
  Button,
  ChipGroup,
  HelpMePickSheet,
  NoteCard,
  PriceTile,
  QueryBoundary,
  Screen,
  ScreenHeader,
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
 * Geometry re-read off the FINALIZED "Scheduled flow" section `267:3521` (`275:4488` step 1 →
 * `34:3035` step 4), which supersedes the `37:3703` reading this file was built from:
 *   header  `275:3804` - the shared 338 x 38 `63:783` header, px 4 / py 6, gap 12, NO hairline,
 *                        title Livvic Black 20/28
 *   body    `34:3045`  - px 16, **20pt** between sections
 *   section `37:3714`  - a 6pt gap between the field label and its controls
 *   grid    `37:3770`  - 3 columns at 8pt gutters, compact tiles
 *   footer  `275:4177` - a 338 x 67 block: one 330 x 34 bar at y 6.5, then the 14pt underlined
 *                        "Check payment details" line at y 46.5
 *
 * The header lives OUTSIDE the scroll view and is sticky.
 *
 * WHAT THE FINALIZED SECTION REMOVED: the `37:3912` inset black `Pay ->` pill and the `#F1F5F9`
 * "Share your requests" bar. Neither is drawn on any of the four finalized frames, so both are
 * gone. Removing the second bar also removed Schedule's Meal Brief entry point — Meal Brief is
 * outside the six finalized sections, and where it is entered from is now PRODUCT_PENDING. It
 * stays reachable in development at `spoon://meal-brief`.
 *
 * PRODUCT RULE (task 17) - reschedule is FREE and takes NO payment, so it supplies no
 * `paymentDetailsLabel` and draws no payment line at all.
 *
 * Boundary: days, periods, durations and 15-minute slots — including which are disabled — are
 * server data. No booking horizon, availability rule or price is encoded here (B-8).
 */

export interface ScheduleActions {
  readonly onBack: () => void;
  readonly onSubmit: (selection: ScheduleSelection) => void;
  /**
   * `275:4177` — the amount on the CTA, already formatted, for the CURRENT selection.
   *
   * Supplied by the route because only the route holds the quote, and omitted whenever there is
   * no quote to state: the frames draw a bare "Book Now" while the selection is incomplete, and
   * the amount appears with the priced state. It is never assembled here and never defaulted —
   * the superseded build showed a fixture's "₹129" to every customer, for every selection.
   */
  readonly primaryCtaAmountLabel?: string | undefined;
  /**
   * The HOST's half of the CTA gate — everything the screen cannot see for itself.
   *
   * The screen owns the SELECTION (day → daypart → duration → start time) and refuses to enable
   * "Book Now" until it is complete. It cannot own the rest: whether the account has a bookable
   * address, whether the server has priced this exact selection, whether the availability read
   * that produced the grid still stands. Those are the route's, and until it says yes the CTA
   * stays in `275:4690`'s grey state — a selection is not a booking (task §A4).
   *
   * Defaults to `true` so a mode with no server gate (reschedule takes no payment and needs no
   * quote) is unaffected. It is ANDed with the screen's own `complete`, never substituted for it.
   */
  readonly canSubmit?: boolean;
  /**
   * `275:4180` — opens the payment breakdown, the same seam the Instant sheet uses. Optional
   * because reschedule mode takes no payment and therefore draws no such line.
   */
  readonly onOpenPaymentDetails?: () => void;
  /**
   * The booking (or reschedule) call is in flight.
   *
   * The CTA's OWN state. The grid, the chips and the chosen slot all stay on screen and stay
   * legible — a server call must never blank a screen full of local choices (task §7, §18).
   */
  readonly submitting?: boolean;
  /**
   * Reports the current selection as it changes.
   *
   * The day and the duration are not display state — they are the QUESTION the availability read
   * asks ("which slots exist on this date, for this long"). The screen owns the selection because
   * progressive disclosure is a property of the screen, but the host owns the reads, so the two
   * have to meet somewhere. Optional: a host that only needs the final selection ignores it.
   */
  readonly onSelectionChange?: (selection: ScheduleSelection) => void;
}

export interface ScheduleViewProps extends ScheduleActions {
  readonly state: DataState<ScheduleViewModel>;
  readonly onRetry?: () => void;
  /**
   * DEV reachability only (task §16). The four Scheduled frames (`275:4488` … `34:3035`) and the
   * three Rescheduled ones (`275:5442` … `275:5218`) are progressive states of THIS screen, so
   * without a seed only the first is deep-linkable and QA has to tap through to reach the rest.
   * The route supplies a seed selection; nothing in product code sets it.
   */
  readonly initialSelection?: Partial<ScheduleSelection>;
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

export function ScheduleView({ state, onRetry, initialSelection, ...actions }: ScheduleViewProps) {
  /**
   * `333:3643` — "Help me pick". PURELY LOCAL: it opens a sheet over content the screen already
   * holds, so it starts no read and shows no loading state (task §3).
   */
  const [helpOpen, setHelpOpen] = useState(false);
  const [selection, setSelection] = useState<ScheduleSelection>({
    dayId: initialSelection?.dayId ?? null,
    periodId: initialSelection?.periodId ?? null,
    durationId: initialSelection?.durationId ?? null,
    slotId: initialSelection?.slotId ?? null,
  });

  // Reported after commit rather than from inside the setter, so a host re-render caused by the
  // new selection cannot happen during this one's update.
  const { onSelectionChange } = actions;
  useEffect(() => {
    onSelectionChange?.(selection);
  }, [selection, onSelectionChange]);

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

        /**
         * `275:4488` / `275:4713` / `275:4938` all draw "Book Now" GREY, and only `34:3035` — the
         * step with a start time chosen — draws it live. That is the whole rule, plus the host's
         * own authority and the in-flight guard.
         */
        const bookable =
          complete && !blocked && (actions.canSubmit ?? true) && actions.submitting !== true;

        return (
          <Screen
            scroll
            tone="plain"
            testID="schedule-screen"
            contentStyle={styles.body}
            header={
              /* `275:4715` — the 338 × 38 banner, drawn INSIDE the 16pt gutter column and 16pt
                 down from the top, exactly like the Address and Profile headers. No hairline.

                 The section draws this at `p 6` where the shared `63:783` component uses `px 4 /
                 py 6`; the 2pt is a Figma inconsistency between `275:4488` (a `63:783` instance)
                 and the later steps, and is not forked into a second header. */
              <View style={styles.headerWrap}>
                <ScreenHeader
                  title={schedule.title}
                  onBack={actions.onBack}
                  testID="schedule-header"
                />
              </View>
            }
            footer={
              /* `275:4177` — a 34pt bar, then a 14pt underlined line. Nothing else. */
              <View style={styles.footer}>
                <Button
                  label={
                    complete && actions.primaryCtaAmountLabel !== undefined
                      ? `${schedule.primaryCtaLabel} • ${actions.primaryCtaAmountLabel}`
                      : schedule.primaryCtaLabel
                  }
                  onPress={() => {
                    // The style prop is not the guard: a press that races the state which
                    // disabled it must not create a booking or open checkout (task §J).
                    if (!bookable) return;
                    actions.onSubmit(selection);
                  }}
                  variant="primary"
                  size="bar"
                  disabled={!bookable}
                  loading={actions.submitting ?? false}
                  testID="schedule-submit"
                />
                {/* Drawn only when there is a breakdown to OPEN. `275:4180` has no designed sheet
                    for Scheduled, and a link that opens nothing is the dead control §11 forbids —
                    so the seam decides, not the label's presence. */}
                {schedule.paymentDetailsLabel === undefined ||
                actions.onOpenPaymentDetails === undefined ? null : (
                  <Pressable
                    onPress={actions.onOpenPaymentDetails}
                    accessibilityRole="button"
                    accessibilityLabel={schedule.paymentDetailsLabel}
                    hitSlop={16}
                    testID="schedule-payment-details"
                  >
                    <Text
                      variant="micro"
                      color="textPrimary"
                      align="center"
                      style={styles.underline}
                    >
                      {schedule.paymentDetailsLabel}
                    </Text>
                  </Pressable>
                )}
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
                columns={3}
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
                  columns={3}
                  accessibilityLabel={schedule.sectionTitles.time}
                  testID="schedule-periods"
                />
              </View>
            )}

            {!showDuration || schedule.durations === undefined ? null : (
              <View style={styles.section}>
                {/* `333:3622` — "Duration" at x 0 and "Help me pick" right-aligned at x 232, on
                    ONE 330pt label row. That is `SectionHeader`'s action slot, not a button. */}
                <SectionHeader
                  title={schedule.sectionTitles.duration}
                  {...(schedule.durationHelp === undefined
                    ? {}
                    : {
                        actionLabel: schedule.durationHelp.label,
                        onAction: () => setHelpOpen(true),
                      })}
                  testID="schedule-duration-header"
                />
                <View
                  style={[
                    styles.durationGrid,
                    // Same correction, same caveat as `ChipGroup`: with no tiles there is no
                    // trailing row padding to cancel, and cancelling it anyway crops the label.
                    schedule.durations.length === 0 ? styles.gridEmpty : null,
                  ]}
                >
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
                {/* `34:3485` — 4 columns of equal cells; see `ChipGroup` for the measured track. */}
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
            {schedule.durationHelp === undefined ? null : (
              <HelpMePickSheet
                visible={helpOpen}
                onClose={() => setHelpOpen(false)}
                title={schedule.durationHelp.label}
                heading={schedule.durationHelp.heading}
                columns={schedule.durationHelp.columns}
                rows={schedule.durationHelp.rows}
                testID="schedule-help-me-pick"
              />
            )}
          </Screen>
        );
      }}
    </QueryBoundary>
  );
}

/**
 * FIGMA_PENDING copy for a day/daypart/duration the server offers no start time for. Deliberately
 * says nothing about the cause: only the server knows whether it is the 10 PM finish rule, cook
 * supply, or the day simply being nearly over.
 */

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
  /**
   * `289:6218` / `34:3046` — every section is px 4 / py 6. The 16pt gutter comes from `Screen`'s
   * own padding, so a label lands at x 20.
   *
   * No `gap` here: `SectionHeader` already carries the frame's 6pt label-to-content margin, and
   * adding it again drew 12.
   */
  section: {
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
  },
  /** `275:4715` / `275:5187` — the banner sits in the 16pt column, 16pt below the safe area. */
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  /** `34:3045` — the block opens 16 under the header and spaces its sections at 21. */
  body: { paddingTop: lightTheme.space.lg, gap: 21 },
  /** The cells pad the row gap onto their bottom, so the LAST row's padding is pulled back off. */
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -HALF_GAP,
    marginBottom: -lightTheme.space.sm,
  },
  gridEmpty: { marginBottom: 0 },
  durationCell: {
    width: '33.33%',
    paddingHorizontal: HALF_GAP,
    paddingBottom: lightTheme.space.sm,
  },
  /** `275:4177` — the bar sits 6.5 from the top of the block and the link 12.5 below it. */
  footer: { gap: lightTheme.space.md },
  underline: { textDecorationLine: 'underline' },
});
