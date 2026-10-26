/**
 * Money, formatted the way the library's stories format it (the rules of
 * packages/ui/src/fixtures/format.ts, which the site may not import:
 * fixtures are story data and are not in the package). tests/format.spec.ts
 * runs both on the same inputs and fails if they part.
 *
 * Two forms (docs/site.md D5): `money()` is compact, for prose and single
 * figures. `exactMoney()` is for figures shown beside their parts, where a
 * total must equal its displayed parts.
 */
const SYMBOL = { JPY: '¥', USD: '$', EUR: '€', GBP: '£', CNY: 'CN¥' } as const;
export type Currency = keyof typeof SYMBOL;

export function isCurrency(code: string): code is Currency {
  return code in SYMBOL;
}

/** Compact: `¥34.4bn`, `¥355m`, `$48,216.40`, `-¥41m`. */
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

/** Exact, with thousands separators: `¥316,748,831`, `$48,216.40`. */
export function exactMoney(value: number, currency: Currency = 'JPY'): string {
  const abs = Math.abs(value);
  const digits = currency === 'JPY' ? 0 : 2;
  const sign = value < 0 ? '-' : '';
  return `${sign}${SYMBOL[currency]}${abs.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
