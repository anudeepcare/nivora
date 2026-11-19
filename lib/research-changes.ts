import type { Research } from "./types";
import { selectPriceReference } from "./price-reference.ts";
import { consensusOutlook } from "./outlook.ts";
export type VisitSnapshot = {
  version: 1;
  symbol: string;
  currency: string;
  seenAt: string;
  price: { value: number; date: string } | null;
  pace: {
    level: number;
    policy: string;
    date: string;
    source: string | null;
  } | null;
  estimate: { end: string; eps: number } | null;
  target: number | null;
  dataset: { source: string; date: string } | null;
};
export type ResearchChange = {
  label: string;
  detail: string;
  destination: "Technicals" | "Analysts";
};
const positive = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x > 0;
const dated = (x: unknown): x is string =>
  typeof x === "string" && Number.isFinite(Date.parse(x));
/** Local, public research observations only. Corrupt or incompatible storage is ignored. */
export function parseVisitSnapshot(
  raw: string | null,
  now: number,
): VisitSnapshot | null {
  if (!raw || raw.length > 8192 || !Number.isFinite(now)) return null;
  try {
    const x = JSON.parse(raw);
    if (
      !x ||
      x.version !== 1 ||
      typeof x.symbol !== "string" ||
      !/^[A-Z0-9./-]{1,30}$/.test(x.symbol) ||
      typeof x.currency !== "string" ||
      !/^[A-Z]{3}$/.test(x.currency) ||
      !dated(x.seenAt) ||
      Date.parse(x.seenAt) > now ||
      now - Date.parse(x.seenAt) > 90 * 86400000
    )
      return null;
    if (
      x.price !== null &&
      (!x.price ||
        !positive(x.price.value) ||
        !dated(x.price.date) ||
        Date.parse(x.price.date) > now + 60000)
    )
      return null;
    if (
      x.pace !== null &&
      (!x.pace ||
        !Number.isInteger(x.pace.level) ||
        x.pace.level < 0 ||
        x.pace.level > 4 ||
        typeof x.pace.policy !== "string" ||
        x.pace.policy.length > 40 ||
        !dated(x.pace.date) ||
        Date.parse(x.pace.date) > now ||
        (x.pace.source !== null &&
          (typeof x.pace.source !== "string" || x.pace.source.length > 120)))
    )
      return null;
    if (
      x.estimate !== null &&
      (!x.estimate || !positive(x.estimate.eps) || !dated(x.estimate.end))
    )
      return null;
    if (
      x.dataset !== null &&
      (!x.dataset ||
        typeof x.dataset.source !== "string" ||
        x.dataset.source.length > 120 ||
        !dated(x.dataset.date) ||
        Date.parse(x.dataset.date) > now + 86400000)
    )
      return null;
    if (x.target !== null && !positive(x.target)) return null;
    return x as VisitSnapshot;
  } catch {
    return null;
  }
}
export function researchVisitSnapshot(
  r: Research,
  pace: VisitSnapshot["pace"],
  now: number,
): VisitSnapshot {
  const reference = selectPriceReference(r, now);
  const estimate = (r.evidence?.estimates ?? [])
    .filter(
      (x) =>
        /annual/i.test(x.frequency) &&
        x.currency === r.quote.currency &&
        positive(x.eps) &&
        dated(x.date) &&
        Date.parse(x.date) > now,
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return {
    version: 1,
    symbol: r.company.symbol,
    currency: r.quote.currency,
    seenAt: new Date(now).toISOString(),
    price: reference ? { value: reference.price, date: reference.asOf } : null,
    pace,
    estimate: estimate ? { end: estimate.date, eps: estimate.eps! } : null,
    target: consensusOutlook(r)?.target ?? null,
    dataset:
      r.evidence?.source &&
      dated(r.evidence.updatedAt) &&
      Date.parse(r.evidence.updatedAt) <= now + 86400000
        ? { source: r.evidence.source, date: r.evidence.updatedAt }
        : null,
  };
}
export function researchChanges(
  before: VisitSnapshot,
  next: VisitSnapshot,
): ResearchChange[] {
  if (before.symbol !== next.symbol || before.currency !== next.currency)
    return [];
  const rows: ResearchChange[] = [];
  const comparableDataset =
    before.dataset &&
    next.dataset &&
    before.dataset.source === next.dataset.source &&
    Date.parse(next.dataset.date) >= Date.parse(before.dataset.date);
  const signed = (x: number) => (x > 0 ? "+" : "") + x.toFixed(1) + "%";
  if (
    before.pace &&
    next.pace &&
    before.pace.policy === next.pace.policy &&
    before.pace.source !== null &&
    before.pace.source === next.pace.source &&
    Date.parse(next.pace.date) >= Date.parse(before.pace.date) &&
    before.pace.level !== next.pace.level
  )
    rows.push({
      label: "Pace",
      detail: `P${before.pace.level} → P${next.pace.level}`,
      destination: "Technicals",
    });
  if (
    comparableDataset &&
    before.estimate &&
    next.estimate &&
    before.estimate.end === next.estimate.end
  ) {
    const gap = (next.estimate.eps / before.estimate.eps - 1) * 100;
    if (Number.isFinite(gap) && Math.abs(gap) >= 2)
      rows.push({
        label: `EPS estimate · FY${next.estimate.end.slice(0, 4)}`,
        detail: signed(gap),
        destination: "Analysts",
      });
  }
  if (comparableDataset && before.target && next.target) {
    const gap = (next.target / before.target - 1) * 100;
    if (Number.isFinite(gap) && Math.abs(gap) >= 2)
      rows.push({
        label: "Analyst consensus",
        detail: signed(gap),
        destination: "Analysts",
      });
  }
  if (
    before.price &&
    next.price &&
    Date.parse(next.price.date) > Date.parse(before.price.date)
  ) {
    const gap = (next.price.value / before.price.value - 1) * 100;
    if (Number.isFinite(gap) && Math.abs(gap) >= 3)
      rows.push({
        label: "Price",
        detail: signed(gap),
        destination: "Technicals",
      });
  }
  return rows.slice(0, 3);
}
