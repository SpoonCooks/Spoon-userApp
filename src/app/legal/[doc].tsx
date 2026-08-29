import { Redirect, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';

import { LEGAL_DOCUMENTS, LegalDocumentView, legalDocumentFor } from '@features/legal';
import { useDeterministicBack } from '@core/navigation';

/**
 * `spoon://legal/terms` and `spoon://legal/privacy` — the two customer documents, in-app.
 *
 * ONE route with a parameter rather than two files: the documents differ only in their content,
 * and the viewer, the header and the back behaviour are identical. `documents.ts` holds the pair.
 *
 * ## Why this is NOT inside `(app)`
 *
 * `(app)/_layout` redirects an unauthenticated visitor to `/login`. Putting the documents behind
 * that gate makes them unreachable from the one screen that most needs them: Login states "By
 * continuing, I accept the Terms of use & Privacy policy", so a customer being asked to ACCEPT
 * them must be able to read them before they have an account. Legal notices are not authenticated
 * content, and gating them would mean the only people who can read the terms are the people who
 * already agreed to them.
 *
 * Profile is the fallback destination for the same reason History and Refunds use it — a pop with
 * no stack behind it should land somewhere real. A signed-out reader who arrived from Login pops
 * back to Login normally, because there IS a stack behind them.
 *
 * An unknown `doc` REDIRECTS rather than rendering an error. A legal document is either published
 * or it is not; there is no partial state worth drawing, and a mistyped deep link should put the
 * customer somewhere real (task §20 — a deep link must never dead-end).
 */
export default function LegalDocumentRoute() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const goBack = useDeterministicBack('/profile');

  const id = legalDocumentFor(doc);
  if (id === null) return <Redirect href={'/profile' as Href} />;

  return <LegalDocumentView document={LEGAL_DOCUMENTS[id]} onBack={goBack} />;
}
