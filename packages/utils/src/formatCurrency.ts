/**
 * Format a number as Indian Rupees (INR) currency.
 */
export function formatCurrency(
  amount: number,
  options?: {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  const safeAmount = (amount == null || isNaN(amount)) ? 0 : amount;
  const {
    locale = 'en-IN',
    currency = 'INR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options || {};

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(safeAmount);
}

/**
 * Parse a currency string back to a number.
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format a number with comma separators (Indian numbering).
 */
export function formatNumber(value: number, locale: string = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a number in compact notation (e.g., 1.2K, 4.8M).
 */
export function formatCompact(value: number): string {
  if (value >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
