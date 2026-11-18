import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("Scenarios uses one live analyst source without an EOD duplicate or analyst-derived fallback headline", () => {
  const s = fs.readFileSync("components/ValueStudio.tsx", "utf8");
  assert.match(s, /<SentiSenseConsensus[\s\S]*symbol=\{r.company.symbol\}/);
  assert.doesNotMatch(s, /consensusOutlook/);
  assert.match(
    s,
    /fallback=\{<AnalystTargets research=\{r\} showUnavailable \/>\}/,
  );
  assert.match(s, /range\?\.source === "history"/);
  assert.match(s, /<SelectedValuation/);
  assert.match(s, /<ScenarioLenses research=\{r\} hideSingle excludeAnalyst/);
  const panel = fs.readFileSync("components/SentiSenseConsensus.tsx", "utf8");
  for (const field of [
    "data.targetLow",
    "data.targetMean",
    "data.targetHigh",
    "data.numberOfAnalysts",
    "result.asOf",
    "data.currency",
  ])
    assert.ok(panel.includes(field));
  assert.match(panel, /matching another service is not established/i);
});
