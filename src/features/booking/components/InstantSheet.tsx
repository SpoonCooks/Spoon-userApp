import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { BottomSheet, Button, InfoDialog, PriceTile, Text, lightTheme } from '@ui';

import type { InstantViewModel } from '../types';

/**
 * Instant booking bottom sheet — Figma `1:729` (available, inside `1:728`), `25:1585` (taxes
 * dialog over the sheet), `25:1488` (out of shift) and `44:5539` (no slots).
 *
 * The two "4c" frames are STATES of this one sheet, not separate screens. Read off the nodes:
 *
 *  - the lead line changes from "Arriving in [18 mins]" to a single word ("Schedule");
 *  - a **white 45% scrim** (`44:5632` — a plain `fill-opacity="0.45"` rect, NOT a blur) covers
 *    the header, lead and grid, stopping ABOVE the CTA, which stays fully saturated;
 *  - a centred illustration and a Livvic Bold 18/28 message sit over the scrim;
 *  - the CTA becomes "Schedule" — yellow on `25:1562`, lime on `44:5611`.
 *
 * The previous implementation dimmed the grid to 35% opacity and drew a Feather glyph, and noted
 * blur as an unimplementable deviation. There is no blur in the file to implement; the scrim is
 * a flat white fill, so the state is now exact.
 *
 * Boundary:
 *  - durations, prices, badges and disabled flags are all server data;
 *  - the CTA label arrives pre-formatted with its amount;
 *  - `onBook` does NOT take payment. Payment opens Razorpay checkout (ruling R-1) and is not
 *    integrated in this phase; the callback is the seam.
 */

/** `22:1151` — the 25 × 33 bolt in the sheet header. */
const SHEET_BOLT =
  require('../../../../assets/figma/icons/lightning-bolt.png') as ImageSourcePropType;

/** `25:1848` / `44:5634` — the blocked-state illustrations, at their Figma boxes. */
const UNAVAILABLE_ART: Record<
  string,
  { source: ImageSourcePropType; width: number; height: number }
> = {
  moon: {
    source:
      require('../../../../assets/figma/instant/unavailable-out-of-shift.png') as ImageSourcePropType,
    width: 109,
    height: 80,
  },
  calendar: {
    source:
      require('../../../../assets/figma/instant/unavailable-no-slots.png') as ImageSourcePropType,
    width: 96,
    height: 78,
  },
};

export interface InstantSheetProps {
  readonly visible: boolean;
  readonly instant: InstantViewModel;
  readonly selectedDurationId: string | null;
  readonly onSelectDuration: (id: string) => void;
  readonly onClose: () => void;
  readonly onBook: () => void;
  readonly onSchedule: () => void;
  readonly testID?: string;
}

export function InstantSheet({
  visible,
  instant,
  selectedDurationId,
  onSelectDuration,
  onClose,
  onBook,
  onSchedule,
  testID = 'instant-sheet',
}: InstantSheetProps) {
  const [taxesOpen, setTaxesOpen] = useState(false);
  const blocked = instant.unavailable;
  const art = blocked === undefined ? undefined : UNAVAILABLE_ART[blocked.icon];

  const footer =
    blocked === undefined ? (
      <>
        <Button
          label={instant.ctaLabel}
          onPress={onBook}
          variant="primary"
          size="bar"
          testID={`${testID}-book`}
        />
        {/* `25:1325` — Livvic Regular 9/13.5, underlined, centred. Not a button in the frame. */}
        <Pressable
          onPress={() => setTaxesOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={instant.paymentDetailsLabel}
          hitSlop={16}
          style={styles.paymentDetails}
          testID={`${testID}-payment-details`}
        >
          <Text variant="micro" color="textPrimary" align="center" style={styles.underline}>
            {instant.paymentDetailsLabel}
          </Text>
        </Pressable>
      </>
    ) : (
      <Button
        label={blocked.ctaLabel}
        onPress={onSchedule}
        variant={blocked.ctaTone}
        size="bar"
        testID={`${testID}-schedule`}
      />
    );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={instant.title}
      onBack={onClose}
      headerGlyph={
        <Image
          source={SHEET_BOLT}
          style={styles.headerBolt}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      }
      footer={footer}
      footerStyle={styles.footer}
      bodyStyle={styles.body}
      testID={testID}
      {...(blocked === undefined
        ? {}
        : {
            overlay: (
              <View style={styles.blockedLayer} testID={`${testID}-unavailable`} accessible>
                <View style={styles.blockedScrim} />
                <View style={styles.blockedMessage}>
                  {art === undefined ? null : (
                    <Image
                      source={art.source}
                      style={[styles.blockedArt, { width: art.width, height: art.height }]}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors
                    />
                  )}
                  <Text variant="titleLead" color="textPrimary" align="center">
                    {blocked.message}
                  </Text>
                </View>
              </View>
            ),
          })}
      {...(taxesOpen && blocked === undefined
        ? {
            dialog: (
              <InfoDialog
                visible
                presentation="inline"
                onClose={() => setTaxesOpen(false)}
                title={instant.taxesInfo.title}
                body={instant.taxesInfo.body}
              />
            ),
            onDialogClose: () => setTaxesOpen(false),
          }
        : {})}
    >
      <View
        style={styles.content}
        testID={`${testID}-content`}
        accessibilityElementsHidden={blocked !== undefined}
        importantForAccessibility={blocked === undefined ? 'yes' : 'no-hide-descendants'}
      >
        {/* `1:751` — "Arriving in" + a canary pill. The blocked frames collapse this to one word. */}
        <View style={styles.etaRow}>
          <Text variant="titleLead" color="textPrimary" numberOfLines={1} style={styles.shrink}>
            {instant.etaCaption}
          </Text>
          {blocked === undefined ? (
            <View style={styles.etaPill} testID={`${testID}-eta`}>
              <Text variant="headingScreen" color="textStrong" align="center" numberOfLines={1}>
                {instant.etaLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.grid} testID={`${testID}-grid`}>
          {instant.durations.map((duration) => (
            <View key={duration.id} style={styles.cell}>
              <PriceTile
                label={duration.label}
                price={duration.price}
                {...(duration.strikePrice === undefined
                  ? {}
                  : { strikePrice: duration.strikePrice })}
                {...(duration.badge === undefined ? {} : { badge: duration.badge })}
                density="wide"
                selected={selectedDurationId === duration.id}
                disabled={blocked !== undefined || (duration.disabled ?? false)}
                {...(blocked === undefined ? { onPress: () => onSelectDuration(duration.id) } : {})}
                testID={`${testID}-duration-${duration.id}`}
              />
            </View>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

/**
 * `1:757` — the grid's COLUMN gutter is 8. Its rows are not: the tracks are 69.6 tall at an 8pt
 * row gap while the tiles are 67.6 and `self-start`, so the drawn gap between two rows is **10**,
 * and the slack below the last row (2) plus the grid's own `pb-16` leaves **18** under it.
 * Rendering both gaps as 8 is what made the grid read ~6pt short of the frame.
 */
const GRID_COLUMN_GAP = lightTheme.space.sm;
const GRID_ROW_GAP = lightTheme.space.s10;
const GRID_TAIL = 8;

/** `1:821` sits 29pt below the grid box; `25:1325` sits 4.4pt below the CTA. */
const CTA_GAP = 29;
const CAPTION_GAP = 4.4;

const styles = StyleSheet.create({
  content: { gap: 29 },
  headerBolt: { width: 25, height: 33 },
  shrink: { flexShrink: 1 },
  /** `1:750` — the CTA is pinned, so the body's own `pb-16` (which follows it) does not apply. */
  body: { paddingBottom: 0 },
  footer: { paddingTop: CTA_GAP, gap: CAPTION_GAP },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  /** `1:754` — `#E2FF68`, px 8 / py 2, 8pt radius, a FIXED 109 wide over a 93pt centred label. */
  etaPill: {
    width: 109,
    paddingHorizontal: lightTheme.space.sm,
    paddingVertical: lightTheme.space.xxs,
    borderRadius: lightTheme.layout.etaPillRadius,
    backgroundColor: lightTheme.colors.surfaceEta,
    flexShrink: 0,
  },
  /**
   * Two tracks at the designed gutters. Expressed as half-gutter cell padding against a negative
   * container margin, because a `50%` basis plus a real `gap` overflows the row and wraps to one
   * tile per line. No `screenWidth / 390` factor is involved — the tracks are percentages of
   * whatever column the sheet actually has, which is what `grid-cols-[repeat(2,minmax(0,1fr))]`
   * says on the node.
   */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -GRID_COLUMN_GAP / 2,
    paddingBottom: GRID_TAIL,
  },
  cell: {
    width: '50%',
    paddingHorizontal: GRID_COLUMN_GAP / 2,
    paddingBottom: GRID_ROW_GAP,
  },
  /** `44:5632` — a flat white 45% scrim, stopping above the CTA. */
  blockedLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
  },
  blockedScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  blockedMessage: { alignItems: 'center', gap: 3, paddingHorizontal: lightTheme.space.lg },
  /** `44:5634` carries a `0 0 10 rgba(0,0,0,0.15)` glow. */
  blockedArt: {
    shadowColor: lightTheme.colors.textPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  underline: { textDecorationLine: 'underline' },
  paymentDetails: { alignSelf: 'center' },
});
