import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("Pace model metadata has separate layout and rationale identifies confirmed versus forming", () => {
  const s = fs.readFileSync("components/AccumulationDesk.tsx", "utf8");
  assert.match(s, /className=\{styles.paceMeta\}/);
  assert.match(s, /Last confirmed reading · rationale/);
  assert.match(s, /Current forming reading · rationale/);
  assert.match(
    fs.readFileSync("components/ResearchLens.module.css", "utf8"),
    /\.paceMeta[\s\S]*gap: 8px 12px/,
  );
});
test("Pace history uses singular month and stay for one without changing evidence calculation", () => {
  const s = fs.readFileSync("components/PaceHistoryInsights.tsx", "utf8");
  assert.match(s, /zone.months === 1 \? "month" : "months"/);
  assert.match(s, /zone.completedVisits === 1 \? "stay" : "stays"/);
  assert.match(s, /zone.medianDuration === 1 \? "month" : "months"/);
});

test("model blockers do not direct users to removed assumptions and distinguish quote from chart", () => {
  const outlook = fs.readFileSync("lib/outlook.ts", "utf8");
  assert.doesNotMatch(outlook, /Set an explicit P\/E assumption/);
  assert.match(outlook, /this model range is withheld/);
  const brief = fs.readFileSync("lib/research-brief.ts", "utf8");
  assert.match(brief, /label: "Recent quote"/);
  assert.match(
    brief,
    /Historical chart observations do not establish a current entry price/,
  );
});
