import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DataState } from '@core/data';
import { BookingCard, EmptyState, QueryBoundary, ScreenHeader, lightTheme } from '@ui';
import type { BookingCardVariant } from '@ui';

import { BookingTabSwitcher } from '../components/BookingTabSwitcher';
import type { BookingTabOption } from '../components/BookingTabSwitcher';
import type { BookingListViewModel } from '../types';

const BOOKING_TABS: readonly BookingTabOption[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

/**
 * My bookings (`6:227`, redesigned with an Upcoming/Past switcher) and Refunds (`71:615`).
 *
 * One screen with a card `variant`, because the audit found both frames use the same card with a
 * different subtitle line and status set. Refunds is a separate top-level destination reached
 * from Profile — not a filter of history, and never receives `tabs`.
 *
 * `tabs` is the only thing that distinguishes the two screens beyond `variant`: passing it renders
 * the Upcoming/Past switcher and titles the header "My bookings"; omitting it (Refunds, and any
 * caller that hasn't opted in) renders exactly as before — `list.title`, no switcher. Additive by
 * construction, so Refunds needed no changes here.
 */
export interface BookingListViewProps {
  readonly state: DataState<BookingListViewModel>;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly onSelect?: (bookingId: string) => void;
  readonly variant?: BookingCardVariant;
  /** Present only for the My bookings screen — renders the Upcoming/Past switcher. */
  readonly tabs?: { readonly active: string; readonly onChange: (id: string) => void };
  readonly testID?: string;
}

export function BookingListView({
  state,
  onRetry,
  onBack,
  onSelect,
  variant = 'history',
  tabs,
  testID = 'booking-list-screen',
}: BookingListViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} testID={testID}>
      <QueryBoundary state={state} onRetry={onRetry} loadingVariant="card">
        {(list) => (
          <FlatList
            data={list.bookings}
            keyExtractor={(booking) => booking.id}
            contentContainerStyle={styles.body}
            ListHeaderComponent={
              <View style={styles.heading}>
                {/*
                  The two frames give this header different HEIGHTS and that difference is real:
                  `65:35` on `6:227` is overridden to **45**, `71:620` on `71:615` keeps the
                  component's **38**. Same component, two instances.

                  Their OFFSETS are not different, and the superseded reading that Past bookings
                  sat flush at y 0 was wrong: re-read on the final file, `65:35` and `71:620` are
                  both at x 16 / y 16 inside their body column, exactly like every other instance
                  of `63:783`. The 16pt lead is therefore unconditional.
                */}
                <ScreenHeader
                  title={tabs === undefined ? list.title : 'My bookings'}
                  onBack={onBack}
                  density={variant === 'refund' ? 'default' : 'band'}
                />

                {tabs === undefined ? null : (
                  <BookingTabSwitcher
                    options={BOOKING_TABS}
                    selectedId={tabs.active}
                    onSelect={tabs.onChange}
                    testID={`${testID}-tabs`}
                  />
                )}
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <BookingCard
                  booking={item}
                  variant={variant}
                  {...(onSelect === undefined ? {} : { onPress: () => onSelect(item.id) })}
                  testID={`${testID}-card-${item.id}`}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.row}>
                <EmptyState
                  title={list.emptyTitle}
                  description={list.emptyDescription}
                  icon="empty"
                  testID={`${testID}-empty`}
                />
              </View>
            }
            /* `6:239` — the card block's own 6pt of ground below the last card. */
            ListFooterComponent={<View style={styles.listFoot} />}
          />
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
  /**
   * The header block, and the 6pt of ground `6:239` puts above the first card.
   *
   * The card block used to be ONE `View` carrying `px 4 / py 6` and a 16pt gap. A virtualized
   * list has no such wrapper — each row is mounted on its own — so that block's geometry is split
   * between here (its 6pt lead), `row` (its 4pt gutter, per card) and `listFoot` (its 6pt tail).
   * The drawn result is identical; only who holds each value moved.
   */
  heading: { gap: lightTheme.space.lg, paddingBottom: lightTheme.space.s6 },
  /** `6:239` / `71:621` — the card block's 4pt gutter, now carried by each row. */
  row: { paddingHorizontal: lightTheme.space.xs },
  listFoot: { height: lightTheme.space.s6 },
});
