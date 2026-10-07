import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { visitDemoModel } from '../../data/visit';
import type { VisitPendingData } from '../../data/visit';
import { VISIT_BELL_PENDING, VISIT_CHEVRON_18, VISIT_POOL_THREAD } from './assets';

/**
 * `Cook details` · Cook pending — Figma `1466:8280` (component `1466:797`).
 *
 * White, 1pt `#FFD600` edge, 16pt corners, p 16 with 16 between blocks: the bell note, the
 * "FROM YOUR COOK POOL" heading block, the pool "on a thread" (`1466:708`: three 64pt photos
 * strung on a yellow thread across a `#FFF7CC` panel) and the full-width "View Cook Pool" pill.
 */
export interface CookPendingCardProps {
  /** Defaults to the frame's. Pool cooks without a photo or match line leave them out. */
  readonly pending?: VisitPendingData;
  readonly onViewPool?: (() => void) | undefined;
  readonly testID?: string | undefined;
}

const DEMO = visitDemoModel('pending');

export function CookPendingCard({
  pending = DEMO.pending,
  onViewPool,
  testID = 'visit-cook-pending',
}: CookPendingCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.note}>
        <Image source={VISIT_BELL_PENDING} style={styles.bell} />
        <Text variant="spoonCaption" color="textSecondarySoft" style={styles.flex}>
          {pending.note}
        </Text>
      </View>

      <View style={styles.heading}>
        <Text variant="spoonMicroStrong" color="textSecondarySoft">
          {pending.eyebrow}
        </Text>
        <Text variant="spoonTitle" color="textPrimary">
          {pending.title}
        </Text>
        <Text variant="spoonCaption" color="textSecondarySoft">
          {pending.body}
        </Text>
      </View>

      {/* `1466:708` — the pool on a thread. */}
      <View style={styles.pool}>
        <Image source={VISIT_POOL_THREAD} style={styles.thread} />
        {pending.pool.map((cook) => (
          <View key={cook.id} style={styles.cook} testID={`${testID}-${cook.id}`}>
            <View style={styles.photoClip}>
              {cook.photo === undefined ? null : <Image source={cook.photo} style={styles.photo} />}
            </View>
            <Text variant="spoonCaptionStrong" color="textPrimary" align="center">
              {cook.name}
            </Text>
            {cook.match === undefined ? null : (
              <Text variant="spoonMicro" color="textSecondarySoft" align="center">
                {cook.match}
              </Text>
            )}
          </View>
        ))}
      </View>

      <Pressable
        onPress={onViewPool}
        accessibilityRole="button"
        style={styles.cta}
        testID={`${testID}-view-pool`}
      >
        <Text variant="spoonBodyStrong" color="textPrimary">
          {pending.cta}
        </Text>
        <Image source={VISIT_CHEVRON_18} style={styles.chevron} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: lightTheme.space.lg,
    padding: lightTheme.space.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderNotice,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surface,
  },
  flex: { flex: 1 },
  /** `1466:699` — bell and note, 8 apart. */
  note: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.sm },
  bell: { width: 20, height: 20 },
  heading: { gap: lightTheme.space.xs },
  /** `1466:708` — pt 16 / pb 12 / px 8 on `#FFF7CC`, 16pt corners. */
  pool: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.md,
    paddingHorizontal: lightTheme.space.sm,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceAccent,
    overflow: 'hidden',
  },
  /**
   * `1466:721` — the thread's 340×12.04 box sits at x 0, y 40; its stroke-inclusive export is
   * 344×16.04, so it hangs 2pt out on each side.
   */
  thread: { position: 'absolute', left: -2, top: 38, width: 344, height: 16.04 },
  cook: { flex: 1, alignItems: 'center', gap: lightTheme.space.xs },
  /** `1466:710` — a 64pt ellipse; the square render is clipped round. */
  photoClip: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden' },
  photo: { width: 64, height: 64 },
  /** `1466:722` — 44 tall, `#FFEF99`, pill, 4 gap. */
  cta: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.xs,
    paddingHorizontal: lightTheme.space.lg,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
  },
  chevron: { width: 18, height: 18 },
});
