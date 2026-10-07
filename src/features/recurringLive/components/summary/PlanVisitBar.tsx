import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import type { SummaryPlan, SummaryVisit } from '../../data/summary';
import { SUMMARY_PLUS_GLYPH, SUMMARY_TAB_FOOT_LEFT, SUMMARY_TAB_FOOT_RIGHT } from './assets';

/**
 * `Plan + visit bar` — Figma `1017:436`, an instance of `754:3533` ("Plan switcher · 2+Add").
 *
 * Two layers on `#FFF7CC`. The PLANS row (pt 16 / px 12, 12 gap, bottom-aligned): idle tabs are
 * 44pt `#FFEF99` with a 60 % label; the active tab is 52pt, `#FFDE33` → `#FFD600` by 60 %, with
 * 10pt concave feet that merge it into the panel below; and a 52 × 44 dashed "add" tab closes the
 * row. The VISITS panel is `#FFD600` (pt 12 / pb 14 / px 10): pill sub-tabs that share the width,
 * the active one on `#FFF7CC`, then a 32pt plus disc.
 */
export interface PlanVisitBarProps {
  readonly plans: readonly SummaryPlan[];
  readonly activePlanId: string;
  readonly visits: readonly SummaryVisit[];
  readonly activeVisitId: string;
  readonly onPlanChange?: (planId: string) => void;
  readonly onVisitChange?: (visitId: string) => void;
  readonly onAddPlan?: (() => void) | undefined;
  readonly onAddVisit?: (() => void) | undefined;
  readonly testID?: string;
}

export function PlanVisitBar({
  plans,
  activePlanId,
  visits,
  activeVisitId,
  onPlanChange,
  onVisitChange,
  onAddPlan,
  onAddVisit,
  testID = 'summary-plan-visit-bar',
}: PlanVisitBarProps) {
  return (
    <View style={styles.bar} testID={testID}>
      <View style={styles.plans} accessibilityRole="tablist">
        {plans.map((plan) => {
          const active = plan.id === activePlanId;
          return (
            <Pressable
              key={plan.id}
              onPress={() => onPlanChange?.(plan.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.planTab, active ? styles.planTabActive : styles.planTabIdle]}
              testID={`${testID}-plan-${plan.id}`}
            >
              {active ? (
                <>
                  <LinearGradient
                    colors={[lightTheme.colors.surfaceSummaryTabLead, lightTheme.colors.surfaceCta]}
                    locations={[0, 0.6]}
                    style={[StyleSheet.absoluteFill, styles.planTabShape]}
                  />
                  <Image source={SUMMARY_TAB_FOOT_LEFT} style={[styles.foot, styles.footLeft]} />
                  <Image source={SUMMARY_TAB_FOOT_RIGHT} style={[styles.foot, styles.footRight]} />
                </>
              ) : null}
              <Text
                variant="spoonButton"
                color={active ? 'textPrimary' : 'textSecondarySoft'}
                numberOfLines={1}
              >
                {plan.label}
              </Text>
            </Pressable>
          );
        })}
        {onAddPlan === undefined ? null : (
          <Pressable
            onPress={onAddPlan}
            accessibilityRole="button"
            accessibilityLabel="Add plan"
            style={styles.addTab}
            testID={`${testID}-add-plan`}
          >
            {/* `754:3538` — dashed on the left, top and right only. RN can't dash individual
              sides, so a fully dashed box runs 2pt past the tab and the clip drops its base. */}
            <View style={styles.addTabOutline} />
            <View style={[styles.plusDisc, styles.plusDiscSm]}>
              <Image source={SUMMARY_PLUS_GLYPH} style={styles.plusGlyph} />
            </View>
          </Pressable>
        )}
      </View>

      <View style={styles.visitsPanel}>
        <View style={styles.visits} accessibilityRole="tablist">
          {visits.map((visit) => {
            const active = visit.id === activeVisitId;
            return (
              <Pressable
                key={visit.id}
                onPress={() => onVisitChange?.(visit.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.visitTab, active ? styles.visitTabActive : null]}
                testID={`${testID}-visit-${visit.id}`}
              >
                <Text
                  variant="spoonButton"
                  color={active ? 'textPrimary' : 'textSecondarySoft'}
                  numberOfLines={1}
                >
                  {visit.label}
                </Text>
              </Pressable>
            );
          })}
          {onAddVisit === undefined ? null : (
            <Pressable
              onPress={onAddVisit}
              accessibilityRole="button"
              accessibilityLabel="Add visit"
              style={[styles.plusDisc, styles.plusDiscMd]}
              testID={`${testID}-add-visit`}
            >
              <Image source={SUMMARY_PLUS_GLYPH} style={styles.plusGlyph} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const TAB_RADIUS = lightTheme.radius.md;
const FOOT = 10;

const styles = StyleSheet.create({
  bar: { backgroundColor: lightTheme.colors.surfaceAccent },
  plans: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: lightTheme.space.md,
    paddingTop: lightTheme.space.lg,
    paddingHorizontal: lightTheme.space.md,
  },
  planTabShape: { borderTopLeftRadius: TAB_RADIUS, borderTopRightRadius: TAB_RADIUS },
  planTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderTopLeftRadius: TAB_RADIUS,
    borderTopRightRadius: TAB_RADIUS,
  },
  planTabIdle: { height: 44, backgroundColor: lightTheme.colors.surfaceAccentStrong },
  planTabActive: { height: 52 },
  /** `357:329` / `357:330` — 10pt feet hanging just outside the tab's bottom corners. */
  foot: { position: 'absolute', bottom: 0, width: FOOT, height: FOOT },
  footLeft: { left: -FOOT },
  footRight: { right: -FOOT },
  addTab: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: TAB_RADIUS,
    borderTopRightRadius: TAB_RADIUS,
  },
  addTabOutline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.surfaceCta,
    borderTopLeftRadius: TAB_RADIUS,
    borderTopRightRadius: TAB_RADIUS,
  },
  plusDisc: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  /** `353:114` — 28pt in the add tab. */
  plusDiscSm: { width: 28, height: 28, borderRadius: 14 },
  /** `754:3563` — 32pt at the end of the visits row. */
  plusDiscMd: { width: 32, height: 32, borderRadius: lightTheme.radius.md },
  plusGlyph: { width: 16, height: 16 },
  visitsPanel: {
    paddingTop: lightTheme.space.md,
    paddingBottom: 14,
    paddingHorizontal: lightTheme.space.s10,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  visits: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.sm },
  visitTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.pill,
  },
  visitTabActive: { backgroundColor: lightTheme.colors.surfaceAccent },
});
