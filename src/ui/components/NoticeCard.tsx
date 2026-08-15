import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { ReactNode } from 'react';

import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * The outlined notice — Figma `208:553` (reassignment), `201:458` (auto-cancel apology),
 * `201:467` (the refund block, which is this card with a body appended), `143:343` / `143:351`
 * (the two Extension notes) and `107:2587` / `107:2613` (the two cancellation-policy notes).
 *
 * Not to be confused with `NoteCard` (`99:1602`), which is the `#FFF7CC` "Note before starting"
 * block with a tall glyph. These are different frames with different fills, radii and glyph sizes.
 *
 * All three are the same object: a white card outlined 1pt in `#FFD600` at a 16pt radius with
 * 11.889pt padding, a 32pt exported glyph, a 10pt gap, and a two-line text column 2.315pt apart —
 * Livvic Medium 10/13.33 in `#1D293D` over Livvic Regular 9/13.5 in `rgba(0,0,0,0.7)`.
 *
 * BOUNDARY: this renders a message the SERVER has already decided to show. Nothing here knows
 * why a booking was reassigned or cancelled, and nothing here can cause either
 * (FRONTEND_FOUNDATION_PLAN.md §18, §20).
 */
export interface NoticeCardProps {
  readonly title: string;
  readonly body: string;
  /** The 32pt exported mark — `209:945` Replace, `201:475` Sad Cloud, `201:552` Stack of Money. */
  readonly art: ImageSourcePropType;
  /** `201:550` — the refund figures, appended below the notice inside the same card. */
  readonly children?: ReactNode;
  readonly testID?: string;
}

export function NoticeCard({
  title,
  body,
  art,
  children,
  testID = 'notice-card',
}: NoticeCardProps) {
  return (
    <View
      style={[styles.card, children === undefined ? styles.compact : styles.tall]}
      testID={testID}
      accessible={children === undefined}
      {...(children === undefined ? { accessibilityLabel: `${title}. ${body}` } : {})}
    >
      <View style={styles.row}>
        <Image
          source={art}
          style={styles.art}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.text}>
          <Text variant="captionStrong" color="textField">
            {title}
          </Text>
          <Text variant="micro" color="textSecondary">
            {body}
          </Text>
        </View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  /** `208:553` — white, 1pt `#FFD600`, 16pt radius. */
  card: {
    alignSelf: 'stretch',
    borderRadius: lightTheme.radius.md,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderNotice,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `208:553` — 11.889pt all round, vertically centred on its 57pt height. */
  compact: { justifyContent: 'center', padding: 11.889, minHeight: 57 },
  /** `201:467` — 12pt vertical, 11.889pt horizontal, 9pt between the notice and the figures. */
  tall: {
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 11.889,
    paddingVertical: lightTheme.space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.s10 },
  art: { width: 32, height: 32 },
  /** `208:557` — a 2.315pt lead between the two lines. */
  text: { flex: 1, minWidth: 0, gap: 2.315 },
});
