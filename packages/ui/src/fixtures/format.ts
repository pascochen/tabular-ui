// Formatting for story fixtures. Hand-written; `kasane.ts` beside it is generated.
// Story data only: lint keeps src/fixtures/ out of library code.

const SYMBOL = { JPY: '¥', USD: '$', EUR: '€', GBP: '£', CNY: 'CN¥' } as const;
export type Currency = keyof typeof SYMBOL;

/**
 * Compact money: `¥34.4bn`, `¥355m`, `$48,216.40`, `-¥41m`. Yen never shows
 * decimals; billions keep one, millions keep none unless under ¥10m.
 */
export function money(value: number, currency: Currency = 'JPY'): string {
  const symbol = SYMBOL[currency];
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(1)}bn`;
  if (abs >= 1e7) return `${sign}${symbol}${Math.round(abs / 1e6)}m`;
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(1)}m`;
  const digits = currency === 'JPY' || Number.isInteger(abs) ? 0 : 2;
  return `${sign}${symbol}${abs.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/** Signed change for a delta column: `+7.9%`, `-13.9%`. */
export function percentChange(actual: number, base: number): string {
  const p = ((actual - base) / Math.abs(base)) * 100;
  return `${p >= 0 ? '+' : '-'}${Math.abs(p).toFixed(1)}%`;
}

/** Whole number with grouping: `221,381`. */
export function count(value: number): string {
  return value.toLocaleString('en-US');
}
