import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import {
  BottomSheet,
  Button,
  HelpMePickSheet,
  InfoDialog,
  PriceTile,
  SectionHeader,
  Text,
  lightTheme,
} from '@ui';

import type { InstantViewModel } from '../types';

/**
 * Instant booking bottom sheet — Figma `IT5DnVMAO750PzuYaC2rxo`.
 *
 * The sheet node was re-authored in the current file: `1:729` is gone and the sheet is now
 * `267:3532`, still inside `1:728` ("Page 4a- Instant- available"), which itself moved under the
 * `267:3520` "Instant booking" flow board. The states keep their frames — `25:1585` (taxes dialog
 * over the sheet), `25:1327` (out of shift) and `44:5378` (no slots) — and each now hosts its own
 * re-authored sheet (`267:3612`, `267:3692`, `47:6615`).
 *
 * Geometry re-read off `267:3532` this pass; see the constants below for the four values that
 * moved.
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
  /**
   * The HOST's half of the CTA gate — the part the sheet cannot see.
   *
   * The sheet owns the DURATION choice. It cannot own whether the account has a bookable address
   * or whether the server has priced this exact duration, and "Book NOW • ₹198" must never be
   * live while the amount behind it does not exist (task §E). Until the route says yes, the bar
   * stays in `275:4690`'s grey state.
   *
   * Defaults to `true` so the two blocked frames and the visual QA deep links are unaffected.
   */
  readonly canBook?: boolean;
  /**
   * `POST /v1/bookings` (and the checkout that follows) is in flight.
   *
   * The CTA's OWN state, and the sheet stays exactly as it is behind it: the durations, the price
   * and the taxes line are what the customer is buying, and replacing them with a full-screen
   * loader would hide the thing being paid for (task §7, §18). It is also the double-submission
   * guard for the one control in the app that creates a chargeable booking.
   */
  readonly submitting?: boolean;
  readonly onSchedule: () => void;
  /**
   * DEV reachability only — opens `25:1585` (the taxes dialog) with the sheet, so that finalized
   * state can be deep-linked instead of requiring a tap. Never set from product code.
   */
  readonly initialTaxesOpen?: boolean;
  readonly testID?: string;
}

export function InstantSheet({
  visible,
  instant,
  selectedDurationId,
  onSelectDuration,
  onClose,
  onBook,
  canBook = true,
  submitting = false,
  onSchedule,
  initialTaxesOpen = false,
  testID = 'instant-sheet',
}: InstantSheetProps) {
  const [taxesOpen, setTaxesOpen] = useState(initialTaxesOpen);
  /** `333:3643` — local only: it opens a sheet over content already held (task §3). */
  const [helpOpen, setHelpOpen] = useState(false);
  const blocked = instant.unavailable;
  const art = blocked === undefined ? undefined : UNAVAILABLE_ART[blocked.icon];
  /** A duration the customer chose, plus the host's server-backed authority, plus no write in flight. */
  const bookable = selectedDurationId !== null && canBook && !submitting;

  const footer =
    blocked === undefined ? (
      <>
        {/*
          DISABLED until a duration is chosen.

          `1:728` draws this sheet with 1.5 hr already selected, so the frame never shows the
          state the app actually opens in — nothing selected. The CTA was live in that state and
          the host silently refused it (`canSubmit` is false without a duration), which is a
          control that looks pressable, reacts to touch and does nothing.

          The treatment is not invented: `275:4488` / `275:4713` / `275:4938` draw exactly this
          case on the Scheduled flow as a greyed-out "Book Now", and `ScheduleView` already gates
          on `complete`. This is the same rule on the same kind of selection.

          A duration is NOT pre-selected instead: which duration to buy is the customer's choice,
          and defaulting it would put a price in the CTA they never picked.
        */}
        <Button
          label={instant.ctaLabel}
          onPress={() => {
            // The style prop is not the guard: a press racing the state that disabled it must
            // not create a chargeable booking (task §J).
            if (!bookable) return;
            onBook();
          }}
          variant="primary"
          size="bar"
          disabled={!bookable}
          loading={submitting}
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
      headerVariant="banner"
      // `289:6867` — the finalized Instant header carries the 32pt DISC, not the bare arrow
      // `1:739` the superseded sheet drew.
      backVariant="outlined"
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
        {/*
          `1:751` — "Arriving in" + a canary pill.
          The blocked frames keep BOTH: `44:5378`'s sheet draws `267:3703` as a 338 x 32 row
          holding `267:3704` (the caption) and `267:3706` (a 109 x 32 pill), and the white 45 %
          veil is what dims them. Collapsing the line to one word was a reading of the superseded
          file.
        */}
        <View style={styles.etaRow}>
          <Text variant="titleLead" color="textPrimary" numberOfLines={1} style={styles.shrink}>
            {instant.etaCaption}
          </Text>
          <View style={styles.etaPill} testID={`${testID}-eta`}>
            <Text variant="headingScreen" color="textStrong" align="center" numberOfLines={1}>
              {instant.etaLabel}
            </Text>
          </View>
        </View>

        {/*
          `381:285` — the Duration label row, which this sheet did not draw at all before: a
          330pt row with "Duration" at x 0 and "Help me pick" right-aligned at x 232. The link
          raises `333:3643` over the sheet; it starts no read and changes no selection (§3).
        */}
        {instant.durationSectionTitle === undefined ? null : (
          <SectionHeader
            title={instant.durationSectionTitle}
            {...(instant.durationHelp === undefined || blocked !== undefined
              ? {}
              : {
                  actionLabel: instant.durationHelp.label,
                  onAction: () => setHelpOpen(true),
                })}
            testID={`${testID}-duration-header`}
          />
        )}

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

        {instant.durationHelp === undefined ? null : (
          <HelpMePickSheet
            visible={helpOpen}
            onClose={() => setHelpOpen(false)}
            title={instant.durationHelp.label}
            heading={instant.durationHelp.heading}
            columns={instant.durationHelp.columns}
            rows={instant.durationHelp.rows}
            testID={`${testID}-help-me-pick`}
          />
        )}
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

/**
 * `267:3606` — the CTA block, read off the current file.
 *
 * The body (`267:3542`) is 398 tall and the CTA is pinned to its bottom at y 326.2; the grid box
 * (`267:3548`) ends at 288.8, and the CTA's own 72pt box holds the button 9pt in. So the clear
 * distance from the grid box to the top of the button is 37.4 + 9 = **46.4**, not the 29 the
 * superseded `1:821` drew.
 *
 * `267:3609` sits 6pt below the button (button bottom 43, caption top 49) — the superseded
 * `25:1325` sat 4.4pt below.
 */
const CTA_GAP = 46.4;
const CAPTION_GAP = 6;

/**
 * `267:3542` — the body's own gap between the ETA row and the duration grid. The row ends at 32
 * and the grid starts at 48, so this is **16**; the superseded sheet used 29.
 */
const BLOCK_GAP = lightTheme.space.lg;

const styles = StyleSheet.create({
  content: { gap: BLOCK_GAP },
  /** `289:6871` — the bolt grew to **38 x 38** in the finalized Instant header. */
  headerBolt: { width: 38, height: 38 },
  shrink: { flexShrink: 1 },
  /**
   * `267:3532` — the CTA is pinned, so the body's own bottom padding (which follows it in the
   * frame) does not apply.
   *
   * `paddingTop` is the sheet container's 16pt gap between the header and the body: the header
   * (`267:3533`) ends at 73.8 and the body (`267:3542`) starts at 89.8. The shared default of 20
   * came from the superseded `1:750`; it is restated here rather than changed globally, because
   * the cancellation and extension sheets carry their own body nodes that have not been re-read.
   */
  body: { paddingTop: lightTheme.space.lg, paddingBottom: 0 },
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
    backgroundColor: lightTheme.colors.surfaceVeil,
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
