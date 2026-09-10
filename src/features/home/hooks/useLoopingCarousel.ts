import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import type {
  AppStateStatus,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import type { RefObject } from 'react';

/**
 * The looping-carousel state machine — extracted from `HomePromoCarousel.tsx`, which was the only
 * carousel in the app until the Home booking carousel needed the identical timing/behavior. Two
 * genuine consumers is what justifies pulling this out rather than a second hand-copy that could
 * drift from the first; see `HomePromoCarousel.tsx`'s own doc comment for the full rationale
 * behind every mechanism below (the cloned-track loop, the autoplay lifecycle, the drag-restarts-
 * the-dwell "cycle" bump) — none of that reasoning changes here, only its location.
 *
 * This hook is data-agnostic: it manages POSITION and TIMING only. It works in `trackPosition`s
 * (0..`itemCount + 2*CLONES - 1`) and hands back the LOGICAL item index for each one via `track`,
 * so a caller renders its own item type (an `Image`, a `HomeBookingBanner`, anything) by mapping
 * `track` against its own items array — the hook never touches what's drawn.
 */

/** Cards repeated at each end so both peeks (or, with no peek, both neighbours) stay real at the wrap. */
export const CAROUSEL_CLONES = 2;

export interface UseLoopingCarouselOptions {
  readonly itemCount: number;
  /** The distance between two resting positions — one item's width, plus any gap between items. */
  readonly stride: number;
  /**
   * Owned and created by the CALLER (its own `useRef<ScrollView>(null)`), attached to the
   * caller's own `<ScrollView ref={scrollRef}>` — not returned from this hook. A ref this hook
   * created and handed back out for a caller to spread onto JSX elsewhere is exactly the pattern
   * the `react-hooks/refs` rule exists to catch, since the hook can no longer verify how it's used.
   */
  readonly scrollRef: RefObject<ScrollView | null>;
  /** Overridden in tests so a multi-second timer never gates a test run. Defaults to 4000. */
  readonly autoAdvanceMs?: number;
  /** Whether the host screen is the focused route. Defaults to true. */
  readonly focused?: boolean;
  /**
   * One stable id per item, parallel to whatever array the caller renders `track` against.
   * Without this, `index` is a bare position: if the caller's items get REORDERED while this
   * component stays mounted off-screen (Home sits underneath a pushed Booking Detail screen, so
   * it never unmounts), the hook has no way to know the item the user was looking at moved, and
   * simply keeps showing whatever now sits at that same numeric slot.
   *
   * When provided, a reorder re-anchors `index`/`position` onto the SAME id, instantly and without
   * animation, so returning to the carousel still shows the item the user left it on — the same
   * shape as `HomePromoCarousel`'s promo slides, which never reorder and so never pass this.
   */
  readonly keys?: readonly string[];
}

export interface UseLoopingCarouselResult {
  /** The LOGICAL item on screen (0..itemCount-1). Drives dots/labels; never a clone. */
  readonly index: number;
  /** The logical item index to render at each track position — clones included when looping. */
  readonly track: readonly number[];
  /** Where the real items begin in `track`. */
  readonly firstReal: number;
  readonly isRealTrackPosition: (trackPosition: number) => boolean;
  /**
   * Re-centres the current item without animation. Viewport/geometry live with the caller (this
   * hook only knows `stride`, not the container width), so a caller that re-centres on rotation —
   * the way `HomePromoCarousel` does, because a width change moves its side padding — calls this
   * from its OWN `useEffect` keyed on ITS OWN viewport state. A caller with no such geometry (no
   * side padding to recompute) can simply never call it.
   */
  readonly recenter: () => void;
  readonly scrollViewProps: {
    readonly onContentSizeChange: () => void;
    readonly onScrollBeginDrag: () => void;
    readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    readonly onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    readonly onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  };
}

const DEFAULT_AUTO_ADVANCE_MS = 4000;

/** How long to allow a programmatic step to finish before re-anchoring off a clone. See original. */
const WRAP_SETTLE_MS = 450;

/** How long after the finger lifts to settle anyway, when no momentum event arrives. See original. */
const SETTLE_FALLBACK_MS = 600;

/** Foreground for autoplay purposes — everything that is not backgrounded/inactive. See original. */
function isForeground(status: AppStateStatus | string): boolean {
  return status !== 'background' && status !== 'inactive';
}

export function useLoopingCarousel({
  itemCount,
  stride,
  scrollRef,
  autoAdvanceMs = DEFAULT_AUTO_ADVANCE_MS,
  focused = true,
  keys,
}: UseLoopingCarouselOptions): UseLoopingCarouselResult {
  /** A single item cannot loop, and must not be cloned into a track that pretends it can. */
  const looping = itemCount > 1;
  const firstReal = looping ? CAROUSEL_CLONES : 0;

  const toLogical = useCallback(
    (position: number) =>
      looping ? (((position - CAROUSEL_CLONES) % itemCount) + itemCount) % itemCount : 0,
    [looping, itemCount],
  );

  const track = useMemo<readonly number[]>(() => {
    if (!looping) return Array.from({ length: itemCount }, (_, i) => i);
    const real = Array.from({ length: itemCount }, (_, i) => i);
    const leading = Array.from(
      { length: CAROUSEL_CLONES },
      (_, i) => (itemCount - CAROUSEL_CLONES + i + itemCount) % itemCount,
    );
    const trailing = Array.from({ length: CAROUSEL_CLONES }, (_, i) => i % itemCount);
    return [...leading, ...real, ...trailing];
  }, [itemCount, looping]);

  const [index, setIndex] = useState(0);
  /** Bumped when a MANUAL swipe settles, which is what restarts the dwell. */
  const [cycle, setCycle] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [appActive, setAppActive] = useState(() => isForeground(AppState.currentState));

  /** The item's position in the RENDERED track, clones included. */
  const position = useRef(firstReal);
  /** Set while a finger is down. Auto-advance reads it rather than clearing the interval. */
  const interacting = useRef(false);
  /** True only for a customer-driven scroll, so an automatic step never restarts its own clock. */
  const dragged = useRef(false);
  const wrapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The most recent scroll offset, so the fallback below can settle without an event to read. */
  const lastOffset = useRef(0);
  const didInit = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      setAppActive(isForeground(status));
    });
    return () => subscription.remove();
  }, []);

  const clearWrapTimer = useCallback(() => {
    if (wrapTimer.current !== null) {
      clearTimeout(wrapTimer.current);
      wrapTimer.current = null;
    }
  }, []);

  const clearSettleTimer = useCallback(() => {
    if (settleTimer.current !== null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearWrapTimer();
      clearSettleTimer();
      if (reorderTimer.current !== null) clearTimeout(reorderTimer.current);
    },
    [clearWrapTimer, clearSettleTimer],
  );

  const anchor = useCallback(
    (trackPosition: number, animated: boolean) => {
      scrollRef.current?.scrollTo({ x: trackPosition * stride, y: 0, animated });
    },
    [scrollRef, stride],
  );

  /** Bring the track back onto a REAL item showing the same content. Idempotent. */
  const normalize = useCallback(
    (landed: number) => {
      clearWrapTimer();
      const logical = toLogical(landed);
      const real = firstReal + logical;
      position.current = real;
      setIndex(logical);
      if (real !== landed) anchor(real, false);
      return logical;
    },
    [anchor, clearWrapTimer, firstReal, toLogical],
  );

  /**
   * Re-anchor `index` onto the SAME item when `keys` reorders — e.g. Home never unmounts while a
   * booking is open on top of it, so a reschedule that resorts the list must follow the booking
   * the user was viewing rather than leave `index` pointing at whatever now occupies that slot.
   *
   * `keys` is compared by CONTENT against the last content this effect actually saw, kept in a
   * ref — not by the dependency array's reference check — so this stays correct even if a caller
   * hands over a new array reference every render (as `HomeBookingCarousel` does; only content
   * ever matters here). Without that, a `keys` array that keeps changing reference between
   * renders would otherwise re-detect "a reorder" and re-run the jump on every single render,
   * which — done as a direct state update in the render body, the pattern this used before —
   * doesn't converge and crashes with "Too many re-renders" the moment `keys` isn't perfectly
   * stable. Deferring the actual jump into a timeout keeps the state update OUTSIDE this effect's
   * own synchronous execution — the same reason `wrapTimer`/`settleTimer` above are timeouts
   * rather than direct calls — so it is a normal, one-shot update rather than a render-phase one.
   */
  const seenKeys = useRef(keys);

  useEffect(() => {
    // Cleared unconditionally, before any of the early returns below: a jump scheduled by an
    // earlier run of this SAME effect is only still correct if nothing has changed since. This
    // effect also re-runs on every ORDINARY index change (a swipe, an autoplay step), since
    // `index` is a dependency — and without this, one of those runs finding no reorder of its own
    // would fall through every check below and leave a stale scheduled jump armed, ready to snap
    // the carousel back to a superseded target well after the user has moved on.
    if (reorderTimer.current !== null) {
      clearTimeout(reorderTimer.current);
      reorderTimer.current = null;
    }

    const previous = seenKeys.current;
    seenKeys.current = keys;
    if (keys === undefined || previous === undefined) return;

    const reordered = previous.length !== keys.length || previous.some((key, i) => key !== keys[i]);
    if (!reordered) return;

    const viewedKey = previous[index];
    if (viewedKey === undefined) return;
    const relocated = keys.indexOf(viewedKey);
    // Not found means the viewed item is gone (rated, cancelled window elapsed, ...) — fall back
    // to the nearest still-valid slot rather than pointing past a shrunken track.
    const nextLogical =
      relocated === -1 ? Math.min(index, Math.max(keys.length - 1, 0)) : relocated;
    if (nextLogical === index) return;

    reorderTimer.current = setTimeout(() => {
      reorderTimer.current = null;
      const real = firstReal + nextLogical;
      position.current = real;
      setIndex(nextLogical);
      anchor(real, false);
    }, 0);
  }, [keys, index, firstReal, anchor]);

  /** One step forward, wrapping through the clone rather than rewinding across the track. */
  const advance = useCallback(() => {
    if (!looping) return;
    const next = position.current + 1;
    position.current = next;
    setIndex(toLogical(next));
    anchor(next, true);

    if (next >= firstReal + itemCount) {
      clearWrapTimer();
      wrapTimer.current = setTimeout(() => {
        wrapTimer.current = null;
        normalize(next);
      }, WRAP_SETTLE_MS);
    }
  }, [anchor, clearWrapTimer, itemCount, firstReal, looping, normalize, toLogical]);

  /**
   * The single autoplay interval. Every reason to stop is a DEPENDENCY, not a branch inside the
   * tick, so stopping is the effect being torn down.
   */
  useEffect(() => {
    if (!looping || !focused || !appActive || reduceMotion || autoAdvanceMs <= 0) return;

    const timer = setInterval(() => {
      if (interacting.current) return;
      advance();
    }, autoAdvanceMs);

    return () => clearInterval(timer);
  }, [looping, focused, appActive, reduceMotion, autoAdvanceMs, advance, cycle]);

  const recenter = useCallback(() => {
    if (!didInit.current || interacting.current) return;
    anchor(position.current, false);
  }, [anchor]);

  /** Start on the first REAL item, not on the leading clone. Content size, not layout, is the signal. */
  const onContentSizeChange = useCallback(() => {
    if (didInit.current) return;
    didInit.current = true;
    anchor(firstReal, false);
  }, [anchor, firstReal]);

  const settle = useCallback(
    (offsetX: number) => {
      clearSettleTimer();
      const landed = Math.round(offsetX / stride);
      normalize(landed);
      interacting.current = false;
      if (dragged.current) {
        dragged.current = false;
        setCycle((previous) => previous + 1);
      }
    },
    [clearSettleTimer, normalize, stride],
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      settle(event.nativeEvent.contentOffset.x);
    },
    [settle],
  );

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    lastOffset.current = event.nativeEvent.contentOffset.x;
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    interacting.current = true;
    dragged.current = true;
    clearWrapTimer();
  }, [clearWrapTimer]);

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      lastOffset.current = offsetX;
      if (Math.abs(offsetX - Math.round(offsetX / stride) * stride) < 1) {
        settle(offsetX);
        return;
      }
      clearSettleTimer();
      settleTimer.current = setTimeout(() => {
        settleTimer.current = null;
        settle(lastOffset.current);
      }, SETTLE_FALLBACK_MS);
    },
    [clearSettleTimer, settle, stride],
  );

  const isRealTrackPosition = useCallback(
    (trackPosition: number) => trackPosition >= firstReal && trackPosition < firstReal + itemCount,
    [firstReal, itemCount],
  );

  return {
    index,
    track,
    firstReal,
    isRealTrackPosition,
    recenter,
    scrollViewProps: {
      onContentSizeChange,
      onScrollBeginDrag,
      onScroll,
      onMomentumScrollEnd,
      onScrollEndDrag,
    },
  };
}
