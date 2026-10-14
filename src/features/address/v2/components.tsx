import type { ReactNode, Ref } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ADDRESS_ART } from './art';
import { C, GRADIENT, T } from './theme';

/**
 * The header every list/form screen in the flow shares (`1870:2486`, `1870:2771`):
 * a `#FFF7CC` → `#FFE666` gradient with a 24pt bottom radius, the status-bar inset, then a nav
 * row — a 40pt white Back disc and the Display Large title, 12pt apart — over 24pt of padding.
 */
export function GradientHeader({
  title,
  onBack,
  testID,
}: {
  title: string;
  onBack?: (() => void) | undefined;
  testID: string;
}) {
  const { top } = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={GRADIENT.header}
      // 16pt under the status bar, as every header in the flow draws it (`1870:2771`).
      style={[styles.header, { paddingTop: Math.max(top, 20) + 16 }]}
      testID={testID}
    >
      <View style={styles.nav}>
        {onBack === undefined ? null : (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={4}
            style={({ pressed }) => [styles.backDisc, pressed && styles.pressed]}
            testID={`${testID}-back`}
          >
            <Image source={ADDRESS_ART.chevronLeft} style={styles.icon24} />
          </Pressable>
        )}
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>
    </LinearGradient>
  );
}

export function AddIcon({ size = 24 }: { size?: number }) {
  const scale = size / 24;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.addBar,
          { left: 4 * scale, top: 11 * scale, width: 16 * scale, height: 2 * scale },
        ]}
      />
      <View
        style={[
          styles.addBar,
          { left: 11 * scale, top: 4 * scale, width: 2 * scale, height: 16 * scale },
        ]}
      />
    </View>
  );
}

export type AddressLabelKind = 'home' | 'parents' | 'friends' | 'others';

const LABEL_WELLS = {
  home: ADDRESS_ART.labelHome,
  parents: ADDRESS_ART.labelParents,
  friends: ADDRESS_ART.labelFriends,
} as const;

/** The 40pt label well on saved cards: a `#FFD600` circle with the label's icon. */
export function LabelWell({ kind, size = 40 }: { kind: AddressLabelKind; size?: number }) {
  if (kind === 'others') {
    // Not drawn as a well in the file; composed the same way the three drawn wells are.
    return (
      <View style={[styles.othersWell, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={ADDRESS_ART.location} style={{ width: size * 0.6, height: size * 0.6 }} />
      </View>
    );
  }
  return <Image source={LABEL_WELLS[kind]} style={{ width: size, height: size }} />;
}

/** The label a saved address carries, read back to one of the four chips. */
export function labelKindOf(label: string): AddressLabelKind {
  const key = label.trim().toLowerCase();
  if (key === 'home') return 'home';
  if (key === 'parents') return 'parents';
  if (key === 'friends') return 'friends';
  return 'others';
}

/**
 * The Input component (`44:67`): white, 1pt `#FFEF99`, radius 8, min 48pt, 12pt padding, Body
 * text. Its title is the placeholder, and disappears once the user types (dev note).
 */
export function FieldInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  style,
  leading,
  inputProps,
  inputRef,
  testID,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  style?: StyleProp<ViewStyle>;
  leading?: ReactNode;
  inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'style'>;
  /** The TextInput, so a form can move focus to it (the keyboard's Next). */
  inputRef?: Ref<TextInput>;
  testID: string;
}) {
  return (
    <View style={[styles.field, style]}>
      {leading}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textSecondary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={styles.fieldInput}
        accessibilityLabel={placeholder}
        testID={testID}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 },
  backDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon24: { width: 24, height: 24 },
  title: { ...T.displayLarge, color: C.text, flexShrink: 1 },
  addBar: { position: 'absolute', backgroundColor: C.text, borderRadius: 1 },
  othersWell: { backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.base,
  },
  // No lineHeight on the input: iOS sets single-line TextInput text low when given one (see the
  // login field, `5eaf2c0`); it fills the field and centres instead.
  fieldInput: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontFamily: T.body.fontFamily,
    fontSize: T.body.fontSize,
    color: C.text,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  pressed: { opacity: 0.85 },
});

export { OutlineButton, PrimaryButton } from '@ui/v2/Buttons';
