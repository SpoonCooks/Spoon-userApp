import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Text } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';
import type { ColorToken } from '@ui/tokens/semantic';

import { VISIT_EDIT, VISIT_MONEY_DOCK, VISIT_WHATSAPP } from './assets';

/**
 * `Action dock` — Figma `1444:730`, pinned under every Visit details frame. A white bar with a
 * 1pt `#FFEF99` top rule, px 16 / py 12, holding equal 64pt tiles 8 apart (p 8, 4 gap, 16pt
 * corners): "Payment details" and "Help" on `#FFF7CC`, "Modify booking" on `#FFEF99`. Completed
 * (`1466:8659`) and Cancelled (`1466:8466`) drop "Modify booking".
 *
 * Help deep-links straight to WhatsApp per `1434:2205` "Note · Help deep link" — that wiring is
 * the caller's (`onHelp`); the sheets behind the other two are built elsewhere.
 *
 * Meant for `Screen`'s `footer`: it bleeds over the footer's own 16pt sides and 8pt top so the
 * rule runs edge to edge, as on the recurring setup steps.
 */
export interface ActionDockProps {
  readonly showModify?: boolean | undefined;
  readonly onPaymentDetails?: (() => void) | undefined;
  readonly onModifyBooking?: (() => void) | undefined;
  readonly onHelp?: (() => void) | undefined;
  readonly testID?: string | undefined;
}

interface DockAction {
  readonly key: 'payment' | 'modify' | 'help';
  readonly label: string;
  readonly glyph: ImageSourcePropType;
  readonly tone: ColorToken;
  readonly onPress?: (() => void) | undefined;
}

export function ActionDock({
  showModify = true,
  onPaymentDetails,
  onModifyBooking,
  onHelp,
  testID = 'visit-action-dock',
}: ActionDockProps) {
  const actions: DockAction[] = [
    {
      key: 'payment',
      label: 'Payment details',
      glyph: VISIT_MONEY_DOCK,
      tone: 'surfaceAccent',
      onPress: onPaymentDetails,
    },
    ...(showModify
      ? [
          {
            key: 'modify',
            label: 'Modify booking',
            glyph: VISIT_EDIT,
            tone: 'surfaceAccentStrong',
            onPress: onModifyBooking,
          } as const,
        ]
      : []),
    { key: 'help', label: 'Help', glyph: VISIT_WHATSAPP, tone: 'surfaceAccent', onPress: onHelp },
  ];

  return (
    <View style={styles.dock} testID={testID}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          accessibilityRole="button"
          style={[styles.tile, { backgroundColor: lightTheme.colors[action.tone] }]}
          testID={`${testID}-${action.key}`}
        >
          <Image source={action.glyph} style={styles.glyph} />
          <Text variant="spoonCaptionStrong" color="textPrimary" align="center" numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    gap: lightTheme.space.sm,
    marginHorizontal: -lightTheme.layout.screenPaddingHorizontal,
    marginTop: -lightTheme.space.sm,
    paddingHorizontal: lightTheme.layout.screenPaddingHorizontal,
    paddingTop: lightTheme.space.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.borderAccent,
    backgroundColor: lightTheme.colors.surface,
  },
  /** `1444:738` — a 64pt tile. */
  tile: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: lightTheme.space.xs,
    padding: lightTheme.space.sm,
    borderRadius: lightTheme.radius.md,
  },
  glyph: { width: 24, height: 24 },
});
