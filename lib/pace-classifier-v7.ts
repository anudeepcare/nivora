import model from "./pace-model-v7.json" with { type: "json" };
import type { CycleSignal } from "./accumulation-policy-v5.ts";
type Node = [number, number, number, number, number[]];
const trees = model.trees as Node[][];
/** Frozen forest; float32 inputs preserve the evaluated sklearn thresholds. */
export function classifyPaceV7(input: number[]): number | null {
  if (input.length !== 42 || !input.every(Number.isFinite)) return null;
  const scores = model.classes.map(() => 0);
  for (const tree of trees) {
    let node = tree[0];
    while (node[2] !== -1)
      node = tree[Math.fround(input[node[0]]) <= node[1] ? node[2] : node[3]];
    const total = node[4].reduce((a, b) => a + b, 0);
    node[4].forEach((v, i) => (scores[i] += v / total));
  }
  return model.classes[scores.indexOf(Math.max(...scores))];
}
export function paceV7Signal(
  label: number,
): Pick<CycleSignal, "multiplier" | "trimTier" | "trimReview"> {
  if (!Number.isInteger(label) || label < 1 || label > 6)
    throw Error("Invalid Pace class");
  return {
    multiplier: (label > 4 ? 0 : label) as CycleSignal["multiplier"],
    trimTier: label === 6 ? "strong" : label === 5 ? "light" : null,
    trimReview: label > 4,
  };
}
