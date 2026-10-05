import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { PLAY_ICON, REPLAY_ICON } from '../art';
import { EXPLAINER_COVERS, EXPLAINER_PROMPT, EXPLAINER_TITLE, EXPLAINER_WATCHED } from '../content';

/**
 * Explainer / Peek card — `970:5452`, and `970:5526` once the video has been watched: a black card
 * at a 16 radius, px 12 / py 8, the title in white over a yellow line ("Tap to watch!") on the
 * left and a 44pt yellow disc on the right. Watched, the line reads that it was, a third line
 * says what the video covers, and the disc carries a replay arrow instead of the play button.
 * The whole card opens the player.
 */
export interface ExplainerCardProps {
  readonly watched: boolean;
  readonly onPress: () => void;
  readonly testID?: string;
}

export function ExplainerCard({ watched, onPress, testID = 'explainer-card' }: ExplainerCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={watched ? 'Watch Recurring explainer again' : 'Watch Recurring explainer'}
      style={styles.card}
      testID={testID}
    >
      <View style={styles.copy}>
        <Text variant="headingSection" color="textInverse">
          {EXPLAINER_TITLE}
        </Text>
        <Text variant="bodyStrong" color="textBrand">
          {watched ? EXPLAINER_WATCHED : EXPLAINER_PROMPT}
        </Text>
        {watched ? (
          <Text variant="body" color="textInverse">
            {EXPLAINER_COVERS}
          </Text>
        ) : null}
      </View>
      <View style={styles.disc}>
        <Image source={watched ? REPLAY_ICON : PLAY_ICON} style={styles.glyph} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceInverse,
  },
  copy: { flex: 1, gap: lightTheme.space.xs },
  /** `970:5459` — 44pt, `#FFD600`, a 24pt glyph at its centre. */
  disc: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceBrand,
  },
  glyph: { width: 24, height: 24 },
});
