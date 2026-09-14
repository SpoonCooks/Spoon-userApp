import { Redirect, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';

import { LEGAL_DOCUMENTS, LegalDocumentView, legalDocumentFor } from '@features/legal';
import { useSafeBack } from '@core/navigation';

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
 * ## Back POPS, and the fallback is only for a deep link
 *
 * This screen has three entry points — Login, and both rows on the Account screen — so the only
 * correct answer to "back" is the screen the reader actually came from. `useSafeBack` gives that,
 * and falls back to Profile for a cold `spoon://legal/:doc` with nothing behind it, for the same
 * reason History and Refunds fall back there.
 *
 * It used to be `useDeterministicBack('/profile')`, which does not pop at all: it dismissed the
 * stack and REPLACED it with Profile, so a reader who opened the Terms from the Account screen
 * was put on Profile and had to walk back in. That was invisible while Profile was the only way
 * in — the destination and the origin were the same screen — and became wrong the moment the
 * Account screen started linking here.
 *
 * An unknown `doc` REDIRECTS rather than rendering an error. A legal document is either published
 * or it is not; there is no partial state worth drawing, and a mistyped deep link should put the
 * customer somewhere real (task §20 — a deep link must never dead-end).
 */
export default function LegalDocumentRoute() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const goBack = useSafeBack('/profile');

  const id = legalDocumentFor(doc);
  if (id === null) return <Redirect href={'/profile' as Href} />;

  return <LegalDocumentView document={LEGAL_DOCUMENTS[id]} onBack={goBack} />;
}
