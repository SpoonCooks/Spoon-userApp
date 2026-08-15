/**
 * Correlation id attached to every request so a user-reported problem can be traced in backend
 * logs. (FRONTEND_FOUNDATION_PLAN.md §5)
 *
 * Not a security primitive — `Math.random` is fine and avoids a crypto polyfill dependency.
 */

export const CORRELATION_HEADER = 'X-Correlation-Id';

export function createCorrelationId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${time}-${random}`;
}
