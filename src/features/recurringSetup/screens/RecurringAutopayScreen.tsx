import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, DetailRows, Screen, ScreenHeader, Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { RecurringFooter } from '../components/RecurringFooter';
import { AUTOPAY_METHODS, buildDemoAutopayDetails } from '../data';

/**
 * Recurring setup — Step 5 "Autopay".
 *
 * Source: Claude Design artifact `https://claude.ai/artifact/Dfom3zAZoxPW2rV7osfdNu`, state `2h`
 * ("Step 5 · Autopay"). See docs/CLAUDE_DESIGN_RECURRING_SETUP.md. Figma `ZIJf639gTWHXshaa2YOeCT`
 * frame `4:1937` (`2h`) — an import of that wireframe. Layout, sizes, copy AND colours follow it,
 * as on Steps 1–4: the selected option has a 2pt ink edge, and the radios are drawn locally as
 * Figma draws them (a 26pt ink rounded square, a 10pt dot when chosen).
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
      showsScrollIndicator={false}
      tone="plain"
      testID={testID}
      contentStyle={styles.body}
      header={
        <ScreenHeader
          density="step"
          title="Set up autopay"
          onBack={onBack}
          testID={`${testID}-header`}
        />
      }
      footer={
        <RecurringFooter
          label={`Approve with ${method.ctaLabel}`}
          onPress={() => onContinue?.(methodId)}
          testID={`${testID}-continue`}
        />
      }
    >
      <Text variant="bodyRelaxed" color="textStoneDeep">
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
              <View style={styles.radio}>{selected ? <View style={styles.radioDot} /> : null}</View>
              <View style={styles.methodText}>
                <Text variant="optionTitle" color="textInk">
                  {option.label}
                </Text>
                <Text variant="captionStep" color="textStoneCaption">
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Card tone="muted" padded={false} style={styles.details} testID={`${testID}-details`}>
        <DetailRows rows={details} variant="terms" testID={`${testID}-terms`} />
      </Card>

      <Text variant="hint" color="textStoneCaption">
        Cancel autopay anytime from Manage plan. You’ll get a notification before every charge.
      </Text>
    </Screen>
  );
}

/** `4:1943` — a 20pt gutter (not the app's 16), as on Steps 1–4. */
const GUTTER = 20;

const styles = StyleSheet.create({
  /** `4:1948` — the body opens 6 under the header; its blocks sit 12 apart. */
  body: { paddingHorizontal: GUTTER, paddingTop: lightTheme.space.s6, gap: lightTheme.space.md },
  methods: { gap: lightTheme.space.md },
  /**
   * `4:1960` — an option card: a 1pt `#CFCDC4` edge, 14 inside it, a 16pt radius, 12 between
   * radio and text: 65 tall.
   */
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.space.md,
    padding: 14,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.borderStoneMid,
  },
  /** `4:1952` — the chosen option's edge is 2pt ink: 67 tall. */
  methodSelected: { borderWidth: 2, borderColor: lightTheme.colors.surfaceInk },
  methodText: { flex: 1 },
  /** `4:1953` — a 26pt rounded square (an 11pt radius, not a circle), 2pt ink. */
  radio: {
    width: 26,
    height: 26,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: lightTheme.colors.surfaceInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** `4:1954` — the 10pt ink dot inside the chosen ring. */
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: lightTheme.colors.surfaceInk,
  },
  pressed: { opacity: 0.7 },
  /** `4:1967` — the terms: `#F2F1EC`, 14 padding, a 16pt radius; `DetailRows terms` spaces the rows. */
  details: {
    padding: 14,
    borderRadius: lightTheme.radius.md,
    backgroundColor: lightTheme.colors.surfaceStoneSoft,
  },
});
