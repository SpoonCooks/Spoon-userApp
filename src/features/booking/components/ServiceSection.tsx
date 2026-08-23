import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { lightTheme } from '@ui';

/**
 * The service-flow section wrapper — Figma `289:9216`, `299:2131`, `94:1038`, `292:32`, and every
 * equivalent on En route, Reassigned, Arrived, In service and Completion.
 *
 * Every block on every frame in `308:3134` is drawn the same way: a **338**pt box inset **4pt**
 * horizontally and **6pt** vertically, holding 330pt of content, with **16pt** between the boxes.
 * That makes the visible gap between two blocks 28 — the implementation used a flat 22 with no
 * inset, which both narrowed the rhythm and let the cards run 8pt wider than the frame draws.
 *
 * It is the same system Home uses (`1:595` and friends), and the same one the seven banked
 * sections use for their 16pt gutter column.
 */
export interface ServiceSectionProps {
  readonly children: ReactNode;
  readonly style?: ViewStyle;
  readonly testID?: string;
}

export function ServiceSection({ children, style, testID }: ServiceSectionProps) {
  return (
    <View style={[styles.section, style]} testID={testID}>
      {children}
    </View>
  );
}

/** `3:1042` — 16 between the section BOXES. */
export const SERVICE_SECTION_GAP = lightTheme.space.lg;

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
  },
});
