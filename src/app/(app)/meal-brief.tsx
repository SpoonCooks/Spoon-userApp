import { useState } from 'react';

import { MealBriefView, useMealBriefData } from '@features/mealBrief';
import { useSafeBack } from '@core/navigation';
import { InfoDialog } from '@ui';

/**
 * Meal Brief & Recipe Link - Figma `3:684`. Skippable by design.
 *
 * PRODUCT_GAP, not a backend gap — and the earlier note here had it the wrong way round.
 *
 * A meal brief IS writable: `POST /v1/bookings` accepts `mealBrief`, `mealNotes` and
 * `referenceUrl` on the booking intent (`BookingIntentRequest`), the backend stores the structured
 * brief immutably at booking time, and `GET /v1/bookings/:id` projects it back. What does not
 * exist is a PRODUCT ENTRY POINT: no booking flow routes through this screen, so there is no
 * booking-in-progress for a brief to attach to, and this route is reachable only at
 * `spoon://meal-brief` for review.
 *
 * Submit therefore still says so and stays put rather than closing, because closing would read to
 * the customer as "saved" — the invented success §11 forbids for a brief a cook would then never
 * receive. Wiring it means adding the step to the booking flow, which is a navigation change and
 * a product decision; recorded in `docs/USER_APP_BACKEND_CONNECTIVITY_CLOSURE.md`.
 *
 * The screen is not a dead end either way: Skip and Back both work.
 */
export default function MealBriefRoute() {
  const { state, refetch } = useMealBriefData();
  const [unavailable, setUnavailable] = useState(false);

  const goBack = useSafeBack('/home');

  return (
    <>
      <MealBriefView
        state={state}
        onRetry={refetch}
        onBack={goBack}
        onSkip={goBack}
        onSubmit={() => setUnavailable(true)}
      />

      {/* FIGMA_PENDING — `3:684` draws no unavailable state. */}
      <InfoDialog
        visible={unavailable}
        onClose={() => setUnavailable(false)}
        title="Not available yet"
        body="Meal briefs can’t be saved yet. Share your dishes and any recipe link with us on WhatsApp and we’ll pass them to your cook."
        testID="meal-brief-unavailable"
      />
    </>
  );
}
