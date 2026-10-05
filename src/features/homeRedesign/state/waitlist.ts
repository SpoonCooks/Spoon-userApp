import type { Waitlist } from '../types';

/** Meter fill = count / threshold, capped at 100 %. A missing or zero threshold reads as empty. */
export function waitlistProgress(waitlist: Pick<Waitlist, 'countForPincode' | 'launchThreshold'>) {
  if (!(waitlist.launchThreshold > 0)) return 0;
  return Math.min(1, Math.max(0, waitlist.countForPincode / waitlist.launchThreshold));
}

export type WaitlistChannel = 'push' | 'sms';

export interface JoinWaitlistDeps {
  /** Asks the OS for notification permission. Called at tap time, never on load. */
  readonly requestPushPermission: () => Promise<boolean>;
  /** Idempotent server register keyed on {userId, pincode}. */
  readonly register: (input: { pincode: string; channel: WaitlistChannel }) => Promise<void>;
}

/**
 * "Notify me". Asks for notification permission first and registers with push when granted,
 * falling back to SMS when it is refused. Already joined → nothing to do. Throws only when the
 * register call itself fails, so the caller can leave the button tappable.
 */
export async function joinWaitlist(
  input: { pincode: string; alreadyJoined: boolean },
  deps: JoinWaitlistDeps,
): Promise<{ channel: WaitlistChannel } | { channel: null }> {
  if (input.alreadyJoined) return { channel: null };
  let granted = false;
  try {
    granted = await deps.requestPushPermission();
  } catch {
    granted = false;
  }
  const channel: WaitlistChannel = granted ? 'push' : 'sms';
  await deps.register({ pincode: input.pincode, channel });
  return { channel };
}
