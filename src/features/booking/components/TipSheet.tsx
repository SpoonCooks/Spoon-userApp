import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { BottomSheet, Button, HelpPill, NoticeCard, Text, lightTheme } from '@ui';

import { tipCtaLabelFor } from '../adapters';
import type { TipSheetViewModel } from '../types';

/**
 * Tip Cook — Figma `306:2885` "Page 15- Tip pop out". NEW in the current file.
 *
 * It is a SHEET over Completion: `306:2984` is a 485pt panel reached from `308:3121`, the tip row
 * that replaced Completion's inline `143:294` tip card.
 *
 * Layout, verbatim:
 *   header  `306:2985` — px 4 / py 3, the 32pt back disc, the title, and the Help pill
 *   amounts `306:2994` — "Share an amount" (Livvic Bold 14/20) over FOUR 76 × 33 chips at an
 *                        8.5pt gutter (`306:3048` … `306:3054`)
 *   note    `306:3018` — the `208:553` notice block: a 32pt Trust mark beside two lines
 *   art     `308:3133` — a 303 × 175 "Cook thank you" band centred on a 330 × 175 `#FFF7CC` plate
 *                        (`308:3132`). The band is TRANSPARENT, so the plate reads through it —
 *                        the export is cropped to the node's window rather than the raw image.
 *   cta     `306:3042` — a 330 × 34 `#CFFF04` bar at r15 with a `0 0 2 rgba(0,0,0,0.15)` lift,
 *                        carrying the PRE-FORMATTED "Tip • ₹50"
 *
 * BOUNDARY: no payment is taken and no amount is computed. The options and the CTA label are
 * server strings; selecting one reports the choice upward (ruling R-1).
 */

/** `144:434` — the same Trust mark the extension notes use. */
const TIP_TRUST_ART =
  require('../../../../assets/figma/booking/note-shield.png') as ImageSourcePropType;

/** `308:3133` — the thank-you band. */
const TIP_ART = require('../../../../assets/figma/booking/tip-thanks.png') as ImageSourcePropType;

export interface TipSheetProps {
  readonly visible: boolean;
  readonly tip: TipSheetViewModel;
  readonly selectedOptionId: string | null;
  readonly onSelectOption: (id: string) => void;
  readonly onClose: () => void;
  /** Optional: without it the CTA is DISABLED, never live over a tip nothing would charge. */
  readonly onConfirm?: () => void;
  /** `POST /tips` is in flight. The CTA's own state; the sheet keeps its options (§7). */
  readonly submitting?: boolean;
  readonly onHelp?: () => void;
  readonly helpLabel?: string;
  readonly testID?: string;
}

export function TipSheet({
  visible,
  tip,
  selectedOptionId,
  onSelectOption,
  onClose,
  onConfirm,
  submitting = false,
  onHelp,
  helpLabel = 'Help',
  testID = 'tip-sheet',
}: TipSheetProps) {
  const selectedLabel = tip.options.find((option) => option.id === selectedOptionId)?.label ?? null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onBack={onClose}
      title={tip.title}
      headerVariant="screen"
      // `306:2986` — a 32pt disc, not the bare arrow the Instant/Extension sheets draw.
      backVariant="outlined"
      bodyStyle={styles.body}
      {...(onHelp === undefined
        ? {}
        : {
            headerAction: <HelpPill label={helpLabel} onPress={onHelp} testID={`${testID}-help`} />,
          })}
      testID={testID}
    >
      <View style={styles.amounts}>
        <Text variant="title" color="textPrimary" accessibilityRole="header">
          {tip.sectionTitle}
        </Text>

        <View
          style={styles.chips}
          accessibilityRole="radiogroup"
          accessibilityLabel={tip.sectionTitle}
        >
          {tip.options.map((option) => {
            const selected = selectedOptionId === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelectOption(option.id)}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected, checked: selected }}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.chip,
                  selected ? styles.chipSelected : styles.chipIdle,
                  pressed ? styles.pressed : null,
                ]}
                testID={`${testID}-option-${option.id}`}
              >
                <Text variant="title" color="textPrimary" align="center" numberOfLines={1}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <NoticeCard
        title={tip.note.title}
        body={tip.note.body}
        art={TIP_TRUST_ART}
        testID={`${testID}-note`}
      />

      {/* `306:3057` — the band sits on a `#FFEF99` plate, so a slow decode never shows a hole. */}
      <View style={styles.artPlate}>
        <Image
          source={TIP_ART}
          style={styles.art}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>

      {/* `306:3042` — `#CFFF04`, not the `#FFD600` primary bar. The lift is the node's own. */}
      {/*
        The label follows the SELECTION, not the preselection.

        `tip.ctaLabel` is composed once from the amount the sheet opens on, so rendering it
        verbatim left the button reading "Tip • ₹50" after the customer chose ₹20 — while pressing
        it charged ₹20. A button naming a price it will not take is worse than a wrong number.
        The fallback is the composed label, for the moment before anything is chosen.
      */}
      <Button
        label={selectedLabel === null ? tip.ctaLabel : tipCtaLabelFor(selectedLabel)}
        onPress={() => onConfirm?.()}
        variant="bright"
        size="bar"
        style={styles.cta}
        disabled={selectedOptionId === null || onConfirm === undefined}
        loading={submitting}
        testID={`${testID}-confirm`}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  /** `306:2993` / `306:3057` / `306:3041` — 16pt blocks, each already inset 4/6 by the frame. */
  body: {
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.lg,
    gap: lightTheme.space.lg,
  },
  /** `306:2994` — the heading 8pt above the chip row. */
  amounts: { gap: lightTheme.space.sm },
  /** `306:3047` — four chips at an 8.5pt gutter, sharing the row. */
  chips: { flexDirection: 'row', gap: 8.5 },
  /** `306:3048` — 76 × 33 at a 12pt radius. */
  chip: {
    flex: 1,
    minWidth: 0,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.radius.r12,
    borderWidth: lightTheme.stroke.thin,
  },
  chipIdle: {
    backgroundColor: lightTheme.colors.surfaceAccentStrong,
    borderColor: lightTheme.colors.surfaceAccentBold,
  },
  /** `143:303` — the selected chip is `#E2FF68` inside `#CFFF04`. */
  chipSelected: {
    backgroundColor: lightTheme.colors.surfaceEta,
    borderColor: lightTheme.colors.surfacePositiveBright,
  },
  /** `308:3132` — a 330 × 175 `#FFF7CC` plate at a 20pt radius. */
  artPlate: {
    alignSelf: 'stretch',
    height: 175,
    borderRadius: lightTheme.radius.r20,
    overflow: 'hidden',
    backgroundColor: lightTheme.colors.surfaceAccent,
    alignItems: 'center',
  },
  /** `308:3133` — 303 of the plate's 330, centred, so the plate frames it on both edges. */
  art: { width: `${(303 / 330) * 100}%`, height: '100%' },
  /** `306:3042` — the node's own `0 0 2 rgba(0,0,0,0.15)`; `bright` carries no lift of its own. */
  cta: lightTheme.elevation.soft,
  pressed: { opacity: 0.85 },
});
