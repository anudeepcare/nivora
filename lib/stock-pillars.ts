import type { Research } from "./types";
import type { aurynDecision } from "./auryn-decision.ts";
import { researchBrief } from "./research-brief.ts";
import { scenarioHeadline } from "./scenario-headline.ts";
import { percent } from "./format.ts";

export type PillarStatus = "supportive" | "mixed" | "caution" | "unknown";
export type Pillar = {
  id: "growth" | "profit" | "funding" | "price" | "timing" | "risk";
  question: string;
  status: PillarStatus;
  answer: string;
  why: string;
};
export type StockPillars = {
  pillars: Pillar[];
  supportive: number;
  caution: number;
  unknown: number;
  summary: string;
};
type Decision = ReturnType<typeof aurynDecision>;

/** Stated reading thresholds. They sort measured facts into plain answers; they are not a score,
 * are not combined into one number and do not change the decision engine or Pace. */
export const PILLAR_LIMITS = {
  growth: { strong: 20, steady: 5 },
  margin: 10,
  runwayMonths: 24,
  dilution: 10,
  priceGap: 15,
  swing: { calm: 35, high: 70 },
} as const;
const num = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);

/** Six plain questions a long-term investor asks, each answered from measured evidence with its reason.
 * Fundamentals, expectations, timing and risk sit side by side so no single lens decides alone. */
export function stockPillars(r: Research, d: Decision): StockPillars | null {
  if (r.company.assetType !== "stock") return null;
  const b = researchBrief(r).businessNumbers;
  const L = PILLAR_LIMITS;
  const pillars: Pillar[] = [];
  const g = b.revenueGrowth;
  pillars.push({
    id: "growth",
    question: "Is the business growing?",
    ...(!num(g)
      ? {
          status: "unknown",
          answer: "Not measured",
          why: "Two comparable yearly revenue figures are not available.",
        }
      : g >= L.growth.strong
        ? {
            status: "supportive",
            answer: "Growing fast",
            why: `Revenue rose ${percent(g)} over the comparable year.`,
          }
        : g >= L.growth.steady
          ? {
              status: "mixed",
              answer: "Growing steadily",
              why: `Revenue rose ${percent(g)} over the comparable year.`,
            }
          : {
              status: "caution",
              answer: g < 0 ? "Shrinking" : "Barely growing",
              why: `Revenue changed ${percent(g, true)} over the comparable year.`,
            }),
  });
  const m = b.operatingMargin,
    fcf = b.fcf;
  pillars.push({
    id: "profit",
    question: "Does it make money?",
    ...(!num(m) && !num(fcf)
      ? {
          status: "unknown",
          answer: "Not measured",
          why: "Operating profit and cash flow are not available for the latest period.",
        }
      : num(m) && m >= L.margin && (!num(fcf) || fcf > 0)
        ? {
            status: "supportive",
            answer: "Profitable",
            why: `It keeps ${percent(m)} of revenue as operating profit${num(fcf) ? " and generates cash after investment" : ""}.`,
          }
        : (num(m) && m > 0) || (num(fcf) && fcf > 0)
          ? {
              status: "mixed",
              answer: "Partly",
              why: `Operating margin is ${percent(m)}${num(fcf) ? `; cash after investment is ${fcf > 0 ? "positive" : "negative"}` : ""}.`,
            }
          : {
              status: "caution",
              answer: "Not yet",
              why: `It loses money at the operating level (${percent(m)} margin)${num(fcf) && fcf < 0 ? " and spends more cash than it brings in" : ""}.`,
            }),
  });
  const runway = b.runway,
    dilution = b.dilution;
  pillars.push({
    id: "funding",
    question: "Can it pay for its plans?",
    ...(num(dilution) && dilution > L.dilution
      ? {
          status: "caution",
          answer: "Leaning on new shares",
          why: `Share count rose ${percent(dilution)}, so each share owns less of the company.`,
        }
      : num(fcf) && fcf >= 0
        ? {
            status: "supportive",
            answer: "Funds itself",
            why: "Cash from the business covers its investment, so it does not depend on raising money.",
          }
        : num(runway)
          ? runway >= L.runwayMonths
            ? {
                status: "mixed",
                answer: "Funded for now",
                why: `Cash on hand covers about ${Math.round(runway)} months of current spending.`,
              }
            : {
                status: "caution",
                answer: "May need to raise money",
                why: `Cash on hand covers only about ${Math.round(runway)} months of current spending.`,
              }
          : {
              status: "unknown",
              answer: "Not measured",
              why: "Cash, spending and share-count figures are not available together.",
            }),
  });
  const price = d.reference?.price;
  const lead = d.valuation
    ? { base: d.valuation.base, label: "AURYN's base case" }
    : (() => {
        const h = scenarioHeadline(r);
        return h && h.source !== "history"
          ? { base: h.base, label: "the analyst consensus target" }
          : null;
      })();
  const gap =
    lead && num(price) && price > 0 ? (lead.base / price - 1) * 100 : null;
  pillars.push({
    id: "price",
    question: "Is the price reasonable?",
    ...(!num(gap)
      ? {
          status: "unknown",
          answer: "Not measured",
          why: "No valuation model or analyst target is available to compare with the price.",
        }
      : gap >= L.priceGap
        ? {
            status: "supportive",
            answer: "Below expectations",
            why: `The price is ${percent((1 - price! / lead!.base) * 100)} below ${lead!.label}. That is an estimate, not a promise.`,
          }
        : gap > -L.priceGap
          ? {
              status: "mixed",
              answer: "About in line",
              why: `The price is within ${percent(Math.abs(gap))} of ${lead!.label}.`,
            }
          : {
              status: "caution",
              answer: "Ahead of expectations",
              why: `The price is ${percent((price! / lead!.base - 1) * 100)} above ${lead!.label}; a lot of good news is already assumed.`,
            }),
  });
  const level = d.pace?.level;
  pillars.push({
    id: "timing",
    question: "Is now a sensible time to add?",
    ...(!num(level)
      ? {
          status: "unknown",
          answer: "Not measured",
          why: "There is not enough settled price history for a Pace reading.",
        }
      : level >= 2
        ? {
            status: "supportive",
            answer:
              level >= 3 ? "In a deeper buying zone" : "In a starting zone",
            why: `Pace reads P${level}: the price has pulled back relative to its own longer trend. Timing alone is never a reason to buy.`,
          }
        : level === 1
          ? {
              status: "mixed",
              answer: "No pullback yet",
              why: "Pace reads P1: the price is near its trend, with no discount to act on.",
            }
          : {
              status: "caution",
              answer: "Stretched",
              why: "Pace reads P0: the price has run well ahead of its own trend.",
            }),
  });
  const closes = [...r.history]
    .filter((x) => num(x.close) && x.close > 0)
    .sort((a, c) => a.time.localeCompare(c.time))
    .slice(-253)
    .map((x) => x.close);
  let swing: number | null = null,
    off: number | null = null;
  if (closes.length >= 60) {
    const moves = closes.slice(1).map((c, i) => Math.log(c / closes[i]));
    const mean = moves.reduce((a, x) => a + x, 0) / moves.length;
    swing =
      Math.sqrt(
        moves.reduce((a, x) => a + (x - mean) ** 2, 0) / (moves.length - 1),
      ) *
      Math.sqrt(252) *
      100;
    off = (1 - closes.at(-1)! / Math.max(...closes)) * 100;
  }
  pillars.push({
    id: "risk",
    question: "How bumpy is the ride?",
    ...(!num(swing) || !num(off)
      ? {
          status: "unknown",
          answer: "Not measured",
          why: "At least 60 sessions of price history are needed.",
        }
      : {
          status:
            swing < L.swing.calm
              ? "supportive"
              : swing < L.swing.high
                ? "mixed"
                : "caution",
          answer:
            swing < L.swing.calm
              ? "Relatively steady"
              : swing < L.swing.high
                ? "Bumpy"
                : "Very bumpy",
          why: `Its price has swung about ${percent(swing)} a year and is ${percent(off)} below its high of the past year. Size the position so a fall like that is tolerable.`,
        }),
  } as Pillar);
  const count = (s: PillarStatus) =>
    pillars.filter((p) => p.status === s).length;
  const supportive = count("supportive"),
    caution = count("caution"),
    unknown = count("unknown");
  const names = (s: PillarStatus) =>
    pillars
      .filter((p) => p.status === s)
      .map(
        (p) =>
          ({
            growth: "growth",
            profit: "profitability",
            funding: "funding",
            price: "price",
            timing: "timing",
            risk: "price swings",
          })[p.id],
      )
      .join(", ");
  return {
    pillars,
    supportive,
    caution,
    unknown,
    summary:
      `${supportive ? `Working for it: ${names("supportive")}. ` : ""}${caution ? `Working against it: ${names("caution")}. ` : ""}${unknown ? `Not measured: ${names("unknown")}.` : ""}`.trim() ||
      "The evidence is mixed across every question.",
  };
}
