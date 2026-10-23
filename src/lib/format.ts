/**
 * Formatting and date helpers. Dates are ISO "YYYY-MM-DD" strings parsed as UTC
 * so results never depend on the viewer's time zone.
 */

const MS_PER_DAY = 86_400_000;

/**
 * Parse an ISO date string as UTC midnight.
 * @param iso "YYYY-MM-DD"
 * @returns epoch milliseconds
 * @throws Error when the string is not a valid ISO date
 */
export function parseISODate(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid ISO date: "${iso}"`);
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (new Date(ms).toISOString().slice(0, 10) !== iso) {
    throw new Error(`Invalid calendar date: "${iso}"`);
  }
  return ms;
}

/**
 * Whole days from `from` to `to`. Negative when `to` is earlier.
 * @param from ISO date
 * @param to ISO date
 */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to) - parseISODate(from)) / MS_PER_DAY);
}

/**
 * Format dollars with no cents, e.g. 151502 -> "$151,502".
 * @param amount dollars; negative values keep their sign
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a ratio as a whole percent, e.g. 0.5509 -> "55%".
 * @param ratio 0 to 1 (values outside the range are shown as is)
 */
export function formatPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Format an ISO date for display, e.g. "2026-10-22" -> "Oct 22, 2026".
 * @param iso ISO date
 */
export function formatDate(iso: string): string {
  return new Date(parseISODate(iso)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
