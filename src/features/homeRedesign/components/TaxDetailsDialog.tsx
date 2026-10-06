import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Dialog } from '@ui';

import { ART } from '../assets';
import { C, F } from '../theme';

export interface TaxDetailsDialogProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** From config, never a literal in the copy. */
  readonly gstPercent: number;
}

/**
 * `1244:26584` "Dialog · Tax details" — opened by "Check payment details". "Understood!" closes
 * it; back press and a scrim tap also dismiss (the shared `Dialog` host owns both). Shown before
 * commitment so the payable total holds no surprise.
 */
export function TaxDetailsDialog({ visible, onClose, gstPercent }: TaxDetailsDialogProps) {
  return (
    <Dialog visible={visible} onClose={onClose} testID="tax-details-dialog">
      <View style={styles.card} accessibilityRole="alert">
        <View style={styles.badge}>
          <Image source={ART.money} style={styles.glyph} />
        </View>
        <Text style={styles.title}>Payment includes govt. taxes</Text>
        <Text style={styles.body}>
          {`Taxes levied as per Govt. regulations, subject to change basis final service value. This includes a ${gstPercent}% GST.`}
        </Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.button}>
            <Text style={styles.buttonLabel}>Understood!</Text>
          </Pressable>
        </View>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    padding: 24,
    borderRadius: 24,
    backgroundColor: C.base,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
      },
      default: { elevation: 6 },
    }),
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { width: 24, height: 24 },
  title: { fontFamily: F.semibold, fontSize: 18, lineHeight: 26, color: C.text },
  body: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.text },
  actions: { paddingTop: 8 },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: C.brand,
  },
  buttonLabel: { fontFamily: F.bold, fontSize: 16, lineHeight: 24, color: C.text },
});
