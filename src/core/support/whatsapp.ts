import { Linking } from 'react-native';

/**
 * The single WhatsApp handoff.
 *
 * ## Why a constant lives in the client at all
 *
 * The catalogue publishes `support.whatsappPhone` (`src/features/catalogue/api/schemas.ts`) and
 * that field is still empty on every deployment. The founder ruling recorded on the final Figma
 * (task §15) settles the destination in the meantime: every WhatsApp control in the app — the
 * yellow `Help` pill and the WhatsApp icons beside it — reaches Spoon on **8792997836**.
 *
 * The constant is therefore a FALLBACK, not the authority. `resolveWhatsAppPhone` prefers the
 * server's number whenever the catalogue carries one, so the day operations publishes a support
 * line the app follows it without a release. That ordering is deliberate: §16 says backend owns
 * what backend owns, and a support number is operations' to move.
 *
 * ## Why the deep link is tried before the web link
 *
 * `whatsapp://send` opens the installed app directly. `https://wa.me/...` also opens the app on a
 * handset that has it, but it round-trips through the browser first, which shows a redirect page
 * on some Android builds. Trying the scheme first and falling back keeps the common case clean
 * and still works on a device with no WhatsApp installed — where the wa.me page offers the
 * install, which is the correct outcome rather than a dead button.
 *
 * `canOpenURL` is NOT used to gate the attempt. Android 11+ requires a `<queries>` manifest entry
 * for it to answer truthfully about another package, and without one it returns `false` for an
 * app that is plainly installed — so gating on it would break the deep link on exactly the
 * devices it is meant to serve. Attempting the open and catching the rejection is the honest
 * probe.
 */

/** Spoon's WhatsApp line, in the international form `wa.me` requires: no `+`, no punctuation. */
export const SPOON_WHATSAPP_PHONE = '918792997836';

/** The bare national number, as the founder wrote it. Exported for display, never for linking. */
export const SPOON_WHATSAPP_DISPLAY = '8792997836';

/** India. Applied only to a server number that arrives without a country code. */
const DEFAULT_COUNTRY_CODE = '91';

/**
 * Normalises whatever the catalogue publishes into the digits-only international form.
 *
 * A 10-digit Indian number is assumed to be national and gains `91`; anything already longer is
 * assumed to carry its own country code and is left alone. Returns `null` for a value that
 * cannot be a phone number, so a malformed server field falls back to the known-good constant
 * rather than producing a link that opens a chat with nobody.
 */
export function normaliseWhatsAppPhone(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return digits.length === 10 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits;
}

/** The server's number when it publishes a usable one, else the founder-mandated line. */
export function resolveWhatsAppPhone(published?: string | null): string {
  return normaliseWhatsAppPhone(published) ?? SPOON_WHATSAPP_PHONE;
}

export interface WhatsAppTarget {
  /** Overrides the resolved number. Only a caller holding a DIFFERENT support line should pass it. */
  readonly phone?: string | null;
  /** Prefilled chat text. Optional — an empty chat is a valid handoff. */
  readonly message?: string;
}

/** `whatsapp://send?...` — the direct app open. */
export function whatsAppDeepLink(target: WhatsAppTarget = {}): string {
  const phone = resolveWhatsAppPhone(target.phone);
  const text = target.message === undefined ? '' : `&text=${encodeURIComponent(target.message)}`;
  return `whatsapp://send?phone=${phone}${text}`;
}

/** `https://wa.me/...` — the fallback that also works with no WhatsApp installed. */
export function whatsAppWebLink(target: WhatsAppTarget = {}): string {
  const phone = resolveWhatsAppPhone(target.phone);
  const text = target.message === undefined ? '' : `?text=${encodeURIComponent(target.message)}`;
  return `https://wa.me/${phone}${text}`;
}

/** Injected in tests. The app always uses React Native's `Linking`. */
export interface UrlOpener {
  openURL(url: string): Promise<unknown>;
}

export type WhatsAppOutcome = 'app' | 'browser' | 'unavailable';

/**
 * Opens Spoon's WhatsApp chat and reports which route succeeded.
 *
 * Never throws. A Help button that cannot reach WhatsApp is a support problem, not a crash, and
 * the caller decides what to say about it — so the failure is a RETURN VALUE. `'unavailable'`
 * means neither the app nor a browser accepted the link, which on a real handset means no
 * browser is installed or the intent was blocked.
 */
export async function openWhatsApp(
  target: WhatsAppTarget = {},
  opener: UrlOpener = Linking,
): Promise<WhatsAppOutcome> {
  try {
    await opener.openURL(whatsAppDeepLink(target));
    return 'app';
  } catch {
    // WhatsApp is not installed, or the scheme was refused. The web link handles both.
  }

  try {
    await opener.openURL(whatsAppWebLink(target));
    return 'browser';
  } catch {
    return 'unavailable';
  }
}
