import { Image, StyleSheet, View } from 'react-native';
import type { ImageResizeMode, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

/**
 * An image that takes its size from a box positioned by INSETS (`left`/`right`/`top`/`bottom`)
 * rather than an explicit width and height.
 *
 * A bare `<Image>` given only insets does not stretch to them on iOS: it keeps its intrinsic size
 * (a 1480 × 408 export draws 1480pt wide), so the art lands off the card. A plain `View` does
 * honour insets, so the `View` carries the placement and the image fills it at 100 %.
 */
export interface FillImageProps {
  readonly source: ImageSourcePropType;
  /** The box — typically `StyleSheet.absoluteFill` or an inset-positioned style. */
  readonly style: StyleProp<ViewStyle>;
  readonly resizeMode?: ImageResizeMode;
}

export function FillImage({ source, style, resizeMode = 'cover' }: FillImageProps) {
  return (
    <View style={style} pointerEvents="none">
      <Image source={source} style={styles.fill} resizeMode={resizeMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
});
