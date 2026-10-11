import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DeviceCoordinates } from '../location/deviceLocation';
import type { PlaceSuggestion } from '../location/googlePlaces';
import type { AddressSearchState } from '../location/useAddressLocation';

import { AddressMapCanvas } from './AddressMapCanvas';
import { ADDRESS_ART } from './art';
import { PrimaryButton } from './components';
import { C, GRADIENT, SHADOW_1, SHADOW_2, SHADOW_3, SHADOW_FIELD, T } from './theme';

/**
 * Map location — Figma `1870:2379`, dev note `2075:11925`; Search location — `1870:2436`.
 *
 *   map      full screen, the ground moving under a pin nailed to the centre of the area above the
 *            sheet: "Your cook will come here" tooltip, the 52pt badge, a 2 × 16 stem, its shadow
 *   top bar  a 44pt back disc and a search field that opens the Search layer
 *   pill     "Use current location", 16pt above the sheet, re-centres on the device fix
 *   sheet    the drag hint (gone after the first drag), the pinned place, "Confirm location"
 *
 * Confirm waits for the address under the pin to RESOLVE — a geocode still out disables it, and
 * one that finished without a name does not (the coordinate is what is saved; a geocoder with
 * nothing to say must not strand the customer). Serviceability is checked on Confirm only.
 */
export interface AddressMapScreenProps {
  readonly coordinates: DeviceCoordinates | null;
  readonly place: { readonly title: string; readonly line: string } | null;
  readonly locating: boolean;
  readonly resolving: boolean;
  /** A device failure or the last Confirm's answer; shown in place of the drag hint. */
  readonly message: string | undefined;
  readonly canConfirm: boolean;
  readonly confirming: boolean;
  /** Omitted for the first-run customer, who has nothing behind this screen. */
  readonly onBack?: (() => void) | undefined;
  readonly onSettle: (coordinates: DeviceCoordinates) => void;
  readonly onLocate: () => void;
  readonly onConfirm: () => void;
  readonly search: AddressSearchProps;
  readonly testID?: string;
}

export interface AddressSearchProps {
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly query: string;
  readonly suggestions: readonly PlaceSuggestion[];
  readonly state: AddressSearchState;
  readonly onQuery: (text: string) => void;
  readonly onChoose: (placeId: string) => void;
  readonly onUseCurrentLocation: () => void;
}

/** The pin's column above its tip: tooltip 32, spacer 10, badge 52, stem 16. */
const PIN_TIP = 32 + 10 + 52 + 16;
/** The column's full height, the 6pt shadow included. */
const PIN_HEIGHT = PIN_TIP + 6;
/**
 * How far the tip sits below the middle of the pin column. Figma `1870:2405` centres the whole
 * column in the map area, so the tip lands this far under the area's centre.
 */
const TIP_BELOW_CENTRE = PIN_TIP - PIN_HEIGHT / 2;
/** The sheet's rounded corners sit over the map, so the map runs under them. */
const SHEET_RADIUS = 24;

export function AddressMapScreen({
  coordinates,
  place,
  locating,
  resolving,
  message,
  canConfirm,
  confirming,
  onBack,
  onSettle,
  onLocate,
  onConfirm,
  search,
  testID = 'address-map-screen',
}: AddressMapScreenProps) {
  const { top, bottom } = useSafeAreaInsets();
  const [sheetHeight, setSheetHeight] = useState(256);
  const [dragged, setDragged] = useState(false);
  const mapBottom = sheetHeight - SHEET_RADIUS;
  const pending = locating || resolving;

  return (
    <View style={styles.screen} testID={testID}>
      <View style={[styles.mapArea, { bottom: mapBottom }]}>
        {coordinates === null ? null : (
          // The canvas runs 2 × TIP_BELOW_CENTRE further down, under the sheet, so ITS centre —
          // the camera target the address is read from — is exactly where the tip points.
          <View style={styles.canvasWindow}>
            <AddressMapCanvas
              coordinate={coordinates}
              onSettle={onSettle}
              onGestureStart={() => setDragged(true)}
            />
          </View>
        )}
        <View style={styles.pinOverlay} pointerEvents="none" testID="address-map-pin">
          <View style={styles.pin}>
            <View style={[styles.tooltip, SHADOW_1]}>
              <Text style={styles.captionStrong}>Your cook will come here</Text>
            </View>
            <Image source={ADDRESS_ART.pinBadge} style={styles.pinBadge} />
            <View style={styles.stem} />
            <Image source={ADDRESS_ART.pinShadow} style={styles.pinShadow} />
          </View>
        </View>
      </View>

      <View style={[styles.topBar, { top: top + 8 }]}>
        {onBack === undefined ? null : (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backDisc, SHADOW_2, pressed && styles.pressed]}
            testID={`${testID}-back`}
          >
            <Image source={ADDRESS_ART.chevronLeft} style={styles.icon24} />
          </Pressable>
        )}
        <Pressable
          onPress={search.onOpen}
          accessibilityRole="search"
          accessibilityLabel="Search area, street or landmark"
          style={[styles.searchField, SHADOW_FIELD]}
          testID={`${testID}-search`}
        >
          <Image source={ADDRESS_ART.search} style={styles.icon20} />
          <Text style={styles.placeholder} numberOfLines={1}>
            Search area, street or landmark
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onLocate}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.locatePill,
          SHADOW_2,
          { bottom: sheetHeight + 16 },
          pressed && styles.pressed,
        ]}
        testID={`${testID}-locate`}
      >
        <View style={styles.locateWell}>
          <Image source={ADDRESS_ART.location} style={styles.icon18} />
        </View>
        <Text style={styles.captionStrong}>Use current location</Text>
      </Pressable>

      <View
        style={[styles.sheet, SHADOW_3, { paddingBottom: bottom + 14 }]}
        onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
        testID={`${testID}-sheet`}
      >
        {message === undefined && dragged ? null : (
          <View
            style={styles.hint}
            testID={message === undefined ? 'address-hint' : 'address-message'}
          >
            <Image source={ADDRESS_ART.touch} style={styles.icon20} />
            <Text style={[styles.caption, styles.flex]}>
              {message ?? 'Place the pin at exact service location'}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={GRADIENT.pinned}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.place}
        >
          <Image source={ADDRESS_ART.placeBadge} style={styles.placeBadge} />
          {pending && place === null ? (
            <View style={styles.placeText} testID="address-place-loading">
              <View style={[styles.skeleton, styles.skeletonTitle]} />
              <View style={[styles.skeleton, styles.skeletonLine]} />
            </View>
          ) : (
            <View style={styles.placeText} testID="address-place">
              <Text style={styles.heading} numberOfLines={1}>
                {place?.title ?? (coordinates === null ? 'No location yet' : 'Selected location')}
              </Text>
              {/* `1870:2379` — one line under the title; the sheet keeps its drawn height. */}
              <Text style={styles.captionSecondary} numberOfLines={1}>
                {place?.line ??
                  (coordinates === null ? 'Search above, or use your current location' : '')}
              </Text>
            </View>
          )}
        </LinearGradient>

        <PrimaryButton
          label="Confirm location"
          onPress={onConfirm}
          disabled={!canConfirm || pending}
          loading={confirming}
          testID="address-confirm"
        />
      </View>

      {search.open ? <AddressSearchLayer {...search} testID={`${testID}-search-layer`} /> : null}
    </View>
  );
}

/** `1870:2436` — full screen over the map, so closing it returns to the map exactly as it was. */
function AddressSearchLayer({
  onClose,
  query,
  suggestions,
  state,
  onQuery,
  onChoose,
  onUseCurrentLocation,
  testID,
}: AddressSearchProps & { testID: string }) {
  const { top, bottom } = useSafeAreaInsets();
  const term = query.trim();
  const notice =
    state === 'searching'
      ? 'Searching…'
      : state === 'empty'
        ? 'No matching places. Try a landmark or a street name.'
        : state === 'error'
          ? 'Couldn’t reach search. Check your connection, or drag the pin instead.'
          : state === 'unconfigured'
            ? 'Search is unavailable in this build. Drag the pin to set your location.'
            : null;

  return (
    <View style={styles.searchLayer} testID={testID}>
      <LinearGradient
        colors={GRADIENT.searchHeader}
        style={[styles.searchHeader, { paddingTop: top }]}
      >
        <View style={styles.searchRow}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.bareBack, pressed && styles.pressed]}
            testID={`${testID}-back`}
          >
            <Image source={ADDRESS_ART.chevronLeft} style={styles.icon24} />
          </Pressable>
          <View style={styles.searchFieldFocused}>
            <Image source={ADDRESS_ART.search} style={styles.icon20} />
            <TextInput
              value={query}
              onChangeText={onQuery}
              placeholder="Search area, street or landmark"
              placeholderTextColor={C.textSecondary}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
              testID={`${testID}-input`}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.searchBody, { paddingBottom: bottom + 14 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={onUseCurrentLocation}
          accessibilityRole="button"
          testID={`${testID}-current`}
        >
          <LinearGradient
            colors={GRADIENT.action}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.currentCard, SHADOW_1]}
          >
            <View style={styles.currentWell}>
              <Image source={ADDRESS_ART.location} style={styles.icon24} />
            </View>
            <Text style={[styles.emphasis, styles.flex]}>Use my current location</Text>
            <View style={styles.chevronWell}>
              <Image source={ADDRESS_ART.chevronRight} style={styles.icon20} />
            </View>
          </LinearGradient>
        </Pressable>

        {suggestions.length > 0 ? (
          <View style={styles.results}>
            <Text style={styles.emphasis}>Results for “{term}”</Text>
            <View>
              {suggestions.map((suggestion, index) => (
                <View key={suggestion.placeId}>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      onChoose(suggestion.placeId);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${suggestion.primary}. ${suggestion.secondary}`}
                    style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
                    testID={`address-suggestion-${suggestion.placeId}`}
                  >
                    <View style={styles.resultWell}>
                      <Image source={ADDRESS_ART.location} style={styles.icon20} />
                    </View>
                    <View style={styles.resultText}>
                      <Text style={styles.body} numberOfLines={1}>
                        {highlighted(suggestion.primary, term)}
                      </Text>
                      {suggestion.secondary === '' ? null : (
                        <Text style={styles.captionSecondary} numberOfLines={1}>
                          {suggestion.secondary}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                  {index < suggestions.length - 1 ? (
                    // A one-sided dashed border does not draw on iOS: a dashed box, clipped to its top.
                    <View style={styles.rule}>
                      <View style={styles.ruleDashes} />
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : notice === null ? null : (
          <View style={styles.notice}>
            {state === 'searching' ? <ActivityIndicator color={C.text} /> : null}
            <Text style={styles.captionSecondary}>{notice}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/** The matched part of a result in SemiBold, as `1870:2436` draws "**Indiranagar** Metro". */
function highlighted(text: string, term: string) {
  const at = term === '' ? -1 : text.toLowerCase().indexOf(term.toLowerCase());
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <Text style={styles.bodyStrong}>{text.slice(at, at + term.length)}</Text>
      {text.slice(at + term.length)}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.subtle },
  flex: { flex: 1 },
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: C.subtle },
  pinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasWindow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -2 * TIP_BELOW_CENTRE,
  },
  /** Centred by the overlay, as `1870:2405` draws it; the canvas above follows the tip. */
  pin: { height: PIN_HEIGHT, alignItems: 'center' },
  tooltip: {
    height: 32,
    marginBottom: 10,
    paddingLeft: 8,
    paddingRight: 12,
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: C.base,
  },
  pinBadge: { width: 52, height: 52 },
  stem: { width: 2, height: 16, borderRadius: 1, backgroundColor: C.text },
  pinShadow: { width: 16, height: 6 },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.base,
  },
  placeholder: { ...T.body, flex: 1, color: C.textSecondary },
  locatePill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: C.base,
  },
  locateWell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    backgroundColor: C.base,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 16,
    borderRadius: 24,
  },
  placeBadge: { width: 48, height: 48 },
  placeText: { flex: 1, minWidth: 0, gap: 4 },
  skeleton: { borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.08)' },
  skeletonTitle: { width: '60%', height: 20, marginVertical: 3 },
  skeletonLine: { width: '85%', height: 12, marginVertical: 2 },
  searchLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.base,
  },
  searchHeader: { paddingBottom: 16 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 16,
    marginTop: 16,
  },
  bareBack: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchFieldFocused: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    backgroundColor: C.base,
  },
  // No lineHeight on a TextInput (5eaf2c0): iOS draws the text off-centre with one.
  searchInput: {
    flex: 1,
    alignSelf: 'stretch',
    padding: 0,
    fontFamily: T.body.fontFamily,
    fontSize: T.body.fontSize,
    color: C.text,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  searchBody: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
  },
  currentWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  results: { gap: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rule: { height: 1, overflow: 'hidden' },
  ruleDashes: { height: 3, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border },
  resultWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: { flex: 1, minWidth: 0, gap: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { ...T.heading, color: C.text },
  emphasis: { ...T.emphasis, color: C.text },
  body: { ...T.body, color: C.text },
  bodyStrong: { ...T.bodyStrong, color: C.text },
  caption: { ...T.caption, color: C.text },
  captionStrong: { ...T.captionStrong, color: C.text },
  captionSecondary: { ...T.caption, color: C.textSecondary },
  icon18: { width: 18, height: 18 },
  icon20: { width: 20, height: 20 },
  icon24: { width: 24, height: 24 },
  pressed: { opacity: 0.85 },
});
