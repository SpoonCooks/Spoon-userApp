import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Icon } from '@ui/primitives/Icon';
import type { IconName } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

/**
 * Informational note card — Figma `99:1602` ("Note before starting").
 *
 * Geometry, verbatim: `#FFF7CC` at a 16pt radius with `0 0 2 rgba(0,0,0,0.15)`, 11.889pt padding
 * and a 10pt gap. The glyph (`99:1605`) is a 32 × 66 to-do list — a TALL mark, not a square icon —
 * and the copy is Livvic Bold 12/16 black over Livvic Regular 11/14.67 `rgba(0,0,0,0.7)`.
 *
 * Repeated across the file:
 *  - "Note before starting" on En route / Arrived / In service (gate entry, groceries, gas)
 *  - the two Extension-sheet notes
 *  - the cancellation policy's two info rows
 *
 * All of this is product CONTENT supplied by the caller. Notably, the cancellation fee schedule
 * renders here as content — the applicable fee is always a server value, never evaluated by the
 * client (FRONTEND_FOUNDATION_PLAN.md §20).
 */

export type NoteTone = 'accent' | 'positive' | 'muted';

export interface NoteCardProps {
  readonly title?: string;
  readonly body: string;
  /** `99:1605` — the exported glyph. Preferred over `icon` where the frame supplies one. */
  readonly art?: ImageSourcePropType;
  /**
   * The frames draw two marks in this slot: En route's TALL 32 × 66 to-do list (`99:1605`) and
   * the 24 × 23 shield on Arrived / In service (`3:1710`). Neither is a resize of the other.
   */
  readonly artSize?: 'tall' | 'square';
  readonly icon?: IconName;
  readonly tone?: NoteTone;
  readonly testID?: string;
}

const TONE_SURFACE: Record<NoteTone, string> = {
  accent: lightTheme.colors.surfaceAccent,
  positive: lightTheme.colors.surfacePositive,
  muted: lightTheme.colors.surfaceMuted,
};

export function NoteCard({
  title,
  body,
  art,
  artSize = 'tall',
  icon,
  tone = 'accent',
  testID = 'note-card',
}: NoteCardProps) {
  return (
    <View
      style={[styles.card, { backgroundColor: TONE_SURFACE[tone] }]}
      testID={testID}
      accessible
      accessibilityLabel={title === undefined ? body : `${title}. ${body}`}
    >
      {art === undefined ? (
        <Icon name={icon ?? 'info'} size={16} color="textSecondary" />
      ) : (
        <Image
          source={art}
          style={artSize === 'tall' ? styles.artTall : styles.artSquare}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      )}

      <View style={styles.text}>
        {title === undefined ? null : (
          <Text variant="bodyBold" color="textPrimary">
            {title}
          </Text>
        )}
        <Text variant="noteBody" color="textSecondary">
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: lightTheme.space.s10,
    padding: 11.889,
    borderRadius: lightTheme.radius.md,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  /** `99:1605` — En route's tall to-do mark. */
  artTall: { width: 32, height: 66 },
  /** `3:1710` — the Arrived / In-service shield, drawn 24 × 23 with a 2pt lead-in. */
  artSquare: { width: 24, height: 23, marginTop: lightTheme.space.xxs },
  text: { flex: 1, minWidth: 0, gap: 5 },
});
