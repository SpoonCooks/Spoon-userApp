import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QueryBoundary, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { HOW_IT_WORKS, LANDING_GLOWS, LANDING_HERO } from '../art';
import { CookPortrait } from '../components/CookPortrait';
import { useCookPool } from '../data';
import { emptyPlaces } from '../pool';
import type { CookPoolMember, CookPoolSummary } from '../types';

/**
 * Your Cook Pool — Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User): `901:17325` (new user) and
 * `901:17537` / `901:17606` (with cooks). Laid out to fit one screen; it scrolls only once the
 * pool grows a second row.
 *
 * Reached from Home and from the recurring landing; back returns to whichever it came from. The
 * pool grid shows the household's cooks in the backend's order, then empty places up to the
 * pool's minimum — always at least one, "Add", which opens the deck. A cook's photo opens their
 * profile. Every change made on the deck or a profile is saved as it happens, so the grid is
 * current whenever the screen shows.
 */
export interface CookPoolScreenProps {
  readonly onBack: () => void;
  readonly onAddCooks: () => void;
  readonly onOpenCook: (cookId: string) => void;
  readonly testID?: string;
}

export function CookPoolScreen({
  onBack,
  onAddCooks,
  onOpenCook,
  testID = 'cook-pool-screen',
}: CookPoolScreenProps) {
  const { state, refetch } = useCookPool();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.screen} testID={testID}>
      {/* `844:5843` — 402×411 of glows from the very top, behind the status bar and header. */}
      <Image
        source={LANDING_GLOWS}
        style={[styles.glows, { width, height: (width * GLOWS_HEIGHT) / GLOWS_WIDTH }]}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader
          density="nav"
          title="Your Cook Pool"
          onBack={onBack}
          transparent
          testID={`${testID}-header`}
        />
        <QueryBoundary state={state} onRetry={refetch}>
          {(pool) => (
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              alwaysBounceVertical={false}
            >
              <Image source={LANDING_HERO} style={styles.hero} resizeMode="contain" />
              {/* `844:5853` — 8 apart. */}
              <View style={styles.description}>
                <Text variant="headingSection" color="textPrimary">
                  Your favorite cooks, no surprises!
                </Text>
                <Text variant="bodyLarge" color="textPrimary">
                  Found a cook you love? Add them to your Cook Pool and relax while familiar cooks
                  prepare your favorite meals.
                </Text>
              </View>
              <PoolSection
                pool={pool}
                onAddCooks={onAddCooks}
                onOpenCook={onOpenCook}
                testID={`${testID}-pool`}
              />
              <HowItWorks />
            </ScrollView>
          )}
        </QueryBoundary>
      </SafeAreaView>
    </View>
  );
}

/**
 * "Your Cook Pool" over a 4-column grid, rows and columns 12 apart. Each place is a circle as wide
 * as its column with its caption under it: a cook standing on `#FFF7CC` (`719:1524`), or a dashed
 * "Add" place. The two frames space it differently and each is followed: a new household's
 * (`844:5856`) puts 8 under the title and under each circle, a pool with cooks (`719:1521`) 12.
 */
function PoolSection({
  pool,
  onAddCooks,
  onOpenCook,
  testID,
}: {
  readonly pool: CookPoolSummary;
  readonly onAddCooks: () => void;
  readonly onOpenCook: (cookId: string) => void;
  readonly testID: string;
}) {
  const { width } = useWindowDimensions();
  // The column's width — the circle is as wide as its column.
  const avatar = (width - lightTheme.space.lg * 2 - lightTheme.space.md * (COLUMNS - 1)) / COLUMNS;
  const places: (CookPoolMember | null)[] = [
    ...pool.members,
    ...Array.from({ length: emptyPlaces(pool.members.length, pool.minimumSize) }, () => null),
  ];
  const gap = pool.members.length === 0 ? styles.gapTight : styles.gapLoose;
  const rows: (CookPoolMember | null)[][] = [];
  for (let index = 0; index < places.length; index += COLUMNS) {
    rows.push(places.slice(index, index + COLUMNS));
  }

  return (
    <View style={gap}>
      <Text variant="headingSection" color="textPrimary">
        Your Cook Pool
      </Text>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {Array.from({ length: COLUMNS }, (_, column) => {
              const place = row[column];
              if (place === undefined) return <View key={`gap-${column}`} style={styles.cell} />;
              return place === null ? (
                <Pressable
                  key={`add-${rowIndex}-${column}`}
                  onPress={onAddCooks}
                  accessibilityRole="button"
                  accessibilityLabel="Add cooks to your Cook Pool"
                  style={[styles.cell, gap]}
                  testID={`${testID}-add`}
                >
                  <View style={[styles.circle, styles.placeholder]}>
                    <View style={styles.plusBar} />
                    <View style={[styles.plusBar, styles.plusBarVertical]} />
                  </View>
                  <Text variant="body" color="textPrimary" align="center">
                    Add
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  key={place.cookId}
                  onPress={() => onOpenCook(place.cookId)}
                  accessibilityRole="button"
                  accessibilityLabel={`${place.name}'s profile`}
                  style={[styles.cell, gap]}
                  testID={`${testID}-${place.cookId}`}
                >
                  <View style={[styles.circle, styles.avatar]}>
                    {place.photo === undefined ? null : (
                      <CookPortrait source={place.photo} size={avatar} />
                    )}
                  </View>
                  <Text variant="body" color="textPrimary" align="center" numberOfLines={1}>
                    {place.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

/** `844:5866` — the three steps, 8 apart: the flow art, then each step's title over its line. */
function HowItWorks() {
  const { width } = useWindowDimensions();
  // `844:5869` — the art is 370×94.92 drawn into an 83-tall box, overhanging it 1.76 % above.
  const artWidth = width - lightTheme.space.lg * 2;
  const scale = artWidth / FLOW_WIDTH;
  return (
    <View style={styles.gapTight}>
      <Text variant="headingSection" color="textPrimary">
        How it works?
      </Text>
      <View style={{ height: FLOW_BOX_HEIGHT * scale }}>
        <Image
          source={HOW_IT_WORKS}
          style={[
            styles.flowArt,
            {
              top: -FLOW_BOX_HEIGHT * FLOW_OVERHANG_TOP * scale,
              width: artWidth,
              height: FLOW_ART_HEIGHT * scale,
            },
          ]}
          resizeMode="stretch"
        />
      </View>
      <View style={styles.steps}>
        {STEPS.map((step) => (
          <View key={step.title} style={styles.step}>
            <Text variant="bodyLargeStrong" color="textPrimary" align="center">
              {step.title}
            </Text>
            <Text variant="body" color="textSubdued" align="center">
              {step.body}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** `844:5878` — the steps are how the feature works, not data: they ship with the app. */
const STEPS = [
  { title: 'Create Pool', body: 'Add your preferred cooks to the Pool' },
  { title: 'Assignment', body: 'Bookings prioritize cooks from your Pool' },
  { title: 'Manage anytime', body: 'See and edit your list anytime' },
] as const;

const COLUMNS = 4;
const FLOW_WIDTH = 370;
const FLOW_BOX_HEIGHT = 83;
const FLOW_ART_HEIGHT = 94.92;
const FLOW_OVERHANG_TOP = 0.0176;
const GLOWS_WIDTH = 402;
const GLOWS_HEIGHT = 411;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  glows: { position: 'absolute', top: 0, left: 0 },
  safe: { flex: 1 },
  /** `844:5850` — px 16, pb 16, nothing above the hero; 24 between blocks. */
  content: {
    paddingHorizontal: lightTheme.space.lg,
    paddingBottom: lightTheme.space.lg,
    gap: lightTheme.space.xl,
  },
  /** `844:5852` — 370×235. */
  hero: { width: '100%', height: undefined, aspectRatio: 370 / 235 },
  description: { gap: lightTheme.space.sm },
  gapTight: { gap: lightTheme.space.sm },
  gapLoose: { gap: lightTheme.space.md },
  grid: { gap: lightTheme.space.md },
  gridRow: { flexDirection: 'row', gap: lightTheme.space.md },
  /** A circle as wide as its column, its caption under it. */
  cell: { flex: 1 },
  circle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: lightTheme.radius.pill,
    overflow: 'hidden',
  },
  avatar: { backgroundColor: lightTheme.colors.surfaceAccent },
  /** `844:5859` — a 2pt dashed `#00000040` ring around a 24pt plus. */
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: lightTheme.colors.surfaceDisabledStrong,
  },
  /** `844:5860` — 16×2 and 2×16 bars at a 1pt radius. */
  plusBar: {
    position: 'absolute',
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: lightTheme.colors.textPrimary,
  },
  plusBarVertical: { width: 2, height: 16 },
  flowArt: { position: 'absolute', left: 0 },
  /** `844:5878` — three equal columns, 8 apart; 8 between each column's lines. */
  steps: { flexDirection: 'row', gap: lightTheme.space.sm },
  step: { flex: 1, alignItems: 'center', gap: lightTheme.space.sm },
});
