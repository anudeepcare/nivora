import type { Research } from "./types";
import { researchDecision } from "./decision-research.ts";
import { researchBrief } from "./research-brief.ts";
import { amount, percent } from "./format.ts";

/**
 * Interactive evidence scale. Every stone is existing AURYN evidence for this company
 * (reported financial facts, rule flags, price trend, eligible earnings case). Nothing is
 * invented: missing evidence produces no stone, and the lean is a weighing of what the reader
 * keeps on the scale, not a forecast or a recommendation.
 */
export type ScaleStone = {
  id: string;
  side: "for" | "against";
  title: string;
  detail: string;
  fact: string | null;
  /** 1 ordinary evidence, 2 an eligible conditional case, 3 a severe rule flag. */
  weight: 1 | 2 | 3;
};
export type ScaleLean = "supportive" | "even" | "cautious";

type Factor = { key: string; title: string; text: string; value: number; unit: "percent" | "money" | "ratio" };

const factFor = (x: Factor, currency: string) =>
  !Number.isFinite(x.value)
    ? null
    : x.unit === "percent"
      ? percent(x.value, true)
      : x.unit === "money"
        ? amount(x.value, currency, true)
        : `${x.value.toFixed(2)}×`;

export function scaleStones(r: Research): ScaleStone[] {
  const d = researchDecision(r);
  const b = researchBrief(r);
  const stones: ScaleStone[] = [];
  const seen = new Set<string>();
  const add = (s: ScaleStone) => {
    if (seen.has(s.id) || stones.some((x) => x.title === s.title)) return;
    seen.add(s.id);
    stones.push(s);
  };
  for (const x of d.forCase as Factor[])
    add({ id: `for-${x.key}`, side: "for", title: x.title, detail: x.text, fact: factFor(x, d.currency), weight: 1 });
  for (const x of d.against as Factor[])
    add({ id: `against-${x.key}`, side: "against", title: x.title, detail: x.text, fact: factFor(x, d.currency), weight: 1 });
  for (const f of d.flags)
    add({ id: `flag-${f.id}`, side: "against", title: f.title, detail: f.text, fact: null, weight: f.severe ? 3 : 1 });
  const price = r.quote.price;
  const { ma50, ma200 } = b.timing;
  if (typeof price === "number" && price > 0 && typeof ma50 === "number" && typeof ma200 === "number") {
    if (price > ma50 && price > ma200)
      add({ id: "trend-above", side: "for", title: "Price is above its 50- and 200-day averages", detail: "A constructive completed-price trend. Trend describes the past and does not establish value.", fact: null, weight: 1 });
    else if (price < ma50 && price < ma200)
      add({ id: "trend-below", side: "against", title: "Price is below its 50- and 200-day averages", detail: "A weak completed-price trend. A falling price can still become attractive if the business case holds.", fact: null, weight: 1 });
  }
  if (b.scenarioEligible && b.scenario && b.scenario.currency === r.quote.currency && typeof price === "number" && price > 0) {
    const change = (b.scenario.base / price - 1) * 100;
    if (Number.isFinite(change) && Math.abs(change) >= 5)
      add({
        id: "scenario-base",
        side: change > 0 ? "for" : "against",
        title: change > 0 ? "Base case sits above the quote" : "Base case sits below the quote",
        detail: "AURYN's eligible conditional earnings case compared with the current quote. It is a sensitivity, not a fair value or a target.",
        fact: percent(change, true),
        weight: 2,
      });
  }
  if (!b.scenarioEligible)
    add({
      id: "value-unestablished",
      side: "against",
      title: "A company-specific value is not established",
      detail: "No eligible conditional earnings case is available, so there is no measured margin of safety. Analyst targets are a separate opinion.",
      fact: null,
      weight: 1,
    });
  return stones;
}

export function scaleBalance(stones: readonly ScaleStone[], off: readonly string[] = []) {
  const hidden = new Set(off);
  let forWeight = 0,
    againstWeight = 0;
  for (const s of stones) {
    if (hidden.has(s.id)) continue;
    if (s.side === "for") forWeight += s.weight;
    else againstWeight += s.weight;
  }
  const net = forWeight - againstWeight;
  const lean: ScaleLean = net >= 2 ? "supportive" : net <= -2 ? "cautious" : "even";
  const tilt = Math.max(-14, Math.min(14, (againstWeight - forWeight) * 3));
  return { forWeight, againstWeight, net, lean, tilt };
}

/** Row layout for stones resting in a pan (pan surface at y = 0, x from −48 to 48). */
export function scaleLayout(weights: readonly number[]) {
  const out: { cx: number; cy: number; r: number }[] = [];
  let x = -48,
    rowBottom = 0,
    rowHeight = 0;
  for (const w of weights) {
    const r = 5 + Math.max(1, Math.min(3, w)) * 3;
    if (x + 2 * r > 48 && x > -48) {
      x = -48;
      rowBottom -= rowHeight + 2;
      rowHeight = 0;
    }
    out.push({ cx: x + r, cy: rowBottom - r, r });
    x += 2 * r + 3;
    rowHeight = Math.max(rowHeight, 2 * r);
  }
  return out;
}
