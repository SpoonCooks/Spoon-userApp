import { useCallback, useReducer, useRef, useState } from 'react';
import { Image, LayoutAnimation, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QueryBoundary } from '@ui';

import { ART } from '../assets';
import { BookSection } from '../components/BookSection';
import { CooksTrust } from '../components/CooksTrust';
import { DaySorted } from '../components/DaySorted';
import { DurationDial } from '../components/DurationDial';
import { HeroBanner } from '../components/HeroBanner';
import { HomeHeader } from '../components/HomeHeader';
import { NotIncluded } from '../components/NotIncluded';
import { NotLiveCard } from '../components/NotLiveCard';
import type { NotifyState } from '../components/NotLiveCard';
import { PromiseFooter } from '../components/Promise';
import { RecurringPool } from '../components/RecurringPool';
import { ShareCard } from '../components/ShareCard';
import { SHARE_MESSAGE } from '../content';
import { useHomeRedesignData } from '../data';
import { shareSpoon } from '../share';
import { canBook, draftReducer, initialDraft } from '../state/bookingDraft';
import type { BookingDraft, BookingMode } from '../state/bookingDraft';
import { recommendDuration } from '../state/recommendDuration';
import type { DialInputs } from '../state/recommendDuration';
import { isRecurringUnlocked, poolBeads, recurringChipFor } from '../state/recurring';
import type { RecurringTarget } from '../state/recurring';
import { resolveHomeVariant } from '../state/variant';
import { C } from '../theme';
import type { DurationOption, HomeModel, PoolCook } from '../types';

/** What the customer chose, handed to the booking flow. */
export interface BookingRequest {
  readonly duration: DurationOption;
  readonly dishes: number;
  readonly people: number;
  readonly complexity: BookingDraft['complexity'];
}

/**
 * Every place Home hands off to. The screen owns no navigation; the route decides where each goes.
 */
export interface HomeRedesignActions {
  /** Building label → address picker. */
  readonly onPressAddress: () => void;
  /** Avatar → profile. */
  readonly onPressProfile: () => void;
  /** "Book now" on Now → the confirm step. */
  readonly onBookNow: (request: BookingRequest) => void;
  /** "Book now" on Later → the slot picker. */
  readonly onPickSlot: (request: BookingRequest) => void;
  /** "Check payment details" → the tax dialog for the priced tile. */
  readonly onPressPaymentDetails: (duration: DurationOption) => void;
  /** The recurring chip: recurring flow, plan tracker or explainer. */
  readonly onPressRecurring: (target: RecurringTarget) => void;
  readonly onPressCookPool: () => void;
  /** Bead → cook profile (proposed in the dev note). */
  readonly onPressPoolCook: (cook: PoolCook) => void;
  /**
   * "Notify me" — idempotent register for {user, pincode}, asking notification permission at
   * the tap (see `joinWaitlist`). Rejects only if the register fails.
   */
  readonly onJoinWaitlist: (pincode: string) => Promise<void>;
  /** Defaults to `shareSpoon`: WhatsApp first, the system share sheet otherwise. */
  readonly onShare?: () => void;
}

export interface HomeRedesignViewProps extends HomeRedesignActions {
  readonly model: HomeModel;
  readonly initialMode?: BookingMode;
}

/**
 * The redesigned Home — Figma `cCQlzTeiObQkpVBzwI8mZi`, one screen with three variants resolved
 * from the payload (`resolveHomeVariant`), never from a client guess:
 *
 *   default    `941:4884`   live pincode, no booking history
 *   returning  `1255:2973`  default + the pool / recurring block under the CTA;
 *              `1290:1280`  on Recurring the duration strip and CTA give way to that block
 *   inactive   `1302:3539`  not live — waitlist + referral, no booking path, read-only dial
 */
export function HomeRedesignView({ model, initialMode, ...actions }: HomeRedesignViewProps) {
  const { top, bottom } = useSafeAreaInsets();
  const variant = resolveHomeVariant(model);
  const scroll = useRef<ScrollView>(null);
  const bodyY = useRef(0);
  const dialY = useRef(0);

  const [draft, dispatch] = useReducer(
    draftReducer,
    {
      focusedDurationId: model.focusedDurationId,
      instantAvailable: model.instant.available,
      mode: initialMode,
    },
    (input) =>
      initialDraft({
        focusedDurationId: input.focusedDurationId,
        instantAvailable: input.instantAvailable,
        ...(input.mode === undefined ? {} : { mode: input.mode }),
      }),
  );

  // A refreshed payload may drop the tile the draft points at; fall back to the server's focus.
  const durationIds = model.durations.map((d) => d.id);
  const focusedId = durationIds.includes(draft.focusedDurationId)
    ? draft.focusedDurationId
    : model.focusedDurationId;
  const selectedId =
    draft.selectedDurationId !== null && durationIds.includes(draft.selectedDurationId)
      ? draft.selectedDurationId
      : null;

  const recurringUnlocked = variant === 'returning' && isRecurringUnlocked(model);
  const mode: BookingMode = draft.mode === 'recurring' && !recurringUnlocked ? 'now' : draft.mode;
  const disabledModes = { now: !model.instant.available, recurring: !recurringUnlocked };
  const bookable = canBook(
    { ...draft, mode, selectedDurationId: selectedId },
    model.instant.available,
  );

  const inputs: DialInputs = {
    complexity: draft.complexity,
    dishes: draft.dishes,
    people: draft.people,
  };
  const recommended = recommendDuration(inputs, model.durations);

  const changeMode = (next: BookingMode) => {
    if (next === mode) return;
    // Recurring removes the strip and CTA; animate the content moving up (and back).
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dispatch({ type: 'setMode', mode: next });
  };

  /** The dial's result selects the tile, so changing an input picks the new recommendation. */
  const changeInputs = (next: DialInputs) => {
    if (next.complexity !== draft.complexity) {
      dispatch({ type: 'setComplexity', complexity: next.complexity });
    }
    if (next.dishes !== draft.dishes) dispatch({ type: 'setDishes', value: next.dishes });
    if (next.people !== draft.people) dispatch({ type: 'setPeople', value: next.people });
    const pick = recommendDuration(next, model.durations);
    if (pick !== null) dispatch({ type: 'selectDuration', id: pick.id });
  };

  const request = (): BookingRequest | null => {
    const duration = model.durations.find((d) => d.id === selectedId);
    if (duration === undefined) return null;
    return { duration, dishes: draft.dishes, people: draft.people, complexity: draft.complexity };
  };

  const book = () => {
    const chosen = request();
    if (chosen === null) return;
    if (mode === 'later') actions.onPickSlot(chosen);
    else actions.onBookNow(chosen);
  };

  // Waitlist button: disabled "You're on the list" on load when the server says joined.
  const joined = model.waitlist?.joined === true;
  const [localNotify, setNotifyState] = useState<NotifyState>('idle');
  const notifyState: NotifyState = joined ? 'joined' : localNotify;

  const notify = () => {
    if (notifyState !== 'idle') return;
    setNotifyState('pending');
    actions.onJoinWaitlist(model.address.pincode).then(
      () => setNotifyState('joined'),
      () => setNotifyState('idle'),
    );
  };

  const share = actions.onShare ?? (() => void shareSpoon(SHARE_MESSAGE));
  const showPool = variant === 'returning';

  return (
    <View style={styles.screen} testID="home-redesign-screen">
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top, paddingBottom: bottom }}
      >
        <Image source={ART.glows} style={styles.glows} resizeMode="stretch" />
        <HomeHeader
          addressLabel={model.address.label}
          notLive={variant === 'inactive'}
          onPressAddress={actions.onPressAddress}
          onPressProfile={actions.onPressProfile}
        />
        <View
          style={styles.body}
          onLayout={(e) => {
            bodyY.current = e.nativeEvent.layout.y;
          }}
        >
          {/* Decorative. */}
          <HeroBanner />

          {variant === 'inactive' && model.waitlist !== null ? (
            <NotLiveCard
              pincode={model.address.pincode}
              liveHubs={model.liveHubs}
              waitlist={model.waitlist}
              notifyState={notifyState}
              onPressNotify={notify}
              onPressShare={share}
            />
          ) : null}

          {variant === 'inactive' ? null : (
            <BookSection
              etaMins={model.instant.available ? model.instant.etaMins : null}
              mode={mode}
              onChangeMode={changeMode}
              disabledModes={disabledModes}
              durations={model.durations}
              focusedDurationId={focusedId}
              selectedDurationId={selectedId}
              onFocusDuration={(id) => dispatch({ type: 'focusDuration', id })}
              onSelectDuration={(id) => dispatch({ type: 'selectDuration', id })}
              canBook={bookable}
              onPressBook={book}
              onPressHelpMePick={() =>
                scroll.current?.scrollTo({ y: bodyY.current + dialY.current - top, animated: true })
              }
              onPressPaymentDetails={() => {
                const priced = model.durations.find((d) => d.id === (selectedId ?? focusedId));
                if (priced !== undefined) actions.onPressPaymentDetails(priced);
              }}
            />
          )}

          {showPool ? (
            <RecurringPool
              beads={poolBeads(model)}
              chip={recurringChipFor(model)}
              onPressChip={() => actions.onPressRecurring(recurringChipFor(model).target)}
              onPressCookPool={actions.onPressCookPool}
              onPressCook={actions.onPressPoolCook}
            />
          ) : null}

          <DaySorted />

          <View
            onLayout={(e) => {
              // Relative to the body; Help me pick adds the body's offset and parks the dial's
              // heading just under the status bar.
              dialY.current = e.nativeEvent.layout.y;
            }}
          >
            <DurationDial
              durations={model.durations}
              recommended={recommended}
              inputs={inputs}
              {...(variant === 'inactive' ? {} : { onChangeInputs: changeInputs })}
            />
          </View>

          <CooksTrust />
          <NotIncluded />
          {variant === 'inactive' ? <ShareCard onPressShare={share} /> : null}
          <PromiseFooter />
        </View>
      </ScrollView>
    </View>
  );
}

export interface HomeRedesignScreenProps extends HomeRedesignActions {
  /** The payload to serve until the endpoint exists (dev fixture). */
  readonly sample: HomeModel;
  readonly initialMode?: BookingMode;
}

/** Re-reads Home on every focus, which re-resolves the variant (address or history changes). */
export function HomeRedesignScreen({ sample, initialMode, ...actions }: HomeRedesignScreenProps) {
  const { state, refetch } = useHomeRedesignData(sample);
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <View style={styles.screen}>
      <QueryBoundary state={state} onRetry={refetch}>
        {(model) => (
          <HomeRedesignView
            model={model}
            {...(initialMode === undefined ? {} : { initialMode })}
            {...actions}
          />
        )}
      </QueryBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.base },
  /** `941:4885` — soft yellow glows drawn behind the whole page; they scroll with it. */
  glows: { position: 'absolute', top: 0, left: 0, right: 0, height: 3027 },
  body: { gap: 24 },
});
