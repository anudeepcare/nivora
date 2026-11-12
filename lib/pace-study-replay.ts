import { researchAccumulation as v7Accumulation } from "./accumulation-policy-v7.ts";
import { paceModelV7 } from "./pace-model-v7.ts";
import { researchAccumulation } from "./accumulation-policy-v5.ts";
import { researchAccumulation as currentAccumulation } from "./accumulation-policy-v6.ts";
import { paceModel } from "./pace-model-v6.ts";
import type { Candle } from "./types";
import type { StudyRow } from "./pace-study.ts";

export type PriceReplay = {
  market: "us-equity" | "crypto";
  sourceRecord: string;
  /** Split-adjusted price vintages available at knownAt; never total-return indexes. */
  bars: (Candle & { knownAt: string })[];
};

export function verifyStudyRow(
  replay: PriceReplay,
  row: StudyRow,
  policyVersion: "monthly-v5" | "monthly-v6" | "monthly-v7" = "monthly-v5",
) {
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
  const signal = (
    policyVersion === "monthly-v7"
      ? v7Accumulation
      : policyVersion === "monthly-v6"
        ? currentAccumulation
        : researchAccumulation
  )(bars, row.signalKnownAt, replay.market).confirmed;
  if (
    policyVersion !== "monthly-v5" &&
    (!signal ||
      !("policyVersion" in signal) ||
      signal.policyVersion !== policyVersion ||
      signal.date <
        (policyVersion === "monthly-v7" ? paceModelV7 : paceModel)
          .availableFrom)
  )
    throw Error(
      `Replay requires a ${policyVersion} signal observed after model release; legacy fallback is not ${policyVersion}.`,
    );
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
