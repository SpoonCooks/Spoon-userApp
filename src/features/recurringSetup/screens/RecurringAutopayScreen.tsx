import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Button, CANCEL_RADIO_OFF, CANCEL_RADIO_ON, Card, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { AUTOPAY_METHODS, buildDemoAutopayDetails } from '../data';

/**
 * Recurring setup — Step 5 "Autopay".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state `2h`
 * ("Step 5 · Autopay"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md. Layout, sizes and copy are
 * read off the wireframe's markup; COLOURS are the app's own, as on Steps 1–4: the selected
 * option is outlined in the notice yellow rather than the wireframe's black, and the radio glyphs
 * are the app's own (`CANCEL_RADIO_ON` / `_OFF`, as in `CancelBookingSheet`).
 *
 * STATIC ONLY, per task: the two methods and the mandate terms are local fixture data
 * (`AUTOPAY_METHODS`, `buildDemoAutopayDetails`) — there is no Razorpay integration wired up yet,
 * so "Approve with …" does nothing beyond report which method was selected.
 */

export interface RecurringAutopayScreenProps {
  readonly onBack: () => void;
  /** Left unwired by the route for now — see the file banner. */
  readonly onContinue?: (methodId: string) => void;
  readonly testID?: string;
}

export function RecurringAutopayScreen({
  onBack,
  onContinue,
  testID = 'recurring-autopay-screen',
}: RecurringAutopayScreenProps) {
  const details = useMemo(() => buildDemoAutopayDetails(), []);
  const [methodId, setMethodId] = useState<string>(AUTOPAY_METHODS[0]!.id);
  const method = AUTOPAY_METHODS.find((option) => option.id === methodId) ?? AUTOPAY_METHODS[0]!;

  return (
    <Screen
      scroll
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Set up autopay" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <Button
            label={`Approve with ${method.ctaLabel}`}
            onPress={() => onContinue?.(methodId)}
            testID={`${testID}-continue`}
          />
        </View>
      }
    >
      <Text variant="bodyRelaxed" color="textSecondary">
        Approve once. We’ll charge each visit automatically before it starts.
      </Text>

      <View
        style={styles.methods}
        accessibilityRole="radiogroup"
        accessibilityLabel="Payment method"
      >
        {AUTOPAY_METHODS.map((option) => {
          const selected = option.id === methodId;
          return (
            <Pressable
              key={option.id}
              onPress={() => setMethodId(option.id)}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected, checked: selected }}
              style={({ pressed }) => [
                styles.method,
                selected ? styles.methodSelected : null,
                pressed ? styles.pressed : null,
              ]}
              testID={`${testID}-method-${option.id}`}
            >
              <Image
                source={selected ? CANCEL_RADIO_ON : CANCEL_RADIO_OFF}
                style={styles.radio}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <View style={styles.methodText}>
                <Text variant="optionTitle" color="textPrimary">
                  {option.label}
                </Text>
                <Text variant="hint" color="textSecondary">
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Card tone="muted" padded={false} style={styles.details} testID={`${testID}-details`}>
        {details.map((row) => (
          <View key={row.label} style={styles.detailRow}>
            <Text variant="bodyLarge" color="textPrimary">
              {row.label}
            </Text>
            <Text variant="title" color="textPrimary" align="right" style={styles.detailValue}>
              {row.value}
            </Text>
          </View>
        ))}
      </Card>

      <Text variant="hint" color="textSecondary">
        Cancel autopay anytime from Manage plan. You’ll get a notification before every charge.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  /** `2h` — the body opens 6 under the header; its blocks sit 12 apart. */
  body: { paddingTop: lightTheme.space.s6, gap: lightTheme.space.md },
  methods: { gap: lightTheme.space.md },
  /** `2h` — an option card: 14 padding, a 16pt radius, 12 between radio and text. */
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: 14,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.border,
  },
  /** The chosen option's edge thickens to 2, as drawn, in the notice yellow. */
  methodSelected: { borderWidth: 2, borderColor: lightTheme.colors.borderNotice },
  methodText: { flex: 1 },
  radio: { width: 22, height: 22 },
  pressed: { opacity: 0.7 },
  /** `2h` — the terms: a grey card, 14 padding, a 16pt radius, rows 8 apart. */
  details: { padding: 14, borderRadius: lightTheme.radius.md, gap: lightTheme.space.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: lightTheme.space.md },
  detailValue: { flexShrink: 1 },
  /** `2h` — the footer's own top rule, edge to edge, as on Steps 2–4. */
  footer: {
    marginHorizontal: -lightTheme.layout.screenPaddingHorizontal,
    marginTop: -lightTheme.space.sm,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.s10,
    borderTopWidth: 1.5,
    borderTopColor: lightTheme.colors.surfaceMuted,
  },
});
