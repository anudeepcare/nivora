import { evidenceMemo } from "./evidence-memo.ts";
import type { Research } from "./types";
import { latestFinancialEvidence, indicators } from "./analysis.ts";
import {
  marketMultiples,
  reportedCashPerShare,
  financialCase,
  comparableGrowth,
} from "./research-summary.ts";
import { ratio } from "./financial-formulas.ts";
import { priceStudies } from "./price-studies.ts";
export const DECISION_VERSION = "evidence-lenses-v1";
export const styles = {
  Balanced: [1, 1, 1, 1, 1, 1, 1, 1],
  Value: [3, 1, 0.5, 1.5, 1.5, 1, 0.5, 0.5],
  Growth: [0.5, 1.5, 3, 1, 1, 0.3, 1.5, 0.7],
  Income: [1.5, 1, 0.5, 1.5, 1.5, 3, 1, 0.5],
  Quality: [0.7, 2.5, 1, 1.5, 2, 0.5, 2.5, 0.3],
} as const;
export type ResearchStyle = keyof typeof styles;
export type EvidenceMetric = {
  id: string;
  label: string;
  value: number | null;
  unit: "percent" | "ratio" | "money" | "days";
  reason: string;
  score: number | null;
};
export type EvidenceLens = {
  id: string;
  name: string;
  score: number | null;
  metrics: EvidenceMetric[];
  note: string;
};
export type ModelInput = {
  cashFlow: number;
  growth: number;
  discount: number;
  terminal: number;
};
export function fadeDcf(p: ModelInput): number | null {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.cashFlow <= 0 ||
    p.growth <= -100 ||
    p.discount <= 0 ||
    p.discount - p.terminal < 1 ||
    p.terminal < 0 ||
    p.growth > 100 ||
    p.discount > 100
  )
    return null;
  let f = p.cashFlow,
    pv = 0;
  for (let t = 1; t <= 10; t++) {
    const g = p.growth - ((p.growth - p.terminal) * (t - 1)) / 9;
    f *= 1 + g / 100;
    pv += f / (1 + p.discount / 100) ** t;
  }
  const v =
    pv +
    (f * (1 + p.terminal / 100)) /
      ((p.discount - p.terminal) / 100) /
      (1 + p.discount / 100) ** 10;
  return Number.isFinite(v) && v > 0 ? v : null;
}
function bisect(
  fn: (n: number) => number | null,
  target: number,
  low: number,
  high: number,
  increasing: boolean,
) {
  if (!Number.isFinite(target) || target <= 0) return null;
  const a = fn(low),
    b = fn(high);
  if (
    a == null ||
    b == null ||
    target < Math.min(a, b) ||
    target > Math.max(a, b)
  )
    return null;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2,
      v = fn(mid);
    if (v == null) return null;
    if (v < target === increasing) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
export const solveDcfGrowth = (p: ModelInput, price: number) =>
  bisect((g) => fadeDcf({ ...p, growth: g }), price, -10, 40, true);
export const solveDcfReturn = (p: ModelInput, price: number) =>
  bisect(
    (d) => fadeDcf({ ...p, discount: d }),
    price,
    Math.max(p.terminal + 1, 1),
    40,
    false,
  );
export function anchorScore(
  value: number | null | undefined,
  anchors: readonly (readonly [number, number])[],
): number | null {
  if (value == null || !Number.isFinite(value) || anchors.length < 2)
    return null;
  const a = [...anchors].sort((x, y) => x[0] - y[0]);
  if (value <= a[0][0]) return a[0][1];
  if (value >= a.at(-1)![0]) return a.at(-1)![1];
  for (let i = 1; i < a.length; i++)
    if (value <= a[i][0])
      return (
        a[i - 1][1] +
        ((value - a[i - 1][0]) / (a[i][0] - a[i - 1][0])) *
          (a[i][1] - a[i - 1][1])
      );
  return null;
}
const percent = (a: number | null | undefined, b: number | null | undefined) =>
  ratio(a, b, 100);
const change = (a: number | null | undefined, b: number | null | undefined) =>
  a != null && b != null && b > 0 ? (a / b - 1) * 100 : null;
const mean = (x: number[]) =>
  x.length ? x.reduce((a, b) => a + b, 0) / x.length : null;
function computeResearchDecision(
  r: Research,
  style: ResearchStyle = "Balanced",
) {
  const e = latestFinancialEvidence(r),
    p = e.latest,
    q = e.prior,
    m = marketMultiples(r, p),
    reported = reportedCashPerShare(r,p),
    special = /bank|insurance|reit|real estate investment trust/i.test(
      [r.company.sector, r.evidence?.profile?.industry].join(" "),
    );
  const period = p?.end ?? null;
  const avgAssets =
      p?.assets != null && q?.assets != null && p.assets > 0 && q.assets > 0
        ? (p.assets + q.assets) / 2
        : null,
    avgEquity =
      p?.equity != null && q?.equity != null && p.equity > 0 && q.equity > 0
        ? (p.equity + q.equity) / 2
        : null;
  const accruals =
    p?.netIncome != null && p.operatingCashFlow != null
      ? percent(p.netIncome - p.operatingCashFlow, avgAssets)
      : null;
  const ownerCash =
    p?.fcf != null && p.stockCompensation != null
      ? p.fcf - p.stockCompensation
      : null;
  const yoy = p && q ? comparableGrowth(p, q) : null,
    shareGrowth = change(p?.weightedShares, q?.weightedShares);
  const three = e.rows
    .filter(
      (x) =>
        p &&
        x.currency === p.currency &&
        x.basis === p.basis &&
        Date.parse(p.end) - Date.parse(x.end) >= 1000 * 86400000 &&
        Date.parse(p.end) - Date.parse(x.end) <= 1200 * 86400000,
    )
    .at(-1);
  const cagr =
    p?.revenue != null &&
    three?.revenue != null &&
    p.revenue > 0 &&
    three.revenue > 0
      ? ((p.revenue / three.revenue) **
          (1 /
            ((Date.parse(p.end) - Date.parse(three.end)) / 86400000 / 365.25)) -
          1) *
        100
      : null;
  const metric = (
    id: string,
    label: string,
    value: number | null | undefined,
    unit: EvidenceMetric["unit"],
    reason: string,
    anchors?: readonly (readonly [number, number])[],
  ): EvidenceMetric => ({
    id,
    label,
    value: value != null && Number.isFinite(value) ? value : null,
    unit,
    reason,
    score: special ? null : anchors ? anchorScore(value, anchors) : null,
  });
  const lenses: EvidenceLens[] = [
    {
      id: "value",
      name: "Valuation",
      score: null,
      note: "Absolute screening anchors; no peer or historical percentile is inferred.",
      metrics: [
        metric(
          "fcfy",
          "FCF yield",
          m.fcfYield,
          "percent",
          "Operating cash flow less capex divided by matched market capitalization. Negative values indicate cash use.",
          [
            [0, 0],
            [2, 4],
            [4, 7],
            [7, 10],
          ],
        ),
        metric(
          "pe",
          "P/E · TTM",
          m.pe,
          "ratio",
          "Withheld for non-positive earnings or unreconciled shares/currency.",
        ),
        metric(
          "pfcf",
          "Price / FCF",
          m.pfcf,
          "ratio",
          "Not meaningful when cash flow is non-positive.",
        ),
        metric(
          "ps",
          "Price / sales",
          m.ps,
          "ratio",
          "Sales are not profits; sector margins matter.",
        ),
      ],
    },
    {
      id: "profit",
      name: "Profitability",
      score: null,
      note: "Reported margins and returns; high margins alone do not prove a moat.",
      metrics: [
        metric(
          "margin",
          "Operating margin",
          p?.margin,
          "percent",
          "Operating income / revenue.",
          [
            [-10, 0],
            [0, 4],
            [15, 7],
            [30, 10],
          ],
        ),
        metric(
          "gross",
          "Gross margin",
          p?.grossMargin,
          "percent",
          "Gross profit / revenue.",
        ),
        metric(
          "fcfm",
          "FCF margin",
          p?.fcfMargin,
          "percent",
          "OCF less capex / revenue.",
          [
            [-10, 0],
            [0, 4],
            [10, 7],
            [25, 10],
          ],
        ),
        metric(
          "roe",
          "ROE",
          percent(p?.netIncome, avgEquity),
          "percent",
          "Net income / average year-end equity; negative equity is not scored.",
        ),
        metric(
          "roa",
          "ROA",
          percent(p?.netIncome, avgAssets),
          "percent",
          "Net income / average year-end assets.",
        ),
      ],
    },
    {
      id: "growth",
      name: "Growth",
      score: null,
      note: "Compares matching currency, accounting basis and approximately one-year reporting intervals.",
      metrics: [
        metric(
          "revg",
          "Revenue growth · YoY",
          yoy,
          "percent",
          "Latest period versus the comparable prior period.",
          [
            [-5, 0],
            [3, 4],
            [10, 7],
            [20, 10],
          ],
        ),
        metric(
          "cagr",
          "Revenue CAGR · 3Y",
          cagr,
          "percent",
          "Positive revenue endpoints across approximately three years.",
        ),
        metric(
          "fcfg",
          "FCF growth · YoY",
          change(p?.fcf, q?.fcf),
          "percent",
          "Only shown with a positive prior cash-flow base.",
        ),
        metric(
          "perShare",
          "Revenue / share growth",
          p && q
            ? change(
                ratio(p.revenue, p.weightedShares),
                ratio(q.revenue, q.weightedShares),
              )
            : null,
          "percent",
          "Uses weighted-average diluted shares from each matching period.",
        ),
      ],
    },
    {
      id: "health",
      name: "Financial health",
      score: null,
      note: "Liquidity and debt-servicing screens; these do not estimate default probabilities.",
      metrics: [
        metric(
          "current",
          "Current ratio",
          p?.currentRatio,
          "ratio",
          "Current assets / current liabilities.",
          [
            [0.5, 0],
            [1, 4],
            [1.5, 7],
            [2.5, 10],
          ],
        ),
        metric(
          "interest",
          "Interest coverage",
          p?.interestCoverage,
          "ratio",
          "Operating income / interest expense. No invented 99× for debt-free firms.",
          [
            [1.5, 0],
            [3, 4],
            [8, 7],
            [15, 10],
          ],
        ),
        metric(
          "netdebt",
          "Net debt",
          p?.netDebt,
          "money",
          "Reported debt less cash, not a leverage ratio.",
        ),
        metric(
          "de",
          "Debt / equity",
          p?.debtEquity,
          "ratio",
          "Withheld when book equity is non-positive.",
        ),
      ],
    },
    {
      id: "cash",
      name: "Cash quality",
      score: null,
      note: "SBC-adjusted FCF is a sensitivity proxy, not the cash owners literally receive.",
      metrics: [
        metric(
          "convert",
          "OCF / net income",
          p?.cashConversion,
          "ratio",
          "Cash generated by operations relative to positive accounting profit.",
          [
            [0, 0],
            [0.5, 4],
            [0.8, 7],
            [1.1, 10],
          ],
        ),
        metric(
          "sbc",
          "Stock pay / revenue",
          p?.sbcRevenue,
          "percent",
          "Check net dilution and buyback costs alongside this expense.",
          [
            [1, 10],
            [5, 7],
            [10, 4],
            [20, 0],
          ],
        ),
        metric(
          "accruals",
          "Accruals / average assets",
          accruals,
          "percent",
          "(Net income − OCF) / average assets.",
          [
            [-3, 10],
            [2, 7],
            [8, 4],
            [15, 0],
          ],
        ),
        metric(
          "owner",
          "FCF less stock pay",
          ownerCash,
          "money",
          "Illustrative deduction of reported SBC; not a GAAP cash-flow measure.",
        ),
        metric(
          "ownerYield",
          "SBC-adjusted FCF yield",
          percent(ownerCash, m.marketCap),
          "percent",
          "(FCF − stock compensation) / matched market capitalization.",
        ),
      ],
    },
    {
      id: "returns",
      name: "Owner returns",
      score: null,
      note: "Capital returned is useful only when funded sustainably. Dividend/share totals are not total return.",
      metrics: [
        metric(
          "dilution",
          "Share count change · YoY",
          shareGrowth,
          "percent",
          "Weighted-average diluted share count change; buybacks and issuance both matter.",
          [
            [-3, 10],
            [0, 7],
            [3, 4],
            [10, 0],
          ],
        ),
        metric(
          "dividend",
          "Dividend cash / FCF",
          p?.dividends != null ? percent(Math.abs(p.dividends), p.fcf) : null,
          "percent",
          "Reported dividend cash against positive cash flow.",
        ),
        metric(
          "buyback",
          "Buyback cash",
          p?.buybacks,
          "money",
          "Reported repurchases; not inferred from financing cash flow.",
        ),
      ],
    },
    {
      id: "moat",
      name: "Business moat",
      score: null,
      note: "Requires cited competitive evidence. Margin persistence, company descriptions and AI prose cannot establish switching costs, network effects or pricing power.",
      metrics: [],
    },
    {
      id: "sentiment",
      name: "Ownership & expectations",
      score: null,
      note: "Reported consensus and holdings are observations. They do not establish who is buying now or that a stock is attractive.",
      metrics: [
        metric(
          "institutions",
          "Reported institutional ownership",
          r.evidence?.ownership?.institutions,
          "percent",
          "Provider snapshot; reporting dates and coverage vary.",
        ),
        metric(
          "insiders",
          "Reported insider ownership",
          r.evidence?.ownership?.insiders,
          "percent",
          "Ownership percentage, not transaction activity.",
        ),
        metric(
          "target",
          "Analyst target",
          r.evidence?.consensus?.target,
          "money",
          "Published opinion; horizon and dispersion may be unavailable.",
        ),
      ],
    },
  ];
  for (const l of lenses)
    l.score = mean(
      l.metrics.flatMap((x) => (x.score == null ? [] : [x.score])),
    );
  const weights = styles[style],
    scored = lenses.flatMap((x, i) =>
      x.score == null ? [] : [{ s: x.score, w: weights[i] }],
    );
  const overall =
    scored.length >= 4
      ? scored.reduce((a, x) => a + x.s * x.w, 0) /
        scored.reduce((a, x) => a + x.w, 0)
      : null;
  const flags: { id: string; title: string; text: string; severe: boolean }[] =
    [];
  const check = (
    id: string,
    value: number | null | undefined,
    hit: (n: number) => boolean,
    title: string,
    text: string,
    severe = false,
  ) => {
    if (value != null && Number.isFinite(value) && hit(value))
      flags.push({ id, title, text, severe });
  };
  check(
    "cash",
    p?.fcf,
    (n) => n < 0,
    "Cash use after investment",
    "Review funding requirements and capital spending before scaling a position.",
  );
  check(
    "interest",
    p?.interestCoverage,
    (n) => n < 2,
    "Thin interest buffer",
    "Operating profit covers interest fewer than twice.",
    true,
  );
  check(
    "margin",
    p?.margin,
    (n) => n < 0,
    "Operating losses",
    "Revenue growth has not yet produced operating profitability.",
  );
  check(
    "sbc",
    p?.sbcRevenue,
    (n) => n > 10,
    "High equity compensation",
    "Stock pay exceeds 10% of reported revenue.",
  );
  check(
    "dilution",
    shareGrowth,
    (n) => n >= 3,
    "Dilution to monitor",
    "Weighted diluted shares increased at least 3% over the comparable period.",
  );
  check(
    "accruals",
    accruals,
    (n) => n > 10,
    "Profit and cash diverge",
    "Accruals exceed 10% of average assets.",
  );
  check(
    "liquidity",
    p?.currentRatio,
    (n) => n < 1,
    "Near-term liquidity review",
    "Current assets are below current liabilities; sector and cash-generation context matter.",
  );
  flags.sort((a, b) => Number(b.severe) - Number(a.severe));
  const { studies, technical, bars, volatility, maxDrawdown, range } =
    decisionHistory(r);
  const next = (r.evidence?.earnings ?? [])
    .filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const fcase = financialCase(p, q);
  const tripwires = lenses
    .flatMap((x) => x.metrics)
    .filter(
      (x) =>
        ["current", "interest", "sbc", "margin"].includes(x.id) &&
        x.value != null,
    )
    .map((x) => {
      const threshold =
        x.id === "current"
          ? 1
          : x.id === "interest"
            ? 2
            : x.id === "sbc"
              ? 10
              : 0;
      const high = x.id === "sbc";
      const distance = high ? threshold - x.value! : x.value! - threshold;
      return {
        id: x.id,
        label: x.label,
        value: x.value!,
        unit: x.unit,
        threshold,
        direction: high ? "above" : "below",
        breached: distance <= 0,
        headroom:
          x.value === 0
            ? null
            : Math.max(0, (distance / Math.abs(x.value!)) * 100),
      };
    });
  const gaps = [
    ...(!p ? ["Comparable financial statements"] : []),
    ...lenses.filter((x) => x.score == null).map((x) => x.name),
    ...(special ? ["Specialist sector scoring"] : []),
  ];
  return {
    version: DECISION_VERSION,
    style,
    period,
    currency: p?.currency ?? r.quote.currency,
    lenses,
    overall,
    scoredLenses: scored.length,
    metricsAvailable: lenses
      .flatMap((x) => x.metrics)
      .filter((x) => x.value != null).length,
    flags,
    gaps,
    tripwires,
    forCase: fcase.positive.slice(0, 3),
    against: fcase.risks.slice(0, 3),
    description: r.company.description || r.evidence?.profile?.description || "",
    sector: r.company.sector || r.evidence?.profile?.sector || "",
    nextReport: next?.date ?? null,
    stance: flags.some((x) => x.severe)
      ? "Resolve financing risk first"
      : !p
        ? "Build the evidence first"
        : p.margin != null && p.margin > 0 && p.fcf != null && p.fcf > 0
          ? "Profitable, cash-generating business"
          : "Growth case needs verification",
    timing: {
      ...studies,
      ...technical,
      volatility,
      maxDrawdown: bars.length >= 60 ? maxDrawdown : null,
      rangePosition: range,
      observations: bars.length,
    },
    modelCashFlowPerShare: reported.cash,
    modelSbcPerShare: reported.sbc,
    modelEligible:
      !special && r.company.assetType === "stock" && !r.company.foreignListing,
  };
}

function computeDecisionHistory(r: Research) {
  const studies = priceStudies(r.history, r.retrievedAt),
    technical = indicators(r.history, r.retrievedAt);
  const bars = [
    ...new Map(
      r.history
        .filter(
          (x) =>
            /^\d{4}-\d{2}-\d{2}$/.test(x.time) &&
            x.time < r.retrievedAt.slice(0, 10) &&
            x.close > 0 &&
            [x.close, x.high, x.low, x.volume].every(Number.isFinite),
        )
        .map((x) => [x.time, x]),
    ).values(),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const last252 = bars.slice(-252),
    last = bars.at(-1)?.close;
  const vol = bars
    .slice(-253)
    .slice(1)
    .map((x, i, a) => Math.log(x.close / bars.slice(-253)[i].close));
  const avg = mean(vol);
  const volatility =
    vol.length >= 60 && avg != null
      ? Math.sqrt(
          vol.reduce((a, x) => a + (x - avg) ** 2, 0) / (vol.length - 1),
        ) *
        Math.sqrt(r.company.assetType === "crypto" ? 365 : 252) *
        100
      : null;
  let peak = 0,
    maxDrawdown = 0;
  for (const b of bars) {
    peak = Math.max(peak, b.close);
    maxDrawdown = Math.min(maxDrawdown, (b.close / peak - 1) * 100);
  }
  const range =
    last252.length >= 200 && last != null
      ? ratio(
          last - Math.min(...last252.map((x) => x.low)),
          Math.max(...last252.map((x) => x.high)) -
            Math.min(...last252.map((x) => x.low)),
          100,
        )
      : null;

  return { studies, technical, bars, volatility, maxDrawdown, range };
}
const historyMemo = evidenceMemo<ReturnType<typeof computeDecisionHistory>>();
function decisionHistory(r: Research) {
  return historyMemo(
    r.history,
    `${r.history.length}:${r.retrievedAt}:${r.company.assetType}`,
    () => computeDecisionHistory(r),
  );
}

const decisionMemo = evidenceMemo<ReturnType<typeof computeResearchDecision>>();
/** Research snapshots are immutable; a new quote/evidence object invalidates this cache. */
export function researchDecision(r: Research, style: ResearchStyle = "Balanced") {
  return decisionMemo(r, style, () => computeResearchDecision(r, style));
}
