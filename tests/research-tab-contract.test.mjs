import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (n) => fs.readFileSync(`components/${n}.tsx`, "utf8");
test("Research view-level navigation adopts flat underline contract without changing state semantics", () => {
  for (const n of [
    "Research",
    "ResearchWorkspace",
    "TargetsEstimates",
    "AdvancedResearch",
    "DecisionInsights",
    "OptionsDesk",
  ])
    assert.match(read(n), /auryn-view-tabs/, n);
  assert.match(
    read("ResearchWorkspace"),
    /aria-pressed=\{selected === index\}/,
  );
  assert.match(
    read("TargetsEstimates"),
    /tabIndex=\{active === index \? 0 : -1\}/,
  );
  assert.match(read("TargetsEstimates"), /ArrowRight/);
  assert.match(
    read("OptionsDesk"),
    /disabled=\{!contracts.length && id !== "learn"\}/,
  );
});
test("Research dataset choices use quiet detail pills; action-only and ticker lists are not tabs", () => {
  for (const n of [
    "SentiSensePanels",
    "SentiSenseCoverage",
    "PublicationFeeds",
  ])
    assert.match(read(n), /auryn-detail-tabs/, n);
  assert.match(read("SentiSensePanels"), /aria-pressed=\{dataset === id\}/);
  assert.match(read("PublicationFeeds"), /auryn-view-tabs/);
  assert.doesNotMatch(read("SentiSenseStories"), /auryn-(view|detail)-tabs/);
  assert.match(
    read("SentiSenseCoverage"),
    /className=\{s.tabs\}\s*style=\{\{ flexWrap/,
  );
});
test("reachable Research drill-ins share quiet detail and flat view controls, never exposure cells", () => {
  for (const n of [
    "StockInsights",
    "NamedAnalystProfiles",
    "GrowCompany",
    "EtfAggregateEvidence",
  ])
    assert.match(read(n), /auryn-detail-tabs/, n);
  const exposure = read("ExposureBoard");
  assert.match(exposure, /className=\{`\$\{s.tabs\} auryn-view-tabs`\}/);
  assert.match(
    exposure,
    /className=\{`\$\{s.presentation\} auryn-detail-tabs`\}/,
  );
  assert.equal((exposure.match(/auryn-detail-tabs/g) || []).length, 1);
  assert.match(read("SentiSensePanels"), /<StockInsights/);
  assert.match(read("SentiSensePanels"), /<NamedAnalystProfiles/);
  assert.match(read("CompanyEvents"), /<GrowCompanyEvents/);
  assert.match(read("SentiSenseConsensus"), /<EtfAggregateEvidence/);
  assert.match(read("OptionsDesk"), /<MarketWorkspace/);
  assert.match(read("MarketWorkspace"), /<ExposureBoard/);
});
