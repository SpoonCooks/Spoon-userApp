import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { PAYMENT_DETAILS_SHEET } from '../../data/sheets';
import type { PaymentDetailsSheetData } from '../../data/sheets';
import { SHEET_BELL_GLYPH, SHEET_CHEVRON_GLYPH, SHEET_MONEY_GLYPH, SHEET_STITCH } from './assets';
import { RecurringSheet } from './RecurringSheet';

/**
 * Visit details / assigned · Payment details sheet — Figma `1434:1678`, sheet `1434:1770`
 * (`cCQlzTeiObQkpVBzwI8mZi`, page `1005:131`). The dimmed Visit details screen behind it is
 * `VisitDetailsScreen`'s; this file draws only the sheet.
 *
 * Below the shared chrome (`RecurringSheet`):
 *   price   `1434:1779` — `#FFF7CC`, p 16, r16, 12pt gap:
 *             `1434:1780` Body over Caption 60 % | Body Strong amount (12pt gap, centred)
 *             `1434:1785` Caption "GST" | Caption amount
 *             `1434:1793` the 338 × 2 dashed stitch
 *             `1434:1795` Emphasis "Total" over Caption 60 % | `1474:2505` struck Body 60 % "₹399"
 *                         and Display "₹299", bottom-aligned, 8pt apart
 *   payment `1434:1800` — white, 1pt `#FFEF99` edge, p 16, r16, 12pt gap:
 *             `1434:1801` 44pt `#FFE666` well + 24pt `Icon/Money` | eyebrow (Micro Strong 60 %),
 *                         "UPI Autopay" (Emphasis), detail (Caption 60 %) at 2pt | "Manage" link
 *             `1434:1813` `#FFF7CC`, r8, px 12 / py 8, 8pt gap: 24pt `Icon/Bell` + Caption
 *
 * STATIC: copy is fixture data; "Manage" only reports the press.
 */

export interface PaymentDetailsSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Defaults to the frame's. */
  readonly data?: PaymentDetailsSheetData;
  /** Absent: no "Manage" link (there is nowhere to manage Autopay yet). */
  readonly onManageAutopay?: () => void;
  readonly testID?: string;
}

export function PaymentDetailsSheet({
  visible,
  onClose,
  data = PAYMENT_DETAILS_SHEET,
  onManageAutopay,
  testID = 'payment-details-sheet',
}: PaymentDetailsSheetProps) {
  return (
    <RecurringSheet
      visible={visible}
      onClose={onClose}
      title={data.title}
      subtitle={data.subtitle}
      testID={testID}
    >
      <View style={styles.breakdown} testID={`${testID}-breakdown`}>
        <View style={styles.line}>
          <View style={styles.label}>
            <Text variant="spoonBody">{data.visitLine.label}</Text>
            {data.visitLine.caption === undefined ? null : (
              <Text variant="spoonCaption" color="textSecondarySoft">
                {data.visitLine.caption}
              </Text>
            )}
          </View>
          <Text variant="spoonBodyStrong">{data.visitLine.amount}</Text>
        </View>

        <View style={styles.line}>
          <View style={styles.label}>
            <Text variant="spoonCaption">{data.taxLine.label}</Text>
          </View>
          <Text variant="spoonCaption">{data.taxLine.amount}</Text>
        </View>

        {/* `1434:1793` — the dashed stitch, a 338 × 2 strip. */}
        <Image source={SHEET_STITCH} style={styles.stitch} resizeMode="stretch" />

        <View style={styles.line}>
          <View style={styles.label}>
            <Text variant="spoonEmphasis">{data.totalLabel}</Text>
            <Text variant="spoonCaption" color="textSecondarySoft">
              {data.totalCaption}
            </Text>
          </View>
          {/* `1474:2505` — bottom-aligned, 8pt apart. */}
          <View style={styles.price}>
            {data.totalOriginal === undefined ? null : (
              <Text variant="spoonBody" color="textSecondarySoft" style={styles.struck}>
                {data.totalOriginal}
              </Text>
            )}
            <Text variant="spoonDisplay" testID={`${testID}-total`}>
              {data.total}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.payment} testID={`${testID}-method`}>
        <View style={styles.method}>
          <View style={styles.moneyWell}>
            <Image source={SHEET_MONEY_GLYPH} style={styles.glyph24} />
          </View>
          <View style={styles.methodText}>
            <Text variant="spoonMicroStrong" color="textSecondarySoft">
              {data.methodEyebrow}
            </Text>
            <Text variant="spoonEmphasis">{data.methodName}</Text>
            <Text variant="spoonCaption" color="textSecondarySoft">
              {data.methodDetail}
            </Text>
          </View>
          {onManageAutopay === undefined ? null : (
            <Pressable
              onPress={onManageAutopay}
              accessibilityRole="link"
              hitSlop={lightTheme.space.md}
              style={({ pressed }) => [styles.manage, pressed ? styles.pressed : null]}
              testID={`${testID}-manage`}
            >
              <Text variant="spoonCaptionStrong">{data.manageLabel}</Text>
              <Image source={SHEET_CHEVRON_GLYPH} style={styles.glyph16} />
            </Pressable>
          )}
        </View>

        <View style={styles.status}>
          <Image source={SHEET_BELL_GLYPH} style={styles.glyph24} />
          <Text variant="spoonCaption" style={styles.statusText}>
            {data.reminder}
          </Text>
        </View>
      </View>
    </RecurringSheet>
  );
}

const styles = StyleSheet.create({
  /** `1434:1779` — `color/surface/subtle`, p 16, r16, 12pt gap. */
  breakdown: {
    alignSelf: 'stretch',
    backgroundColor: lightTheme.colors.surfaceAccent,
    borderRadius: lightTheme.radius.md,
    padding: lightTheme.space.lg,
    gap: lightTheme.space.md,
  },
  /** `1434:1780` / `1434:1785` / `1434:1795` — label column fills, 12pt to the amount. */
  line: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  label: { flex: 1 },
  stitch: { width: '100%', height: 2 },
  price: { flexDirection: 'row', alignItems: 'flex-end', gap: lightTheme.space.sm },
  struck: { textDecorationLine: 'line-through' },
  /** `1434:1800` — white, 1pt `color/border/default` (#FFEF99), p 16 inside the edge, r16. */
  payment: {
    alignSelf: 'stretch',
    backgroundColor: lightTheme.colors.surface,
    borderWidth: lightTheme.stroke.thin,
    borderColor: lightTheme.colors.borderAccent,
    borderRadius: lightTheme.radius.md,
    padding: lightTheme.space.lg,
    gap: lightTheme.space.md,
  },
  method: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  /** `1434:1802` — 44pt `color/brand/primary-tint` disc. */
  moneyWell: {
    width: 44,
    height: 44,
    borderRadius: lightTheme.radius.pill,
    backgroundColor: lightTheme.colors.surfaceAccentBold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: { flex: 1, gap: lightTheme.space.xxs },
  /** `1434:1809` — "Manage" + 16pt chevron, 2pt apart. */
  manage: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.xxs },
  /** `1434:1813` — `#FFF7CC`, r8, px 12 / py 8, 8pt gap. */
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.sm,
    paddingHorizontal: lightTheme.space.md,
    paddingVertical: lightTheme.space.sm,
    borderRadius: lightTheme.radius.xs,
    backgroundColor: lightTheme.colors.surfaceAccent,
  },
  statusText: { flex: 1 },
  glyph24: { width: 24, height: 24 },
  glyph16: { width: 16, height: 16 },
  pressed: { opacity: 0.85 },
});
