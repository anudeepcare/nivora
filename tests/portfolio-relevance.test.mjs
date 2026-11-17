import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (n) => readFileSync(new URL("../" + n, import.meta.url), "utf8");
test("compact review surfaces evidence, date and trigger before disclosure, not a truncated slogan", () => {
  const s = read("components/DecisionAttention.tsx");
  assert.doesNotMatch(s, /item.reason.split/);
  const leading = s.slice(s.indexOf("<article"), s.indexOf("<details>"));
  for (const term of [
    "item.evidence",
    "item.businessPeriod",
    "item.changeCondition",
    "item.weight",
  ])
    assert.ok(leading.includes(term), term);
  assert.match(s, /Dated business metrics not supplied/);
  assert.match(s, /Price reference date not supplied/);
});
test("workspace signal reuses existing decision evidence without a second policy", () => {
  assert.match(read("lib/edge-research.ts"), /evidence: edge.decision.reasons/);
});
test("allocation puts a smaller donut beside its unchanged holdings legend", () => {
  const s = read("components/PortfolioPage.tsx"),
    css = read("components/PortfolioReference.module.css");
  assert.match(s, /className=\{reference.allocationBody\}/);
  assert.match(s, /className=\{reference.allocationLegend\}/);
  assert.match(css, /width: min\(100%, 200px\)/);
  assert.match(s, /model.allocations.slice\(0, 6\)/);
  assert.match(s, /model.allocations.slice\(6\)/);
});
