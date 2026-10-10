import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCatalogue } from '@features/catalogue';
import { useWhatsAppHelp } from '@features/support';
import { QueryBoundary, ScreenHeader } from '@ui';
import { lightTheme } from '@ui/theme/ThemeProvider';

import { refundTrackerFrom } from '../adapters';
import { useRefund } from '../api';
import { RefundTracker } from '../components/RefundTracker';

/**
 * One refund's tracker (DEC-090). Opened from a refund row, a cancelled booking and a cancelled
 * Recurring visit; also where a "Refund started" / "Refund credited" push lands.
 */
export interface RefundScreenProps {
  readonly refundId: string;
  readonly onBack: () => void;
  readonly testID?: string;
}

export function RefundScreen({ refundId, onBack, testID = 'refund-screen' }: RefundScreenProps) {
  const { state, refetch } = useRefund(refundId);
  const catalogue = useCatalogue();
  const timeZone =
    catalogue.state.status === 'ready' ? catalogue.state.data.operatingWindow.timeZone : undefined;
  const openWhatsApp = useWhatsAppHelp();
  const view = useMemo(
    () => (state.status === 'ready' ? refundTrackerFrom(state.data, { timeZone }) : null),
    [state, timeZone],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      <ScreenHeader density="nav" title="Refund" onBack={onBack} testID={`${testID}-header`} />
      <QueryBoundary state={state} onRetry={refetch}>
        {() =>
          view === null ? null : (
            <ScrollView contentContainerStyle={styles.content}>
              <RefundTracker refund={view} onContactSupport={openWhatsApp} />
            </ScrollView>
          )
        }
      </QueryBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: lightTheme.colors.background },
  content: { padding: lightTheme.space.lg },
});
