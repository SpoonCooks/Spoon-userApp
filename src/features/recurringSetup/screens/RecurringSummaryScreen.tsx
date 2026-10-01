import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAndroidBackHandler } from '@core/navigation';
import { Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import {
  DURATION_PHOTOS,
  PLUS_ICON,
  START_TIME_PHOTOS,
  TIME_OF_DAY_PHOTOS,
  TRASH_ICON,
} from '../art';
import { RecurringFooter } from '../components/RecurringFooter';
import { SelectedDays } from '../components/SelectedDays';
import { TIME_OF_DAY_BANDS, durationMinutes, formatStartTime, ordinal, visitDays } from '../data';
import type { RecurringPlanDraft } from '../types';

/**
 * Recurring setup — Summary. Figma `316:4728` (Spoon — User).
 *
 * Every plan and visit in one place. A two-layer switcher: Plan tabs on top (the active one taller,
 * its concave feet merging it into the gold panel below), then that plan's visits as pills. Under
 * it the visit's days and three photo tiles — time of day, duration, start time — each picked by
 * the value chosen, captioned with it.
 *
 * Per the frame's note:
 *  - A plan's first booking is its "1st Visit"; the visit "+" adds another visit on the same days.
 *  - The plan "+" goes back to the day flow with a blank calendar for the next plan, exactly like
 *    the "+" on the calendar.
 *  - The pencil edits the days of the visit shown — the plan's own days on its 1st visit; the bin
 *    removes the visit shown, or the plan if it is that plan's only visit.
 *
 * The frame's header (`542:1341`, `Nav header 3`) has no back chevron — the title sits on the
 * gutter — so `onBack` is reached by Android's hardware back only.
 */
export interface RecurringSummaryScreenProps {
  readonly plans: readonly RecurringPlanDraft[];
  readonly planIndex: number;
  readonly visitIndex: number;
  readonly onSelect: (planIndex: number, visitIndex: number) => void;
  readonly onAddPlan: () => void;
  readonly onAddVisit: (planIndex: number) => void;
  /** The pencil: the plan's days on a 1st visit, the visit's own days on a later one. */
  readonly onEditDays: (planIndex: number, visitIndex: number) => void;
  readonly onDelete: (planIndex: number, visitIndex: number) => void;
  readonly onBook: () => void;
  /** Android hardware back; the header draws no chevron. */
  readonly onBack: () => void;
  readonly testID?: string;
}

export function RecurringSummaryScreen({
  plans,
  planIndex,
  visitIndex,
  onSelect,
  onAddPlan,
  onAddVisit,
  onEditDays,
  onDelete,
  onBook,
  onBack,
  testID = 'recurring-summary-screen',
}: RecurringSummaryScreenProps) {
  const plan = plans[planIndex];
  const visit = plan?.visits[visitIndex];
  const minutes = visit === undefined ? 0 : durationMinutes(visit.durationId);
  const band = TIME_OF_DAY_BANDS.find((entry) => entry.id === visit?.timeOfDay);
  useAndroidBackHandler(() => {
    onBack();
    return true;
  });

  return (
    <Screen
      tone="plain"
      padded={false}
      testID={testID}
      header={
        <View>
          <ScreenHeader
            density="nav"
            title="Summary"
            trailing={
              <Pressable
                onPress={() => onDelete(planIndex, visitIndex)}
                accessibilityRole="button"
                accessibilityLabel={
                  (plan?.visits.length ?? 0) > 1 ? 'Delete this visit' : 'Delete this plan'
                }
                style={styles.trash}
                testID={`${testID}-delete`}
              >
                <Image source={TRASH_ICON} style={styles.icon24} />
              </Pressable>
            }
            testID={`${testID}-header`}
          />
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
        <RecurringFooter
          layout="pill"
          label="Book Now"
          onPress={onBook}
          testID={`${testID}-book`}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {plan === undefined ? null : (
          <SelectedDays
            dayIds={visit === undefined ? plan.dayIds : visitDays(plan.dayIds, visit)}
            onEdit={() => onEditDays(planIndex, visitIndex)}
            testID={`${testID}-days`}
          />
        )}
        {visit === undefined ? null : (
          <View style={styles.details}>
            <View style={styles.tiles}>
              <Image
                source={TIME_OF_DAY_PHOTOS[visit.timeOfDay]}
                style={styles.tile}
                resizeMode="cover"
              />
              {DURATION_PHOTOS[minutes] === undefined ? (
                <View style={styles.tile} />
              ) : (
                <Image source={DURATION_PHOTOS[minutes]} style={styles.tile} resizeMode="cover" />
              )}
              <Image
                source={START_TIME_PHOTOS[visit.timeOfDay]}
                style={styles.tile}
                resizeMode="cover"
              />
            </View>
            <View style={styles.captions}>
              <Text
                variant="bodyLargeStrong"
                color="textPrimary"
                align="center"
                style={styles.caption}
              >
                {band?.label ?? ''}
              </Text>
              <Text
                variant="bodyLargeStrong"
                color="textPrimary"
                align="center"
                style={styles.caption}
              >
                {minutes} minutes
              </Text>
              <Text
                variant="bodyLargeStrong"
                color="textPrimary"
                align="center"
                style={styles.caption}
              >
                {formatStartTime(visit.startMinutes)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: lightTheme.space.md,
    paddingTop: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.md,
  },
  /** `358:8191` — an unselected tab: 44 tall, px 20, `#FFEF99`, top corners 16. */
  planTab: {
    height: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    borderTopLeftRadius: lightTheme.radius.md,
    borderTopRightRadius: lightTheme.radius.md,
  },
  activeTab: {
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
  /** `316:4731` — p 16, 24 between blocks. */
  content: { padding: lightTheme.space.lg, gap: lightTheme.space.xl },
  /** `373:8742` — 8 between the tiles and their captions. */
  details: { gap: lightTheme.space.sm },
  /** `316:4762` — three tiles, 16 apart, 185 tall at an 8pt radius. */
  tiles: { flexDirection: 'row', gap: lightTheme.space.lg },
  tile: {
    flex: 1,
    height: 185,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  captions: { flexDirection: 'row', gap: 15.5 },
  caption: { flex: 1 },
});
