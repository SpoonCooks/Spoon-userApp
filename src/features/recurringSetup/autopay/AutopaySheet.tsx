import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Button, Text, useBottomGutter } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import {
  AUTOPAY_CHECK_GLYPH,
  AUTOPAY_CHEVRON_GLYPH,
  AUTOPAY_CLOSE_GLYPH,
  AUTOPAY_EXCLAMATION_GLYPH,
  AUTOPAY_LOCK_GLYPH,
  AUTOPAY_RECURRING_GLYPH,
  AUTOPAY_TIME_GLYPH,
} from './assets';
import { countdownLabel } from './machine';
import type { AutopayState } from './machine';
import { VISIBLE_UPI_APPS } from './upiApps';
import type { UpiApp } from './upiApps';

/**
 * The UPI Autopay sheet over the Summary — Figma `cCQlzTeiObQkpVBzwI8mZi`, page "Recurring:
 * booking creation":
 *
 *   choose      `2316:3558` Choose UPI app      (sheet `2316:3575`)
 *   creating    `2316:3558` with the picked row busy (no frame)
 *   waiting     `2317:3577` Waiting for approval
 *   left        `2317:3667` Left without approving
 *   failed      `2317:3753` Didn't go through
 *   confirming  `2317:3839` Still confirming
 *   active      `2317:4009` Active
 *   noApp       NO FRAME (removed with "Enter UPI ID instead"): the Left frame's layout, telling the
 *               customer to install PhonePe or Google Pay.
 *
 * Chrome, all states: white, top corners 24, pt 8 / px 16 / pb 40 (the home indicator's gutter
 * when deeper), `Elevation/2`, a 40 × 4 `color/border/strong` grabber, over a 40 % scrim (the
 * frame's 12pt backdrop blur is not drawn: the app has no blur, as `RecurringSheet` notes).
 * Choose: 16pt between blocks, left-aligned. Status states: 12pt, centred, and the sheet is 474
 * tall (`2317:3578` and siblings), the content hugging its top.
 *
 * Copy follows the frames with the user's decisions: no "Enter UPI ID instead" anywhere, the ₹1
 * authorisation (refunded) where the frame says "Nothing to pay today", 5-7 working days for a
 * refund, and no em dash.
 */

/** `2317:3578` — the status sheets' drawn height (y 400 → 874). */
const STATUS_SHEET_MIN_HEIGHT = 474;
/** `2316:3575` — pb 40, the frame's own home-indicator band. */
const SHEET_BOTTOM_PAD = lightTheme.space.s40;
const SHEET_OFFSET = 900;
const ANIMATION_MS = 220;

export interface AutopaySheetSummary {
  /** "2 plans · 12 visits". */
  readonly plansLine: string;
  /** "Charged 3 hrs before your first visit of the day". */
  readonly chargeLine: string;
  /** "₹299" — the per-visit price before tax. */
  readonly price: string;
  /** "₹299 + 5% tax" (Active's "Per visit"). */
  readonly priceWithTax: string;
  /** "₹1 to approve, refunded · up to ₹1,000 per charge". */
  readonly subtitle: string;
}

export interface AutopaySheetProps {
  readonly visible: boolean;
  readonly state: AutopayState;
  readonly summary: AutopaySheetSummary;
  /** Sorted, the last used first. */
  readonly apps: readonly UpiApp[];
  readonly lastUsedId: string | null;
  /** "More UPI apps" pressed: every app shows. */
  readonly showAllApps: boolean;
  /** Clock for the expiry chip. */
  readonly now: number;
  readonly onPick: (app: UpiApp) => void;
  readonly onMoreApps: () => void;
  /** Back / scrim on the list: closes the sheet, the booking stays waiting for approval. */
  readonly onClose: () => void;
  readonly onOpenAgain: () => void;
  readonly onCancel: () => void;
  readonly onTryAgain: () => void;
  readonly onChooseAnother: () => void;
  readonly onBackToHome: () => void;
  readonly onViewPlan: () => void;
  /** No UPI app found → look again. */
  readonly onRescan: () => void;
  readonly testID?: string;
}

export function AutopaySheet(props: AutopaySheetProps) {
  const { visible, state, testID = 'autopay-sheet' } = props;
  const bottom = useBottomGutter(SHEET_BOTTOM_PAD);
  const [translateY] = useState(() => new Animated.Value(SHEET_OFFSET));
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    const animation = Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_OFFSET,
      duration: ANIMATION_MS,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, translateY]);

  if (!visible && !mounted) return null;

  const list = state.kind === 'choose' || state.kind === 'creating';
  // Only the list, and the list's own retry states, may be dismissed by the scrim or back: an open
  // request is cancelled with its own button, and an outcome is acknowledged with one.
  const dismiss = list ? props.onClose : state.kind === 'waiting' ? props.onCancel : undefined;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss ?? (() => undefined)}
      testID={`${testID}-modal`}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          disabled={dismiss === undefined}
          accessibilityRole="button"
          accessibilityLabel="Close"
          testID={`${testID}-backdrop`}
        />
        <Animated.View
          testID={testID}
          style={[
            styles.sheet,
            list ? styles.sheetList : styles.sheetStatus,
            { paddingBottom: bottom, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.grabberRow}>
            <View style={styles.grabber} />
          </View>
          {list ? <ChooseBody {...props} /> : <StatusBody {...props} />}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** `2316:3575` — Choose your UPI app. */
function ChooseBody({
  state,
  summary,
  apps,
  lastUsedId,
  showAllApps,
  onPick,
  onMoreApps,
  testID = 'autopay-sheet',
}: AutopaySheetProps) {
  const busy = state.kind === 'creating' ? state.app.id : null;
  const notice = state.kind === 'choose' ? state.notice : null;
  const shown = showAllApps ? apps : apps.slice(0, VISIBLE_UPI_APPS);
  return (
    <ScrollView
      bounces={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      testID={`${testID}-choose`}
    >
      {/* `2316:3578` — Title 20/28 over Body 14/20 at 60 %, 4pt apart. */}
      <View style={styles.titles}>
        <Text variant="spoonTitle" accessibilityRole="header">
          Approve UPI Autopay
        </Text>
        <Text variant="spoonBody" color="textSecondarySoft" testID={`${testID}-subtitle`}>
          {summary.subtitle}
        </Text>
        {notice === null ? null : (
          <Text variant="spoonCaption" color="textError" testID={`${testID}-notice`}>
            {notice === 'slotTaken'
              ? 'A cook is no longer free for some of your visits. Go back and pick another time for those dates.'
              : 'Autopay could not be set up. Please try again.'}
          </Text>
        )}
      </View>

      {/* `2316:3581` — the plan summary card. */}
      <View style={styles.planCard} testID={`${testID}-plan`}>
        <View style={styles.planWell}>
          <Image source={AUTOPAY_RECURRING_GLYPH} style={styles.planGlyph} />
        </View>
        <View style={styles.planCopy}>
          <Text variant="spoonBodyStrong">{summary.plansLine}</Text>
          <Text variant="spoonCaption" color="textSecondarySoft">
            {summary.chargeLine}
          </Text>
        </View>
        <View style={styles.planPrice}>
          <Text variant="spoonEmphasis">{summary.price}</Text>
          <Text variant="spoonCaption" color="textSecondarySoft">
            per visit
          </Text>
        </View>
      </View>

      <Text variant="spoonCaptionStrong" color="textSecondarySoft">
        Choose your UPI app
      </Text>

      {/* `2316:3592` — 10pt apart; the last used app is ringed in brand yellow. */}
      <View style={styles.apps}>
        {shown.map((app) => {
          const lastUsed = app.id === lastUsedId;
          return (
            <Pressable
              key={app.id}
              onPress={() => onPick(app)}
              disabled={busy !== null}
              accessibilityRole="button"
              accessibilityLabel={lastUsed ? `${app.name}, last used` : app.name}
              accessibilityState={{ busy: busy === app.id, disabled: busy !== null }}
              style={({ pressed }) => [
                styles.appRow,
                lastUsed ? styles.appRowLastUsed : null,
                pressed || busy === app.id ? styles.pressed : null,
              ]}
              testID={`${testID}-app-${app.id}`}
            >
              <View style={styles.appMark}>
                <Text variant="spoonBodyStrong">{app.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text variant="spoonBodyStrong" style={styles.appName} numberOfLines={1}>
                {app.name}
              </Text>
              {lastUsed ? (
                <View style={styles.lastUsedTag}>
                  <Text variant="spoonMicroStrong">Last used</Text>
                </View>
              ) : null}
              <Image source={AUTOPAY_CHEVRON_GLYPH} style={styles.chevron} />
            </Pressable>
          );
        })}
      </View>

      {showAllApps || apps.length <= VISIBLE_UPI_APPS ? null : (
        <Pressable
          onPress={onMoreApps}
          accessibilityRole="button"
          style={styles.moreApps}
          testID={`${testID}-more-apps`}
        >
          <Text variant="spoonButton" style={styles.underline}>
            More UPI apps
          </Text>
        </Pressable>
      )}

      {/* `2316:3630` — dashed `color/border/default`, r16, p14, 10pt apart. */}
      <View style={styles.howItWorks}>
        <Text variant="spoonCaptionStrong" color="textSecondarySoft">
          How Autopay works
        </Text>
        {HOW_IT_WORKS.map((line, index) => (
          <View key={line} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text variant="spoonMicroStrong">{String(index + 1)}</Text>
            </View>
            <Text variant="spoonCaption" style={styles.stepText}>
              {line}
            </Text>
          </View>
        ))}
      </View>

      {/* `2316:3626` — the 2pt spacer the frame draws above the note. */}
      <View style={styles.spacer} />
      <View style={styles.secureNote}>
        <Image source={AUTOPAY_LOCK_GLYPH} style={styles.lock} />
        <Text variant="spoonCaption" color="textSecondarySoft">
          Secured by UPI Autopay · Pause or cancel anytime
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * `2316:3632` … — Figma's three steps; the second reworded because same-day visits are combined
 * into one debit (user, 2026-10-13).
 */
const HOW_IT_WORKS = [
  'Approve once in your UPI app',
  'Auto-charged 3 hrs before your first visit of the day',
  'Pause or cancel the mandate anytime',
] as const;

interface StatusLook {
  readonly glyph: ImageSourcePropType;
  readonly well: ColorToken;
  readonly halo: ColorToken;
}

/** Each status well (72pt) and the 96pt ring around it, per frame. */
const LOOKS = {
  /** `2317:3650` — `color/brand/primary-tint` well and ring. */
  waiting: {
    glyph: AUTOPAY_TIME_GLYPH,
    well: 'surfaceBrandTint',
    halo: 'surfaceBrandTint',
  },
  /** `2317:3740` — the same tint, an exclamation. */
  left: {
    glyph: AUTOPAY_EXCLAMATION_GLYPH,
    well: 'surfaceBrandTint',
    halo: 'surfaceBrandTint',
  },
  /** `2317:3826` — `color/status/negative-subtle`, a red ✕. */
  failed: {
    glyph: AUTOPAY_CLOSE_GLYPH,
    well: 'surfaceNegativeSubtle',
    halo: 'surfaceNegativeSubtle',
  },
  /** `2317:3912` — `color/surface/subtle` well inside a primary-tint ring. */
  confirming: {
    glyph: AUTOPAY_TIME_GLYPH,
    well: 'surfaceAccent',
    halo: 'surfaceBrandTint',
  },
  /** `2317:4082` — `color/status/positive` well, positive-subtle ring. */
  active: {
    glyph: AUTOPAY_CHECK_GLYPH,
    well: 'surfacePositiveBright',
    halo: 'surfacePositive',
  },
} as const satisfies Record<string, StatusLook>;

function StatusBody({
  state,
  summary,
  now,
  onOpenAgain,
  onCancel,
  onTryAgain,
  onChooseAnother,
  onBackToHome,
  onViewPlan,
  onRescan,
  testID = 'autopay-sheet',
}: AutopaySheetProps) {
  switch (state.kind) {
    case 'waiting':
      return (
        <Status
          look={LOOKS.waiting}
          title={`Approve Autopay in ${state.app.name}`}
          body="We’ll update this screen as soon as it’s done."
          testID={`${testID}-waiting`}
          extra={
            // `2317:3656` — `color/surface/subtle` pill, p 6/12, 6pt gap: 14pt clock + Caption Strong.
            <View style={styles.chip} testID={`${testID}-expiry`}>
              <Image source={AUTOPAY_TIME_GLYPH} style={styles.chipGlyph} />
              <Text variant="spoonCaptionStrong">
                Request expires in {countdownLabel(state.expiresAt, now)}
              </Text>
            </View>
          }
        >
          <Action
            label={`Open ${state.app.name} again`}
            onPress={onOpenAgain}
            testID={`${testID}-open-again`}
          />
          <Action label="Cancel" tint onPress={onCancel} testID={`${testID}-cancel`} />
        </Status>
      );
    case 'left':
      return (
        <Status
          look={LOOKS.left}
          title="Autopay not set up yet"
          body="You left before approving it. Nothing was charged."
          testID={`${testID}-left`}
        >
          <Action label="Try again" onPress={onTryAgain} testID={`${testID}-try-again`} />
          <Action
            label="Choose another app"
            tint
            onPress={onChooseAnother}
            testID={`${testID}-choose-another`}
          />
        </Status>
      );
    case 'failed':
      return (
        <Status
          look={LOOKS.failed}
          title="Autopay approval didn’t go through"
          body="If any money was taken, it’ll be refunded to your account in 5-7 working days."
          testID={`${testID}-failed`}
        >
          <Action label="Try again" onPress={onTryAgain} testID={`${testID}-try-again`} />
          <Action
            label="Choose another app"
            tint
            onPress={onChooseAnother}
            testID={`${testID}-choose-another`}
          />
        </Status>
      );
    case 'confirming':
      return (
        <Status
          look={LOOKS.confirming}
          title="Confirming your Autopay"
          body="This can take a few minutes. We’ll notify you once it’s set."
          testID={`${testID}-confirming`}
        >
          <Action label="Back to home" tint onPress={onBackToHome} testID={`${testID}-back-home`} />
        </Status>
      );
    case 'active': {
      const via = [state.app?.name, state.handleMasked].filter(
        (part): part is string => part !== undefined && part !== null,
      );
      return (
        <Status
          look={LOOKS.active}
          title="Autopay is on"
          body="Your Recurring plan is live. Sit back, we’ll take it from here."
          testID={`${testID}-active`}
          extra={
            // `2317:4089` — `color/surface/subtle`, r16, p14, 10pt between rows.
            <View style={styles.details} testID={`${testID}-details`}>
              <DetailRow label="Per visit" value={summary.priceWithTax} />
              {via.length === 0 ? null : <DetailRow label="Paying via" value={via.join(' · ')} />}
            </View>
          }
        >
          <Action label="View my plan" onPress={onViewPlan} testID={`${testID}-view-plan`} />
        </Status>
      );
    }
    case 'noApp':
      return (
        <Status
          look={LOOKS.left}
          title="No UPI app found"
          body="Install PhonePe or Google Pay to set up Autopay, then try again."
          testID={`${testID}-no-app`}
        >
          <Action label="Try again" onPress={onRescan} testID={`${testID}-rescan`} />
        </Status>
      );
    case 'choose':
    case 'creating':
      return null;
  }
}

/**
 * `2317:3578` — the status sheets' column: a 12pt top spacer, the 72pt well (its 96pt ring drawn
 * around it), a 4pt spacer, Heading 18/26 and Body 14/20 at 60 % centred, the optional chip or
 * details card, an 8pt spacer and the full-width actions 10pt apart. The spacers are the frame's
 * own (`Top gap`, `gap`), so with the 12pt flow gap the geometry is the frame's exactly.
 */
function Status({
  look,
  title,
  body,
  extra,
  children,
  testID,
}: {
  readonly look: StatusLook;
  readonly title: string;
  readonly body: string;
  readonly extra?: ReactNode;
  readonly children: ReactNode;
  readonly testID: string;
}) {
  return (
    <View style={styles.status} testID={testID}>
      <View style={styles.topGap} />
      <View style={[styles.well, { backgroundColor: lightTheme.colors[look.well] }]}>
        <View style={[styles.halo, { borderColor: lightTheme.colors[look.halo] }]} />
        <Image source={look.glyph} style={styles.wellGlyph} />
      </View>
      <View style={styles.smallGap} />
      <Text variant="spoonHeading" align="center" accessibilityRole="header" style={styles.stretch}>
        {title}
      </Text>
      <Text variant="spoonBody" color="textSecondarySoft" align="center" style={styles.stretch}>
        {body}
      </Text>
      {extra}
      <View style={styles.actionsGap} />
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

/** `90:180` — the redesigned Button: Primary `#FFD600`, Secondary `#FFF7CC`; 48 tall, pill. */
function Action({
  label,
  onPress,
  tint = false,
  testID,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly tint?: boolean;
  readonly testID: string;
}) {
  return (
    <Button
      label={label}
      onPress={onPress}
      variant={tint ? 'tint' : 'primary'}
      size="pillLg"
      flat
      fullWidth
      labelColor="textPrimary"
      labelVariant="spoonButton"
      testID={testID}
    />
  );
}

function DetailRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="spoonCaption" color="textSecondarySoft">
        {label}
      </Text>
      <Text variant="spoonCaptionStrong">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lightTheme.colors.scrimRecurringSheet },
  /** `2316:3575` — r24 top corners, pt 8 / px 16, `Elevation/2`. */
  sheet: {
    marginTop: 'auto',
    backgroundColor: lightTheme.colors.surface,
    borderTopLeftRadius: lightTheme.radius.lg,
    borderTopRightRadius: lightTheme.radius.lg,
    paddingTop: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.lg,
    maxHeight: '92%',
    ...lightTheme.elevation.sheetSoft,
  },
  sheetList: { gap: lightTheme.space.lg },
  sheetStatus: { gap: lightTheme.space.md, minHeight: STATUS_SHEET_MIN_HEIGHT },
  /** `2316:3576` — the grabber row; the bar itself is 40 × 4 at r4, `color/border/strong`. */
  grabberRow: { alignItems: 'center' },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.borderInk,
  },
  listContent: { gap: lightTheme.space.lg },
  titles: { gap: lightTheme.space.xs },
  /** `2316:3581` — `color/surface/subtle`, r16, p12, 12pt gap, centred. */
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: lightTheme.space.md,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  /** `2316:3582` — 40pt `color/brand/primary` disc. */
  planWell: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planGlyph: { width: 22, height: 22 },
  planCopy: { flex: 1, gap: lightTheme.space.xxs },
  planPrice: { alignItems: 'flex-end' },
  apps: { gap: lightTheme.space.s10 },
  /**
   * `2316:3601` — white, 1pt `color/border/default`, r16, pt/pb/pr 12 and pl 14, 12pt gap. With
   * the 36pt mark that is 62 tall; the last used row's 2pt brand ring makes it 64 (`2316:3593`).
   */
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    paddingVertical: lightTheme.space.md,
    paddingRight: lightTheme.space.md,
    paddingLeft: lightTheme.space.s14,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderAccent,
    backgroundColor: lightTheme.colors.surface,
  },
  appRowLastUsed: { borderWidth: 2, borderColor: lightTheme.colors.surfaceBrand },
  /** `2316:3594` — 36pt `color/surface/subtle` square at r12 holding the initial. */
  appMark: {
    width: 36,
    height: 36,
    borderRadius: lightTheme.radius.sm,
    backgroundColor: lightTheme.colors.surfaceAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { flex: 1 },
  /** `2316:3597` — `color/status/positive-subtle` pill, p 3/8. */
  lastUsedTag: {
    paddingVertical: lightTheme.space.s3,
    paddingHorizontal: lightTheme.space.sm,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfacePositive,
  },
  chevron: { width: 20, height: 20 },
  pressed: { opacity: 0.85 },
  moreApps: { alignItems: 'center' },
  underline: { textDecorationLine: 'underline' },
  howItWorks: {
    gap: lightTheme.space.s10,
    padding: lightTheme.space.s14,
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.borderAccent,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.s10 },
  /** `2316:3633` — 22pt `color/brand/primary` disc. */
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  spacer: { height: lightTheme.space.xxs },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s6,
  },
  lock: { width: 14, height: 14 },
  status: { alignItems: 'center', gap: lightTheme.space.md },
  topGap: { height: lightTheme.space.md },
  smallGap: { height: lightTheme.space.xs },
  actionsGap: { height: lightTheme.space.sm },
  /** `2317:3650` — the 72pt well; its ring is a 96pt, 2pt circle 12pt outside it. */
  well: {
    width: 72,
    height: 72,
    borderRadius: lightTheme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: -lightTheme.space.md,
    left: -lightTheme.space.md,
    width: 96,
    height: 96,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 2,
  },
  wellGlyph: { width: 32, height: 32 },
  stretch: { alignSelf: 'stretch' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s6,
    paddingVertical: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.md,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  chipGlyph: { width: 14, height: 14 },
  details: {
    alignSelf: 'stretch',
    gap: lightTheme.space.s10,
    padding: lightTheme.space.s14,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { alignSelf: 'stretch', gap: lightTheme.space.s10 },
});
