import type { Research } from "./types";
import { consensusOutlook } from "./outlook.ts";
import { priceRiskScenarios } from "./price-risk-scenarios.ts";
import { revenueSensitivity } from "./revenue-sensitivity.ts";
import { selectPriceReference } from "./price-reference.ts";

export type ScenarioLensId =
  | "model"
  | "analyst"
  | "revenue"
  | "history-1m"
  | "history-3m"
  | "history-12m";
export type ScenarioLens = {
  id: ScenarioLensId;
  label: string;
  kind: "model" | "analyst" | "sensitivity" | "history";
  /** Plain-language horizon. Never implies that different lenses share a date. */
  horizon: string;
  asOf: string | null;
  bear: number | null;
  base: number;
  bull: number | null;
  /** Base equals the reference by construction and carries no information. */
  neutralBase: boolean;
  note: string;
};
export type ScenarioLensModel = {
  label: string;
  bear: number;
  base: number;
  bull: number;
  end?: string | null;
  asOf?: string | null;
  note?: string;
};
type Span = { low: number; high: number; count: number };
export type ScenarioAgreement = {
  level: "single" | "aligned" | "mixed" | "wide";
  /** Highest minus lowest informative base case, as a percent of the reference. */
  spread: number | null;
  compared: ScenarioLensId[];
  label: string;
  detail: string;
};
export type ScenarioPosition =
  | { state: "inside"; percent: number }
  | { state: "below-bear" | "above-bull"; percent: null }
  | { state: "unbounded"; percent: null };
export type ScenarioLensView =
  | { available: false; reason: string }
  | {
      available: true;
      currency: string;
      reference: {
        price: number;
        asOf: string;
        basis: "quote" | "settled-close";
      };
      lenses: ScenarioLens[];
      primary: ScenarioLens;
      envelope: { bear: Span | null; base: Span | null; bull: Span | null };
      agreement: ScenarioAgreement;
      position: ScenarioPosition;
      /** Percent gaps of the primary lens around the reference; ratio only when both are positive. */
      asymmetry: {
        upside: number;
        downside: number;
        ratio: number | null;
      } | null;
      /** Data-quality notes that can distort a row; shown, never silently corrected. */
      warnings: string[];
      caveat: string;
    };

/** Presentation thresholds for how far informative base cases sit apart.
 * They describe disagreement between methods, not forecast accuracy. */
export const AGREEMENT_LIMITS = { aligned: 25, mixed: 75 } as const;

/** One-session moves beyond these percents are flagged as a possible split or bad tick.
 * Asymmetric because a 2-for-1 split looks like -50% while real one-day gains of
 * 40-70% do occur on earnings; a reverse split looks like +100% or more. */
export const EXTREME_SESSION_MOVE = { fall: -45, rise: 80 } as const;

const positive = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x > 0;
const span = (values: number[]): Span | null =>
  values.length
    ? {
        low: Math.min(...values),
        high: Math.max(...values),
        count: values.length,
      }
    : null;
const order: ScenarioLensId[] = [
  "model",
  "analyst",
  "history-12m",
  "history-3m",
  "history-1m",
  "revenue",
];

/** Side-by-side bear/base/bull evidence from every independent method that qualifies.
 * Nothing is averaged into a single fair value and no probability is assigned.
 * Each lens keeps its own basis, horizon and date; unavailable lenses are omitted, never estimated. */
export function scenarioLenses(
  r: Research,
  options: { model?: ScenarioLensModel | null; now?: number } = {},
): ScenarioLensView {
  const unavailable = (reason: string): ScenarioLensView => ({
    available: false,
    reason,
  });
  const now = options.now ?? Date.parse(r.priceObservedAt ?? r.retrievedAt);
  if (!Number.isFinite(now))
    return unavailable("A dated observation is required to compare scenarios.");
  if (r.company.currency !== r.quote.currency)
    return unavailable(
      "Price and listing currencies differ; scenarios are not compared.",
    );
  const selected = r.history?.length ? selectPriceReference(r, now) : null;
  const quoteAt = Date.parse(r.quote.asOf ?? "");
  const reference = selected
    ? { price: selected.price, asOf: selected.asOf, basis: selected.basis }
    : positive(r.quote.price) &&
        Number.isFinite(quoteAt) &&
        quoteAt <= now + 60000 &&
        now - quoteAt <= 4 * 86400000
      ? {
          price: r.quote.price,
          asOf: r.quote.asOf!,
          basis: "quote" as const,
        }
      : null;
  if (!reference)
    return unavailable(
      "A recent dated price is required to compare scenarios.",
    );
  const lenses: ScenarioLens[] = [];
  const m = options.model;
  if (
    m &&
    positive(m.bear) &&
    positive(m.base) &&
    positive(m.bull) &&
    m.bear <= m.base &&
    m.base <= m.bull
  )
    lenses.push({
      id: "model",
      label: m.label,
      kind: "model",
      horizon: m.end ? `to fiscal period ending ${m.end}` : "model horizon",
      asOf: m.asOf ?? null,
      bear: m.bear,
      base: m.base,
      bull: m.bull,
      neutralBase: false,
      note:
        m.note ??
        "Conditional model outcomes from reported financials and supplied forecasts.",
    });
  if (r.company.assetType === "stock") {
    const c = consensusOutlook(r);
    if (c)
      lenses.push({
        id: "analyst",
        label: "Analyst targets",
        kind: "analyst",
        horizon: "horizon not supplied",
        asOf: c.asOf,
        bear: c.low ?? null,
        base: c.target,
        bull: c.high ?? null,
        neutralBase: false,
        note:
          c.low == null
            ? "Consensus only; the provider did not supply an ordered low/high range."
            : "Lowest, consensus and highest supplied analyst targets. Opinions, not fair value.",
      });
  }
  const warnings: string[] = [];
  // One-year and three-month rows when the history supports them; a recently
  // listed stock falls back to the engine's 20-session row, labelled as such.
  const yearly = priceRiskScenarios(r, { horizon: 252 });
  const recent = priceRiskScenarios(r);
  for (const h of [yearly, recent]) {
    if (!h.available) continue;
    const [id, label, text] =
      h.horizon === 252
        ? (["history-12m", "Past 1-year moves", "one year"] as const)
        : h.horizon === 63
          ? (["history-3m", "Past 3-month moves", "three months"] as const)
          : (["history-1m", "Past 1-month moves", "one month"] as const);
    const at = (i: number) => reference.price * (1 + h.cases[i].change / 100);
    const [bear, base, bull] = [at(0), at(1), at(2)];
    if (![bear, base, bull].every(positive) || bear > base || base > bull)
      continue;
    lenses.push({
      id,
      label,
      kind: "history",
      horizon: `${text} · ${h.horizon} sessions`,
      asOf: h.through,
      bear,
      base,
      bull,
      neutralBase: false,
      note: `10th / 50th / 90th percentile of this instrument's own ${text} returns since ${h.from.slice(0, 10)}, applied to the reference price. About ${h.independent} non-overlapping period${h.independent === 1 ? "" : "s"}; overlapping windows are not independent.`,
    });
  }
  const jump = [yearly, recent].flatMap((h) =>
    h.available && h.largestMove ? [h.largestMove] : [],
  )[0];
  if (
    jump &&
    (jump.change <= EXTREME_SESSION_MOVE.fall ||
      jump.change >= EXTREME_SESSION_MOVE.rise)
  )
    warnings.push(
      `Price history includes a one-session move of ${jump.change > 0 ? "+" : ""}${jump.change.toFixed(0)}% on ${jump.date.slice(0, 10)}. If that was a share split, reverse split or data error rather than a real move, the historical rows are distorted.`,
    );
  if (!lenses.some((x) => x.id === "model")) {
    const s = revenueSensitivity(r);
    if (s.available)
      lenses.push({
        id: "revenue",
        label: "Revenue forecast spread",
        kind: "sensitivity",
        horizon: `fiscal period ending ${s.end}`,
        asOf: s.asOf,
        bear: s.cases[0].target,
        base: s.cases[1].target,
        bull: s.cases[2].target,
        neutralBase: true,
        note: "Supplied low/high revenue forecasts relative to the mean, with a 0.8× / 1.2× pricing stress. Base equals today's price by construction.",
      });
  }
  if (!lenses.length)
    return unavailable(
      "No scenario method qualifies yet: a model, a dated analyst target, or enough settled price history is required.",
    );
  lenses.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const ranged = (x: ScenarioLens) => x.bear != null && x.bull != null;
  const primary =
    lenses.find((x) => x.id === "model") ??
    lenses.find((x) => x.id === "analyst" && ranged(x)) ??
    lenses.find((x) => x.kind === "history") ??
    lenses[0];
  // Compare like with like: only the model, analyst targets and the one-year
  // historical row describe roughly comparable horizons. Shorter historical
  // rows are near-term context and never count as agreement or disagreement.
  const informative = lenses.filter(
    (x) => x.id === "model" || x.id === "analyst" || x.id === "history-12m",
  );
  const bases = informative.map((x) => x.base);
  const spread =
    bases.length > 1
      ? ((Math.max(...bases) - Math.min(...bases)) / reference.price) * 100
      : null;
  const level =
    spread == null
      ? "single"
      : spread <= AGREEMENT_LIMITS.aligned
        ? "aligned"
        : spread <= AGREEMENT_LIMITS.mixed
          ? "mixed"
          : "wide";
  const agreement: ScenarioAgreement = {
    level,
    spread,
    compared: informative.map((x) => x.id),
    label: {
      single: "One method available",
      aligned: "Methods broadly agree",
      mixed: "Methods differ",
      wide: "Methods disagree widely",
    }[level],
    detail:
      spread == null
        ? "Fewer than two methods with a comparable horizon are available, so base cases are not cross-checked. Shorter historical rows are near-term context only."
        : `Base cases from ${informative.length} methods sit ${spread.toFixed(0)}% of the current price apart. ${
            level === "aligned"
              ? "Agreement between methods is not evidence that they are right."
              : level === "mixed"
                ? "Check which assumptions drive the gap before relying on any single range."
                : "Treat every range as low-confidence until you understand why they differ."
          }`,
  };
  const position: ScenarioPosition =
    primary.bear == null || primary.bull == null
      ? { state: "unbounded", percent: null }
      : reference.price < primary.bear
        ? { state: "below-bear", percent: null }
        : reference.price > primary.bull
          ? { state: "above-bull", percent: null }
          : {
              state: "inside",
              percent:
                primary.bull > primary.bear
                  ? ((reference.price - primary.bear) /
                      (primary.bull - primary.bear)) *
                    100
                  : 50,
            };
  const asymmetry =
    primary.bear != null && primary.bull != null
      ? (() => {
          const upside = (primary.bull! / reference.price - 1) * 100,
            downside = (1 - primary.bear! / reference.price) * 100;
          return {
            upside,
            downside,
            ratio: upside > 0 && downside > 0 ? upside / downside : null,
          };
        })()
      : null;
  return {
    available: true,
    currency: r.quote.currency,
    reference,
    lenses,
    primary,
    envelope: {
      bear: span(lenses.flatMap((x) => (x.bear == null ? [] : [x.bear]))),
      base: span(lenses.flatMap((x) => (x.neutralBase ? [] : [x.base]))),
      bull: span(lenses.flatMap((x) => (x.bull == null ? [] : [x.bull]))),
    },
    agreement,
    position,
    asymmetry,
    warnings,
    caveat:
      "Each row is a different method with its own basis, horizon and date. They are conditional ranges, not probabilities, price forecasts or independent fair value, and are never averaged together. Outcomes can fall outside every range shown.",
  };
}
