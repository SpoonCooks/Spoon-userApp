import { useCallback } from 'react';

import { openWhatsApp } from '@core/support';
import type { WhatsAppOutcome } from '@core/support';
import { useRuntime } from '@core/runtimeContext';
import { useCatalogue } from '@features/catalogue';

/**
 * The one Help handler every surface uses.
 *
 * ## Why this is a hook and not a bare function call
 *
 * Only so the CATALOGUE's `support.whatsappPhone` can win when operations publishes one. Nothing
 * about it blocks: the catalogue read is already cached app-wide (15-minute `staleTime`), its
 * loading state is deliberately ignored, and a Help tap made before the catalogue settles reaches
 * the founder-mandated line rather than waiting. That is the §3 rule applied to Help — a tap must
 * never open a spinner, and this one cannot.
 *
 * ## What a caller may assume
 *
 * That the button is never inert. `openWhatsApp` falls back from the WhatsApp scheme to `wa.me`
 * and reports the outcome instead of throwing, so the returned callback always resolves. The
 * outcome is logged rather than surfaced: a customer who ends up in a browser has still reached
 * Spoon, and one who reaches nothing has a device with no browser at all, which no in-app message
 * can fix.
 */
export function useWhatsAppHelp(): (message?: string) => void {
  const { logger } = useRuntime();
  // `enabled` is left on: this is the same cached query Home already issues, so in practice it is
  // a cache read. A screen reached before Home (a push deep link) pays one small request.
  const catalogue = useCatalogue();

  const published =
    catalogue.state.status === 'ready'
      ? (catalogue.state.data.support.whatsappPhone ?? null)
      : null;

  return useCallback(
    (message?: string) => {
      void openWhatsApp({
        phone: published,
        ...(message === undefined ? {} : { message }),
      }).then((outcome: WhatsAppOutcome) => {
        if (outcome === 'unavailable') {
          logger.warn('whatsapp.open.unavailable', {
            source: published === null ? 'fallback' : 'catalogue',
          });
          return;
        }
        logger.info('whatsapp.open', { via: outcome });
      });
    },
    [published, logger],
  );
}
