import Feather from '@expo/vector-icons/Feather';

import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

/**
 * The single icon surface for the app.
 *
 * Library: `@expo/vector-icons`, **Feather family only**.
 *  - one package, already version-managed by `npx expo install`, no native config beyond what
 *    Expo does anyway, and no `react-native-svg` dependency;
 *  - a single family keeps stroke weight and corner treatment consistent — the audited frames
 *    mix filled glyphs, but the Figma "Icons" frame (`54:280`) contains only a chevron and a ✕,
 *    so no icon set is specified and consistency has to come from our choice (blocker D-14);
 *  - every glyph the app needs exists in Feather (see the registry below).
 *
 * Call sites use SEMANTIC names, never a library glyph name, so swapping the library later is a
 * change to this one file.
 *
 * Food / dish glyphs are deliberately NOT here: `94:905` is a set of ~25 bespoke filled artworks
 * that no icon library reproduces, and it does not cover the dishes the app actually shows
 * (defect D-13). Those need asset export and are handled by `DishGlyph`.
 */

const REGISTRY = {
  /**
   * The file draws TWO back controls and they are not interchangeable:
   *
   *  - `back`      `37:5266` — the SCREEN header's control: a 32pt white disc with a very light
   *                hairline ring and a CHEVRON inside it (verified on `3:1658`).
   *  - `backArrow` `1:739`   — the BOTTOM SHEET header's control: a bare 20pt ARROW on no fill.
   *                Its exported SVG is `M10 15.8333L4.16667 10L10 4.16667` + `M15.8333 10H4.16667`
   *                at a 1.66667 round-capped stroke — Feather `arrow-left` scaled to 20, exactly.
   *
   * Mapping `back` to the arrow put a shaft on every screen header, which none of them draw.
   */
  back: 'chevron-left',
  backArrow: 'arrow-left',
  forward: 'chevron-right',
  down: 'chevron-down',
  close: 'x',
  arrowRight: 'arrow-right',
  check: 'check',
  checkCircle: 'check-circle',
  plus: 'plus',
  minus: 'minus',
  phone: 'phone',
  help: 'headphones',
  clock: 'clock',
  calendar: 'calendar',
  pin: 'map-pin',
  home: 'home',
  user: 'user',
  users: 'users',
  languages: 'message-circle',
  chef: 'award',
  sunrise: 'sunrise',
  sun: 'sun',
  moon: 'moon',
  shield: 'shield',
  instant: 'zap',
  refresh: 'refresh-cw',
  /** TODO(designer): Feather has no wallet glyph; `credit-card` is the closest match. */
  wallet: 'credit-card',
  info: 'info',
  alert: 'alert-circle',
  offline: 'wifi-off',
  empty: 'inbox',
  edit: 'edit-2',
  logout: 'log-out',
  externalLink: 'external-link',
  /** `6:768` — the live-site row's leading mark is a PAGE, not a globe. */
  file: 'file-text',
  globe: 'globe',
  /** `3:772` — the Reel / YouTube recipe-link header glyph. */
  video: 'video',
  /** `3:782` — the link glyph inside the recipe input. */
  link: 'link',
  /**
   * `3:720` — the "Select Dishes for Cook" glyph is a fork-and-knife. Feather has no cutlery
   * glyph; `coffee` is the nearest food-service mark. ASSET_PENDING: export `3:720` from Figma.
   */
  utensils: 'coffee',
  star: 'star',
  search: 'search',
} as const;

export type IconName = keyof typeof REGISTRY;

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: ColorToken;
  /**
   * Screen-reader label. Omit for icons that only decorate text that already says the same
   * thing — those are hidden from assistive tech instead.
   */
  readonly label?: string;
  readonly testID?: string;
}

export function Icon({ name, size = 16, color = 'textPrimary', label, testID }: IconProps) {
  const decorative = label === undefined;

  return (
    <Feather
      name={REGISTRY[name]}
      size={size}
      color={lightTheme.colors[color]}
      testID={testID}
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      {...(decorative ? {} : { accessibilityRole: 'image' as const, accessibilityLabel: label })}
    />
  );
}
