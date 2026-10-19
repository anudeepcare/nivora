import type { Research } from "./types";
import { tradePlan } from "./advanced-research.ts";
import { quoteHealth } from "./quote-health.ts";
export function tradeReference(
  r: Research,
  inputs: {
    capital: number;
    risk: number;
    entry: number;
    stop: number;
    target: number;
    slippage: number;
  },
) {
  const p = tradePlan(
    inputs.capital,
    inputs.risk,
    inputs.entry,
    inputs.stop,
    inputs.target,
    inputs.slippage,
  );
  if (!p.valid) return null;
  const checkedAt = Date.parse(r.priceObservedAt ?? r.retrievedAt),
    quote = Number.isFinite(checkedAt)
      ? quoteHealth(r.quote, checkedAt)
      : undefined;
  const fresh = !!quote && !quote.stale && quote.price != null;
  const money = (n: number) => `${n.toFixed(2)} ${r.quote.currency}`;
  return {
    fresh,
    text: [
      `AURYN · ${r.company.symbol} · manual long-plan reference`,
      `${fresh ? "Observed quote" : "QUOTE NEEDS RECHECK"}: ${quote?.price != null ? money(quote.price) : "Unavailable"} · ${quote?.asOf ?? "time unavailable"} · ${quote?.session ?? "session unavailable"}`,
      `User-assumed entry: ${money(inputs.entry)}`,
      `User-assumed invalidation: ${money(inputs.stop)}`,
      `User-assumed target: ${money(inputs.target)}`,
      `Whole units: ${p.quantity}`,
      `Planned loss including assumed slippage: ${money(p.plannedLoss)}`,
      `Assumed slippage each side: ${inputs.slippage}%`,
      `Verify broker buying power, current spread, lot sizes, fees and session/order eligibility. Stops can fill worse or fail to fill; no order is submitted.`,
    ].join("\n"),
  };
}
