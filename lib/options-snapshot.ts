import type { OptionContract } from './options-analysis';
/** Rank only the newest supplied volume observation for each side. Never sum dates. */
export function busiestStrike(rows: OptionContract[], type: 'call' | 'put', expiry: string) {
  const supplied = rows.filter(c => c.expiry === expiry && c.type === type && c.volume !== null && Number.isFinite(c.volume) && c.volume >= 0);
  const observed = supplied.map(c => c.observed).sort().at(-1);
  if (!observed) return null;
  const totals = new Map<number, number>();
  for (const c of new Map(supplied.filter(c => c.observed === observed).map(c => [c.id, c])).values())
    totals.set(c.strike, (totals.get(c.strike) ?? 0) + c.volume!);
  const ranked = [...totals].sort((a,b) => b[1]-a[1] || a[0]-b[0]);
  if (!ranked.length || ranked[0][1] === 0) return null;
  return { strike: ranked[0][0], volume: ranked[0][1], observed, tied: ranked.filter(x => x[1] === ranked[0][1]).length > 1 };
}
