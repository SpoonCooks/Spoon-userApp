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
