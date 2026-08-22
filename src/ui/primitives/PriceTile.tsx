import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Duration tile. The file draws it at TWO densities, and they are genuinely different components
 * rather than one scaled to fit:
 *
 *   `wide`     `1:758` / `1:788` / `1:812` — the Instant sheet's 2-column grid.
 *              165 × 67.6, padding 9.8, gap 4, LEFT aligned.
 *              label Black 16/24 −0.4 · strike SemiBold 10/15 · price **Bold 14/20**
 *
 *   `compact`  `37:3771` / `37:3779` — the Scheduled screen's 3-column grid.
 *              107 × 52.09, padding 7.8, gap 2, CENTRED.
 *              label Black 16/24 −0.4 · strike **Medium** 10/15 · price **Bold 10/15**
 *
 * Shared geometry:
 *   radius    12
 *   selected  `rgba(226,255,104,0.7)` with `0 0 4 rgba(0,0,0,0.15)`
 *   idle      `rgba(255,247,204,0.7)`
 *   disabled  `rgba(0,0,0,0.07)` with `rgba(0,0,0,0.5)` ink and `rgba(0,0,0,0.3)` on the strike
 *   badge     `1:798` — absolute, right 6.1 / top 6.8, `#FFD600`, 6pt radius, Regular 9/13.5
 *
 * The badge is NOT the shared `Badge` primitive: `1:798` is a 9pt Regular chip at a 6pt radius
 * with its own 5% drop shadow, which the tone-driven `Badge` cannot express without distorting
 * every other consumer.
 *
 * The badge is a `wide`-ONLY element. `1:788` draws it; the compact Scheduled tile (`37:3779`)
 * draws none — there is no room for one on a 107 × 52 tile with centred content, and on device it
 * landed on top of the "1.5 hr" label. `badge` stays in the props because it is the same server
 * flag either way; only its RENDERING is density-dependent, which is what the two frames say.
 *
 * BOUNDARY: every price is a pre-formatted STRING supplied by the caller. This component does no
 * currency formatting, no discount arithmetic and no tax logic; it renders what the server said.
 * Whether the struck-through price is permanent or promo-conditional is a backend decision
 * (docs/FIGMA_FINAL_BLOCKERS.md B-14) — `strikePrice` is simply optional.
 */

export type PriceTileDensity = 'wide' | 'compact';

export interface PriceTileProps {
  /** `wide` = the Instant sheet (`1:758`); `compact` = the Scheduled grid (`37:3771`). */
  readonly density?: PriceTileDensity;
  /** e.g. "1.5 hr" — a label, never a computed duration. */
  readonly label: string;
  /** e.g. "₹189" — server-provided, pre-formatted. */
  readonly price: string;
  /** e.g. "₹450" — the struck original, when the server supplies one. */
  readonly strikePrice?: string;
  /** e.g. "Popular" — a merchandising flag from the server, not a client heuristic. */
  readonly badge?: string;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
  readonly testID?: string;
}

export function PriceTile({
  density = 'compact',
  label,
  price,
  strikePrice,
  badge,
  selected = false,
  disabled = false,
  onPress,
  testID,
}: PriceTileProps) {
  const wide = density === 'wide';
  const accessibilityLabel = [
    label,
    price,
    strikePrice === undefined ? null : `reduced from ${strikePrice}`,
    badge,
    disabled ? 'unavailable' : null,
  ]
    .filter((part): part is string => part !== null && part !== undefined)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || onPress === undefined}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.base,
        wide ? styles.wide : styles.compact,
        disabled ? styles.disabled : selected ? styles.selected : styles.idle,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text
        variant="heading"
        color={disabled ? 'textDisabledOnTile' : wide ? 'textStrong' : 'textPrimary'}
        align={wide ? 'left' : 'center'}
        numberOfLines={1}
      >
        {label}
      </Text>

      <View style={[styles.prices, wide ? styles.pricesWide : styles.pricesCompact]}>
        {strikePrice === undefined ? null : (
          <Text
            variant={wide ? 'strike' : 'strikeCompact'}
            color={disabled ? 'textDisabledMuted' : 'textSecondary'}
            style={styles.strike}
          >
            {strikePrice}
          </Text>
        )}
        <Text
          variant={wide ? 'title' : 'priceCompact'}
          color={disabled ? 'textDisabledOnTile' : wide ? 'textStrong' : 'textPrimary'}
        >
          {price}
        </Text>
      </View>

      {badge === undefined || !wide ? null : (
        <View style={styles.badge}>
          <Text variant="micro" color="textPrimary" numberOfLines={1}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRadius: lightTheme.layout.optionRadius,
  },
  /** `1:758` — 9.8pt padding, 4pt gap, rows sized at 67.6 so a short label cannot collapse it. */
  wide: { padding: 9.8, gap: lightTheme.space.xs, minHeight: 67.6, alignItems: 'flex-start' },
  /**
   * `37:3779` — a 107 × 52.0875 tile. Its label box sits at y 5.52 and is 24 tall, the price row
   * starts at 29.52 (so the gap is **0**, not 2) and is 17 tall, leaving 5.57 below: 5.52 + 24 +
   * 17 + 5.57 = 52.09. The previous 7.8 padding + 2 gap summed to 56.6 and measured 56.77 on
   * device — nearly 5pt of extra height on every Scheduled duration tile.
   */
  compact: {
    paddingHorizontal: 6.5,
    paddingVertical: 5.52,
    gap: 0,
    minHeight: 52.09,
    alignItems: 'center',
  },
  idle: { backgroundColor: lightTheme.colors.surfaceTileIdle },
  selected: {
    backgroundColor: lightTheme.colors.surfaceTileSelected,
    ...lightTheme.elevation.tile,
  },
  disabled: { backgroundColor: lightTheme.colors.surfaceTileDisabled },
  pressed: { opacity: 0.8 },
  prices: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  pricesWide: { gap: lightTheme.space.s6 },
  pricesCompact: { gap: lightTheme.space.xs, justifyContent: 'center' },
  strike: { textDecorationLine: 'line-through' },
  /**
   * `267:3586` — top 6.8, px 6 / py 2, 6pt radius, `0 1 1 rgba(0,0,0,0.05)`.
   *
   * RIGHT is **5.6**, not the 6.1 the superseded `1:798` drew: the badge is 44 wide at x 114.9 on
   * a 164.5 tile, so 164.5 − 114.9 − 44 = 5.6.
   */
  badge: {
    position: 'absolute',
    top: 6.8,
    right: 5.6,
    paddingHorizontal: lightTheme.space.s6,
    paddingVertical: lightTheme.space.xxs,
    borderRadius: lightTheme.layout.badgeRadius,
    backgroundColor: lightTheme.colors.surfaceBadge,
    ...lightTheme.elevation.badge,
  },
});
