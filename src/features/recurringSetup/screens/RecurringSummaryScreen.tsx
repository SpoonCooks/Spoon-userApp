import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAndroidBackHandler } from '@core/navigation';
import { Screen, ScreenHeader, Text, useBottomGutter } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import {
  CALENDAR_REMOVE_ICON,
  COOK_VISIT_ICON,
  DURATION_PHOTOS,
  PLUS_ICON,
  RESTART_ICON,
  START_TIME_PHOTOS,
  TIME_OF_DAY_PHOTOS,
  TRASH_ICON,
} from '../art';
import { HelpFab } from '../components/HelpFab';
import { ManagePlansSheet } from '../components/ManagePlansSheet';
import { DialogDays, DialogRows, DialogTags, RecurringDialog } from '../components/RecurringDialog';
import { RecurringFooter } from '../components/RecurringFooter';
import { SummaryCalendar, summaryWindow } from '../components/SummaryCalendar';
import { UndoBanner } from '../components/UndoBanner';
import {
  TIME_OF_DAY_BANDS,
  durationMinutes,
  formatStartTime,
  ordinal,
  planDetail,
  visitDays,
  visitDetail,
  visitTags,
} from '../data';
import { useRecurringPlanning } from '../planning';
import type { RecurringPlanDraft } from '../types';

/**
 * Recurring setup — Summary. Figma `1079:3207` (view), `494:1039` (edit), `568:2909` (after a
 * delete) and `542:1442` (the bin's sheet) — Spoon — User.
 *
 * Every plan and visit in one place. A two-layer switcher: Plan tabs on top (the active one taller,
 * its concave feet merging it into the gold panel below), then that plan's visits as pills. Under
 * it the plan's dates as a month calendar (`SummaryCalendar`), then the visit's three photo tiles —
 * time of day, duration, start time — each picked by the value chosen and captioned with it ABOVE
 * the photo. The content scrolls beneath the pinned "Book Now".
 *
 * Per the frames' notes:
 *  - A plan's first booking is its "1st Visit"; the visit "+" adds another visit on the same days.
 *  - The plan "+" goes back to the day flow with a blank calendar for the next plan, exactly like
 *    the "+" on the calendar.
 *  - The pencil (`494:1039`, note `513:1288`) puts the dates into edit mode: it sits on a gold
 *    disc, the header gains a back chevron, the footer goes and the plan's dates jiggle as buttons.
 *    Tapping one opens Edit date for it; only one date is edited at a time. The chevron, the
 *    pencil again or moving to another plan or visit leaves edit mode.
 *  - The bin (`542:1442`) opens "Manage your plans": delete the visit shown, delete its plan, or
 *    start over — each confirmed in a dialog. After a delete the Summary shows an undo banner
 *    (`568:2909`).
 *
 * `568:2909` and `542:1442` are older than the view frame (they still draw the "Selected days"
 * strip, photos above their captions and no calendar): they decide the banner's and the sheet's
 * look, `1079:3207` / `494:1039` the body.
 *
 * The view frame's header (`1079:3209`, `Nav header 3`) has no back chevron — the title sits on
 * the gutter — so `onBack` is reached by Android's hardware back only; the edit frame's header
 * (`Nav header 2`) has the chevron and no bin.
 */
export interface RecurringSummaryScreenProps {
  readonly plans: readonly RecurringPlanDraft[];
  readonly planIndex: number;
  readonly visitIndex: number;
  readonly onSelect: (planIndex: number, visitIndex: number) => void;
  readonly onAddPlan: () => void;
  readonly onAddVisit: (planIndex: number) => void;
  /** Edit mode's date tap: edit that one date of the visit shown. */
  readonly onEditDate: (planIndex: number, visitIndex: number, dayId: string) => void;
  /** "Delete visit" confirmed (`542:1534`). */
  readonly onDeleteVisit: (planIndex: number, visitIndex: number) => void;
  /** "Delete plan" confirmed (`542:1611`). */
  readonly onDeletePlan: (planIndex: number) => void;
  /** "Start over" confirmed (`542:1688`). */
  readonly onStartOver: () => void;
  /** `567:1030` — what the last delete took, with Undo; omitted when there is nothing to undo. */
  readonly undo?:
    | {
        readonly message: string;
        readonly onUndo: () => void;
        readonly onDismiss: () => void;
      }
    | undefined;
  readonly onBook: () => void;
  /** Android hardware back; the view header draws no chevron. */
  readonly onBack: () => void;
  /** The day the window is counted from. Defaults to now; the dev preview pins Figma's date. */
  readonly today?: Date;
  /** Opens with the dates already in edit mode (`494:1039`): the dev preview's way to see it. */
  readonly initialEditing?: boolean;
  /** Opens with the bin's sheet showing (`542:1442`): the dev preview's way to see it. */
  readonly initialManaging?: 'sheet' | 'visit' | 'plan' | 'startOver';
  readonly testID?: string;
}

export function RecurringSummaryScreen({
  plans,
  planIndex,
  visitIndex,
  onSelect,
  onAddPlan,
  onAddVisit,
  onEditDate,
  onDeleteVisit,
  onDeletePlan,
  onStartOver,
  undo,
  onBook,
  onBack,
  today,
  initialEditing = false,
  initialManaging,
  testID = 'recurring-summary-screen',
}: RecurringSummaryScreenProps) {
  const plan = plans[planIndex];
  const visit = plan?.visits[visitIndex];
  const minutes = visit === undefined ? 0 : durationMinutes(visit.durationId);
  const band = TIME_OF_DAY_BANDS.find((entry) => entry.id === visit?.timeOfDay);
  // Edit mode belongs to the plan and visit it was turned on for, so switching tabs leaves it.
  const shown = `${planIndex}:${visitIndex}`;
  const [editingFor, setEditingFor] = useState<string | null>(initialEditing ? shown : null);
  const editing = editingFor === shown;
  /** The bin's sheet (`542:1442`), or the confirm dialog one of its rows opened. */
  const [managing, setManaging] = useState<'sheet' | 'visit' | 'plan' | 'startOver' | null>(
    initialManaging ?? null,
  );
  const { windowStartId } = useRecurringPlanning();
  const todayKey = today?.getTime();
  /** One window for every plan (`1079:3220`), so the calendar does not move between tabs. */
  const range = useMemo(
    () =>
      summaryWindow(
        plans.flatMap((entry) => entry.dayIds),
        windowStartId,
        todayKey === undefined ? undefined : new Date(todayKey),
      ),
    [plans, windowStartId, todayKey],
  );
  /** `494:1039` — with no footer the content ends at the home indicator, whose gutter is 34. */
  const homeGutter = useBottomGutter(HOME_INDICATOR);
  const visitCount = plans.reduce((total, entry) => total + entry.visits.length, 0);
  const planCount = plans.length;
  const hasOtherVisit = (plan?.visits.length ?? 0) > 1;
  /** `542:1531` — "all 2 plans and 3 visits"; "1 plan and 2 visits" when there is only one. */
  const everything = `${planCount > 1 ? 'all ' : ''}${planCount} plan${planCount === 1 ? '' : 's'} and ${visitCount} visit${visitCount === 1 ? '' : 's'}`;
  /** The confirm dialog a sheet row opened, or null. */
  const manageDialog = (): ReactNode => {
    const close = () => setManaging(null);
    if (managing === 'visit' && plan !== undefined && visit !== undefined) {
      return (
        <RecurringDialog
          visible
          icon={COOK_VISIT_ICON}
          title={`Delete ${ordinal(visitIndex + 1)} Visit from Plan ${planIndex + 1}?`}
          keepLabel="Keep visit"
          confirmLabel="Delete visit"
          onKeep={close}
          onConfirm={() => {
            close();
            onDeleteVisit(planIndex, visitIndex);
          }}
          testID={`${testID}-delete-visit`}
        >
          <DialogDays dayIds={visitDays(plan.dayIds, visit)} />
          <DialogTags tags={visitTags(visit)} />
        </RecurringDialog>
      );
    }
    if (managing === 'plan' && plan !== undefined) {
      return (
        <RecurringDialog
          visible
          icon={CALENDAR_REMOVE_ICON}
          title={`Delete Plan ${planIndex + 1}?`}
          keepLabel="Keep plan"
          confirmLabel="Delete plan"
          onKeep={close}
          onConfirm={() => {
            close();
            onDeletePlan(planIndex);
          }}
          testID={`${testID}-delete-plan`}
        >
          <DialogDays dayIds={plan.dayIds} />
          <DialogRows
            rows={plan.visits.map((entry, index) => ({
              label: `${ordinal(index + 1)} Visit`,
              detail: visitDetail(entry),
            }))}
          />
        </RecurringDialog>
      );
    }
    if (managing === 'startOver') {
      return (
        <RecurringDialog
          visible
          icon={RESTART_ICON}
          title="Start over?"
          body={`You'll lose ${everything}, then go back to choosing days, as if booking for the first time.`}
          keepLabel="Keep plans"
          confirmLabel="Start over"
          onKeep={close}
          onConfirm={() => {
            close();
            onStartOver();
          }}
          testID={`${testID}-start-over`}
        >
          <DialogRows
            rows={plans.map((entry, index) => ({
              label: `Plan ${index + 1}`,
              detail: planDetail(entry),
            }))}
          />
        </RecurringDialog>
      );
    }
    return null;
  };
  useAndroidBackHandler(() => {
    if (editing) setEditingFor(null);
    else onBack();
    return true;
  });

  const trash = (
    <Pressable
      onPress={() => setManaging('sheet')}
      accessibilityRole="button"
      accessibilityLabel="Manage your plans"
      style={styles.trash}
      testID={`${testID}-delete`}
    >
      <Image source={TRASH_ICON} style={styles.icon24} />
    </Pressable>
  );

  return (
    <Screen
      tone="plain"
      padded={false}
      testID={testID}
      header={
        <View>
          {editing ? (
            // `494:1039` — `Nav header 2`: the chevron leaves edit mode; there is no bin.
            <ScreenHeader
              density="nav"
              title="Summary"
              onBack={() => setEditingFor(null)}
              testID={`${testID}-header`}
            />
          ) : (
            <ScreenHeader
              density="nav"
              title="Summary"
              trailing={trash}
              testID={`${testID}-header`}
            />
          )}
          <PlanSwitcher
            plans={plans}
            planIndex={planIndex}
            visitIndex={visitIndex}
            onSelect={onSelect}
            onAddPlan={onAddPlan}
            onAddVisit={() => onAddVisit(planIndex)}
            testID={`${testID}-switcher`}
          />
        </View>
      }
      footer={
        editing ? undefined : (
          <RecurringFooter label="Book Now" onPress={onBook} testID={`${testID}-book`} />
        )
      }
    >
      <View style={styles.region}>
        <View style={[styles.region, editing ? { paddingBottom: homeGutter } : null]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {undo === undefined ? null : (
              <UndoBanner
                message={undo.message}
                onUndo={undo.onUndo}
                onDismiss={undo.onDismiss}
                testID={`${testID}-undo`}
              />
            )}
            {plan === undefined ? null : (
              <SummaryCalendar
                range={range}
                selectedIds={visit === undefined ? plan.dayIds : visitDays(plan.dayIds, visit)}
                title={`Plan ${planIndex + 1} selected dates`}
                onEdit={() => setEditingFor(editing ? null : shown)}
                onPickDay={
                  editing
                    ? (dayId: string) => {
                        setEditingFor(null);
                        onEditDate(planIndex, visitIndex, dayId);
                      }
                    : undefined
                }
                testID={`${testID}-days`}
              />
            )}
            {visit === undefined ? null : (
              <View style={styles.details}>
                <View style={styles.captions}>
                  <Text
                    variant="emphasis"
                    color="textPrimary"
                    align="center"
                    style={styles.caption}
                  >
                    {band?.label ?? ''}
                  </Text>
                  <Text
                    variant="emphasis"
                    color="textPrimary"
                    align="center"
                    style={styles.caption}
                  >
                    {minutes} minutes
                  </Text>
                  <Text
                    variant="emphasis"
                    color="textPrimary"
                    align="center"
                    style={styles.caption}
                  >
                    {formatStartTime(visit.startMinutes)}
                  </Text>
                </View>
                <View style={styles.tiles}>
                  <Image
                    source={TIME_OF_DAY_PHOTOS[visit.timeOfDay]}
                    style={styles.tile}
                    resizeMode="cover"
                  />
                  {DURATION_PHOTOS[minutes] === undefined ? (
                    <View style={styles.tile} />
                  ) : (
                    <Image
                      source={DURATION_PHOTOS[minutes]}
                      style={styles.tile}
                      resizeMode="cover"
                    />
                  )}
                  <Image
                    source={START_TIME_PHOTOS[visit.timeOfDay]}
                    style={styles.tile}
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
        {/* `1302:2638` floats 12 above the footer; `1302:2660` has no footer and floats 20 above
            the home indicator. */}
        <HelpFab {...(editing ? { bottom: homeGutter + HELP_ABOVE_HOME } : {})} />
      </View>
      <ManagePlansSheet
        visible={managing === 'sheet'}
        visitLine={
          hasOtherVisit ? `${ordinal(visitIndex + 1)} Visit · Plan ${planIndex + 1}` : undefined
        }
        planLine={`Plan ${planIndex + 1} · ${plan?.visits.length ?? 0} visit${(plan?.visits.length ?? 0) === 1 ? '' : 's'}`}
        startOverLine={`Deletes ${everything} and takes you back to choosing days`}
        onDeleteVisit={() => setManaging('visit')}
        onDeletePlan={() => setManaging('plan')}
        onStartOver={() => setManaging('startOver')}
        onClose={() => setManaging(null)}
        testID={`${testID}-manage`}
      />
      {manageDialog()}
    </Screen>
  );
}

interface PlanSwitcherProps {
  readonly plans: readonly RecurringPlanDraft[];
  readonly planIndex: number;
  readonly visitIndex: number;
  readonly onSelect: (planIndex: number, visitIndex: number) => void;
  readonly onAddPlan: () => void;
  readonly onAddVisit: () => void;
  readonly testID: string;
}

/** `358:8189` — "Plan switcher · 2+Add": a `#FFF7CC` band of Plan tabs over the gold Visits panel. */
function PlanSwitcher({
  plans,
  planIndex,
  visitIndex,
  onSelect,
  onAddPlan,
  onAddVisit,
  testID,
}: PlanSwitcherProps) {
  const visits = plans[planIndex]?.visits ?? [];
  return (
    <View style={styles.switcher} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.planTabs}
      >
        {plans.map((plan, index) =>
          index === planIndex ? (
            <ActivePlanTab key={plan.id} label={`Plan ${index + 1}`} />
          ) : (
            <Pressable
              key={plan.id}
              onPress={() => onSelect(index, 0)}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              style={styles.planTab}
              testID={`${testID}-plan-${index + 1}`}
            >
              <Text variant="headingBold" color="textSubdued">
                Plan {index + 1}
              </Text>
            </Pressable>
          ),
        )}
        <AddPlanTab onPress={onAddPlan} testID={`${testID}-add-plan`} />
      </ScrollView>
      <View style={styles.visitsPanel}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.visitsScroll}
          contentContainerStyle={styles.visits}
        >
          {visits.map((_, index) => {
            const active = index === visitIndex;
            return (
              <Pressable
                key={`visit-${index}`}
                onPress={() => onSelect(planIndex, index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.visitTab, active ? styles.visitTabActive : null]}
                testID={`${testID}-visit-${index + 1}`}
              >
                <Text variant="headingBold" color={active ? 'textPrimary' : 'textSubdued'}>
                  {ordinal(index + 1)} Visit
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          onPress={onAddVisit}
          accessibilityRole="button"
          accessibilityLabel="Add another visit"
          hitSlop={6}
          style={styles.addVisit}
          testID={`${testID}-add-visit`}
        >
          <Image source={PLUS_ICON} style={styles.icon16} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * `358:8192` — the active Plan tab: 52 tall, a `#FFDE33` → `#FFD600` fall, and two 10pt concave
 * feet (`357:329` / `357:330`) that flare its base into the panel. Each foot is the panel gold
 * with a quarter-circle of the band colour cut from its outer top corner — the exact r = 10 arc
 * Figma's foot paths draw.
 */
function ActivePlanTab({ label }: { readonly label: string }) {
  const gradient = lightTheme.gradients.planTabActive;
  return (
    <View style={styles.activeTab} accessibilityRole="tab" accessibilityState={{ selected: true }}>
      <LinearGradient
        colors={gradient.colors}
        locations={gradient.locations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.activeTabFill]}
      />
      <Text variant="headingBold" color="textPrimary">
        {label}
      </Text>
      <View style={[styles.foot, styles.footLeft]}>
        <View style={[styles.footCut, styles.footCutLeft]} />
      </View>
      <View style={[styles.foot, styles.footRight]}>
        <View style={[styles.footCut, styles.footCutRight]} />
      </View>
    </View>
  );
}

/**
 * `358:8193` — "Top tab/Add": 52 × 44, a dashed `#FFD600` outline on three sides (none along the
 * bottom), holding a 28pt `#FFE666` disc with the plus. The outline is drawn on all four sides and
 * its bottom edge clipped away, since a dashed border must be uniform on iOS.
 */
function AddPlanTab({
  onPress,
  testID,
}: {
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add another plan"
      style={styles.addPlanTab}
      testID={testID}
    >
      <View style={styles.addPlanOutline} />
      <View style={styles.addPlanDisc}>
        <Image source={PLUS_ICON} style={styles.icon16} />
      </View>
    </Pressable>
  );
}

const FOOT = 10;
/** The least a Plan tab shrinks to once the row is full: its label and the 20pt padding. */
const PLAN_TAB_MIN = 96;
/** `43:79` — the home indicator's band, which the footer-less edit frame leaves clear. */
const HOME_INDICATOR = 34;
/** `1302:2660` — the help button's foot sits 54 up: 34 of indicator and 20 clear. */
const HELP_ABOVE_HOME = 20;

const styles = StyleSheet.create({
  /** `543:2419` — the bin's 44pt hit area sits 6 from the frame's right edge, past the gutter. */
  trash: {
    marginLeft: 'auto',
    marginRight: -10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon24: { width: 24, height: 24 },
  icon16: { width: 16, height: 16 },
  /** `358:8189` — the switcher spans the full frame width on `#FFF7CC`. */
  switcher: { backgroundColor: lightTheme.colors.surfaceAccent },
  /** `358:8190` — pt 16, px 12, 12 apart, tabs sitting on the panel. */
  planTabs: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: lightTheme.space.md,
    paddingTop: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.md,
  },
  /** `754:3535` — an unselected tab: 44 tall, px 20, `#FFEF99`, top corners 16, sharing the row. */
  planTab: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: PLAN_TAB_MIN,
    height: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    borderTopLeftRadius: lightTheme.radius.md,
    borderTopRightRadius: lightTheme.radius.md,
  },
  activeTab: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: PLAN_TAB_MIN,
    height: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabFill: {
    borderTopLeftRadius: lightTheme.radius.md,
    borderTopRightRadius: lightTheme.radius.md,
  },
  foot: {
    position: 'absolute',
    bottom: 0,
    width: FOOT,
    height: FOOT,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceBrand,
  },
  footLeft: { left: -FOOT },
  footRight: { right: -FOOT },
  footCut: {
    position: 'absolute',
    width: FOOT * 2,
    height: FOOT * 2,
    borderRadius: FOOT,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  footCutLeft: { top: -FOOT, left: -FOOT },
  footCutRight: { top: -FOOT, right: -FOOT },
  addPlanTab: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addPlanOutline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.surfaceBrand,
    borderTopLeftRadius: lightTheme.radius.md,
    borderTopRightRadius: lightTheme.radius.md,
  },
  addPlanDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceBrandTint,
  },
  /** `358:8194` — the gold panel: pt 12, pb 14, px 10. */
  visitsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingTop: lightTheme.space.md,
    paddingBottom: 14,
    paddingHorizontal: 10,
    backgroundColor: lightTheme.colors.surfaceBrand,
  },
  visitsScroll: { flex: 1 },
  visits: { flexGrow: 1, gap: lightTheme.space.sm },
  /** `360:8578` — a pill sub-tab: px 14, py 8, sharing the row; active is `#FFF7CC`. */
  visitTab: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: lightTheme.space.sm,
    alignItems: 'center',
    borderRadius: lightTheme.radius.pill,
  },
  visitTabActive: { backgroundColor: lightTheme.colors.surfaceAccent },
  /** `360:8583` — a 32pt `#FFE666` disc. */
  addVisit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceBrandTint,
  },
  /** The content region: it ends at the footer's top edge, and the help button floats in it. */
  region: { flex: 1 },
  /** `1079:3211` — p 16, 24 between blocks. */
  content: { padding: lightTheme.space.lg, gap: lightTheme.space.xl },
  /** `1079:3221` — 8 between the captions and their tiles. */
  details: { gap: lightTheme.space.sm },
  /** `1079:3226` — three tiles, 16 apart, 185 tall at an 8pt radius. */
  tiles: { flexDirection: 'row', gap: lightTheme.space.lg },
  tile: {
    flex: 1,
    height: 185,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** `1079:3222` — three columns 15.5 apart, above the tiles. */
  captions: { flexDirection: 'row', gap: 15.5 },
  caption: { flex: 1 },
});
