import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AddressLines, DirectionalDisc, Text, lightTheme } from '@ui';

import { HOME_ICON_BOLT, HOME_ICON_CUSTOMER } from '../assets';
import { HOME_DESIGN } from '../layout';
import type { HomeHeaderViewModel } from '../types';

const { banner: DESIGN } = HOME_DESIGN;

/**
 * Home top banner — Figma `1:458`, re-read this pass on the current file and on Page 3b
 * (`333:3969`, an identical instance).
 *
 * Verbatim from the node: fill `rgba(236,255,155,0.5)`, BOTTOM corners only at 15pt, shadow
 * `0 1 4 rgba(0,0,0,0.15)`, padding 22 / 16 / 12, 4pt gap, 115 tall.
 *
 *   headline `1:459`     a 33pt row inset a further 4pt — a **24 × 33** bolt, **6pt** gap, then
 *                        Livvic Black 14/20 in `#0F172B`
 *   profile  `59:400`    a **32pt `#FFE666` disc** pinned to the row's right edge and centred on
 *                        it, holding the 25 × 26 glyph. The separate ring the superseded revision
 *                        drew (`209:1224`) does not exist here.
 *   address  `319:3341`  a 44pt block at px 4 / py 6 — a 140 × 32 stack ("Home" SemiBold 11/16.5
 *                        centred at y 8.5, the line Regular 9/13.5 centred at y 25) and, **12pt
 *                        after it**, the 32pt chevron disc `319:3343`
 *
 * The address control moved from an 8.35pt caret sitting next to the label to the shared 32pt
 * disc following the whole stack, so the label no longer needs its fixed 48pt measure — the disc
 * is positioned by the stack's width, not by the glyphs.
 *
 * The address line truncates in the design too — `319:3349` is a separate "…" node — so it is
 * rendered single-line with the platform ellipsis rather than allowed to wrap.
 *
 * The ETA headline and the address are server copy. Nothing here computes a time or a distance.
 */
export interface HomeTopBannerProps {
  readonly header: HomeHeaderViewModel;
  readonly onPressAddress: () => void;
  readonly onPressProfile: () => void;
}

/**
 * FIGMA_PENDING — the "no address yet" prompt.
 *
 * Every Home frame draws a saved address, so the design has no state for an account that has
 * none. Drawing the lockup empty would look broken and drawing a fixture address would be a
 * lie about the customer's data (FE-6), so the same two lines carry a prompt into the same
 * geometry. The control still opens the address flow, which is what a customer with no address
 * needs. Replace both strings when the empty state is designed.
 */
const NO_ADDRESS_LABEL = 'Add address';
const NO_ADDRESS_LINE = 'Set your delivery location';

export function HomeTopBanner({ header, onPressAddress, onPressProfile }: HomeTopBannerProps) {
  const hasAddress = header.addressLabel !== null && header.addressLine !== null;
  const addressLabel = header.addressLabel ?? NO_ADDRESS_LABEL;
  const addressLine = header.addressLine ?? NO_ADDRESS_LINE;

  return (
    <View style={styles.container} testID="home-header">
      <View style={styles.headline}>
        <Image
          source={HOME_ICON_BOLT}
          style={styles.bolt}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text variant="titleBlack" color="textStrong" numberOfLines={1} style={styles.flexible}>
          {header.etaHeadline}
        </Text>

        <Pressable
          onPress={onPressProfile}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={(lightTheme.layout.minTouchTarget - DESIGN.profile.size) / 2}
          style={styles.profile}
          testID="home-profile"
        >
          <Image
            source={HOME_ICON_CUSTOMER}
            style={styles.profileGlyph}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Pressable>
      </View>

      <Pressable
        onPress={onPressAddress}
        accessibilityRole="button"
        accessibilityLabel={
          hasAddress
            ? `Delivery address: ${addressLabel}, ${addressLine}. Change`
            : `${NO_ADDRESS_LABEL}. ${NO_ADDRESS_LINE}`
        }
        style={styles.address}
        testID="home-address"
      >
        <AddressLines
          label={addressLabel}
          line={addressLine}
          width={DESIGN.address.width}
          height={DESIGN.address.height}
        />

        <DirectionalDisc direction="down" size={DESIGN.address.disc} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: DESIGN.paddingTop,
    paddingBottom: DESIGN.paddingBottom,
    paddingHorizontal: DESIGN.paddingHorizontal,
    gap: DESIGN.gap,
    backgroundColor: lightTheme.colors.surfaceBanner,
    borderBottomLeftRadius: lightTheme.layout.bannerRadius,
    borderBottomRightRadius: lightTheme.layout.bannerRadius,
    ...lightTheme.elevation.banner,
    zIndex: 2,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    height: DESIGN.headline.height,
    paddingHorizontal: DESIGN.headline.paddingHorizontal,
    gap: DESIGN.headline.gap,
  },
  /** Takes the slack between the bolt and the profile disc, so the disc stays flush right. */
  flexible: { flex: 1, minWidth: 0 },
  bolt: { width: DESIGN.bolt.width, height: DESIGN.bolt.height },
  /** `59:400` — a solid `#FFE666` circle, clipped; the glyph is drawn on it, not on a ring. */
  profile: {
    width: DESIGN.profile.size,
    height: DESIGN.profile.size,
    borderRadius: DESIGN.profile.size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  profileGlyph: { width: DESIGN.profile.glyphWidth, height: DESIGN.profile.glyphHeight },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: DESIGN.address.gap,
    paddingHorizontal: DESIGN.address.paddingHorizontal,
    paddingVertical: DESIGN.address.paddingVertical,
  },
});
