/**
 * Money formatting.
 *
 * The backend speaks INTEGER PAISE everywhere — quotes, price snapshots, refunds, tips,
 * extension SKUs. Nothing in this app stores or arithmetics money in rupees, because a float
 * rupee is how a total ends up a paisa off the amount actually charged.
 *
 * Dividing by 100 here is a UNIT CONVERSION for display, and it is the only place it happens.
 * It is not a calculation: no total is summed, no tax is added, no percentage is applied. Those
 * all belong to the server, which already did them.
 */

/** `13545` -> `"₹135.45"`; `19800` -> `"₹198"`. Whole rupees drop the decimals, as the frames draw. */
export function formatPaise(paise: number, currencySymbol = '₹'): string {
  const rupees = paise / 100;
  return `${currencySymbol}${Number.isInteger(rupees) ? rupees : rupees.toFixed(2)}`;
}

/**
 * `100000` -> `"₹1,000"`; `1000000` -> `"₹10,000"`; `12345678` -> `"₹1,23,456.78"`. The same
 * conversion as `formatPaise`, with Indian digit grouping, for amounts the frames draw grouped
 * (the Autopay sheet's "up to ₹1,000 per charge", Figma 2316:3580). Grouped by hand rather than
 * through `Intl`, whose `en-IN` grouping is not guaranteed on every Hermes build.
 */
export function formatPaiseGrouped(paise: number, currencySymbol = '₹'): string {
  const plain = formatPaise(Math.abs(paise), '');
  const [whole = '', fraction] = plain.split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = rest === '' ? last3 : `${rest},${last3}`;
  return `${paise < 0 ? '-' : ''}${currencySymbol}${grouped}${fraction === undefined ? '' : `.${fraction}`}`;
}
