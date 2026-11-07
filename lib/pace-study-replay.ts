import { researchAccumulation } from "./accumulation-policy-v5.ts";
import type { Candle } from "./types";
import type { StudyRow } from "./pace-study.ts";

export type PriceReplay = {
  market: "us-equity" | "crypto";
  sourceRecord: string;
  /** Split-adjusted price vintages available at knownAt; never total-return indexes. */
  bars: (Candle & { knownAt: string })[];
};

export function verifyStudyRow(replay: PriceReplay, row: StudyRow) {
  if (
    !replay.sourceRecord?.trim() ||
    !["us-equity", "crypto"].includes(replay.market) ||
    !Array.isArray(replay.bars)
  )
    throw Error("Replay source and market required");
  const cutoff = Date.parse(row.signalKnownAt);
  const bars = replay.bars.filter((bar) => {
    if (
      !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(bar.knownAt) ||
      !Number.isFinite(Date.parse(bar.knownAt)) ||
      new Date(bar.knownAt).toISOString().slice(0, 10) !==
        bar.knownAt.slice(0, 10) ||
      Date.parse(bar.knownAt) < Date.parse(bar.time)
    )
      throw Error("Replay invalid price availability timestamp");
    return (
      Date.parse(bar.knownAt) <= cutoff &&
      bar.time <= row.signalDate.slice(0, 10)
    );
  });
  const signal = researchAccumulation(
    bars,
    row.signalKnownAt,
    replay.market,
  ).confirmed;
  const multiple = signal
    ? ([0, 0, 1, 2, 4] as const)[signal.multiplier]
    : null;
  if (
    !signal ||
    signal.date !== row.signalDate.slice(0, 10) ||
    signal.close !== row.splitAdjustedSignalClose ||
    multiple !== row.multiplier
  )
    throw Error(
      "Replay signal date, close or purchase multiplier mismatch (or insufficient settled history)",
    );
}
