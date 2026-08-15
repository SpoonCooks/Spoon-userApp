import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text, lightTheme } from '@ui';

import {
  HOME_ICON_AVATAR_RING,
  HOME_ICON_BOLT,
  HOME_ICON_CHEVRON,
  HOME_ICON_CUSTOMER,
} from '../assets';
import { HOME_DESIGN } from '../layout';
import type { HomeHeaderViewModel } from '../types';

const { banner: DESIGN } = HOME_DESIGN;
/** The absolute avatar's lane, reserved so the headline and address never run under it. */
const PROFILE_LANE = DESIGN.profile.right + DESIGN.profile.box;

/**
 * Home top banner — Figma Page 3a `1:458`, re-read on Page 3b `209:1213`.
 *
 * Verbatim from the node: fill `rgba(236,255,155,0.5)`, BOTTOM corners only at 15pt, shadow
 * `0 1 4 rgba(0,0,0,0.15)`, padding 16/16/10, 4pt gap.
 *
 *   headline `209:1214`  23pt row — a 20 × 23 bolt, 4pt gap, Livvic Black 14/20 in `#0F172B`
 *   address  `209:1218`  34pt block — "Home" SemiBold 11/16.5 centred at y 10.5 with an 8.35pt
 *                        caret beside it, and the address line Regular 9/13.5 centred at y 26
 *   profile  `209:1223`  a 41pt box at top 14 / right 14, holding a 32pt ring and a 25pt glyph
 *
 * The address line truncates in the design too — `209:1222` is a separate "…" node — so it is
 * rendered single-line with the platform ellipsis rather than allowed to wrap.
 *
 * The ETA headline and the address are server copy. Nothing here computes a time or a distance.
 */
export interface HomeTopBannerProps {
  readonly header: HomeHeaderViewModel;
  readonly onPressAddress: () => void;
  readonly onPressProfile: () => void;
}

export function HomeTopBanner({ header, onPressAddress, onPressProfile }: HomeTopBannerProps) {
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
      </View>

      <Pressable
        onPress={onPressAddress}
        accessibilityRole="button"
        accessibilityLabel={`Delivery address: ${header.addressLabel}, ${header.addressLine}. Change`}
        hitSlop={8}
        style={styles.address}
        testID="home-address"
      >
        <View style={styles.addressLabel}>
          <Text variant="label" color="textPrimary" numberOfLines={1} style={styles.addressName}>
            {header.addressLabel}
          </Text>
          <Image
            source={HOME_ICON_CHEVRON}
            style={styles.chevron}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
        <Text variant="micro" color="textPrimary" numberOfLines={1} style={styles.addressLine}>
          {header.addressLine}
        </Text>
      </Pressable>

      <Pressable
        onPress={onPressProfile}
        accessibilityRole="button"
        accessibilityLabel="Profile"
        hitSlop={12}
        style={styles.profile}
        testID="home-profile"
      >
        <Image
          source={HOME_ICON_AVATAR_RING}
          style={styles.avatarRing}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Image
          source={HOME_ICON_CUSTOMER}
          style={styles.avatarGlyph}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
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
  /** The avatar is absolute, so the headline must reserve its lane on a narrow phone. */
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN.bolt.gap,
    paddingRight: PROFILE_LANE,
  },
  flexible: { flexShrink: 1 },
  bolt: { width: DESIGN.bolt.width, height: DESIGN.bolt.height },
  address: {
    alignSelf: 'stretch',
    paddingRight: PROFILE_LANE,
  },
  addressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN.address.chevronGap,
    height: DESIGN.address.labelCentreY * 2,
  },
  /** `59:376` — a fixed 48pt text box; the caret is positioned off IT, not off the glyphs. */
  addressName: { minWidth: DESIGN.address.labelWidth },
  /** Pulls the 13.5pt line up so its centre lands on the design's y = 26. */
  addressLine: {
    marginTop: DESIGN.address.lineCentreY - 13.5 / 2 - DESIGN.address.labelCentreY * 2,
  },
  /** Drops the caret onto the label's baseline, where `59:386` puts it. */
  chevron: {
    width: DESIGN.address.chevron.width,
    height: DESIGN.address.chevron.height,
    marginTop: DESIGN.address.chevronCentreY - DESIGN.address.labelCentreY,
  },
  profile: {
    position: 'absolute',
    top: DESIGN.profile.top,
    right: DESIGN.profile.right,
    width: DESIGN.profile.box,
    height: DESIGN.profile.box,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    top: (DESIGN.profile.box - DESIGN.profile.ring) / 2,
    left: (DESIGN.profile.box - DESIGN.profile.ring) / 2,
    width: DESIGN.profile.ring,
    height: DESIGN.profile.ring,
  },
  avatarGlyph: { width: DESIGN.profile.glyph, height: DESIGN.profile.glyph },
});
