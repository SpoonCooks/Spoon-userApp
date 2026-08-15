/**
 * Redaction deny-list.
 *
 * Implemented inside the logging layer so a careless call site cannot leak.
 * (FRONTEND_FOUNDATION_PLAN.md §12)
 *
 * Never logged: OTP digits (start + end), full addresses, phone numbers, auth tokens,
 * cook personal details.
 */

export const REDACTED = '[REDACTED]';

/** Key names whose values are removed entirely, matched case-insensitively as substrings. */
const DENY_KEYS: readonly string[] = [
  'otp',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'password',
  'secret',
  'apikey',
  'phone',
  'mobile',
  'msisdn',
  'address',
  'addressline',
  'flat',
  'building',
  'landmark',
  'street',
  'area',
  'pincode',
  'postalcode',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'receivername',
  'receiverphone',
  'cookphone',
  'cookname',
  'email',
];

/** Value patterns scrubbed even when the key looks innocent. */
const VALUE_PATTERNS: readonly RegExp[] = [
  // Indian mobile numbers, with or without +91 / spaces / hyphens.
  /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g,
  // Bearer tokens and JWT-shaped strings.
  /Bearer\s+[\w.\-+/=]+/gi,
  /\beyJ[\w-]*\.[\w-]*\.[\w-]*/g,
];

const MAX_DEPTH = 6;

function isDeniedKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
  return DENY_KEYS.some((denied) => normalized.includes(denied));
}

function redactString(value: string): string {
  return VALUE_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, REDACTED), value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns a deep copy with denied keys and denied value patterns replaced.
 * Cycles and over-deep structures collapse to a marker rather than throwing.
 */
export function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > MAX_DEPTH) {
    return '[TRUNCATED]';
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
    };
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    return value.map((item) => redact(item, depth + 1, seen));
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);

    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = isDeniedKey(key) ? REDACTED : redact(item, depth + 1, seen);
    }
    return output;
  }

  // Functions, symbols, class instances — never logged verbatim.
  return `[${typeof value}]`;
}
