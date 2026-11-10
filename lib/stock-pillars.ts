import type { Research } from "./types";
import type { aurynDecision } from "./auryn-decision.ts";
import { researchBrief } from "./research-brief.ts";
import { scenarioCases } from "./scenario-cases.ts";
import { percent } from "./format.ts";
import { evidenceOdds, type EvidenceOdds } from "./evidence-odds.ts";

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
  /** Measured record of stocks in the same business and trend state. */
  odds: EvidenceOdds | null;
  /** Sell-side prompt. Informational: it never changes the decision engine's call. */
  exitWatch: { level: "trim" | "thesis"; text: string } | null;
  /** Bear / base / bull beside the call, with their named source. */
  cases: {
    bear: number;
    base: number;
    bull: number;
    source: string;
    price: number | null;
    currency: string;
    /** Where today's price sits relative to the range. */
    position: "below-bear" | "inside" | "above-bull" | null;
  } | null;
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
  const range = scenarioCases(r, d);
  const lead =
    range && range.kind !== "history"
      ? {
          base: range.base,
          label:
            range.kind === "model"
              ? "AURYN's base case"
              : "the analyst consensus target",
        }
      : null;
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
  const odds = evidenceOdds(r, b);
  const zone = num(level) ? ` Pace reads P${level}.` : "";
  pillars.push({
    id: "timing",
    question: "Is now a sensible time to add?",
    ...(!odds
      ? {
          status: "unknown",
          answer: "Not measured",
          why: `Reported profit and cash flow plus 200 sessions of price history are needed to compare this stock with the record.${zone}`,
        }
      : odds.business === "fail"
        ? {
            status: "caution",
            answer: "The record says wait",
            why: `Stocks failing the business check were higher a year later only ${odds.cell.win.toFixed(0)}% of the time, whatever the price had done.${zone} A lower price did not improve those odds.`,
          }
        : odds.modifier && odds.offHigh >= 30
          ? {
              status: "caution",
              answer: "Deep fall: wait for it to steady",
              why: `It is ${percent(odds.offHigh)} below its one-year high. Sound businesses that had fallen this far were higher a year later ${odds.modifier.cell.win.toFixed(0)}% of the time, against ${odds.cell.win.toFixed(0)}% for this group overall.${zone}`,
            }
          : odds.trend === "up"
            ? {
                status: odds.business === "pass" ? "supportive" : "mixed",
                answer: "Trend is with you",
                why: `The price is above its 200-day average. ${odds.business === "pass" ? "Sound" : "Mixed"} businesses in that position were higher a year later ${odds.cell.win.toFixed(0)}% of the time.${zone}`,
              }
            : {
                status: "mixed",
                answer: "Trend is against you",
                why: `The price is below its 200-day average. ${odds.business === "pass" ? "Sound" : "Mixed"} businesses in that position were higher a year later ${odds.cell.win.toFixed(0)}% of the time, and beat the typical stock only ${odds.cell.beat.toFixed(0)}% of the time.${zone}`,
              }),
  } as Pillar);
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
  const stretched = num(price) && !!range && price > range.bull;
  const weak = pillars.filter(
    (p) =>
      ["growth", "profit", "funding"].includes(p.id) && p.status === "caution",
  ).length;
  const exitWatch: StockPillars["exitWatch"] =
    odds?.business === "fail"
      ? {
          level: "thesis",
          text: `Thesis watch: the company is losing money and burning cash. Stocks in that state lost a median ${Math.abs(odds.cell.median).toFixed(0)}% over the following year and were higher only ${odds.cell.win.toFixed(0)}% of the time. If you hold it, write down what must improve, and by when, for you to keep holding.`,
        }
      : weak === 3
        ? {
            level: "thesis",
            text: "Thesis watch: growth, profitability and funding all read Careful at once. If you hold it, write down what would have to improve, and by when, for you to keep holding.",
          }
        : stretched && range!.kind !== "history"
          ? {
              level: "trim",
              text: "Size check: the price is above the bull case. In the record, sound businesses that were stretched kept rising more often than not, so this is not a signal to sell. Check only whether the position has grown beyond the size you intended.",
            }
          : null;
  return {
    odds,
    exitWatch,
    cases: range
      ? {
          ...range,
          price: num(price) ? price : null,
          currency: d.reference?.currency ?? r.quote.currency,
          position: !num(price)
            ? null
            : price < range.bear
              ? "below-bear"
              : price > range.bull
                ? "above-bull"
                : "inside",
        }
      : null,
    pillars,
    supportive,
    caution,
    unknown,
    summary:
      `${supportive ? `Working for it: ${names("supportive")}. ` : ""}${caution ? `Working against it: ${names("caution")}. ` : ""}${unknown ? `Not measured: ${names("unknown")}.` : ""}`.trim() ||
      "The evidence is mixed across every question.",
  };
}
