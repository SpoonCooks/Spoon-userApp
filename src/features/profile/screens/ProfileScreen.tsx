import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import { IntroLoading } from '@features/loading';
import {
  BANNER_AVATAR_GLYPH,
  Icon,
  PROFILE_AVATAR_GLYPH,
  PROFILE_INCOMPLETE_BADGE,
  PROFILE_CHEVRON_GLYPH,
  PROFILE_TILE_ART,
  QueryBoundary,
  ScreenHeader,
  Text,
  lightTheme,
} from '@ui';

import type { ProfileViewModel } from '../types';

/**
 * Profile — Figma `6:663`.
 *
 * Read off the frame:
 *   identity  `6:667`  — a white 24pt-radius card outlined 1pt in `#FFDE33`, 15.889pt padding,
 *                        16pt gap: a 32pt avatar disc, then the name in Livvic Bold 14/20
 *                        `#0F172B` over the contact line in Livvic Regular 12/16 `#62748E`.
 *   tiles     `69:423` — a 2 × 2 grid of 161 × 97 `#FFF7CC` tiles at a 15pt radius with an INSET
 *                        `0 0 2 rgba(0,0,0,0.1)` shadow: a 32pt disc, then Livvic Bold 14/20 over
 *                        Livvic Regular 9/13.5, with a 32pt chevron on the right.
 *   footer    `6:765`  — `rgba(255,247,204,0.7)` at a 24pt radius lifted UPWARDS by
 *                        `0 -1 4 rgba(0,0,0,0.15)`: the live-site link, the legal link, and the
 *                        `#FFF1F2` Log Out row in Livvic Bold 12/16 `#C70036`.
 *
 * Ruling R-1: there is deliberately NO "Payment methods" tile — payment opens Razorpay directly,
 * so the app has no payment-management surface. Nothing is added beyond what the frame draws.
 * Ruling R-6: Terms & Privacy live here and nowhere else.
 *
 * Logout clears SecureStore, the query cache and session status — all three are wired in
 * `@core/auth` + `@core/runtime`; this screen only raises the intent.
 * TODO(product B-10): the Help tile has no destination anywhere in the file.
 */
export interface ProfileActions {
  readonly onBack: () => void;
  /** `222:1590`. Optional: the destination for "Complete profile" is not designed anywhere. */
  readonly onCompleteProfile?: () => void;
  readonly onSelectTile: (tileId: string) => void;
  readonly onOpenLink: (linkId: string) => void;
  readonly onLogout: () => void;
}

export interface ProfileViewProps extends ProfileActions {
  readonly state: DataState<ProfileViewModel>;
  readonly onRetry: () => void;
}

export function ProfileView({ state, onRetry, ...actions }: ProfileViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID="profile-screen">
      <QueryBoundary state={state} onRetry={onRetry} loadingFallback={<IntroLoading />}>
        {(profile) => (
          <>
            <ScreenHeader title={profile.title} onBack={actions.onBack} />

            <ScrollView contentContainerStyle={styles.body}>
              <View style={styles.identity} testID="profile-identity">
                <Image
                  source={PROFILE_AVATAR_GLYPH}
                  style={styles.avatar}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
                <View style={styles.identityText}>
                  <Text variant="title" color="textStrong" numberOfLines={1}>
                    {profile.user.name}
                  </Text>
                  <Text variant="body" color="textQuiet" numberOfLines={1}>
                    {profile.user.contactLine}
                  </Text>
                </View>
              </View>

              {/* `222:1570` — NEW. A 145pt prompt between the identity card and the grid,
                  rendered only when the server says the profile is incomplete. The panel is
                  `rgba(255,247,204,0.7)` UNDER a shadow, so it uses the pre-composited token
                  (§P3.2 class B) rather than the translucent value. */}
              {profile.incomplete === undefined ? null : (
                <View style={styles.incomplete} testID="profile-incomplete">
                  <View style={styles.incompleteHead}>
                    {/* `222:1571` — a 47 x 32 box: the 32pt disc and its 25pt glyph, then the
                        15 x 32 exclamation mark at x 32.11. */}
                    <View style={styles.incompleteMark}>
                      <View style={styles.incompleteDisc} />
                      <Image
                        source={BANNER_AVATAR_GLYPH}
                        style={styles.incompleteGlyph}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                      />
                      <Image
                        source={PROFILE_INCOMPLETE_BADGE}
                        style={styles.incompleteBadge}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                      />
                    </View>

                    <View style={styles.incompleteText}>
                      <Text variant="title" color="textStrong">
                        {profile.incomplete.title}
                      </Text>
                      <Text variant="bodyLoose" color="textQuiet">
                        {profile.incomplete.message}
                      </Text>
                    </View>
                  </View>

                  {/* `222:1590` — 306 x 32, `#FFD600`, radius 16, Bold 16/24. */}
                  <Pressable
                    onPress={() => actions.onCompleteProfile?.()}
                    accessibilityRole="button"
                    accessibilityLabel={profile.incomplete.ctaLabel}
                    style={({ pressed }) => [styles.incompleteCta, pressed ? styles.pressed : null]}
                    testID="profile-incomplete-cta"
                  >
                    <Text variant="headingCtaTight" color="textOnAccent">
                      {profile.incomplete.ctaLabel}
                    </Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.grid}>
                {profile.tiles.map((tile) => (
                  <View key={tile.id} style={styles.gridCell}>
                    <Pressable
                      onPress={() => actions.onSelectTile(tile.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${tile.title}. ${tile.subtitle}`}
                      style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
                      testID={`profile-tile-${tile.id}`}
                    >
                      <Image
                        source={PROFILE_TILE_ART[tile.id] ?? PROFILE_AVATAR_GLYPH}
                        style={styles.tileArt}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                      />
                      <View style={styles.tileRow}>
                        {/* Two lines each. The tile is drawn 161 wide; at 320dp the 50% column
                            is ~136 and every label clipped ("My orde…", "View order hist…") on
                            the handset. `minHeight: 97` lets the tile grow instead. */}
                        <View style={styles.tileText}>
                          <Text variant="title" color="textStrong" numberOfLines={2}>
                            {tile.title}
                          </Text>
                          <Text variant="micro" color="textStrong" numberOfLines={2}>
                            {tile.subtitle}
                          </Text>
                        </View>
                        <Image
                          source={PROFILE_CHEVRON_GLYPH}
                          style={styles.tileChevron}
                          resizeMode="contain"
                          accessibilityIgnoresInvertColors
                        />
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>

              {/* `71:614` is a 354pt frame holding the 154pt panel at its BOTTOM — the legal card
                  is pinned to the foot of the screen, not stacked under the grid. */}
              <View style={styles.footerSpacer} />

              <View style={styles.footer} testID="profile-footer">
                {profile.links.map((link) => (
                  <Pressable
                    key={link.id}
                    onPress={() => actions.onOpenLink(link.id)}
                    accessibilityRole="link"
                    accessibilityLabel={link.title}
                    style={({ pressed }) => [styles.linkRow, pressed ? styles.pressed : null]}
                    testID={`profile-link-${link.id}`}
                  >
                    {link.icon === undefined ? null : (
                      <Icon name={link.icon} size={16} color="textPrimary" />
                    )}
                    <Text
                      variant={link.id === 'legal' ? 'noteBody' : 'bodyMedium'}
                      color="textPrimary"
                      style={styles.linkLabel}
                    >
                      {link.title}
                    </Text>
                    {/* `6:775` is an external-link arrow; `6:782` is a shield. */}
                    {link.trailingIcon === undefined ? null : (
                      <Icon name={link.trailingIcon} size={14} color="textPrimary" />
                    )}
                  </Pressable>
                ))}

                {/* `6:784` — the one confirmed destructive treatment in the design (defect D-9). */}
                <Pressable
                  onPress={actions.onLogout}
                  accessibilityRole="button"
                  accessibilityLabel={profile.logoutLabel}
                  style={({ pressed }) => [styles.logout, pressed ? styles.pressed : null]}
                  testID="profile-logout"
                >
                  <Icon name="logout" size={16} color="textLogout" />
                  <Text variant="bodyBold" color="textLogout" align="center">
                    {profile.logoutLabel}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

/** `69:423` — a 16pt gutter between the 161pt columns. */
const HALF_GAP = lightTheme.space.sm;

const styles = StyleSheet.create({
  /** `6:665` — Profile sits on `#F8FAFC`. */
  screen: { flex: 1, backgroundColor: lightTheme.colors.surfaceForm },
  /** `6:666` — 16pt padding, 24pt between the identity card, the grid and the footer. */
  body: {
    flexGrow: 1,
    padding: lightTheme.space.lg,
    paddingBottom: lightTheme.space.xl,
    gap: lightTheme.space.xl,
    backgroundColor: lightTheme.colors.surface,
  },
  /** Absorbs the slack so the footer sits at the foot of the viewport, as `71:614` draws it. */
  footerSpacer: { flexGrow: 1 },
  /** `6:667` — white, 1pt `#FFDE33`, 24pt radius, 15.889pt padding, 16pt gap. */
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.lg,
    padding: 15.889,
    borderRadius: lightTheme.radius.r24,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderCtaSoft,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  avatar: { width: 32, height: 32 },
  /** `6:671` — 3pt between the name and the contact line. */
  identityText: { flex: 1, minWidth: 0, gap: 3 },
  /* ---- `222:1570` profile-incomplete prompt ---- */
  /** 338 x 145, radius **15**, `0 0 4 rgba(0,0,0,0.07)` over a pre-composited `#FFFADB`. */
  incomplete: {
    borderRadius: 15,
    paddingTop: 15.889,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: lightTheme.colors.surfaceTileIdle,
    ...lightTheme.elevation.tile,
  },
  /** `222:1571` sits 13pt in, 12pt clear of the 241pt text column at x 72. */
  incompleteHead: { flexDirection: 'row', gap: 12 },
  /** A 47 x 32 box: the disc occupies the first 32, the badge the last 15. */
  incompleteMark: { width: 47, height: 32 },
  /** `222:1572` — the same flat `#FFE666` disc the banners draw, so it is drawn, not exported. */
  incompleteDisc: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
  },
  /** `222:1573` — 25pt, inset 4 / 3 inside the disc. */
  incompleteGlyph: { position: 'absolute', left: 4, top: 3, width: 25, height: 25 },
  /** `222:1582` — 15 x 32 at x 32.11. */
  incompleteBadge: { position: 'absolute', left: 32.11, top: 0.34, width: 15, height: 32 },
  /** `222:1575` — 3pt between the Bold 14/20 title and the Regular 12/16 line. */
  incompleteText: { flex: 1, minWidth: 0, gap: 3 },
  /** `222:1590` — 32pt tall at a 16pt radius, full width inside the panel's 16pt padding. */
  incompleteCta: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceCta,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -HALF_GAP },
  gridCell: { width: '50%', paddingHorizontal: HALF_GAP, paddingBottom: lightTheme.space.lg },
  /** `69:406` — `#FFF7CC`, 15pt radius, px 15.89 / pt 16 / pb 15.889, 7pt gap. */
  tile: {
    justifyContent: 'center',
    gap: 7,
    minHeight: 97,
    paddingHorizontal: 15.89,
    paddingTop: lightTheme.space.lg,
    paddingBottom: 15.889,
    borderRadius: lightTheme.radius.r15,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  tileArt: { width: 32, height: 32 },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
  tileText: { flex: 1, minWidth: 0 },
  /** `69:419` — a 32pt chevron. The export is already the rotated (right-pointing) mark. */
  tileChevron: { width: 32, height: 32 },
  /** `6:765` — `rgba(255,247,204,0.7)`, 24pt radius, 15.889pt padding, 8pt gap, lifted upwards. */
  footer: {
    gap: lightTheme.space.sm,
    padding: 15.889,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surfaceTileIdle,
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  /** `6:766` — 10pt padding at a 12pt radius. */
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    padding: lightTheme.space.s10,
    borderRadius: lightTheme.radius.r12,
  },
  linkLabel: { flex: 1, minWidth: 0 },
  /** `6:784` — `#FFF1F2`, centred, 6pt gap, 10pt padding at a 12pt radius. */
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s6,
    padding: lightTheme.space.s10,
    borderRadius: lightTheme.radius.r12,
    backgroundColor: lightTheme.colors.surfaceLogout,
  },
  pressed: { opacity: 0.85 },
});
