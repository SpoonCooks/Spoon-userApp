import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ART } from '../assets';
import { C, F } from '../theme';

export interface HomeHeaderProps {
  readonly addressLabel: string;
  readonly notLive?: boolean;
  readonly onPressAddress?: () => void;
  readonly onPressProfile?: () => void;
}

/** `1137:14505` — pin + address on the left, a 44pt profile disc pinned right. */
export function HomeHeader({
  addressLabel,
  notLive,
  onPressAddress,
  onPressProfile,
}: HomeHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delivery address ${addressLabel}`}
        onPress={onPressAddress}
        style={styles.address}
      >
        <View style={styles.pinBox}>
          <Image source={ART.pin} style={styles.pin} />
        </View>
        <Text style={styles.label}>{addressLabel}</Text>
      </Pressable>
      {notLive ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>Not live yet</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profile"
        onPress={onPressProfile}
        style={styles.profile}
      >
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
  label: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.text },
  tag: {
    backgroundColor: C.soft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  tagText: { fontFamily: F.semibold, fontSize: 10, lineHeight: 14, color: C.text },
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
  profileGlyph: { width: 32, height: 32 },
});
