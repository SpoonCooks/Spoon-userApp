import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import { IntroLoading } from '@features/loading';
import { BookingCard, EmptyState, QueryBoundary, ScreenHeader, lightTheme } from '@ui';
import type { BookingCardVariant } from '@ui';

import type { BookingListViewModel } from '../types';

/**
 * Booking history (`6:227`) and Refunds (`71:615`).
 *
 * One screen with a card `variant`, because the audit found both frames use the same card with a
 * different subtitle line and status set. Refunds is a separate top-level destination reached
 * from Profile — not a filter of history.
 *
 * Ruling R-5: history is PAST bookings only; anything active lives on Home.
 * TODO(product B-15): cancelled bookings have nowhere to appear — no `Cancelled` status is drawn,
 * and a cancelled booking is not active either. Nothing is invented here to cover the gap.
 */
export interface BookingListViewProps {
  readonly state: DataState<BookingListViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly onSelect?: (bookingId: string) => void;
  readonly variant?: BookingCardVariant;
  readonly testID?: string;
}

export function BookingListView({
  state,
  onRetry,
  onBack,
  onSelect,
  variant = 'history',
  testID = 'booking-list-screen',
}: BookingListViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      <QueryBoundary state={state} onRetry={onRetry} loadingFallback={<IntroLoading />}>
        {(list) => (
          <>
            <ScreenHeader title={list.title} onBack={onBack} />

            <ScrollView contentContainerStyle={styles.list}>
              {list.bookings.length === 0 ? (
                <EmptyState
                  title={list.emptyTitle}
                  description={list.emptyDescription}
                  icon="empty"
                  testID={`${testID}-empty`}
                />
              ) : (
                list.bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    variant={variant}
                    {...(onSelect === undefined ? {} : { onPress: () => onSelect(booking.id) })}
                    testID={`${testID}-card-${booking.id}`}
                  />
                ))
              )}
            </ScrollView>
          </>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /** `6:228` — the list sits on `#F8FAFC`, not the app cream. */
  screen: { flex: 1, backgroundColor: lightTheme.colors.surfaceForm },
  /** `6:239` — 16pt padding, 16pt between cards, 24pt of tail. */
  list: {
    padding: lightTheme.space.lg,
    paddingBottom: lightTheme.space.xl,
    gap: lightTheme.space.lg,
  },
});
