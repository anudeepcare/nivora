export type KpiPoint = {
  date: string;
  time: number;
  value: number;
  estimate: boolean;
  period: string | null;
};
export type KpiSeries = {
  key: string;
  name: string;
  unit: string | null;
  source: string | null;
  discontinued: boolean;
  note: string | null;
  kind: "bar" | "line" | "points";
  points: KpiPoint[];
  omitted: number;
};
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null;
export function companyKpiSeries(data: unknown): KpiSeries[] {
  const today = new Date().toISOString().slice(0, 10);
  const root = object(data);
  if (!Array.isArray(root.kpis)) return [];
  return root.kpis.slice(0, 100).map((raw, index) => {
    const row = object(raw),
      values = Array.isArray(row.values) ? row.values : [],
      points = new Map<string, KpiPoint>(),
      conflicts = new Set<string>();
    let omitted = Math.max(0, values.length - 500);
    for (const rawPoint of values.slice(0, 500)) {
      const p = object(rawPoint),
        date = text(p.date),
        value = p.value;
      const time =
        date && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? Date.parse(date + "T00:00:00Z")
          : NaN;
      if (
        !date ||
        !Number.isFinite(time) ||
        new Date(time).toISOString().slice(0, 10) !== date ||
        (date > today && p.isEstimate !== true) ||
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        Math.abs(value) > 1e100
      ) {
        omitted++;
        continue;
      }
      const point = {
        date,
        time,
        value,
        estimate: p.isEstimate === true,
        period: text(p.period),
      };
      if (conflicts.has(date)) {
        omitted++;
        continue;
      }
      const prior = points.get(date);
      if (prior) {
        if (prior.value !== point.value || prior.estimate !== point.estimate) {
          points.delete(date);
          conflicts.add(date);
          omitted += 2;
        } else omitted++;
        continue;
      }
      points.set(date, point);
    }
    const type = text(row.chartType)?.toLowerCase();
    return {
      key: `${index}:${text(row.id) ?? ""}`,
      name: text(row.name) ?? text(row.id) ?? "Operating metric",
      unit: text(row.unit),
      source: text(row.sourceRef),
      discontinued: row.discontinued === true,
      note: text(row.discontinuedNote),
      kind: type === "bar" ? "bar" : type === "line" ? "line" : "points",
      points: [...points.values()].sort((a, b) => a.time - b.time),
      omitted,
    } as KpiSeries;
  });
}
