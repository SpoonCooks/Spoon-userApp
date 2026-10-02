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
 * Your Cook Pool — Figma `cCQlzTeiObQkpVBzwI8mZi` (Spoon — User): `844:5842` (new user),
 * `719:1507` (with cooks) and `848:7605` (after a change).
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
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <Image source={LANDING_HERO} style={styles.hero} resizeMode="contain" />
              {/* `844:5853` — 8 apart. */}
              <View style={styles.description}>
                <Text variant="headingSection" color="textPrimary">
                  Your favorite cooks, no surprises!
                </Text>
                <Text variant="bodyLarge" color="textPrimary">
                  Found a cook you love? Add them to your Cook Pool. Next time you book, we&apos;ll
                  try your preferred cooks first, so you can relax while amazing, homely food gets
                  cooked.
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
 * `844:5856` — "Your Cook Pool" over a 4-column grid, 12 apart both ways. Each place is an 83pt
 * circle with its caption 12 below: a cook's photo, contained, on `#FFF7CC`
 * (`719:1524`), or a dashed "Add" place.
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
  const rows: (CookPoolMember | null)[][] = [];
  for (let index = 0; index < places.length; index += COLUMNS) {
    rows.push(places.slice(index, index + COLUMNS));
  }

  return (
    <View style={styles.section}>
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
                  style={styles.cell}
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
                  style={styles.cell}
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

/** `844:5866` — the three steps: the flow art, then a 3-column caption under each icon. */
function HowItWorks() {
  const { width } = useWindowDimensions();
  // `844:5869` — the art is 370×94.92 drawn into an 83-tall box, overhanging it 1.76 % above.
  const artWidth = width - lightTheme.space.lg * 2;
  const scale = artWidth / FLOW_WIDTH;
  return (
    <View style={styles.section}>
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
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <Text variant="caption" color="textSubdued" style={styles.stepNumber}>
              STEP {index + 1}
            </Text>
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
  /** `844:5850` — p 16, 24 between blocks. */
  content: { padding: lightTheme.space.lg, gap: lightTheme.space.xl },
  /** `844:5852` — 370×235. */
  hero: { width: '100%', height: undefined, aspectRatio: 370 / 235 },
  description: { gap: lightTheme.space.sm },
  section: { gap: lightTheme.space.md },
  grid: { gap: lightTheme.space.md },
  gridRow: { flexDirection: 'row', gap: lightTheme.space.md },
  /** A circle as wide as its column, the caption 12 under it (`844:5863`). */
  cell: { flex: 1, gap: lightTheme.space.md },
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
  /** `844:5880` — Regular 10/14. */
  stepNumber: { lineHeight: 14 },
});
