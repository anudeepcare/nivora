import type { Candle, Research } from "./types";
import { adaptiveSettledBars } from "./accumulation-policy-v3.ts";

export type StudyMarket = "us-equity" | "crypto" | "unknown";
const usExchange =
  /^(NASDAQ|NYSE|NYSE ARCA|NYSEARCA|ARCA|AMEX|NYSE AMERICAN|NYSEAMERICAN|BATS|CBOE|OTC|OTCQX|OTCQB|PINK|US)$/i;
export function studyMarket(r: Pick<Research, "company">): StudyMarket {
  return r.company.assetType === "crypto"
    ? "crypto"
    : usExchange.test(r.company.exchange)
      ? "us-equity"
      : "unknown";
}
/** One settlement and validation boundary for price references and technical studies. */
export function settledStudyBars(
  bars: Candle[],
  asOf: string,
  market: StudyMarket = "crypto",
) {
  const rows = adaptiveSettledBars(
    bars,
    asOf,
    market === "us-equity" ? "us-equity" : "crypto",
  );
  if (market !== "unknown") return rows;
  const now = Date.parse(asOf);
  // Unknown exchange calendars cannot borrow a US close. Wait until the source
  // day has ended everywhere, matching the conservative price-reference rule.
  return rows.filter(
    (b) =>
      now - Date.parse(b.time) >= 36 * 3600000 &&
      ![0, 6].includes(new Date(`${b.time}T12:00:00Z`).getUTCDay()),
  );
}
