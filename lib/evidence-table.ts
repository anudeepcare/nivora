/** Generated from scripts/market-study-compare.mjs on 10 November 2026. Do not edit by hand.
 * Twelve-month outcomes of 1,305 US-listed stocks by state on each monthly date, signals March 2022
 * to October 2025. Business state used only the latest annual report at least 90 days old.
 * n: cases. win: percent higher a year later. beat: percent that beat the same month's median stock.
 * median: median return. bad: 10th-percentile return. Survivorship applies: companies listed today only. */
export type EvidenceCell = {
  n: number;
  win: number;
  beat: number;
  median: number;
  bad: number;
};
export const EVIDENCE_TABLE: Record<string, EvidenceCell> = {
  "pass:up": { n: 9169, win: 63.4, beat: 60.8, median: 10.0, bad: -26.4 },
  "pass:down": { n: 6042, win: 58.3, beat: 52.6, median: 7.4, bad: -34.3 },
  "mixed:up": { n: 3986, win: 58.8, beat: 56.7, median: 7.5, bad: -38.9 },
  "mixed:down": { n: 3326, win: 57.1, beat: 53.7, median: 7.9, bad: -44.3 },
  "fail:up": { n: 4272, win: 40.4, beat: 38.7, median: -15.2, bad: -75.7 },
  "fail:down": { n: 7496, win: 37.4, beat: 35.8, median: -24.1, bad: -86.8 },
  "pass:deep": { n: 2424, win: 53.2, beat: 49.9, median: 4.4, bad: -43.0 },
  "pass:nearHigh": { n: 4367, win: 65.9, beat: 64.5, median: 10.6, bad: -22.4 },
  all: { n: 34291, win: 52.8, beat: 50.0, median: 3.1, bad: -58.9 },
};
export const EVIDENCE_PERIOD = "2022–2025";
