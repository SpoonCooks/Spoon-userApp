import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { DirectionalDisc, Text, lightTheme } from '@ui';

/**
 * The outlined navigation row — Figma `250:2966`, and the SAME component on every service-flow
 * frame that carries one: `292:234` En route, `292:404` Reassigned, `292:1013` Arrived,
 * `292:1189` In service, `308:3122` Completion.
 *
 * It is drawn twice with different content, which is why it is a component rather than a
 * Confirmation detail:
 *   "View booking details"       glyph `292:236` "Product"
 *   "Would you like to tip the cook?"  glyph `308:3130` "Receive Cash"
 *
 * Geometry, verbatim from `292:234`: 330 × 39 at a 15pt radius behind a 1pt `#FFD600` edge,
 * px 12 / py 6, a 35pt glyph 10pt clear of a Livvic Bold 14/20 label, and the shared 32pt disc
 * facing forward at the right.
 *
 * BOUNDARY: a seam. It opens something; it decides nothing about what that something shows.
 */
/**
 * The trailing affordance.
 *
 * `chevron` (`250:2966`) — the shared 32pt disc, for a row that opens a screen.
 * `whatsapp` (`383:748`) — a 28pt `#FFE666` disc under a `0 0 2 rgba(0,0,0,0.07)` lift carrying
 *   the WhatsApp mark, for the "Share recipe/ special requests" row on `8a` / `8b`. That row
 *   leaves the app, so it does not draw the chevron that means "forward, in here".
 */
export type ServiceLinkTrailing = 'chevron' | 'whatsapp';

/** `383:752` — the WhatsApp mark, exported with transparency. */
const WHATSAPP_MARK =
  require('../../../../assets/figma/booking/whatsapp-mark.png') as ImageSourcePropType;

export interface ServiceLinkRowProps {
  readonly label: string;
  readonly glyph: ImageSourcePropType;
  readonly onPress: () => void;
  /** `292:236` — the Product mark is drawn 1.04pt above its 35pt box; the tip mark is not. */
  readonly glyphOffset?: number;
  readonly trailing?: ServiceLinkTrailing;
  readonly testID?: string;
}

export function ServiceLinkRow({
  label,
  glyph,
  onPress,
  glyphOffset = 0,
  trailing = 'chevron',
  testID = 'service-link-row',
}: ServiceLinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      testID={testID}
    >
      <View style={styles.glyphBox}>
        <Image
          source={glyph}
          style={[styles.glyph, { marginTop: glyphOffset }]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text variant="title" color="textPrimary" style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {trailing === 'whatsapp' ? (
        /* `383:748` — `<circle r="14" fill="#FFE666">` with the 22 x 25 mark centred on it. */
        <View style={styles.whatsappDisc}>
          <Image
            source={WHATSAPP_MARK}
            style={styles.whatsappMark}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
      ) : (
        <DirectionalDisc direction="forward" size={32.248} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: lightTheme.space.s10,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.s6,
    borderRadius: lightTheme.layout.ctaRadius,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderNotice,
    overflow: 'hidden',
  },
  /** `383:749` — 28pt of `#FFE666` under a blur-2 shadow at 7 % black. */
  whatsappDisc: {
    width: 28.217,
    height: 28.217,
    borderRadius: 28.217 / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surfaceAccentBold,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  /** `383:752` — the mark is 22 x 25 inside the disc. */
  whatsappMark: { width: 17, height: 17 },
  /** `292:235` — a 35pt box clipping the glyph. */
  glyphBox: { width: 35, height: 35, overflow: 'hidden' },
  glyph: { width: 35, height: 35 },
  label: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.85 },
});
