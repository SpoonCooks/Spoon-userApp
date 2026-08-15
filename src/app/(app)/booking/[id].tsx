import { useLocalSearchParams, useRouter } from 'expo-router';

import { BookingDetailScreen } from '@features/booking';
import { ErrorBoundary } from '@ui';

/**
 * Booking lifecycle host - Confirmation (`3:1041`), En route (`3:1381` / `99:1413`), Arrived
 * (`3:1658`), In service (`101:1812`) and Completion (`143:207`) are VIEWS of this one route.
 *
 * Wrapped in its own error boundary: an unexpected server state must degrade, not white-screen.
 *
 * The Cancel action is deliberately not wired - blocker B-11: no live-booking screen in Figma has
 * a verified cancellation entry point.
 *
 * Help (`39:5331`) and Call Cook (`94:936`) ARE drawn by every booking frame, so they are wired
 * here and render. Only their DESTINATIONS are outstanding - Help is blocker B-10, and placing a
 * call needs the cook's number, which is deliberately never a component prop (see `CookCard`).
 * Leaving the callbacks unsupplied hid both controls on every screen, which is a visual defect,
 * not a boundary: the control is design, the destination is product.
 */
export default function BookingRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ErrorBoundary scope="booking-host">
      <BookingDetailScreen
        bookingId={id ?? ''}
        onBack={() => router.back()}
        onReschedule={() => router.push(`/reschedule/${id ?? ''}`)}
        // TODO(product B-10): no Help destination is designed yet.
        onHelp={() => {}}
        // TODO(backend-contract): dialling needs the cook's number from the booking payload.
        onCallCook={() => {}}
      />
    </ErrorBoundary>
  );
}
