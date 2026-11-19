import fs from "node:fs";
import assert from "node:assert/strict";
const input = process.argv[2];
const base = fs.existsSync(input + "/candidate-model.json")
  ? input
  : input + "/analysis";
const model = JSON.parse(fs.readFileSync(base + "/candidate-model.json"));
const features = JSON.parse(fs.readFileSync(base + "/features.json")).filter(
  (r) => r.features,
);
const expected = new Map(
  JSON.parse(fs.readFileSync(base + "/candidate-study.json")).rows.map((r) => [
    r.symbol,
    r,
  ]),
);
function classify(input) {
  const scores = model.classes.map(() => 0);
  for (const tree of model.trees) {
    let node = tree[0];
    while (node[2] !== -1)
      node = tree[Math.fround(input[node[0]]) <= node[1] ? node[2] : node[3]];
    const total = node[4].reduce((a, b) => a + b, 0);
    node[4].forEach((v, i) => (scores[i] += v / total));
  }
  return model.classes[scores.indexOf(Math.max(...scores))];
}
let heldOut = 0,
  matches = 0;
for (const r of features) {
  const actual = classify(r.features),
    e = expected.get(r.symbol);
  assert.equal(actual, e.candidate, `${r.symbol}: exported-model inference`);
  if (e.split === "heldOutFromFit") {
    heldOut++;
    matches += actual === e.reference ? 1 : 0;
  }
}
console.log(
  JSON.stringify({
    exportParityChecks: features.length,
    heldOut,
    matches,
    agreement: matches / heldOut,
    productionChanged: false,
  }),
);
