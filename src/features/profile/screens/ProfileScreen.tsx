import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import {
  ListRow,
  PROFILE_AVATAR_GLYPH,
  PROFILE_CHEVRON_GLYPH,
  PROFILE_TILE_ART,
  QueryBoundary,
  ScreenHeader,
  Text,
  lightTheme,
} from '@ui';

import { innerShadows } from '@ui/tokens/primitives';

import { ProfileCompletionCard } from '../components/ProfileCompletionCard';
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
 *   footer    `6:765`  — V9 redraws this panel: the legal-links row is GONE, replaced by a
 *                        bordered "Manage account" row (folder mark, trailing chevron) above the
 *                        `#FFF1F2` Log Out row in Livvic Bold 12/16 `#C70036`. No Figma frame id
 *                        is available for the new row in this pass — geometry is a best-effort
 *                        read of the supplied mock, not a verified export.
 *
 * Ruling R-1: there is deliberately NO "Payment methods" tile — payment opens Razorpay directly,
 * so the app has no payment-management surface. Nothing is added beyond what the frame draws.
 * Ruling R-6 is SUPERSEDED for V9: Terms & Privacy no longer live here — "Manage account" opens
 * `@features/account`, which now carries both documents plus Delete Account.
 *
 * Logout clears SecureStore, the query cache and session status — all three are wired in
 * `@core/auth` + `@core/runtime`; this screen only raises the intent.
 * TODO(product B-10): the Help tile has no destination anywhere in the file.
 */
export interface ProfileActions {
  readonly onBack: () => void;
  readonly onSelectTile: (tileId: string) => void;
  /**
   * `222:1590` / `456:3479` — Complete profile / View profile. ONE destination for both, per the
   * founder's ruling: the same `338:4508` page, blank on the first visit and prefilled after.
   */
  readonly onOpenProfileDetails: () => void;
  /** Opens `@features/account` — Terms of Service, Privacy Policy, Delete Account. */
  readonly onOpenManageAccount: () => void;
  readonly onLogout: () => void;
}

export interface ProfileViewProps extends ProfileActions {
  readonly state: DataState<ProfileViewModel>;
  readonly onRetry: () => void;
}

export function ProfileView({ state, onRetry, ...actions }: ProfileViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID="profile-screen">
      {/*
        LOADING AUDIT (task §13 / §25). This boundary used to render `IntroLoading` — the branded
        `71:747` interstitial — which made every Home -> Profile step look like a second app
        launch. The founder's rule is that the ONE full-screen loading surface belongs to the app
        opening and nowhere else, so the fallback is now the token layer's scoped state.
      */}
      <QueryBoundary state={state} onRetry={onRetry} loadingVariant="screen">
        {(profile) => (
          <>
            {/* `257:3504` — 338 × 38, px 4 / py 6, no underline: the same geometry the shared
                `63:783` header now carries, so it needs no density override.

                It is drawn at x 16 / y 16 INSIDE `6:664`'s gutter column, like every other
                instance of the component. It used to render flush against the safe area, which
                put the back disc 20pt left of where the frame draws it and closed the 16pt lead
                above it to nothing. The header sits outside the ScrollView (it does not scroll),
                so the column's padding is applied here rather than on the body. */}
            <View style={styles.headerColumn}>
              <ScreenHeader title={profile.title} onBack={actions.onBack} />
            </View>

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

              {/* `222:1570` / `456:3467` — the completion card, at y 79 between the identity
                  card and the tile grid. Reinstated for V8; see `ProfileCompletionCard`. */}
              <ProfileCompletionCard
                complete={profile.profileComplete}
                onPress={actions.onOpenProfileDetails}
              />

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
                          <Text variant="title" color="textPrimary" numberOfLines={2}>
                            {tile.title}
                          </Text>
                          <Text variant="micro" color="textPrimary" numberOfLines={2}>
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

              <View style={styles.footer} testID="profile-footer">
                {/* V9 — replaces the legal-links row. Opens `@features/account`, which now hosts
                    Terms of Service, Privacy Policy and Delete Account (superseded Ruling R-6).
                    Sits directly under the grid, NOT pinned to the foot — only Log Out is. */}
                <View style={styles.manageAccountRow}>
                  <ListRow
                    title={profile.manageAccountLabel}
                    icon="folder"
                    onPress={actions.onOpenManageAccount}
                    testID="profile-manage-account"
                  />
                </View>

                {/* `71:614` is a 354pt frame holding the panel at its BOTTOM — Log Out is pinned
                    to the foot of the screen, clear of "Manage account" above it, not stacked
                    directly under it. */}
                <View style={styles.footerSpacer} />

                {/* `6:784` — the one confirmed destructive treatment in the design (defect D-9). */}
                <Pressable
                  onPress={actions.onLogout}
                  accessibilityRole="button"
                  accessibilityLabel={profile.logoutLabel}
                  style={({ pressed }) => [styles.logout, pressed ? styles.pressed : null]}
                  testID="profile-logout"
                >
                  {/* `6:789` — Livvic SemiBold 13/16 at `#FF0404`. The frame draws no glyph. */}
                  <Text variant="profileLogout" color="textLogout" align="center">
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
  /** `6:664` — the 16pt gutter column the header is drawn inside, 16pt down from the top. */
  headerColumn: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `6:666` — 16pt padding, 24pt between the identity card, the grid and the footer. */
  body: {
    flexGrow: 1,
    padding: lightTheme.space.lg,
    paddingBottom: lightTheme.space.xl,
    gap: lightTheme.space.xl,
    backgroundColor: lightTheme.colors.surface,
  },
  /**
   * Absorbs the slack so Log Out sits at the foot of the viewport, as `71:614` draws it — the
   * spacer lives INSIDE `footer`, between the two controls, not above "Manage account".
   */
  footerSpacer: { flexGrow: 1 },
  /** `6:667` — white, 1pt `#FFDE33`, 24pt radius, 15.889pt padding, 16pt gap. */
  /** `6:667` — radius **20**, a 12pt gap, 1pt `#FFDE33`, `0 1 0 rgba(0,0,0,0.05)`. */
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: 15.889,
    borderRadius: 20,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderCtaSoft,
    backgroundColor: lightTheme.colors.surface,
    ...lightTheme.elevation.badge,
  },
  /**
   * Circle-clipped for the same reason `ProfileCompletionCard` clips it: the export is flattened
   * onto WHITE, so its corners are opaque `#FFFFFF`. They are invisible here — `6:667` is a white
   * card — but the clip means the asset no longer depends on its ground being white to look right.
   */
  avatar: { width: 32, height: 32, borderRadius: 16 },
  /** `6:671` — 3pt between the name and the contact line. */
  identityText: { flex: 1, minWidth: 0, gap: 3 },
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
    /** `69:406` — an INSET `0 0 2 rgba(0,0,0,0.1)`, which the tile was rendering without. */
    boxShadow: innerShadows.profileTile,
  },
  tileArt: { width: 32, height: 32 },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xs },
  tileText: { flex: 1, minWidth: 0 },
  /** `69:419` — a 32pt chevron. The export is already the rotated (right-pointing) mark. */
  tileChevron: { width: 32, height: 32 },
  /**
   * V9 — the tinted, lifted `6:765` panel is gone; Manage account and Log Out now sit directly on
   * the screen's own surface as two standalone controls. Best-effort read of the supplied mock.
   *
   * `flex: 1` so `footerSpacer` (below) has slack to absorb — without it the spacer's own
   * `flexGrow: 1` has nothing to grow INTO, since `footer` itself would size to its content.
   */
  footer: { flex: 1, gap: lightTheme.space.md },
  /** Bordered like the identity card (`6:667`'s `#FFDE33` edge), no Figma frame id for this row. */
  manageAccountRow: {
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderCtaSoft,
    borderRadius: lightTheme.radius.r20,
    paddingHorizontal: lightTheme.space.md,
    backgroundColor: lightTheme.colors.surface,
  },
  /**
   * `6:784` — `#FFF1F2` at a 20pt radius. V8 drew this as a tight 25pt bar with NO vertical
   * padding; the V9 mock draws a taller, properly-padded pill instead (closer in weight to
   * "Manage account" above it), so the fixed 25pt height is retired in favour of real padding.
   */
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.s6,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.md,
    borderRadius: 20,
    backgroundColor: lightTheme.colors.surfaceLogout,
  },
  pressed: { opacity: 0.85 },
});
