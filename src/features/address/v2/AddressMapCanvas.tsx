import { memo, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import type { Details, Region } from 'react-native-maps';

import type { DeviceCoordinates } from '../location/deviceLocation';
import { C, SHADOW_2 } from './theme';

/**
 * `53:33` — the Google surface, and the whole of the camera's behaviour.
 *
 * Its own component for two reasons. It MOUNTS with a point, so the region the map opens on is a
 * genuine mount-time value rather than something the screen has to freeze by hand. And `memo`
 * means the map is not re-rendered by anything that is not a new point: the geocode landing, the
 * serviceability verdict arriving, a keystroke in the search field, the helper pill changing —
 * none of them reach it. A `MapView` that is not re-rendered cannot be re-created, and cannot
 * stutter under a finger.
 *
 * ## The camera is never a controlled prop
 *
 * `region` is deliberately not used. A controlled region is re-applied on every render, so the map
 * snapped back the instant a finger left it. `initialRegion` frames the first point and the camera
 * belongs to the customer from then on; it is re-aimed only imperatively, and only for a point
 * that came from somewhere OTHER than this map — the device fix, a chosen Places result.
 */
export const AddressMapCanvas = memo(function AddressMapCanvas({
  coordinate,
  onSettle,
  onGestureStart,
}: {
  /** The selected point. On mount it is what the camera opens on. */
  readonly coordinate: DeviceCoordinates;
  /** The map came to rest somewhere new. Carries the coordinate under the fixed pin. */
  readonly onSettle: (coordinate: DeviceCoordinates) => void;
  /** A finger has taken hold of the map. */
  readonly onGestureStart: () => void;
}) {
  const mapRef = useRef<MapView>(null);
  const { top } = useSafeAreaInsets();
  /** The map's bearing once it has settled; 0 is north up. Drives our compass (see below). */
  const [heading, setHeading] = useState(0);

  /**
   * The region the map OPENS on, evaluated once — `useState`'s initialiser runs on mount only.
   *
   * Handing `MapView` a fresh object literal every render would push a new prop across on every
   * geocode and every keystroke. The SDK reads `initialRegion` exactly once, so all that traffic
   * buys nothing and risks disturbing a surface a finger may be on.
   */
  const [initialRegion] = useState<Region>(() => ({
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: MAP_SPAN,
    longitudeDelta: MAP_SPAN,
  }));

  /**
   * The point the CAMERA is aimed at, which is not always the point that is selected.
   *
   * It starts at the mount coordinate, because `initialRegion` has just framed exactly that. It is
   * written BEFORE `onSettle`, so a point the customer panned to is already the camera's target by
   * the time it comes back down as a prop — and the effect below then leaves the view precisely
   * where they left it. Only a point that differs from this one recentres.
   */
  const cameraTarget = useRef<DeviceCoordinates>(coordinate);

  /**
   * A finger is moving the map right now (set on `onRegionChangeStart`, for a GESTURE only).
   *
   * A ref rather than state, deliberately: a pan must cause no render of its own. Its single job is
   * to stand the camera effect down — an `animateToRegion` on the frames a finger is panning is the
   * map fighting the gesture, and the customer's fingers outrank every other source of a point.
   */
  const gesturing = useRef(false);

  /**
   * A recentre WE started is still flying.
   *
   * `animateToRegion` ends in the same `onRegionChangeComplete` a customer's pan does, and the two
   * must not be confused. Committing our own recentre back through `onSettle` would discard the
   * address Places already gave us, retire a device fix still in flight, and pay for a second
   * reverse geocode of a point that was just selected. Worse, the settled centre is never
   * bit-identical to the requested one, so every commit would re-trigger the effect — a slow camera
   * drift that never converges.
   *
   * `isGesture` is the SDK's own answer and is trusted when it says "yes" (Google Maps on both
   * platforms here). This flag covers the "no"/undefined case, and the timer is the guarantee: a
   * map that never reports idle — no Maps key, the view detached mid-animation — must not leave the
   * flag set, because the next thing it would swallow is the customer's own pan.
   */
  const recentring = useRef(false);
  const recentringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (recentringTimer.current !== null) clearTimeout(recentringTimer.current);
    },
    [],
  );

  const { latitude, longitude } = coordinate;

  useEffect(() => {
    // Never move the camera under a live gesture. Their own settle commits where they landed.
    if (gesturing.current) return;
    if (sameCoordinate(cameraTarget.current, { latitude, longitude })) return;

    cameraTarget.current = { latitude, longitude };
    recentring.current = true;
    if (recentringTimer.current !== null) clearTimeout(recentringTimer.current);
    recentringTimer.current = setTimeout(() => {
      recentring.current = false;
    }, MAP_RECENTRE_MS + MAP_SETTLE_GRACE_MS);

    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: MAP_SPAN, longitudeDelta: MAP_SPAN },
      MAP_RECENTRE_MS,
    );
  }, [latitude, longitude]);

  /**
   * A gesture has taken hold of the map. Nothing is committed here — this is the frame the
   * PREDICTIONS have to go, because they are drawn over the top of the canvas the customer has just
   * grabbed and would otherwise float above ground that is moving underneath them.
   *
   * `onGestureStart` is a no-op when the list is already closed, so the common case — every pan of
   * a screen with no search open — causes no render at all.
   */
  const handleRegionChangeStart = (_region: Region, details: Details) => {
    if (details.isGesture === false) return;
    gesturing.current = true;
    onGestureStart();
  };

  /**
   * The map came to REST. This is the only place a coordinate is ever taken from it.
   *
   * `region` is the centre of the visible camera, and the pin's tip is nailed to that same centre
   * (see the screen's centre pin), so `region.latitude` / `region.longitude` IS the ground under the
   * pin. That identity holds because the canvas carries no `mapPadding` and rotation and tilt are
   * off — the visible region is then a north-up rectangle centred on the camera target.
   */
  const handleRegionChangeComplete = (region: Region, details: Details) => {
    // A gesture arriving while our recentre is still flying wins: the customer took the map over
    // mid-animation, and where THEY left it is the answer.
    const ours = recentring.current && details.isGesture !== true;
    recentring.current = false;
    if (recentringTimer.current !== null) {
      clearTimeout(recentringTimer.current);
      recentringTimer.current = null;
    }
    gesturing.current = false;
    void mapRef.current
      ?.getCamera()
      .then((camera) => setHeading(Math.round(camera.heading) % 360))
      .catch(() => undefined);

    const centre = { latitude: region.latitude, longitude: region.longitude };
    if (ours) {
      // Our own recentre landing. The point is already selected; re-selecting it would throw away
      // the address it came with.
      cameraTarget.current = centre;
      return;
    }

    // The map settled where it already was — the idle every map raises once it has loaded, a pinch
    // that returned to the same centre, a tap that moved nothing. Committing it buys a duplicate
    // geocode and nothing else.
    if (sameCoordinate(cameraTarget.current, centre)) return;

    // Written BEFORE the commit, so the point coming back down as a prop is already the camera's
    // target and the effect above leaves the view exactly where the customer left it.
    cameraTarget.current = centre;
    onSettle(centre);
  };

  const northUp = () => {
    void mapRef.current?.getCamera().then((camera) => {
      mapRef.current?.animateCamera({ ...camera, heading: 0 }, { duration: 300 });
      setHeading(0);
    });
  };

  return (
    <>
      <MapView
        ref={mapRef}
        style={styles.mapCanvas}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        /**
         * The map moving, and the map coming to rest. NOTHING is read from it in between:
         * `onRegionChange` fires on every animation frame, and hanging a selection — let alone a
         * reverse geocode — off it is exactly the per-frame work that stutters a pan. The pin does
         * not follow those events either; it cannot, because it is not on the map.
         *
         * There is deliberately NO `onPress`. Tapping the canvas used to teleport the pin to whatever
         * the finger landed on — the "pin jumps wherever you touch" defect. A tap is how a pan
         * BEGINS, not how an address is chosen.
         */
        onRegionChangeStart={handleRegionChangeStart}
        onRegionChangeComplete={handleRegionChangeComplete}
        /**
         * Pan, zoom and rotation are on, as on the delivery apps customers know (owner, 2026-10-14).
         * Rotation keeps the pin honest: the visible region turns about the camera target, so its
         * bounding box stays centred on it and the settle still reports the point under the pin's
         * tip. Tilt stays off: a tilted camera's visible region is a trapezoid whose bounding-box
         * centre is NOT the camera target. A compass shows once the map is turned, and a tap on it
         * turns north back up.
         */
        scrollEnabled
        zoomEnabled
        rotateEnabled
        // Google's compass sits in the map's top-left corner, under the status bar and the back
        // button here. Ours (below) sits under the search bar instead.
        showsCompass={false}
        pitchEnabled={false}
        // No custom style: Google's own map, as the delivery apps customers know draw it (owner,
        // 2026-10-14). A style repaints the building footprints into the land, so a customer could
        // not tell which building they were putting the pin on.
        // The DEVICE's own fix, drawn by the SDK as its standard blue dot. It is not the selected
        // location — that is the red pin above it — and the two are allowed to sit apart: the
        // customer may be placing an address they are not standing at.
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        testID="address-map-canvas"
      />
      {heading === 0 ? null : (
        // The map is turned: a compass under the search bar (its 48pt row sits 8 below the inset),
        // pointing north. A tap turns north back up and the compass goes away.
        <Pressable
          onPress={northUp}
          accessibilityRole="button"
          accessibilityLabel="Turn the map north up"
          hitSlop={8}
          style={[styles.compass, SHADOW_2, { top: top + 8 + 48 + 12 }]}
          testID="address-map-compass"
        >
          <View style={[styles.needle, { transform: [{ rotate: `${-heading}deg` }] }]}>
            <View style={styles.needleNorth} />
            <View style={styles.needleSouth} />
          </View>
        </Pressable>
      )}
    </>
  );
});

/**
 * How much ground the camera shows around the pin: ~170 m across, close enough that Google draws
 * each building as a shape (it stops below zoom ~17), so the customer can put the pin on their
 * own building, as the delivery apps they use do.
 */
const MAP_SPAN = 0.0016;

/** Long enough to read as the map travelling to the new point rather than cutting to it. */
const MAP_RECENTRE_MS = 350;

/**
 * How long after a recentre the "this settle is ours" flag may survive unanswered.
 *
 * A map that never reports idle — no Maps key, the view detached mid-animation, the SDK dropping
 * the callback — must not leave the flag set, because the next thing it would swallow is the
 * customer's own pan. Generous enough that a slow animation is never mistaken for a lost one.
 */
const MAP_SETTLE_GRACE_MS = 1500;

/**
 * How close two coordinates have to be before they are the SAME point. ~1 cm.
 *
 * Two things need this. The camera's reported centre is derived from the visible region's BOUNDS
 * rather than read back off the camera, so it returns a point a fraction of a millimetre from the
 * one that was requested and an `===` comparison would call every recentre a move. And the map
 * emits an idle after it first loads, at the centre it was already given — a settle that must not
 * be mistaken for the customer choosing something.
 *
 * It sits between the two. The bounds-centre error is around 10⁻⁹°; one screen pixel of pan is
 * about 7 × 10⁻⁷° even at the SDK's maximum zoom, and metres per pixel at the zoom this screen
 * actually opens at. So the smallest deliberate nudge a customer can make is still several times
 * this, and nothing they do is ever swallowed.
 */
const MAP_SETTLE_EPSILON = 1e-7;

function sameCoordinate(a: DeviceCoordinates, b: DeviceCoordinates): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < MAP_SETTLE_EPSILON &&
    Math.abs(a.longitude - b.longitude) < MAP_SETTLE_EPSILON
  );
}

const styles = StyleSheet.create({
  mapCanvas: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  compass: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: { width: 8, height: 26, alignItems: 'center' },
  needleNorth: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#E53935',
  },
  needleSouth: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.textDisabled,
  },
});
