import { useState } from 'react';
import { useRouter } from 'expo-router';

import { InstantSheet, useInstantData } from '@features/booking';
import { HomeScreen } from '@features/home';

/**
 * Home route - Figma `1:455` / `59:520` (ruling R-2: one route, two booking-state variants).
 *
 * The Instant sheet (`1:728`) is presented over Home rather than being a route of its own,
 * matching the design. Its taxes dialog (`25:1585`) layers above the sheet inside the same modal.
 */
export default function HomeRoute() {
  const router = useRouter();
  const [instantOpen, setInstantOpen] = useState(false);
  const [durationId, setDurationId] = useState<string | null>(null);
  const instant = useInstantData();

  return (
    <>
      <HomeScreen
        onPressInstant={() => setInstantOpen(true)}
        onPressSchedule={() => router.push('/scheduled')}
        onPressAddress={() => router.push('/address')}
        onPressProfile={() => router.push('/profile')}
        onOpenActiveBooking={() => router.push('/booking/enRoute')}
      />

      {instant.state.status === 'ready' ? (
        <InstantSheet
          visible={instantOpen}
          instant={instant.state.data}
          selectedDurationId={durationId}
          onSelectDuration={setDurationId}
          onClose={() => setInstantOpen(false)}
          onBook={() => {
            // TODO(backend-contract / ruling R-1): submitting a booking and opening Razorpay
            // checkout is not implemented in this phase. Payment is never inferred here - after
            // checkout returns, authoritative booking state is refetched.
            setInstantOpen(false);
          }}
          onSchedule={() => {
            setInstantOpen(false);
            router.push('/scheduled');
          }}
        />
      ) : null}
    </>
  );
}
