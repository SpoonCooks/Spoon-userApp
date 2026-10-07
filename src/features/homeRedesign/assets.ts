import type { ImageSourcePropType } from 'react-native';

/**
 * Static artwork for the redesigned Home, exported from Figma `cCQlzTeiObQkpVBzwI8mZi` and
 * committed under `assets/figma/home2/`. Vector layers were rasterised at 3× their rendered box
 * (this project has no SVG renderer). Cook photography is placeholder content until the backend
 * is connected.
 */
const img = (source: unknown) => source as ImageSourcePropType;

export const ART = {
  glows: img(require('../../../assets/figma/home2/background-glows.png')),
  hero: img(require('../../../assets/figma/home2/hero-scene.png')),
  pin: img(require('../../../assets/figma/home2/icon-pin.png')),
  /** `1625:11068` Icon/Dropdown. */
  dropdown: img(require('../../../assets/figma/home2/icon-dropdown.png')),
  profile: img(require('../../../assets/figma/home2/icon-profile.png')),
  flash: img(require('../../../assets/figma/home2/icon-flash.png')),
  time: img(require('../../../assets/figma/home2/icon-time.png')),
  tileSurface: img(require('../../../assets/figma/home2/tile-surface.png')),
  tileSurfaceFocused: img(require('../../../assets/figma/home2/tile-surface-focused.png')),
  tileSurfaceSelected: img(require('../../../assets/figma/home2/tile-surface-selected.png')),
  tileSurfaceUnavailable: img(require('../../../assets/figma/home2/tile-surface-unavailable.png')),
  tileSurfaceFocusedUnavailable: img(
    require('../../../assets/figma/home2/tile-surface-focused-unavailable.png'),
  ),
  selectedCheck: img(require('../../../assets/figma/home2/selected-check.png')),
  flashOff: img(require('../../../assets/figma/home2/icon-flash-off.png')),
  money: img(require('../../../assets/figma/home2/icon-money.png')),
  restart: img(require('../../../assets/figma/home2/icon-restart.png')),
  cookVisit: img(require('../../../assets/figma/home2/icon-cook-visit.png')),
  thread: img(require('../../../assets/figma/home2/thread.png')),
  beadCook1: img(require('../../../assets/figma/home2/bead-cook-1.png')),
  beadCook3: img(require('../../../assets/figma/home2/bead-cook-3.png')),
  dayArc: img(require('../../../assets/figma/home2/day-arc.png')),
  dayLine: img(require('../../../assets/figma/home2/day-line.png')),
  noon: img(require('../../../assets/figma/home2/icon-noon.png')),
  noonB: img(require('../../../assets/figma/home2/icon-noon-b.png')),
  sunrise: img(require('../../../assets/figma/home2/icon-sunrise.png')),
  sunset: img(require('../../../assets/figma/home2/icon-sunset.png')),
  night: img(require('../../../assets/figma/home2/icon-night.png')),
  dialEllipse: img(require('../../../assets/figma/home2/dial-ellipse.png')),
  seg30m: img(require('../../../assets/figma/home2/seg-30m.png')),
  seg45m: img(require('../../../assets/figma/home2/seg-45m.png')),
  seg1h: img(require('../../../assets/figma/home2/seg-1h.png')),
  seg15h: img(require('../../../assets/figma/home2/seg-15h.png')),
  seg2h: img(require('../../../assets/figma/home2/seg-2h.png')),
  seg25h: img(require('../../../assets/figma/home2/seg-25h.png')),
  timeExtension: img(require('../../../assets/figma/home2/icon-time-extension.png')),
  star: img(require('../../../assets/figma/home2/star.png')),
  bandCurve: img(require('../../../assets/figma/home2/band-curve.png')),
  check: img(require('../../../assets/figma/home2/check.png')),
  notIncluded: img(require('../../../assets/figma/home2/icon-not-included.png')),
  promiseWave: img(require('../../../assets/figma/home2/promise-wave.png')),
  mapArt: img(require('../../../assets/figma/home2/map-art.png')),
  pinHsr: img(require('../../../assets/figma/home2/pin-hsr.png')),
  liveDot: img(require('../../../assets/figma/home2/live-dot.png')),
  locationFill: img(require('../../../assets/figma/home2/icon-location-fill.png')),
  divider: img(require('../../../assets/figma/home2/divider.png')),
  bell: img(require('../../../assets/figma/home2/icon-bell.png')),
  whatsappGlyph: img(require('../../../assets/figma/home2/union.png')),
  whatsapp: img(require('../../../assets/figma/home2/icon-button.png')),
  cooks: [
    img(require('../../../assets/figma/home2/cook-1.png')),
    img(require('../../../assets/figma/home2/cook-2.png')),
    img(require('../../../assets/figma/home2/cook-3.png')),
    img(require('../../../assets/figma/home2/cook-4.png')),
  ],
} as const;
