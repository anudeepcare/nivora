export type AccountBalances = { margin_debt: number; managed_value: number | null; updated_at?: string };
export function cleanAccountBalances(value: unknown): AccountBalances {
  const v = value as Record<string, unknown> | null;
  if (!v || typeof v !== 'object') throw Error('Enter valid account balances.');
  const valid = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1e12;
  if (!valid(v.margin_debt) || (v.managed_value !== null && !valid(v.managed_value))) throw Error('Use non-negative USD amounts; leave managed investments blank if unknown.');
  return { margin_debt: Math.round(v.margin_debt * 100) / 100, managed_value: v.managed_value === null ? null : Math.round((v.managed_value as number) * 100) / 100 };
}
export function accountEquity(pricedAssets: number, balances: AccountBalances) {
  return pricedAssets + (balances.managed_value ?? 0) - balances.margin_debt;
}
