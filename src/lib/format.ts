/**
 * Shared display formatting for the payments screens.
 *
 * Kept out of the chart components so the cards, the tooltip, and the table
 * all render an amount the same way — a figure that reads ฿1,240 in one place
 * and 1240.00 THB in another looks like two different numbers.
 */

/** Currency, with decimals only when the amount actually has them. */
export function formatMoney(value: number, currency = 'THB'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'THB',
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);
}

/** Thousands-separated integer. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

/** One decimal place, with a trailing % — for success rate and deltas. */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Percentage change from `previous` to `current`.
 *
 * Returns null when there is no prior figure to compare against: "up 100%"
 * from a base of zero is not a meaningful claim, and the card says
 * "no prior data" instead of inventing a trend.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** A bucket date (YYYY-MM-DD) formatted for a day or month series. */
export function formatBucket(iso: string, bucket: string, long = false): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  if (bucket === 'month') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      year: long ? 'numeric' : '2-digit',
      timeZone: 'UTC'
    });
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(long ? { year: 'numeric' } : {}),
    timeZone: 'UTC'
  });
}

/** A full timestamp for tables — date plus time, in the viewer's locale. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
