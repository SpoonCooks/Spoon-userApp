import type { SessionTokens } from './tokenStore';

/**
 * The seam between the session machinery and the backend.
 *
 * TODO(backend-contract): no auth endpoints, payloads, token lifetimes or refresh semantics have
 * been provided. This interface is deliberately the smallest thing the client genuinely needs;
 * it does NOT describe a real endpoint and must be reviewed against the contract when one exists.
 *
 * DESIGN_PENDING: the OTP entry screen does not exist in Figma, so no sign-in call is modelled
 * here beyond the token exchange the session machine requires.
 */
export interface SessionGateway {
  /**
   * Exchange a refresh token for a new session.
   * Returns null when the refresh token is no longer valid (session unrecoverable).
   */
  refreshSession(refreshToken: string): Promise<SessionTokens | null>;
}

/**
 * Placeholder implementation used until the contract lands. It fails closed — refresh always
 * reports "unrecoverable" — so nothing silently pretends to be signed in.
 */
export const unimplementedSessionGateway: SessionGateway = {
  async refreshSession() {
    return null;
  },
};
