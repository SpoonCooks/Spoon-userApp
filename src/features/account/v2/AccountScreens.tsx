import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, SHADOW_2, T } from '@ui/v2/theme';

import { ACCOUNTS_ART } from '@ui/v2/accountsArt';

/**
 * Manage account (Figma `1517:10267`) and Account & data (`1517:10315`). Dev notes `2084:2777` /
 * `2084:2781`: the rows open Account & data and in-app web views for Privacy and Terms; Log out
 * keeps the account; the phone is read-only and Verified; the counts are live; "Delete account" is
 * a deliberately quiet link that opens the confirm sheet.
 */

function Header({ title, onBack, testID }: { title: string; onBack: () => void; testID: string }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: top + 16 }]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={styles.back}
        testID={`${testID}-back`}
      >
        <Image source={ACCOUNTS_ART.chevronLeft} style={styles.icon24} />
      </Pressable>
      <Text style={T.displayLarge} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      {label === undefined ? null : <Text style={styles.groupLabel}>{label}</Text>}
      <View style={[styles.card, SHADOW_2]}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  well = C.subtle,
  title,
  subtitle,
  trailing,
  last = false,
  onPress,
  testID,
}: {
  icon: ImageSourcePropType;
  well?: string;
  title: string;
  subtitle?: string | null;
  trailing?: ReactNode;
  last?: boolean;
  onPress?: () => void;
  testID: string;
}) {
  const content = (
    <>
      <View style={[styles.well, { backgroundColor: well }]}>
        <Image source={icon} style={styles.icon24} />
      </View>
      <View style={styles.rowText}>
        <Text style={T.bodyStrong}>{title}</Text>
        {subtitle === undefined || subtitle === null ? null : (
          <Text style={[T.micro, styles.secondary]} testID={`${testID}-subtitle`}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
    </>
  );
  const style = [styles.row, !last && styles.rowDivider];
  if (onPress === undefined) {
    return (
      <View style={style} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        subtitle === undefined || subtitle === null ? title : `${title}, ${subtitle}`
      }
      style={style}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}

const Chevron = () => <Image source={ACCOUNTS_ART.listChevron} style={styles.chevron} />;

export interface ManageAccountScreenProps {
  readonly onBack: () => void;
  readonly onAccountData: () => void;
  readonly onPrivacy: () => void;
  readonly onTerms: () => void;
  readonly onLogout: () => void;
  readonly loggingOut?: boolean;
}

export function ManageAccountScreen(props: ManageAccountScreenProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={styles.screen} testID="account-screen">
      <Header title="Manage account" onBack={props.onBack} testID="account-screen" />
      <ScrollView contentContainerStyle={styles.body}>
        <Group label="ACCOUNT">
          <Row
            icon={ACCOUNTS_ART.profile}
            title="Account & data"
            trailing={<Chevron />}
            last
            onPress={props.onAccountData}
            testID="account-data"
          />
        </Group>
        <Group>
          <Row
            icon={ACCOUNTS_ART.lock}
            well="#ECFF9B"
            title="Privacy policy"
            trailing={<Chevron />}
            onPress={props.onPrivacy}
            testID="account-privacy"
          />
          <Row
            icon={ACCOUNTS_ART.doc}
            well={C.tint}
            title="Terms of Service"
            trailing={<Chevron />}
            last
            onPress={props.onTerms}
            testID="account-terms"
          />
        </Group>
      </ScrollView>
      {/* `1517:10267` — Log out sits 91pt above the screen's bottom edge, not on it. */}
      <View style={[styles.logoutWrap, { paddingBottom: bottom + 57 }]}>
        <Pressable
          onPress={props.onLogout}
          disabled={props.loggingOut === true}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ busy: props.loggingOut === true }}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          testID="profile-logout"
        >
          <Image source={ACCOUNTS_ART.logout} style={styles.icon24} />
          <Text style={T.button}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

export interface AccountDataScreenProps {
  readonly phone: string;
  readonly addressesSummary: string | null;
  readonly visitsSummary: string | null;
  readonly onBack: () => void;
  readonly onTasteProfile: () => void;
  readonly onAddresses: () => void;
  readonly onBookingHistory: () => void;
  readonly onDelete: () => void;
  readonly sheet?: ReactNode;
}

export function AccountDataScreen(props: AccountDataScreenProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={styles.screen} testID="account-data-screen">
      <Header title="Account & data" onBack={props.onBack} testID="account-data-screen" />
      <ScrollView contentContainerStyle={styles.body}>
        <Group label="LOGIN">
          <Row
            icon={ACCOUNTS_ART.phone}
            title={props.phone}
            trailing={
              <View style={styles.verified}>
                <Text style={T.microStrong}>Verified</Text>
              </View>
            }
            last
            testID="account-data-phone"
          />
        </Group>
        <Group label="WHAT WE STORE">
          <Row
            icon={ACCOUNTS_ART.dish}
            title="Food Profile"
            subtitle="Diet, spice level, cuisines"
            onPress={props.onTasteProfile}
            testID="account-data-taste"
          />
          <Row
            icon={ACCOUNTS_ART.location}
            title="Saved addresses"
            subtitle={props.addressesSummary}
            onPress={props.onAddresses}
            testID="account-data-addresses"
          />
          <Row
            icon={ACCOUNTS_ART.bookings}
            title="Booking history"
            subtitle={props.visitsSummary}
            last
            onPress={props.onBookingHistory}
            testID="account-data-history"
          />
        </Group>
      </ScrollView>
      {/* `1517:10315` — the link sits 86pt above the screen's bottom edge. */}
      <View style={[styles.leave, { paddingBottom: bottom + 52 }]}>
        <Text style={[T.caption, styles.secondary]}>Want to leave Spoon?</Text>
        <Pressable
          onPress={props.onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          hitSlop={8}
          testID="account-delete"
        >
          <Text style={[T.bodyStrong, styles.secondary, styles.underline]}>Delete account</Text>
        </Pressable>
      </View>
      {props.sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
    backgroundColor: C.subtle,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon24: { width: 24, height: 24 },
  body: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 24, gap: 24 },
  group: { gap: 8 },
  groupLabel: {
    fontFamily: T.microStrong.fontFamily,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    color: C.textSecondary,
  },
  card: {
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.base,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  well: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 4 },
  secondary: { color: C.textSecondary },
  underline: { textDecorationLine: 'underline' },
  chevron: { width: 7, height: 11 },
  verified: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#ECFF9B',
  },
  logoutWrap: { paddingHorizontal: 16, paddingTop: 16 },
  logout: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    backgroundColor: C.base,
  },
  pressed: { opacity: 0.7 },
  leave: { alignItems: 'center', gap: 4, paddingHorizontal: 16 },
});
