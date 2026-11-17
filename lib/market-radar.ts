import type { Candle, Research } from "./types";

export type RadarQuadrant =
  | "Leading"
  | "Improving"
  | "Weakening"
  | "Lagging"
  | "In line";
export type RadarCompany = {
  symbol: string;
  name: string;
  sector: string;
  observations: number;
  above20: boolean;
  return20: number | null;
  return60: number | null;
  relative20: number | null;
  relative60: number | null;
  quadrant: RadarQuadrant | null;
};
export type RadarSector = {
  sector: string;
  loaded: number;
  eligible: number;
  above20Pct: number | null;
  rotationEligible: number;
  return20: number | null;
  return60: number | null;
  relative20: number | null;
  relative60: number | null;
  quadrant: RadarQuadrant | null;
};
export type MarketRadarModel = {
  asOf: string | null;
  start20: string | null;
  start60: string | null;
  loaded: number;
  breadthEligible: number;
  rotationEligible: number;
  excluded: number;
  benchmark: { return20: number; return60: number; count: number } | null;
  companies: RadarCompany[];
  sectors: RadarSector[];
  exclusions: { symbol: string; reason: string }[];
};
const dayMs = 86_400_000;
function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
function clean(history: Candle[], cutoff: string) {
  const counts = new Map<string, number>();
  for (const bar of history)
    counts.set(bar.time, (counts.get(bar.time) ?? 0) + 1);
  return history
    .filter((bar) => {
      if (
        !validDate(bar.time) ||
        bar.time > cutoff ||
        counts.get(bar.time) !== 1
      )
        return false;
      const weekday = new Date(bar.time).getUTCDay();
      if (weekday === 0 || weekday === 6) return false;
      return (
        [bar.open, bar.high, bar.low, bar.close].every(
          (n) => Number.isFinite(n) && n > 0,
        ) &&
        bar.high >= Math.max(bar.open, bar.close, bar.low) &&
        bar.low <= Math.min(bar.open, bar.close)
      );
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}
function cutoffDate(asOf?: string): string | null {
  if (asOf !== undefined && !validDate(asOf)) return null;
  // A date alone cannot establish that today's session has completed.
  const yesterday = new Date(Date.now() - dayMs).toISOString().slice(0, 10);
  return asOf && asOf < yesterday ? asOf : yesterday;
}
function unique(research: Research[]) {
  return [
    ...new Map(
      research.map((item) => [item.company.symbol.trim().toUpperCase(), item]),
    ).values(),
  ];
}
function usable(item: Research) {
  return !item.demo && item.company.assetType === "stock";
}
/** Available completed weekday checkpoints from supplied stock history; no fetching. */
export function radarCheckpoints(
  research: Research[],
  asOf?: string,
): string[] {
  const cutoff = cutoffDate(asOf);
  if (!cutoff) return [];
  return [
    ...new Set(
      unique(research)
        .filter(usable)
        .flatMap((item) => clean(item.history, cutoff).map((bar) => bar.time)),
    ),
  ].sort();
}
function dense(bars: Candle[], count: number) {
  if (bars.length < count) return false;
  const sample = bars.slice(-count);
  const span =
    (Date.parse(sample.at(-1)!.time) - Date.parse(sample[0].time)) / dayMs;
  // Daily series must cover at least 80% of weekdays, with no gap over one week.
  if (span > count * 1.8) return false;
  let weekdays = 0;
  for (
    let time = Date.parse(sample[0].time);
    time <= Date.parse(sample.at(-1)!.time);
    time += dayMs
  ) {
    if (![0, 6].includes(new Date(time).getUTCDay())) weekdays++;
  }
  return (
    count / weekdays >= 0.8 &&
    sample.every(
      (bar, i) =>
        i === 0 ||
        Date.parse(bar.time) - Date.parse(sample[i - 1].time) <= 7 * dayMs,
    )
  );
}
function change(end: number, start: number | undefined): number | null {
  if (start === undefined || start <= 0) return null;
  const value = (end / start - 1) * 100;
  return Number.isFinite(value) ? value : null;
}
function quadrant(short: number, long: number): RadarQuadrant {
  const epsilon = 1e-8;
  if (Math.abs(short) < epsilon && Math.abs(long) < epsilon) return "In line";
  if (long >= 0) return short >= 0 ? "Leading" : "Weakening";
  return short >= 0 ? "Improving" : "Lagging";
}
function mean(values: number[]) {
  const scale = values.reduce(
    (maximum, value) => Math.max(maximum, Math.abs(value)),
    0,
  );
  if (!scale) return 0;
  const normalized =
    values.reduce((sum, value) => sum + value / scale, 0) / values.length;
  return Math.max(-1, Math.min(1, normalized)) * scale;
}

/** Equal-weight price comparisons within the loaded sample, never market-wide breadth. */
export function buildMarketRadar(
  research: Research[],
  asOf?: string,
): MarketRadarModel {
  const items = unique(research);
  const dates = radarCheckpoints(items, asOf);
  const end = dates.at(-1) ?? null;
  const start20 = dates.at(-21) ?? null;
  const start60 = dates.at(-61) ?? null;
  const model: MarketRadarModel = {
    asOf: end,
    start20,
    start60,
    loaded: items.length,
    breadthEligible: 0,
    rotationEligible: 0,
    excluded: items.length,
    benchmark: null,
    companies: [],
    sectors: [],
    exclusions: [],
  };
  const sectorCounts = new Map<string, number>();
  for (const item of items) {
    const sector = item.company.sector?.trim() || "Unclassified";
    sectorCounts.set(sector, (sectorCounts.get(sector) ?? 0) + 1);
    const symbol = item.company.symbol;
    const exclude = (reason: string) =>
      model.exclusions.push({ symbol, reason });
    if (!usable(item)) {
      exclude(
        item.demo ? "Demonstration data" : "Requires weekday stock history",
      );
      continue;
    }
    if (!end) {
      exclude("No completed valid daily history");
      continue;
    }
    const bars = clean(item.history, end);
    if (bars.at(-1)?.time !== end) {
      exclude("No valid bar on the checkpoint");
      continue;
    }
    if (!dense(bars, 20)) {
      exclude("Requires 20 dense daily observations");
      continue;
    }
    const close = bars.at(-1)!.close;
    // Scale before averaging so finite prices cannot overflow the sum.
    const average20 = mean(bars.slice(-20).map((bar) => bar.close));
    const byDate = new Map(bars.map((bar) => [bar.time, bar.close]));
    const return20 =
      start20 &&
      dense(
        bars.filter((bar) => bar.time >= start20),
        21,
      )
        ? change(close, byDate.get(start20))
        : null;
    const return60 =
      start60 &&
      dense(
        bars.filter((bar) => bar.time >= start60),
        61,
      )
        ? change(close, byDate.get(start60))
        : null;
    model.companies.push({
      symbol,
      name: item.company.name,
      sector,
      observations: bars.length,
      above20: close > average20,
      return20,
      return60,
      relative20: null,
      relative60: null,
      quadrant: null,
    });
  }
  const rotation = model.companies.filter(
    (item) => item.return20 !== null && item.return60 !== null,
  );
  model.breadthEligible = model.companies.length;
  model.rotationEligible = rotation.length;
  model.excluded = model.loaded - model.breadthEligible;
  if (rotation.length >= 2) {
    model.benchmark = {
      return20: mean(rotation.map((item) => item.return20!)),
      return60: mean(rotation.map((item) => item.return60!)),
      count: rotation.length,
    };
    for (const item of rotation) {
      item.relative20 = item.return20! - model.benchmark.return20;
      item.relative60 = item.return60! - model.benchmark.return60;
      item.quadrant = quadrant(item.relative20, item.relative60);
    }
  }
  model.sectors = [...sectorCounts]
    .map(([sector, loaded]) => {
      const members = model.companies.filter((item) => item.sector === sector);
      const comparable = members.filter(
        (item) => item.return20 !== null && item.return60 !== null,
      );
      const return20 = comparable.length
        ? mean(comparable.map((item) => item.return20!))
        : null;
      const return60 = comparable.length
        ? mean(comparable.map((item) => item.return60!))
        : null;
      const relative20 =
        return20 !== null && model.benchmark
          ? return20 - model.benchmark.return20
          : null;
      const relative60 =
        return60 !== null && model.benchmark
          ? return60 - model.benchmark.return60
          : null;
      return {
        sector,
        loaded,
        eligible: members.length,
        above20Pct: members.length
          ? (members.filter((item) => item.above20).length / members.length) *
            100
          : null,
        rotationEligible: comparable.length,
        return20,
        return60,
        relative20,
        relative60,
        quadrant:
          relative20 !== null && relative60 !== null
            ? quadrant(relative20, relative60)
            : null,
      };
    })
    .sort((a, b) => a.sector.localeCompare(b.sector));
  return model;
}
