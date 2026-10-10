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

/**
 * Login — Figma `cCQlzTeiObQkpVBzwI8mZi` page "Login", `1923:1139`. Static copy only; whether the
 * number is valid and whether the code was sent are decided elsewhere.
 */
export interface LoginViewModel {
  /** `1923:1316` — "Home cooks for all your needs". */
  readonly headline: string;
  readonly dialCode: string;
  readonly phonePlaceholder: string;
  /** Screen-reader name for the number field (the frame has no visible label). */
  readonly phoneLabel: string;
  /** `1923:1328` — "Get OTP". */
  readonly ctaLabel: string;
  /** `1940:7590` — shown when the customer leaves the field with an invalid number. */
  readonly invalidPhoneMessage: string;
  /** `1923:1330` — "By continuing, you agree to our Terms of use & Privacy policy". */
  readonly legalLead: string;
  readonly legalTerms: string;
  readonly legalSeparator: string;
  readonly legalPrivacy: string;
  /** "Skip" — guest mode, iOS only. Not in the Figma frame; drawn only when the host offers it. */
  readonly skipLabel: string;
  /** A send failure, already worded for the customer. Shares the invalid-number slot. */
  readonly errorMessage?: string;
  /** Get OTP locks and shows a spinner while the send is in flight. */
  readonly submitting?: boolean;
}

/**
 * Login OTP — `1934:1080` (2a), `1934:1358` (2b) and `1934:1648` (2c). Static copy only; the
 * number, the countdown and every error arrive as screen props.
 */
export interface LoginOtpViewModel {
  /** `1934:1325` / `1934:1327` — "Enter your" + the highlighted "OTP". */
  readonly titleLead: string;
  readonly titleMarker: string;
  /** `1934:1330` — "Sent to " + the number in SemiBold. */
  readonly sentToLead: string;
  readonly editLabel: string;
  readonly backLabel: string;
  /** `1934:1351` — "Didn’t get the code?". */
  readonly resendPrompt: string;
  /** `1934:1645` — "Resend via SMS". */
  readonly resendLabel: string;
  /** `1945:1692` — "Verify & continue", drawn in the keyboard frames only. */
  readonly verifyLabel: string;
  /** `1934:1337` draws six cells; V0's `LOGIN_OTP_LENGTH` defaults to 6. */
  readonly digitCount: number;
}

/**
 * The PREVIOUS OTP design (`1kd1u3WEc00SENkToIPloW`), still used by account deletion
 * (`/account/delete-otp`). Login has moved to `LoginOtpViewModel`.
 */
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
  /** `230:2086` — pre-formatted ("Resend OTP in 26s" / "Resend OTP via SMS"). */
  readonly resendLabel: string;
  /**
   * `250:2437` — the countdown frames set the TRAILING token in Livvic Bold against the Medium
   * lead ("Resend OTP in " + **"26s"**). Split for the same reason as `taglineAccent`: it is one
   * text node with two runs, and the client must not parse a duration out of a formatted string
   * to find the boundary. Omitted on `250:2439`, whose "Resend OTP via SMS" is a single run.
   */
  readonly resendLabelAccent?: string;
  /**
   * Whether the resend action is currently offered. A server/runtime decision. Also drives the
   * underline: `250:2439` / `275:4349` draw the offered link underlined, `275:4289` does not.
   */
  readonly resendEnabled: boolean;
  /**
   * `275:4467` — supplied when the server rejects the code. Presence also switches the digit
   * boxes to their error fill (`275:4449`), exactly as the error frame draws them.
   */
  readonly errorMessage?: string;
  readonly submitting?: boolean;
}
