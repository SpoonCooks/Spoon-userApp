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
 * 11.889pt horizontal padding and 6pt vertical, a 32pt exported glyph, a 10pt gap, and a two-line
 * text column 2.315pt apart.
 *
 * TYPE RAMP — the current file moved BOTH lines up a step, which is the whole of the "14 → 17"
 * growth seen across `201:100`, `3:2002` and `6:663`:
 *
 *   title  Livvic Medium 10/13.33  →  Livvic Medium **11/16.5**  (`#1D293D`, box 14 → 17)
 *   body   Livvic Regular 9/13.5   →  Livvic Regular **10/15**   (70 % black, 2 lines 27 → 30)
 *
 * This is a change to THIS card, not to the tokens: `labelMedium` and `caption` already carry the
 * new values and are used by other screens the file did not touch, so nothing is re-valued. The
 * card simply now points at the correct two styles.
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
  /**
   * The same card is drawn at two heights and both are real measurements:
   *
   *   `default` — 66: `208:553` reassignment / `201:458` auto-cancel, whose copy runs longer.
   *   `tight`   — 45: `107:2587` / `107:2613`, the two cancellation-policy notices.
   *
   * Passed rather than changed globally, because the two are different frames (§16).
   */
  readonly density?: 'default' | 'tight';
  readonly testID?: string;
}

export function NoticeCard({
  title,
  body,
  art,
  children,
  density = 'default',
  testID = 'notice-card',
}: NoticeCardProps) {
  return (
    <View
      style={[
        styles.card,
        children === undefined ? styles.compact : styles.tall,
        children === undefined && density === 'tight' ? styles.tight : null,
      ]}
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
          {/* `208:558` — Livvic Medium 11/16.5. */}
          <Text variant="labelMedium" color="textField">
            {title}
          </Text>
          {/* `208:559` — Livvic Regular 10/15. */}
          <Text variant="caption" color="textSecondary">
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
  /**
   * `208:553` — px 11.889 / py 6, vertically centred. The card grew 57 → **66** with the type
   * ramp; the height is left to the content so a longer title cannot clip.
   */
  compact: {
    justifyContent: 'center',
    paddingHorizontal: 11.889,
    paddingVertical: lightTheme.space.s6,
    minHeight: 66,
  },
  /** `107:2587` / `107:2613` — the cancellation notices measure **45**, not 66. */
  tight: { minHeight: 45 },
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
