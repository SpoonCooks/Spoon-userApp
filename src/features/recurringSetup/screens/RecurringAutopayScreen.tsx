import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  CANCEL_RADIO_OFF,
  CANCEL_RADIO_ON,
  Card,
  DetailRows,
  Screen,
  ScreenHeader,
  Text,
} from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { AUTOPAY_METHODS, buildDemoAutopayDetails } from '../data';

/**
 * Recurring setup — Step 5 "Autopay".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state 2h
 * ("Step 5 · Autopay"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md — a wireframe, not a
 * pixel-accurate mock, so the method choice reuses the app's existing radio treatment
 * (`CANCEL_RADIO_ON` / `_OFF`, the same glyphs `CancelBookingSheet` uses for its reason list)
 * rather than inventing a new one, and the mandate terms reuse `DetailRows`.
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
      header={
        <View style={styles.headerWrap}>
          <ScreenHeader title="Set up autopay" onBack={onBack} testID={`${testID}-header`} />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <Text variant="caption" color="textSecondary">
            Cancel autopay anytime from Manage plan. You’ll get a notification before every charge.
          </Text>
          <Button
            label={`Approve with ${method.ctaLabel}`}
            onPress={() => onContinue?.(methodId)}
            testID={`${testID}-continue`}
          />
        </View>
      }
    >
      <Text variant="body" color="textSecondary">
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
              hitSlop={lightTheme.space.xs}
              style={({ pressed }) => [styles.methodRow, pressed ? styles.pressed : null]}
              testID={`${testID}-method-${option.id}`}
            >
              <Image
                source={selected ? CANCEL_RADIO_ON : CANCEL_RADIO_OFF}
                style={styles.radio}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <View style={styles.methodText}>
                <Text variant="bodyStrong" color="textPrimary">
                  {option.label}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Card tone="surface" testID={`${testID}-details`}>
        <DetailRows rows={details} variant="booking" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.lg,
  },
  methods: { gap: lightTheme.space.md },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: lightTheme.space.md },
  methodText: { flex: 1, gap: lightTheme.space.xxs },
  radio: { width: 20, height: 20 },
  pressed: { opacity: 0.7 },
  footer: { gap: lightTheme.space.sm },
});
