import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { TypographyToken } from '@ui/tokens/semantic';

/**
 * Label / value table — Figma `3:1095` (Confirmation summary), reused for the cancellation fee
 * schedule and the refund breakdown.
 *
 * `3:1095` does NOT give every row the same weight. Read off the frame:
 *
 *   Date        SemiBold 11/16.5 `rgba(0,0,0,0.7)`  ·  Bold 16/24 `#0F172B`
 *   Start time  SemiBold 11/16.5                    ·  Black 18/22.5   <- the hero row
 *   Duration    SemiBold 11/16.5                    ·  Bold 16/24
 *   End Time    SemiBold 10/13.33                   ·  Medium 12/16 `rgba(0,0,0,0.7)`
 *   Total       SemiBold 12/16                      ·  Black 18/28
 *
 * So a row carries an `emphasis` LEVEL rather than a boolean: `quiet` (End Time), `normal`
 * (Date / Duration), `hero` (Start time) and `total`. The separators are 0.889pt `#FFEF99`.
 *
 * BOUNDARY: values are pre-formatted strings. This component performs no arithmetic — in
 * particular it does NOT compute "paid − fee = refund". All three figures come from the server;
 * a client/server mismatch on a refund figure is a trust incident.
 * (FRONTEND_FOUNDATION_PLAN.md §20)
 */

export type DetailRowEmphasis = 'quiet' | 'normal' | 'hero' | 'total';

/**
 * `summary` — `3:1095`, the booking summary: `#FFEF99` rules between EVERY row.
 * `refund`  — `104:2353`, the refund breakdown: Livvic Regular 12/16 labels, Bold 12/16 values,
 *             and a single `#F1F5F9` rule directly above the total. The two are not the same
 *             table with a different fill; the weights and the rules both differ.
 * `booking` — `3:1095` as it is drawn TODAY, on `250:2861` Booking details. The card moved off
 *             Confirmation and its value ramp flattened completely: every value is Livvic Bold
 *             12/16, where the old table ran Black 16/24 with a Black 18/22.5 hero row. Labels are
 *             unchanged (SemiBold 11/16.5, with End Time at SemiBold 10/13.33). Rules stay
 *             `#FFEF99`.
 * `payment`  — `257:3439`, the lime payment table on the same screen. Identical typography to
 *             `booking`; only the rules differ, at `#CFFF04`.
 *
 * `summary` is LEFT as it was: its remaining consumer is the auto-cancel refund block
 * (`201:550`), a different node that has not been re-read.
 */
export type DetailRowsVariant = 'summary' | 'refund' | 'booking' | 'payment';

export interface DetailRow {
  readonly label: string;
  readonly value: string;
  readonly emphasis?: DetailRowEmphasis;
}

export interface DetailRowsProps {
  readonly rows: readonly DetailRow[];
  readonly variant?: DetailRowsVariant;
  readonly testID?: string;
}

const LABEL_VARIANT: Record<DetailRowsVariant, Record<DetailRowEmphasis, TypographyToken>> = {
  summary: { quiet: 'labelUpperQuiet', normal: 'label', hero: 'label', total: 'bodyStrong' },
  /** `104:2356` — Livvic Regular 12/16; `104:2366` — SemiBold 12/16 on the total. */
  refund: { quiet: 'body', normal: 'body', hero: 'body', total: 'bodyStrong' },
  /** `3:1098` / `3:1116` — SemiBold 11/16.5, with End Time a step quieter at 10/13.33. */
  booking: { quiet: 'labelUpperQuiet', normal: 'label', hero: 'label', total: 'label' },
  /** `257:3442` — SemiBold 11/16.5 throughout; the lime table has no quiet row. */
  payment: { quiet: 'label', normal: 'label', hero: 'label', total: 'label' },
};

const VALUE_VARIANT: Record<DetailRowsVariant, Record<DetailRowEmphasis, TypographyToken>> = {
  summary: {
    quiet: 'bodyMedium',
    normal: 'headingCta',
    hero: 'headingHero',
    total: 'headingTotal',
  },
  /** `104:2358` — Livvic Bold 12/16; `104:2368` — Black 16/24 on the total. */
  refund: { quiet: 'bodyBold', normal: 'bodyBold', hero: 'bodyBold', total: 'headingCta' },
  /** `3:1100` / `3:1106` / `3:1112` — Livvic Bold 12/16; `3:1118` End Time at Medium 12/16. */
  booking: { quiet: 'bodyMedium', normal: 'bodyBold', hero: 'bodyBold', total: 'bodyBold' },
  /** `257:3444` / `257:3489` / `257:3496` — Livvic Bold 12/16 on every line. */
  payment: { quiet: 'bodyBold', normal: 'bodyBold', hero: 'bodyBold', total: 'bodyBold' },
};

export function DetailRows({ rows, variant = 'summary', testID }: DetailRowsProps) {
  return (
    <View style={variant === 'refund' ? styles.tableRefund : styles.table} testID={testID}>
      {rows.map((row, index) => {
        const emphasis = row.emphasis ?? 'normal';
        // `3:1095` / `257:3439` rule every row; `104:2364` rules only the total.
        const ruled = index > 0 && (variant !== 'refund' || emphasis === 'total');

        return (
          <Fragment key={row.label}>
            {ruled ? (
              <View
                style={
                  variant === 'refund'
                    ? styles.ruleRefund
                    : variant === 'payment'
                      ? styles.rulePayment
                      : styles.rule
                }
              />
            ) : null}
            <View
              style={[styles.row, ruled && variant === 'refund' ? styles.rowRuled : null]}
              accessible
              accessibilityLabel={`${row.label}: ${row.value}`}
              testID={testID === undefined ? undefined : `${testID}-row-${index}`}
            >
              <Text
                variant={LABEL_VARIANT[variant][emphasis]}
                color={
                  variant === 'refund' && emphasis === 'total' ? 'textPrimary' : 'textSecondary'
                }
                numberOfLines={1}
                style={styles.label}
              >
                {row.label}
              </Text>
              <Text
                variant={VALUE_VARIANT[variant][emphasis]}
                color={
                  emphasis === 'quiet'
                    ? 'textSecondary'
                    : variant === 'refund' && emphasis === 'total'
                      ? 'textPrimary'
                      : 'textStrong'
                }
                align="right"
                numberOfLines={1}
                style={styles.value}
              >
                {row.value}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { alignSelf: 'stretch', gap: lightTheme.space.s6 },
  /** `104:2353` — 8pt between rows, 4pt of lead-in. */
  tableRefund: { alignSelf: 'stretch', gap: lightTheme.space.sm, paddingTop: lightTheme.space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: lightTheme.space.md,
  },
  /** `3:1101` — a 0.889pt `#FFEF99` rule, not the shared `Divider`. */
  rule: {
    alignSelf: 'stretch',
    height: lightTheme.stroke.hairline,
    backgroundColor: lightTheme.colors.borderAccent,
  },
  /** `257:3445` — the lime table rules in `#CFFF04`, not `#FFEF99`. */
  rulePayment: {
    alignSelf: 'stretch',
    height: lightTheme.stroke.hairline,
    backgroundColor: lightTheme.colors.borderPositive,
  },
  /** `104:2364` — a 0.889pt `#F1F5F9` rule above the total only, with 6pt of clearance. */
  ruleRefund: {
    alignSelf: 'stretch',
    height: lightTheme.stroke.hairline,
    backgroundColor: lightTheme.colors.borderHairline,
  },
  rowRuled: { paddingTop: lightTheme.space.s6 },
  label: { flexShrink: 1 },
  value: { flexShrink: 0, maxWidth: '60%' },
});
