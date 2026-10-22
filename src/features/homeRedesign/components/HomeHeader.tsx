import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ART } from '../assets';
import { C, F } from '../theme';

export interface HomeHeaderProps {
  readonly addressLabel: string;
  /** "Building_name · Flat/House #"; the line is left out when `null`. */
  readonly addressDetail?: string | null;
  readonly onPressAddress?: () => void;
  readonly onPressProfile?: () => void;
  /**
   * 0 → 1 as the pinned header fills on scroll. The profile disc turns white with it: its own
   * `#FFEF99` all but vanishes into the filled header's yellow (owner, 2026-10-14).
   */
  readonly filled?: Animated.AnimatedInterpolation<number>;
}

/**
 * `1255:2983` "Nav header/ home page" — the 44pt pin box, then `1625:11065` "Address/Default": a
 * 200pt column of "Label" (SemiBold 16) with the 20pt dropdown 8 to its right, over
 * "Building_name · Flat/House #" (Regular 12, primary). A 44pt profile disc is pinned right.
 * The not-live Home (`1302:3539`) draws the same header, with no extra tag.
 */
export function HomeHeader({
  addressLabel,
  addressDetail = null,
  onPressAddress,
  onPressProfile,
  filled,
}: HomeHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delivery address ${addressLabel}${addressDetail === null ? '' : `, ${addressDetail}`}`}
        onPress={onPressAddress}
        style={styles.address}
      >
        <View style={styles.pinBox}>
          <Image source={ART.pin} style={styles.pin} />
        </View>
        <View style={styles.addressText}>
          <View style={styles.labelRow}>
            <Text style={styles.label} numberOfLines={1}>
              {addressLabel}
            </Text>
            <Image source={ART.dropdown} style={styles.dropdown} />
          </View>
          {addressDetail === null ? null : (
            <Text style={styles.detail} numberOfLines={1}>
              {addressDetail}
            </Text>
          )}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profile"
        onPress={onPressProfile}
        style={styles.profile}
      >
        {filled === undefined ? null : (
          <Animated.View style={[styles.profileWhite, { opacity: filled }]} pointerEvents="none" />
        )}
        <Image source={ART.profile} style={styles.profileGlyph} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 8,
  },
  address: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pin: { width: 20, height: 20 },
  addressText: { width: 200 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flexShrink: 1, fontFamily: F.semibold, fontSize: 16, lineHeight: 24, color: C.text },
  dropdown: { width: 20, height: 20 },
  detail: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.text },
  profile: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileWhite: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    backgroundColor: C.base,
  },
  profileGlyph: { width: 32, height: 32 },
});
