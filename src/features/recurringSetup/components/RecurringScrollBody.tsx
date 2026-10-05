import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { lightTheme } from '@ui/theme/ThemeProvider';

import { HelpFab } from './HelpFab';

/**
 * A recurring screen's content region (`Content`, between the nav header and the footer): the
 * scrolling column, the help button floating over it, and — while there is more below the fold —
 * the "Scroll fade" (`1241:2362`) that dims the foot of the column into the footer.
 *
 * The frames pin the help button 12 above the region's foot while the column scrolls beneath it,
 * so it lives beside the `ScrollView` rather than inside it. Hand it the screen's own content as
 * children and the column's padding / gap as `contentStyle`.
 */
export interface RecurringScrollBodyProps {
  readonly children: React.ReactNode;
  readonly contentStyle?: StyleProp<ViewStyle>;
  /** Draws the help button (default). */
  readonly help?: boolean;
  readonly testID?: string;
}

/** `1241:2362` — 40pt tall. */
const FADE_HEIGHT = 40;
/** Pixels of content still hidden below before the fade shows. */
const MORE_BELOW = 1;

export function RecurringScrollBody({
  children,
  contentStyle,
  help = true,
  testID,
}: RecurringScrollBodyProps) {
  const metrics = useRef({ content: 0, viewport: 0, offset: 0 });
  const [moreBelow, setMoreBelow] = useState(false);

  const measure = useCallback(() => {
    const { content, viewport, offset } = metrics.current;
    const next = viewport > 0 && content - viewport - offset > MORE_BELOW;
    setMoreBelow((current) => (current === next ? current : next));
  }, []);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    metrics.current.offset = event.nativeEvent.contentOffset.y;
    measure();
  };

  const gradient = lightTheme.gradients.scrollFade;

  return (
    <View style={styles.region} testID={testID}>
      <ScrollView
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={(event) => {
          metrics.current.viewport = event.nativeEvent.layout.height;
          measure();
        }}
        onContentSizeChange={(_width, height) => {
          metrics.current.content = height;
          measure();
        }}
      >
        {children}
      </ScrollView>
      {moreBelow ? (
        <LinearGradient
          pointerEvents="none"
          colors={gradient.colors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fade}
          testID={testID === undefined ? undefined : `${testID}-fade`}
        />
      ) : null}
      {help ? <HelpFab /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  region: { flex: 1 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FADE_HEIGHT },
});
