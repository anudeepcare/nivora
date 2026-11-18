/** Closed projections of documented disclosures, never accuracy or return predictions. */
export type EvidenceKind = "clusters" | "calls";
type Row = Record<string, unknown>;
const object = (v: unknown): v is Row =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 200 ? v : null;
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const count = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v
    ? v
    : null;
export const evidenceSymbol = (v: unknown) =>
  typeof v === "string" && /^[A-Z][A-Z0-9.-]{0,14}$/.test(v) ? v : null;
export type Cluster = {
  ticker: string;
  companyName: string | null;
  insiderCount: number;
  tradeCount: number;
  totalShares: number;
  totalValue: number;
  firstBuyDate: string;
  lastBuyDate: string;
};
export type Call = {
  firm: string;
  analystName: string | null;
  attribution: "firm" | "analyst";
  priceTarget: number | null;
  priorPriceTarget: number | null;
  publishedOn: string;
  daysBeforeMove: number;
};
export type Move = {
  moveStartDate: string;
  moveEndDate: string;
  movePct: number;
  coveringFirms: number;
  revisedWithMove: number;
  revisedAgainstMove: number;
  leftUnchanged: number;
  calls: Call[];
};
export type Evidence = {
  kind: EvidenceKind;
  symbol: string;
  isPreview: boolean;
  sampleCompany: boolean;
  totalCount: number | null;
  clusters: Cluster[];
  moves: Move[];
};
export function projectEvidence(
  raw: unknown,
  kind: EvidenceKind,
  symbol: string,
  asOf = new Date().toISOString().slice(0, 10),
): Evidence | null {
  if (
    !date(asOf) ||
    !object(raw) ||
    typeof raw.isPreview !== "boolean" ||
    !evidenceSymbol(symbol)
  )
    return null;
  const out: Evidence = {
    kind,
    symbol,
    isPreview: raw.isPreview,
    sampleCompany: raw.sampleCompany === true,
    totalCount: count(raw.totalCount),
    clusters: [],
    moves: [],
  };
  if (kind === "clusters") {
    if (!Array.isArray(raw.data) || raw.data.length > 5000) return null;
    for (const row of raw.data) {
      if (!object(row) || !evidenceSymbol(row.ticker)) return null;
      if (row.ticker !== symbol) continue;
      const first = date(row.firstBuyDate),
        last = date(row.lastBuyDate),
        insiders = count(row.insiderCount),
        trades = count(row.tradeCount),
        shares = count(row.totalShares),
        value = num(row.totalValue);
      if (
        !first ||
        !last ||
        first > last ||
        last > asOf ||
        insiders === null ||
        insiders < 3 ||
        trades === null ||
        trades < insiders ||
        shares === null ||
        value === null ||
        value < 0
      )
        return null;
      out.clusters.push({
        ticker: symbol,
        companyName: text(row.companyName),
        insiderCount: insiders,
        tradeCount: trades,
        totalShares: shares,
        totalValue: value,
        firstBuyDate: first,
        lastBuyDate: last,
      });
    }
  } else {
    if (
      !object(raw.data) ||
      raw.data.ticker !== symbol ||
      !Array.isArray(raw.data.moves) ||
      raw.data.moves.length > 10
    )
      return null;
    for (const row of raw.data.moves) {
      if (!object(row)) return null;
      const start = date(row.moveStartDate),
        end = date(row.moveEndDate),
        pct = num(row.movePct),
        cover = count(row.coveringFirms),
        withMove = count(row.revisedWithMove),
        against = count(row.revisedAgainstMove),
        unchanged = count(row.leftUnchanged);
      if (
        !start ||
        !end ||
        start > end ||
        end > asOf ||
        pct === null ||
        [cover, withMove, against, unchanged].some((v) => v === null) ||
        !Array.isArray(row.calls) ||
        row.calls.length > 1000
      )
        return null;
      const calls: Call[] = [];
      for (const c of row.calls) {
        if (!object(c)) return null;
        const firm = text(c.firm),
          published = date(c.publishedOn),
          days = count(c.daysBeforeMove),
          name = text(c.analystName);
        if (
          !firm ||
          !published ||
          published > start ||
          published > asOf ||
          days === null ||
          !["firm", "analyst"].includes(String(c.attribution)) ||
          (c.attribution === "analyst" && !name)
        )
          return null;
        const target = num(c.priceTarget),
          prior = num(c.priorPriceTarget);
        calls.push({
          firm,
          analystName: name,
          attribution: c.attribution as Call["attribution"],
          priceTarget: target !== null && target > 0 ? target : null,
          priorPriceTarget: prior !== null && prior > 0 ? prior : null,
          publishedOn: published,
          daysBeforeMove: days,
        });
      }
      out.moves.push({
        moveStartDate: start,
        moveEndDate: end,
        movePct: pct,
        coveringFirms: cover!,
        revisedWithMove: withMove!,
        revisedAgainstMove: against!,
        leftUnchanged: unchanged!,
        calls,
      });
    }
  }
  return out;
}
