import { StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import {
  BOOKING_EXT_NOTE_TIMER_ART,
  BOOKING_EXT_NOTE_TRUST_ART,
  BottomSheet,
  Button,
  HelpPill,
  NoticeCard,
  PriceTile,
  Text,
  lightTheme,
} from '@ui';

import type { ExtensionViewModel } from '../types';

/**
 * Extension bottom sheet — Figma `3:2002`, opened from the In-service "Extend Time" CTA.
 *
 * Read off the frame:
 *   header    `143:317` — the SCREEN header, not the compact sheet header: a 45pt band with a
 *                         32pt back control, "Extend booking" in Livvic Black 20/28 and the Help
 *                         pill. No hairline.
 *   body      `143:326` — 16pt padding, 16pt between blocks
 *   duration  `143:372` — "Duration" in Livvic Bold 16/24 over a 3-up grid of the COMPACT price
 *                         tiles (`37:3771`: 107 × 52.09, 7.8pt padding, centred, Bold 10/15
 *                         price). Selected / idle / disabled are the three translucent fills.
 *   notes     `143:343` / `143:351` — the `#FFD600`-outlined NOTICE card with a 32pt exported
 *                         glyph, NOT the `#FFF7CC` note card. 57pt and 45pt tall respectively.
 *   fallback  `143:358` — an `#ECFF9B` 24pt-radius block: Livvic Bold 12/16 over Livvic Regular
 *                         11/16.5 at 80% black, then a 306 × 32 `#CFFF04` "Book NOW" pill at a
 *                         15pt radius.
 *   cta       `143:366` — a 338 × 34 `#FFD600` bar at a 15pt radius, Livvic Black 16/24. It is
 *                         the LAST ITEM IN THE SCROLL, not a pinned footer, so it is rendered
 *                         inside the body — the sheet scrolls, so it stays reachable.
 *
 * Boundary: extension options and their prices are server data, and the resulting new end time
 * comes from the server response — never from client arithmetic on the chosen extension, because
 * extension has billing consequences (FRONTEND_FOUNDATION_PLAN.md §19).
 */
export interface ExtensionSheetProps {
  readonly visible: boolean;
  readonly extension: ExtensionViewModel;
  readonly selectedOptionId: string | null;
  readonly onSelectOption: (id: string) => void;
  readonly onClose: () => void;
  readonly onExtend: () => void;
  readonly onBookAnother: () => void;
  /** `143:322` — the sheet draws the Help pill too. Unwired until B-10 names a destination. */
  readonly onHelp?: () => void;
  readonly helpLabel?: string;
}

/**
 * `144:434` / `144:433` — the two 32pt marks. Artwork is DESIGN, keyed by the note's stable id, so
 * a payload never carries an asset path.
 */
const NOTE_ART: Record<string, ImageSourcePropType> = {
  quality: BOOKING_EXT_NOTE_TRUST_ART,
  schedule: BOOKING_EXT_NOTE_TIMER_ART,
};

export function ExtensionSheet({
  visible,
  extension,
  selectedOptionId,
  onSelectOption,
  onClose,
  onExtend,
  onBookAnother,
  onHelp,
  helpLabel = 'Help',
}: ExtensionSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onBack={onClose}
      title={extension.title}
      headerVariant="screen"
      bodyStyle={styles.body}
      {...(onHelp === undefined
        ? {}
        : {
            headerAction: <HelpPill label={helpLabel} onPress={onHelp} testID="extension-help" />,
          })}
      testID="extension-sheet"
    >
      {/* `144:432` — label + grid, 12pt apart. */}
      <View style={styles.duration}>
        <Text variant="headingBold" color="textPrimary">
          {extension.sectionTitle}
        </Text>
        <View style={styles.options}>
          {extension.options.map((option) => (
            <View key={option.id} style={styles.option}>
              <PriceTile
                density="compact"
                label={option.label}
                price={option.price}
                selected={selectedOptionId === option.id}
                disabled={option.disabled ?? false}
                onPress={() => onSelectOption(option.id)}
                testID={`extension-option-${option.id}`}
              />
            </View>
          ))}
        </View>
      </View>

      {extension.notes.map((note) => (
        <NoticeCard
          key={note.id}
          title={note.title}
          body={note.body}
          // A note the design has no mark for still renders — dropping server copy is worse.
          art={NOTE_ART[note.id] ?? BOOKING_EXT_NOTE_TRUST_ART}
          testID={`extension-note-${note.id}`}
        />
      ))}

      {/* `143:358` — the "can't extend" fallback. */}
      <View style={styles.fallback} testID="extension-fallback">
        <View style={styles.fallbackText}>
          <Text variant="bodyBold" color="textPrimary" align="center">
            {extension.fallbackTitle}
          </Text>
          <Text variant="bodySmall" color="textSeparator" align="center">
            {extension.fallbackBody}
          </Text>
        </View>
        <Button
          label={extension.fallbackCtaLabel}
          onPress={onBookAnother}
          variant="bright"
          size="barSm"
          fullWidth
          testID="extension-book-another"
        />
      </View>

      <Button
        label={extension.ctaLabel}
        onPress={onExtend}
        variant="primary"
        size="bar"
        disabled={selectedOptionId === null}
        testID="extension-submit"
      />
    </BottomSheet>
  );
}

/** `143:372` — a 3-column grid at an 8pt gutter. */
const HALF_GAP = lightTheme.space.xs;

const styles = StyleSheet.create({
  /** `143:325` / `143:326` — 16pt padding, 16pt between blocks. */
  body: {
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.lg,
    gap: lightTheme.space.lg,
  },
  duration: { gap: lightTheme.space.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -HALF_GAP },
  option: { width: '33.33%', paddingHorizontal: HALF_GAP },
  /** `143:358` — `#ECFF9B`, 24pt radius, 15.889pt padding, 12pt gap. */
  fallback: {
    alignSelf: 'stretch',
    gap: lightTheme.space.md,
    padding: 15.889,
    borderRadius: lightTheme.radius.r24,
    backgroundColor: lightTheme.colors.surfacePositive,
  },
  /** `143:359` — a 44pt block; the two lines sit 22pt apart. */
  fallbackText: { alignSelf: 'stretch', gap: lightTheme.space.s6 },
});
