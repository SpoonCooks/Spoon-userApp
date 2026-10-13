import type { MapStyleElement } from 'react-native-maps';

/**
 * The map's colour treatment for `53:33`, pinned so the device's theme cannot change it.
 *
 * WHY THIS EXISTS. `react-native-maps` 1.27.2 pulls `play-services-maps:19.1.0`, which introduced
 * `MapColorScheme` and defaults it to **FOLLOW_SYSTEM**. On a handset in Android dark mode the SDK
 * therefore draws its night palette — dark land, dark roads, white labels — and the address step
 * renders as a black slab under a light app. `app.config.ts` already sets
 * `userInterfaceStyle: 'light'`, but that governs the RN/AppCompat side; the Maps SDK reads the
 * system configuration and is unaffected by it. The library exposes no colour-scheme prop
 * (`MapView` has `customMapStyle` and nothing else), so a style is the only lever from JS.
 *
 * Applying an explicit style is also what makes the result deterministic rather than merely
 * "usually light": every element listed below is drawn in the colour named here whatever the SDK's
 * chosen scheme, so a device flipping to dark mode mid-session cannot repaint the canvas.
 *
 * WHERE THE COLOURS COME FROM. `1870:2379` (Address/map location) draws the canvas in the brand's
 * own palette, read off its layers:
 *
 *   land          `#FFF7CC`  color/surface/subtle
 *   parks         `#FFE666`  color/brand/primary-tint
 *   blocks        `#FFEF99`  color/border/default — built-up areas, transit, road casing
 *   roads         `#FFFFFF`  with a `#FFEF99` casing
 *   labels        black at 60 % (`#666666` on the land; Google styles take no alpha), land halo
 *
 * The frame draws no place markers, so POI icons and business labels are switched off: the pin is
 * the one marker on this map. Water is not in the frame; it keeps a pale tint so lakes still read.
 *
 * The first entry is deliberately unqualified. It floors EVERY geometry element at the land
 * colour, so any feature Google adds later that this list does not name can still never come
 * through dark; the qualified entries below it are overrides, not the whole map.
 */
export const LIGHT_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#fff7cc' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#fff7cc' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ffef99' }],
  },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },

  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#fff7cc' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#fff7cc' }] },

  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#ffef99' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#ffe666' }] },

  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#ffef99' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },

  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#ffef99' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d6ecff' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
];
