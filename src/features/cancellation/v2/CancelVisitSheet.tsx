import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { OutlineButton, PrimaryButton, SecondaryButton } from '@ui/v2/Buttons';
import { Sheet } from '@ui/v2/Sheet';
import { AddressToast } from '@ui/v2/Toast';
import type { ToastNotice } from '@ui/v2/Toast';
import { C, SHADOW_1, SHADOW_2, T } from '@ui/v2/theme';

import { RefundProgressCard } from '@features/refunds';

import { CANCEL_ART } from './art';
import {
  FEE_BOUNDARY_MINUTES,
  FEE_ZONES,
  REASON_DETAIL_MAX,
  URGENT_REASON,
  cancelledMessage,
  clockLabel,
  countdownLabel,
  dateTile,
  dayLabel,
  durationLabel,
  feeZoneOf,
  isHighLoss,
  methodLabel,
  minutesToStart,
  outcomeLines,
  refundCaption,
  refundProgressFrom,
  rupees,
  slotRange,
  visitSubtitle,
} from './model';
import type { CancelQuote, CancelReason, CancelRefund, CancelVisit, FeeZone } from './model';

/**
 * The cancel-visit flow — Figma C1 `2055:20524` → C2 `2055:20579` → C3 `2055:20651` → C4
 * `2055:20716` (C4b `2055:20361`) → C5 `2055:20787` (C5b `2055:20432`), dev notes `2071:2857`–
 * `2071:2884`. One sheet whose content swaps by step.
 *
 * Nothing is cancelled before C4's "Cancel": that press sends once (the host holds the idempotency
 * key), disables both buttons and shows a spinner; a failure stays on C4 with a toast, success
 * moves to C5. C5 has no way back into the flow — Done and ✕ leave it.
 */
export type CancelStep = 'modify' | 'policy' | 'reason' | 'review' | 'done';

export interface CancelVisitSheetProps {
  readonly visible: boolean;
  readonly step: CancelStep;
  readonly onStepChange: (step: CancelStep) => void;
  readonly visit: CancelVisit;
  /** Null while the server's quote is loading. */
  readonly quote: CancelQuote | null;
  readonly reasons: readonly CancelReason[];
  /** Server-decided: rescheduling is still available for this visit. */
  readonly canReschedule: boolean;
  /** Leaves this flow for the reschedule flow. */
  readonly onReschedule: () => void;
  readonly onClose: () => void;
  /** C4's Cancel. Resolves to whether the server cancelled it (or already had). */
  readonly onConfirm: (reasonCode: string, detail: string) => Promise<boolean>;
  /** The refund the cancellation raised, as far as the server has got with it. */
  readonly refund: CancelRefund | null;
  /** Re-fetches the quote when a fee boundary passes while the sheet is open. */
  readonly onBoundary: () => void;
  /** C5's Done / ✕. */
  readonly onDone: () => void;
  /** C5's "Book a visit". */
  readonly onBookVisit: () => void;
  readonly testID?: string;
}

/** Each reason's drawn icon (`2162:14181`); unknown codes fall back to the edit glyph. */
const REASON_ICONS: Readonly<Record<string, ImageSourcePropType>> = {
  URGENT_CHANGE: CANCEL_ART.time,
  ORDERED_DELIVERY: CANCEL_ART.dish,
  FAMILY_COOKED: CANCEL_ART.cookingPot,
  ARRANGED_OTHER_COOK: CANCEL_ART.cookAssigned,
  BOOKED_BY_MISTAKE: CANCEL_ART.exclamation,
  COOK_NOT_PREFERRED: CANCEL_ART.profile,
  OTHER: CANCEL_ART.edit,
};

const iconOf = (code: string) => REASON_ICONS[code] ?? CANCEL_ART.edit;

export function CancelVisitSheet({
  visible,
  step,
  onStepChange,
  visit,
  quote,
  reasons,
  canReschedule,
  onReschedule,
  onClose,
  onConfirm,
  refund,
  onBoundary,
  onDone,
  onBookVisit,
  testID = 'cancel-visit',
}: CancelVisitSheetProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const now = useMinuteClock(visible && (step === 'policy' || step === 'modify'));

  // A fee boundary passing while the sheet is open swaps the timeline in place (dev note).
  const lastMinutes = useRef(minutesToStart(visit.startsAt, now));
  useEffect(() => {
    const left = minutesToStart(visit.startsAt, now);
    const crossed = FEE_BOUNDARY_MINUTES.some(
      (boundary) => lastMinutes.current > boundary && left <= boundary,
    );
    lastMinutes.current = left;
    if (crossed) onBoundary();
  }, [now, visit.startsAt, onBoundary]);

  const chosen = reasons.find((option) => option.code === reason) ?? null;
  const reasonReady = chosen !== null && (!chosen.requiresDetail || detail.trim().length > 0);

  const confirm = () => {
    if (confirming || chosen === null) return;
    setConfirming(true);
    void onConfirm(chosen.code, chosen.requiresDetail ? detail.trim() : '').then((ok) => {
      setConfirming(false);
      if (ok) onStepChange('done');
      else
        setNotice((previous) => ({
          id: (previous?.id ?? 0) + 1,
          message: 'Couldn’t cancel the visit. Try again.',
        }));
    });
  };

  const exit = step === 'done' ? onDone : onClose;

  return (
    <Sheet visible={visible} onClose={exit} dismissible={!confirming} testID={`${testID}-${step}`}>
      {step === 'modify' ? (
        <ModifyStep
          visit={visit}
          canReschedule={canReschedule}
          onClose={onClose}
          onReschedule={onReschedule}
          onCancel={() => onStepChange('policy')}
          testID={testID}
        />
      ) : step === 'policy' ? (
        <PolicyStep
          visit={visit}
          quote={quote}
          now={now}
          canReschedule={canReschedule}
          onBack={() => onStepChange('modify')}
          onClose={onClose}
          onReschedule={onReschedule}
          onContinue={() => onStepChange('reason')}
          testID={testID}
        />
      ) : step === 'reason' ? (
        <ReasonStep
          reasons={reasons}
          reason={reason}
          detail={detail}
          ready={reasonReady}
          canReschedule={canReschedule}
          onPick={setReason}
          onDetail={(text) => setDetail(text.slice(0, REASON_DETAIL_MAX))}
          onBack={() => onStepChange('policy')}
          onClose={onClose}
          onReschedule={onReschedule}
          onContinue={() => onStepChange('review')}
          testID={testID}
        />
      ) : step === 'review' ? (
        <ReviewStep
          visit={visit}
          quote={quote}
          reason={chosen}
          refundMethod={visit.paidWith ?? methodLabel(refund?.method)}
          confirming={confirming}
          canReschedule={canReschedule}
          onBack={() => onStepChange('reason')}
          onClose={onClose}
          onEditReason={() => onStepChange('reason')}
          onReschedule={onReschedule}
          onConfirm={confirm}
          testID={testID}
        />
      ) : (
        <DoneStep
          visit={visit}
          quote={quote}
          refund={refund}
          onDone={onDone}
          onBookVisit={onBookVisit}
          testID={testID}
        />
      )}
      <AddressToast notice={notice} testID={`${testID}-toast`} />
    </Sheet>
  );
}

/** A clock that ticks each minute while `live`, for the countdown and the boundary re-fetch. */
function useMinuteClock(live: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!live) return undefined;
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [live]);
  return now;
}

/* ----------------------------------------------------------------------------- shared parts */

function Header({
  title,
  subtitle,
  onBack,
  onClose,
  testID,
}: {
  title: string;
  subtitle?: string | null;
  onBack?: () => void;
  onClose?: () => void;
  testID: string;
}) {
  return (
    <View style={styles.header}>
      {onBack === undefined ? null : (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.headerButton}
          testID={`${testID}-back`}
        >
          <Image source={CANCEL_ART.chevronLeft} style={styles.icon24} />
        </Pressable>
      )}
      <View style={styles.headerTitle}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle === undefined || subtitle === null ? null : (
          <Text style={styles.caption}>{subtitle}</Text>
        )}
      </View>
      {onClose === undefined ? null : (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[styles.headerButton, styles.headerClose]}
          testID={`${testID}-close`}
        >
          <Image source={CANCEL_ART.close} style={styles.icon24} />
        </Pressable>
      )}
    </View>
  );
}

function Well({
  icon,
  tone,
  size = 40,
}: {
  icon: ImageSourcePropType;
  tone: 'tint' | 'subtle' | 'base' | 'positive';
  size?: number;
}) {
  return (
    <View
      style={[
        styles.well,
        { width: size, height: size, borderRadius: size / 2 },
        tone === 'tint'
          ? styles.wellTint
          : tone === 'subtle'
            ? styles.wellSubtle
            : tone === 'positive'
              ? styles.wellPositive
              : styles.wellBase,
      ]}
    >
      <Image source={icon} style={styles.icon24} />
    </View>
  );
}

function Loading({ testID }: { testID: string }) {
  return (
    <View style={styles.loading} testID={testID}>
      <ActivityIndicator color={C.text} />
    </View>
  );
}

/* --------------------------------------------------------------------------- C1 Modify visit */

function ModifyStep({
  visit,
  canReschedule,
  onClose,
  onReschedule,
  onCancel,
  testID,
}: {
  visit: CancelVisit;
  canReschedule: boolean;
  onClose: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  testID: string;
}) {
  const tile = dateTile(visit.startsAt);
  return (
    <>
      <Header title="Modify visit" onClose={onClose} testID={testID} />
      <LinearGradient
        colors={['#FFF9DB', '#FFE666']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.ticket}
      >
        <Image source={CANCEL_ART.ticketCloudA} style={styles.ticketCloudA} />
        <Image source={CANCEL_ART.ticketCloudB} style={styles.ticketCloudB} />
        <View style={styles.dateTile}>
          <Text style={styles.microStrongSecondary}>{tile.weekday}</Text>
          <Text style={styles.title}>{tile.day}</Text>
          <Text style={styles.microStrongSecondary}>{tile.month}</Text>
        </View>
        <View style={styles.flexText}>
          <Text style={styles.emphasis}>
            {clockLabel(visit.startsAt)} · {durationLabel(visit.durationMinutes)}
          </Text>
          {visit.cookName === null ? null : (
            <Text style={styles.caption}>Cook {visit.cookName}</Text>
          )}
        </View>
      </LinearGradient>
      <View style={styles.options}>
        {canReschedule ? (
          <OptionRow
            icon={CANCEL_ART.calendar}
            tone="tint"
            label="Reschedule visit"
            onPress={onReschedule}
            testID={`${testID}-option-reschedule`}
          />
        ) : null}
        <OptionRow
          icon={CANCEL_ART.calendarClose}
          tone="subtle"
          label="Cancel visit"
          onPress={onCancel}
          testID={`${testID}-option-cancel`}
        />
      </View>
    </>
  );
}

function OptionRow({
  icon,
  tone,
  label,
  onPress,
  testID,
}: {
  icon: ImageSourcePropType;
  tone: 'tint' | 'subtle';
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
      testID={testID}
    >
      <Well icon={icon} tone={tone} />
      <Text style={[styles.bodyStrong, styles.flex]}>{label}</Text>
      <Image source={CANCEL_ART.chevronRight} style={styles.icon24} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------------- C2 Policy & fee */

function PolicyStep({
  visit,
  quote,
  now,
  canReschedule,
  onBack,
  onClose,
  onReschedule,
  onContinue,
  testID,
}: {
  visit: CancelVisit;
  quote: CancelQuote | null;
  now: Date;
  canReschedule: boolean;
  onBack: () => void;
  onClose: () => void;
  onReschedule: () => void;
  onContinue: () => void;
  testID: string;
}) {
  const zone = quote === null ? null : feeZoneOf(quote, visit);
  // Reschedule shows in the first two windows only; from 50% "Keep my visit" leads.
  const offerReschedule = canReschedule && zone !== null && !isHighLoss(zone);
  return (
    <>
      <Header
        title="Cancel visit"
        subtitle={visitSubtitle(visit)}
        onBack={onBack}
        onClose={onClose}
        testID={testID}
      />
      {quote === null || zone === null ? (
        <Loading testID={`${testID}-quote-loading`} />
      ) : (
        <FeeTimeline visit={visit} quote={quote} zone={zone} now={now} testID={testID} />
      )}
      <View style={styles.goodToKnow}>
        <InfoRow
          icon={CANCEL_ART.cookAssigned}
          title="Why a fee closer to the time?"
          body="Our cooks keep this hour for you and turn down other jobs. Late fees go towards compensating their time"
        />
        {visit.wasRescheduled ? (
          <InfoRow
            icon={CANCEL_ART.restart}
            title="Rescheduled this visit earlier?"
            body="Fees follow your original slot time, not the new one"
          />
        ) : null}
      </View>
      {zone === null ? null : isHighLoss(zone) ? (
        <View style={styles.actions}>
          <PrimaryButton
            label="Keep my visit"
            onPress={onClose}
            style={styles.flex}
            testID={`${testID}-keep`}
          />
          <OutlineButton
            label="Cancel anyway"
            onPress={onContinue}
            style={styles.flex}
            testID={`${testID}-continue`}
          />
        </View>
      ) : offerReschedule ? (
        <View style={styles.actions}>
          <PrimaryButton
            label="Reschedule"
            onPress={onReschedule}
            style={styles.flex}
            testID={`${testID}-reschedule`}
          />
          <OutlineButton
            label="Continue"
            onPress={onContinue}
            style={styles.flex}
            testID={`${testID}-continue`}
          />
        </View>
      ) : (
        <PrimaryButton label="Continue" onPress={onContinue} testID={`${testID}-continue`} />
      )}
    </>
  );
}

function InfoRow({
  icon,
  title,
  body,
}: {
  icon: ImageSourcePropType;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Well icon={icon} tone="subtle" />
      <View style={styles.flexText4}>
        <Text style={styles.bodyStrong}>{title}</Text>
        <Text style={styles.caption}>{body}</Text>
      </View>
    </View>
  );
}

/** `2055:20601` — countdown, the four-zone track with its "You're here" marker, the outcome. */
export function FeeTimeline({
  visit,
  quote,
  zone,
  now,
  testID,
}: {
  visit: CancelVisit;
  quote: CancelQuote;
  zone: FeeZone;
  now: Date;
  testID: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [pillWidth, setPillWidth] = useState(0);
  const zoneWidth = trackWidth === 0 ? 0 : (trackWidth - 12) / 4;
  const centre = zone * (zoneWidth + 4) + zoneWidth / 2;
  const pillLeft = Math.min(
    Math.max(0, centre - pillWidth / 2),
    Math.max(0, trackWidth - pillWidth),
  );
  const outcome = outcomeLines(quote, zone);
  const enRoute = zone === 3 && visit.cookOnTheWay;

  return (
    <LinearGradient
      colors={['#FFF7CC', '#FFE666']}
      style={styles.timeline}
      testID={`${testID}-timeline`}
    >
      <Image source={CANCEL_ART.timelineCloudA} style={styles.timelineCloudA} />
      <Image source={CANCEL_ART.timelineCloudB} style={styles.timelineCloudB} />
      <View style={styles.countdown}>
        <Text style={styles.microStrongSecondary}>
          {enRoute ? 'COOK IS ON THE WAY' : 'YOUR VISIT STARTS IN'}
        </Text>
        <Text style={styles.display} testID={`${testID}-countdown`}>
          {enRoute
            ? visit.etaMinutes === null
              ? 'Arriving soon'
              : `Arriving in ~${String(visit.etaMinutes)} min`
            : countdownLabel(visit.startsAt, now)}
        </Text>
      </View>
      <View
        style={styles.track}
        onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.markerLane}>
          <View
            style={[styles.marker, SHADOW_2, { left: pillLeft, opacity: pillWidth === 0 ? 0 : 1 }]}
            onLayout={(event: LayoutChangeEvent) => setPillWidth(event.nativeEvent.layout.width)}
            testID={`${testID}-marker`}
          >
            <Text style={styles.captionStrong}>You’re here</Text>
          </View>
          <View style={[styles.pointer, { left: centre - 5 }]} />
        </View>
        <View style={styles.zones}>
          {FEE_ZONES.map((entry, index) => (
            <View
              key={entry.when}
              style={[styles.zoneBar, index === zone ? styles.zoneOn : styles.zoneOff]}
              testID={`${testID}-zone-${String(index)}${index === zone ? '-current' : ''}`}
            />
          ))}
        </View>
        <View style={styles.zones}>
          {FEE_ZONES.map((entry, index) => (
            <View
              key={entry.when}
              style={[
                styles.zoneLabel,
                index === 0
                  ? styles.alignStart
                  : index === 3
                    ? styles.alignEnd
                    : styles.alignCentre,
              ]}
            >
              <Text
                style={[styles.micro, index === zone ? styles.textPrimary : styles.textSecondary]}
              >
                {entry.when}
              </Text>
              <Text
                style={[
                  index === zone ? styles.bodyStrong : styles.body,
                  index === zone ? styles.textPrimary : styles.textSecondary,
                ]}
              >
                {entry.fee}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.outcome} testID={`${testID}-outcome`}>
        <Well
          icon={zone === 0 ? CANCEL_ART.check : enRoute ? CANCEL_ART.onTheWay : CANCEL_ART.money}
          tone={zone === 0 ? 'positive' : 'subtle'}
        />
        <View style={styles.flexText}>
          <Text style={styles.emphasis}>{outcome.title}</Text>
          {outcome.body === null ? null : <Text style={styles.caption}>{outcome.body}</Text>}
        </View>
      </View>
    </LinearGradient>
  );
}

/* ----------------------------------------------------------------------------- C3 Reason */

function ReasonStep({
  reasons,
  reason,
  detail,
  ready,
  canReschedule,
  onPick,
  onDetail,
  onBack,
  onClose,
  onReschedule,
  onContinue,
  testID,
}: {
  reasons: readonly CancelReason[];
  reason: string | null;
  detail: string;
  ready: boolean;
  canReschedule: boolean;
  onPick: (code: string) => void;
  onDetail: (text: string) => void;
  onBack: () => void;
  onClose: () => void;
  onReschedule: () => void;
  onContinue: () => void;
  testID: string;
}) {
  const tiles = reasons.filter((option) => !option.requiresDetail);
  const other = reasons.find((option) => option.requiresDetail) ?? null;
  /*
   * Two tiles per row, sharing the row's width. A percentage width plus the 8pt gap overflowed
   * on a 360pt phone (2 × 48.9 % + 8 > 100 %) and wrapped every tile onto its own line.
   */
  const rows = Array.from({ length: Math.ceil(tiles.length / 2) }, (_, i) =>
    tiles.slice(i * 2, i * 2 + 2),
  );
  return (
    <>
      <Header
        title="Why are you cancelling?"
        subtitle="Please pick one, it helps us plan cooks better"
        onBack={onBack}
        onClose={onClose}
        testID={testID}
      />
      <View style={styles.reasons}>
        {rows.map((row) => (
          <View key={row.map((option) => option.code).join('|')} style={styles.reasonRow}>
            {row.map((option) => {
              const selected = option.code === reason;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => onPick(option.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.reasonTile, selected ? styles.reasonOn : styles.reasonOff]}
                  testID={`${testID}-reason-${option.code}`}
                >
                  <Well icon={iconOf(option.code)} tone={selected ? 'base' : 'subtle'} />
                  <Text style={styles.bodyStrong}>{option.label}</Text>
                  {selected ? (
                    <View style={styles.reasonCheck}>
                      <Image source={CANCEL_ART.checkSmall} style={styles.icon16} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
            {row.length === 1 ? <View style={styles.flex} /> : null}
          </View>
        ))}
        {other === null ? null : (
          <Pressable
            onPress={() => onPick(other.code)}
            accessibilityRole="radio"
            accessibilityState={{ selected: other.code === reason }}
            style={[styles.reasonWide, other.code === reason ? styles.reasonOn : styles.reasonOff]}
            testID={`${testID}-reason-${other.code}`}
          >
            <View style={styles.reasonWideRow}>
              <Well icon={iconOf(other.code)} tone={other.code === reason ? 'base' : 'subtle'} />
              <Text style={[styles.bodyStrong, styles.flex]}>{other.label}</Text>
              {other.code === reason ? <Well icon={CANCEL_ART.check} tone="base" /> : null}
            </View>
            {other.code === reason ? (
              <View style={styles.detailBox}>
                <TextInput
                  value={detail}
                  onChangeText={onDetail}
                  placeholder="Tell us what happened"
                  placeholderTextColor={C.textSecondary}
                  multiline
                  maxLength={REASON_DETAIL_MAX}
                  autoFocus
                  style={styles.detailInput}
                  testID={`${testID}-reason-detail`}
                />
                <Text
                  style={[styles.counter, detail.length >= REASON_DETAIL_MAX && styles.counterFull]}
                >
                  {detail.length >= REASON_DETAIL_MAX
                    ? `Limit reached · ${String(REASON_DETAIL_MAX)} / ${String(REASON_DETAIL_MAX)}`
                    : `${String(detail.length)} / ${String(REASON_DETAIL_MAX)}`}
                </Text>
              </View>
            ) : null}
          </Pressable>
        )}
      </View>
      {reason === URGENT_REASON && canReschedule ? (
        <View style={styles.nudge} testID={`${testID}-nudge`}>
          <Well icon={CANCEL_ART.calendar} tone="base" />
          <View style={styles.nudgeContent}>
            <View style={styles.flexText}>
              <Text style={styles.bodyStrong}>Plans changed? Reschedule instead!</Text>
              <Text style={styles.caption}>Rescheduling is free · Capped at 1 per booking</Text>
            </View>
            <Pressable
              onPress={onReschedule}
              accessibilityRole="button"
              style={({ pressed }) => [styles.nudgeButton, pressed && styles.pressed]}
              testID={`${testID}-nudge-reschedule`}
            >
              <Text style={styles.button}>Reschedule</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {ready ? (
        <OutlineButton label="Continue" onPress={onContinue} testID={`${testID}-reason-continue`} />
      ) : (
        <PrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled
          testID={`${testID}-reason-continue`}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------- C4 Review & confirm */

function ReviewStep({
  visit,
  quote,
  reason,
  refundMethod,
  confirming,
  canReschedule,
  onBack,
  onClose,
  onEditReason,
  onReschedule,
  onConfirm,
  testID,
}: {
  visit: CancelVisit;
  quote: CancelQuote | null;
  reason: CancelReason | null;
  refundMethod: string | null;
  confirming: boolean;
  canReschedule: boolean;
  onBack: () => void;
  onClose: () => void;
  onEditReason: () => void;
  onReschedule: () => void;
  onConfirm: () => void;
  testID: string;
}) {
  if (quote === null) {
    return (
      <>
        <Header title="Review & confirm" onBack={onBack} onClose={onClose} testID={testID} />
        <Loading testID={`${testID}-quote-loading`} />
      </>
    );
  }
  const noRefund = quote.refundPaise === 0;
  return (
    <>
      <Header
        title="Review & confirm"
        subtitle={noRefund ? visitSubtitle(visit) : null}
        {...(confirming ? {} : { onBack, onClose })}
        testID={testID}
      />
      <View style={styles.summary} testID={`${testID}-summary`}>
        <View style={styles.summaryHeader}>
          <Well icon={CANCEL_ART.money} tone="tint" />
          <Text style={[styles.heading, styles.flex]}>
            {noRefund ? 'Refund summary' : 'Your refund'}
          </Text>
        </View>
        <View style={styles.breakdown}>
          <View style={styles.line}>
            <View style={styles.flexText}>
              <Text style={styles.body}>Amount paid</Text>
              {quote.servicePaise === null || quote.taxPaise === null ? null : (
                <Text style={styles.caption}>
                  Cook visit {durationLabel(visit.durationMinutes)} {rupees(quote.servicePaise)} +
                  GST {rupees(quote.taxPaise)}
                </Text>
              )}
            </View>
            {/* `2055:20716` — the struck "was" price beside what was paid, when there is one. */}
            <View style={styles.priceRow}>
              {quote.wasPaidPaise === null || quote.wasPaidPaise === undefined ? null : (
                <Text style={styles.struckCaption}>{rupees(quote.wasPaidPaise)}</Text>
              )}
              <Text style={styles.bodyStrong}>{rupees(quote.paidPaise)}</Text>
            </View>
          </View>
          {quote.taxPaise === null ? null : (
            <View style={styles.line}>
              <Text style={[styles.captionPrimary, styles.flex]}>GST</Text>
              <Text style={styles.captionPrimary}>{rupees(quote.taxPaise)}</Text>
            </View>
          )}
          <View style={styles.line}>
            <Text style={[styles.captionPrimary, styles.flex]}>
              {quote.feePercent > 0
                ? `Cancellation fee · ${String(quote.feePercent)}%`
                : 'Cancellation fee'}
            </Text>
            <Text style={styles.captionPrimary}>– {rupees(quote.feePaise)}</Text>
          </View>
          <Stitch />
          <View style={styles.line}>
            <View style={styles.flexText}>
              <Text style={styles.emphasis}>Refund amount</Text>
              <Text style={styles.caption}>{refundCaption(quote, visit)}</Text>
            </View>
            <View style={styles.priceRowBottom}>
              {quote.feePaise > 0 ||
              quote.wasPaidPaise === null ||
              quote.wasPaidPaise === undefined ? null : (
                <Text style={styles.struckBody}>{rupees(quote.wasPaidPaise)}</Text>
              )}
              <Text style={styles.display} testID={`${testID}-refund-amount`}>
                {rupees(quote.refundPaise)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.details}>
          {noRefund ? null : (
            <View style={styles.detailRow}>
              <Well icon={CANCEL_ART.lock} tone="subtle" />
              <View style={styles.flexText}>
                <Text style={styles.microSecondary}>REFUND TO</Text>
                <Text style={styles.bodyStrong}>
                  {refundMethod ?? 'Your original payment method'}
                </Text>
                <Text style={styles.caption}>Expected within 5-7 working days</Text>
              </View>
            </View>
          )}
          {reason === null ? null : (
            <View style={styles.detailRow}>
              <Well icon={iconOf(reason.code)} tone="subtle" />
              <View style={styles.flexText}>
                <Text style={styles.microSecondary}>YOUR REASON</Text>
                <Text style={styles.bodyStrong}>{reason.label}</Text>
              </View>
              {confirming ? null : (
                <Pressable
                  onPress={onEditReason}
                  accessibilityRole="button"
                  hitSlop={8}
                  testID={`${testID}-edit-reason`}
                >
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        {canReschedule ? (
          <PrimaryButton
            label="Reschedule"
            onPress={onReschedule}
            disabled={confirming}
            style={styles.flex}
            testID={`${testID}-review-reschedule`}
          />
        ) : null}
        <OutlineButton
          label="Cancel"
          onPress={onConfirm}
          loading={confirming}
          style={styles.flex}
          testID={`${testID}-confirm`}
        />
      </View>
    </>
  );
}

/** `2055:20758` — the 2pt `#FFD600` dashed rule, drawn as dashes (one-sided dashes don't draw). */
function Stitch() {
  const [width, setWidth] = useState(0);
  const count = Math.max(0, Math.floor((width + 4) / 8));
  return (
    <View style={styles.stitch} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.stitchDash} />
      ))}
    </View>
  );
}

/* --------------------------------------------------------------------------- C5 Cancelled */

function DoneStep({
  visit,
  quote,
  refund,
  onDone,
  onBookVisit,
  testID,
}: {
  visit: CancelVisit;
  quote: CancelQuote | null;
  refund: CancelRefund | null;
  onDone: () => void;
  onBookVisit: () => void;
  testID: string;
}) {
  const refundPaise = refund?.amountPaise ?? quote?.refundPaise ?? 0;
  const now = new Date();
  return (
    <>
      <CancelledBanner visit={visit} testID={`${testID}-banner`} />
      <View style={styles.message}>
        <Text style={styles.title} accessibilityRole="header">
          Visit cancelled
        </Text>
        {quote === null ? null : (
          <Text style={styles.bodySecondary}>{cancelledMessage(quote, visit)}</Text>
        )}
      </View>
      {refundPaise > 0 ? (
        // `2303:4231` — the same Refund tracker as Visit details → Payment & refund.
        <RefundProgressCard
          view={refundProgressFrom(refund, refundPaise, now)}
          testID={`${testID}-refund`}
        />
      ) : (
        <View style={styles.tracker} testID={`${testID}-no-refund`}>
          <View style={styles.summaryHeader}>
            <Well icon={CANCEL_ART.cookAssigned} tone="base" />
            <View style={styles.flexText}>
              <Text style={styles.emphasis}>No refund due</Text>
              <Text style={styles.caption}>
                {visit.cookOnTheWay
                  ? 'Cancelled when the cook was about to reach'
                  : 'Cancelled inside the fee window'}
              </Text>
            </View>
          </View>
        </View>
      )}
      <Text style={[styles.bodyStrongSecondary, styles.center]}>
        Need a cook on another occasion?
      </Text>
      <View style={styles.actions}>
        <SecondaryButton
          label="Done"
          onPress={onDone}
          style={styles.flex}
          testID={`${testID}-finish`}
        />
        <PrimaryButton
          label="Book a visit"
          onPress={onBookVisit}
          style={styles.flex}
          testID={`${testID}-book`}
        />
      </View>
    </>
  );
}

/**
 * `1461:6217` Status banner / recurring / past, Cancelled: the morning sky, muted
 * (`rgba(244,243,239,0.8)` over it), the date and the struck slot, and the dashed CANCELLED badge.
 * Dev note: muted on purpose — no brand-yellow decoration in the cancelled state.
 */
export function CancelledBanner({
  visit,
  testID,
}: {
  visit: CancelVisit;
  testID: string;
}): ReactNode {
  return (
    <View style={[styles.banner, SHADOW_1]} testID={testID}>
      <LinearGradient colors={['#FFF9DB', '#FFD9A8']} style={StyleSheet.absoluteFill} />
      <Image source={CANCEL_ART.bannerHalo3} style={styles.halo3} />
      <Image source={CANCEL_ART.bannerHalo2} style={styles.halo2} />
      <Image source={CANCEL_ART.bannerSun} style={styles.sun} />
      <Image source={CANCEL_ART.bannerCloudA} style={styles.bannerCloudA} />
      <Image source={CANCEL_ART.bannerCloudB} style={styles.bannerCloudB} />
      <View style={styles.mute} />
      <View style={styles.bannerRow}>
        <View style={styles.flexText4}>
          <Text style={styles.bannerDate}>{dayLabel(visit.startsAt)}</Text>
          <Text style={styles.bannerSlot}>{slotRange(visit)}</Text>
        </View>
        <View style={styles.bannerBadgeBox}>
          <View style={styles.bannerBadge}>
            <Image source={CANCEL_ART.badgeRing} style={styles.bannerBadgeRing} />
            <Image source={CANCEL_ART.stateCancelled} style={styles.bannerBadgeIcon} />
          </View>
          <Text style={styles.bannerBadgeText}>CANCELLED</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexText: { flex: 1, minWidth: 0, gap: 2 },
  flexText4: { flex: 1, minWidth: 0, gap: 4 },
  center: { textAlign: 'center' },
  pressed: { opacity: 0.85 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerButton: { width: 44, height: 44, justifyContent: 'center' },
  headerClose: { alignItems: 'flex-end' },
  headerTitle: { flex: 1, minWidth: 0, gap: 2 },
  well: { alignItems: 'center', justifyContent: 'center' },
  wellTint: { backgroundColor: C.tint },
  wellSubtle: { backgroundColor: C.subtle },
  wellBase: { backgroundColor: C.base },
  wellPositive: { backgroundColor: '#ECFF9B' },
  loading: { height: 160, alignItems: 'center', justifyContent: 'center' },
  ticket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ticketCloudA: { position: 'absolute', right: 28.6, top: 4, width: 59.4, height: 28.8 },
  ticketCloudB: { position: 'absolute', right: 11.7, top: 46, width: 36.3, height: 17.6 },
  dateTile: {
    width: 56,
    height: 64,
    borderRadius: 12,
    backgroundColor: C.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: { gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.base,
  },
  timeline: { padding: 16, gap: 16, borderRadius: 16, overflow: 'hidden' },
  timelineCloudA: { position: 'absolute', right: 22, top: 10, width: 66, height: 32 },
  timelineCloudB: { position: 'absolute', right: -1.6, top: 52, width: 39.6, height: 19.2 },
  countdown: { gap: 2 },
  track: { gap: 6 },
  markerLane: { height: 34 },
  marker: {
    position: 'absolute',
    top: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: C.base,
  },
  pointer: {
    position: 'absolute',
    top: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.base,
  },
  zones: { flexDirection: 'row', gap: 4 },
  zoneBar: { flex: 1, height: 10, borderRadius: 5 },
  zoneOn: { backgroundColor: C.brand },
  zoneOff: { backgroundColor: C.base },
  zoneLabel: { flex: 1, minWidth: 0 },
  alignStart: { alignItems: 'flex-start' },
  alignCentre: { alignItems: 'center' },
  alignEnd: { alignItems: 'flex-end' },
  outcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.base,
  },
  goodToKnow: { gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  reasons: { gap: 8 },
  reasonRow: { flexDirection: 'row', gap: 8 },
  reasonTile: {
    flex: 1,
    minHeight: 116,
    gap: 8,
    padding: 12,
    borderRadius: 16,
  },
  reasonWide: { padding: 12, borderRadius: 16, gap: 12 },
  reasonWideRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reasonOn: { backgroundColor: C.tint, borderWidth: 1.5, borderColor: C.brand },
  reasonOff: { backgroundColor: C.base, borderWidth: 1, borderColor: C.border },
  reasonCheck: {
    position: 'absolute',
    right: 12,
    top: 10.5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBox: {
    minHeight: 100,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    backgroundColor: C.base,
    gap: 4,
  },
  // No lineHeight on a TextInput (5eaf2c0).
  detailInput: {
    flex: 1,
    minHeight: 60,
    padding: 0,
    fontFamily: T.body.fontFamily,
    fontSize: T.body.fontSize,
    color: C.text,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  counter: { ...T.micro, color: C.textSecondary, alignSelf: 'flex-end' },
  counterFull: { ...T.microStrong, color: C.text },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: C.subtle,
  },
  nudgeContent: { flex: 1, gap: 16 },
  nudgeButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: C.brand,
  },
  summary: {
    padding: 16,
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.base,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdown: { padding: 16, gap: 12, borderRadius: 16, backgroundColor: C.subtle },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stitch: { height: 2, flexDirection: 'row', gap: 4, overflow: 'hidden' },
  stitchDash: { width: 4, height: 2, borderRadius: 1, backgroundColor: C.brand },
  details: { gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  link: { ...T.captionStrong, color: C.text, textDecorationLine: 'underline' },
  message: { gap: 4 },
  tracker: { padding: 16, gap: 16, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.03)' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: C.subtle,
  },
  banner: { padding: 16, borderRadius: 24, overflow: 'hidden' },
  halo3: { position: 'absolute', left: 214, top: 14, width: 208, height: 208 },
  halo2: { position: 'absolute', left: 238, top: 38, width: 160, height: 160 },
  sun: { position: 'absolute', left: 260, top: 60, width: 116, height: 116 },
  bannerCloudA: { position: 'absolute', left: 192, top: 12, width: 54, height: 26 },
  bannerCloudB: { position: 'absolute', left: 244, top: 42.8, width: 32.4, height: 15.6 },
  mute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(244,243,239,0.8)',
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceRowBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  struckCaption: { ...T.caption, color: C.textSecondary, textDecorationLine: 'line-through' },
  struckBody: { ...T.body, color: C.textSecondary, textDecorationLine: 'line-through' },
  bannerDate: { ...T.displayLarge, color: 'rgba(0,0,0,0.45)' },
  bannerSlot: {
    ...T.bodyStrong,
    color: 'rgba(0,0,0,0.45)',
    textDecorationLine: 'line-through',
  },
  bannerBadgeBox: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bannerBadge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bannerBadgeRing: { position: 'absolute', top: 0, left: 0, width: 36, height: 36 },
  bannerBadgeIcon: { width: 20, height: 20, opacity: 0.45 },
  bannerBadgeText: {
    fontFamily: T.button.fontFamily,
    fontSize: 10,
    letterSpacing: 0.6,
    color: 'rgba(0,0,0,0.45)',
  },
  title: { ...T.title, color: C.text },
  heading: { ...T.heading, color: C.text },
  display: { fontFamily: T.button.fontFamily, fontSize: 24, lineHeight: 32, color: C.text },
  emphasis: { ...T.emphasis, color: C.text },
  button: { ...T.button, color: C.text },
  body: { ...T.body, color: C.text },
  bodySecondary: { ...T.body, color: C.textSecondary },
  bodyStrong: { ...T.bodyStrong, color: C.text },
  bodyStrongSecondary: { ...T.bodyStrong, color: C.textSecondary },
  caption: { ...T.caption, color: C.textSecondary },
  captionPrimary: { ...T.caption, color: C.text },
  captionStrong: { ...T.captionStrong, color: C.text },
  micro: { ...T.micro },
  microSecondary: { ...T.micro, color: C.textSecondary },
  microStrongSecondary: { ...T.microStrong, color: C.textSecondary },
  textPrimary: { color: C.text },
  textSecondary: { color: C.textSecondary },
  icon12: { width: 12, height: 12 },
  icon16: { width: 16, height: 16 },
  icon24: { width: 24, height: 24 },
});
