import { StyleSheet, View } from 'react-native';

import { DurationGuideTable } from '@ui/components/DurationGuideTable';
import type { DurationGuideRow } from '@ui/components/DurationGuideTable';
import { Text } from '@ui/primitives/Text';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { BottomSheet } from './BottomSheet';

/**
 * "Help me pick" — Figma `333:3643`, the NEW sheet raised from the Duration step (task §9).
 *
 * The trigger is the right-hand half of the Duration section's own label row — `333:3624` on
 * Scheduled (`34:3099`) and `381:287` on Instant — a text link at x 232 in a 330 row, which is
 * why it is passed to `SectionHeader` as an action rather than drawn as a button.
 *
 * The sheet itself is the `230:1925` screen-header treatment (a 32pt back control clear of a
 * Livvic Black 20/28 title, no hairline) over "How to choose a duration?" and the same
 * `135:93` table Home draws. Nothing here is interactive beyond dismissal: it ANSWERS the
 * question "how long should I book?", it does not choose a duration.
 *
 * The rows are static design content, supplied by the caller's data seam. They do not constrain
 * the durations the server offers, and choosing one is still done on the step underneath.
 */
/**
 * The sheet's content, as one value.
 *
 * Shared because the SAME link and the SAME table appear on the Duration step of both flows —
 * `333:3624` on Scheduled (`5c`/`5d`) and `348:4804` / `381:287` on Instant (`4a`..`4d`). Two
 * feature-local copies of this shape would be free to drift into two different sheets.
 */
export interface DurationHelpContent {
  /** The link label on the Duration label row, and the sheet's own title. */
  readonly label: string;
  readonly heading: string;
  readonly columns: readonly [string, string, string];
  readonly rows: readonly DurationGuideRow[];
}

export interface HelpMePickSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** `333:3625` — the sheet's own title. */
  readonly title: string;
  /** `135:80` — "How to choose a duration?". */
  readonly heading: string;
  readonly columns: readonly [string, string, string];
  readonly rows: readonly DurationGuideRow[];
  readonly testID?: string;
}

export function HelpMePickSheet({
  visible,
  onClose,
  title,
  heading,
  columns,
  rows,
  testID = 'help-me-pick-sheet',
}: HelpMePickSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onBack={onClose}
      title={title}
      headerVariant="screen"
      backVariant="outlined"
      testID={testID}
    >
      <View style={styles.body}>
        <Text variant="heading" color="textPrimary" align="center" accessibilityRole="header">
          {heading}
        </Text>
        <DurationGuideTable columns={columns} rows={rows} testID={`${testID}-table`} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  /** `333:3643` — the heading sits 12 above the table, both inside the sheet's own gutter. */
  body: { alignSelf: 'stretch', gap: lightTheme.space.md },
});
