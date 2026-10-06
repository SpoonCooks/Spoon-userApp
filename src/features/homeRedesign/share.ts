import { Linking, Share } from 'react-native';

/** Injected in tests. The app always uses React Native's `Linking` and `Share`. */
export interface ShareDeps {
  readonly openURL: (url: string) => Promise<unknown>;
  readonly share: (content: { message: string }) => Promise<unknown>;
}

const DEFAULT_DEPS: ShareDeps = {
  openURL: (url) => Linking.openURL(url),
  share: (content) => Share.share(content),
};

/**
 * "Share Spoon" — WhatsApp first, the system share sheet otherwise.
 *
 * `whatsapp://send` with text and no phone opens WhatsApp's contact picker. As in
 * `@core/support/whatsapp`, the open is attempted rather than gated on `canOpenURL`, which lies
 * on Android 11+ without a `<queries>` entry. Never throws: a share that goes nowhere is not a
 * crash.
 */
export async function shareSpoon(
  message: string,
  deps: ShareDeps = DEFAULT_DEPS,
): Promise<'whatsapp' | 'sheet' | 'unavailable'> {
  try {
    await deps.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    return 'whatsapp';
  } catch {
    // WhatsApp not installed or the scheme was refused.
  }
  try {
    await deps.share({ message });
    return 'sheet';
  } catch {
    return 'unavailable';
  }
}
