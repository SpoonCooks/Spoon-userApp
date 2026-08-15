/**
 * Auth view models — NEW Figma `1kd1u3WEc00SENkToIPloW`:
 * `53:174` Page 17a Login No. and `227:1649` Page 17b Login OTP.
 *
 * Both screens changed completely from the previous file. Login is no longer a logo tile over a
 * black-outlined field; it is a 364pt hero photograph, a 134 × 93 logo lockup, a two-line tagline,
 * a pill phone field and a legal footer. The OTP screen did not exist at all before (it was
 * blocker B-7) and is now fully designed.
 *
 * BOUNDARY — nothing below is a constant baked into the UI:
 *  - `dialCode` is data. The frame shows `+91`; hardcoding a country would make the screen wrong
 *    the moment the product crosses a border.
 *  - `digitCount` is data. The frame draws SIX boxes, so six is the design default the fixture
 *    supplies — but the code reads the value, so a contract that says otherwise costs no redesign.
 *  - `resendLabel` arrives PRE-FORMATTED ("Resend OTP in 26s"). The client runs no timer and owns
 *    no resend interval; the 26s in the frame is sample copy, not a rule.
 *  - error/loading strings are supplied. No validation message is authored here.
 *
 * TODO(backend-contract): no auth endpoint, OTP request/verify payload, expiry, retry budget or
 * rate-limit response exists. Every callback below is a seam.
 */

export interface LoginViewModel {
  /** `53:224` — "Login". */
  readonly title: string;
  /** `225:1598` — "Enter your phone number to proceed". */
  readonly subtitle: string;
  /** `225:1637` — split so "minutes" can carry its own `#FFD600` run, as the frame draws it. */
  readonly taglineLead: string;
  readonly taglineAccent: string;
  /** `225:1636` — "Cooking dishes catered to your mood & taste". */
  readonly taglineSub: string;
  readonly dialCode: string;
  readonly phonePlaceholder: string;
  readonly phoneMaxLength: number;
  /** `53:244` — "Continue". */
  readonly ctaLabel: string;
  /** `53:256` / `225:1595` — the legal footer, with both links drawn underlined. */
  readonly legalLead: string;
  readonly legalTerms: string;
  readonly legalSeparator: string;
  readonly legalPrivacy: string;
  /** Supplied by the caller when the server rejects the number. Never authored client-side. */
  readonly errorMessage?: string;
  /** Drives the sending state on the CTA; the client never infers it. */
  readonly submitting?: boolean;
}

export interface OtpViewModel {
  /** `227:1678` — "OTP verification". */
  readonly title: string;
  /** `227:1680` — "OTP has been sent to +91 9876543210", pre-formatted with the number. */
  readonly sentToLabel: string;
  /** `227:1670` / `227:1671` — the OTP screen's tagline is its OWN size, not Login's. */
  readonly taglineLead: string;
  readonly taglineAccent: string;
  readonly taglineSub: string;
  /** `227:1681` draws six boxes. Read, never assumed. */
  readonly digitCount: number;
  /** `230:2086` — pre-formatted ("Resend OTP in 26s" / "Resend OTP"). */
  readonly resendLabel: string;
  /** Whether the resend action is currently offered. A server/runtime decision. */
  readonly resendEnabled: boolean;
  /** `227:1688` — "Verify & Proceed". */
  readonly ctaLabel: string;
  /** Supplied when the server rejects the code. */
  readonly errorMessage?: string;
  readonly submitting?: boolean;
}
