import type { Candle } from "./types";
import { paceModel } from "./pace-model-v6.ts";
const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
const deviation = (x: number[], sample = false) => {
  const m = mean(x);
  return Math.sqrt(
    x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - (sample ? 1 : 0)),
  );
};
/** Only settled bars through the reading date enter these scale-independent features. */
export function paceFeatures(
  bars: Candle[],
  cycleZ: number,
  cycleDistance: number,
) {
  if (bars.length < 252) return null;
  const closes = bars.map((b) => b.close);
  if (!closes.every((x) => Number.isFinite(x) && x > 0)) return null;
  const months = new Map<string, number>();
  for (const b of bars) months.set(b.time.slice(0, 7), b.close);
  const past = [...months.values()].slice(0, -1);
  if (past.length < 12) return null;
  const current = closes.at(-1)!;
  const values: number[] = [];
  for (const n of [6, 12, 18, 24]) {
    const x = past.slice(-n),
      mu = mean(x),
      sd = Math.max(deviation(x, true), mu * 0.01);
    values.push(
      current / mu - 1,
      (current - mu) / sd,
      current / Math.max(...x) - 1,
      (current - Math.min(...x)) /
        Math.max(Math.max(...x) - Math.min(...x), mu * 0.01),
      current / x[0] - 1,
    );
    const logs = x.map(Math.log),
      center = (x.length - 1) / 2,
      avg = mean(logs);
    const slope =
      logs.reduce((s, y, i) => s + (i - center) * (y - avg), 0) /
      logs.reduce((s, _, i) => s + (i - center) ** 2, 0);
    const intercept = avg - slope * center;
    const residuals = logs.map((y, i) => y - (intercept + slope * i));
    values.push(
      (Math.log(current) - (intercept + slope * x.length)) /
        Math.max(deviation(residuals), 0.05),
    );
  }
  for (const n of [20, 50, 100, 200, 252]) {
    const x = closes.slice(-n),
      logs = x.map(Math.log);
    values.push(
      current / mean(x) - 1,
      current / Math.max(...x) - 1,
      deviation(logs.slice(1).map((v, i) => v - logs[i])),
    );
  }
  const recent = closes.slice(-15),
    changes = recent.slice(1).map((v, i) => v - recent[i]);
  const gain = mean(changes.map((x) => Math.max(x, 0))),
    loss = mean(changes.map((x) => Math.max(-x, 0)));
  values.push(
    loss === 0 ? 100 : 100 - 100 / (1 + gain / loss),
    cycleZ,
    cycleDistance,
  );
  return values.length === paceModel.features.length &&
    values.every(Number.isFinite)
    ? values
    : null;
}
/** Fixed exported trees: no ticker lookup, network requests, or fitting in the app. */
export function classifyPace(features: number[]): 1 | 2 | 3 | 4 | null {
  if (
    features.length !== paceModel.features.length ||
    !features.every(Number.isFinite)
  )
    return null;
  const scores = [...paceModel.baseline];
  for (const stage of paceModel.trees) {
    stage.forEach((tree, cls) => {
      let node = tree[0];
      while (!node[5])
        node = tree[features[node[1]] <= node[2] ? node[3] : node[4]];
      scores[cls] += node[0];
    });
  }
  return paceModel.classes[scores.indexOf(Math.max(...scores))] as
    | 1
    | 2
    | 3
    | 4;
}
