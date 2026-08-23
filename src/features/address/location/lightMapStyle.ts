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
 * WHERE THE COLOURS COME FROM. `63:803` (the "Change area" thumbnail, `change-area.png`) is the
 * only approved Figma artwork that renders a real map, and it is a light warm canvas. Sampled off
 * that export:
 *
 *   land        `#FBF7E1`  45.9 % of the thumbnail
 *   local road  `#FFFFFF`  14.0 %
 *   built-up    `#EBEAD8`   4.7 %  (blocks / POI / transit)
 *   arterial    `#FBF3D4`   3.6 %
 *   park        `#E1F4D0`
 *   water       `#C8E8DC`
 *
 * Label ink is NOT in that sample — the thumbnail's only dark pixels are its "Change" caption — so
 * it is set to a warm dark grey that carries Google's own light-map contrast against `#FBF7E1`,
 * with the land colour as the halo. Leaving labels unstyled is the one thing that must not happen:
 * under the night scheme they would stay white and vanish into the light geometry.
 *
 * The first entry is deliberately unqualified. It floors EVERY geometry element at the land
 * colour, so any feature Google adds later that this list does not name can still never come
 * through dark; the qualified entries below it are overrides, not the whole map.
 */
export const LIGHT_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#fbf7e1' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a5647' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#fbf7e1' }] },

  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ded9c0' }],
  },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },

  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#f6f2d8' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#fbf7e1' }] },

  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#ebead8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7d7862' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e1f4d0' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b8f52' }] },

  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#ebead8' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6f6a58' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fbf3d4' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fbf3d4' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e8dfae' }] },

  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#ebead8' }] },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7d7862' }],
  },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8e8dc' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6f9488' }] },
];
