import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The chevron disc, from the ONE asset Figma exports for it.
 *
 * Figma draws a single control — `54:289` inside the screen-header component `63:783` — as a
 * 32 × 32 box holding a white `r = 14` circle under a `0 0 2 rgba(0,0,0,0.15)` drop shadow, with a
 * chevron stroked in black at 70 % opacity, 1.667pt wide, round caps and joins. Both the back and
 * the forward affordance are that same drawing; only its facing differs.
 *
 * Previously the header reconstructed it from Feather's `chevron-left` while
 * `ConfirmationBody` used the exported PNG under an ad-hoc `rotate: '179.55deg'`. That was two
 * different renderings of one designed control, and the rotation was measurably wrong: the
 * exported asset points **right**, so rotating it ~180° made a forward row point backwards.
 *
 * This component is the single place that decision lives. The asset is used as exported for
 * `forward`, and mirrored for `back` — a horizontal mirror rather than a rotation, so the
 * transform stays meaningful if the disc ever stops being vertically symmetric.
 *
 * Geometry is NOT scaled: `size` defaults to the drawn 32 and the 44pt touch target is restored
 * with `hitSlop`, the same way `IconButton` and `Button` already do it.
 */

/**
 * `54:289` / `250:2970` — the exported disc. Points forward (chevron vertex on the right).
 *
 * `disc.png` is `back.png` with the export's OPAQUE WHITE CORNERS masked away at the drawn circle
 * (r = 14 in a 32 box). Figma's PNG export flattens the node against whatever it sits on, so the
 * raw export carried a white square. On the white screens that square was invisible and the
 * control looked correct; on Home's LIME top banner it drew a white box around the chevron —
 * which is the Home header defect task §2 describes.
 *
 * Only the alpha channel differs. Every drawn pixel of the circle and the chevron is Figma's own.
 */
const DISC = require('../../../assets/figma/icons/disc.png') as ImageSourcePropType;

export type DiscDirection = 'back' | 'forward' | 'down';

export interface DirectionalDiscProps {
  readonly direction: DiscDirection;
  /** Required when pressable: the control carries no text. */
  readonly label?: string;
  readonly onPress?: () => void;
  /** `54:289` draws 32 × 32. Overridable only where a frame genuinely draws another size. */
  readonly size?: number;
  readonly testID?: string;
}

export function DirectionalDisc({
  direction,
  label,
  onPress,
  size = 32,
  testID,
}: DirectionalDiscProps) {
  const slop = Math.max(0, (lightTheme.layout.minTouchTarget - size) / 2);

  /**
   * The circle is drawn as a VIEW beneath the artwork purely so the drop shadow has a ROUND
   * outline. Android derives an elevation shadow from the view's outline, so hanging it on the
   * now-transparent 32pt image would cast a SQUARE shadow — the same defect in another form.
   * The lit disc is `r = 14`, exactly the `<circle cx="16" cy="16" r="14">` the node exports.
   */
  const lit = size * (14 / 16);

  const image = (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={[styles.lift, { width: lit, height: lit, borderRadius: lit / 2 }]}
        pointerEvents="none"
      />
      <Image
        source={DISC}
        style={[styles.art, { width: size, height: size }, DIRECTION_STYLE[direction]]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );

  if (onPress === undefined) {
    return image;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      {image}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  /** `filter0_d_0_4` — offset 0, blur 2, black at 15 %. */
  lift: {
    backgroundColor: lightTheme.colors.surface,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  art: { position: 'absolute' },
  /** The exported asset faces forward; back is its mirror. */
  mirrored: { transform: [{ scaleX: -1 }] },
  /**
   * `319:3343` — the Home address control. Figma exports it as its own SVG, but that drawing is
   * this same disc with the chevron a quarter-turn on: the exported down-chevron's vertex sits at
   * (16.31, 19.33) against (16, 20) for the forward mark rotated 90°, and its arms land within
   * 0.7pt of each other. One asset, one control, three facings — a second PNG of the same circle
   * would only be able to drift.
   */
  down: { transform: [{ rotate: '90deg' }] },
});

const DIRECTION_STYLE: Record<DiscDirection, StyleProp<ImageStyle>> = {
  forward: null,
  back: styles.mirrored,
  down: styles.down,
};
