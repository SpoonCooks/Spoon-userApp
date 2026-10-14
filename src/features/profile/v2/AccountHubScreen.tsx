import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ACCOUNTS_ART } from '@ui/v2/accountsArt';
import { C, SHADOW_1, T, figmaGradient } from '@ui/v2/theme';

import type { PoolCardState } from './model';

export interface AccountHubModel {
  /** "Aarav"; null before a name is given. */
  readonly firstName: string | null;
  readonly phone: string;
  readonly profileComplete: boolean;
  /** The completed card's preference lines; empty draws the incomplete card's copy. */
  readonly foodSummary: readonly string[];
  readonly pool: PoolCardState;
  /** Up to three pool cooks' photos; null draws the cook's initials. */
  readonly poolFaces: readonly {
    readonly id: string;
    readonly photo: string | null;
    readonly initials: string;
  }[];
  readonly version: string;
}

export interface AccountHubScreenProps {
  readonly model: AccountHubModel;
  readonly onBack: () => void;
  readonly onFoodProfile: () => void;
  readonly onViewPool: () => void;
  readonly onAddCook: () => void;
  readonly onBook: () => void;
  readonly onBookings: () => void;
  readonly onAddresses: () => void;
  readonly onHelp: () => void;
  readonly onManageAccount: () => void;
}

/** `2202:4323` / `2202:4338` — both heroes carry the same gradient transform. */
const FOOD = figmaGradient([
  [0.7, 0.5, 0],
  [-0.5, 0.7, 0.4],
]);
const POOL = FOOD;
const TEST_ID = 'profile-screen';

/**
 * Labels the frame draws on one line. Android measures this face a hair narrower than it draws
 * it, so a pill or tag sized to its text wrapped its last word onto a line its height hides
 * ("View &", "Your") — `simple` breaking measures the line as it is drawn, and one line is the
 * frame's intent at every width.
 */
const ONE_LINE = { numberOfLines: 1, textBreakStrategy: 'simple' } as const;

/**
 * Account — Figma `2202:4311` (food profile complete: `2209:10932`; Cook Pool empty `2146:6962`
 * and new user `2146:6983`). Dev note `2084:2770`: the name and number come from the login and are
 * read-only; the food profile card resumes the profile while incomplete and reviews it once
 * complete; the Cook Pool card shows up to three pool cooks (no cook faces in the header); the
 * three tiles open My bookings, Saved addresses and the Help desk.
 */
export function AccountHubScreen({ model, ...actions }: AccountHubScreenProps) {
  const { top, bottom } = useSafeAreaInsets();
  const complete = model.profileComplete;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: bottom + 24 }}
      testID={TEST_ID}
    >
      <View style={[styles.header, { paddingTop: top + 16 }]} testID="profile-identity">
        <Pressable
          onPress={actions.onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={styles.back}
          testID="profile-back"
        >
          <Image source={ACCOUNTS_ART.chevronLeft} style={styles.icon24} />
        </Pressable>
        <View style={styles.identity}>
          <Text style={T.displayLarge} numberOfLines={1} accessibilityRole="header">
            {model.firstName === null ? 'Hi there' : `Hi, ${model.firstName}`}
          </Text>
          <Text style={[T.caption, styles.secondary]}>{model.phone}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <LinearGradient
          colors={['#FFE666', '#FFD600']}
          locations={[0, 0.8333]}
          start={FOOD.start}
          end={FOOD.end}
          style={styles.hero}
        >
          <Image source={ACCOUNTS_ART.decoFood} style={styles.decoFood} />
          <Tag label={complete ? 'Profile complete' : 'Almost there'} />
          <View style={styles.title}>
            <Text style={T.title}>My Food Profile</Text>
            <View style={styles.foodRow}>
              {complete && model.foodSummary.length > 0 ? (
                <View style={styles.foodText} testID="profile-food-summary">
                  {model.foodSummary.map((line) => (
                    <Text key={line} style={T.caption} numberOfLines={1}>
                      {line}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={[T.caption, styles.foodText, styles.foodBody]}>
                  Sharing your food preference helps us serve you better!
                </Text>
              )}
              <Pill
                label={complete ? 'View & edit' : 'Finish profile'}
                onPress={actions.onFoodProfile}
                tight
                testID="profile-completion-cta"
              />
            </View>
          </View>
        </LinearGradient>

        <PoolCard model={model} {...actions} />

        <View style={styles.tiles}>
          <Tile
            art={ACCOUNTS_ART.tileBookings}
            title="My bookings"
            onPress={actions.onBookings}
            testID="profile-tile-orders"
          />
          <Tile
            art={ACCOUNTS_ART.tileAddresses}
            title="Addresses"
            onPress={actions.onAddresses}
            testID="profile-tile-addresses"
          />
          <Tile
            art={ACCOUNTS_ART.tileHelp}
            title="Help desk"
            onPress={actions.onHelp}
            testID="profile-tile-help"
          />
        </View>

        <Pressable
          onPress={actions.onManageAccount}
          accessibilityRole="button"
          accessibilityLabel="Manage account"
          style={styles.manage}
          testID="profile-manage-account"
        >
          <View style={styles.manageWell}>
            <Image source={ACCOUNTS_ART.profile} style={styles.icon24} />
          </View>
          <Text style={[T.bodyStrong, styles.flex]}>Manage account</Text>
          <Image source={ACCOUNTS_ART.rowChevron} style={styles.icon28} />
        </Pressable>

        <Text style={[T.micro, styles.secondary, styles.center]} testID="profile-footer">
          {`Spoon · ${model.version} · Made with love in Bengaluru`}
        </Text>
      </View>
    </ScrollView>
  );
}

function PoolCard({
  model,
  onViewPool,
  onAddCook,
  onBook,
}: Pick<AccountHubScreenProps, 'model' | 'onViewPool' | 'onAddCook' | 'onBook'>) {
  const state = model.pool;
  if (state === 'pending') {
    // The card's own gradient and height, empty, until the pool and bookings have answered.
    return (
      <LinearGradient
        colors={['#ECFF9B', '#CFFF04']}
        locations={[0, 0.8333]}
        start={POOL.start}
        end={POOL.end}
        style={[styles.hero, styles.poolPending]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="profile-pool-pending"
      />
    );
  }
  const copy =
    state === 'pool'
      ? {
          tag: 'Your favourites',
          title: 'My Cook Pool',
          body: 'Add your preferred cooks to the Pool and relax while familiar cooks prepare your favorite meals',
          cta: 'View my Pool',
          onCta: onViewPool,
        }
      : state === 'empty'
        ? {
            tag: 'Get started',
            title: 'Make your Cook Pool',
            body: 'Loved a cook? Add them to your Pool and they’ll be first in line to cook for you again.',
            cta: 'Add cooks',
            onCta: onAddCook,
          }
        : {
            tag: 'New to Spoon',
            title: 'Build your Cook Pool',
            body: 'Book your first meal, meet your cook, and add the ones you love to your Pool.',
            cta: 'Book a cook',
            onCta: onBook,
          };
  const invite = state !== 'pool';
  return (
    <LinearGradient
      colors={['#ECFF9B', '#CFFF04']}
      locations={[0, 0.8333]}
      start={POOL.start}
      end={POOL.end}
      style={styles.hero}
      testID={`profile-pool-${state}`}
    >
      <Image source={ACCOUNTS_ART.decoPool} style={styles.decoPool} />
      <Tag label={copy.tag} />
      <View style={styles.title}>
        <Text style={invite ? styles.display : T.title}>{copy.title}</Text>
        <Text style={T.caption}>{copy.body}</Text>
      </View>
      <View style={styles.poolBottom}>
        <View style={styles.faces}>
          {invite ? (
            <View style={[styles.faceRow, state === 'empty' && styles.overlapPlus]}>
              {[ACCOUNTS_ART.poolSlot1, ACCOUNTS_ART.poolSlot2, ACCOUNTS_ART.poolSlot3].map(
                (slot, index) => (
                  <Image
                    key={String(index)}
                    source={slot}
                    style={[styles.face, index < 2 && styles.overlap]}
                  />
                ),
              )}
            </View>
          ) : model.poolFaces.length === 0 ? null : (
            <View style={[styles.faceRow, styles.overlapPlus]}>
              {model.poolFaces.map((face, index) =>
                face.photo === null ? (
                  <View
                    key={face.id}
                    style={[
                      styles.face,
                      styles.faceInitials,
                      index < model.poolFaces.length - 1 && styles.overlap,
                    ]}
                  >
                    <Text style={T.captionStrong}>{face.initials}</Text>
                  </View>
                ) : (
                  <Image
                    key={face.id}
                    source={{ uri: face.photo }}
                    style={[
                      styles.face,
                      styles.facePhoto,
                      index < model.poolFaces.length - 1 && styles.overlap,
                    ]}
                  />
                ),
              )}
            </View>
          )}
          {state === 'new' ? null : (
            <Pressable
              onPress={onAddCook}
              accessibilityRole="button"
              accessibilityLabel="Add a cook to your Pool"
              hitSlop={6}
              testID="profile-pool-add"
            >
              <Image source={ACCOUNTS_ART.poolPlus} style={styles.plus} />
            </Pressable>
          )}
        </View>
        <Pill label={copy.cta} onPress={copy.onCta} small={invite} testID="profile-pool-cta" />
      </View>
    </LinearGradient>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Image source={ACCOUNTS_ART.tagSparkle} style={styles.tagSparkle} />
      <Text style={T.microStrong} {...ONE_LINE}>
        {label}
      </Text>
    </View>
  );
}

function Pill({
  label,
  onPress,
  small = false,
  tight = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  small?: boolean;
  /** The food profile's pill: 12pt each side (`2202:4311`), where the pool's leads with 16. */
  tight?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.pill, small ? styles.pillSmall : styles.pillLarge, tight && styles.pillTight]}
      testID={testID}
    >
      <Text style={small ? T.captionStrong : T.button} {...ONE_LINE}>
        {label}
      </Text>
      <Image source={ACCOUNTS_ART.pillChevron} style={styles.pillChevron} />
    </Pressable>
  );
}

function Tile({
  art,
  title,
  onPress,
  testID,
}: {
  art: (typeof ACCOUNTS_ART)[keyof typeof ACCOUNTS_ART];
  title: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.tile, SHADOW_1]}
      testID={testID}
    >
      <Image source={art} style={styles.tileArt} />
      {/* A third of a narrow phone is less than Figma's 115pt tile: the label shrinks a step
          rather than truncating ("My bookin…"). */}
      <Text style={T.bodyStrong} {...ONE_LINE} adjustsFontSizeToFit minimumFontScale={0.8}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.base },
  flex: { flex: 1 },
  secondary: { color: C.textSecondary },
  center: { textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  identity: { flex: 1, gap: 4 },
  body: { marginTop: 26, paddingHorizontal: 16, gap: 16 },
  hero: { borderRadius: 24, padding: 16, gap: 16, overflow: 'hidden' },
  decoFood: { position: 'absolute', right: -22, top: -40, width: 160, height: 160 },
  decoPool: { position: 'absolute', right: -40, top: -30, width: 160, height: 160 },
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: C.base,
  },
  tagSparkle: { width: 8, height: 8 },
  title: { gap: 4 },
  display: { fontFamily: T.title.fontFamily, fontSize: 24, lineHeight: 32, color: C.text },
  foodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  foodText: { flexShrink: 1, maxWidth: 190 },
  foodBody: { width: 164 },
  pill: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: C.base,
  },
  pillLarge: { paddingLeft: 16, paddingRight: 12, paddingVertical: 8 },
  pillSmall: { paddingLeft: 16, paddingRight: 12, paddingVertical: 12 },
  pillTight: { paddingLeft: 12 },
  pillChevron: { width: 6, height: 10 },
  poolBottom: { flexDirection: 'row', alignItems: 'center' },
  faces: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  faceRow: { flexDirection: 'row' },
  overlapPlus: { marginRight: -12 },
  face: { width: 40, height: 40, borderRadius: 20 },
  overlap: { marginRight: -12 },
  /** `2202:4338` — the pool cooks' 40pt photos carry no outline. */
  facePhoto: { backgroundColor: C.subtle },
  /** `2202:4338` is 198 tall; the empty shell holds that space while the pool loads. */
  poolPending: { height: 198 },
  faceInitials: {
    borderWidth: 1.5,
    borderColor: C.base,
    backgroundColor: C.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { width: 38, height: 38, margin: -3 },
  tiles: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  tile: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.base,
  },
  tileArt: { width: 44, height: 44 },
  manage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.base,
  },
  manageWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon24: { width: 24, height: 24 },
  icon28: { width: 28, height: 28 },
});
