import { ScrollView, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import { BookingCard, EmptyState, QueryBoundary, ScreenHeader, lightTheme } from '@ui';
import type { BookingCardVariant } from '@ui';

import type { BookingListViewModel } from '../types';

/** `683:65` and `684:71`, exported from the v16 frames at their drawn 150pt size. */
const BOOKING_EMPTY_ART =
  require('../../../../assets/figma/history/booking-empty.png') as ImageSourcePropType;
const REFUND_EMPTY_ART =
  require('../../../../assets/figma/history/refund-empty.png') as ImageSourcePropType;

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
      <QueryBoundary state={state} onRetry={onRetry} loadingVariant="card">
        {(list) => (
          <ScrollView contentContainerStyle={styles.body}>
            {/*
              The two frames give this header different HEIGHTS and that difference is real:
              `65:35` on `6:227` is overridden to **45**, `71:620` on `71:615` keeps the
              component's **38**. Same component, two instances.

              Their OFFSETS are not different, and the superseded reading that Past bookings sat
              flush at y 0 was wrong: re-read on the final file, `65:35` and `71:620` are both at
              x 16 / y 16 inside their body column, exactly like every other instance of `63:783`.
              The 16pt lead is therefore unconditional.
            */}
            <ScreenHeader
              title={list.title}
              onBack={onBack}
              density={variant === 'refund' ? 'default' : 'band'}
            />

            {/* `6:239` / `71:621` — px 4 / py 6, 16pt between cards. */}
            <View style={styles.list}>
              {list.bookings.length === 0 ? (
                /*
                 * `679:1050` Booking empty / `679:1147` Refund empty — designed in v16, where
                 * before there was nothing and this drew the neutral 28pt icon with a second
                 * explanatory line. Each is one 150pt illustration over a single centred line,
                 * so no `description` is passed: the design has no second line to render.
                 *
                 * The artwork is chosen by `variant` rather than carried on the view model,
                 * because which of the two frames this is, is a property of the SCREEN and not
                 * of the data the server returned.
                 */
                <EmptyState
                  title={list.emptyTitle}
                  illustration={variant === 'refund' ? REFUND_EMPTY_ART : BOOKING_EMPTY_ART}
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
            </View>
          </ScrollView>
        )}
      </QueryBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /**
   * `#FFFFFF` — plain white, for BOTH Past bookings (`6:227`) and Refunds (`71:615`).
   *
   * It was `#F8FAFC` (`surfaceForm`), transcribed off `6:228`'s own fill. The cards on these two
   * screens are themselves near-white, so at that value the page read as a faintly grey band
   * behind faintly-lighter cards — a difference too small to be legible as a deliberate layer and
   * just large enough to look like a rendering fault on a device. Product's call is white on both
   * (they are one screen with a card `variant`, so they cannot differ).
   */
  screen: { flex: 1, backgroundColor: lightTheme.colors.surface },
  /**
   * `6:228` / `71:619` — the 16pt-gutter body column, with the header inside it and 16pt between
   * the header and the card block.
   */
  body: {
    paddingHorizontal: lightTheme.space.lg,
    paddingTop: lightTheme.space.lg,
    paddingBottom: lightTheme.space.xl,
    gap: lightTheme.space.lg,
  },
  /** `6:239` / `71:621` — px 4 / py 6, 16pt between cards. */
  list: {
    paddingHorizontal: lightTheme.space.xs,
    paddingVertical: lightTheme.space.s6,
    gap: lightTheme.space.lg,
  },
});
