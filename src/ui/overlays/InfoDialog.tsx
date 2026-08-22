import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Icon } from '@ui/primitives/Icon';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { Dialog } from './Dialog';

/**
 * Informational dialog card — Figma `47:6628` ("What is Taxes?" over the Instant sheet).
 *
 * Geometry, verbatim from the node, relative to the 266 × 152 card (`47:6617`):
 *   card    white, 15pt radius
 *   icon    `47:6621` — 36 × 40 at (16, 16): a 35pt `#FFE666` disc with a 24pt money glyph
 *   close   `48:6634` — a 28pt white disc with a `0 4 4` lift at (228, 8), holding a 19pt cross
 *   title   `47:6619` — Livvic Bold 14/20, black, centred on y 72, 234 wide
 *   body    `47:6620` — Livvic Regular 10/15, black, centred on y 110.5, 234 wide
 *
 * The title is NOT beside the icon: the frame stacks icon → title → body down the left edge, with
 * the close control floating at the top right. The previous implementation put all three in one
 * row, which is why the dialog read as a different component.
 *
 * BOUNDARY: purely presentational. The taxes copy explains server-computed amounts; no tax,
 * total or discount is ever calculated in this layer (FRONTEND_FOUNDATION_PLAN.md §20).
 *
 * `presentation`:
 *  - `modal`  (default) — wraps itself in `Dialog`, for use over a screen;
 *  - `inline` — renders just the card, for use in `BottomSheet`'s `dialog` slot.
 */

/** `47:6622` — the banknote glyph. Feather has no banknote; `credit-card` is a different object. */
const MONEY_GLYPH = require('../../../assets/figma/icons/money.png') as ImageSourcePropType;

export interface InfoDialogProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly body: string;
  readonly presentation?: 'modal' | 'inline';
  readonly testID?: string;
}

export function InfoDialog({
  visible,
  onClose,
  title,
  body,
  presentation = 'modal',
  testID = 'info-dialog',
}: InfoDialogProps) {
  if (!visible) {
    return null;
  }

  const card = (
    <View
      style={styles.card}
      testID={testID}
      accessible={false}
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${body}`}
    >
      {/* `47:6621` — a 36 × 40 icon block; the disc itself is 35. */}
      <View style={styles.badgeBlock}>
        <View style={styles.badge}>
          <Image
            source={MONEY_GLYPH}
            style={styles.badgeGlyph}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>

      <Text variant="title" color="textPrimary" accessibilityRole="header">
        {title}
      </Text>

      <Text variant="caption" color="textPrimary">
        {body}
      </Text>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={12}
        style={styles.close}
        testID={`${testID}-close`}
      >
        <Icon name="close" size={19} color="textPrimary" />
      </Pressable>
    </View>
  );

  if (presentation === 'inline') {
    return card;
  }

  return (
    <Dialog visible={visible} onClose={onClose} testID={`${testID}-host`}>
      {card}
    </Dialog>
  );
}

const DESIGN = {
  cardWidth: 266,
  padding: 16,
  badge: 35,
  badgeGlyph: 24,
  /** Icon block bottom (16 + 40) → title top (62). */
  iconToTitle: 6,
  titleToBody: 6,
  close: 28,
} as const;

const styles = StyleSheet.create({
  card: {
    /** Held as a maxWidth so a 320dp phone shrinks the card rather than clipping it. */
    width: '100%',
    maxWidth: DESIGN.cardWidth,
    alignSelf: 'center',
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.radius.r15,
    padding: DESIGN.padding,
    /** Reserve the close control's lane so a long title cannot run under it. */
    paddingRight: DESIGN.padding + DESIGN.close,
    /** `47:6617` fixes the card at 152: 16 + 40 + 6 + 20 + 6 + 45 leaves **19** below the body. */
    paddingBottom: 19,
    gap: DESIGN.iconToTitle,
  },
  /** `47:6621` — the icon block is 36 wide and **40** tall, which sets the title's baseline. */
  badgeBlock: { width: 36, height: 40 },
  badge: {
    width: DESIGN.badge,
    height: DESIGN.badge,
    borderRadius: DESIGN.badge / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  badgeGlyph: { width: DESIGN.badgeGlyph, height: DESIGN.badgeGlyph },
  /** `48:6634` — a white disc with a `0 4 4 rgba(0,0,0,0.12)` lift, overlapping the card corner. */
  close: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: DESIGN.close,
    height: DESIGN.close,
    borderRadius: DESIGN.close / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
  },
});
