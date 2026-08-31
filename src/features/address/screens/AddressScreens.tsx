import { memo, useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { ImageSourcePropType, KeyboardTypeOptions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import type { Details, Region } from 'react-native-maps';

import type { DataState } from '@core/data';
import type { DeviceCoordinates } from '../location/deviceLocation';
import type { PlaceSuggestion } from '../location/googlePlaces';
import type { AddressSearchState } from '../location/useAddressLocation';
import { LIGHT_MAP_STYLE } from '../location/lightMapStyle';
import { canSubmitAddress, isOthersSelected, othersLabelIdOf } from '../validation';
import type { AddressFormShape } from '../validation';
import {
  ADDRESS_ACTION_DELETE,
  ADDRESS_ACTION_EDIT,
  ADDRESS_ADD_GLYPH,
  ADDRESS_CHANGE_AREA_ART,
  ADDRESS_LOCATION_GLYPH,
  ADDRESS_MAP_PIN,
  ADDRESS_OUT_OF_SERVICE_ART,
  ADDRESS_ROW_MENU,
  BottomSheet,
  Button,
  EmptyState,
  Icon,
  QueryBoundary,
  ScreenHeader,
  Text,
  lightTheme,
  useBottomGutter,
  useKeyboardHeight,
} from '@ui';

import type {
  AddressDetailsViewModel,
  AddressEditViewModel,
  AddressListViewModel,
  AddressLocationViewModel,
  AddressOutOfServiceViewModel,
} from '../types';

/**
 * Address flow — Figma `68:214` (saved list), `53:31` (map / pin), `60:655` (details form) and
 * `215:1472` (out of service).
 *
 * All four instance the shared `63:783` header (`275:5187` / `63:783` / `275:4477` / `275:5179`):
 * a 338 × 38 white bar, px 4 / py 6, a 12pt gap, a 32pt back disc and a Livvic Black 20/28 title.
 * It carries NO underline.
 *
 * Every step draws that header INSIDE a 16pt-gutter body column (`53:32` / `60:656` / `68:215` /
 * `221:1553`), 16pt down from the top — which is why each screen pads its own column rather than
 * letting `ScreenHeader` run edge to edge.
 *
 * Deviation, recorded in the audit: `53:37`'s map is an unbranded placeholder illustration in
 * Figma, not a provider render, and the map SDK is still an open engineering choice. The canvas
 * renders at the frame's `rgba(255,247,204,0.2)` with the real 46 × 43 pin on top; everything
 * around it — search bar, helper pill, resolved-address row and Confirm CTA — is the frame.
 *
 * Ruling R-4: serviceability is surfaced INLINE in the map step using the helper-pill treatment
 * the frame already provides. There is no separate rejection screen and none is invented. The
 * client never evaluates coverage — `serviceabilityMessage` is a server string.
 */

/* ------------------------------------------------------------------ saved list */

export interface SavedAddressesViewProps {
  readonly state: DataState<AddressListViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly onAdd: () => void;
  readonly onSelect: (id: string) => void;
  /** NEW `68:214` — the row kebab, which raises the `228:1801` Edit / Delete sheet. */
  readonly onOpenActions: (id: string) => void;
}

export function SavedAddressesView({
  state,
  onRetry,
  onBack,
  onAdd,
  onSelect,
  onOpenActions,
}: SavedAddressesViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <QueryBoundary state={state} onRetry={onRetry} loadingVariant="screen">
        {(list) => (
          <>
            <ScrollView contentContainerStyle={styles.listBody} testID="saved-addresses-screen">
              <ScreenHeader title={list.title} onBack={onBack} testID="address-header" />

              {/* `69:514` — an `#FFEF99` 41pt bar with the 28pt add mark on the right. */}
              <Pressable
                onPress={onAdd}
                accessibilityRole="button"
                accessibilityLabel={list.addCtaLabel}
                style={({ pressed }) => [styles.addCard, pressed ? styles.pressed : null]}
                testID="address-add"
              >
                {/* `69:515` — a 28pt row centring the label against the mark. */}
                <View style={styles.addCardRow}>
                  <Text variant="title" color="textField">
                    {list.addCtaLabel}
                  </Text>
                  {/* `69:533` draws itself at `inset -14.29%`: a 36pt mark in a 28pt box. */}
                  <View style={styles.addGlyphBox}>
                    <Image
                      source={ADDRESS_ADD_GLYPH}
                      style={styles.addGlyph}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors
                    />
                  </View>
                </View>
              </Pressable>

              {list.addresses.length === 0 ? (
                <EmptyState
                  title={list.emptyTitle}
                  description={list.emptyDescription}
                  icon="pin"
                  actionLabel={list.addCtaLabel}
                  onAction={onAdd}
                  testID="address-empty"
                />
              ) : (
                /* `230:1955` — white, 1pt `#E2E8F0`, 24pt radius, 15.889pt padding, 12pt gap. */
                <View style={styles.listCard} testID="address-list">
                  <Text variant="title" color="textField">
                    {list.sectionTitle}
                  </Text>

                  {/* `230:1959` — the rows sit 8pt apart, not at the card's 12pt gap. */}
                  <View style={styles.addressRows}>
                    {list.addresses.map((address) => (
                      <View key={address.id} style={styles.addressRow}>
                        <Pressable
                          onPress={() => onSelect(address.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`${address.label}. ${address.line}`}
                          accessibilityState={{ selected: address.selected ?? false }}
                          style={({ pressed }) => [
                            styles.addressRowBody,
                            pressed ? styles.pressed : null,
                          ]}
                          testID={`address-row-${address.id}`}
                        >
                          <Text variant="bodyBold" color="textStrong">
                            {address.label}
                          </Text>
                          {/* `230:1965` truncates each saved line to ONE line, not two. */}
                          <Text variant="noteBody" color="textFieldLabel" numberOfLines={1}>
                            {address.line}
                          </Text>
                        </Pressable>

                        {/* `230:1969` — the exported 20 x 32 kebab, which opens the `228:1801`
                            Edit / Delete sheet. */}
                        <Pressable
                          onPress={() => onOpenActions(address.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Options for ${address.label}`}
                          hitSlop={14}
                          style={({ pressed }) => [styles.rowMenu, pressed ? styles.pressed : null]}
                          testID={`address-row-menu-${address.id}`}
                        >
                          <Image
                            source={ADDRESS_ROW_MENU}
                            style={styles.rowMenuArt}
                            resizeMode="contain"
                            accessibilityIgnoresInvertColors
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ map / pin */

/**
 * The live half of `53:31` — everything the static view model cannot carry.
 *
 * Passed as ONE object rather than eight props because it is one thing: the interactive map step.
 * Optional, so the screen still renders (map panel empty, search inert) for a host that has no
 * location stack — which is what the dev menu and the view tests use.
 */
export interface AddressLocationMap {
  /** `null` until a point exists. NO map is drawn without one — see the empty branch below. */
  readonly coordinates: DeviceCoordinates | null;
  /**
   * `53:33` — the map came to REST, and this is the coordinate under the fixed centre pin.
   *
   * Named for the camera, not for the pin, because the pin never moves: it is a screen overlay
   * nailed to the middle of the canvas, and it is the ground that travels beneath it. Raised once
   * per settle — never per frame — so the reverse geocode behind it runs once per gesture.
   * LOCAL; nothing networked, nothing navigational (task §5, §6).
   */
  readonly onSettle: (coordinates: DeviceCoordinates) => void;
  readonly query: string;
  readonly suggestions: readonly PlaceSuggestion[];
  readonly searchState: AddressSearchState;
  readonly onSearch: (text: string) => void;
  readonly onChooseSuggestion: (placeId: string) => void;
  readonly onDismissSuggestions: () => void;
}

export interface AddressLocationViewProps {
  readonly state: DataState<AddressLocationViewModel>;
  readonly onRetry: () => void;
  /**
   * OMIT for the FIRST-TIME customer (V7 founder comment, task §4): this screen is the first
   * thing after OTP for an account with no address, and there is nothing behind it to go back to.
   * A repeat customer adding an address reaches it from `68:214` and gets the disc.
   *
   * The distinction is FLOW CONTEXT, not navigation history — the route decides it from the
   * `onboarding` parameter the address gate set, so the same route never renders the wrong
   * affordance because of how the stack happens to look.
   */
  readonly onBack?: (() => void) | undefined;
  readonly onConfirm: () => void;
  readonly onSearch?: (value: string) => void;
  readonly map?: AddressLocationMap;
  /**
   * Whether a point exists to confirm. Defaults to true so the view tests and the dev menu — which
   * mount this screen with no live map — still render the CTA as drawn.
   *
   * It is deliberately NOT derived from `serviceabilityMessage`: a refusal for the LAST point must
   * not disable the CTA for the next one, or the customer is stranded the first time they pin
   * somewhere Spoon does not reach (§8).
   */
  readonly canConfirm?: boolean;
  /** `53:59`'s own pending state while the serviceability check runs. LOCAL to the button (§7). */
  readonly confirming?: boolean;
}

export function AddressLocationView({
  state,
  onRetry,
  onBack,
  onConfirm,
  onSearch,
  map,
  canConfirm = true,
  confirming = false,
}: AddressLocationViewProps) {
  /** `53:110` leaves 12 under the CTA; the handset's gesture strip may need more. */
  const bottomGutter = useBottomGutter(lightTheme.space.md);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <QueryBoundary state={state} onRetry={onRetry} loadingVariant="screen">
        {(location) => (
          <View
            style={[styles.locationBody, { paddingBottom: bottomGutter }]}
            testID="address-location-screen"
          >
            <ScreenHeader title={location.title} onBack={onBack} testID="address-header" />

            {/* `63:761` — the search bar sits in its own sticky bar below the header. */}
            <View style={styles.searchBar}>
              <Text variant="bodyStrong" color="textSecondary">
                {location.searchLabel}
              </Text>
              <View style={styles.searchField}>
                <Icon name="search" size={16} color="textSecondary" />
                <SearchInput
                  key={map === undefined ? location.searchValue : 'live'}
                  value={map?.query ?? location.searchValue}
                  placeholder={location.searchPlaceholder}
                  onChange={(next) => {
                    map?.onSearch(next);
                    onSearch?.(next);
                  }}
                />
              </View>

              {/* Places predictions, drawn UNDER the field inside the same sticky bar so they
                  cover the map rather than pushing the panel down (which would move the pin the
                  customer is aiming). FIGMA_PENDING — `53:63` draws the field but no result list. */}
              {map === undefined ? null : (
                <AddressSearchResults
                  suggestions={map.suggestions}
                  searchState={map.searchState}
                  onChoose={map.onChooseSuggestion}
                />
              )}
            </View>

            {/*
              `53:33` — the map canvas, now the real Google map.

              It is drawn ONLY once a point exists. A map has to be centred on something, and the
              only honest somethings are the device's fix or a place the customer chose; centring
              on a hardcoded city while the fix resolves would show a stranger's neighbourhood and
              invite them to confirm it. Until then the panel stays empty and the helper pill
              explains what is happening.
            */}
            {map?.coordinates == null ? (
              <View style={styles.map} testID="address-map-empty">
                <AddressCentrePin />
              </View>
            ) : (
              <View style={styles.map} testID="address-map">
                <AddressMapCanvas
                  coordinate={map.coordinates}
                  onSettle={map.onSettle}
                  onGestureStart={map.onDismissSuggestions}
                />
                {/* The pin. A SIBLING of the map, never a child of it — see `AddressCentrePin`. */}
                <AddressCentrePin />
              </View>
            )}

            {/* `53:58` — the pinned panel. It holds ONLY the pill and the resolved row; the
                frame draws the CTA as its SIBLING, on white, 16pt below it. */}
            <View style={styles.locationPanel}>
              {/* `63:780` — a 250 x 25 box holding the 247 x 20 pill, left aligned. */}
              <View style={styles.helperPillRow}>
                <View
                  style={styles.helperPill}
                  testID={
                    location.serviceabilityMessage === undefined
                      ? 'address-helper'
                      : 'address-serviceability'
                  }
                >
                  <Text variant="labelMedium" color="textPrimary" align="center">
                    {location.serviceabilityMessage ?? location.helperText}
                  </Text>
                </View>
              </View>

              <View style={styles.resolvedRow}>
                <Image
                  source={ADDRESS_LOCATION_GLYPH}
                  style={styles.locationGlyph}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
                <View style={styles.resolvedText}>
                  <Text variant="title" color="textPrimary" numberOfLines={1}>
                    {location.resolvedTitle}
                  </Text>
                  <Text variant="bodyLoose" color="textSecondary" numberOfLines={2}>
                    {location.resolvedLine}
                  </Text>
                </View>
              </View>
            </View>

            {/**
             * `53:59`. Enabled by the existence of a POINT, and by nothing else (§7).
             *
             * It used to be disabled whenever a message was on screen, which coupled it to the
             * previous verdict: one refusal, and the only way back to a working CTA was to leave
             * the screen. Now the message describes the point that was last CONFIRMED, moving the
             * pin clears it, and the button is live again for the new point.
             *
             * `loading` is the button's own state — the screen behind it keeps its map, its pin
             * and its resolved row, because blanking them would throw away the thing being
             * confirmed. `disabled` while confirming is what prevents a double submission.
             */}
            <Button
              label={location.confirmLabel}
              onPress={onConfirm}
              variant="primary"
              size="form"
              // `53:110` carries NO drop shadow — it is a plain `#FFD600` bar. The `primary`
              // variant's own 3pt lift belongs to `1:821`, the Instant/Scheduled bar, and drawing
              // it here adds a rim the frame does not have.
              flat
              disabled={!canConfirm}
              loading={confirming}
              testID="address-confirm"
            />
          </View>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

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
const AddressMapCanvas = memo(function AddressMapCanvas({
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
   * (see `AddressCentrePin`), so `region.latitude` / `region.longitude` IS the ground under the
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

  return (
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
       * Pan and zoom are the whole interaction and stay on. Rotation and tilt are off: a tilted
       * camera's visible region is a trapezoid whose bounding-box centre is NOT the camera target,
       * so the settle would report a coordinate a little away from the one under the pin's tip.
       * Off, the reported centre and the pin agree exactly — and a flat overlay pin could not
       * honestly represent a rotated ground plane anyway.
       */
      scrollEnabled
      zoomEnabled
      rotateEnabled={false}
      pitchEnabled={false}
      // `53:33` is a LIGHT canvas. The Maps SDK defaults its colour scheme to FOLLOW_SYSTEM, so
      // this is what stops a handset in Android dark mode from repainting the whole step black —
      // see `lightMapStyle.ts`.
      customMapStyle={LIGHT_MAP_STYLE}
      // The DEVICE's own fix, drawn by the SDK as its standard blue dot. It is not the selected
      // location — that is the red pin above it — and the two are allowed to sit apart: the
      // customer may be placing an address they are not standing at.
      showsUserLocation
      showsMyLocationButton={false}
      toolbarEnabled={false}
      testID="address-map-canvas"
    />
  );
});

/**
 * `53:57` — the drawn pin, nailed to the middle of the canvas and OUT of the map's world.
 *
 * ## Why it is not a `Marker`
 *
 * It used to be one, `draggable`, which put it in MAP space: it belonged to a coordinate, so the
 * only way to move it was a press-and-hold on the mark itself, and a pan anywhere else slid the
 * ground out from under it and left it stranded on its old point. The map also carried an
 * `onPress` that dropped the pin wherever a finger landed — the "pin jumps where you touch"
 * defect, and the reason a tap could not be used to begin a pan.
 *
 * As a marker it also had to be defended: `MapMarker.setCoordinate()` calls `setPosition()`
 * unconditionally and `setTracksViewChanges()` ends in `setIcon()`, so any render arriving while
 * the SDK owned the marker made it flicker or jump. A whole apparatus existed for that — a
 * `dragging` ref, a memo comparator that refused every update mid-gesture, a `tracksViewChanges`
 * handshake with the image decoder. None of it is needed now, because the pin is no longer
 * something the SDK can own.
 *
 * ## What it is instead
 *
 * A plain image in SCREEN space, a sibling of `MapView` inside the same canvas box, centred by
 * that box and shifted so its TIP — not the middle of the export — sits on the box's centre. The
 * ground travels underneath it; it never moves at all. There is no state, no effect and no
 * callback here, so nothing that happens above can make it flicker, and a re-render of the whole
 * screen redraws it in exactly the same place.
 *
 * `pointerEvents="none"` is what keeps it out of the way: the overlay covers the entire canvas, so
 * without it every pan that began on the pin would be swallowed and the map would feel dead in the
 * middle — precisely where the customer aims.
 *
 * The same component draws the empty placeholder, so the pin does not shift when the real map
 * arrives.
 */
function AddressCentrePin() {
  return (
    <View style={styles.mapPinOverlay} pointerEvents="none" testID="address-map-pin">
      <Image
        source={ADDRESS_MAP_PIN}
        style={[styles.mapPin, styles.mapPinTipCentred]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

/** How much ground the camera shows around the pin. ~600 m across, tight enough to place a door. */
const MAP_SPAN = 0.006;

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

/**
 * Where the coordinate sits INSIDE `map-pin.png`, as a fraction of the export's height.
 *
 * `63:782` is a 46 × 43 node and the mark does not fill it: in the 184 × 172 (@4×) export the
 * opaque artwork runs x 51..132, y 17..**154**, so the stem's tip stops 17px — 4.25pt — clear of
 * the bottom edge. Centring the IMAGE on the canvas therefore aims the pin's waist at the chosen
 * coordinate and leaves its tip pointing at a house half a block away.
 *
 * Measured off the asset's alpha channel: the mark is horizontally centred at exactly 0.5 and its
 * last opaque row is 154, so the tip EDGE is at 155 / 172.
 */
const MAP_PIN_TIP_RATIO = 155 / 172;

/** The 46 × 43 export (`63:782`), as drawn. Kept beside the ratio it is multiplied by. */
const MAP_PIN_HEIGHT = 43;

/**
 * How far the image must ride UP so its tip, rather than its middle, lands on the canvas centre.
 *
 * 43 × (155/172 − 0.5) = 17.25pt. The overlay centres the image; this shifts it.
 */
const MAP_PIN_TIP_OFFSET = MAP_PIN_HEIGHT * (MAP_PIN_TIP_RATIO - 0.5);

/**
 * Places predictions, and the three things that are NOT predictions.
 *
 * "No results", "we could not reach Google" and "this build has no Maps key" are different facts
 * and the customer can act on each differently — retype, retry, or stop expecting search to work
 * and drag the pin instead. Collapsing them into one silent empty list is what makes a search box
 * feel broken.
 */
function AddressSearchResults({
  suggestions,
  searchState,
  onChoose,
}: {
  readonly suggestions: readonly PlaceSuggestion[];
  readonly searchState: AddressSearchState;
  readonly onChoose: (placeId: string) => void;
}) {
  if (searchState === 'idle') return null;

  const notice =
    searchState === 'searching'
      ? 'Searching…'
      : searchState === 'empty'
        ? 'No matching places. Try a landmark or a street name.'
        : searchState === 'error'
          ? 'Couldn’t reach search. Check your connection, or drag the pin instead.'
          : searchState === 'unconfigured'
            ? 'Search is unavailable in this build. Drag the pin to set your location.'
            : null;

  return (
    <View style={styles.suggestions} testID="address-suggestions">
      {notice === null ? null : (
        <Text variant="bodyMedium" color="textSecondary" style={styles.suggestionNotice}>
          {notice}
        </Text>
      )}

      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion.placeId}
          onPress={() => {
            // Choosing a prediction IS the end of searching. Leaving the keyboard up after it
            // covered the CTA the customer now wants, on the one screen whose whole purpose is
            // to end with Confirm.
            Keyboard.dismiss();
            onChoose(suggestion.placeId);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${suggestion.primary}. ${suggestion.secondary}`}
          style={({ pressed }) => [styles.suggestionRow, pressed ? styles.pressed : null]}
          testID={`address-suggestion-${suggestion.placeId}`}
        >
          <Image
            source={ADDRESS_LOCATION_GLYPH}
            style={styles.suggestionGlyph}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.suggestionText}>
            <Text variant="title" color="textPrimary" numberOfLines={1}>
              {suggestion.primary}
            </Text>
            {suggestion.secondary === '' ? null : (
              <Text variant="bodyLoose" color="textSecondary" numberOfLines={1}>
                {suggestion.secondary}
              </Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * The search field. Seeded from the payload, owned by the user, and OVERRIDDEN whenever the value
 * handed in changes.
 *
 * ## Why the override had to exist
 *
 * This used to be seed-once local state, remounted via a `key` on the caller when the server sent
 * a different value. On the live map the key is the constant `'live'`, so it never remounted — and
 * the hook's `query` is not only a seed there, it is written back when a Places suggestion is
 * CHOSEN. Nothing carried that write into the input: tapping "Laxmi Nagar" moved the pin, resolved
 * the address and updated `query`, while the box went on showing the half-typed "Laxmi naga" the
 * customer had abandoned. The field disagreed with the pin directly beneath it.
 *
 * ## Why it is still not a plain controlled input
 *
 * Because the original concern was real. `onChange` is debounced into a network call, so echoing
 * every keystroke back through the parent would make typing depend on a render round-trip, and a
 * refetch mid-word could re-seed the box under the customer's fingers.
 *
 * Tracking the last value SEEN resolves both: local state still owns typing, and the incoming
 * value wins exactly once each time it actually changes — which is only when something other than
 * this input decided what the field should say.
 */
function SearchInput({
  value,
  placeholder,
  onChange,
}: {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange?: (next: string) => void;
}) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);

  // Derived during render rather than in an effect: an effect would draw the stale text for one
  // frame first, and the flash is visible on the handset.
  if (value !== seen) {
    setSeen(value);
    if (value !== text) setText(value);
  }

  return (
    <TextInput
      value={text}
      onChangeText={(next) => {
        setText(next);
        onChange?.(next);
      }}
      placeholder={placeholder}
      placeholderTextColor={lightTheme.colors.textPlaceholder}
      accessibilityLabel={placeholder}
      style={styles.searchInput}
      returnKeyType="search"
      /*
       * The search key has to end the search.
       *
       * `returnKeyType="search"` only labels the key; with no `onSubmitEditing` behind it, tapping
       * it did nothing and the keyboard stayed up over `Confirm` — so a customer who had already
       * found their address had no way to get to the button without guessing at a tap on the map.
       * Dismissing explicitly rather than relying on `blurOnSubmit` because the field sits inside
       * a sticky bar over the map, where a blur alone does not always retract the keyboard.
       */
      onSubmitEditing={() => Keyboard.dismiss()}
      testID="address-search"
    />
  );
}

/* ------------------------------------------------------------- edit sheet (228:1801) */

export interface AddressEditSheetProps {
  readonly visible: boolean;
  readonly edit: AddressEditViewModel;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

/**
 * `228:1801` — the Edit / Delete sheet raised from a saved address.
 *
 * It reuses the list's `6:700` card and `6:713` address row rather than restating them, because
 * the frame reuses those very nodes. Only the two action rows (`230:2080`, `230:2083`) are new.
 *
 * `headerVariant="screen"` is the frame's own header: `230:1925` is a 45pt band with a 32pt back
 * control 15pt clear of a Livvic Black 20/28 title and no hairline — the same header `143:317`
 * already established on the Extension sheet.
 */
export function AddressEditSheet({
  visible,
  edit,
  onClose,
  onEdit,
  onDelete,
}: AddressEditSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onBack={onClose}
      title={edit.title}
      headerVariant="screen"
      backVariant="outlined"
      bodyStyle={styles.editSheetBody}
      testID="address-edit-sheet"
    >
      <View style={styles.listCard}>
        <Text variant="title" color="textField">
          {edit.cardTitle}
        </Text>

        {/* `6:712` — 21pt between the address block and the two actions. */}
        <View style={styles.editActions}>
          <View style={styles.addressRow}>
            <Text variant="bodyBold" color="textStrong">
              {edit.address.label}
            </Text>
            <Text variant="noteBody" color="textFieldLabel" numberOfLines={2}>
              {edit.address.line}
            </Text>
          </View>

          <AddressActionRow
            art={ADDRESS_ACTION_EDIT}
            label={edit.editLabel}
            onPress={onEdit}
            testID="address-edit-action"
          />
          <AddressActionRow
            art={ADDRESS_ACTION_DELETE}
            label={edit.deleteLabel}
            onPress={onDelete}
            testID="address-delete-action"
          />
        </View>
      </View>
    </BottomSheet>
  );
}

/** `230:2080` / `230:2083` — a 28pt disc, 12pt clear of a Livvic Bold 14/20 label. */
function AddressActionRow({
  art,
  label,
  onPress,
  testID,
}: {
  readonly art: ImageSourcePropType;
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.editActionRow, pressed ? styles.pressed : null]}
      testID={testID}
    >
      {/* The 28pt node draws itself at `inset -14.29%`, so a 36pt image overflows a 28pt box. */}
      <View style={styles.editActionDisc}>
        <Image
          source={art}
          style={styles.editActionArt}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text variant="title" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
}

/* --------------------------------------------------- out of service (215:1472) */

export interface AddressOutOfServiceViewProps {
  readonly state: DataState<AddressOutOfServiceViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
}

/**
 * `215:1472` "Page 3c- Address out of service".
 *
 * PRODUCT_DESIGN_CONFLICT with ruling R-4 — see `AddressOutOfServiceViewModel`. Built as drawn.
 *
 * REBUILT in pass 8. The superseded file opened this screen with a 45pt banner (`218:1536`)
 * carrying the rejected address and the account avatar. `sbIXeBfaMzUFUz2NYJIJTm` replaces that
 * whole band with `275:5179` — a plain instance of the shared `63:783` header — titled "Choose
 * another location". The address pair and the avatar are GONE from the frame, so they are gone
 * from the view model too rather than being rendered where the design draws nothing.
 *
 * `221:1553` is px 16 / pt 16 / pb 80 with a **50pt** gap under the header; `275:5707` then holds
 * the 215pt `#FFEF99` disc 21pt clear of the copy block.
 *
 * DEVIATION: `219:1551` carries an INNER shadow (`-2 2 4 rgba(0,0,0,0.15)`). Figma clips an inner
 * shadow to the layer's alpha; React Native clips `boxShadow: inset` to the view BOX, so applying
 * it to this transparent PNG would draw a rectangle the frame does not show. Omitted deliberately.
 */
export function AddressOutOfServiceView({ state, onRetry, onBack }: AddressOutOfServiceViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <QueryBoundary state={state} onRetry={onRetry} loadingVariant="screen">
        {(view) => (
          <View style={styles.oosBody} testID="address-out-of-service-screen">
            <ScreenHeader title={view.headerTitle} onBack={onBack} testID="address-header" />

            {/* `275:5707` — the disc 21pt clear of the copy. */}
            <View style={styles.oosContent}>
              <View style={styles.oosDisc}>
                <Image
                  source={ADDRESS_OUT_OF_SERVICE_ART}
                  style={styles.oosArt}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>

              <View style={styles.oosCopy}>
                <Text variant="headingOutcome" color="textPrimary" align="center">
                  {view.title}
                </Text>
                <Text variant="captionStrong" color="textPrimary" align="center">
                  {view.message}
                </Text>
              </View>
            </View>
          </View>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ details form */

export interface AddressDetailsViewProps {
  readonly state: DataState<AddressDetailsViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly onChangeArea: () => void;
  readonly onSave: (draft: AddressDraft) => void;
  /**
   * A CONFIRMED, server-approved coordinate exists for the address being saved.
   *
   * The form cannot know this: `53:31` obtained the point and `POST /v1/serviceability/check`
   * approved it, both on another route. Adding an address requires the draft the map step left
   * behind; editing one requires the record's own saved point. Either way the answer arrives as
   * this boolean, and until it is true Confirm is grey — a form with no location behind it would
   * save an address to nowhere.
   *
   * REQUIRED rather than defaulted, so a new host cannot silently opt out of the gate.
   */
  readonly locationReady: boolean;
  /** `POST` / `PUT` in flight. Holds the CTA disabled so a second tap cannot create a second address. */
  readonly submitting: boolean;
}

/** What the form collects. Receiver details are persisted ON THE ADDRESS record (B-13). */
export interface AddressDraft {
  readonly flat: string;
  readonly building: string;
  readonly labelId: string | null;
  /**
   * The chip's DRAWN word ("Parents"), not its id ("parents").
   *
   * `68:214` lists addresses by this string, so what is stored has to be what `339:4604` draws.
   * Sending the id put a lowercase "parents" on the saved-address list.
   */
  readonly labelText: string;
  /** NEW in `60:655` — the free-text "Save as" name. Empty when the frame offers no such field. */
  readonly saveAs: string;
  readonly receiverName: string;
  readonly receiverPhone: string;
}

export function AddressDetailsView({
  state,
  onRetry,
  onBack,
  onChangeArea,
  onSave,
  locationReady,
  submitting,
}: AddressDetailsViewProps) {
  return (
    <QueryBoundary state={state} onRetry={onRetry} loadingVariant="screen">
      {(details) => (
        <AddressDetailsForm
          {...{ details, onBack, onChangeArea, onSave, locationReady, submitting }}
        />
      )}
    </QueryBoundary>
  );
}

function AddressDetailsForm({
  details,
  onBack,
  onChangeArea,
  onSave,
  locationReady,
  submitting,
}: {
  readonly details: AddressDetailsViewModel;
  readonly onBack: () => void;
  readonly onChangeArea: () => void;
  readonly onSave: (draft: AddressDraft) => void;
  readonly locationReady: boolean;
  readonly submitting: boolean;
}) {
  // PREFILLED from the record and editable — an existing address opens with its receiver already
  // in the fields, which is the whole point of storing them per address (B-13).
  const [flat, setFlat] = useState(details.flatValue ?? '');
  const [building, setBuilding] = useState(details.buildingValue ?? '');
  const [labelId, setLabelId] = useState<string | null>(details.selectedLabelId ?? null);
  const [saveAs, setSaveAs] = useState(details.saveAsValue ?? '');
  const [receiverName, setReceiverName] = useState(details.receiverName ?? '');
  const [receiverPhone, setReceiverPhone] = useState(details.receiverPhone ?? '');
  /** `275:4485` leaves 16 under the CTA; the handset's gesture strip may need more. */
  const bottomGutter = useBottomGutter(lightTheme.space.lg);
  /**
   * The IME's height, measured rather than inferred.
   *
   * `KeyboardAvoidingView behavior="padding"` used to sit here. It computes its own overlap from
   * an `onLayout` frame that is relative to its PARENT, and this form nests it two levels down —
   * so the padding it produced was short by the status-bar inset, and on Android 15's edge-to-edge
   * window (where `adjustResize` no longer shrinks anything) that left the Confirm bar under the
   * keyboard. Shrinking the whole scroll+footer block by the reported height is the same fix
   * `Screen` already uses, and it collapses exactly to 0 on `keyboardDidHide` — no residual gap.
   */
  const keyboardHeight = useKeyboardHeight();

  /**
   * "Save as" belongs to **Others** and to nothing else (V7 founder comment, task §6).
   *
   * `60:655` draws the field permanently because a Figma frame draws ONE state, and the state it
   * chose has Parents selected with the field visible. The comment is the product decision: Home,
   * Parents and Friends already name the address, so a second name for them is a field with
   * nothing to put in it. Others is the branch that has no name yet, and there the field is
   * REQUIRED — saving an address labelled the literal word "others" is what the field exists to
   * prevent.
   *
   * Matched on the option itself rather than on a hardcoded id, so the chip set stays data.
   */
  const shape: AddressFormShape = {
    othersLabelId: othersLabelIdOf(details.labelOptions),
    saveAsOffered: details.saveAsPlaceholder !== undefined,
  };
  const othersSelected = isOthersSelected(labelId, shape);

  /**
   * The ONE gate (task §J). The CTA is drawn from it and the handler refuses on it, so a disabled
   * Confirm cannot navigate, cannot `POST` and cannot start a second write.
   */
  const canSubmit = canSubmitAddress({
    values: { flat, building, labelId, saveAs },
    shape,
    locationReady,
    submitting,
  });

  return (
    <SafeAreaView style={styles.screenForm} edges={['top', 'left', 'right']}>
      {/* `60:656` — the same 16pt-gutter column the map step uses, with the header inside it. */}
      <View style={styles.formBody}>
        <ScreenHeader title={details.title} onBack={onBack} testID="address-header" />

        {/* The scroll area and the CTA move together: shrinking the block by the IME's measured
          height lifts Confirm clear of the keyboard AND lets the ScrollView bring the focused
          field into view, on both platforms. See `keyboardHeight` above for why the previous
          `KeyboardAvoidingView` could not. */}
        <View
          style={[styles.flex, keyboardHeight === 0 ? null : { marginBottom: keyboardHeight }]}
          testID="address-form-body"
        >
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            testID="address-details-screen"
          >
            <FormInput
              value={flat}
              onChangeText={setFlat}
              placeholder={details.flatPlaceholder}
              testID="address-flat"
            />
            <FormInput
              value={building}
              onChangeText={setBuilding}
              placeholder={details.buildingPlaceholder}
              testID="address-building"
            />

            {/* `63:802` — the area field with the 58 × 62 "Change" thumbnail beside it. */}
            <View style={styles.field}>
              <Text variant="bodyStrong" color="textPrimary">
                {details.areaTitle}
              </Text>
              <View style={styles.areaRow}>
                <View style={styles.areaValue}>
                  <Text variant="bodyMedium" color="textPrimary">
                    {details.areaValue}
                  </Text>
                </View>
                <Pressable
                  onPress={onChangeArea}
                  accessibilityRole="button"
                  accessibilityLabel={details.changeLabel}
                  hitSlop={8}
                  style={({ pressed }) => [styles.changeArea, pressed ? styles.pressed : null]}
                  testID="address-change-area"
                >
                  <Image
                    source={ADDRESS_CHANGE_AREA_ART}
                    style={styles.changeAreaArt}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                  <Image
                    source={ADDRESS_MAP_PIN}
                    style={styles.changeAreaPin}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                  />
                  {/* `63:808` — Livvic SemiBold 11/16.5 at 70% black, centred on y 40. */}
                  <Text variant="label" color="textSecondary" style={styles.changeAreaLabel}>
                    {details.changeLabel}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* `60:707` — Home · Parents · Friends · Others, supplied as data. */}
            <View style={styles.field}>
              <Text variant="bodyStrong" color="textPrimary">
                {details.labelTitle}
              </Text>
              <View
                style={styles.labelChips}
                accessibilityRole="radiogroup"
                accessibilityLabel={details.labelTitle}
              >
                {details.labelOptions.map((option) => {
                  const selected = labelId === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        setLabelId(option.id);
                        // Leaving Others discards the custom name with the field that held it.
                        // Keeping it would submit a name the customer can no longer see or edit —
                        // and would leave a stale value counting towards a requirement that no
                        // longer applies.
                        if (option.id !== shape.othersLabelId) setSaveAs('');
                      }}
                      accessibilityRole="radio"
                      accessibilityLabel={option.label}
                      accessibilityState={{ selected, checked: selected }}
                      hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                      style={({ pressed }) => [
                        styles.labelChip,
                        selected ? styles.labelChipSelected : null,
                        pressed ? styles.pressed : null,
                      ]}
                      testID={`address-label-${option.id}`}
                    >
                      <Text variant="chipLabel" color="textPrimary" numberOfLines={1}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* `339:4609` — the free-text "Save as" name, the THIRD child of the `339:4597`
                label group at its 10pt gap, not a separate field at the 17pt gap.

                Rendered ONLY under Others — see `othersSelected`. */}
              {details.saveAsPlaceholder === undefined || !othersSelected ? null : (
                /* No inline error beside it: `60:655` draws none, and the greyed-out Confirm is
                   the feedback the founder specified for an unmet requirement. */
                <FormInput
                  value={saveAs}
                  onChangeText={setSaveAs}
                  placeholder={details.saveAsPlaceholder}
                  testID="address-save-as"
                />
              )}
            </View>

            {/* `64:4` — receiver name and phone, 5pt apart under one label. `64:6` sets the
              "(Optional)" run in Regular rather than SemiBold; both runs stay BLACK 12/16. */}
            <View style={styles.receiver}>
              <Text variant="bodyStrong" color="textPrimary">
                {details.receiverTitle}
                {details.receiverOptionalLabel === undefined ? null : (
                  <Text variant="body" color="textPrimary">
                    {` ${details.receiverOptionalLabel}`}
                  </Text>
                )}
              </Text>
              <FormInput
                value={receiverName}
                onChangeText={setReceiverName}
                placeholder={details.receiverNamePlaceholder}
                testID="address-receiver-name"
              />
              <FormInput
                value={receiverPhone}
                onChangeText={setReceiverPhone}
                placeholder={details.receiverPhonePlaceholder}
                keyboardType="phone-pad"
                testID="address-receiver-phone"
              />
            </View>
          </ScrollView>

          {/* `275:4485` — a plain `#FFD600` 34pt bar. The finalized file draws no glow.

            The gutter reverts to the frame's own 16 while the IME is up: the extra room exists
            for the handset's gesture strip, and the keyboard is covering that strip, so keeping
            it would open a band of empty white between the bar and the keys. */}
          <View
            style={[
              styles.formFooter,
              { paddingBottom: keyboardHeight === 0 ? bottomGutter : lightTheme.space.lg },
            ]}
            testID="address-form-footer"
          >
            <Button
              label={details.ctaLabel}
              onPress={() => {
                // The visual state is never the guard on its own (task §J): a host that forgot
                // `disabled`, or a press racing the state that disabled it, must still not write.
                if (!canSubmit) return;
                onSave({
                  // TRIMMED, so what passed validation is exactly what is saved — a field cannot
                  // clear the gate on "B-402 " and reach the backend with the space still on it.
                  flat: flat.trim(),
                  building: building.trim(),
                  labelId,
                  labelText:
                    details.labelOptions.find((option) => option.id === labelId)?.label ?? '',
                  saveAs: saveAs.trim(),
                  receiverName: receiverName.trim(),
                  receiverPhone: receiverPhone.trim(),
                });
              }}
              variant="primary"
              size="form"
              // `275:4485`, like `53:110`, is a plain `#FFD600` bar with no lift at all.
              flat
              disabled={!canSubmit}
              loading={submitting}
              testID="address-save"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FormInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  testID,
}: {
  readonly value: string;
  readonly onChangeText: (next: string) => void;
  readonly placeholder: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly testID: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={lightTheme.colors.textSecondaryStrong}
      accessibilityLabel={placeholder}
      style={styles.input}
      testID={testID}
      {...(keyboardType === undefined ? {} : { keyboardType })}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  /** `60:656` — the details step sits on `#F8FAFC`, unlike the other two. */
  /**
   * `60:655` — the address form sits on WHITE, not on the Meal Brief's `#F8FAFC`. Sampled off the
   * frame, the ground below the last field and around the CTA is (255,255,255); `surfaceForm` put
   * a grey band between "Phone no." and the CTA that the frame does not draw.
   */
  screenForm: { flex: 1, backgroundColor: lightTheme.colors.surface },
  /**
   * `68:215` — the body column: 16pt gutters, 16pt above the header, **21pt** between blocks.
   *
   * `275:5187` sits at y 16, `69:514` at y 75 (54 + 21) and `230:1955` at y 137 (116 + 21), so
   * the header is inside this column exactly as it is on the map and form steps.
   */
  listBody: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.xl,
    gap: 21,
  },
  /** `69:514` — `#FFEF99`, a FIXED 41pt at a 24pt radius, px 15.889 / pt 6. */
  addCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 41,
    paddingHorizontal: 15.889,
    paddingTop: lightTheme.space.s6,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    ...lightTheme.elevation.hairlineSoft,
  },
  /** `69:515` — a 28pt row holding the label against the mark. */
  addCardRow: {
    flex: 1,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  addGlyphBox: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  /** `69:533` draws at `inset -14.29%` — a 36pt mark overflowing its 28pt box. */
  addGlyph: { width: 36, height: 36, margin: -4 },
  /** `6:700` — white, 1pt `#E2E8F0`, 24pt radius, 15.889pt padding, 12pt gap. */
  listCard: {
    gap: lightTheme.space.md,
    padding: 15.889,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderField,
    backgroundColor: lightTheme.colors.surface,
  },
  /* ---- `228:1801` address edit sheet ---- */
  /** `230:1924` — pt 10 / pb 16 / px 16, 10pt between the header band and the card. */
  editSheetBody: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.xs + 6,
    paddingBottom: lightTheme.space.lg,
    gap: lightTheme.space.xs + 6,
  },
  /** `6:712` — 21pt between the address block and each action row. */
  editActions: { gap: 21 },
  /** `230:2080` — a 28pt disc 12pt clear of its label. */
  editActionRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  editActionDisc: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  /** The node draws itself at `inset -14.29%`, i.e. a 36pt mark overflowing a 28pt box. */
  editActionArt: { width: 36, height: 36, margin: -4 },

  /* ---- `215:1472` address out of service ---- */
  /** `221:1553` — px 16 / pt 16 / pb 80, with a 50pt gap between the header and the content. */
  oosBody: {
    flex: 1,
    gap: 50,
    paddingTop: lightTheme.space.lg,
    paddingBottom: 80,
    paddingHorizontal: lightTheme.space.lg,
  },
  /** `275:5707` — the disc and the copy block, centred, 21pt apart. */
  oosContent: { alignItems: 'center', gap: 21 },
  /**
   * `222:1557` — a plain `#FFEF99` 215pt circle in the node, so it is drawn, not exported.
   * `222:1558` lifts it on `0 0 2 rgba(0,0,0,0.07)`.
   */
  oosDisc: {
    width: 215,
    height: 215,
    borderRadius: 107.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    ...lightTheme.elevation.disc,
  },
  /** `219:1551` — 150 x 125, with the frame's own crop baked into the export. */
  oosArt: { width: 150, height: 125 },
  /**
   * `221:1556` — px 15 / py 10, 10pt between the headline and the line.
   *
   * `221:1555`'s 307 is DERIVED (338 column − 2 × 15.5), not an independent measure: the block is
   * `w-full`, so it stretches with the column rather than clamping at 307.
   */
  oosCopy: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: lightTheme.space.xs + 6,
    paddingHorizontal: 15,
    paddingVertical: lightTheme.space.xs + 6,
  },

  /** `230:1959` — 8pt between rows, against the card's own 12pt gap. */
  addressRows: { gap: lightTheme.space.sm },
  /** `230:1960` — `rgba(255,247,204,0.7)` at a 16pt radius, 11.889pt padding, 12pt gap. */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: lightTheme.space.md,
    padding: 11.889,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceTileIdle,
  },
  addressRowBody: { flex: 1, minWidth: 0, gap: 1.165 },
  /** `230:1968` — a 20 x 32 column holding the exported kebab. */
  rowMenu: { width: 20, height: 32 },
  rowMenuArt: { width: 20, height: 32 },
  pressed: { opacity: 0.85 },
  /**
   * `53:32` — the body column: 16pt gutters, 16pt above the header and 16pt between every block.
   * The header is INSIDE this column (`63:783` is drawn at x 16, w 338, not edge to edge), which
   * is why it is padded here rather than inside the shared `ScreenHeader`.
   */
  locationBody: {
    flex: 1,
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.md,
    gap: lightTheme.space.lg,
  },
  /**
   * `63:761` — px 4 / py 6, 3.99pt between label and field.
   *
   * The frame draws NO rule under this bar. The 0.889pt `#E2E8F0` underline came from the
   * superseded file and is removed.
   */
  searchBar: {
    gap: 3.99,
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `53:64` — 1pt `#CAD5E2` at a 24pt radius, px 11.889 / py 7.889, `0 1 0 rgba(0,0,0,0.05)`. */
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: 11.889,
    paddingVertical: 7.889,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderControl,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: lightTheme.colors.textSecondary,
    ...lightTheme.typography.bodyMedium,
  },
  /** `53:33` — a 422pt canvas at `rgba(255,247,204,0.2)`, 15pt radius; it absorbs spare height. */
  map: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r15,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceMapCanvas,
  },
  /** The Google surface fills the drawn canvas; the 15pt radius is clipped by the parent. */
  mapCanvas: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  /**
   * The fixed pin's layer: the whole canvas, so the pin is centred on the SELECTABLE map area
   * rather than on the screen.
   *
   * That distinction is the layout requirement, and on `53:31` it is satisfied by the column
   * itself: the header, the search bar, the `53:58` panel and the `53:59` CTA are all SIBLINGS of
   * this box in a flex column, not overlays on top of it. Nothing covers the canvas, so the box's
   * centre is the visible centre, and — with no `mapPadding` set on the `MapView` that fills the
   * same box — it is also the camera's target. If a panel is ever floated over the map, this
   * overlay must be inset by its height (and the map given the matching `mapPadding`) or the pin
   * and the reported coordinate will stop agreeing.
   *
   * `pointerEvents` is set on the element, not here, so it cannot be lost by a style merge.
   */
  mapPinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * `63:782` — the 46 × 43 export. The red mark is 20.5 × 35 of that box and the rest is
   * transparent padding the node carries, which is why the tip is found at `MAP_PIN_TIP_RATIO`
   * rather than at the image's foot.
   */
  mapPin: { width: 46, height: 43 },
  /** Rides the centred image up until its TIP is on the canvas centre. See `MAP_PIN_TIP_OFFSET`. */
  mapPinTipCentred: { transform: [{ translateY: -MAP_PIN_TIP_OFFSET }] },
  /**
   * The predictions list, drawn over the map rather than between the field and the panel — moving
   * the panel would move the pin the customer is aiming at while they read the results.
   */
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 3,
    elevation: 3,
    marginTop: lightTheme.space.xs,
    borderRadius: lightTheme.radius.r15,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderHairline,
    backgroundColor: lightTheme.colors.surface,
    overflow: 'hidden',
  },
  suggestionNotice: { padding: lightTheme.space.md },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s10,
  },
  suggestionGlyph: { width: 20, height: 20 },
  suggestionText: { flex: 1, minWidth: 0 },
  /**
   * `53:58` — `rgba(255,247,204,0.7)` at a 20pt radius, px 12, 8pt gap.
   *
   * The frame fixes the panel at 105 around a 78pt content block opened at y 16, so the bottom
   * padding is 11, not the 16 the top carries.
   */
  locationPanel: {
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.md,
    paddingTop: lightTheme.space.lg,
    paddingBottom: 11,
    borderRadius: lightTheme.radius.r20,
    backgroundColor: lightTheme.colors.surfaceTileIdle,
  },
  /** `63:780` — the 250 × 25 box the pill is left-aligned inside. */
  helperPillRow: { height: 25, justifyContent: 'center' },
  /**
   * `63:779` — `#FFEF99`, a FIXED 247 × 20 at a 24pt radius, `0 0 4 rgba(0,0,0,0.1)`.
   *
   * NO horizontal padding: `63:778` is the rect's SIBLING, not its child, and is itself 247 wide,
   * so the copy gets the pill's full measure. Insetting it truncated "…reach accurately".
   */
  helperPill: {
    width: 247,
    maxWidth: '100%',
    justifyContent: 'center',
    height: 20,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    ...lightTheme.elevation.pill,
  },
  /** `63:771` — a 45pt row: the 37 × 45 mark then the resolved address, 12pt clear. */
  resolvedRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  locationGlyph: { width: 37, height: 45 },
  resolvedText: { flex: 1, minWidth: 0, gap: lightTheme.space.xs },
  /** `60:656` — the 16pt-gutter column, 16pt above the header and 16pt below it. */
  formBody: {
    flex: 1,
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.lg,
    gap: lightTheme.space.lg,
  },
  /** `60:678` — white, px 4 / py 6, 17pt between fields. */
  form: {
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
    gap: 17,
    backgroundColor: lightTheme.colors.surface,
  },
  formFooter: {
    paddingBottom: lightTheme.space.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `60:701` — a 10pt gap between a field's label and its control. */
  field: { gap: lightTheme.space.s10 },
  /** `64:4` — the receiver block packs its two inputs 5pt apart. */
  receiver: { gap: 5 },
  /** `63:802` — the 261pt area column sits 19pt clear of the 58pt "Change" thumbnail at x 280. */
  areaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 19 },
  /** `60:703` — the 57pt area field. */
  areaValue: {
    flex: 1,
    minWidth: 0,
    minHeight: 57,
    justifyContent: 'center',
    paddingHorizontal: 11.889,
    paddingVertical: 7.889,
    borderRadius: lightTheme.radius.r12,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.surfaceCta,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `63:807` — a 58 × 62 thumbnail with the pin over it and "Change" beneath. */
  changeArea: { width: 58, height: 62 },
  changeAreaArt: {
    position: 'absolute',
    left: 1,
    top: 1,
    width: 56,
    height: 59,
    borderRadius: lightTheme.radius.xs,
  },
  changeAreaPin: { position: 'absolute', left: 19, top: 12, width: 22, height: 22 },
  changeAreaLabel: { position: 'absolute', left: 8, top: 31 },
  /** `60:710` — four chips, 8pt apart, wrapping on a narrow column. */
  labelChips: { flexDirection: 'row', flexWrap: 'wrap', gap: lightTheme.space.sm },
  /**
   * `63:799` — 21pt tall, px 15.889 / py 5.889, 10pt radius, 1pt **`#CFFF04`**.
   *
   * The outline is lime, not the `#FFDE33` the superseded file drew.
   */
  labelChip: {
    minHeight: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15.889,
    paddingVertical: 5.889,
    borderRadius: lightTheme.radius.r10,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderPositive,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  /** `64:11` — the selected chip fills `rgba(236,255,155,0.7)`; the outline does not change. */
  labelChipSelected: { backgroundColor: lightTheme.colors.surfaceTrust },
  /** `60:697` — 1pt `#CAD5E2` at a 12pt radius, px 11.889 / py 7.889. */
  input: {
    alignSelf: 'stretch',
    minHeight: 32,
    paddingHorizontal: 11.889,
    paddingVertical: 7.889,
    borderRadius: lightTheme.radius.r12,
    borderWidth: lightTheme.stroke.thin,
    // `60:655` now outlines every input in `#FFD600`; it was `#CAD5E2` in the previous file.
    borderColor: lightTheme.colors.surfaceCta,
    backgroundColor: lightTheme.colors.surface,
    color: lightTheme.colors.textPrimary,
    ...lightTheme.typography.bodyMedium,
  },
});
